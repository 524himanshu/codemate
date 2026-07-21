# CodeMate Frontend | Career OS V1

This is the frontend dashboard of **CodeMate**—the self-taught builder's path to getting hired. It is built using **Next.js** (App Router), **TailwindCSS**, and **TypeScript**, designed with a neon-accented glassmorphic theme.

---

## ⚡ Core Features

### 1. The Procrastination Jar
*   A gamified visual feedback widget on the dashboard homepage.
*   Skipped days add golden coins to a glowing glass jar.
*   Completing a **5-Minute Spark** challenge or lesson empties the jar and awards an XP bonus to rebuild momentum.

### 2. "5-Minute Spark" Challenges
*   A fullscreen modal with a built-in micro Python compiler.
*   Provides 2-minute logic tasks (e.g. variable swapping, loops) to bypass starting inertia and kickstart study sessions.

### 3. "Explain Like I'm 5" (ELI5) Toggle
*   Embedded switch in the Academy classroom lesson description.
*   Instantly replaces dry math and jargon-heavy theory with simple, real-world analogies (e.g. Russian nesting dolls for recursion).

### 4. "Save Me" Frustration-Guard
*   Located in the sandbox terminal console whenever code fails.
*   Translates compiler `stderr` logs into a visual, concept-explaining analogy using Gemini rather than spoiling the solution.

### 5. Zero-Jargon Complexity Whiteboard
*   A floating sidebar reference guide explaining Big-O time complexity through physical examples (e.g., ripping a phone book in half for $O(\log N)$).

---

## 🛠️ Getting Started

### 1. Install Dependencies
Run from the `frontend/` directory:
```bash
npm install
```

### 2. Configure Environment Variables
Make sure your backend server is running and configure the API endpoint. Create a `.env` file or verify that `process.env.NEXT_PUBLIC_BACKEND_URL` is pointing to your active backend (e.g., `http://localhost:8000`).

### 3. Run Development Server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser to view the interactive dashboard.
