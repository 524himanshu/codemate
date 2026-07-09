import os
import json
import logging
from fastapi import APIRouter, HTTPException, Path
from app.models.teaching import (
    LessonStartRequest, 
    CodeExecutionRequest, 
    CodeExecutionResponse, 
    TestCaseResult,
    HintRequest,
    HintResponse,
    TeachBackRequest,
    TeachBackResponse
)
from app.services.runner_service import execution_engine
from app.services.gemini_service import gemini_service
from app.services.supabase_service import db_service

router = APIRouter()
logger = logging.getLogger("codemate.teaching")

# Helper to find and load lesson definitions
def load_lesson_definition(topic_id: str) -> dict:
    # Look for python-{topic_id}.json in app/content
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    file_path = os.path.join(base_dir, "content", f"python-{topic_id}.json")
    
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail=f"Lesson definition for topic '{topic_id}' not found.")
        
    try:
        with open(file_path, "r") as f:
            return json.load(f)
    except Exception as e:
        logger.error(f"Error reading lesson definition file: {e}")
        raise HTTPException(status_code=500, detail="Failed to load lesson definition.")

@router.get("/lesson/{topic_id}")
async def get_lesson(topic_id: str = Path(..., description="The topic ID, e.g., 'functions', 'loops'")):
    """
    Retrieves the declarative lesson definition structure.
    """
    return load_lesson_definition(topic_id)

@router.post("/execute", response_model=CodeExecutionResponse)
async def execute_code(request: CodeExecutionRequest):
    """
    Runs user code against lesson test cases and evaluates runtime correctness and stack traces.
    """
    lesson = load_lesson_definition(request.topic_id)
    
    # Extract test cases for the target state type (build or challenge)
    target_state = None
    for state in lesson.get("states", []):
        if state.get("type") == request.state_type:
            target_state = state
            break
            
    if not target_state:
        raise HTTPException(status_code=400, detail=f"State type '{request.state_type}' not found in this lesson.")
        
    test_cases = target_state.get("test_cases", [])
    exercise_desc = target_state.get("exercise_description", "")
    
    try:
        # Run code against test cases
        exec_result = execution_engine.run_code("python", request.code, test_cases)
        
        # Build test case results
        tc_results = []
        for tr in exec_result.get("test_results", []):
            tc_results.append(TestCaseResult(
                input=tr["input"],
                expected=str(tr["expected"]),
                actual=str(tr["actual"]),
                passed=tr["passed"]
            ))
            
        error_explanation = exec_result.get("error_explanation")
        ai_suggestion = None
        
        # If code failed with stdout/stderr compiler errors or didn't pass all tests,
        # let Gemini explain the error.
        # If it succeeded, ask Gemini to offer an optimization tip or design comment.
        if not gemini_service.is_mock():
            try:
                if not exec_result["passed_all"] or error_explanation or exec_result["stderr"]:
                    prompt = f"""
                    The student is trying to solve: "{exercise_desc}"
                    They wrote this Python code:
                    ```python
                    {request.code}
                    ```
                    Execution failed. 
                    Stderr: {exec_result['stderr']}
                    Error Explanation: {error_explanation}
                    Test Case Statuses: {exec_result.get('test_results')}

                    Explain what went wrong in plain, encouraging words (under 70 words). Suggest how they can fix it without giving them the final solution code.
                    """
                    error_explanation = await gemini_service.generate_content(prompt)
                else:
                    prompt = f"""
                    The student successfully solved: "{exercise_desc}"
                    They wrote this Python code:
                    ```python
                    {request.code}
                    ```
                    Execution succeeded and passed all test cases!
                    Runtime: {exec_result['runtime_ms']}ms.

                    Offer a quick, professional tip (under 60 words) on how this code could be optimized (e.g. style, space complexity, cleaner syntax, built-ins).
                    """
                    ai_suggestion = await gemini_service.generate_content(prompt)
            except Exception as e:
                logger.error(f"Gemini error during execution review: {e}")
                
        return CodeExecutionResponse(
            stdout=exec_result.get("stdout", ""),
            stderr=exec_result.get("stderr", ""),
            passed_all=exec_result["passed_all"],
            test_results=tc_results,
            runtime_ms=exec_result.get("runtime_ms", 0.0),
            memory_mb=exec_result.get("memory_mb", 12.4),
            error_explanation=error_explanation,
            ai_optimization_suggestion=ai_suggestion
        )
    except Exception as e:
        logger.error(f"Router execution crash: {e}")
        raise HTTPException(status_code=500, detail=f"Code runner crashed: {str(e)}")

