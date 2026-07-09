# Product Requirements Document
## Dev Career OS — The Self-Taught Builder's Path to Getting Hired

**Version:** 2.0  
**Author:** Himanshu Menghani  
**Date:** July 2026  
**Status:** Draft

---

## 1. Problem Statement

Self-taught developers in India — especially outside metro cities — are stuck in a loop. There's no shortage of content. There's a massive shortage of direction, honest feedback, and proof of skill.

They copy-paste tutorials without understanding. They build fake projects to pad resumes. They apply to jobs blindly. They get rejected and have no idea why. They have no senior dev to ask, no alumni network, no IIT connections.

And when they finally get an interview? They've never practiced DSA properly. They freeze on a medium LeetCode. They can't explain their own solution.

No product today solves all of this together. Scaler is expensive and cohort-based. YouTube is chaos. Roadmap.sh is static. LeetCode has no teaching. LinkedIn is a game nobody taught them to play.

**This product fixes the entire journey — from zero to hired.**

---

## 2. Target Users

**Primary:** Self-taught developers in India, Tier 1/2/3 cities, 18–28 years old, no CS degree or incomplete degree, 0–2 years of experience, trying to break into tech.

**Secondary:** Career switchers who learned to code on their own and are trying to get their first or second tech job.

**Interview Prep Track (sub-segment):** Developers preparing for FAANG-style assessments, HackerRank company tests (Snowflake, Google, Databricks), or any role requiring DSA interviews.

---

## 3. Product Vision

A single AI-powered product that takes a self-taught developer from "I just learned Python" to "I got hired" — with honest feedback, personalized roadmaps, real learning (not passive content), and job readiness tools that actually work without a degree or network.

The product has two layers that connect:

- **Build Layer** — Learn to code properly, build real projects, get a credible resume
- **Interview Layer** — Learn DSA, practice patterns, ace HackerRank and technical interviews

Most products do one or the other. This does both, in sequence, for the same user.

---

## 4. Learning Philosophy

### Build Layer
Real understanding over passive consumption. The AI teaches concepts conversationally, checks comprehension before moving forward, and never lets the user just scroll through content without engaging.

### Interview Layer (The Academy)
Based on the Learning Pyramid:

```
Steven Skiena (WHY — theory, intuition)
        ↓
Understanding
        ↓
NeetCode (HOW — interview patterns)
        ↓
Pattern Recognition
        ↓
LeetCode (DO — implementation at speed)
        ↓
Implementation
        ↓
AI Mentor (FEEDBACK — review, optimize, interview)
        ↓
Revision + Mock Interviews
```

### Universal Rules (Both Layers)
- Never watch two lessons without writing code
- Never copy solutions
- Never memorize — always understand
- Always explain the approach before coding
- Always test edge cases

---

## 5. Core Features

---

### Feature 1: Personalized Roadmap Generator

**What it does:**
User answers 5 onboarding questions. AI generates a week-by-week learning and building roadmap, specific to their goal role, current level, and time availability. Not generic. Actual tasks.

**Onboarding inputs:**
- Current skill level (complete beginner / know basics / built 1–2 projects)
- Target role (frontend, backend, fullstack, AI/ML, DevOps)
- Time available per day (1hr / 2hr / 3hr+)
- What they've already built (free text)
- What they've tried and abandoned (free text)

**Output:**
- Week-by-week plan with daily tasks
- Checkpoints at end of each week ("you should be able to build X by now")
- Roadmap adapts as user progresses
- Shows exactly where they are, what's next, and what hiring managers expect at each stage
- At the right point, roadmap automatically transitions into the Interview Readiness track

**Why it matters:**
"What do I learn next" paralysis kills more self-taught devs than difficulty does.

---

### Feature 2: AI Teaching — Explain Like I'm 5 + Mid-Lesson Questions

**What it does:**
When a user starts a topic, the AI teaches it conversationally — plain language, real analogies, zero jargon until the concept lands. After every key concept, it pauses and asks a question. User can't just scroll through. They have to engage.

**Teaching mechanics:**
- Concept explained in plain language first (ELI5 mode by default)
- Real-world analogy always included
- Question asked after each concept — multiple choice or short answer
- Wrong answer: AI explains why, gives a different analogy, asks again
- Right answer: moves forward, occasionally throws a surprise recap question
- User can say "explain that differently" at any point
- Progress only advances when understanding is demonstrated, not just time spent

**Example flow:**

> **AI:** A function is like a recipe. You write the recipe once, and you can use it as many times as you want without rewriting it. Here's one in Python:
> ```python
> def greet(name):
>     return f"Hello, {name}!"
> ```
> Quick check — if I call `greet("Himanshu")`, what does it return?
>
> **User:** "Hello, Himanshu!"
>
> **AI:** Exactly. Now let's talk about why you'd want to pass different inputs...

