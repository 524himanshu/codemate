# CodeMate — The Self-Taught Builder's Career OS

CodeMate is an AI-powered Career Operating System designed to guide self-taught developers from "I just learned code" to "I got hired." It integrates dynamic roadmaps, an interactive 3-pane IDE classroom, sandbox compilers, spaced repetition schedules, real-time WebSocket collaboration, and psychological gamification to beat procrastination.

---

## 🌟 Core Features

### 1. Active Learning Academy (3-Pane IDE Studio)
*   **Tutor Chatbot & AST Whiteboard**: Conversational AI guidance coupled with a deterministic Python runner capturing stack traces using custom `sys.settrace` hooks.
*   **Multilingual Subprocess Sandbox**: Compile and run code in isolated subprocesses under a 2-second timeout. Auto-detects and executes **Python**, **JavaScript** (Node.js), **Java** (javac/java), and **C++** (g++).
*   **Interactive SVG Skills Graph**: A visual vector skills tree reflecting mastery ratios, unlocking nodes, and path connections dynamically.
*   **Explain Like I'm 5 (ELI5) Toggle**: Translates dry technical theories and algorithms into simple real-world analogies (e.g. Russian nesting dolls for recursion) dynamically mapped or generated via Gemini.

### 2. Gamified Anti-Procrastination System
*   **The Procrastination Jar**: Displays a glass jar that fills with golden coins on skipped days. Completing any coding activity or a Spark challenge empties the jar and rewards the user with an XP bonus to rebuild momentum.
*   **5-Minute Spark**: A micro-compiler overlay loading 2-minute logic tasks (variable swaps, loop counters, simple syntax fixes) to break starting inertia and build instant study momentum.
*   **"Save Me" Frustration-Guard**: A debugging advisor next to compiler failures. Instead of giving the answer, it uses Gemini to explain the error stdout/stderr as a physical analogy (e.g. narrow mail slots) to prevent frustration-quitting.
*   **Complexity Guide**: A floating sidebar reference card explaining asymptotic Big-O notations using physical actions (e.g., ripping a phone book in half for $O(\log N)$).

### 3. Leitner Spaced-Repetition Scheduler
*   Calculates review dates dynamically based on user scores.
*   Displays a prioritized daily "Spaced Repetition Queue" on the dashboard for concepts requiring refreshers.

### 4. Collaborative Multiplayer Mock Interview Rooms
*   Real-time peer-to-peer workspace syncing over FastAPI WebSockets (`wss://`).
*   Synchronizes candidate code typing, compile output logs, and visual stack trace whiteboard replays instantly across interviewer and candidate screens.

### 5. Project-Based Resume Bullet Analyzer
*   Analyzes public GitHub repositories.
*   Evaluates code complexity and originality.
*   Returns verified, impact-oriented bullet points tailored to specific target engineering roles.

---

## 🛡️ Sandbox Security Scan Shield

To prevent system exploits when compiling user-submitted code in local subprocesses, CodeMate includes centralized regex scan blocks inside `backend/app/services/runner_service.py` that intercept execution if unsafe system libraries or calls are detected:
*   **Python**: Blocks `import os`, `subprocess`, `sys`, `eval`, `exec`, `open`, `write`.
*   **JavaScript (Node.js)**: Blocks `require`, `fs`, `child_process`, `process`, `eval`.
*   **C++ & Java**: Blocks system execution commands (`system()`, `ProcessBuilder`, `Runtime.getRuntime().exec`), file-stream writing (`<fstream>`, `FileWriter`), and process headers.

---

## 📁 Workspace Architecture

```
dazzling-volta/
├── frontend/             # Next.js App Router Web App (TypeScript)
│   ├── app/              # Page routes & dashboard layout components
│   ├── lib/              # Client API fetch calls
│   └── public/           # Static asset assets
└── backend/              # FastAPI Server (Python)
    ├── app/
    │   ├── routers/      # API controller paths (roadmap, teaching, resume, interview)
    │   ├── services/     # Gemini API, Supabase connector, Sandbox runner
    │   └── config.py     # Server configurations
    └── requirements.txt  # Python requirements
```

---

## 🚀 Getting Started & Local Setup

### 1. Prerequisites
*   **Node.js** (v18+)
*   **Python** (3.10+)
*   **Gemini API Key** (`GEMINI_API_KEY`)
*   **Supabase Database Credentials** (URL & Service Anon Key)

### 2. Local Sandbox Compiler Runtimes
To run and test multilingual compilations locally in the sandbox runner, ensure the following compilers are installed on your host system path:
*   **C++**: GCC Compiler (`g++` executable must be on Path)
*   **Java**: Java Development Kit (`javac` and `java` executables must be on Path)
*   **JavaScript**: Node.js runtime (`node` executable must be on Path)
*   **Python**: Python 3 interpreter (`python` or `python3` must be on Path)

### 3. Environment Variables Configuration
Create a `.env` file in the `backend/` directory (you can copy the structure from `backend/.env.template`):

| Variable | Description | Example |
| :--- | :--- | :--- |
| `GEMINI_API_KEY` | Google Gemini API Key for lessons & summaries | `AIzaSy...` |
| `SUPABASE_URL` | Supabase project database URL | `https://yourproj.supabase.co` |
| `SUPABASE_KEY` | Supabase Client Anon Key | `eyJhbGci...` |
| `PORT` | Backend server port | `8000` |
| `HOST` | Backend server binding host | `0.0.0.0` |

### 4. Backend Setup
1.  Navigate to backend directory:
    ```bash
    cd backend
    ```
2.  Create and activate a virtual environment:
    ```bash
    python -m venv .venv
    # Windows:
    .venv\Scripts\activate
    # macOS/Linux:
    source .venv/bin/activate
    ```
3.  Install dependencies:
    ```bash
    pip install -r requirements.txt
    ```
4.  Copy env template to `.env` and fill in your keys:
    ```bash
    cp .env.template .env
    ```
5.  Start the FastAPI dev server:
    ```bash
    uvicorn app.main:app --reload --port 8000
    ```

### 5. Frontend Setup
1.  Navigate to frontend directory:
    ```bash
    cd frontend
    ```
2.  Install npm packages:
    ```bash
    npm install
    ```
3.  Run the Next.js local development server:
    ```bash
    npm run dev
    ```
4.  Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🌐 Deployed Endpoints
*   **Frontend App**: [codemate-os.vercel.app](https://codemate-os.vercel.app)
*   **Backend API**: [codemate-backend-kucb.onrender.com](https://codemate-backend-kucb.onrender.com)
