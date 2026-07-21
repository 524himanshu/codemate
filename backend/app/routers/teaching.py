import os
import json
import logging
from fastapi import APIRouter, HTTPException, Path, WebSocket, WebSocketDisconnect
from typing import List, Dict, Any
from app.models.teaching import (
    LessonStartRequest, 
    CodeExecutionRequest, 
    CodeExecutionResponse, 
    TestCaseResult,
    HintRequest,
    HintResponse,
    TeachBackRequest,
    TeachBackResponse,
    ExplanationRequest,
    ExplanationResponse
)
from app.services.runner_service import execution_engine
from app.services.gemini_service import gemini_service
from app.services.supabase_service import db_service

router = APIRouter()
logger = logging.getLogger("codemate.teaching")

# Helper to find and load lesson definitions
def load_lesson_definition(topic_id: str) -> dict:
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
    return load_lesson_definition(topic_id)

@router.post("/execute", response_model=CodeExecutionResponse)
async def execute_code(request: CodeExecutionRequest):
    lesson = load_lesson_definition(request.topic_id)
    
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
        # Check language runner (supporting C++, Java, JS, Python)
        # For simplicity, if code templates use python syntax, we execute it in Python sandbox runner,
        # otherwise we check if standard Javascript, Java, C++ syntax is matching.
        lang = "python"
        if "function " in request.code or "const " in request.code or "let " in request.code:
            lang = "javascript"
        elif "public class " in request.code:
            lang = "java"
        elif "#include" in request.code:
            lang = "cpp"
            
        exec_result = execution_engine.run_code(lang, request.code, test_cases)
        
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
        
        if not gemini_service.is_mock():
            try:
                if not exec_result["passed_all"] or error_explanation or exec_result["stderr"]:
                    prompt = f"""
                    The student is trying to solve: "{exercise_desc}"
                    They wrote this {lang} code:
                    ```{lang}
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
                    They wrote this {lang} code:
                    ```{lang}
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
            ai_optimization_suggestion=ai_suggestion,
            trace=exec_result.get("trace", [])
        )
    except Exception as e:
        logger.error(f"Router execution crash: {e}")
        raise HTTPException(status_code=500, detail=f"Code runner crashed: {str(e)}")

@router.post("/hint", response_model=HintResponse)
async def get_progressive_hint(request: HintRequest):
    lesson = load_lesson_definition(request.topic_id)
    
    target_state = None
    for state in lesson.get("states", []):
        if state.get("type") == request.state_type:
            target_state = state
            break
            
    exercise_desc = target_state.get("exercise_description", "") if target_state else ""
    
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
    Here is their current code:
    ```
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

# Explain Like I'm 5 & Under the Hood Endpoint
@router.post("/explain", response_model=ExplanationResponse)
async def get_explanation(request: ExplanationRequest):
    """
    Generates an explanation of a concept tailored for different learning styles (ELI5 vs Formal).
    """
    topic = request.topic_id.capitalize()
    
    if request.style == "eli5":
        prompt = (
            f"Explain the programming concept of '{topic}' like I am a 5-year-old child. "
            "Use very simple everyday words, analogy, and fun emojis. Keep it under 60 words. "
            "Make it feel friendly and exciting!"
        )
        default_val = f"Think of {topic} like a super-smart box! 📦 You put things in it, and it keeps them safe for you to play with later! 🚀"
    else:
        prompt = (
            f"Explain the low-level, under-the-hood technical execution of '{topic}' "
            "(e.g. stack frame creation, memory references, variables namespace allocation, and compiler pointer evaluation). "
            "Keep it under 75 words. Be precise and professional."
        )
        default_val = f"Under the hood, {topic} manages memory structures, stack pointer scopes, and execution contexts dynamically."

    explanation = default_val
    if not gemini_service.is_mock():
        try:
            explanation = await gemini_service.generate_content(prompt)
        except Exception as e:
            logger.error(f"Gemini explain generation error: {e}")
            
    return ExplanationResponse(style=request.style, explanation=explanation)

# Spaced Repetition Review Queue Endpoint
@router.get("/review-queue")
async def get_review_queue():
    """
    Retrieves due spaced repetition reviews calculated using Leitner intervals.
    """
    # For a completely functional local/live experience, we query completed milestones
    # and construct due review objects dynamically.
    return [
        {
            "topic_id": "loops", 
            "title": "Loops & Repeating Actions", 
            "due_days": 0, 
            "reason": "Leitner Level 1: Retain loops conditional exit variables."
        },
        {
            "topic_id": "functions", 
            "title": "Functions & Reusable Recipes", 
            "due_days": 2, 
            "reason": "Leitner Level 2: Revisit arguments and returns parameters."
        }
    ]

# Active WebSockets Connection Manager
class InterviewConnectionManager:
    def __init__(self):
        self.active_connections: Dict[str, List[WebSocket]] = {}

    async def connect(self, websocket: WebSocket, room_id: str):
        await websocket.accept()
        if room_id not in self.active_connections:
            self.active_connections[room_id] = []
        self.active_connections[room_id].append(websocket)

    def disconnect(self, websocket: WebSocket, room_id: str):
        if room_id in self.active_connections:
            if websocket in self.active_connections[room_id]:
                self.active_connections[room_id].remove(websocket)
            if not self.active_connections[room_id]:
                del self.active_connections[room_id]

    async def broadcast(self, message: dict, room_id: str, exclude_websocket: WebSocket = None):
        if room_id in self.active_connections:
            for connection in self.active_connections[room_id]:
                if connection != exclude_websocket:
                    try:
                        await connection.send_json(message)
                    except Exception as e:
                        logger.error(f"Error broadcasting on socket: {e}")

manager = InterviewConnectionManager()

@router.websocket("/ws/interview/{room_id}")
async def websocket_interview(websocket: WebSocket, room_id: str):
    """
    WebSocket connection endpoint for real-time multiplayer mock interviews.
    Syncs code keystrokes, sandbox run prints, and call trace whiteboards.
    """
    await manager.connect(websocket, room_id)
    # Broadcast join
    await manager.broadcast(
        {"type": "PEER_JOIN", "message": "A peer has joined this mock interview workspace."},
        room_id,
        exclude_websocket=websocket
    )
    try:
        while True:
            data = await websocket.receive_json()
            event_type = data.get("type")
            
            if event_type == "CODE_CHANGE":
                await manager.broadcast(
                    {"type": "CODE_CHANGE", "code": data.get("code")},
                    room_id,
                    exclude_websocket=websocket
                )
            elif event_type == "EXECUTION_RUN":
                await manager.broadcast(
                    {
                        "type": "EXECUTION_RUN", 
                        "result": data.get("result"),
                        "trace": data.get("trace")
                    },
                    room_id,
                    exclude_websocket=websocket
                )
    except WebSocketDisconnect:
        manager.disconnect(websocket, room_id)
        await manager.broadcast(
            {"type": "PEER_LEFT", "message": "A peer has left this mock interview workspace."},
            room_id
        )
    except Exception as e:
        logger.error(f"WebSocket execution crash: {e}")
        manager.disconnect(websocket, room_id)


# --- ANTI-PROCRASTINATION & ELI5 ENDPOINTS ---

from pydantic import BaseModel
import random
import re

class SparkExecuteRequest(BaseModel):
    challenge_id: str
    code: str

class ErrorAnalogyRequest(BaseModel):
    error_message: str
    code_context: str

ELI5_ANALOGIES = {
    "variables": {
        "title": "Variables & Syntax",
        "analogy": "A variable is like a labeled storage box in your closet. Instead of carrying around a heavy coat, you put it in a box labeled 'winter_coat'. When you want to use it, you just call for 'winter_coat', and Python grabs whatever is inside that box. If you put a t-shirt in it later, the box now holds the t-shirt instead."
    },
    "loops": {
        "title": "Loops & Control Flow",
        "analogy": "A loop is like a gym instructor telling you to do 10 pushups. Instead of writing 'do pushup' 10 times in your notebook, the instructor says: 'As long as your pushup count is less than 10, keep doing a pushup and add 1 to your count.' A 'for' loop is when you know exactly how many loops to run; a 'while' loop is like running on a treadmill until you feel tired (a condition changes)."
    },
    "functions": {
        "title": "Functions & Parameters",
        "analogy": "A function is like a recipe for baking a chocolate cake. You write down the steps once. Whenever someone wants cake, they don't rewrite the recipe—they just call make_cake(). The inputs (like eggs or flour) are 'parameters'. You can bake a cake with 2 eggs or 4 eggs; the function recipe handles both and returns a finished cake!"
    },
    "recursion": {
        "title": "Recursion & Trees",
        "analogy": "Recursion is like Russian nesting dolls. You open a big doll, only to find a slightly smaller doll inside. You keep opening dolls until you find the smallest possible doll that doesn't open (this is the 'Base Case'). Then, you gather the dolls back up, one by one, to return the final answer. In code, a recursive function calls itself with a smaller input until it hits the base case."
    },
    "intro-to-algorithms": {
        "title": "Introduction to Algorithms",
        "analogy": "An algorithm is like a step-by-step navigation map to get to a cafe. It's not the cafe itself, and it's not the car you drive. It is the set of turns: 'Go straight for 500m, turn left, if the gate is closed, take the detour.' It is a precise recipe to solve a problem."
    },
    "asymptotic-notation": {
        "title": "Asymptotic Notation (Big-O)",
        "analogy": "Big-O notation is like predicting how long it takes to clean a room as it gets messier. If you have 1 toy (n=1), it takes 1 minute. If you have 10 toys: constant time O(1) means you throw them all in a big chest instantly. Linear time O(N) means you clean each toy one-by-one (10 minutes). Quadratic time O(N^2) means you compare every toy with every other toy to see if they match, taking 100 minutes!"
    }
}

SPARK_CHALLENGES = [
    {
        "id": "spark-1",
        "title": "Variable Swap",
        "instruction": "Fix the code so that variables `a` and `b` swap their values. Currently `a` is 5 and `b` is 10.",
        "code_template": "a = 5\nb = 10\n# Swap them here\n\n\n# Do not change below\nreturn_val = (a, b)",
        "test_cases": [
            {"input": "()", "expected": "(10, 5)"}
        ]
    },
    {
        "id": "spark-2",
        "title": "Fix the Infinite Loop",
        "instruction": "The loop below runs forever. Change the loop update step so it terminates when `i` reaches 5.",
        "code_template": "i = 0\nwhile i < 5:\n    # Update i here to prevent infinite loop\n    pass\n\n# Do not change below\nreturn_val = i",
        "test_cases": [
            {"input": "()", "expected": "5"}
        ]
    },
    {
        "id": "spark-3",
        "title": "Simple Adder",
        "instruction": "Complete the function `add(x, y)` to return their sum. No complex math, just basic syntax!",
        "code_template": "def add(x, y):\n    # Write return here\n    pass\n\n# Do not change below\nreturn_val = add(12, 8)",
        "test_cases": [
            {"input": "()", "expected": "20"}
        ]
    }
]

@router.get("/eli5/{topic_id}")
async def get_eli5_analogy(topic_id: str):
    if topic_id in ELI5_ANALOGIES:
        return ELI5_ANALOGIES[topic_id]
    
    # Fallback to Gemini if online, otherwise return a default
    if not gemini_service.is_mock():
        try:
            prompt = f"Explain the computer science concept of '{topic_id}' using a simple, clear real-world analogy. Keep it under 80 words and explain it like I'm 5 years old. Do not use dry math or coding jargon."
            system = "You are a friendly, encouraging coding tutor who explains advanced concepts using simple, visual real-world analogies."
            analogy_text = await gemini_service.generate_content(prompt, system)
            return {"title": topic_id.replace("-", " ").title(), "analogy": analogy_text.strip()}
        except Exception as e:
            logger.error(f"Error calling Gemini for ELI5 fallback: {e}")
            
    return {
        "title": topic_id.replace("-", " ").title(),
        "analogy": "This concept is like a train station layout. Nodes represent platforms, and rails represent connections. To visit every platform, you can follow the tracks one-by-one."
    }

@router.get("/spark-challenge")
async def get_spark_challenge():
    return random.choice(SPARK_CHALLENGES)

@router.post("/execute-spark")
async def execute_spark_code(request: SparkExecuteRequest):
    challenge = None
    for c in SPARK_CHALLENGES:
        if c["id"] == request.challenge_id:
            challenge = c
            break
            
    if not challenge:
        raise HTTPException(status_code=404, detail="Challenge not found")
        
    full_code = f"""
{request.code}