**This same mechanic applies to DSA concepts in the Interview Layer:**

> **AI:** A hash map is like a dictionary you'd find at home. You look up a word (the key) and instantly get its meaning (the value) — you don't read the whole book to find it. That's O(1) lookup.
>
> If I give you a list `[2, 7, 11, 15]` and a target `9`, and ask you to find two numbers that add up to 9 — how would a hash map help you avoid checking every pair?

**Why it matters:**
Passive reading creates an illusion of learning. Actual comprehension requires retrieval. This forces it without being annoying about it.

---

### Feature 3: Interview Readiness Track (The Academy)

This is the structured DSA prep module that activates once the user has foundational coding skills. It can also be entered directly by users who already know how to code and just need interview prep.

#### Phase 0: Python for Interviews
**Goal:** Master Python tools used in every interview

Topics: Lists, Dict, Set, Tuple, Functions, Counter, Defaultdict, Deque, Heapq, Lambda, Enumerate, Zip, Time/Space complexity basics

---

#### Phase 1: Arrays + Hashing
**Problems:** Two Sum, Contains Duplicate, Valid Anagram, Group Anagrams, Top K Frequent, Product Except Self  
**Resources:** Steven Skiena lecture, NeetCode video, LeetCode problems

---

#### Phase 2: Two Pointers + Sliding Window
**Problems:** Longest Substring Without Repeating, Character Replacement, Container With Most Water, Minimum Window Substring

---

#### Phase 3: Binary Search + Intervals
**Problems:** Binary Search, Koko Eating Bananas, Search in Rotated Array, Merge Intervals, Insert Interval

---

#### Phase 4: Trees (DFS + BFS)
**Problems:** Maximum Depth, Diameter, Invert Tree, Level Order Traversal, Validate BST

---

#### Phase 5: Graphs
**Problems:** Number of Islands, Clone Graph, Course Schedule, Rotting Oranges, Pacific Atlantic Water Flow

---

#### Phase 6: Heap + Priority Queue
**Problems:** Top K Elements, Find Median from Data Stream, Merge K Sorted Lists, K Closest Points to Origin

---

#### Phase 7: Dynamic Programming
**Problems:** House Robber, Coin Change, Longest Increasing Subsequence, Longest Common Subsequence

---

#### Phase 8: Revision + Mock Tests
Full mock HackerRank simulations. Timed. Reviewed by AI immediately after.

---

**Daily Academy Workflow:**
```
1. Steven Skiena lecture (30–45 min) — understand the WHY
2. Implement the algorithm from memory — no looking
3. NeetCode lesson — learn the interview pattern
4. LeetCode (3–5 problems) — build speed
5. AI review of every solution — feedback, optimization, follow-up questions
6. Pattern Sheet — fill one per topic
7. Flashcard review
```

**Weekend Workflow:**
- Saturday morning: concepts | afternoon: practice | evening: mock interview
- Sunday: full mock HackerRank test → AI reviews weak areas

**Pattern Sheet Template (filled per topic):**
```
Pattern:
Use Case:
Recognition Clues:
Algorithm:
Data Structure:
Time Complexity:
Space Complexity:
Common Mistakes:
Related Problems:
```

**Mock Interview Framework (every mock follows this):**
1. Clarify the problem
2. Discuss brute force
3. Optimize
4. Explain complexity
5. Code
6. Dry run with example
7. Handle edge cases
8. Suggest improvements

**Final Week Checklist (before any assessment):**
- Solve medium problems in 20–30 minutes
- Explain every solution clearly without prompting
- Use Python collections confidently
- Recognize common patterns within 2 minutes
- Stay calm during a timed 90-minute session

---

### Feature 4: Resume Builder from Actual Builds

**What it does:**
User connects GitHub or manually enters projects. AI reads actual code, READMEs, and deployment links — generates resume bullets based on what was actually built.

**How it works:**
- User pastes GitHub repo links or fills a structured project form
- AI analyzes: tech stack, complexity, problem solved, scale indicators
- Generates honest, specific resume bullets
- Flags weak projects ("This is a tutorial clone — you need one original project before this resume is credible")
- Scores each project: originality, complexity, relevance to target role, proof of deployment
- Suggests what to build next to fill gaps

**Why it matters:**
99% of self-taught dev resumes are either empty or full of fake bullets. This creates honest, verifiable proof.

---

### Feature 5: Referral Finder

**What it does:**
User picks a target company. AI finds people there who are likely to respond to a cold referral request, then generates a personalized outreach message.

