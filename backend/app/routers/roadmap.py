import json
from fastapi import APIRouter, HTTPException, Path
from app.models.roadmap import OnboardingRequest, RoadmapSchema
from app.services.gemini_service import gemini_service
from app.services.supabase_service import db_service

router = APIRouter()

def get_mock_roadmap(role: str, level: str) -> dict:
    """Generates realistic mock roadmaps for local testing when no Gemini API key is configured."""
    return {
        "role": role,
        "current_level": level,
        "total_weeks": 4,
        "weekly_plan": [
            {
                "week_number": 1,
                "theme": f"Foundations of {role.capitalize()}",
                "checkpoint_desc": "Build a CLI-based profile dashboard showing your skills, progress, and goals.",
                "daily_tasks": [
                    {"day": "Day 1", "title": "Setup & First Syntax", "description": "Install target tools and write a simple greet-user function.", "duration_hours": 1.5},
                    {"day": "Day 2", "title": "Variables & Conditionals", "description": "Learn variable naming and implement decision-making logic.", "duration_hours": 2.0},
                    {"day": "Day 3", "title": "Understanding Loops", "description": "Implement loops to iterate over simple lists of project ideas.", "duration_hours": 1.5},
                    {"day": "Day 4", "title": "Functions as Recipes", "description": "ELIF5: functions are recipes. Write a custom calculator function.", "duration_hours": 2.5},
                    {"day": "Day 5", "title": "Simple Data Collections", "description": "Practice Lists, Dictionaries, and key-value mapping.", "duration_hours": 2.0},
                    {"day": "Day 6", "title": "CLI Dashboard Project", "description": "Start designing the week 1 project using CLI console inputs.", "duration_hours": 3.0},
                    {"day": "Day 7", "title": "Review & Complete Milestone", "description": "Complete code review and test boundary conditions.", "duration_hours": 1.5}
                ]
            },
            {
                "week_number": 2,
                "theme": "Intermediate Structures & Dynamic Code",
                "checkpoint_desc": "Create a fully functional data organizer utilizing persistent text files.",
                "daily_tasks": [
                    {"day": "Day 1", "title": "File I/O", "description": "Learn to write data to local text files and retrieve it.", "duration_hours": 2.0},
                    {"day": "Day 2", "title": "Error and Exception Handling", "description": "Learn Try/Except blocks to prevent CLI crash on invalid user input.", "duration_hours": 1.5},
                    {"day": "Day 3", "title": "Modules and Library Imports", "description": "Understand importing built-in modules like JSON and Time.", "duration_hours": 2.0},
                    {"day": "Day 4", "title": "OOP Basics", "description": "ELI5: Classes and objects are cookie cutters and cookies. Design a Student class.", "duration_hours": 2.5},
                    {"day": "Day 5", "title": "Designing Data Storage", "description": "Build structure to parse JSON data files safely.", "duration_hours": 2.0},
                    {"day": "Day 6", "title": "Build File Organizer CLI", "description": "Write CLI tool that creates/reads task lists stored on disk.", "duration_hours": 3.0},
                    {"day": "Day 7", "title": "Test Corner Cases", "description": "Feed empty values or special characters to the file writer.", "duration_hours": 1.5}
                ]
            }
        ]
    }

@router.post("/generate")
async def generate_roadmap(request: OnboardingRequest):
    """
    Takes onboarding answers and calls Gemini to generate a structured weekly roadmap.
    """
    user_id = request.user_id
    
    # Check if Gemini key is available
    if gemini_service.is_mock():
        mock_roadmap = get_mock_roadmap(request.target_role, request.current_skill_level)
        db_service.save_roadmap(user_id, mock_roadmap)
        return mock_roadmap
        
    prompt = f"""
    Create a highly personalized week-by-week coding roadmap for a self-taught developer:
    - Target Role: {request.target_role}
    - Current Skill Level: {request.current_skill_level}
    - Time Available per Day: {request.time_available}
    - Already Built: {request.already_built if request.already_built else 'Nothing yet'}
    - Tried & Abandoned: {request.tried_and_abandoned if request.tried_and_abandoned else 'None'}

    Requirements:
    1. Structure the roadmap as a 4-week core phase.
    2. Focus on action-oriented daily tasks matching the time limit ({request.time_available} per day).
    3. Include a practical, builder-centric checkpoint at the end of each week.
    4. Keep description simple, conversational, and direct (plain English analogies, no heavy jargon).
    5. Avoid generic tutorials; every day should involve writing code or completing a specific micro-build.
    """

    system_instruction = (
        "You are an expert tech mentor who helps self-taught developers get hired. "
        "Your task is to create custom roadmaps that bypass tutorial hell and encourage practical building. "
        "You must output JSON matching the provided schema."
    )

    try:
        response_text = await gemini_service.generate_structured_json(
            prompt=prompt,
            response_schema=RoadmapSchema,
            system_instruction=system_instruction
        )
        
        roadmap_data = json.loads(response_text)
        # Save to database (mock or real)
        db_service.save_roadmap(user_id, roadmap_data)
        return roadmap_data
    except Exception as e:
        # If API fails for any reason, fallback to mock so the application is robust
        import traceback
        traceback.print_exc()
        mock_roadmap = get_mock_roadmap(request.target_role, request.current_skill_level)
        db_service.save_roadmap(user_id, mock_roadmap)
        return mock_roadmap

@router.get("/{user_id}")
async def get_roadmap(user_id: str = Path(..., description="The user ID to fetch the roadmap for")):
    """
    Fetches an existing roadmap for the user.
    """
    roadmap = db_service.get_roadmap(user_id)
    if not roadmap:
        raise HTTPException(status_code=404, detail="Roadmap not found for this user.")
    return roadmap
