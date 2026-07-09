import json
import logging
import httpx
from fastapi import APIRouter, HTTPException
from app.models.resume import ResumeRequest, ProjectAnalysisSchema
from app.services.gemini_service import gemini_service

router = APIRouter()
logger = logging.getLogger("codemate.resume")

def parse_github_url(url: str):
    """
    Parses a GitHub URL like https://github.com/owner/repo to extract owner and repo name.
    """
    cleaned_url = url.replace("https://github.com/", "").replace("http://github.com/", "").strip("/")
    parts = cleaned_url.split("/")
    if len(parts) >= 2:
        return parts[0], parts[1]
    return None, None

async def fetch_readme(owner: str, repo: str) -> str:
    """
    Fetches the README file from a public GitHub repo.
    """
    # Try common branch names: main, then master
    branches = ["main", "master"]
    async with httpx.AsyncClient() as client:
        for branch in branches:
            raw_url = f"https://raw.githubusercontent.com/{owner}/{repo}/{branch}/README.md"
            try:
                response = await client.get(raw_url, timeout=5.0)
                if response.status_code == 200:
                    return response.text
            except Exception as e:
                logger.error(f"Error fetching README from branch {branch}: {e}")
    return ""

def get_mock_resume_analysis(repo: str, desc: str, role: str) -> dict:
    """Generates premium mock resume bullets and project analysis for local testing."""
    repo_title = repo.replace("-", " ").title() if repo else "My Project"
    return {
        "project_name": repo_title,
        "tech_stack": ["React", "Node.js", "Express", "MongoDB"] if "frontend" in role.lower() or "fullstack" in role.lower() else ["Python", "FastAPI", "PostgreSQL", "Docker"],
        "originality_score": 6,
        "complexity_score": 5,
        "is_tutorial_clone": True if "todo" in repo_title.lower() or "clone" in repo_title.lower() else False,
        "strength_feedback": f"Great implementation of basic {role} capabilities. Solid repository layout with setup documentation.",
        "weakness_feedback": "This project features very common endpoints and lacks performance metric tracking. It looks like a standard tutorial codebase.",
        "generated_bullets": [
            f"Architected and deployed a responsive {role} web application using the modern tech stack, reducing load times by 20%.",
            "Designed and implemented RESTful endpoints with comprehensive error-handling middleware, improving API reliability.",
            "Integrated relational database structures with index optimizations to support rapid data read/write transactions."
        ],
        "next_steps": "To make this project stand out, integrate a caching layer using Redis, implement end-to-end unit testing (Jest/PyTest), and add real-time communication via WebSockets."
    }

@router.post("/generate")
async def generate_resume(request: ResumeRequest):
    user_id = request.user_id
    github_url = request.github_url
    project_description = request.project_description or ""
    target_role = request.target_role

    owner, repo = parse_github_url(github_url)
    readme_content = ""
    if owner and repo:
        readme_content = await fetch_readme(owner, repo)
        logger.info(f"Successfully fetched README for {owner}/{repo}. Length: {len(readme_content)}")
    else:
        logger.warning(f"Could not parse GitHub URL: {github_url}")

    if gemini_service.is_mock():
        logger.info("Gemini service is in mock mode. Returning mock resume bullets.")
        return get_mock_resume_analysis(repo, project_description, target_role)

    # Prepare prompt for real Gemini
    context_details = f"GitHub Repo: {github_url}\n"
    if readme_content:
        context_details += f"Extracted README:\n{readme_content[:1500]}\n"
    if project_description:
        context_details += f"User's Description:\n{project_description}\n"

    prompt = f"""
    Analyze the following developer project for a candidate targeting a '{target_role}' role:
    {context_details}

    Tasks:
    1. Identify the tech stack and complexity.
    2. Assess if it is a generic tutorial clone (like a simple Todo list, Netflix clone, basic blog). Set 'is_tutorial_clone' accordingly.
    3. Generate 3-4 professional, impact-oriented resume bullets. Ensure they start with strong action verbs (e.g., Optimized, Designed, Refactored) and highlight tech stack and impact.
    4. Provide honest, constructive feedback on strengths and weaknesses.
    5. Suggest a concrete next feature or optimization they should build to make this project stand out (avoid generic 'add CSS' or 'write documentation'; suggest actual backend/frontend engineering challenges).
    """

    system_instruction = (
        "You are an expert technical interviewer and resume coach. "
        "Your task is to analyze developer projects honestly and generate bullet points "
        "that accurately reflect their work but sound professional and impact-driven. "
        "You must return JSON matching the schema."
    )

    try:
        response_text = await gemini_service.generate_structured_json(
            prompt=prompt,
            response_schema=ProjectAnalysisSchema,
            system_instruction=system_instruction
        )
        return json.loads(response_text)
    except Exception as e:
        logger.error(f"Error calling Gemini for resume builder: {e}")
        # Fallback to mock on error
        return get_mock_resume_analysis(repo, project_description, target_role)
