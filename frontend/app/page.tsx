"use client";

import React, { useState, useEffect } from "react";
import { 
  Compass, 
  BookOpen, 
  FileText, 
  CheckCircle, 
  ArrowRight, 
  Award, 
  HelpCircle, 
  Sparkles, 
  Loader2, 
  ChevronRight, 
  Clock, 
  Copy, 
  Check, 
  Code, 
  RefreshCw, 
  AlertTriangle,
  Play,
  Flame,
  ShieldAlert,
  List,
  Bookmark,
  FileDown,
  Lock,
  Unlock,
  ChevronLeft,
  Users,
  Video,
  Radio,
  CheckSquare
} from "lucide-react";
import { api, Roadmap, CodeExecutionResponse, TestCaseResult } from "../lib/api";

type LessonState = 
  | "MISSION" 
  | "PREDICT" 
  | "DISCOVER" 
  | "VISUALIZE" 
  | "BUILD" 
  | "CHALLENGE" 
  | "TEACH_BACK" 
  | "INTERVIEW" 
  | "MASTERY";

const LESSON_FLOW: LessonState[] = [
  "MISSION",
  "PREDICT",
  "DISCOVER",
  "VISUALIZE",
  "BUILD",
  "CHALLENGE",
  "TEACH_BACK",
  "INTERVIEW",
  "MASTERY"
];