@router.post("/hint", response_model=HintResponse)
async def get_progressive_hint(request: HintRequest):
    """
    Generates progressive hints (Syntax -> Logic -> Interview -> Solution) based on code state and attempt counters.
    """
    lesson = load_lesson_definition(request.topic_id)
    
    target_state = None
    for state in lesson.get("states", []):
        if state.get("type") == request.state_type:
            target_state = state
            break
            
    exercise_desc = target_state.get("exercise_description", "") if target_state else ""
    
    # Map attempt count to progressive disclosure
    hint_types = {
        1: ("syntax", "Check the variable names and indentations."),
        2: ("logic", "Think about the condition. Do you need a loops checker?"),
        3: ("interview", "Watch out for edge cases (e.g. negative numbers or zero)."),
        4: ("solution", "Double check the code template.")
    }
    
    h_type, default_msg = hint_types.get(request.attempt_count, ("solution", "Try resetting the code template and restarting."))
    
    if gemini_service.is_mock():
        return HintResponse(hint_type=h_type, message=default_msg)
        
    prompt = f"""
    The student is working on the exercise: "{exercise_desc}"
    Here is their current Python code:
    ```python
    {request.code}
    ```
    They have requested a hint. This is request attempt #{request.attempt_count}.
    Provide a progressive hint of category '{h_type}'.
    
    Guidance:
    - Attempt 1 (syntax): Point out any obvious syntax mistakes or basic functions grammar.
    - Attempt 2 (logic): Describe the algorithm logic structure or helper conditions needed.
    - Attempt 3 (interview): Warn them about boundary inputs, types, or edge conditions.
    - Attempt 4 (solution): Provide a line of helper outline or pseudo-code showing how the main return is structured.
    
    Keep your hint under 50 words. Do not write the full correct solution code.
    """
    
    try:
        hint_msg = await gemini_service.generate_content(prompt)
        return HintResponse(hint_type=h_type, message=hint_msg)
    except Exception as e:
        logger.error(f"Gemini hint call error: {e}")
        return HintResponse(hint_type=h_type, message=default_msg)

@router.post("/teachback", response_model=TeachBackResponse)
async def evaluate_teachback(request: TeachBackRequest):
    """
    Grades the user's plain-English explanation (Teach Back) of the concept using Gemini.
    """
    lesson = load_lesson_definition(request.topic_id)
    lesson_title = lesson.get("lesson", {}).get("title", "this concept")
    
    default_response = TeachBackResponse(
        score=7,
        feedback="Good description. Review the core variables and loops definitions to solidify your understanding."
    )
    
    if gemini_service.is_mock():
        return default_response
        
    prompt = f"""
    The student just finished a lesson on '{lesson_title}'.
    They were asked to explain the concept in plain English like they are teaching a junior developer.
    
    Here is their explanation:
    "{request.explanation}"
    
    Evaluate their explanation:
    1. Score it out of 10 (1-10 integer).
    2. Provide constructive, brief feedback (under 75 words) highlighting what they explained well and any crucial technical details they missed.
    
    You must output JSON matching the schema with fields 'score' and 'feedback'.
    """
    
    # Define grading schema for structured output
    from pydantic import BaseModel
    class GradingSchema(BaseModel):
        score: int
        feedback: str
        
    try:
        response_text = await gemini_service.generate_structured_json(
            prompt=prompt,
            response_schema=GradingSchema,
            system_instruction="You are an expert technical interviewer assessing a junior developer's conceptual grasp."
        )
        data = json.loads(response_text)
        return TeachBackResponse(score=data["score"], feedback=data["feedback"])
    except Exception as e:
        logger.error(f"Gemini teachback grading error: {e}")
        return default_response
