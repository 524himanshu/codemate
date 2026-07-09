from pydantic import BaseModel, Field
from typing import List, Optional

class ResumeRequest(BaseModel):
    user_id: str = Field(..., description="Unique ID of the user")
    github_url: str = Field(..., description="GitHub repository URL")
    project_description: Optional[str] = Field(None, description="Manual description or tech stack overview from the user")
    target_role: str = Field(..., description="Target role the resume is being built for")

class ProjectAnalysisSchema(BaseModel):
    project_name: str = Field(..., description="Extracted name of the project")
    tech_stack: List[str] = Field(..., description="Technologies identified in the project")
    originality_score: int = Field(..., description="Score 1-10 on originality")
    complexity_score: int = Field(..., description="Score 1-10 on complexity")
    is_tutorial_clone: bool = Field(..., description="True if this is a standard tutorial clone like a Todo app or basic clone")
    strength_feedback: str = Field(..., description="Constructive feedback on what makes this project credible")
    weakness_feedback: str = Field(..., description="Feedback flagging what needs to be improved or what makes it look weak")
    generated_bullets: List[str] = Field(..., description="List of 3-4 professional, impact-oriented resume bullets (focusing on achievements, action verbs, and tech)")
    next_steps: str = Field(..., description="Actionable suggestion of what they should build next to make this project stand out")