**How it works:**
- User enters target company + role
- AI surfaces relevant people (similar background, self-taught journey, active on LinkedIn)
- Generates a short, non-cringe outreach message personalized to that person
- Tracks who was messaged, follow-up reminders
- Builds a referral network map over time

**Why it matters:**
Getting referred increases interview chances by 10x. Self-taught devs have no network. This builds one.

---

### Feature 6: Job Fit Scorer

**What it does:**
User pastes a job description. AI scores their profile against it and tells them honestly whether to apply, what to fix first, and how to reposition their resume for that specific role.

**Output:**
- Fit score (0–100) with breakdown: skills, experience, education filters, keyword gaps
- "Apply now / Apply after fixing X / Skip this one" recommendation
- Resume tweaks specific to that JD
- Cover letter or cold email draft tailored to the role
- Flags hard degree filters upfront so they don't waste time

**Why it matters:**
Self-taught devs apply blindly and get ghosted. This tells them why before they even send the application.

---

### Feature 7: Resource Summarizer + Study Guide Generator

**What it does:**
User pastes a YouTube link, article URL, documentation page, or course module. AI gives a tight summary, key concepts, and practice questions.

**Output per resource:**
- 5-bullet summary of what actually matters
- Key concepts (flashcard-style)
- 3 questions to test retention
- "Add to my roadmap" option
- Saves to personal knowledge library

**Why it matters:**
The average self-taught dev has 47 browser tabs open and retains about 10% of what they read.

---

## 6. Progress Dashboard

Track across both layers:

| Metric | Build Layer | Interview Layer |
|---|---|---|
| Completion | Roadmap % done | Phases completed |
| Activity | Projects built | Problems solved |
| Quality | Resume score | Acceptance % |
| Mastery | Concept checks passed | Patterns recognized |
| Weakness | Topics flagged by AI | Mistake count |
| Confidence | Self-reported | Mock scores |

---

## 7. V1 Scope (Ship This First)

**Include in V1:**
- Onboarding flow (5 questions)
- Personalized roadmap generation
- AI teaching with mid-lesson questions (top 10 beginner topics)
- Basic resume builder from GitHub projects

**V1.5 (after first 500 users):**
- Interview Readiness Track (Phase 0–3 only)
- AI solution reviewer for LeetCode problems
- Pattern sheet generator

**V2 (after validation):**
- Full Academy (Phase 0–8)
- Referral finder
- Job fit scorer
- Resource summarizer
- Mock interview simulator
- Spaced repetition scheduler
- Daily coding streaks and analytics
- Company-specific tracks (Snowflake, Google, Databricks, Anthropic, OpenAI)
- System Design module
- ML/AI interview track
- Behavioral interview prep
- Hindi/regional language support

---

## 8. Tech Stack

| Layer | Choice | Why |
|---|---|---|
| Frontend | Next.js + Tailwind | Fast to build, SEO-friendly |
| Backend | FastAPI | You know it cold, async-friendly |
| AI | Claude API (Sonnet) | Best for conversational teaching and nuanced feedback |
| Database | PostgreSQL + Redis | User progress, caching roadmap state |
| Auth | Clerk or Supabase Auth | Ship fast, don't build auth from scratch |
| GitHub integration | GitHub REST API | For resume builder project analysis |
| Deployment | Railway + Vercel | Free tier gets you to first 1000 users |

---

## 9. Success Metrics

**V1 (first 90 days):**
- 500 users complete onboarding
- 40% return on Day 3
- Average 3+ lessons completed per user
- 50+ resumes generated

**Interview Track (V1.5):**
- 200 users enter the Academy
- Average 15+ problems solved per user
- 70%+ report feeling more confident before assessment

**Scale indicators:**
- User shares roadmap or mock score publicly (organic growth)
- "I got my first job using this" testimonials
- "I cleared the HackerRank using this" testimonials
- Time-on-site > 15 minutes per session

---

## 10. Why This Wins

- Builder is the user — no assumption, no research gap
- No product connects skill-building + DSA prep + job tools in one place
- The teaching mechanic is genuinely different from anything on the market
- India market is massive and underserved
- Free tier makes adoption frictionless
- Story is authentic and marketable

---

## 11. What Could Kill It

- Building too many features before validating the core two
- Making it look like another EdTech platform (positioning is everything)
- Teaching mechanic that feels like a boring quiz app — if it's not genuinely engaging, people leave
- Trying to monetize before trust is built
- Letting the Academy feel disconnected from the Build layer — they must feel like one product

---

## 12. Open Questions

1. What's the name? (not "Dev Career OS" — too corporate, not memorable enough)
2. Free forever or freemium? If freemium, what goes behind the paywall?
3. How do we get the first 100 users without a budget?
4. Hindi/regional language support from day one or V2?
5. Do we let users jump straight into the Academy, or enforce the Build layer first?
