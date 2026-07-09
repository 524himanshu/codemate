from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings

app = FastAPI(
    title="CodeMate API",
    description="Backend API for CodeMate - The Self-Taught Builder's Path to Getting Hired",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "https://codemate-os.vercel.app"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
async def root():
    return {
        "status": "healthy",
        "message": "Welcome to the CodeMate API. The Self-Taught Builder's Path to Getting Hired."
    }

from app.routers import roadmap, teaching, resume

app.include_router(roadmap.router, prefix="/api/roadmap", tags=["roadmap"])
app.include_router(teaching.router, prefix="/api/teaching", tags=["teaching"])
app.include_router(resume.router, prefix="/api/resume", tags=["resume"])