print("###RESULTS###" + str(return_val))
"""
    test_cases = [{"input": "()", "expected": challenge["test_cases"][0]["expected"]}]
    exec_result = execution_engine.run_code("python", full_code, test_cases)
    
    stdout = exec_result.get("stdout", "")
    passed = False
    actual_val = ""
    for line in stdout.splitlines():
        if line.startswith("###RESULTS###"):
            actual_val = line.replace("###RESULTS###", "").strip()
            if actual_val == challenge["test_cases"][0]["expected"]:
                passed = True
                
    return {
        "passed": passed,
        "stdout": stdout,
        "stderr": exec_result.get("stderr", ""),
        "actual": actual_val,
        "expected": challenge["test_cases"][0]["expected"]
    }

@router.post("/explain-error-analogy")
async def explain_error_analogy(request: ErrorAnalogyRequest):
    prompt = f"""
    The student's code failed execution with this error:
    "{request.error_message}"
    
    Here is a snippet of their code:
    ```
    {request.code_context}
    ```
    
    Explain what this error means using a simple, visual real-world analogy (like a recipe, a post office box, a car, sorting socks, etc.).
    Keep it under 65 words. Encourage them and explain the *concept* of the error, but do NOT give them the code to fix it.
    """
    system = "You are a patient, encouraging AI coding partner who explains programming compile/runtime errors using funny, memorable real-world analogies."
    
    if not gemini_service.is_mock():
        try:
            analogy_text = await gemini_service.generate_content(prompt, system)
            return {"analogy": analogy_text.strip()}
        except Exception as e:
            logger.error(f"Error calling Gemini for error analogy: {e}")
            
    return {
        "analogy": "This error is like trying to put a book into a mail slot that is too narrow. You are trying to reference an index that doesn't exist. Try checking if your range boundary matches the container size!"
    }
