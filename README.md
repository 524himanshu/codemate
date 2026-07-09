# CodeMate — The Self-Taught Builder's Path to Getting Hired

CodeMate is an AI-powered platform designed to take self-taught developers from "I just learned Python" to "I got hired". It integrates conversational AI teaching (Explain Like I'm 5 with mid-lesson checkpoints), personalized roadmap generators, a structured DSA Interview Academy, a resume builder based on actual GitHub projects, and referral finders/job fit scoring tools.

---

## Workspace Structure

- `/frontend`: Next.js web application built with App Router, TypeScript, and Tailwind CSS v4.
- `/backend`: FastAPI Python server for AI routing, database logic, and resume parsing.

---

## Getting Started

### 1. Prerequisites
- Node.js (v18+)
- Python (3.10+)
- Gemini API Key (set as `GEMINI_API_KEY`)
- Supabase Project (set as `SUPABASE_URL` and `SUPABASE_KEY`)

### 2. Backend Setup
1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Create a virtual environment and activate it:
   ```bash
   python -m venv .venv
   # On Windows:
   .venv\Scripts\activate
   # On macOS/Linux:
   source .venv/bin/activate
   ```
3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Copy `.env.template` to `.env` and fill in your keys:
   ```bash
   cp .env.template .env
   ```
5. Run the FastAPI development server:
   ```bash
   uvicorn app.main:app --reload --port 8000
   ```

### 3. Frontend Setup
1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Run the development server:
   ```bash
   npm run dev
   ```
4. Open [http://localhost:3000](http://localhost:3000) in your browser.