export default function App() {
  const [userId, setUserId] = useState<string>("");
  const [activeTab, setActiveTab] = useState<"roadmap" | "academy" | "resume">("roadmap");
  const [isOnboarded, setIsOnboarded] = useState<boolean>(false);
  const [roadmap, setRoadmap] = useState<Roadmap | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  
  // Onboarding Form
  const [onboardingForm, setOnboardingForm] = useState({
    current_skill_level: "complete beginner",
    target_role: "frontend",
    time_available: "2hr",
    already_built: "",
    tried_and_abandoned: ""
  });
  const [onboardingStep, setOnboardingStep] = useState<number>(1);

  // Week/Day selected in Roadmap
  const [activeWeekNum, setActiveWeekNum] = useState<number>(1);
  const [expandedDay, setExpandedDay] = useState<string | null>("Day 1");

  // Learning Engine State
  const [selectedTopic, setSelectedTopic] = useState<string>("functions");
  const [lessonDefinition, setLessonDefinition] = useState<any>(null);
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(0);
  const [lessonLoading, setLessonLoading] = useState<boolean>(false);

  // Prediction State
  const [selectedChoice, setSelectedChoice] = useState<string>("");
  const [predictionSubmitted, setPredictionSubmitted] = useState<boolean>(false);
  const [predictionConfidence, setPredictionConfidence] = useState<number>(50);

  // Sandbox & Code Runner State
  const [editorCode, setEditorCode] = useState<string>("");
  const [executionResult, setExecutionResult] = useState<CodeExecutionResponse | null>(null);
  const [executionLoading, setExecutionLoading] = useState<boolean>(false);
  const [traceHistory, setTraceHistory] = useState<any[]>([]);
  const [traceIndex, setTraceIndex] = useState<number>(0);

  // Progressive Hint State
  const [attemptCount, setAttemptCount] = useState<number>(0);
  const [activeHint, setActiveHint] = useState<string>("");
  const [hintType, setHintType] = useState<string>("");
  const [hintLoading, setHintLoading] = useState<boolean>(false);

  // Teach Back State
  const [teachbackText, setTeachbackText] = useState<string>("");
  const [teachbackResult, setTeachbackResult] = useState<any>(null);
  const [teachbackLoading, setTeachbackLoading] = useState<boolean>(false);

  // Interview Mode State
  const [interviewTimeLeft, setInterviewTimeLeft] = useState<number>(2100); // 35 minutes
  const [interviewActive, setInterviewActive] = useState<boolean>(false);
  const [interviewCode, setInterviewCode] = useState<string>("");
  const [interviewResult, setInterviewResult] = useState<any>(null);

  // V2 Spaced Repetition State
  const [reviewQueue, setReviewQueue] = useState<any[]>([]);

  // V2 WebSockets Peer Collaboration State
  const [isMultiplayer, setIsMultiplayer] = useState<boolean>(false);
  const [roomId, setRoomId] = useState<string>("");
  const [wsConnection, setWsConnection] = useState<WebSocket | null>(null);
  const [peerStatus, setPeerStatus] = useState<string>("Disconnected");

  // Mastery State
  const [conceptMastery, setConceptMastery] = useState<Record<string, number>>({
    "Variables": 100,
    "Conditionals": 80,
    "Loops": 44,
    "Functions": 12,
    "Recursion": 0,
    "Trees": 0,
    "Graphs": 0
  });
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  // Watch Skiena State
  const [skienaPaused, setSkienaPaused] = useState<boolean>(false);
  const [skienaQuestionAnswered, setSkienaQuestionAnswered] = useState<boolean>(false);
  const [skienaAnswer, setSkienaAnswer] = useState<string>("");

  useEffect(() => {
    let storedUid = localStorage.getItem("codemate_uid");
    if (!storedUid) {
      storedUid = "user_" + Math.random().toString(36).substring(2, 9);
      localStorage.setItem("codemate_uid", storedUid);
    }
    setUserId(storedUid);

    const loadRoadmap = async () => {
      setIsLoading(true);
      try {
        const existingRoadmap = await api.getRoadmap(storedUid);
        if (existingRoadmap) {
          setRoadmap(existingRoadmap);
          setIsOnboarded(true);
        }
      } catch (err) {
        console.error("Failed to load roadmap", err);
      } finally {
        setIsLoading(false);
      }
    };
    loadRoadmap();
  }, []);

  // Fetch spaced repetition review queue when onboarded
  useEffect(() => {
    if (isOnboarded) {
      api.getReviewQueue().then(setReviewQueue).catch(console.error);
    }
  }, [isOnboarded]);

  // Interval timer for Interview Mode
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (interviewActive && interviewTimeLeft > 0) {
      timer = setInterval(() => {
        setInterviewTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (interviewTimeLeft === 0) {
      setInterviewActive(false);
      alert("Time is up for the interview challenge!");
    }
    return () => clearInterval(timer);
  }, [interviewActive, interviewTimeLeft]);

  // WebSockets Room connection cleanup
  useEffect(() => {
    return () => {
      if (wsConnection) {
        wsConnection.close();
      }
    };
  }, [wsConnection]);

  const handleOnboardingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const generated = await api.generateRoadmap({
        user_id: userId,
        ...onboardingForm
      });
      setRoadmap(generated);
      setIsOnboarded(true);
      setActiveTab("roadmap");
      
      // Load review queue
      const queue = await api.getReviewQueue();
      setReviewQueue(queue);
    } catch (err) {
      console.error(err);
      alert("Roadmap generation failed. Using local fallback.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleStartLesson = async (topicId: string) => {
    setSelectedTopic(topicId);
    setLessonLoading(true);
    setCurrentStepIndex(0);
    setPredictionSubmitted(false);
    setSelectedChoice("");
    setEditorCode("");
    setExecutionResult(null);
    setTraceHistory([]);
    setAttemptCount(0);
    setActiveHint("");
    setTeachbackText("");
    setTeachbackResult(null);
    setInterviewActive(false);
    setInterviewResult(null);
    setSkienaQuestionAnswered(false);
    setSkienaAnswer("");
    setActiveTab("academy");
    
    try {
      const def = await api.getLesson(topicId);
      setLessonDefinition(def);
      
      const buildState = def.states.find((s: any) => s.type === "build");
      if (buildState) {
        setEditorCode(buildState.code_template);
      }
    } catch (err) {
      console.error(err);
      alert("Failed to load lesson definition.");
    } finally {
      setLessonLoading(false);
    }
  };

  const handleCodeChange = (newCode: string) => {
    if (interviewActive) {
      setInterviewCode(newCode);
    } else {
      setEditorCode(newCode);
    }

    // Sync input code changes over Websocket connection
    if (wsConnection && wsConnection.readyState === WebSocket.OPEN) {
      wsConnection.send(JSON.stringify({
        type: "CODE_CHANGE",
        code: newCode
      }));
    }
  };

  const handleRunCode = async (stateType: "build" | "challenge") => {
    setExecutionLoading(true);
    setExecutionResult(null);
    const codeToRun = interviewActive ? interviewCode : editorCode;
    try {
      const result = await api.executeCode(userId, selectedTopic, stateType, codeToRun);
      setExecutionResult(result);
      if (result.trace && result.trace.length > 0) {
        setTraceHistory(result.trace);
        setTraceIndex(0);
      }
      
      // Sync compile prints and whiteboard replay states over WebSocket
      if (wsConnection && wsConnection.readyState === WebSocket.OPEN) {
        wsConnection.send(JSON.stringify({
          type: "EXECUTION_RUN",
          result: result,
          trace: result.trace || []
        }));
      }
    } catch (err) {
      console.error(err);
      alert("Failed to run code in sandbox.");
    } finally {
      setExecutionLoading(false);
    }
  };

  const handleGetHint = async (stateType: "build" | "challenge") => {
    setHintLoading(true);
    const nextAttempt = attemptCount + 1;
    setAttemptCount(nextAttempt);
    const targetCode = interviewActive ? interviewCode : editorCode;
    try {
      const hint = await api.getHint(userId, selectedTopic, stateType, targetCode, nextAttempt);
      setActiveHint(hint.message);
      setHintType(hint.hint_type);
    } catch (err) {
      console.error(err);
    } finally {
      setHintLoading(false);
    }
  };

  const handleSubmitTeachback = async () => {
    if (!teachbackText.trim()) return;
    setTeachbackLoading(true);
    try {
      const result = await api.submitTeachBack(userId, selectedTopic, teachbackText);
      setTeachbackResult(result);
    } catch (err) {
      console.error(err);
    } finally {
      setTeachbackLoading(false);
    }
  };

  const handleInterviewSubmit = async () => {
    setExecutionLoading(true);
    setInterviewActive(false);
    try {
      const result = await api.executeCode(userId, selectedTopic, "challenge", interviewCode);
      setInterviewResult(result);
      
      if (wsConnection && wsConnection.readyState === WebSocket.OPEN) {
        wsConnection.send(JSON.stringify({
          type: "EXECUTION_RUN",
          result: result,
          trace: []
        }));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setExecutionLoading(false);
    }
  };

  const handleMasteryUpdate = () => {
    if (!lessonDefinition) return;
    const updates = lessonDefinition.states.find((s: any) => s.type === "mastery")?.concept_updates || [];
    setConceptMastery((prev) => {
      const updated = { ...prev };
      updates.forEach((up: any) => {
        if (updated[up.concept] !== undefined) {
          updated[up.concept] = Math.min(100, updated[up.concept] + up.increment);
        }
      });
      return updated;
    });
  };

  // V2 WebSocket peer connection join handler
  const joinMultiplayerWorkspace = () => {
    if (!roomId.trim()) return;
    if (wsConnection) {
      wsConnection.close();
    }
    setPeerStatus("Connecting...");
    
    // Connect to backend WS server
    const ws = new WebSocket(`ws://localhost:8000/api/ws/interview/${roomId}`);
    
    ws.onopen = () => {
      setPeerStatus("Joined Room. Awaiting Peer...");
      setIsMultiplayer(true);
      setWsConnection(ws);
    };
    
    ws.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data);
        if (payload.type === "PEER_JOIN") {
          setPeerStatus("Interviewer Connected");
        } else if (payload.type === "PEER_LEFT") {
          setPeerStatus("Peer Disconnected");
        } else if (payload.type === "CODE_CHANGE") {
          if (interviewActive) setInterviewCode(payload.code);
          else setEditorCode(payload.code);
        } else if (payload.type === "EXECUTION_RUN") {
          setExecutionResult(payload.result);
          if (payload.trace && payload.trace.length > 0) {
            setTraceHistory(payload.trace);
            setTraceIndex(0);
          }
        }
      } catch (err) {
        console.error("WebSocket message parse error:", err);
      }
    };
    
    ws.onclose = () => {
      setPeerStatus("Disconnected");
      setWsConnection(null);
    };
    
    ws.onerror = () => {
      setPeerStatus("Connection Error");
      setWsConnection(null);
    };
  };

  // V2 SVG interactive graph skills renderer
  const renderSVGSkillsGraph = () => {
    const nodes = [
      { id: "variables", label: "Variables", x: 150, y: 35, mastery: conceptMastery["Variables"] || 100, unlocked: true },
      { id: "loops", label: "Loops", x: 150, y: 115, mastery: conceptMastery["Loops"] || 44, unlocked: true },
      { id: "functions", label: "Functions", x: 150, y: 195, mastery: conceptMastery["Functions"] || 12, unlocked: true },
      { id: "recursion", label: "Recursion", x: 150, y: 275, mastery: conceptMastery["Recursion"] || 0, unlocked: conceptMastery["Functions"] >= 60 }
    ];

    return (
      <svg viewBox="0 0 300 330" className="w-full h-auto bg-zinc-950/40 border border-zinc-900 rounded-2xl p-4 shadow-inner">
        {/* Connection Paths */}
        <line x1="150" y1="35" x2="150" y2="115" stroke="#3f3f46" strokeWidth="2.5" strokeDasharray={nodes[1].unlocked ? "" : "5"} />
        <line x1="150" y1="115" x2="150" y2="195" stroke="#3f3f46" strokeWidth="2.5" strokeDasharray={nodes[2].unlocked ? "" : "5"} />
        <line x1="150" y1="195" x2="150" y2="275" stroke="#3f3f46" strokeWidth="2.5" strokeDasharray={nodes[3].unlocked ? "" : "5"} />

        {/* Nodes map */}
        {nodes.map((node) => {
          const isSelected = selectedTopic === node.id;
          return (
            <g 
              key={node.id} 
              className="cursor-pointer group select-none"
              onClick={() => {
                if (node.unlocked) {
                  handleStartLesson(node.id);
                } else {
                  alert(`Complete ${node.id === "recursion" ? "Functions (requires >=60% mastery)" : "previous steps"} first!`);
                }
              }}
            >
              <circle
                cx={node.x}
                cy={node.y}
                r="22"
                fill={node.unlocked ? (isSelected ? "rgba(79, 70, 229, 0.15)" : "#09090b") : "#030303"}
                stroke={node.unlocked ? (isSelected ? "#818cf8" : "#27272a") : "#18181b"}
                strokeWidth="2.5"
                className="transition-all duration-300 group-hover:stroke-indigo-400 group-hover:scale-105"
              />
              
              {!node.unlocked && (
                <text x={node.x} y={node.y + 4} textAnchor="middle" fill="#3f3f46" className="text-xs">🔒</text>
              )}
              {node.unlocked && node.mastery >= 80 && (
                <circle cx={node.x + 13} cy={node.y - 13} r="5" fill="#10b981" />
              )}
              
              {/* Text elements */}
              <text
                x={node.x}
                y={node.y + 36}
                textAnchor="middle"
                fill={node.unlocked ? "#e4e4e7" : "#3f3f46"}
                className="text-[10px] font-bold font-sans tracking-tight"
              >
                {node.label}
              </text>
              <text
                x={node.x}
                y={node.y + 4}
                textAnchor="middle"
                fill={node.unlocked ? "#a1a1aa" : "#27272a"}
                className="text-[8px] font-mono font-bold"
              >
                {node.unlocked ? `${node.mastery}%` : ""}
              </text>
            </g>
          );
        })}
      </svg>
    );
  };

  // Resume State
  const [githubUrl, setGithubUrl] = useState<string>("");
  const [projectDesc, setProjectDesc] = useState<string>("");
  const [resumeTargetRole, setResumeTargetRole] = useState<string>("frontend");
  const [resumeAnalysis, setResumeAnalysis] = useState<any>(null);
  const [resumeLoading, setResumeLoading] = useState<boolean>(false);

  const handleResumeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!githubUrl.trim()) return;
    setResumeLoading(true);
    try {
      const result = await api.generateResume(userId, githubUrl, projectDesc, resumeTargetRole);
      setResumeAnalysis(result);
    } catch (err) {
      console.error(err);
    } finally {
      setResumeLoading(false);
    }
  };

  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remaining = secs % 60;
    return `${mins}:${remaining < 10 ? "0" : ""}${remaining}`;
  };

  const downloadFlashcards = () => {
    if (!lessonDefinition) return;
    const cards = lessonDefinition.states.find((s: any) => s.type === "mastery")?.flashcards || [];
    const text = cards.map((c: any) => `Front: ${c.front}\nBack: ${c.back}\n---`).join("\n\n");
    const blob = new Blob([text], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${selectedTopic}-flashcards.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col font-sans selection:bg-indigo-500 selection:text-white">
      {/* Header */}
      <header className="border-b border-zinc-900 bg-zinc-950/80 backdrop-blur sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-indigo-500 to-violet-600 flex items-center justify-center font-bold text-lg text-white shadow-lg shadow-indigo-500/20">
              C
            </div>
            <div>
              <span className="font-bold tracking-tight text-white text-lg">CodeMate</span>
              <span className="text-xs block text-zinc-500 font-mono -mt-1">Career OS</span>
            </div>
          </div>

          {isOnboarded && (
            <nav className="flex items-center gap-1 bg-zinc-900 p-1 rounded-xl">
              <button
                onClick={() => setActiveTab("roadmap")}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  activeTab === "roadmap"
                    ? "bg-zinc-800 text-white shadow-sm"
                    : "text-zinc-400 hover:text-zinc-200"
                }`}
              >
                <Compass className="h-4 w-4" />
                Roadmap
              </button>
              <button
                onClick={() => handleStartLesson("functions")}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  activeTab === "academy"
                    ? "bg-zinc-800 text-white shadow-sm"
                    : "text-zinc-400 hover:text-zinc-200"
                }`}
              >
                <BookOpen className="h-4 w-4" />
                Learning Engine
              </button>
              <button
                onClick={() => setActiveTab("resume")}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  activeTab === "resume"
                    ? "bg-zinc-800 text-white shadow-sm"
                    : "text-zinc-400 hover:text-zinc-200"
                }`}
              >
                <FileText className="h-4 w-4" />
                Resume Engine
              </button>
            </nav>
          )}

          <div className="flex items-center gap-3">
            {isOnboarded && (
              <button 
                onClick={() => {
                  if (confirm("Reset onboarding? This will clear your current roadmap.")) {
                    localStorage.removeItem("codemate_uid");
                    setIsOnboarded(false);
                    setRoadmap(null);
                    setOnboardingStep(1);
                  }
                }}
                className="text-xs text-zinc-500 hover:text-zinc-300 font-mono flex items-center gap-1 border border-zinc-900 px-3 py-1.5 rounded-lg hover:bg-zinc-900 transition-colors"
              >
                <RefreshCw className="h-3 w-3" />
                Reset
              </button>
            )}
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs font-mono text-zinc-500">FastAPI + Gemini Active</span>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 py-8 flex flex-col">
        {isLoading ? (
          <div className="flex-1 flex flex-col items-center justify-center py-20">
            <Loader2 className="h-10 w-10 text-indigo-500 animate-spin mb-4" />
            <p className="text-zinc-400 font-medium">Scaffolding your customized dev curriculum...</p>
          </div>
        ) : !isOnboarded ? (
          /* ONBOARDING SCREEN */
          <div className="max-w-2xl mx-auto w-full bg-zinc-900/40 border border-zinc-900 rounded-3xl p-8 shadow-xl backdrop-blur relative overflow-hidden my-auto animate-fadeIn">
            <div className="absolute top-0 right-0 h-40 w-40 bg-indigo-500/10 rounded-full blur-3xl" />
            <div className="absolute bottom-0 left-0 h-40 w-40 bg-violet-600/10 rounded-full blur-3xl" />

            <div className="flex items-center gap-2 mb-6">
              <Sparkles className="h-5 w-5 text-indigo-400" />
              <span className="text-xs uppercase tracking-widest font-mono text-zinc-500">AI-Powered Onboarding</span>
            </div>

            <h1 className="text-3xl font-extrabold text-white mb-2 tracking-tight">
              Design Your Custom Dev Path
            </h1>
            <p className="text-zinc-400 text-sm mb-8 leading-relaxed">
              We skip generic courses. Tell us what you want to build and where you get stuck, and our AI will draft a production-ready roadmap and mentor you.
            </p>

            <form onSubmit={handleOnboardingSubmit} className="space-y-6">
              {onboardingStep === 1 && (
                <div className="space-y-4 animate-fadeIn">
                  <label className="block text-sm font-semibold text-zinc-200">
                    What is your current coding level?
                  </label>
                  <div className="grid grid-cols-1 gap-3">
                    {[
                      { id: "complete beginner", title: "Complete Beginner", desc: "I just learned Python or basic variables, never built a project." },
                      { id: "know basics", title: "Know the Basics", desc: "Comfortable with loops and lists, struggling to build independently." },
                      { id: "built 1-2 projects", title: "Built 1-2 Projects", desc: "Can write code, but resumes are getting ignored or DSA is tough." }
                    ].map((opt) => (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => setOnboardingForm({ ...onboardingForm, current_skill_level: opt.id })}
                        className={`text-left p-4 rounded-xl border transition-all duration-200 ${
                          onboardingForm.current_skill_level === opt.id
                            ? "border-indigo-500 bg-indigo-500/5 text-white"
                            : "border-zinc-800 bg-zinc-900/60 text-zinc-300 hover:border-zinc-700"
                        }`}
                      >
                        <span className="block font-bold text-sm">{opt.title}</span>
                        <span className="block text-xs text-zinc-500 mt-1">{opt.desc}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {onboardingStep === 2 && (
                <div className="space-y-4 animate-fadeIn">
                  <label className="block text-sm font-semibold text-zinc-200">
                    What is your target role?
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { id: "frontend", name: "Frontend Developer" },
                      { id: "backend", name: "Backend Engineer" },
                      { id: "fullstack", name: "Fullstack Engineer" },
                      { id: "ai_ml", name: "AI/ML Engineer" },
                      { id: "devops", name: "DevOps Engineer" }
                    ].map((opt) => (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => setOnboardingForm({ ...onboardingForm, target_role: opt.id })}
                        className={`text-left p-4 rounded-xl border transition-all duration-200 ${
                          onboardingForm.target_role === opt.id
                            ? "border-indigo-500 bg-indigo-500/5 text-white"
                            : "border-zinc-800 bg-zinc-900/60 text-zinc-300 hover:border-zinc-700"
                        }`}
                      >
                        <span className="block font-bold text-sm">{opt.name}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {onboardingStep === 3 && (
                <div className="space-y-4 animate-fadeIn">
                  <label className="block text-sm font-semibold text-zinc-200">
                    How much time can you focus per day?
                  </label>
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { id: "1hr", label: "1 Hour" },
                      { id: "2hr", label: "2 Hours" },
                      { id: "3hr+", label: "3+ Hours" }
                    ].map((opt) => (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => setOnboardingForm({ ...onboardingForm, time_available: opt.id })}
                        className={`p-4 rounded-xl border text-center transition-all duration-200 ${
                          onboardingForm.time_available === opt.id
                            ? "border-indigo-500 bg-indigo-500/5 text-white"
                            : "border-zinc-800 bg-zinc-900/60 text-zinc-300 hover:border-zinc-700"
                        }`}
                      >
                        <Clock className="h-5 w-5 mx-auto mb-2 text-indigo-400" />
                        <span className="block font-bold text-sm">{opt.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {onboardingStep === 4 && (
                <div className="space-y-4 animate-fadeIn">
                  <label className="block text-sm font-semibold text-zinc-200">
                    What have you already built? (Be honest, tutorial clones count too!)
                  </label>
                  <textarea
                    value={onboardingForm.already_built}
                    onChange={(e) => setOnboardingForm({ ...onboardingForm, already_built: e.target.value })}
                    placeholder="e.g. Built a basic Python calculator CLI and cloned a simple HTML static layout from a YouTube course."
                    rows={4}
                    className="w-full bg-zinc-900/80 border border-zinc-800 rounded-xl p-4 text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-indigo-500 transition-colors resize-none"
                  />
                </div>
              )}

              {onboardingStep === 5 && (
                <div className="space-y-4 animate-fadeIn">
                  <label className="block text-sm font-semibold text-zinc-200">
                    What have you tried and abandoned? Why did you stop?
                  </label>
                  <textarea
                    value={onboardingForm.tried_and_abandoned}
                    onChange={(e) => setOnboardingForm({ ...onboardingForm, tried_and_abandoned: e.target.value })}
                    placeholder="e.g. Tried to learn JavaScript from a 40-hour course but got extremely bored on day 10 because I wasn't building projects."
                    rows={4}
                    className="w-full bg-zinc-900/80 border border-zinc-800 rounded-xl p-4 text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-indigo-500 transition-colors resize-none"
                  />
                </div>
              )}

              {/* Navigation Controls */}
              <div className="flex items-center justify-between border-t border-zinc-900 pt-6 mt-8">
                <span className="text-xs font-mono text-zinc-500">Step {onboardingStep} of 5</span>
                <div className="flex gap-2">
                  {onboardingStep > 1 && (
                    <button
                      type="button"
                      onClick={() => setOnboardingStep(onboardingStep - 1)}
                      className="px-4 py-2 border border-zinc-800 hover:bg-zinc-900 text-zinc-300 text-sm font-medium rounded-xl transition-colors"
                    >
                      Back
                    </button>
                  )}
                  {onboardingStep < 5 ? (
                    <button
                      type="button"
                      onClick={() => setOnboardingStep(onboardingStep + 1)}
                      className="px-5 py-2 bg-zinc-855 hover:bg-zinc-800 text-white text-sm font-medium rounded-xl flex items-center gap-1 transition-colors"
                    >
                      Next
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  ) : (
                    <button
                      type="submit"
                      className="px-6 py-2 bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-600 hover:to-violet-700 text-white text-sm font-bold rounded-xl flex items-center gap-2 shadow-lg shadow-indigo-500/20 transition-all duration-200"
                    >
                      Generate Roadmap
                      <ArrowRight className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>
            </form>
          </div>
        ) : (
          /* ACTIVE USER DASHBOARD */
          <div className="flex-1 flex flex-col gap-6 animate-fadeIn">
            {/* ROADMAP TAB */}
            {activeTab === "roadmap" && roadmap && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Side: Milestones list */}
                <div className="space-y-4">
                  {/* Goal Centered Metric (North Star) */}
                  <div className="bg-zinc-900/30 border border-zinc-900 p-5 rounded-2xl space-y-3">
                    <span className="text-xs font-mono text-zinc-500 uppercase tracking-wider block">Target Career Progress</span>
                    <div className="flex items-center justify-between font-bold text-white text-sm">
                      <span>{onboardingForm.target_role.toUpperCase()} Engineer</span>
                      <span>61% Ready</span>
                    </div>
                    <div className="w-full bg-zinc-950 h-2.5 rounded-full overflow-hidden border border-zinc-900">
                      <div className="bg-gradient-to-r from-indigo-500 to-violet-500 h-full w-[61%]" />
                    </div>
                    <div className="flex items-center justify-between text-xs text-zinc-500 mt-2 font-mono">
                      <span>Goal: Pass DSA Assessment</span>
                      <span>Est: 27 Days</span>
                    </div>
                  </div>

                  {/* V2 Leitner Spaced Repetition Review Queue */}
                  {reviewQueue.length > 0 && (
                    <div className="bg-zinc-900/40 border border-indigo-950/60 p-5 rounded-2xl space-y-3">
                      <div className="flex items-center gap-2 text-indigo-400 font-bold text-xs uppercase tracking-wider font-mono">
                        <Flame className="h-4 w-4" />
                        <span>Spaced Repetition Queue</span>
                      </div>
                      <div className="space-y-2">
                        {reviewQueue.map((item) => (
                          <div key={item.topic_id} className="p-3 bg-zinc-950/60 border border-zinc-900 rounded-xl flex items-center justify-between gap-3 text-xs">
                            <div>
                              <span className="font-bold text-white block">{item.title}</span>
                              <span className="text-[10px] text-zinc-500 block leading-tight mt-0.5">{item.reason}</span>
                            </div>
                            <button
                              onClick={() => handleStartLesson(item.topic_id)}
                              className="px-2.5 py-1.5 bg-indigo-500/10 border border-indigo-500/30 hover:bg-indigo-500 text-indigo-300 hover:text-white rounded-lg font-bold text-[10px] transition-colors shrink-0"
                            >
                              Review Now
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="flex items-center justify-between mb-2">
                    <h2 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
                      <Compass className="h-5 w-5 text-indigo-400" />
                      Weekly Milestones
                    </h2>
                  </div>

                  {roadmap.weekly_plan.map((week) => (
                    <div
                      key={week.week_number}
                      onClick={() => {
                        setActiveWeekNum(week.week_number);
                        setExpandedDay(week.daily_tasks[0]?.day || null);
                      }}
                      className={`p-4 rounded-2xl border text-left cursor-pointer transition-all duration-300 ${
                        activeWeekNum === week.week_number
                          ? "border-indigo-500/40 bg-zinc-900/60 shadow-lg shadow-indigo-500/5"
                          : "border-zinc-900 bg-zinc-950/20 hover:border-zinc-800"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-mono text-zinc-500">WEEK {week.week_number}</span>
                        {activeWeekNum === week.week_number && (
                          <span className="h-1.5 w-1.5 rounded-full bg-indigo-400" />
                        )}
                      </div>
                      <h3 className="font-bold text-white text-sm leading-tight mb-2">
                        {week.theme}
                      </h3>
                      <div className="flex items-center gap-1.5 text-xs text-zinc-400 mt-2 bg-zinc-900/40 px-2.5 py-1.5 rounded-lg border border-zinc-900">
                        <Award className="h-3.5 w-3.5 text-indigo-400 shrink-0" />
                        <span className="line-clamp-1">{week.checkpoint_desc}</span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Right Side: Week details and daily tasks */}
                <div className="lg:col-span-2 space-y-6">
                  {(() => {
                    const currentWeek = roadmap.weekly_plan.find((w) => w.week_number === activeWeekNum);
                    if (!currentWeek) return null;

                    return (
                      <div className="bg-zinc-900/30 border border-zinc-900 rounded-3xl p-6 relative overflow-hidden">
                        <div className="mb-6 pb-6 border-b border-zinc-900">
                          <span className="text-xs uppercase tracking-widest font-mono text-indigo-400 font-bold block mb-1">Week {currentWeek.week_number} Goal</span>
                          <h2 className="text-2xl font-extrabold text-white mb-2">{currentWeek.theme}</h2>
                          <div className="p-4 bg-indigo-950/20 border border-indigo-900/40 rounded-xl flex gap-3 items-start">
                            <Award className="h-5 w-5 text-indigo-400 shrink-0 mt-0.5" />
                            <div>
                              <span className="font-semibold text-xs text-indigo-200 block uppercase tracking-wider font-mono">End-of-Week Checkpoint</span>
                              <p className="text-sm text-zinc-300 leading-relaxed mt-1">{currentWeek.checkpoint_desc}</p>
                            </div>
                          </div>
                        </div>

                        {/* Daily Tasks Accordion */}
                        <div className="space-y-3">
                          <h3 className="text-sm font-semibold uppercase tracking-wider text-zinc-500 font-mono mb-2">Daily Roadmap</h3>
                          {currentWeek.daily_tasks.map((task) => {
                            const isExpanded = expandedDay === task.day;
                            return (
                              <div
                                key={task.day}
                                className={`border rounded-xl transition-all duration-200 ${
                                  isExpanded
                                    ? "border-zinc-800 bg-zinc-900/20"
                                    : "border-zinc-900 bg-transparent hover:border-zinc-800"
                                }`}
                              >
                                <button
                                  type="button"
                                  onClick={() => setExpandedDay(isExpanded ? null : task.day)}
                                  className="w-full text-left p-4 flex items-center justify-between gap-4"
                                >
                                  <div className="flex items-center gap-3">
                                    <span className="text-xs font-mono font-bold text-zinc-500 bg-zinc-900 px-2 py-1 rounded-md">
                                      {task.day}
                                    </span>
                                    <span className="font-bold text-sm text-zinc-100">{task.title}</span>
                                  </div>
                                  <div className="flex items-center gap-2 text-xs text-zinc-500">
                                    <Clock className="h-3.5 w-3.5" />
                                    {task.duration_hours}h
                                  </div>
                                </button>

                                {isExpanded && (
                                  <div className="px-4 pb-4 pt-1 border-t border-zinc-900/60 animate-fadeIn">
                                    <p className="text-sm text-zinc-400 leading-relaxed mb-4">
                                      {task.description}
                                    </p>
                                    <div className="flex items-center gap-2">
                                      <button
                                        onClick={() => {
                                          let topicId = "functions";
                                          const descClean = task.description.toLowerCase();
                                          const titleClean = task.title.toLowerCase();
                                          if (descClean.includes("loop") || titleClean.includes("loop")) topicId = "loops";
                                          
                                          handleStartLesson(topicId);
                                        }}
                                        className="px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors shadow-lg shadow-indigo-500/10"
                                      >
                                        <Sparkles className="h-3.5 w-3.5" />
                                        Launch Learning Engine
                                      </button>
                                      <button
                                        onClick={() => setExpandedDay(null)}
                                        className="px-3 py-2 text-zinc-400 hover:text-zinc-200 text-xs font-medium rounded-lg border border-zinc-800 hover:bg-zinc-900 transition-colors"
                                      >
                                        Mark Done
                                      </button>
                                    </div>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })()}
                </div>
              </div>
            )}

            {/* ACADEMY TAB */}
            {activeTab === "academy" && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
                
                {/* 1. LEFT PANE (MISSION, WHITEBOARD, CONCEPT GRAPH) - 4 COLS */}
                <div className="lg:col-span-4 flex flex-col gap-6">
                  {/* Topic navigation list */}
                  <div className="bg-zinc-900/20 border border-zinc-900 rounded-2xl p-4 space-y-2">
                    <span className="text-xs uppercase font-mono text-zinc-500 tracking-wider">Lesson Syllabus</span>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleStartLesson("functions")}
                        className={`flex-1 py-2 rounded-lg text-xs font-bold border transition-colors ${
                          selectedTopic === "functions"
                            ? "bg-indigo-500/10 border-indigo-500 text-white"
                            : "bg-transparent border-zinc-900 text-zinc-400 hover:border-zinc-800"
                        }`}
                      >
                        Functions
                      </button>
                      <button
                        onClick={() => handleStartLesson("loops")}
                        className={`flex-1 py-2 rounded-lg text-xs font-bold border transition-colors ${
                          selectedTopic === "loops"
                            ? "bg-indigo-500/10 border-indigo-500 text-white"
                            : "bg-transparent border-zinc-900 text-zinc-400 hover:border-zinc-800"
                        }`}
                      >
                        Loops
                      </button>
                    </div>
                  </div>

                  {lessonLoading ? (
                    <div className="bg-zinc-900/30 border border-zinc-900 rounded-3xl p-16 flex-1 flex flex-col items-center justify-center min-h-[300px]">
                      <Loader2 className="h-8 w-8 text-indigo-500 animate-spin mb-4" />
                      <p className="text-zinc-500 text-sm font-mono">Loading lesson definition...</p>
                    </div>
                  ) : lessonDefinition ? (
                    <>
                      {/* Objectives Card */}
                      <div className="bg-zinc-900/30 border border-zinc-900 p-5 rounded-2xl space-y-4">
                        <div className="flex justify-between items-start">
                          <div>
                            <span className="text-xs font-mono text-indigo-400 font-bold uppercase tracking-wider block">Today's Mission</span>
                            <h3 className="font-extrabold text-white text-xl mt-0.5">{lessonDefinition.lesson.title}</h3>
                          </div>
                          <span className="text-xs bg-indigo-500/10 border border-indigo-500/20 px-2.5 py-1 rounded-full text-indigo-300 font-semibold font-mono">
                            {lessonDefinition.states.find((s: any) => s.type === "mission")?.estimated_minutes || 15} mins
                          </span>
                        </div>

                        {/* Checklist */}
                        <ul className="space-y-2">
                          {lessonDefinition.states.find((s: any) => s.type === "mission")?.checklist.map((item: string, idx: number) => (
                            <li key={idx} className="flex gap-2.5 items-start text-xs text-zinc-300 leading-relaxed">
                              <CheckCircle className="h-4 w-4 text-indigo-400 shrink-0 mt-0.5" />
                              <span>{item}</span>
                            </li>
                          ))}
                        </ul>

                        {/* Interview Relevance */}
                        <div className="pt-4 border-t border-zinc-900/80 flex justify-between items-center text-xs">
                          <div className="space-y-1">
                            <span className="text-[10px] text-zinc-500 uppercase font-mono block">Interview Coverage</span>
                            <div className="flex gap-1 text-amber-400 font-bold text-sm leading-none">
                              {"★".repeat(lessonDefinition.lesson.interview_coverage.stars)}
                              {"☆".repeat(5 - lessonDefinition.lesson.interview_coverage.stars)}
                            </div>
                          </div>
                          <div className="text-right space-y-1">
                            <span className="text-[10px] text-zinc-500 uppercase font-mono block">Target Companies</span>
                            <span className="text-zinc-300 font-bold">{lessonDefinition.lesson.interview_coverage.companies.slice(0, 3).join(", ")}</span>
                          </div>
                        </div>
                      </div>

                      {/* Visual Whiteboard Panel */}
                      <div className="bg-zinc-900/30 border border-zinc-900 p-5 rounded-2xl flex-1 flex flex-col justify-between">
                        <div>
                          <div className="flex items-center gap-2 mb-3">
                            <Code className="h-4 w-4 text-indigo-400" />
                            <span className="text-xs font-bold uppercase tracking-wider font-mono text-zinc-400">AI Whiteboard (Deterministic Replay)</span>
                          </div>

                          {traceHistory.length > 0 ? (
                            <div className="space-y-4">
                              <div className="p-3 bg-zinc-950/60 border border-zinc-900 rounded-lg text-xs space-y-1">
                                <span className="font-semibold text-indigo-300 block">{lessonDefinition.states.find((s: any) => s.type === "visualize")?.whiteboard_data.title}</span>
                                <p className="text-zinc-500 leading-relaxed">{lessonDefinition.states.find((s: any) => s.type === "visualize")?.whiteboard_data.description}</p>
                              </div>

                              {/* Animation Frame view */}
                              <div className="bg-zinc-950 border border-zinc-900 rounded-xl p-4 min-h-[160px] flex flex-col justify-center items-center relative overflow-hidden font-mono">
                                {traceHistory.map((frame, idx) => {
                                  if (frame.event === "call" && idx <= traceIndex) {
                                    const offset = (frame.depth - 1) * 8;
                                    return (
                                      <div 
                                        key={idx}
                                        style={{ transform: `translateY(-${offset}px)` }}
                                        className={`w-[80%] py-2.5 px-3 border text-center rounded-lg text-xs transition-all duration-300 absolute ${
                                          idx === traceIndex
                                            ? "border-indigo-500 bg-indigo-500/10 text-white font-bold shadow-lg shadow-indigo-500/5 scale-105 z-10"
                                            : "border-zinc-800 bg-zinc-900/40 text-zinc-500 scale-95 opacity-60"
                                        }`}
                                      >
                                        {frame.function}({Object.entries(frame.args).map(([k, v]) => `${k}=${v}`).join(", ")})
                                      </div>
                                    );
                                  }
                                  return null;
                                })}
                              </div>

                              {/* Details below framework */}
                              <div className="p-3 bg-zinc-950/20 border border-zinc-900 rounded-lg text-xs leading-relaxed text-zinc-400 min-h-[50px] flex items-center">
                                {traceHistory[traceIndex]?.event === "call" ? (
                                  <>
                                    <span>👉 Called function <strong className="text-white">{traceHistory[traceIndex].function}</strong> at line {traceHistory[traceIndex].line}</span>
                                  </>
                                ) : (
                                  <>
                                    <span>🎉 Returned value: <strong className="text-emerald-400">{traceHistory[traceIndex]?.returnValue}</strong></span>
                                  </>
                                )}
                              </div>
                            </div>
                          ) : (
                            <div className="flex-1 flex flex-col justify-center items-center py-10 text-center space-y-3 font-sans">
                              <Lock className="h-6 w-6 text-zinc-700" />
                              <div className="space-y-1">
                                <span className="font-bold text-xs text-zinc-400 block">Tracer Locked</span>
                                <p className="text-[10px] text-zinc-600 max-w-[200px]">Complete the Prediction slide and write your code first. Traces are generated dynamically from executed code.</p>
                              </div>
                            </div>
                          )}
                        </div>

                        {traceHistory.length > 0 && (
                          <div className="flex justify-between items-center border-t border-zinc-900/60 pt-3 mt-4">
                            <button
                              disabled={traceIndex === 0}
                              onClick={() => setTraceIndex(traceIndex - 1)}
                              className="px-3 py-1 bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 disabled:opacity-30 disabled:pointer-events-none rounded text-[11px] font-mono text-zinc-300"
                            >
                              ← Step Back
                            </button>
                            <span className="text-[10px] font-mono text-zinc-500">Frame {traceIndex + 1} / {traceHistory.length}</span>
                            <button
                              disabled={traceIndex === traceHistory.length - 1}
                              onClick={() => setTraceIndex(traceIndex + 1)}
                              className="px-3 py-1 bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 disabled:opacity-30 disabled:pointer-events-none rounded text-[11px] font-mono text-zinc-300"
                            >
                              Step Forward →
                            </button>
                          </div>
                        )}
                      </div>

                      {/* V2 SVG Concept Graph Skills Tree Graph */}
                      <div className="bg-zinc-900/30 border border-zinc-900 p-5 rounded-2xl space-y-3">
                        <span className="text-xs uppercase font-mono text-zinc-500 tracking-wider">Concept Graph Nodes</span>
                        {renderSVGSkillsGraph()}
                      </div>
                    </>
                  ) : null}
                </div>

                {/* 2. MIDDLE PANE (ACTIVE TUTOR DIALOGUE) - 4 COLS */}
                <div className="lg:col-span-4 flex flex-col justify-between bg-zinc-900/30 border border-zinc-900 rounded-3xl p-6 relative overflow-hidden">
                  
                  {/* Step Timeline Indicator */}
                  <div className="flex items-center gap-1 mb-6 border-b border-zinc-900 pb-4">
                    {LESSON_FLOW.map((state, idx) => (
                      <div 
                        key={state}
                        className={`h-1.5 flex-1 rounded-full ${
                          idx === currentStepIndex
                            ? "bg-indigo-500 shadow-md shadow-indigo-500/25"
                            : idx < currentStepIndex
                            ? "bg-zinc-700"
                            : "bg-zinc-900"
                        }`}
                      />
                    ))}
                  </div>

                  {/* Active Step Panel */}
                  {lessonDefinition && (
                    <div className="flex-1 flex flex-col gap-5 justify-start">
                      
                      {/* A. MISSION STATE */}
                      {LESSON_FLOW[currentStepIndex] === "MISSION" && (
                        <div className="space-y-4 animate-fadeIn">
                          <span className="text-xs font-mono text-zinc-500 uppercase tracking-widest block">Stage 1: Launch Mission</span>
                          <h3 className="text-xl font-extrabold text-white">Target Objective</h3>
                          <p className="text-sm text-zinc-400 leading-relaxed">
                            Welcome, Developer. This lesson is engineered around active comprehension. You'll guess, trace execution frames, build helper functions, and complete an interview-level reflection. Let's begin by predicting a core design paradigm.
                          </p>
                        </div>
                      )}

                      {/* B. PREDICT STATE */}
                      {LESSON_FLOW[currentStepIndex] === "PREDICT" && (
                        <div className="space-y-4 animate-fadeIn">
                          <span className="text-xs font-mono text-zinc-500 uppercase tracking-widest block">Stage 2: Guess First (Retrieval)</span>
                          <div className="bg-zinc-950 border border-zinc-900 p-4 rounded-xl text-xs font-semibold leading-relaxed text-zinc-200">
                            {lessonDefinition.states.find((s: any) => s.type === "predict").question}
                          </div>

                          <div className="space-y-2">
                            {lessonDefinition.states.find((s: any) => s.type === "predict").choices.map((choice: string) => {
                              const letter = choice.substring(0, 1);
                              return (
                                <button
                                  key={choice}
                                  disabled={predictionSubmitted}
                                  onClick={() => setSelectedChoice(letter)}
                                  className={`w-full text-left p-3.5 rounded-xl border text-xs leading-relaxed transition-all duration-200 ${
                                    selectedChoice === letter
                                      ? "border-indigo-500 bg-indigo-500/5 text-white"
                                      : "border-zinc-900 bg-zinc-950/20 text-zinc-400 hover:border-zinc-800"
                                  }`}
                                >
                                  {choice}
                                </button>
                              );
                            })}
                          </div>

                          {/* Confidence Slider */}
                          {!predictionSubmitted && (
                            <div className="space-y-1.5 pt-4 border-t border-zinc-900/60">
                              <div className="flex justify-between text-xs text-zinc-500">
                                <span>Prediction Confidence:</span>
                                <span className="font-bold text-white">{predictionConfidence}%</span>
                              </div>
                              <input
                                type="range"
                                min="0"
                                max="100"
                                value={predictionConfidence}
                                onChange={(e) => setPredictionConfidence(Number(e.target.value))}
                                className="w-full h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                              />
                            </div>
                          )}

                          {predictionSubmitted ? (
                            <div className="p-4 bg-zinc-950 border border-zinc-900 rounded-xl space-y-2 text-xs">
                              <span className="font-bold text-white block">
                                {selectedChoice === lessonDefinition.states.find((s: any) => s.type === "predict").correct_choice 
                                  ? "🎉 Correct Guess!" 
                                  : "💡 Mentor Explanation"}
                              </span>
                              <p className="text-zinc-400 leading-relaxed">
                                {lessonDefinition.states.find((s: any) => s.type === "predict").explanation}
                              </p>
                            </div>
                          ) : (
                            <button
                              disabled={!selectedChoice}
                              onClick={() => setPredictionSubmitted(true)}
                              className="w-full py-3 bg-indigo-500 hover:bg-indigo-600 disabled:opacity-40 disabled:pointer-events-none text-white text-xs font-bold rounded-xl transition-colors shadow-lg shadow-indigo-500/10"
                            >
                              Submit Prediction
                            </button>
                          )}
                        </div>
                      )}

                      {/* C. DISCOVER STATE */}
                      {LESSON_FLOW[currentStepIndex] === "DISCOVER" && (
                        <div className="space-y-4 animate-fadeIn">
                          <span className="text-xs font-mono text-zinc-500 uppercase tracking-widest block">Stage 3: Discover Concept</span>
                          <h3 className="text-lg font-extrabold text-white">{lessonDefinition.states.find((s: any) => s.type === "discover").analogy_title}</h3>
                          
                          {/* Recipe Diagram */}
                          <div className="p-4 bg-zinc-950 border border-zinc-900 rounded-xl flex justify-between items-center gap-3 text-[10px] font-mono text-center">
                            <div className="border border-zinc-850 p-2 rounded bg-zinc-900/40 text-indigo-400">
                              <span>Ingredients</span>
                              <span className="block text-[8px] text-zinc-600 mt-0.5">(Arguments)</span>
                            </div>
                            <span className="text-zinc-600">➔</span>
                            <div className="border border-indigo-900 p-2 rounded bg-indigo-950/10 text-white font-bold">
                              <span>Recipe Card</span>
                              <span className="block text-[8px] text-zinc-500 mt-0.5">(Function)</span>
                            </div>
                            <span className="text-zinc-600">➔</span>
                            <div className="border border-zinc-850 p-2 rounded bg-zinc-900/40 text-emerald-400">
                              <span>Baked Cookies</span>
                              <span className="block text-[8px] text-zinc-600 mt-0.5">(Return Value)</span>
                            </div>
                          </div>

                          <p className="text-xs text-zinc-400 leading-relaxed whitespace-pre-wrap">
                            {lessonDefinition.states.find((s: any) => s.type === "discover").analogy_description}
                          </p>
                        </div>
                      )}

                      {/* D. VISUALIZE STATE */}
                      {LESSON_FLOW[currentStepIndex] === "VISUALIZE" && (
                        <div className="space-y-4 animate-fadeIn">
                          <span className="text-xs font-mono text-zinc-500 uppercase tracking-widest block">Stage 4: Visualize Execution</span>
                          <h3 className="text-lg font-extrabold text-white">Call Stack Tracing</h3>
                          <p className="text-xs text-zinc-400 leading-relaxed">
                            Code execution is not magical—it is deterministic. Before we write code in the sandbox on the right, look at the call stack frames panel on the left.
                          </p>
                          
                          {/* Interactive Skiena Video Integration */}
                          <div className="p-4 bg-indigo-950/10 border border-indigo-900/20 rounded-xl space-y-3">
                            <span className="text-xs uppercase font-mono text-indigo-300 font-bold block">Steven Skiena Lecture (Integration)</span>
                            <p className="text-[11px] text-zinc-400 leading-relaxed">We have mapped the matching video frame segment (12:40 ➔ 18:15) of Skiena's Lecture.</p>
                            
                            {!skienaQuestionAnswered ? (
                              <div className="space-y-2">
                                <span className="text-xs font-semibold text-white block">AI pause checkpoint: What data structure does the computer use to trace function returns?</span>
                                <div className="flex gap-2">
                                  <input 
                                    type="text" 
                                    value={skienaAnswer} 
                                    onChange={(e) => setSkienaAnswer(e.target.value)}
                                    placeholder="Type answer (e.g. Stack, Queue)..." 
                                    className="flex-1 bg-zinc-950 border border-zinc-900 rounded-lg px-3 py-1.5 text-xs text-white placeholder-zinc-700 focus:outline-none focus:border-indigo-500"
                                  />
                                  <button
                                    onClick={() => {
                                      if (skienaAnswer.toLowerCase().includes("stack")) {
                                        setSkienaQuestionAnswered(true);
                                      } else {
                                        alert("Try again!");
                                      }
                                    }}
                                    className="px-3 bg-indigo-500 hover:bg-indigo-600 text-white font-bold text-xs rounded-lg transition-colors"
                                  >
                                    Verify
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <div className="flex gap-2 items-center text-xs text-emerald-400 bg-emerald-950/20 border border-emerald-900/40 p-2.5 rounded-lg">
                                <CheckCircle className="h-4 w-4 shrink-0" />
                                <span>Verified! Stack memory structure unlocked. Video segments synced.</span>
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* E. BUILD STATE */}
                      {LESSON_FLOW[currentStepIndex] === "BUILD" && (
                        <div className="space-y-4 animate-fadeIn">
                          <span className="text-xs font-mono text-zinc-500 uppercase tracking-widest block">Stage 5: Build Exercise</span>
                          <h3 className="text-lg font-extrabold text-white">Write Your First Function</h3>
                          <p className="text-xs text-zinc-400 leading-relaxed">
                            {lessonDefinition.states.find((s: any) => s.type === "build").exercise_description}
                          </p>
                          <div className="bg-zinc-950/40 border border-zinc-900 p-3 rounded-lg text-xs leading-relaxed text-zinc-400">
                            <strong>Instructions:</strong> Use the editor on the right to implement your solution. Check test case statuses, progressive hints, and compilation errors.
                          </div>
                        </div>
                      )}

                      {/* F. CHALLENGE STATE */}
                      {LESSON_FLOW[currentStepIndex] === "CHALLENGE" && (
                        <div className="space-y-4 animate-fadeIn">
                          <span className="text-xs font-mono text-zinc-500 uppercase tracking-widest block">Stage 6: Mini Mission Challenge</span>
                          <h3 className="text-lg font-extrabold text-white">Complexity Constraint Check</h3>
                          <p className="text-xs text-zinc-400 leading-relaxed">
                            {lessonDefinition.states.find((s: any) => s.type === "challenge").exercise_description}
                          </p>
                          <div className="p-3 bg-indigo-950/10 border border-indigo-900/20 rounded-lg text-[11px] text-indigo-300 font-mono leading-relaxed">
                            Constraint: Write a helper logic returning original value if discount is invalid. Space: O(1).
                          </div>
                        </div>
                      )}

                      {/* G. TEACH BACK STATE */}
                      {LESSON_FLOW[currentStepIndex] === "TEACH_BACK" && (
                        <div className="space-y-4 animate-fadeIn">
                          <span className="text-xs font-mono text-zinc-500 uppercase tracking-widest block">Stage 7: Teach Back (Explanation)</span>
                          <h3 className="text-lg font-extrabold text-white">Review Concept Clarity</h3>
                          <p className="text-xs text-zinc-400 leading-relaxed">
                            {lessonDefinition.states.find((s: any) => s.type === "teach_back").prompt}
                          </p>

                          <textarea
                            value={teachbackText}
                            onChange={(e) => setTeachbackText(e.target.value)}
                            placeholder="Write your explanation here..."
                            rows={5}
                            className="w-full bg-zinc-950 border border-zinc-900 rounded-xl p-4 text-xs text-white placeholder-zinc-700 focus:outline-none focus:border-indigo-500 transition-colors resize-none"
                          />

                          {teachbackResult ? (
                            <div className="p-4 bg-zinc-950 border border-zinc-900 rounded-xl space-y-2 text-xs">
                              <div className="flex justify-between items-center">
                                <span className="font-bold text-white block">🤖 AI Mentor Grading</span>
                                <span className="text-xs font-bold text-indigo-400 font-mono">{teachbackResult.score}/10 Score</span>
                              </div>
                              <p className="text-zinc-400 leading-relaxed">
                                {teachbackResult.feedback}
                              </p>
                            </div>
                          ) : (
                            <button
                              disabled={teachbackLoading || !teachbackText.trim()}
                              onClick={handleSubmitTeachback}
                              className="w-full py-3 bg-indigo-500 hover:bg-indigo-600 disabled:opacity-40 disabled:pointer-events-none text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition-colors shadow-lg shadow-indigo-500/10"
                            >
                              {teachbackLoading ? (
                                <>
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                  AI Evaluating...
                                </>
                              ) : (
                                "Submit Explanation"
                              )}
                            </button>
                          )}
                        </div>
                      )}

                      {/* H. INTERVIEW STATE */}
                      {LESSON_FLOW[currentStepIndex] === "INTERVIEW" && (
                        <div className="space-y-4 animate-fadeIn">
                          <span className="text-xs font-mono text-zinc-500 uppercase tracking-widest block">Stage 8: Timed Interview Mode</span>
                          <div className="flex justify-between items-center">
                            <h3 className="text-lg font-extrabold text-white">Can you solve without help?</h3>
                            <span className="text-xs font-bold text-amber-500 font-mono flex items-center gap-1">
                              <Clock className="h-3.5 w-3.5 animate-pulse" />
                              {formatTime(interviewTimeLeft)}
                            </span>
                          </div>
                          
                          <p className="text-xs text-zinc-400 leading-relaxed">
                            This mode simulates a technical assessment. All progressive hints are disabled, the tutor is silent, and replay traces are locked until you submit.
                          </p>

                          {!interviewActive && !interviewResult && (
                            <button
                              onClick={() => {
                                setInterviewActive(true);
                                setInterviewCode(editorCode);
                              }}
                              className="w-full py-3 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white text-xs font-bold rounded-xl transition-colors shadow-lg shadow-amber-500/10"
                            >
                              Start Assessment Timer
                            </button>
                          )}

                          {interviewActive && (
                            <div className="space-y-3">
                              <div className="p-3 bg-zinc-950 border border-zinc-900 rounded-lg text-xs leading-relaxed text-zinc-400">
                                <strong>Assessment active.</strong> Code editor sandbox is synced with target challenge test cases. Click below to compile and evaluate.
                              </div>
                              <button
                                onClick={handleInterviewSubmit}
                                className="w-full py-3 bg-indigo-500 hover:bg-indigo-600 text-white text-xs font-bold rounded-xl transition-colors shadow-lg"
                              >
                                Submit Interview Solution
                              </button>
                            </div>
                          )}

                          {interviewResult && (
                            <div className={`p-4 rounded-xl border text-xs space-y-2 ${
                              interviewResult.passed_all 
                                ? "bg-emerald-950/20 border-emerald-900/40 text-emerald-300"
                                : "bg-red-950/20 border-red-900/40 text-red-300"
                            }`}>
                              <span className="font-bold block uppercase tracking-wider font-mono">
                                {interviewResult.passed_all ? "✓ Interview Cleared!" : "! Assessment Failed"}
                              </span>
                              <p className="leading-relaxed">
                                {interviewResult.passed_all 
                                  ? "Excellent. You solved the challenge under timed conditions. Interview Readiness badge unlocked." 
                                  : "Some test cases failed. Reset the timer and try again."}
                              </p>
                            </div>
                          )}
                        </div>
                      )}

                      {/* I. MASTERY STATE */}
                      {LESSON_FLOW[currentStepIndex] === "MASTERY" && (
                        <div className="space-y-5 animate-fadeIn">
                          <span className="text-xs font-mono text-zinc-500 uppercase tracking-widest block">Stage 9: Mastery Updated</span>
                          <div className="text-center space-y-2">
                            <div className="h-14 w-14 rounded-full bg-indigo-500/10 flex items-center justify-center mx-auto text-2xl shadow-lg shadow-indigo-500/10">
                              🏆
                            </div>
                            <h4 className="font-extrabold text-white text-lg">Curriculum Complete!</h4>
                            <p className="text-xs text-zinc-400">Concept levels successfully updated in your Career OS Profile.</p>
                          </div>

                          {/* Skill checklist unlocked */}
                          <div className="p-4 bg-zinc-950 border border-zinc-900 rounded-xl space-y-3">
                            <span className="text-xs uppercase font-mono text-zinc-500 tracking-wider">Acquired Assets</span>
                            <div className="flex gap-2">
                              <button
                                onClick={downloadFlashcards}
                                className="flex-1 py-2.5 border border-zinc-800 hover:bg-zinc-900 text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-colors"
                              >
                                <FileDown className="h-4 w-4" />
                                Download Flashcards
                              </button>
                            </div>
                          </div>

                          <button
                            onClick={() => {
                              handleMasteryUpdate();
                              setActiveTab("roadmap");
                            }}
                            className="w-full py-3 bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-600 hover:to-violet-700 text-white text-xs font-bold rounded-xl transition-all duration-200 shadow-lg shadow-indigo-500/15"
                          >
                            Sync Profile & Return
                          </button>
                        </div>
                      )}

                    </div>
                  )}

                  {/* Navigation State controls */}
                  <div className="flex items-center justify-between border-t border-zinc-900 pt-4 mt-6">
                    <button
                      disabled={currentStepIndex === 0}
                      onClick={() => {
                        setCurrentStepIndex(currentStepIndex - 1);
                        setActiveHint("");
                      }}
                      className="px-3 py-1.5 border border-zinc-900 hover:bg-zinc-900 text-zinc-400 hover:text-zinc-200 text-xs font-medium rounded-lg transition-colors flex items-center gap-0.5 disabled:opacity-30 disabled:pointer-events-none"
                    >
                      <ChevronLeft className="h-3.5 w-3.5" />
                      Back
                    </button>
                    <span className="text-xs font-mono text-zinc-500">Step {currentStepIndex + 1} of {LESSON_FLOW.length}</span>
                    <button
                      disabled={currentStepIndex === LESSON_FLOW.length - 1}
                      onClick={() => {
                        if (LESSON_FLOW[currentStepIndex] === "PREDICT" && !predictionSubmitted) {
                          alert("Submit your prediction first!");
                          return;
                        }
                        if (LESSON_FLOW[currentStepIndex] === "VISUALIZE" && !skienaQuestionAnswered) {
                          alert("Answer the Skiena lecture question first!");
                          return;
                        }
                        if (LESSON_FLOW[currentStepIndex] === "BUILD" && (!executionResult || !executionResult.passed_all)) {
                          alert("Build the exercise and pass all test cases first!");
                          return;
                        }
                        if (LESSON_FLOW[currentStepIndex] === "CHALLENGE" && (!executionResult || !executionResult.passed_all)) {
                          alert("Solve the challenge and pass all test cases first!");
                          return;
                        }
                        if (LESSON_FLOW[currentStepIndex] === "TEACH_BACK" && !teachbackResult) {
                          alert("Submit your teach back explanation first!");
                          return;
                        }
                        if (LESSON_FLOW[currentStepIndex] === "INTERVIEW" && !interviewResult?.passed_all) {
                          alert("Clear the interview assessment challenge first!");
                          return;
                        }

                        setCurrentStepIndex(currentStepIndex + 1);
                        setActiveHint("");
                        
                        if (LESSON_FLOW[currentStepIndex + 1] === "CHALLENGE" && lessonDefinition) {
                          const chalState = lessonDefinition.states.find((s: any) => s.type === "challenge");
                          if (chalState) {
                            setEditorCode(chalState.code_template);
                            setExecutionResult(null);
                            setTraceHistory([]);
                          }
                        }
                      }}
                      className="px-3 py-1.5 bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 text-white text-xs font-semibold rounded-lg transition-colors flex items-center gap-0.5 disabled:opacity-30 disabled:pointer-events-none"
                    >
                      Next
                      <ChevronRight className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>

                {/* 3. RIGHT PANE (CODE SANDBOX & HINT CONSOLE) - 4 COLS */}
                <div className="lg:col-span-4 flex flex-col justify-between gap-4">
                  {/* Textarea Code Editor */}
                  <div className="bg-zinc-900/30 border border-zinc-900 rounded-3xl p-5 flex flex-col gap-3 flex-1">
                    <div className="flex items-center justify-between border-b border-zinc-900 pb-3">
                      <div className="flex items-center gap-2 text-xs">
                        <Code className="h-4 w-4 text-indigo-400" />
                        <span className="font-bold text-white font-mono">sandbox</span>
                        <span className="text-[10px] text-zinc-500 font-mono italic">(Multi-Runner Sandbox Active)</span>
                      </div>
                      
                      {/* V2 WebSockets Multiplayer Button */}
                      <button
                        onClick={() => {
                          const rId = prompt("Enter multiplayer Interview Room ID to sync workspace (e.g. room-5):");
                          if (rId) {
                            setRoomId(rId);
                            joinMultiplayerWorkspace();
                          }
                        }}
                        className={`px-2.5 py-1 rounded-md text-[10px] font-bold font-mono transition-colors flex items-center gap-1 border ${
                          isMultiplayer
                            ? "bg-emerald-950/20 border-emerald-900/40 text-emerald-400"
                            : "bg-zinc-950 border-zinc-900 text-zinc-400 hover:border-zinc-700"
                        }`}
                      >
                        <Users className="h-3 w-3" />
                        {isMultiplayer ? "Multiplayer Linked" : "Go Multiplayer"}
                      </button>
                    </div>

                    {isMultiplayer && (
                      <div className="flex items-center justify-between bg-zinc-950/80 border border-zinc-900 rounded-xl px-3.5 py-2 text-[10px] font-mono">
                        <span className="text-zinc-500">Room Status:</span>
                        <span className="text-indigo-400 font-bold animate-pulse">{peerStatus}</span>
                      </div>
                    )}

                    <div className="relative flex-1 flex flex-col">
                      <textarea
                        value={interviewActive ? interviewCode : editorCode}
                        onChange={(e) => handleCodeChange(e.target.value)}
                        className="w-full flex-1 bg-zinc-950 border border-zinc-900 rounded-xl p-4 text-xs font-mono text-zinc-300 placeholder-zinc-700 focus:outline-none focus:border-indigo-500 transition-colors resize-none"
                        style={{ tabSize: 4 }}
                      />
                    </div>

                    {/* Console actions */}
                    <div className="flex justify-between items-center pt-2">
                      <div className="flex gap-2">
                        {LESSON_FLOW[currentStepIndex] === "BUILD" && (
                          <button
                            type="button"
                            disabled={executionLoading || !editorCode.trim()}
                            onClick={() => handleRunCode("build")}
                            className="px-4 py-2 bg-indigo-500 hover:bg-indigo-600 disabled:opacity-30 disabled:pointer-events-none text-white text-xs font-bold rounded-lg flex items-center gap-1 transition-colors shadow-lg shadow-indigo-500/10"
                          >
                            {executionLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Play className="h-3.5 w-3.5" />}
                            Run Code
                          </button>
                        )}
                        {LESSON_FLOW[currentStepIndex] === "CHALLENGE" && (
                          <button
                            type="button"
                            disabled={executionLoading || !editorCode.trim()}
                            onClick={() => handleRunCode("challenge")}
                            className="px-4 py-2 bg-indigo-500 hover:bg-indigo-600 disabled:opacity-30 disabled:pointer-events-none text-white text-xs font-bold rounded-lg flex items-center gap-1 transition-colors shadow-lg shadow-indigo-500/10"
                          >
                            {executionLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Play className="h-3.5 w-3.5" />}
                            Evaluate Challenge
                          </button>
                        )}
                      </div>
                      
                      {/* Hint Trigger */}
                      {!interviewActive && (LESSON_FLOW[currentStepIndex] === "BUILD" || LESSON_FLOW[currentStepIndex] === "CHALLENGE") && (
                        <button
                          type="button"
                          disabled={hintLoading}
                          onClick={() => handleGetHint(LESSON_FLOW[currentStepIndex].toLowerCase() as any)}
                          className="px-3 py-2 border border-zinc-800 hover:bg-zinc-900 text-zinc-400 hover:text-zinc-200 text-xs font-semibold rounded-lg flex items-center gap-1 transition-colors"
                        >
                          <HelpCircle className="h-3.5 w-3.5 text-zinc-500" />
                          Need Hint?
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Output Terminal Console */}
                  <div className="bg-zinc-900/30 border border-zinc-900 rounded-3xl p-5 min-h-[160px] flex flex-col gap-2">
                    <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider block">Terminal Outputs</span>
                    
                    <div className="bg-zinc-950 border border-zinc-900 rounded-xl p-4 flex-1 font-mono text-[11px] overflow-y-auto max-h-[160px] space-y-2">
                      {executionLoading && (
                        <div className="text-zinc-600 flex items-center gap-2">
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          <span>Compiling sandboxed subprocess...</span>
                        </div>
                      )}
                      
                      {!executionLoading && executionResult && (
                        <div className="space-y-3">
                          {/* Stdout / Stderr logs */}
                          {executionResult.stdout && (
                            <div>
                              <span className="text-zinc-500 block">stdout:</span>
                              <pre className="text-zinc-300">{executionResult.stdout}</pre>
                            </div>
                          )}
                          {executionResult.stderr && (
                            <div>
                              <span className="text-red-500 block">stderr:</span>
                              <pre className="text-red-400">{executionResult.stderr}</pre>
                            </div>
                          )}

                          {/* Test cases result grids */}
                          {executionResult.test_results && executionResult.test_results.length > 0 && (
                            <div className="space-y-1.5 pt-2 border-t border-zinc-900/80">
                              <span className="text-zinc-500 block">Verification Tests ({executionResult.test_results.filter(t => t.passed).length}/{executionResult.test_results.length}):</span>
                              <div className="space-y-1">
                                {executionResult.test_results.map((tr, idx) => (
                                  <div key={idx} className="flex justify-between items-center text-[10px]">
                                    <span className="text-zinc-400">tc({tr.input}) ➔ {tr.expected}</span>
                                    <span className={tr.passed ? "text-emerald-400 font-bold" : "text-red-400 font-bold"}>
                                      {tr.passed ? "PASS" : `FAIL (${tr.actual})`}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* AI diagnostic reviews */}
                          {executionResult.error_explanation && (
                            <div className="p-3 bg-zinc-900 border border-zinc-800 rounded-lg text-zinc-400 leading-relaxed text-[10px] space-y-1">
                              <span className="font-bold text-white block">🤖 AI Mentor Note</span>
                              <p>{executionResult.error_explanation}</p>
                            </div>
                          )}
                          {executionResult.ai_optimization_suggestion && (
                            <div className="p-3 bg-indigo-950/20 border border-indigo-900/30 rounded-lg text-zinc-300 leading-relaxed text-[10px] space-y-1">
                              <span className="font-bold text-indigo-400 block">✨ Key Insight</span>
                              <p>{executionResult.ai_optimization_suggestion}</p>
                            </div>
                          )}
                        </div>
                      )}

                      {!executionLoading && !executionResult && (
                        <span className="text-zinc-700">Submit code execution above to inspect compiler variables...</span>
                      )}
                    </div>

                    {/* Hint overlay message */}
                    {!interviewActive && activeHint && (
                      <div className="p-3.5 bg-zinc-955 border border-indigo-500/20 rounded-xl text-xs flex gap-2.5 text-indigo-200 mt-2 animate-fadeIn">
                        <Sparkles className="h-4.5 w-4.5 text-indigo-400 shrink-0 mt-0.5" />
                        <div>
                          <span className="font-extrabold uppercase tracking-wider text-[9px] text-indigo-400 font-mono block">Progressive Hint ({hintType.toUpperCase()})</span>
                          <p className="leading-relaxed mt-0.5">{activeHint}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

              </div>
            )}

            {/* RESUME BUILDER TAB */}
            {activeTab === "resume" && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Form column */}
                <div className="bg-zinc-900/30 border border-zinc-900 rounded-3xl p-6 space-y-5 h-fit">
                  <div>
                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                      <FileText className="h-5 w-5 text-indigo-400" />
                      Project Bullet Analyzer
                    </h3>
                    <p className="text-zinc-500 text-xs mt-1 leading-relaxed">
                      Enter your public GitHub repo URL. Gemini will inspect your README and generate verified, impact-driven resume bullets.
                    </p>
                  </div>

                  <form onSubmit={handleResumeSubmit} className="space-y-4">
                    <div className="space-y-2">
                      <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400 font-mono">GitHub Repo URL</label>
                      <div className="relative">
                        <svg className="absolute left-3 top-3.5 h-4.5 w-4.5 text-zinc-600" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"/>
                        </svg>
                        <input
                          type="url"
                          required
                          value={githubUrl}
                          onChange={(e) => setGithubUrl(e.target.value)}
                          placeholder="https://github.com/username/project"
                          className="w-full bg-zinc-955 border border-zinc-800 rounded-xl py-3 pl-10 pr-4 text-sm text-white placeholder-zinc-700 focus:outline-none focus:border-indigo-500 transition-colors"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400 font-mono">Target Role</label>
                      <select
                        value={resumeTargetRole}
                        onChange={(e) => setResumeTargetRole(e.target.value)}
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-3 px-4 text-sm text-zinc-350 focus:outline-none focus:border-indigo-500 transition-colors"
                      >
                        <option value="frontend">Frontend Developer</option>
                        <option value="backend">Backend Engineer</option>
                        <option value="fullstack">Fullstack Engineer</option>
                        <option value="ai_ml">AI/ML Engineer</option>
                        <option value="devops">DevOps Engineer</option>
                      </select>
                    </div>

                    <div className="space-y-2">
                      <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400 font-mono">Project Description (Optional)</label>
                      <textarea
                        value={projectDesc}
                        onChange={(e) => setProjectDesc(e.target.value)}
                        placeholder="Detail any key features or optimizations you made (e.g. built using Redis caching, handled 20 requests/sec)"
                        rows={3}
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-4 text-sm text-white placeholder-zinc-700 focus:outline-none focus:border-indigo-500 transition-colors resize-none"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={resumeLoading}
                      className="w-full py-3 bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-600 hover:to-violet-700 disabled:opacity-40 disabled:pointer-events-none text-white text-sm font-bold rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/20 transition-all duration-200"
                    >
                      {resumeLoading ? (
                        <>
                          <Loader2 className="h-4.5 w-4.5 animate-spin" />
                          Inspecting Repo Content...
                        </>
                      ) : (
                        <>
                          <Sparkles className="h-4.5 w-4.5" />
                          Analyze Project
                        </>
                      )}
                    </button>
                  </form>
                </div>

                {/* Output analysis column */}
                <div className="lg:col-span-2">
                  {resumeLoading ? (
                    <div className="bg-zinc-900/30 border border-zinc-900 rounded-3xl p-16 flex flex-col items-center justify-center min-h-[400px]">
                      <Loader2 className="h-8 w-8 text-indigo-500 animate-spin mb-4" />
                      <p className="text-zinc-500 text-sm font-mono">AI Coach is reviewing your README files...</p>
                      <p className="text-xs text-zinc-600 mt-1 max-w-sm text-center leading-relaxed">This fetches your repository details and parses code complexity variables to score originality.</p>
                    </div>
                  ) : resumeAnalysis ? (
                    <div className="space-y-6 animate-fadeIn">
                      {/* Metric cards */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="bg-zinc-900/30 border border-zinc-900 p-5 rounded-2xl flex items-center justify-between">
                          <div>
                            <span className="text-xs font-mono text-zinc-500">ORIGINALITY SCORE</span>
                            <h4 className="text-2xl font-extrabold text-white mt-1">{resumeAnalysis.originality_score}/10</h4>
                          </div>
                          <span className={`text-2xl h-10 w-10 rounded-xl flex items-center justify-center font-bold ${
                            resumeAnalysis.originality_score >= 7 ? "bg-emerald-950/30 text-emerald-400" : "bg-amber-950/30 text-amber-400"
                          }`}>
                            {resumeAnalysis.originality_score >= 7 ? "✓" : "!"}
                          </span>
                        </div>

                        <div className="bg-zinc-900/30 border border-zinc-900 p-5 rounded-2xl flex items-center justify-between">
                          <div>
                            <span className="text-xs font-mono text-zinc-500">COMPLEXITY SCORE</span>
                            <h4 className="text-2xl font-extrabold text-white mt-1">{resumeAnalysis.complexity_score}/10</h4>
                          </div>
                          <span className="text-2xl h-10 w-10 rounded-xl bg-indigo-950/30 text-indigo-400 flex items-center justify-center font-bold">
                            ⚙
                          </span>
                        </div>
                      </div>

                      {/* Flag box if tutorial clone */}
                      {resumeAnalysis.is_tutorial_clone && (
                        <div className="p-4 bg-amber-955/20 border border-amber-900/40 rounded-xl text-amber-300 text-xs flex gap-3">
                          <AlertTriangle className="h-5 w-5 text-amber-400 shrink-0" />
                          <div>
                            <span className="font-extrabold block uppercase tracking-wider font-mono">Tutorial Clone Flagged!</span>
                            <p className="leading-relaxed mt-1">This repository appears to be a standard tutorial clone or basic dashboard template. Hiring managers see thousands of these. Read our \"What to build next\" guide below to add unique features.</p>
                          </div>
                        </div>
                      )}

                      {/* Main Bullet points */}
                      <div className="bg-zinc-900/30 border border-zinc-900 rounded-3xl p-6 space-y-4">
                        <div className="flex items-center justify-between border-b border-zinc-900 pb-3">
                          <h4 className="font-bold text-white text-sm">Resume Bullet Points (Impact-Driven)</h4>
                          <span className="text-xs text-zinc-500 font-mono">Copy to clipboard</span>
                        </div>

                        <div className="space-y-3">
                          {resumeAnalysis.generated_bullets.map((bullet: string, idx: number) => (
                            <div key={idx} className="group relative bg-zinc-950/40 border border-zinc-900 p-4 rounded-xl flex items-start justify-between gap-4 hover:border-zinc-800 transition-colors">
                              <p className="text-sm text-zinc-300 leading-relaxed pr-8">{bullet}</p>
                              <button
                                onClick={() => {
                                  navigator.clipboard.writeText(bullet);
                                  setCopiedIndex(idx);
                                  setTimeout(() => setCopiedIndex(null), 2000);
                                }}
                                className="absolute right-3 top-3.5 h-8 w-8 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-500 hover:text-white transition-colors"
                              >
                                {copiedIndex === idx ? (
                                  <Check className="h-4 w-4 text-emerald-400" />
                                ) : (
                                  <Copy className="h-4 w-4" />
                                )}
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Strength / Critique */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="bg-zinc-900/30 border border-zinc-900 p-5 rounded-2xl space-y-2">
                          <span className="text-xs uppercase tracking-widest font-mono text-emerald-400 font-bold">Strengths</span>
                          <p className="text-xs text-zinc-400 leading-relaxed">{resumeAnalysis.strength_feedback}</p>
                        </div>
                        <div className="bg-zinc-900/30 border border-zinc-900 p-5 rounded-2xl space-y-2">
                          <span className="text-xs uppercase tracking-widest font-mono text-amber-400 font-bold">Weaknesses</span>
                          <p className="text-xs text-zinc-400 leading-relaxed">{resumeAnalysis.weakness_feedback}</p>
                        </div>
                      </div>

                      {/* What to build next */}
                      <div className="bg-indigo-950/10 border border-indigo-900/20 p-5 rounded-2xl space-y-3">
                        <span className="text-xs uppercase tracking-widest font-mono text-indigo-400 font-bold block">Next Engineering Steps (Level Up)</span>
                        <p className="text-xs text-zinc-300 leading-relaxed">{resumeAnalysis.next_steps}</p>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-zinc-900/30 border border-zinc-900 rounded-3xl p-16 text-center text-zinc-500 flex flex-col items-center justify-center min-h-[400px]">
                      <FileText className="h-10 w-10 text-zinc-700 mb-3" />
                      <p className="text-sm font-medium">Configure project details and click \"Analyze Project\" on the left.</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-zinc-900 py-6 bg-zinc-955 mt-auto text-center text-xs text-zinc-600 font-mono">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p>© 2026 CodeMate. Crafted for the self-taught community.</p>
          <div className="flex gap-4">
            <a href="#" className="hover:text-zinc-400 transition-colors">Documentation</a>
            <a href="#" className="hover:text-zinc-400 transition-colors">Privacy</a>
            <a href="#" className="hover:text-zinc-400 transition-colors">Support</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
