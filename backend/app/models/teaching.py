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

class ExplanationRequest(BaseModel):
    topic_id: str
    style: str  # "eli5" or "formal"

class ExplanationResponse(BaseModel):
    style: str
    explanation: str

class RepairAgentRequest(BaseModel):
    user_id: Optional[str] = "guest"
    topic_id: str
    state_type: str
    code: str
    stderr: Optional[str] = ""
    error_explanation: Optional[str] = ""

class RepairAgentResponse(BaseModel):
    status: str
    explanation: str
    bug_root_cause: str
    patched_code: str
    unified_diff: str
    verified_pass: bool
    runtime_ms: float
    test_results: List[TestCaseResult]

