# CodeMate — The Self-Taught Builder's Career OS

CodeMate is an AI-powered Career Operating System designed to take self-taught developers from "I just learned code" to "I got hired." It features dynamic onboarding, active learning paths, real-time subprocess execution engines, spaced repetition schedules, and WebSocket peer collaboration workspaces.

---

## 🌟 Core Features

### 1. Active Learning Academy (3-Pane IDE Studio)
- **Tutor Chatbot & AST Whiteboard**: Conversational AI guidance coupled with a deterministic Python runner capturing stack traces using custom `sys.settrace` hooks.
- **Multilingual Subprocess Sandbox**: Compile and run code in isolated subprocesses under a 2-second timeout. Auto-detects and executes **Python**, **JavaScript** (Node.js), **Java** (javac/java), and **C++** (g++).
- **Interactive SVG Skills Graph**: A visual vector skills tree reflecting mastery ratios, unlocking nodes, and path connections dynamically.
- **Explain Like I'm 5 (ELI5) Toggle**: Translates dry technical theories and algorithms into simple real-world analogies (e.g. Russian nesting dolls for recursion) dynamically mapped or generated via Gemini.
- **Save Me (Frustration-Guard)**: A debugging advisor placed next to compiler failures. Instead of giving the answer, it uses Gemini to explain the error stdout/stderr as a physical analogy to prevent frustration-quitting.
- **Complexity Guide**: A floating sidebar reference card explaining asymptotic Big-O notations using physical actions (e.g., ripping a phone book in half for $O(\log N)$).

### 2. Gamified Anti-Procrastination System
- **Procrastination Jar**: Displays a glass jar that fills with golden coins on skipped days. Clear the jar by finishing daily coding tasks to earn XP.
- **5-Minute Spark**: A micro-compiler overlays the workspace, loading 2-minute logic tasks (variable swaps, loop counters) to break starting inertia and build instant study momentum.

### 3. Leitner Spaced-Repetition Scheduler
- Calculates review dates dynamically based on user scores.
- Displays a prioritized daily "Spaced Repetition Queue" on the dashboard for concepts requiring refreshers.

### 4. Collaborative Multiplayer Mock Interview Rooms
- Real-time peer-to-peer workspace syncing over FastAPI WebSockets (`wss://`).
- Synchronizes candidate code typing, compile output logs, and visual stack trace whiteboard replays instantly across interviewer and candidate screens.

### 5. Project-Based Resume Bullet Analyzer
- Analyzes public GitHub repositories.
- Evaluates code complexity and originality.
- Returns verified, impact-oriented bullet points tailored to specific target engineering roles.

---

### 5. Cross-Project Integrations (V3)
- **DrishtiAI Dual-Mode PII Redactor**: Automatically sanitizes sensitive candidate information (emails, Aadhaar credentials, contact cards) using Microsoft Presidio and fallback regex shields before routing data to public LLM interfaces.
- **RecruitIQ Candidate Scorer**: A 5-factor candidate matching and similarity model built for the Redrob Hackathon, evaluating profile similarity using `all-MiniLM-L6-v2` embeddings.

---

## 📂 Workspace Structure

- `/frontend`: Next.js web application built with App Router, TypeScript, and Lucide Icons.
- `/backend`: FastAPI Python server for sandbox compilers, WebSocket rooms, and Gemini API middleware.

---

## 🚀 Getting Started

### 1. Prerequisites
- Node.js (v18+)
- Python (3.10+)
- Gemini API Key (`GEMINI_API_KEY`)
- Supabase Key & URL (for fallback schemas)

### 2. Backend Setup
1. Navigate to backend:
   ```bash
   cd backend
   ```
2. Create and activate a virtual environment:
   ```bash
   python -m venv .venv
   # Windows:
   .venv\Scripts\activate
   # macOS/Linux:
   source .venv/bin/activate
   ```
3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Copy env variables:
   ```bash
   cp .env.template .env
   ```
5. Start Uvicorn:
   ```bash
   uvicorn app.main:app --reload --port 8000
   ```

### 3. Frontend Setup
1. Navigate to frontend:
   ```bash
   cd frontend
   ```
2. Install npm packages:
   ```bash
   npm install
   ```
3. Run local dev server:
   ```bash
   npm run dev
   ```
4. Open [http://localhost:3000](http://localhost:3000).

---

## 🌐 Deployed Sites
- **Frontend App**: [codemate-os.vercel.app](https://codemate-os.vercel.app)
- **Backend API**: [codemate-backend-kucb.onrender.com](https://codemate-backend-kucb.onrender.com)
