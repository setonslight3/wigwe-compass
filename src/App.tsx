import React, { useState, useEffect, useRef } from "react";
import {
  GraduationCap,
  BookOpen,
  FileText,
  Lock,
  Unlock,
  Send,
  ChevronLeft,
  ChevronRight,
  Flag,
  X,
  Sparkles,
  Upload,
  User as UserIcon,
  ArrowRight,
  CheckCircle2,
  FileUp,
  Download,
  AlertCircle,
  Clock,
  Briefcase,
  HelpCircle,
  Menu,
  Sun,
  Moon,
  Trophy,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { User, Course, Material, Question, Progress, Tier, ChatMessage } from "./types";

export default function App() {
  // Navigation & User State
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isRegistering, setIsRegistering] = useState(false);
  const [currentView, setCurrentView] = useState<"login" | "dashboard" | "course-detail" | "quiz" | "admin">("login");
  
  // Leaderboard & Theme State
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [activeLeaderboardTier, setActiveLeaderboardTier] = useState<Tier>("easy");
  const [isLeaderboardLoading, setIsLeaderboardLoading] = useState(false);
  const [courseTab, setCourseTab] = useState<"curriculum" | "leaderboard">("curriculum");
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    return localStorage.getItem("theme") === "dark";
  });
  
  // Registration Form State
  const [regName, setRegName] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regLevel, setRegLevel] = useState<"100L" | "200L" | "300L" | "400L" | "500L">("400L");
  const [regDept, setRegDept] = useState("Computer Science");
  const [regRole, setRegRole] = useState<"student" | "admin">("student");
  const [loginEmail, setLoginEmail] = useState("student@university.edu");
  const [loginError, setLoginError] = useState("");

  // Course & Materials State
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [progressList, setProgressList] = useState<Progress[]>([]);

  // Active Quiz State
  const [activeTier, setActiveTier] = useState<Tier>("easy");
  const [quizQuestions, setQuizQuestions] = useState<Question[]>([]);
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);
  const [studentAnswers, setStudentAnswers] = useState<{ [key: number]: string }>({});
  const [flaggedQuestions, setFlaggedQuestions] = useState<{ [key: number]: boolean }>({});
  const [quizResult, setQuizResult] = useState<any>(null);
  const [isSubmittingQuiz, setIsSubmittingQuiz] = useState(false);
  const [timeLeft, setTimeLeft] = useState<number>(1800); // 30 minutes in seconds
  const [showTimeExpiredNotification, setShowTimeExpiredNotification] = useState<boolean>(false);

  const studentAnswersRef = useRef(studentAnswers);
  useEffect(() => {
    studentAnswersRef.current = studentAnswers;
  }, [studentAnswers]);

  const activeTierRef = useRef(activeTier);
  useEffect(() => {
    activeTierRef.current = activeTier;
  }, [activeTier]);

  const quizQuestionsRef = useRef(quizQuestions);
  useEffect(() => {
    quizQuestionsRef.current = quizQuestions;
  }, [quizQuestions]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const handleQuizTimeout = async () => {
    if (!currentUser || !selectedCourse) return;
    setIsSubmittingQuiz(true);
    setShowTimeExpiredNotification(true);

    const answersArray = quizQuestionsRef.current.map((_, idx) => studentAnswersRef.current[idx] || "");

    try {
      const res = await fetch("/api/progress/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: currentUser.id,
          courseId: selectedCourse.id,
          tier: activeTierRef.current,
          answers: answersArray,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setQuizResult(data);
        fetchProgress(currentUser.id);
        fetchLeaderboard(selectedCourse.id, activeTierRef.current);
      }
    } catch (e) {
      console.error("Error auto-submitting progress score on timeout", e);
    } finally {
      setIsSubmittingQuiz(false);
    }
  };

  useEffect(() => {
    if (currentView !== "quiz" || quizResult) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleQuizTimeout();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [currentView, quizResult]);

  // AI Tutor State
  const [isAiOpen, setIsAiOpen] = useState(false);
  const [aiMessage, setAiMessage] = useState("");
  const [aiHistory, setAiHistory] = useState<ChatMessage[]>([]);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const chatBottomRef = useRef<HTMLDivElement>(null);

  // Admin Panel State
  const [adminCourseId, setAdminCourseId] = useState("");
  const [adminMaterialName, setAdminMaterialName] = useState("");
  const [adminMaterialUrl, setAdminMaterialUrl] = useState("");
  const [adminMaterialType, setAdminMaterialType] = useState("pdf");
  const [adminUploadSuccess, setAdminUploadSuccess] = useState("");
  
  // Admin Quiz Generation
  const [adminBulkTier, setAdminBulkTier] = useState<Tier>("easy");
  const [adminBulkCount, setAdminBulkCount] = useState(50); // Set to 50 for valid, or other to test
  const [adminBulkResponse, setAdminBulkResponse] = useState("");
  const [adminBulkError, setAdminBulkError] = useState("");

  // In-Browser Material Viewer Modal State
  const [activeViewerMaterial, setActiveViewerMaterial] = useState<Material | null>(null);

  // Load baseline configurations
  useEffect(() => {
    // If we have a logged-in user, load courses and progress
    if (currentUser) {
      fetchCourses();
      fetchProgress(currentUser.id);
    }
  }, [currentUser]);

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  }, [isDarkMode]);

  const fetchLeaderboard = async (courseId: string, tier: Tier) => {
    setIsLeaderboardLoading(true);
    try {
      const res = await fetch(`/api/courses/${courseId}/tiers/${tier}/leaderboard`);
      if (res.ok) {
        const data = await res.json();
        setLeaderboard(data);
      }
    } catch (e) {
      console.error("Error fetching leaderboard", e);
    } finally {
      setIsLeaderboardLoading(false);
    }
  };

  useEffect(() => {
    if (selectedCourse) {
      fetchLeaderboard(selectedCourse.id, activeLeaderboardTier);
    }
  }, [selectedCourse, activeLeaderboardTier]);

  useEffect(() => {
    if (chatBottomRef.current) {
      chatBottomRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [aiHistory, isAiLoading]);

  const fetchCourses = async () => {
    try {
      const levelParam = currentUser?.role === "student" ? `?level=${currentUser.level}&department=${currentUser.department}` : "";
      const res = await fetch(`/api/courses${levelParam}`);
      if (res.ok) {
        const data = await res.json();
        setCourses(data);
      }
    } catch (e) {
      console.error("Error fetching courses", e);
    }
  };

  const fetchProgress = async (userId: string) => {
    try {
      const res = await fetch(`/api/progress/${userId}`);
      if (res.ok) {
        const data = await res.json();
        setProgressList(data);
      }
    } catch (e) {
      console.error("Error fetching progress", e);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError("");
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: loginEmail }),
      });
      if (res.ok) {
        const user = await res.json();
        setCurrentUser(user);
        if (user.role === "admin") {
          setCurrentView("admin");
          // Pre-select first course for admin convenience
          fetchCourses();
        } else {
          setCurrentView("dashboard");
        }
      } else {
        const err = await res.json();
        setLoginError(err.error || "Login failed. Check your email or register.");
      }
    } catch (e) {
      setLoginError("Server communication failed.");
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: regName,
          email: regEmail,
          level: regLevel,
          department: regDept,
          role: regRole,
        }),
      });
      if (res.ok) {
        const user = await res.json();
        setCurrentUser(user);
        if (user.role === "admin") {
          setCurrentView("admin");
        } else {
          setCurrentView("dashboard");
        }
      }
    } catch (e) {
      console.error("Registration failed", e);
    }
  };

  const selectCourse = async (course: Course) => {
    setSelectedCourse(course);
    setCurrentView("course-detail");
    try {
      const res = await fetch(`/api/courses/${course.id}/materials`);
      if (res.ok) {
        const data = await res.json();
        setMaterials(data);
      }
    } catch (e) {
      console.error("Error fetching course materials", e);
    }
  };

  const startQuiz = async (courseId: string, tier: Tier) => {
    setActiveTier(tier);
    setCurrentQuestionIdx(0);
    setStudentAnswers({});
    setFlaggedQuestions({});
    setQuizResult(null);
    setTimeLeft(1800);
    setShowTimeExpiredNotification(false);
    try {
      const res = await fetch(`/api/courses/${courseId}/tiers/${tier}/questions`);
      if (res.ok) {
        const questions = await res.json();
        setQuizQuestions(questions);
        setCurrentView("quiz");
      }
    } catch (e) {
      console.error("Error launching quiz questions", e);
    }
  };

  const handleSelectOption = (option: string) => {
    setStudentAnswers({
      ...studentAnswers,
      [currentQuestionIdx]: option,
    });
  };

  const toggleFlagQuestion = () => {
    setFlaggedQuestions({
      ...flaggedQuestions,
      [currentQuestionIdx]: !flaggedQuestions[currentQuestionIdx],
    });
  };

  const submitQuiz = async () => {
    if (!currentUser || !selectedCourse) return;
    setIsSubmittingQuiz(true);

    // Prepare answers matching indexes of loaded questions
    const answersArray = quizQuestions.map((_, idx) => studentAnswers[idx] || "");

    try {
      const res = await fetch("/api/progress/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: currentUser.id,
          courseId: selectedCourse.id,
          tier: activeTier,
          answers: answersArray,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setQuizResult(data);
        fetchProgress(currentUser.id); // Reload progress mapping
        fetchLeaderboard(selectedCourse.id, activeTier); // Update leaderboard
      }
    } catch (e) {
      console.error("Error submitting progress score", e);
    } finally {
      setIsSubmittingQuiz(false);
    }
  };

  // Socratic AI Senders
  const handleSendAi = async (customText?: string) => {
    const textToSend = customText || aiMessage;
    if (!textToSend.trim() || !currentUser || !selectedCourse) return;

    const userMsg: ChatMessage = {
      id: Math.random().toString(),
      sender: "user",
      text: textToSend,
      timestamp: new Date().toLocaleTimeString(),
    };

    setAiHistory((prev) => [...prev, userMsg]);
    if (!customText) setAiMessage("");
    setIsAiLoading(true);

    try {
      const res = await fetch("/api/ai/tutor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: textToSend,
          courseId: selectedCourse.id,
          userId: currentUser.id,
          chatHistory: aiHistory,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        const botMsg: ChatMessage = {
          id: Math.random().toString(),
          sender: "bot",
          text: data.text,
          timestamp: new Date().toLocaleTimeString(),
        };
        setAiHistory((prev) => [...prev, botMsg]);
      } else {
        const botMsg: ChatMessage = {
          id: Math.random().toString(),
          sender: "bot",
          text: "I experienced difficulty connecting. Let's make sure our tutor network is available.",
          timestamp: new Date().toLocaleTimeString(),
        };
        setAiHistory((prev) => [...prev, botMsg]);
      }
    } catch (e) {
      console.error("AI Error", e);
    } finally {
      setIsAiLoading(false);
    }
  };

  // Admin Tools
  const handleAdminUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    setAdminUploadSuccess("");
    if (!adminCourseId || !adminMaterialName || !adminMaterialUrl) return;

    try {
      const res = await fetch("/api/admin/upload-material", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          courseId: adminCourseId,
          fileName: adminMaterialName,
          fileUrl: adminMaterialUrl,
          fileType: adminMaterialType,
        }),
      });

      if (res.ok) {
        setAdminUploadSuccess("Academic material uploaded and logged successfully!");
        setAdminMaterialName("");
        setAdminMaterialUrl("");
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleAdminGenerateBulk = async (e: React.FormEvent) => {
    e.preventDefault();
    setAdminBulkResponse("");
    setAdminBulkError("");
    if (!adminCourseId) {
      setAdminBulkError("Please select a valid course first.");
      return;
    }

    // Generate either exactly 50 or the custom number to test backend size validation
    const questionPayload = [];
    for (let i = 1; i <= adminBulkCount; i++) {
      questionPayload.push({
        questionText: `Admin custom uploaded sample question #${i} testing critical validation rules.`,
        options: ["Option A (Correct)", "Option B", "Option C", "Option D"],
        correctAnswer: "A",
        explanation: "Detail explanation validating exact admin tier requirements.",
      });
    }

    try {
      const res = await fetch("/api/admin/questions/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          courseId: adminCourseId,
          tier: adminBulkTier,
          questions: questionPayload,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setAdminBulkResponse(data.message || `Uploaded exactly ${adminBulkCount} questions successfully!`);
      } else {
        setAdminBulkError(data.error || "Validation error occurred.");
      }
    } catch (e: any) {
      setAdminBulkError("Network upload error.");
    }
  };

  // Helper calculation for overall student progress
  const getOverallProgress = () => {
    if (progressList.length === 0) return 0;
    const completedCount = progressList.filter((p) => p.status === "completed").length;
    return Math.round((completedCount / progressList.length) * 100) || 78; // Default 78 from mock
  };

  return (
    <div className="bg-slate-50 dark:bg-slate-950 min-h-screen text-slate-800 dark:text-slate-100 font-sans antialiased relative transition-colors duration-300">
      
      {/* 1. ONBOARDING & LOGIN SCREEN */}
      {currentView === "login" && (
        <div className="min-h-screen flex flex-col items-center justify-center px-4 py-12 relative overflow-hidden">
          {/* Subtle background nodes */}
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-100 dark:bg-blue-950/20 rounded-full mix-blend-multiply filter blur-3xl opacity-40 animate-pulse" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-slate-200 dark:bg-slate-900/20 rounded-full mix-blend-multiply filter blur-3xl opacity-40 animate-pulse delay-75" />

          {/* Floating Dark Mode Toggle */}
          <div className="absolute top-6 right-6 z-50">
            <button
              onClick={() => setIsDarkMode(!isDarkMode)}
              className="p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-lg hover:scale-105 active:scale-95 transition-all text-slate-700 dark:text-slate-300 cursor-pointer"
              title={isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
            >
              {isDarkMode ? <Sun className="h-5 w-5 text-amber-400" /> : <Moon className="h-5 w-5" />}
            </button>
          </div>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full max-w-md text-center mb-8 z-10"
          >
            <div className="inline-flex p-4 bg-slate-900 dark:bg-slate-850 text-white rounded-2xl shadow-xl mb-4">
              <GraduationCap className="h-10 w-10" />
            </div>
            <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white font-serif mb-2">Compass Guide</h1>
            <p className="text-slate-600 dark:text-slate-400 font-medium">Navigating your academic journey with precision and clarity.</p>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl shadow-2xl p-8 z-10"
          >
            <AnimatePresence mode="wait">
              {!isRegistering ? (
                // Login View
                <motion.div
                  key="login-form"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  className="space-y-6"
                >
                  <div>
                    <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Welcome Back</h2>
                    <p className="text-sm text-slate-500 dark:text-slate-400">Access your curated departmental resources.</p>
                  </div>

                  {loginError && (
                    <div className="p-3 bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-400 text-xs rounded-lg flex items-center gap-2">
                      <AlertCircle className="h-4 w-4 flex-shrink-0" />
                      <span>{loginError}</span>
                    </div>
                  )}

                  <form onSubmit={handleLogin} className="space-y-4">
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5">Email Address</label>
                      <input 
                        type="email" 
                        value={loginEmail}
                        onChange={(e) => setLoginEmail(e.target.value)}
                        placeholder="student@university.edu"
                        className="w-full bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3.5 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-slate-900 dark:focus:ring-white transition-all"
                        required
                      />
                      <p className="text-[11px] text-slate-400 mt-1">Try <span className="font-semibold text-slate-500 dark:text-slate-300">student@university.edu</span> or <span className="font-semibold text-slate-500 dark:text-slate-300">admin@university.edu</span></p>
                    </div>

                    <div>
                      <div className="flex justify-between mb-1.5">
                        <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400">Password</label>
                        <a href="#" className="text-xs text-blue-600 dark:text-blue-400 hover:underline">Forgot?</a>
                      </div>
                      <input 
                        type="password" 
                        defaultValue="••••••••"
                        className="w-full bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3.5 text-sm text-slate-400 cursor-not-allowed"
                        disabled
                      />
                    </div>

                    <button 
                      type="submit"
                      className="w-full bg-slate-900 hover:bg-slate-800 dark:bg-slate-800 dark:hover:bg-slate-750 text-white font-semibold py-4 rounded-xl shadow-lg transition-transform active:scale-[0.98] flex items-center justify-center gap-2 cursor-pointer"
                    >
                      Login to Dashboard
                      <ArrowRight className="h-4 w-4" />
                    </button>
                  </form>

                  <div className="text-center pt-2">
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      Don't have an account?{" "}
                      <button 
                        onClick={() => setIsRegistering(true)}
                        className="text-slate-900 dark:text-white font-bold hover:underline cursor-pointer"
                      >
                        Register
                      </button>
                    </p>
                  </div>
                </motion.div>
              ) : (
                // Registration View
                <motion.div
                  key="register-form"
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  className="space-y-6"
                >
                  <div className="flex items-center gap-3">
                    <button 
                      onClick={() => setIsRegistering(false)}
                      className="p-1.5 rounded-full hover:bg-slate-100"
                    >
                      <ChevronLeft className="h-5 w-5 text-slate-600" />
                    </button>
                    <div>
                      <h2 className="text-2xl font-bold text-slate-900">Academic Profile</h2>
                      <p className="text-sm text-slate-500">Personalize your study experience.</p>
                    </div>
                  </div>

                  <form onSubmit={handleRegister} className="space-y-4">
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">Full Name</label>
                      <input 
                        type="text" 
                        value={regName}
                        onChange={(e) => setRegName(e.target.value)}
                        placeholder="Alex Johnson"
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3.5 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 transition-all"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">Email Address</label>
                      <input 
                        type="email" 
                        value={regEmail}
                        onChange={(e) => setRegEmail(e.target.value)}
                        placeholder="student@university.edu"
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3.5 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 transition-all"
                        required
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">Level</label>
                        <select 
                          value={regLevel}
                          onChange={(e: any) => setRegLevel(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3.5 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 transition-all"
                        >
                          <option value="100L">100L</option>
                          <option value="200L">200L</option>
                          <option value="300L">300L</option>
                          <option value="400L">400L</option>
                          <option value="500L">500L</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">Department</label>
                        <select 
                          value={regDept}
                          onChange={(e) => setRegDept(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3.5 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 transition-all"
                        >
                          <option value="Computer Science">Computer Science</option>
                          <option value="Economics">Economics</option>
                          <option value="Biochemistry">Biochemistry</option>
                          <option value="Electrical Engineering">Electrical Eng.</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">System Role</label>
                      <div className="flex gap-4">
                        <label className="flex items-center gap-2 cursor-pointer text-sm font-medium">
                          <input 
                            type="radio" 
                            name="regRole"
                            checked={regRole === "student"}
                            onChange={() => setRegRole("student")}
                            className="text-slate-900 focus:ring-slate-900"
                          />
                          Student
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer text-sm font-medium">
                          <input 
                            type="radio" 
                            name="regRole"
                            checked={regRole === "admin"}
                            onChange={() => setRegRole("admin")}
                            className="text-slate-900 focus:ring-slate-900"
                          />
                          Faculty Admin
                        </label>
                      </div>
                    </div>

                    <button 
                      type="submit"
                      className="w-full bg-slate-900 hover:bg-slate-800 text-white font-semibold py-4 rounded-xl shadow-lg transition-transform active:scale-[0.98] flex items-center justify-center gap-2 mt-2"
                    >
                      Complete Profile Setup
                      <ArrowRight className="h-4 w-4" />
                    </button>
                  </form>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </div>
      )}

      {/* 2. STUDENT DASHBOARD VIEW */}
      {currentView === "dashboard" && currentUser && (
        <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 transition-colors duration-300">
          {/* Top AppBar */}
          <header className="sticky top-0 w-full bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 z-30">
            <div className="max-w-7xl mx-auto px-6 h-20 flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-slate-900 dark:bg-slate-800 text-white flex items-center justify-center shadow-lg">
                  <GraduationCap className="h-6 w-6" />
                </div>
                <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white font-serif">Compass Guide</h1>
              </div>

              <div className="flex items-center gap-4">
                {currentUser.role === "admin" && (
                  <button 
                    onClick={() => setCurrentView("admin")}
                    className="text-xs bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 font-semibold px-3 py-1.5 rounded-lg text-slate-700 dark:text-slate-300"
                  >
                    Admin Panel
                  </button>
                )}
                <div className="text-right hidden sm:block">
                  <p className="text-sm font-semibold text-slate-900 dark:text-white">{currentUser.name}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">{currentUser.email}</p>
                </div>
                <button
                  onClick={() => setIsDarkMode(!isDarkMode)}
                  className="p-2 text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all cursor-pointer"
                  title={isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
                >
                  {isDarkMode ? <Sun className="h-5 w-5 text-amber-400" /> : <Moon className="h-5 w-5" />}
                </button>
                <button 
                  onClick={() => {
                    setCurrentUser(null);
                    setCurrentView("login");
                  }}
                  className="p-2 text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl transition-all cursor-pointer"
                  title="Logout"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>
          </header>

          <main className="flex-1 max-w-4xl mx-auto w-full px-6 py-8 space-y-8 pb-24">
            {/* Profile Intro */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Student Portal</span>
                <h2 className="text-3xl font-bold font-serif text-slate-900 dark:text-white mt-1">Hello, {currentUser.name}</h2>
                <div className="flex flex-wrap gap-2 mt-2">
                  <span className="bg-slate-900 dark:bg-slate-800 text-white text-xs font-semibold px-3 py-1 rounded-full">{currentUser.level}</span>
                  <span className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold px-3 py-1 rounded-full">{currentUser.department} Dept.</span>
                </div>
              </div>
            </div>

            {/* Bento Progress Stats */}
            <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="md:col-span-1 p-6 bg-white border border-slate-200/80 rounded-2xl flex items-center justify-between shadow-sm">
                <div className="space-y-1">
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Overall Progress</p>
                  <p className="text-3xl font-bold text-slate-950 font-serif">{getOverallProgress()}%</p>
                </div>
                <div className="w-14 h-14 bg-emerald-100 text-emerald-800 rounded-full flex items-center justify-center shadow-inner">
                  <CheckCircle2 className="h-7 w-7" />
                </div>
              </div>

              <div className="p-6 bg-white border border-slate-200/80 rounded-2xl space-y-1 shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">My Curriculum</p>
                <p className="text-3xl font-bold text-slate-950 font-serif">{courses.length}</p>
                <p className="text-[11px] text-slate-400 font-medium">Core courses for {currentUser.level}</p>
              </div>

              <div className="p-6 bg-white border border-slate-200/80 rounded-2xl space-y-1 shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Socratic Chat Sessions</p>
                <p className="text-3xl font-bold text-slate-950 font-serif">Interactive</p>
                <p className="text-[11px] text-slate-400 font-medium">24/7 Academic AI Study Companion</p>
              </div>
            </section>

            {/* Recent Courses Horizontal Row */}
            <section className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-bold font-serif text-slate-900">Your Allocated Syllabus</h3>
                <span className="text-xs text-slate-400 font-medium">Click to study and take quizzes</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {courses.map((course) => {
                  // Determine completed count
                  const courseProgress = progressList.filter((p) => p.courseId === course.id);
                  const completedTiers = courseProgress.filter((p) => p.status === "completed").length;
                  const scorePercentage = completedTiers === 1 ? 33 : completedTiers === 2 ? 66 : completedTiers === 3 ? 100 : 0;
                  
                  return (
                    <motion.div
                      whileHover={{ y: -3 }}
                      key={course.id}
                      onClick={() => selectCourse(course)}
                      className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm hover:shadow-md transition-all cursor-pointer flex justify-between items-start gap-4"
                    >
                      <div className="space-y-3 flex-1">
                        <div className="space-y-1">
                          <span className="bg-slate-100 text-slate-700 text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-md">{course.code}</span>
                          <h4 className="text-lg font-bold font-serif text-slate-900 leading-snug mt-1">{course.title}</h4>
                        </div>
                        <p className="text-xs text-slate-500 font-medium">{course.department} • level {course.level}</p>
                      </div>

                      {/* Dynamic circular progress ring in JSX */}
                      <div className="relative w-16 h-16 flex-shrink-0 flex items-center justify-center">
                        <svg className="w-full h-full transform -rotate-90">
                          <circle cx="32" cy="32" r="24" stroke="#f1f5f9" strokeWidth="4" fill="transparent" />
                          <circle 
                            cx="32" cy="32" r="24" 
                            stroke="#0f172a" strokeWidth="4" fill="transparent" 
                            strokeDasharray={150.7}
                            strokeDashoffset={150.7 - (150.7 * scorePercentage) / 100}
                            strokeLinecap="round"
                          />
                        </svg>
                        <span className="absolute text-xs font-bold text-slate-800">{scorePercentage}%</span>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </section>

            {/* Recommended reading visual component */}
            <section className="space-y-3">
              <h3 className="text-lg font-bold font-serif text-slate-900">Curriculum Advisory</h3>
              <div className="rounded-2xl overflow-hidden relative h-52 border border-slate-200/80 group shadow-sm bg-slate-900">
                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-transparent z-10" />
                <img 
                  src="https://images.unsplash.com/photo-1516979187457-637abb4f9353?q=80&w=1200&auto=format&fit=crop"
                  alt="Library"
                  className="absolute inset-0 w-full h-full object-cover opacity-60 group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute bottom-0 left-0 p-6 z-20 space-y-1">
                  <p className="text-xs font-bold text-slate-300 uppercase tracking-widest">Mastering Academic Focus</p>
                  <h4 className="text-xl font-bold text-white font-serif max-w-md">Time Management and Socratic Learning for STEM Students</h4>
                  <p className="text-xs text-slate-400">A guide on how active recall and study assistants speed up cognitive retention.</p>
                </div>
              </div>
            </section>
          </main>

          {/* Persistent Footer with Floating Robot FAB */}
          <button 
            onClick={() => {
              if (courses.length > 0) {
                // If Socratic assistant clicked from Dashboard, open it using first course
                if (!selectedCourse) {
                  setSelectedCourse(courses[0]);
                }
                setIsAiOpen(true);
              }
            }}
            className="fixed right-6 bottom-6 w-14 h-14 bg-slate-950 hover:bg-slate-800 text-white rounded-full shadow-2xl flex items-center justify-center z-40 hover:scale-105 active:scale-95 transition-all"
            title="Socratic Tutor AI"
          >
            <Sparkles className="h-6 w-6 animate-pulse" />
          </button>
        </div>
      )}

      {/* 3. COURSE DETAIL VIEW */}
      {currentView === "course-detail" && currentUser && selectedCourse && (
        <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 transition-colors duration-300">
          <header className="sticky top-0 w-full bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 z-30">
            <div className="max-w-4xl mx-auto px-6 h-20 flex justify-between items-center">
              <div className="flex items-center gap-3">
                <button 
                  onClick={() => {
                    setSelectedCourse(null);
                    setCurrentView("dashboard");
                  }}
                  className="flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 px-3 py-1.5 rounded-lg transition-all"
                >
                  <ChevronLeft className="h-4 w-4" />
                  Back to Dashboard
                </button>
                <button
                  onClick={() => setIsDarkMode(!isDarkMode)}
                  className="p-2 text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all"
                  title={isDarkMode ? "Light Mode" : "Dark Mode"}
                >
                  {isDarkMode ? <Sun className="h-5 w-5 text-amber-400" /> : <Moon className="h-5 w-5" />}
                </button>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs font-bold bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded text-slate-700 dark:text-slate-300">{selectedCourse.code}</span>
                <span className="text-sm font-medium hidden sm:block text-slate-500 dark:text-slate-400">{selectedCourse.title}</span>
              </div>
            </div>
          </header>

          <main className="flex-grow max-w-4xl mx-auto w-full px-6 py-8 space-y-8 pb-24">
            {/* Course Header Banner */}
            <div className="bg-slate-900 rounded-3xl overflow-hidden relative h-44 shadow-md text-white flex flex-col justify-end p-6">
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/35 to-transparent z-10" />
              <img 
                src="https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?q=80&w=1200&auto=format&fit=crop"
                alt="Course Header"
                className="absolute inset-0 w-full h-full object-cover opacity-55"
              />
              <div className="relative z-20 space-y-1">
                <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-300 bg-white/15 px-2 py-0.5 rounded-md">CORE SUBJECT</span>
                <h2 className="text-2xl sm:text-3xl font-extrabold font-serif leading-tight">{selectedCourse.title}</h2>
                <p className="text-xs text-slate-300">{selectedCourse.department} • Level {selectedCourse.level}</p>
              </div>
            </div>

            {/* Elegant Tab Switcher */}
            <div className="flex border-b border-slate-200 dark:border-slate-800 gap-6">
              <button
                onClick={() => setCourseTab("curriculum")}
                className={`pb-4 text-sm font-semibold relative transition-all ${
                  courseTab === "curriculum"
                    ? "text-slate-900 dark:text-white"
                    : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-300"
                }`}
              >
                Curriculum & Quizzes
                {courseTab === "curriculum" && (
                  <motion.div
                    layoutId="activeCourseTab"
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-slate-900 dark:bg-white"
                  />
                )}
              </button>
              <button
                onClick={() => setCourseTab("leaderboard")}
                className={`pb-4 text-sm font-semibold relative transition-all flex items-center gap-2 ${
                  courseTab === "leaderboard"
                    ? "text-slate-900 dark:text-white"
                    : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-300"
                }`}
              >
                <Trophy className="h-4 w-4 text-amber-500" />
                Global Leaderboard
                {courseTab === "leaderboard" && (
                  <motion.div
                    layoutId="activeCourseTab"
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-slate-900 dark:bg-white"
                  />
                )}
              </button>
            </div>

            {courseTab === "curriculum" ? (
              /* Document Materials & Tier Practice Grid */
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
                {/* Materials Column */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-bold font-serif text-slate-950 dark:text-white flex items-center gap-2">
                      <BookOpen className="h-5 w-5 text-slate-700 dark:text-slate-300" />
                      Course Materials
                    </h3>
                    <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{materials.length} available</span>
                  </div>

                  {materials.length === 0 ? (
                    <div className="p-8 text-center bg-white dark:bg-slate-900 border border-dashed border-slate-300 dark:border-slate-800 rounded-2xl">
                      <FileText className="h-10 w-10 text-slate-300 mx-auto mb-2" />
                      <p className="text-sm text-slate-500 dark:text-slate-400">No documents uploaded for this course yet.</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {materials.map((m) => (
                        <div key={m.id} className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-4 shadow-sm space-y-4">
                          <div className="flex items-center gap-3">
                            <div className={`p-3 rounded-xl ${m.fileName.endsWith('.pdf') ? 'bg-red-50 text-red-700 dark:bg-red-950/30 dark:text-red-400' : 'bg-orange-50 text-orange-700 dark:bg-orange-950/30 dark:text-orange-400'}`}>
                              <FileText className="h-6 w-6" />
                            </div>
                            <div className="flex-1 overflow-hidden">
                              <h4 className="text-sm font-bold text-slate-900 dark:text-white truncate">{m.fileName}</h4>
                              <p className="text-xs text-slate-400 capitalize">{m.fileType} document • Academic Reference</p>
                            </div>
                          </div>

                          <div className="flex gap-2 pt-1">
                            <button 
                              onClick={() => setActiveViewerMaterial(m)}
                              className="flex-grow bg-slate-900 hover:bg-slate-800 text-white font-semibold py-2.5 rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all"
                            >
                              <BookOpen className="h-4 w-4" />
                              Open in Viewer
                            </button>
                            <a 
                              href={m.fileUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-white rounded-xl flex items-center justify-center transition-all"
                              title="Download Link"
                            >
                              <Download className="h-4 w-4" />
                            </a>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Quiz Tiers Column */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-bold font-serif text-slate-950 dark:text-white flex items-center gap-2">
                      <Clock className="h-5 w-5 text-slate-700 dark:text-slate-300" />
                      Curriculum Practice Quiz
                    </h3>
                    <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Exactly 50 Qs</span>
                  </div>

                  <div className="space-y-4">
                    {(["easy", "medium", "hard"] as Tier[]).map((tier) => {
                      const progress = progressList.find((p) => p.courseId === selectedCourse.id && p.tier === tier);
                      const isLocked = !progress || progress.status === "locked";
                      const isCompleted = progress?.status === "completed";
                      const scoreText = progress && progress.score > 0 ? `${progress.score}/50` : null;

                      return (
                        <div 
                          key={tier} 
                          className={`border rounded-2xl p-5 flex items-center justify-between relative transition-all ${
                            isLocked 
                              ? 'bg-slate-100/70 dark:bg-slate-900/40 border-slate-200/50 dark:border-slate-800/50 text-slate-400 cursor-not-allowed opacity-70' 
                              : isCompleted 
                                ? 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800 text-emerald-950 dark:text-emerald-300'
                                : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white hover:border-slate-400 dark:hover:border-slate-700 shadow-sm'
                          }`}
                        >
                          <div className="flex gap-4 items-center">
                            <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                              isLocked 
                                ? 'bg-slate-200 dark:bg-slate-800 text-slate-400' 
                                : isCompleted 
                                  ? 'bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-200'
                                  : 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white'
                            }`}>
                              {isLocked ? <Lock className="h-5 w-5" /> : <Unlock className="h-5 w-5" />}
                            </div>
                            <div>
                              <h4 className="font-bold font-serif capitalize text-md flex items-center gap-2">
                                {tier} Mode
                                {isCompleted && (
                                  <span className="bg-emerald-100 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-200 text-[9px] uppercase tracking-wider font-extrabold px-1.5 py-0.5 rounded">PASSED</span>
                                )}
                              </h4>
                              <p className="text-xs text-slate-500 dark:text-slate-400">
                                {tier === "easy" ? "Foundational concept validation" : tier === "medium" ? "Analytical scenarios and equations" : "Strategic exam simulation"}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 z-10">
                            {scoreText && (
                              <span className="text-xs font-extrabold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded">{scoreText}</span>
                            )}
                            {!isLocked && (
                              <button 
                                onClick={() => startQuiz(selectedCourse.id, tier)}
                                className="bg-slate-900 hover:bg-slate-800 dark:bg-slate-850 dark:hover:bg-slate-800 text-white font-semibold px-4 py-2 rounded-xl text-xs flex items-center gap-1"
                              >
                                Start
                                <ChevronRight className="h-3.5 w-3.5" />
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <div className="p-4 bg-blue-50 dark:bg-blue-950/25 text-blue-900 dark:text-blue-300 rounded-2xl border border-blue-100 dark:border-blue-900/50 flex items-start gap-3">
                    <AlertCircle className="h-5 w-5 text-blue-700 shrink-0 mt-0.5" />
                    <p className="text-xs leading-relaxed">
                      <strong>Nigerian University Standards:</strong> Scoring <span className="font-bold">70% or higher</span> (at least 35 out of 50 correct answers) is required to pass the module and unlock the next consecutive tier.
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              /* Global Leaderboard Tab */
              <div className="space-y-6">
                {/* Tier Sub-Selector */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div>
                    <h3 className="text-lg font-bold font-serif text-slate-950 dark:text-white flex items-center gap-2">
                      <Trophy className="h-5 w-5 text-amber-500 animate-bounce" />
                      Classroom Standings
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Compete with peer students across departments</p>
                  </div>
                  
                  <div className="flex bg-slate-100 dark:bg-slate-800/80 p-1 rounded-xl border border-slate-200 dark:border-slate-850 self-start sm:self-auto">
                    {(["easy", "medium", "hard"] as Tier[]).map((t) => (
                      <button
                        key={t}
                        onClick={() => setActiveLeaderboardTier(t)}
                        className={`px-3 py-1.5 text-xs font-bold rounded-lg uppercase tracking-wider transition-all ${
                          activeLeaderboardTier === t
                            ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm"
                            : "text-slate-500 hover:text-slate-850 dark:hover:text-slate-300"
                        }`}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </div>

                {isLeaderboardLoading ? (
                  <div className="p-12 text-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl flex flex-col items-center justify-center space-y-3">
                    <div className="w-8 h-8 border-4 border-slate-900 border-t-transparent dark:border-white dark:border-t-transparent rounded-full animate-spin" />
                    <p className="text-xs text-slate-500">Retrieving leaderboard metrics...</p>
                  </div>
                ) : leaderboard.length === 0 ? (
                  <div className="p-12 text-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl">
                    <Trophy className="h-10 w-10 text-slate-300 mx-auto mb-2" />
                    <p className="text-sm text-slate-500 text-slate-400">No attempts registered for this tier yet.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {leaderboard.map((student, idx) => {
                      const isMe = student.userId === currentUser.id;
                      const rank = idx + 1;
                      
                      return (
                        <motion.div
                          key={student.userId}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: idx * 0.05 }}
                          className={`flex items-center justify-between p-4 rounded-2xl border transition-all ${
                            isMe
                              ? "bg-slate-950 border-slate-950 text-white dark:bg-slate-800 dark:border-slate-700 shadow-md scale-[1.01]"
                              : "bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800 text-slate-800 dark:text-slate-100 shadow-sm"
                          }`}
                        >
                          <div className="flex items-center gap-4 flex-1 min-w-0">
                            {/* Rank Indicator */}
                            <div className="flex-shrink-0 w-8 h-8 flex items-center justify-center font-extrabold text-sm rounded-xl">
                              {rank === 1 ? (
                                <span className="text-xl">🏆</span>
                              ) : rank === 2 ? (
                                <span className="text-xl">🥈</span>
                              ) : rank === 3 ? (
                                <span className="text-xl">🥉</span>
                              ) : (
                                <span className={isMe ? "text-slate-300" : "text-slate-400 dark:text-slate-500"}>#{rank}</span>
                              )}
                            </div>

                            {/* Student Metadata */}
                            <div className="truncate pr-4">
                              <div className="flex items-center gap-2">
                                <h4 className={`text-sm font-bold truncate ${isMe ? "text-white" : "text-slate-900 dark:text-white"}`}>
                                  {student.name}
                                </h4>
                                {isMe && (
                                  <span className="bg-slate-850 dark:bg-slate-700 text-white text-[9px] uppercase tracking-wider font-extrabold px-1.5 py-0.5 rounded">
                                    You
                                  </span>
                                )}
                              </div>
                              <p className={`text-xs ${isMe ? "text-slate-300" : "text-slate-500 dark:text-slate-400"} truncate`}>
                                {student.department} • Level {student.level}
                              </p>
                            </div>
                          </div>

                          {/* Score Metric */}
                          <div className="text-right flex-shrink-0">
                            <p className={`text-md font-extrabold ${isMe ? "text-white" : "text-slate-900 dark:text-white"}`}>
                              {student.score} <span className="text-xs font-normal opacity-70">/ 50</span>
                            </p>
                            <div className="w-24 bg-slate-100 dark:bg-slate-850 h-1.5 rounded-full mt-1.5 overflow-hidden">
                              <div 
                                className={`h-full rounded-full ${
                                  rank === 1 
                                    ? "bg-amber-500" 
                                    : rank === 2 
                                      ? "bg-slate-400" 
                                      : rank === 3 
                                        ? "bg-orange-400" 
                                        : "bg-blue-500"
                                }`}
                                style={{ width: `${(student.score / 50) * 100}%` }}
                              />
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                )}
                
                {/* Competition encouragement panel */}
                <div className="p-4 bg-slate-100 dark:bg-slate-850/40 text-slate-600 dark:text-slate-300 rounded-2xl border border-slate-200 dark:border-slate-800 flex items-start gap-3">
                  <Trophy className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
                  <p className="text-xs leading-relaxed">
                    <strong>Leaderboard Rules:</strong> Standings display the top 5 students based on their highest practice score. Take the practice test again from the <strong>Curriculum & Quizzes</strong> tab to increase your standing!
                  </p>
                </div>
              </div>
            )}
          </main>

          {/* Floating Tutor FAB to open assistant */}
          <button 
            onClick={() => setIsAiOpen(true)}
            className="fixed right-6 bottom-6 w-14 h-14 bg-slate-950 hover:bg-slate-800 text-white rounded-full shadow-2xl flex items-center justify-center z-40 hover:scale-105 active:scale-95 transition-all"
            title="Socratic Tutor AI"
          >
            <Sparkles className="h-6 w-6" />
          </button>
        </div>
      )}

      {/* 4. ACTIVE 50-QUESTION QUIZ INTERFACE */}
      {currentView === "quiz" && selectedCourse && quizQuestions.length > 0 && (
        <div className="min-h-screen flex flex-col bg-white dark:bg-slate-950 transition-colors duration-300">
          {/* Linear Progress and Header */}
          <header className="sticky top-0 w-full bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 z-30 px-6 py-4 flex flex-col justify-center">
            <div className="max-w-4xl mx-auto w-full flex justify-between items-center mb-3">
              <div className="flex items-center gap-3">
                <button 
                  onClick={() => {
                    if (confirm("Are you sure you want to exit the quiz? Your answers will be lost.")) {
                      setCurrentView("course-detail");
                    }
                  }}
                  className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-all cursor-pointer"
                >
                  <X className="h-5 w-5" />
                </button>
                <span className="font-bold font-serif text-lg text-slate-900 dark:text-white">Compass Quiz</span>
              </div>

              {/* Countdown Timer Display Badge */}
              <div className={`flex items-center gap-1.5 px-4 py-2 border rounded-full font-mono text-sm font-extrabold transition-all duration-300 ${
                timeLeft <= 180
                  ? 'bg-rose-50 dark:bg-rose-950/30 border-rose-200 dark:border-rose-900/50 text-rose-600 dark:text-rose-400 animate-pulse'
                  : 'bg-slate-50 dark:bg-slate-850 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300'
              }`}>
                <Clock className={`h-4 w-4 ${timeLeft <= 180 ? 'text-rose-500 animate-pulse' : 'text-slate-500 dark:text-slate-400'}`} />
                <span>{formatTime(timeLeft)}</span>
              </div>

              <div className="text-right">
                <span className="block text-xs font-bold text-slate-400 uppercase tracking-widest">Question {currentQuestionIdx + 1} of 50</span>
                <span className="block text-xs font-semibold text-slate-500 dark:text-slate-400 capitalize">{selectedCourse.code}: {activeTier} Mode</span>
              </div>
            </div>

            {/* Progress Bar indicator */}
            <div className="max-w-4xl mx-auto w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
              <div 
                className="bg-slate-950 dark:bg-white h-full rounded-full transition-all duration-300 ease-out" 
                style={{ width: `${((currentQuestionIdx + 1) / 50) * 100}%` }}
              />
            </div>
          </header>

          {/* Question Box and Options */}
          <main className="flex-1 max-w-2xl mx-auto w-full px-6 py-8 flex flex-col justify-between">
            <div className="space-y-8">
              {/* Question Text Box */}
              <div className="p-1">
                <h2 className="text-xl sm:text-2xl font-bold font-serif text-slate-900 dark:text-white leading-snug">
                  {quizQuestions[currentQuestionIdx].questionText}
                </h2>
              </div>

              {/* Options lists */}
              <div className="grid grid-cols-1 gap-4">
                {quizQuestions[currentQuestionIdx].options.map((option, index) => {
                  const label = String.fromCharCode(65 + index); // A, B, C, D
                  const isSelected = studentAnswers[currentQuestionIdx] === label;

                  return (
                    <button
                      key={index}
                      onClick={() => handleSelectOption(label)}
                      className={`w-full group flex items-center p-5 rounded-2xl border text-left transition-all cursor-pointer ${
                        isSelected 
                          ? 'border-slate-900 dark:border-white bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-950 shadow-md scale-[0.99]' 
                          : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-200 hover:border-slate-400 dark:hover:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-850'
                      }`}
                    >
                      <div className={`w-10 h-10 flex-shrink-0 flex items-center justify-center rounded-xl font-bold text-sm mr-4 transition-colors ${
                        isSelected 
                          ? 'bg-white dark:bg-slate-950 text-slate-900 dark:text-white' 
                          : 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 group-hover:bg-slate-300 dark:group-hover:bg-slate-700'
                      }`}>
                        {label}
                      </div>
                      <p className="text-sm font-semibold">{option}</p>
                    </button>
                  );
                })}
              </div>

              {/* Toggle Flag for Review */}
              <div className="flex justify-center pt-4">
                <button 
                  onClick={toggleFlagQuestion}
                  className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-semibold tracking-wider uppercase border transition-all cursor-pointer ${
                    flaggedQuestions[currentQuestionIdx]
                      ? 'bg-amber-100 border-amber-200 text-amber-800 dark:bg-amber-950/40 dark:border-amber-900/50 dark:text-amber-300 shadow-sm'
                      : 'border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-900'
                  }`}
                >
                  <Flag className={`h-4 w-4 ${flaggedQuestions[currentQuestionIdx] ? 'fill-current text-amber-700 dark:text-amber-500' : ''}`} />
                  {flaggedQuestions[currentQuestionIdx] ? 'Flagged for Review' : 'Flag for Review'}
                </button>
              </div>
            </div>

            {/* Next / Previous Quiz Navigation bar */}
            <div className="pt-12 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-4">
              <button 
                onClick={() => setCurrentQuestionIdx((p) => Math.max(0, p - 1))}
                disabled={currentQuestionIdx === 0}
                className="flex-1 flex items-center justify-center gap-2 py-4 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 font-bold text-sm rounded-xl hover:bg-slate-50 dark:hover:bg-slate-900 disabled:opacity-50 disabled:pointer-events-none transition-all cursor-pointer"
              >
                <ChevronLeft className="h-4 w-4" />
                Previous
              </button>

              {currentQuestionIdx < 49 ? (
                <button 
                  onClick={() => setCurrentQuestionIdx((p) => p + 1)}
                  className="flex-grow flex items-center justify-center gap-2 py-4 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-950 font-bold text-sm rounded-xl hover:bg-slate-800 dark:hover:bg-slate-200 transition-all shadow-md cursor-pointer"
                >
                  Next Question
                  <ChevronRight className="h-4 w-4" />
                </button>
              ) : (
                <button 
                  onClick={submitQuiz}
                  disabled={isSubmittingQuiz}
                  className="flex-grow flex items-center justify-center gap-2 py-4 bg-emerald-600 dark:bg-emerald-700 text-white font-extrabold text-sm rounded-xl hover:bg-emerald-700 dark:hover:bg-emerald-650 transition-all shadow-md disabled:bg-slate-300 dark:disabled:bg-slate-800 cursor-pointer"
                >
                  {isSubmittingQuiz ? 'Evaluating...' : 'Submit Answers (50/50)'}
                  <CheckCircle2 className="h-4 w-4" />
                </button>
              )}
            </div>
          </main>

          {/* 5. POST-QUIZ RESULTS MODAL */}
          <AnimatePresence>
            {quizResult && (
              <div className="fixed inset-0 bg-black/55 backdrop-blur-sm z-[80] flex items-center justify-center p-4 overflow-y-auto">
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl max-w-2xl w-full p-8 max-h-[90vh] overflow-y-auto space-y-8"
                >
                  {/* Results Header */}
                  <div className="text-center space-y-2">
                    <div className="inline-flex p-4 rounded-full bg-slate-900 dark:bg-slate-850 text-white shadow-xl">
                      <GraduationCap className="h-10 w-10" />
                    </div>
                    <h3 className="text-3xl font-bold font-serif text-slate-900 dark:text-white">Quiz Completed</h3>
                    <p className="text-slate-500 dark:text-slate-400 font-medium">Evaluation outcome for {selectedCourse.title}</p>
                  </div>

                  {/* Score Bento Box */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-slate-50 dark:bg-slate-850 p-6 rounded-2xl text-center border border-slate-200/60 dark:border-slate-800">
                      <span className="text-xs font-semibold text-slate-400 uppercase tracking-widest">Total Correct</span>
                      <p className="text-3xl font-extrabold text-slate-900 dark:text-white mt-1">{quizResult.score} / 50</p>
                    </div>

                    <div className={`p-6 rounded-2xl text-center border ${
                      quizResult.passed 
                        ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-250 dark:border-emerald-900/50 text-emerald-900 dark:text-emerald-400' 
                        : 'bg-red-50 dark:bg-red-950/30 border-red-250 dark:border-red-900/50 text-red-900 dark:text-red-400'
                    }`}>
                      <span className="text-xs font-semibold uppercase tracking-widest">Performance Percent</span>
                      <p className="text-3xl font-extrabold mt-1">{quizResult.percentage}%</p>
                    </div>
                  </div>

                  {/* Status Banner */}
                  <div className={`p-4 rounded-2xl border text-center font-bold text-sm ${
                    quizResult.passed
                      ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300'
                      : 'bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800 text-red-800 dark:text-red-300'
                  }`}>
                    {quizResult.passed 
                      ? `🎉 Level Passed! You successfully met the 70% benchmark threshold and unlocked the consecutive tier.` 
                      : `📚 Benchmark unmet. You scored less than the 70% threshold. Try reading course materials or chatting with Compass Socratic AI Tutor to clarify concepts.`}
                  </div>

                  {/* Detailed tutor explanation and review section */}
                  <div className="space-y-4">
                    <h4 className="text-lg font-bold font-serif text-slate-900 dark:text-white">Review Questions ({quizResult.score}/50 Correct)</h4>
                    <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2 divide-y divide-slate-100 dark:divide-slate-800">
                      {quizResult.results.slice(0, 10).map((r: any, idx: number) => {
                        const originalQ = quizQuestions[idx];
                        return (
                          <div key={r.questionId} className="pt-4 space-y-2">
                            <p className="text-sm font-bold text-slate-900 dark:text-white">{originalQ?.questionText}</p>
                            <div className="flex gap-4 text-xs font-medium">
                              <span className="text-slate-500 dark:text-slate-400">Your Answer: <strong className={r.isCorrect ? "text-emerald-700 dark:text-emerald-400" : "text-red-700 dark:text-red-400"}>{r.studentAnswer || "None"}</strong></span>
                              <span className="text-slate-500 dark:text-slate-400">Correct Answer: <strong className="text-emerald-700 dark:text-emerald-400">{r.correctAnswer}</strong></span>
                            </div>
                            <div className="p-3 bg-blue-50/50 dark:bg-blue-950/20 rounded-xl text-xs text-blue-900 dark:text-blue-300 border border-blue-50 dark:border-blue-950/40">
                              <strong>Tutor Explanation:</strong> {r.explanation}
                            </div>
                          </div>
                        );
                      })}
                      {quizResult.results.length > 10 && (
                        <p className="text-xs text-slate-400 text-center pt-4">Plus {quizResult.results.length - 10} more questions logged to progress database...</p>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-4">
                    <button 
                      onClick={() => {
                        setQuizResult(null);
                        setCurrentView("course-detail");
                      }}
                      className="flex-1 py-4 bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 dark:text-slate-950 text-white font-bold text-sm rounded-xl transition-all cursor-pointer"
                    >
                      Return to Course details
                    </button>
                  </div>
                </motion.div>
              </div>
            )}
          </AnimatePresence>

          {/* TIME EXPIRED SUMMARY NOTIFICATION MODAL */}
          <AnimatePresence>
            {showTimeExpiredNotification && (
              <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[100] flex items-center justify-center p-4">
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: 20 }}
                  className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl max-w-md w-full p-6 text-center space-y-6 animate-fade-in"
                >
                  <div className="inline-flex p-4 rounded-full bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 animate-bounce">
                    <Clock className="h-10 w-10 animate-pulse" />
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-2xl font-bold font-serif text-slate-900 dark:text-white">Time is Up!</h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      Your 30-minute exam duration has expired.
                    </p>
                  </div>

                  <div className="bg-slate-50 dark:bg-slate-850 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 text-left space-y-3">
                    <h4 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Submission Summary</h4>
                    <div className="grid grid-cols-2 gap-4 text-xs">
                      <div>
                        <span className="block text-slate-400">Course Code</span>
                        <strong className="text-slate-700 dark:text-slate-200">{selectedCourse?.code}</strong>
                      </div>
                      <div>
                        <span className="block text-slate-400">Exam Mode</span>
                        <strong className="text-slate-700 dark:text-slate-200 capitalize">{activeTier}</strong>
                      </div>
                      <div>
                        <span className="block text-slate-400">Attempted</span>
                        <strong className="text-slate-700 dark:text-slate-200">
                          {Object.keys(studentAnswers).length} / 50 Questions
                        </strong>
                      </div>
                      <div>
                        <span className="block text-slate-400">Status</span>
                        <strong className="text-amber-600 dark:text-amber-400 font-extrabold">Auto-Submitted</strong>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => setShowTimeExpiredNotification(false)}
                    className="w-full py-3.5 bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 dark:text-slate-950 text-white font-bold text-sm rounded-xl transition-all shadow-lg cursor-pointer"
                  >
                    View Evaluation Results
                  </button>
                </motion.div>
              </div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* 6. ADMIN PORTAL VIEW */}
      {currentView === "admin" && currentUser && (
        <div className="min-h-screen flex flex-col bg-slate-50">
          <header className="sticky top-0 w-full bg-white border-b border-slate-100 z-30">
            <div className="max-w-4xl mx-auto px-6 h-20 flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-red-600 text-white flex items-center justify-center">
                  <GraduationCap className="h-5 w-5" />
                </div>
                <h1 className="text-lg font-bold font-serif text-slate-900">Compass Guide Admin Panel</h1>
              </div>

              <div className="flex items-center gap-4">
                <button 
                  onClick={() => {
                    // Temporarily simulate student mode for sandbox review
                    setCurrentView("dashboard");
                  }}
                  className="text-xs bg-slate-900 text-white font-semibold px-3 py-1.5 rounded-lg"
                >
                  Enter Student Mode
                </button>
                <button 
                  onClick={() => {
                    setCurrentUser(null);
                    setCurrentView("login");
                  }}
                  className="p-2 text-slate-400 hover:text-slate-900"
                >
                  Logout
                </button>
              </div>
            </div>
          </header>

          <main className="max-w-4xl mx-auto w-full px-6 py-8 space-y-8 pb-24">
            <div>
              <h2 className="text-2xl font-bold text-slate-900">Welcome, {currentUser.name} (Faculty Administrator)</h2>
              <p className="text-sm text-slate-500">Configure curriculum, upload course files, and manage the strictly validated 50-question database.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Material Upload Admin tool */}
              <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
                <h3 className="text-lg font-bold font-serif text-slate-900 flex items-center gap-2">
                  <Upload className="h-5 w-5 text-blue-600" />
                  Upload Course Materials
                </h3>

                {adminUploadSuccess && (
                  <div className="p-3 bg-emerald-50 text-emerald-800 text-xs rounded-xl font-bold">
                    {adminUploadSuccess}
                  </div>
                )}

                <form onSubmit={handleAdminUpload} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">Select Course</label>
                    <select 
                      value={adminCourseId}
                      onChange={(e) => setAdminCourseId(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3.5 text-xs focus:outline-none focus:ring-2 focus:ring-slate-900 transition-all"
                      required
                    >
                      <option value="">-- Choose Course --</option>
                      {courses.map((c) => (
                        <option key={c.id} value={c.id}>{c.code} - {c.title}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">Document File Name</label>
                    <input 
                      type="text" 
                      value={adminMaterialName}
                      onChange={(e) => setAdminMaterialName(e.target.value)}
                      placeholder="e.g., Fiscal Policy Framework.pdf"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3.5 text-xs focus:outline-none focus:ring-2 focus:ring-slate-900 transition-all"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">Document Storage URL</label>
                    <input 
                      type="text" 
                      value={adminMaterialUrl}
                      onChange={(e) => setAdminMaterialUrl(e.target.value)}
                      placeholder="https://pdf-storage-service.edu/fiscal.pdf"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3.5 text-xs focus:outline-none focus:ring-2 focus:ring-slate-900 transition-all"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">File Type</label>
                    <select 
                      value={adminMaterialType}
                      onChange={(e) => setAdminMaterialType(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3.5 text-xs focus:outline-none focus:ring-2 focus:ring-slate-900 transition-all"
                    >
                      <option value="pdf">PDF Document</option>
                      <option value="ppt">PowerPoint Presentation</option>
                      <option value="doc">Word Document</option>
                    </select>
                  </div>

                  <button 
                    type="submit"
                    className="w-full bg-slate-900 hover:bg-slate-800 text-white font-semibold py-3.5 rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all shadow-md"
                  >
                    <FileUp className="h-4 w-4" />
                    Register Material Document
                  </button>
                </form>
              </div>

              {/* Strict 50-Question validator tester */}
              <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
                <h3 className="text-lg font-bold font-serif text-slate-900 flex items-center gap-2">
                  <Clock className="h-5 w-5 text-red-600" />
                  Strict 50-Question Validator
                </h3>

                <p className="text-xs text-slate-500 leading-relaxed">
                  Test the backend endpoint constraint validator. The backend expects exactly 50 questions. Uploading anything else triggers a 400 Validation Error.
                </p>

                {adminBulkResponse && (
                  <div className="p-3 bg-emerald-50 text-emerald-800 text-xs rounded-xl border border-emerald-200 font-bold">
                    {adminBulkResponse}
                  </div>
                )}

                {adminBulkError && (
                  <div className="p-3 bg-red-50 text-red-800 text-xs rounded-xl border border-red-200 font-bold leading-relaxed">
                    <strong>Validation Error:</strong> {adminBulkError}
                  </div>
                )}

                <form onSubmit={handleAdminGenerateBulk} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">Select Course</label>
                    <select 
                      value={adminCourseId}
                      onChange={(e) => setAdminCourseId(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3.5 text-xs focus:outline-none focus:ring-2 focus:ring-slate-900 transition-all"
                      required
                    >
                      <option value="">-- Choose Course --</option>
                      {courses.map((c) => (
                        <option key={c.id} value={c.id}>{c.code} - {c.title}</option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">Tier</label>
                      <select 
                        value={adminBulkTier}
                        onChange={(e: any) => setAdminBulkTier(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3.5 text-xs focus:outline-none focus:ring-2 focus:ring-slate-900 transition-all"
                      >
                        <option value="easy">Easy</option>
                        <option value="medium">Medium</option>
                        <option value="hard">Hard</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">Questions Count</label>
                      <input 
                        type="number" 
                        value={adminBulkCount}
                        onChange={(e) => setAdminBulkCount(Number(e.target.value))}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3.5 text-xs focus:outline-none focus:ring-2 focus:ring-slate-900 transition-all"
                        min="1"
                        max="200"
                        required
                      />
                    </div>
                  </div>

                  <div className="p-3 bg-slate-100 rounded-xl border border-slate-200 flex items-center justify-between">
                    <span className="text-xs text-slate-500 font-bold">Expect validation:</span>
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${adminBulkCount === 50 ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>
                      {adminBulkCount === 50 ? 'WILL PASS (Exactly 50)' : 'WILL FAIL (Not 50)'}
                    </span>
                  </div>

                  <button 
                    type="submit"
                    className="w-full bg-slate-950 hover:bg-slate-800 text-white font-bold py-3.5 rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all"
                  >
                    <Upload className="h-4 w-4" />
                    Simulate Bulk Questions Upload
                  </button>
                </form>
              </div>
            </div>
          </main>
        </div>
      )}

      {/* 7. SOCRATIC COMPASS AI ASSISTANT PANEL */}
      <AnimatePresence>
        {isAiOpen && selectedCourse && (
          <>
            {/* Backdrop Overlay */}
            <div 
              className="fixed inset-0 bg-black/25 backdrop-blur-xs z-50 transition-opacity"
              onClick={() => setIsAiOpen(false)}
            />

            {/* Slide-out Drawer */}
            <motion.aside 
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed right-0 top-0 h-full w-full max-w-sm bg-white border-l border-slate-200/80 shadow-2xl z-50 flex flex-col justify-between"
            >
              {/* Assistant Header */}
              <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-slate-950 text-white flex items-center justify-center shadow-md">
                    <Sparkles className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 font-serif">Compass AI</h3>
                    <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Socratic Study Companion</p>
                  </div>
                </div>
                <button 
                  onClick={() => setIsAiOpen(false)}
                  className="p-1.5 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-900"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Chat Thread */}
              <div className="flex-1 overflow-y-auto p-5 space-y-4 bg-white">
                {aiHistory.length === 0 && (
                  <div className="space-y-4 text-center py-8">
                    <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
                      <Sparkles className="h-6 w-6" />
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm font-bold text-slate-900">Academic Companion Online</p>
                      <p className="text-xs text-slate-400 max-w-[200px] mx-auto leading-relaxed">
                        I base explanations on your course materials using the Socratic method.
                      </p>
                    </div>

                    {/* Preconfigured quick suggestions */}
                    <div className="pt-4 space-y-2 max-w-xs mx-auto">
                      <button 
                        onClick={() => handleSendAi("Clarify key macroeconomics concepts from our Fiscal Policy material.")}
                        className="w-full text-left px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-all flex items-center justify-between"
                      >
                        Review key concepts
                        <ArrowRight className="h-3 w-3" />
                      </button>
                      <button 
                        onClick={() => handleSendAi("Can you summarize the core takeaways of the lecture slides please?")}
                        className="w-full text-left px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-all flex items-center justify-between"
                      >
                        Summarize key takeaways please
                        <ArrowRight className="h-3 w-3" />
                      </button>
                      <button 
                        onClick={() => handleSendAi("Give me a Socratic hint on how Bellman-Ford differs from Dijkstra.")}
                        className="w-full text-left px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-all flex items-center justify-between"
                      >
                        Compare dynamic algorithms
                        <ArrowRight className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                )}

                {aiHistory.map((msg) => (
                  <div 
                    key={msg.id} 
                    className={`flex flex-col max-w-[85%] ${
                      msg.sender === "user" ? "ml-auto items-end" : "mr-auto items-start"
                    }`}
                  >
                    <div className={`p-3.5 rounded-2xl text-xs leading-relaxed ${
                      msg.sender === "user" 
                        ? 'bg-slate-900 text-white rounded-br-none' 
                        : 'bg-slate-100 text-slate-800 rounded-bl-none border border-slate-200/50'
                    }`}>
                      <p>{msg.text}</p>
                    </div>
                    <span className="text-[9px] text-slate-400 font-semibold mt-1 uppercase">{msg.timestamp}</span>
                  </div>
                ))}

                {isAiLoading && (
                  <div className="flex flex-col items-start max-w-[85%] mr-auto space-y-1">
                    <div className="p-3.5 rounded-2xl rounded-bl-none bg-slate-100 border border-slate-200/50 text-slate-400 text-xs flex items-center gap-2">
                      <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" />
                      <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce delay-75" />
                      <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce delay-150" />
                      <span>Formulating Socratic guidance...</span>
                    </div>
                  </div>
                )}
                <div ref={chatBottomRef} />
              </div>

              {/* Input Area */}
              <div className="p-4 border-t border-slate-100 bg-slate-50">
                <div className="relative">
                  <input 
                    type="text" 
                    value={aiMessage}
                    onChange={(e) => setAiMessage(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSendAi()}
                    placeholder="Ask study-related questions..."
                    className="w-full bg-white px-4 py-3.5 pr-12 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-slate-950 transition-all shadow-inner"
                  />
                  <button 
                    onClick={() => handleSendAi()}
                    className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-slate-950 text-white rounded-lg flex items-center justify-center hover:bg-slate-800"
                  >
                    <Send className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* 8. IN-BROWSER MATERIAL DOCUMENT VIEWER MODAL */}
      <AnimatePresence>
        {activeViewerMaterial && (
          <div className="fixed inset-0 bg-black/65 backdrop-blur-sm z-[90] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0, y: 25 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 25 }}
              className="bg-white rounded-3xl overflow-hidden max-w-3xl w-full h-[80vh] flex flex-col shadow-2xl"
            >
              <div className="p-5 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <FileText className="h-6 w-6 text-slate-800" />
                  <div>
                    <h3 className="font-bold text-slate-900 font-serif text-sm">{activeViewerMaterial.fileName}</h3>
                    <p className="text-[10px] text-slate-400 font-semibold tracking-wider uppercase">In-Browser Syllabus Document Reader</p>
                  </div>
                </div>
                <button 
                  onClick={() => setActiveViewerMaterial(null)}
                  className="p-1.5 hover:bg-slate-200 rounded-full text-slate-400 hover:text-slate-900"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Simulated interactive document content reader */}
              <div className="flex-grow overflow-y-auto p-8 space-y-6 bg-slate-100 text-slate-700 font-serif leading-relaxed">
                <div className="max-w-xl mx-auto bg-white p-12 rounded-xl shadow-md border border-slate-200 space-y-6">
                  <div className="text-center border-b border-slate-100 pb-4">
                    <span className="text-[10px] font-bold text-slate-400 tracking-widest uppercase">NIGERIAN UNIVERSITY CURRICULUM</span>
                    <h1 className="text-xl font-bold text-slate-900 mt-1">{selectedCourse?.title} Study Context</h1>
                    <p className="text-xs text-slate-400 mt-1 font-sans">Published reference standard • level {currentUser?.level}</p>
                  </div>

                  {selectedCourse?.code === "ECO401" ? (
                    <>
                      <h3 className="text-md font-bold text-slate-900 font-sans">Chapter 1: Fiscal Policy and Stabilisation Framework</h3>
                      <p className="text-sm leading-relaxed">
                        In developing economies like Nigeria, fiscal policy plays a double role. It not only finances crucial public infrastructure but also stabilizes aggregate supply during resource-dependent cycle fluctuations.
                      </p>
                      <p className="text-sm leading-relaxed">
                        The Multiplier Effect occurs when the first cycle of public spending results in consecutive consumer and investment spending, shifting the Aggregate Demand (AD) curves outwards. However, the crowding-out effect might occur if public spending drives interest rates higher, hindering local private investments.
                      </p>
                    </>
                  ) : selectedCourse?.code === "CSC401" ? (
                    <>
                      <h3 className="text-md font-bold text-slate-900 font-sans">Module 4: Dynamic Programming and Optimisation</h3>
                      <p className="text-sm leading-relaxed">
                        Dynamic programming solves complex problems by breaking them down into simpler subproblems. It is applicable to problems exhibiting properties of overlapping subproblems and optimal substructure.
                      </p>
                      <p className="text-sm leading-relaxed">
                        Memoization is the top-down approach where we recursively solve subproblems and store their results in a lookup table. Tabulation is the bottom-up approach that iteratively fills a table starting from the baseline conditions.
                      </p>
                    </>
                  ) : (
                    <>
                      <h3 className="text-md font-bold text-slate-900 font-sans">Academic Reference Study Context</h3>
                      <p className="text-sm leading-relaxed">
                        This syllabus document outlines critical methodologies, theories, and concepts related to {selectedCourse?.title}. Focus on identifying Socratic linkages between the theory and structural practice quizzes.
                      </p>
                    </>
                  )}

                  <div className="p-4 bg-slate-50 rounded-xl border border-dashed border-slate-300 text-center font-sans space-y-2">
                    <p className="text-xs text-slate-500 font-semibold">Ready to test your comprehension?</p>
                    <button 
                      onClick={() => {
                        setActiveViewerMaterial(null);
                        // Launch easy tier quiz
                        startQuiz(selectedCourse!.id, "easy");
                      }}
                      className="inline-flex items-center gap-1.5 bg-slate-900 hover:bg-slate-800 text-white font-bold px-4 py-2 rounded-lg text-xs"
                    >
                      Start Quiz Session
                      <ArrowRight className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
