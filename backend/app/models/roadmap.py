from pydantic import BaseModel, Field
from typing import List, Optional

# Onboarding Inputs
class OnboardingRequest(BaseModel):
    user_id: str = Field(..., description="Unique ID of the user")
    current_skill_level: str = Field(..., description="E.g., complete beginner / know basics / built 1-2 projects")
    target_role: str = Field(..., description="E.g., frontend, backend, fullstack, AI/ML, DevOps")
    time_available: str = Field(..., description="E.g., 1hr / 2hr / 3hr+")
    already_built: str = Field(..., description="Free text details of what the user has built")
    tried_and_abandoned: str = Field(..., description="Free text details of what they abandoned and why")

# Structured AI Roadmap Schema
class DailyTask(BaseModel):
    day: str = Field(..., description="Name of the day, e.g., 'Day 1', 'Day 2', etc.")
    title: str = Field(..., description="Actionable title of the task")
    description: str = Field(..., description="ELIF5 task description: what to study, practice, or code today")
    duration_hours: float = Field(..., description="Estimated hours to complete")

class WeeklyMilestone(BaseModel):
    week_number: int = Field(..., description="Week index (1-based)")
    theme: str = Field(..., description="Theme or main focus of the week")
    checkpoint_desc: str = Field(..., description="Practical checkpoint/project they must build by week's end")
    daily_tasks: List[DailyTask] = Field(..., description="List of tasks for this week (5-7 tasks)")

class RoadmapSchema(BaseModel):
    role: str = Field(..., description="Target role name")
    current_level: str = Field(..., description="Onboarded user skill level")
    total_weeks: int = Field(..., description="Total duration of the roadmap (normally 4-6 weeks for initial phase)")
    weekly_plan: List[WeeklyMilestone] = Field(..., description="Weekly breakdown of milestones and tasks")
