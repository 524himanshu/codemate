import json
import logging
import httpx
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Optional
from app.models.resume import ResumeRequest, ProjectAnalysisSchema
from app.services.gemini_service import gemini_service
from app.services.redact_service import pii_redactor

router = APIRouter()
logger = logging.getLogger("codemate.resume")

class FitScoreRequest(BaseModel):
    user_id: str
    github_url: str
    resume_text: str
    job_description: str

class FitScoreResponse(BaseModel):
    fit_score: int
    semantic_match: int
    skills_match: int
    experience_fit: int
    feedback: str
    skills_detected: List[str]
    missing_skills: List[str]

def parse_github_url(url: str):
    cleaned_url = url.replace("https://github.com/", "").replace("http://github.com/", "").strip("/")
    parts = cleaned_url.split("/")
    if len(parts) >= 2:
        return parts[0], parts[1]
    return None, None

async def fetch_readme(owner: str, repo: str) -> str:
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
    # Scrub PII in user input description
    project_description = pii_redactor.redact(request.project_description or "")
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
        return get_mock_resume_analysis(repo, project_description, target_role)

@router.post("/fit-score", response_model=FitScoreResponse)
async def evaluate_job_fit(request: FitScoreRequest):
    # Scrub PII in candidate resume and job description inputs
    sanitized_resume = pii_redactor.redact(request.resume_text)
    sanitized_jd = pii_redactor.redact(request.job_description)
    
    mock_response = FitScoreResponse(
        fit_score=75,
        semantic_match=78,
        skills_match=70,
        experience_fit=80,
        feedback="The candidate shows strong matching technical profiles, but lacks cloud architecture experiences.",
        skills_detected=["Python", "FastAPI", "PostgreSQL", "Docker"],
        missing_skills=["Kubernetes", "AWS CloudFormation", "Terraform"]
    )

    if gemini_service.is_mock():
        return mock_response

    prompt = f"""
    Evaluate the following candidate's resume against the Job Description:
    
    Candidate Resume Details (PII Redacted):
    {sanitized_resume}
    
    Job Description Details (PII Redacted):
    {sanitized_jd}
    
    Tasks:
    1. Calculate a weighted overall 'fit_score' out of 100 based on three components:
       - Semantic Match (weighted 30%): Cosine/meaning relevance of experiences.
       - Skills Match (weighted 40%): Tech skills overlap count.
       - Experience Fit (weighted 30%): YOE suitability and title alignments.
    2. Extract detected skills and identify missing skills explicitly required by the JD.
    3. Generate brief constructive feedback (under 80 words) listing how they can improve their fit score.
    
    Ensure you output valid JSON matching the schema.
    """

    system_instruction = (
        "You are an expert candidate matching engine scoring resumes against job descriptions "
        "using semantic similarities, tech skills mappings, and YOE relevance. Return a structured JSON response."
    )

    try:
        response_text = await gemini_service.generate_structured_json(
            prompt=prompt,
            response_schema=FitScoreResponse,
            system_instruction=system_instruction
        )
        return json.loads(response_text)
    except Exception as e:
        logger.error(f"Error evaluating candidate job fit: {e}")
        return mock_response

class ReferralRequest(BaseModel):
    user_id: str
    company_name: str
    target_role: str

class ReferralContact(BaseModel):
    name: str
    role: str
    reason: str
    outreach_template: str

class ReferralResponse(BaseModel):
    contacts: List[ReferralContact]

@router.post("/referrals", response_model=ReferralResponse)
async def find_referrals(request: ReferralRequest):
    comp = request.company_name.strip()
    role = request.target_role.strip()
    
    mock_contacts = [
        ReferralContact(
            name="Rahul Sharma",
            role=f"Senior Software Engineer @ {comp}",
            reason="Active contributor on open-source repositories and frequently comments on self-taught dev journeys.",
            outreach_template=(
                f"Hi Rahul,\n\nI noticed your engineering work at {comp} and saw your posts supporting self-taught developers. "
                f"I'm a fullstack builder from India. Recently, I built CodeMate (an active DSA learning environment featuring an AST-traced call-stack whiteboard) "
                f"and DrishtiAI (a pharmacovigilance adverse event detector selected for AI for Bharat 2026).\n\n"
                f"I'd love to get your brief feedback on my projects, or ask if you'd be open to referring me for the {role} position. "
                "Here is my code proof: github.com/524himanshu\n\nThanks,\nHimanshu"
            )
        ),
        ReferralContact(
            name="Priya Patel",
            role=f"Engineering Manager @ {comp}",
            reason="Managed engineering bootcamps and regularly hires non-traditional backgrounds.",
            outreach_template=(
                f"Hi Priya,\n\nI hope you're well. I saw that you manage engineering squads at {comp} and have hired builders from non-traditional CS backgrounds. "
                f"I'm an SDE applicant with no CS degree but 100% shipped code. I've designed asynchronous payout engines using Celery and Redis, and built "
                "AI-driven semantic parsing tools. I would love to learn what {comp} expects from SDE candidates, and if I could share my resume with you.\n\n"
                "Warm regards,\nHimanshu"
            )
        )
    ]
    
    if gemini_service.is_mock():
        return ReferralResponse(contacts=mock_contacts)
        
    prompt = f"""
    Generate 2 potential engineering contacts at '{comp}' who might refer a self-taught candidate for a '{role}' role.
    Provide:
    1. A realistic name.
    2. An engineering role at {comp}.
    3. A realistic reason why they are a good target (e.g. active on open-source, non-traditional background, active recruiter).
    4. A highly personalized, brief, professional cold outreach message. Mention the candidate's core projects (CodeMate, DrishtiAI) and focus on showing code proof (github.com/524himanshu) instead of credentials.
    
    Ensure you output valid JSON matching the schema.
    """
    
    system_instruction = (
        "You are an expert career network coach. "
        "Your task is to identify targets and write personalized cold outreach emails "
        "that get responses by focusing on code proof and builder-mindset. Return a structured JSON response."
    )
    
    try:
        response_text = await gemini_service.generate_structured_json(
            prompt=prompt,
            response_schema=ReferralResponse,
            system_instruction=system_instruction
        )
        return json.loads(response_text)
    except Exception as e:
        logger.error(f"Error generating referral outreach: {e}")
        return ReferralResponse(contacts=mock_contacts)
