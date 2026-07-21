import json
import logging
import re
import httpx
from typing import List, Dict, Any
from pydantic import BaseModel
from fastapi import APIRouter, HTTPException, Path
from app.models.roadmap import OnboardingRequest, RoadmapSchema
from app.services.gemini_service import gemini_service
from app.services.supabase_service import db_service

logger = logging.getLogger("codemate.roadmap")

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

class SummarizeRequest(BaseModel):
    url: str

class FlashcardSchema(BaseModel):
    front: str
    back: str

class QuizQuestionSchema(BaseModel):
    question: str
    choices: List[str]
    correct_choice: str
    explanation: str

class SummarizeResponse(BaseModel):
    summary: List[str]
    flashcards: List[FlashcardSchema]
    quiz_questions: List[QuizQuestionSchema]

@router.post("/summarize", response_model=SummarizeResponse)
async def summarize_resource(request: SummarizeRequest):
    url_lower = request.url.lower()
    
    # 1. Mock Summaries for common topics
    mock_summary = SummarizeResponse(
        summary=[
            "REST APIs use standard HTTP request verbs (GET, POST, PUT, DELETE) to define actions.",
            "Stateless execution: Every request must carry all the parameters, headers, and authentication tokens needed.",
            "Status Codes indicate categories: 200 (Success), 400 (Bad Request), 401 (Unauthorized), 500 (Internal Server Error).",
            "Caching via headers (ETag, Cache-Control) reduces duplicate backend query calls.",
            "Rate Limiting protects endpoints using algorithms like Token Bucket or Leaky Bucket."
        ],
        flashcards=[
            FlashcardSchema(front="What HTTP status represents rate limiting?", back="429 Too Many Requests"),
            FlashcardSchema(front="What HTTP status represents unauthorized requests?", back="401 Unauthorized")
        ],
        quiz_questions=[
            {
                "question": "Which HTTP verb should be used to overwrite an entire database resource record?",
                "choices": ["A: GET", "B: PUT", "C: POST"],
                "correct_choice": "B",
                "explanation": "PUT is idempotent and replaces the target resource representation entirely."
            },
            {
                "question": "What does a 502 status code represent?",
                "choices": ["A: Bad Gateway", "B: Service Unavailable", "C: Timeout"],
                "correct_choice": "A",
                "explanation": "502 Bad Gateway indicates a network/reverse-proxy communication failure between servers."
            },
            {
                "question": "What algorithm refills rates incrementally over time?",
                "choices": ["A: Round Robin", "B: Token Bucket", "C: First In First Out"],
                "correct_choice": "B",
                "explanation": "The Token Bucket algorithm adds tokens at a fixed rate, allowing bursts of requests up to capacity."
            }
        ]
    )
    
    if "python" in url_lower or "loop" in url_lower:
        mock_summary = SummarizeResponse(
            summary=[
                "Python loops run using the iterator protocol, calling __iter__() and __next__() under the hood.",
                "List comprehensions run in C speed, making them faster than standard loops appending items.",
                "Generator expressions conserve memory by yielding items lazily instead of instantiating full lists.",
                "Avoid modifying lists while iterating over them to prevent index skip bugs.",
                "Use enumerate() to capture index counts cleanly during traversals."
            ],
            flashcards=[
                FlashcardSchema(front="What method fetches the next item in an iterator?", back="__next__()"),
                FlashcardSchema(front="Do generator expressions allocate full memory buffers?", back="No, they yield items one-by-one dynamically.")
            ],
            quiz_questions=[
                {
                    "question": "Which of these is the most memory-efficient loop over 10 million items?",
                    "choices": ["A: List comprehension", "B: Generator expression", "C: Standard append loop"],
                    "correct_choice": "B",
                    "explanation": "Generators have O(1) space complexity because they evaluate elements one-by-one."
                }
            ]
        )
    elif "skiena" in url_lower or "algorithm" in url_lower:
        mock_summary = SummarizeResponse(
            summary=[
                "Algorithms are evaluated on correctness (halting on all inputs) and complexity bounds.",
                "Skiena recommends focusing on the mathematical 'why' (heuristics, tree reductions) before coding.",
                "Comparison-based sorting has a lower bound of Omega(N log N) decision tree height.",
                "Graphs represent objects and connections. Sparse graphs are best stored in Adjacency Lists.",
                "Backtracking traverses options recursively, pruning branches as soon as constraints are violated."
            ],
            flashcards=[
                FlashcardSchema(front="What is the lower bound of comparison sorting?", back="Omega(N log N)"),
                FlashcardSchema(front="What graph store fits sparse links?", back="Adjacency List (space O(V + E))")
            ],
            quiz_questions=[
                {
                    "question": "Which of these is an NP-complete problem?",
                    "choices": ["A: Dijkstra Shortest Path", "B: Boolean Satisfiability (SAT)", "C: Heapsort"],
                    "correct_choice": "B",
                    "explanation": "SAT was the first problem proved NP-complete by the Cook-Levin theorem."
                }
            ]
        )
        
    if gemini_service.is_mock():
        return mock_summary
        
    url = request.url
    page_content = ""
    is_youtube = "youtube.com" in url or "youtu.be" in url
    youtube_title = ""

    if is_youtube:
        try:
            headers = {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
                "Accept-Language": "en-US,en;q=0.9"
            }
            # Use httpx to scrape the video page to extract title
            with httpx.Client(headers=headers, follow_redirects=True, timeout=8.0) as client:
                res = client.get(url)
                if res.status_code == 200:
                    og_match = re.search(r'<meta\s+property="og:title"\s+content="(.*?)"', res.text, re.IGNORECASE)
                    if og_match:
                        youtube_title = og_match.group(1).strip()
                    else:
                        title_match = re.search(r'<title\b[^>]*>(.*?)</title>', res.text, re.IGNORECASE | re.DOTALL)
                        if title_match:
                            youtube_title = title_match.group(1).replace("- YouTube", "").strip()
        except Exception as e:
            logger.error(f"Failed to scrape YouTube metadata: {e}")
    else:
        try:
            headers = {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
            }
            with httpx.Client(headers=headers, follow_redirects=True, timeout=8.0) as client:
                res = client.get(url)
                if res.status_code == 200:
                    cleaned = re.sub(r'<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>', ' ', res.text, flags=re.I)
                    cleaned = re.sub(r'<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>', ' ', cleaned, flags=re.I)
                    cleaned = re.sub(r'<[^>]+>', ' ', cleaned)
                    page_content = re.sub(r'\s+', ' ', cleaned).strip()[:6000]
        except Exception as e:
            logger.error(f"Failed to scrape webpage {url}: {e}")

    if is_youtube:
        prompt = f"""
        The user wants to generate a study guide for this YouTube URL: '{url}'.
        """
        if youtube_title:
            prompt += f"\nHere is the fetched video title from the page: \"{youtube_title}\"\n"
            
        prompt += """
        Since direct web scraping requests to YouTube transcripts often fail due to cookie consent blocks, please use the title provided above and your internal pre-trained knowledge base to identify this specific content:
        1. If you recognize this playlist/video (such as Abdul Bari's Algorithms playlist) from the title and URL, base the summary, flashcards, and quizzes directly on its actual contents.
        2. If you do not recognize this specific link, generate a comprehensive study guide about the computer science subject represented by the video title.
        
        Provide:
        1. A 5-bullet summary detailing the most critical engineering takeaways of the topic.
        2. 2 text-based flashcards (front/back questions) representing core formulas or constraints.
        3. 3 multiple-choice quiz questions (with question text, choices array, correct_choice, and explanation).
        
        Ensure you output valid JSON matching the schema.
        """
    else:
        prompt = f"""
        Analyze and summarize the technical document at URL: '{url}'.
        
        Here is the scraped content of the page:
        \"\"\"
        {page_content}
        \"\"\"
        
        Provide:
        1. A 5-bullet summary detailing the most critical engineering takeaways from the page content.
        2. 2 text-based flashcards (front/back questions) representing core formulas or constraints.
        3. 3 multiple-choice quiz questions (with question text, choices array, correct_choice, and explanation).
        
        Ensure you output valid JSON matching the schema.
        """
    
    system_instruction = (
        "You are an expert study assistant. "
        "Your task is to summarize complex engineering tutorials and documents "
        "into structured study guides and quizzes. Return a structured JSON response."
    )
    
    try:
        response_text = await gemini_service.generate_structured_json(
            prompt=prompt,
            response_schema=SummarizeResponse,
            system_instruction=system_instruction
        )
        return json.loads(response_text)
    except Exception as e:
        logger.error(f"Error summarizing resource: {e}")
        return mock_summary
