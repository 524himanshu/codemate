from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
import uuid
import logging
import json
from app.services.gemini_service import gemini_service

router = APIRouter()
logger = logging.getLogger("codemate.interview")

# Session Store
interview_sessions: Dict[str, Dict[str, Any]] = {}

class StartInterviewRequest(BaseModel):
    user_id: str
    role: str
    difficulty: str

class StartInterviewResponse(BaseModel):
    session_id: str
    initial_message: str
    problem_title: str
    problem_description: str
    code_template: str

class ChatMessageRequest(BaseModel):
    session_id: str
    message: str
    code: str

class ChatMessageResponse(BaseModel):
    response: str

class EvaluateInterviewRequest(BaseModel):
    session_id: str
    code: str

class EvaluationRubric(BaseModel):
    score: int
    clarification: str
    brute_force: str
    optimization: str
    complexity: str
    code_quality: str
    edge_cases: str

class EvaluateInterviewResponse(BaseModel):
    overall_score: int
    rubrics: EvaluationRubric
    summary: str

# Mock coding challenges
CHALLENGES = {
    "frontend": {
        "title": "Deep Clone Object",
        "description": "Write a function `deepClone(obj)` in JavaScript that returns a deep copy of a nested object. It should handle circular references, arrays, nested keys, and primitive values.",
        "template": "function deepClone(obj, map = new WeakMap()) {\n    // Implement deep clone here\n    return obj;\n}"
    },
    "backend": {
        "title": "Token Bucket Rate Limiter",
        "description": "Implement a `RateLimiter` class in Python using the Token Bucket algorithm. It should support `allow_request(client_id)` which returns `True` if a client is within their rate limit, or `False` if they are rate-limited. Configure bucket capacity and refill rate in seconds.",
        "template": "import time\n\nclass RateLimiter:\n    def __init__(self, capacity: int, refill_rate: float):\n        self.capacity = capacity\n        self.refill_rate = refill_rate\n        self.buckets = {}\n\n    def allow_request(self, client_id: str) -> bool:\n        # Write logic here\n        return True"
    },
    "fullstack": {
        "title": "LRU Cache",
        "description": "Design a data structure that follows the constraints of a Least Recently Used (LRU) Cache. Implement the `LRUCache` class with `get(key)` and `put(key, value)` operating in O(1) time complexity.",
        "template": "class LRUCache:\n    def __init__(self, capacity: int):\n        self.capacity = capacity\n        self.cache = {}\n\n    def get(self, key: int) -> int:\n        # Write logic here\n        return -1\n\n    def put(self, key: int, value: int) -> None:\n        # Write logic here\n        pass"
    }
}

@router.post("/start", response_model=StartInterviewResponse)
async def start_interview(request: StartInterviewRequest):
    session_id = str(uuid.uuid4())
    role_key = request.role.lower() if request.role.lower() in CHALLENGES else "backend"
    challenge = CHALLENGES[role_key]

    initial_message = (
        f"Hi there! Welcome to your technical assessment for the {request.role} role ({request.difficulty} level). "
        f"Today we'll be solving: **{challenge['title']}**. Please read the problem description on the right. "
        "Before you start writing code, explain your thought process or clarify any assumptions you'd like to make. Let's begin!"
    )

    # Store session state
    interview_sessions[session_id] = {
        "user_id": request.user_id,
        "role": request.role,
        "difficulty": request.difficulty,
        "challenge": challenge,
        "chat_history": [{"role": "interviewer", "content": initial_message}]
    }

    return StartInterviewResponse(
        session_id=session_id,
        initial_message=initial_message,
        problem_title=challenge["title"],
        problem_description=challenge["description"],
        code_template=challenge["template"]
    )

