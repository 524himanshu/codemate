const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";

export interface OnboardingRequest {
  user_id: string;
  current_skill_level: string;
  target_role: string;
  time_available: string;
  already_built: string;
  tried_and_abandoned: string;
}

export interface DailyTask {
  day: string;
  title: string;
  description: string;
  duration_hours: number;
}

export interface WeeklyMilestone {
  week_number: number;
  theme: string;
  checkpoint_desc: string;
  daily_tasks: DailyTask[];
}

export interface Roadmap {
  role: string;
  current_level: string;
  total_weeks: number;
  weekly_plan: WeeklyMilestone[];
}

export interface TestCaseResult {
  input: string;
  expected: string;
  actual: string;
  passed: boolean;
}

export interface CodeExecutionResponse {
  stdout: string;
  stderr: string;
  passed_all: boolean;
  test_results: TestCaseResult[];
  runtime_ms: number;
  memory_mb: number;
  error_explanation?: string;
  ai_optimization_suggestion?: string;
  trace?: any[];
}

export interface HintResponse {
  hint_type: "syntax" | "logic" | "interview" | "solution";
  message: string;
}

export interface TeachBackResponse {
  score: number;
  feedback: string;
}

export const api = {
  async generateRoadmap(data: OnboardingRequest): Promise<Roadmap> {
    const res = await fetch(`${BACKEND_URL}/api/roadmap/generate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      throw new Error("Failed to generate roadmap");
    }
    return res.json();
  },

  async getRoadmap(userId: string): Promise<Roadmap | null> {
    try {
      const res = await fetch(`${BACKEND_URL}/api/roadmap/${userId}`);
      if (res.status === 404) return null;
      if (!res.ok) throw new Error("Failed to get roadmap");
      return res.json();
    } catch {
      return null;
    }
  },

  async getLesson(topicId: string): Promise<any> {
    const res = await fetch(`${BACKEND_URL}/api/teaching/lesson/${topicId}`);
    if (!res.ok) {
      throw new Error("Failed to fetch lesson metadata");
    }
    return res.json();
  },

  async executeCode(userId: string, topicId: string, stateType: string, code: string): Promise<CodeExecutionResponse> {
    const res = await fetch(`${BACKEND_URL}/api/teaching/execute`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        user_id: userId,
        topic_id: topicId,
        state_type: stateType,
        code: code
      }),
    });
    if (!res.ok) {
      throw new Error("Failed to execute code in sandbox");
    }
    return res.json();
  },

  async getHint(userId: string, topicId: string, stateType: string, code: string, attemptCount: number): Promise<HintResponse> {
    const res = await fetch(`${BACKEND_URL}/api/teaching/hint`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        user_id: userId,
        topic_id: topicId,
        state_type: stateType,
        code: code,
        attempt_count: attemptCount
      }),
    });
    if (!res.ok) {
      throw new Error("Failed to fetch progressive hint");
    }
    return res.json();
  },

  async submitTeachBack(userId: string, topicId: string, explanation: string): Promise<TeachBackResponse> {
    const res = await fetch(`${BACKEND_URL}/api/teaching/teachback`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        user_id: userId,
        topic_id: topicId,
        explanation: explanation
      }),
    });
    if (!res.ok) {
      throw new Error("Failed to submit teach back explanation");
    }
    return res.json();
  },

  async getReviewQueue(): Promise<any[]> {
    const res = await fetch(`${BACKEND_URL}/api/teaching/review-queue`);
    if (!res.ok) {
      throw new Error("Failed to fetch spaced reviews queue");
    }
    return res.json();
  },

  async generateResume(userId: string, githubUrl: string, projectDesc: string, targetRole: string): Promise<any> {
    const res = await fetch(`${BACKEND_URL}/api/resume/generate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        user_id: userId,
        github_url: githubUrl,
        project_description: projectDesc,
        target_role: targetRole,
      }),
    });
    if (!res.ok) {
      throw new Error("Failed to generate resume bullets");
    }
    return res.json();
  },
};
