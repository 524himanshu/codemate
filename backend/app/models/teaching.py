from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any

class LessonStartRequest(BaseModel):
    user_id: str
    topic_id: str

class CodeExecutionRequest(BaseModel):
    user_id: str
    topic_id: str
    state_type: str  # "build" or "challenge"
    code: str

class TestCaseResult(BaseModel):
    input: str
    expected: str
    actual: str
    passed: bool

class CodeExecutionResponse(BaseModel):
    stdout: str
    stderr: str
    passed_all: bool
    test_results: List[TestCaseResult]
    runtime_ms: float
    memory_mb: float
    error_explanation: Optional[str] = None
    ai_optimization_suggestion: Optional[str] = None

class HintRequest(BaseModel):
    user_id: str
    topic_id: str
    state_type: str
    code: str
    attempt_count: int

class HintResponse(BaseModel):
    hint_type: str  # "syntax" | "logic" | "interview" | "solution"
    message: str

class TeachBackRequest(BaseModel):
    user_id: str
    topic_id: str
    explanation: str

class TeachBackResponse(BaseModel):
    score: int
    feedback: str