@router.post("/chat", response_model=ChatMessageResponse)
async def chat_message(request: ChatMessageRequest):
    session = interview_sessions.get(request.session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Interview session not found.")

    session["chat_history"].append({"role": "candidate", "content": request.message})

    # Fallback response
    ai_response = (
        "That's a reasonable start. How would you handle duplicate checks or optimization limits? "
        "Take a look at your code template on the right and let me know when you run your first test case."
    )

    if not gemini_service.is_mock():
        try:
            # Build conversation history context
            history_str = "\n".join([f"{msg['role'].capitalize()}: {msg['content']}" for msg in session["chat_history"]])
            prompt = f"""
            You are a senior technical interviewer conducting a mock coding interview for a {session['role']} role.
            The candidate is trying to solve: {session['challenge']['title']}
            Problem Description: {session['challenge']['description']}

            Here is their current code editor content:
            ```
            {request.code}
            ```

            Conversation History:
            {history_str}

            Provide your next response as the interviewer. 
            Guidance:
            - If they ask clarifying questions, answer them helper-style (be direct but encourage them to think).
            - If they present a brute force approach, encourage them to optimize it (time/space complexity).
            - Keep your response under 80 words. Be encouraging but rigorous.
            """
            ai_response = await gemini_service.generate_content(prompt)
        except Exception as e:
            logger.error(f"Gemini interview chat error: {e}")

    session["chat_history"].append({"role": "interviewer", "content": ai_response})
    return ChatMessageResponse(response=ai_response)

@router.post("/evaluate", response_model=EvaluateInterviewResponse)
async def evaluate_interview(request: EvaluateInterviewRequest):
    session = interview_sessions.get(request.session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Interview session not found.")

    default_evaluation = EvaluateInterviewResponse(
        overall_score=78,
        rubrics=EvaluationRubric(
            score=78,
            clarification="Excellent clarification of initial input constraints and edge questions.",
            brute_force="Briefly mentioned checking values iteratively but jumped to optimization quickly.",
            optimization="Correctly structured the lookup hashing to bypass nested time loops.",
            complexity="Accurately stated O(N) time and O(N) auxiliary space constraints.",
            code_quality="Good clean naming conventions, though could benefit from inline docstrings.",
            edge_cases="Handled empty parameters correctly, but boundary checks could be tighter."
        ),
        summary="You demonstrated good technical knowledge and algorithmic instincts. Solid performance!"
    )

    if not gemini_service.is_mock():
        try:
            history_str = "\n".join([f"{msg['role'].capitalize()}: {msg['content']}" for msg in session["chat_history"]])
            prompt = f"""
            You are an expert technical interviewer. Grade the candidate's coding interview performance.
            Challenge: {session['challenge']['title']}
            Final Code:
            ```
            {request.code}
            ```
            
            Conversation History:
            {history_str}

            Grade them on these six rubrics:
            1. Clarification (did they ask questions or state assumptions?)
            2. Brute Force (did they discuss initial simple approaches?)
            3. Optimization (did they reach optimal time/space bounds?)
            4. Complexity (did they accurately analyze Big O complexity?)
            5. Code Quality (is the code clean, readable, well-named?)
            6. Edge Cases (did they verify empty inputs, overflow limits, etc.?)

            Output a JSON response matching the schema containing:
            - 'overall_score' (integer 0-100)
            - 'rubrics' (nested object with fields 'score', 'clarification', 'brute_force', 'optimization', 'complexity', 'code_quality', 'edge_cases')
            - 'summary' (overall feedback critique under 60 words)
            """

            class GradeSchema(BaseModel):
                overall_score: int
                rubrics: EvaluationRubric
                summary: str

            response_text = await gemini_service.generate_structured_json(
                prompt=prompt,
                response_schema=GradeSchema,
                system_instruction="You are a principal engineer assessing candidate mock interview submissions."
            )
            data = json.loads(response_text)
            return EvaluateInterviewResponse(
                overall_score=data["overall_score"],
                rubrics=EvaluationRubric(**data["rubrics"]),
                summary=data["summary"]
            )
        except Exception as e:
            logger.error(f"Gemini evaluation error: {e}")

    return default_evaluation
