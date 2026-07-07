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
  Sun,
  Moon,
  Trophy,
  Plus,
  RefreshCw,
  Calendar,
  Search,
  Filter,
  Trash2,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { User, Course, Material, Question, Progress, Tier, ChatMessage, Level, StudyPlan } from "./types";

export default function App() {
  // Navigation & User State
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isRegistering, setIsRegistering] = useState(false);
  const [currentView, setCurrentView] = useState<"login" | "dashboard" | "course-detail" | "quiz" | "admin">("login");
  
  // Theme & Layout State
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    return localStorage.getItem("theme") === "dark";
  });
  const [courseTab, setCourseTab] = useState<"curriculum" | "leaderboard">("curriculum");
  
  // Leaderboard State
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [activeLeaderboardTier, setActiveLeaderboardTier] = useState<Tier>("easy");
  const [isLeaderboardLoading, setIsLeaderboardLoading] = useState(false);

  // Registration Form State
  const [regName, setRegName] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regLevel, setRegLevel] = useState<"100L" | "200L" | "300L" | "400L" | "500L">("400L");
  const [regDept, setRegDept] = useState("Computer Science");
  const [regRole, setRegRole] = useState<"student" | "admin">("student");
  const [loginEmail, setLoginEmail] = useState("student@university.edu");
  const [loginError, setLoginError] = useState("");

  // Directory Navigation & Course Discovery Filters
  const [courses, setCourses] = useState<Course[]>([]);
  const [allCourses, setAllCourses] = useState<Course[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [progressList, setProgressList] = useState<Progress[]>([]);
  
  const [selectedCollege, setSelectedCollege] = useState<string>("All");
  const [selectedDept, setSelectedDept] = useState<string>("All");
  const [activeBrowseLevel, setActiveBrowseLevel] = useState<"100L" | "200L" | "300L" | "400L" | "500L">("400L");
  const [selectedStatus, setSelectedStatus] = useState<string>("All");
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Study Plan State
  const [activePlan, setActivePlan] = useState<StudyPlan | null>(null);
  const [selectedPlanType, setSelectedPlanType] = useState<"blitz" | "sprint" | "three-day" | "weekly">("three-day");
  const [studyPlanModalOpen, setStudyPlanModalOpen] = useState(false);
  const [isStartingPlan, setIsStartingPlan] = useState(false);

  // Active Quiz State
  const [activeTier, setActiveTier] = useState<Tier>("easy");
  const [quizQuestions, setQuizQuestions] = useState<Question[]>([]);
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);
  const [studentAnswers, setStudentAnswers] = useState<{ [key: number]: string }>({});
  const [flaggedQuestions, setFlaggedQuestions] = useState<{ [key: number]: boolean }>({});
  const [quizResult, setQuizResult] = useState<any>(null); // For daily or final results
  const [isSubmittingQuiz, setIsSubmittingQuiz] = useState(false);
  const [timeLeft, setTimeLeft] = useState<number>(900); // Dynamic based on day's questions count
  const [showTimeExpiredNotification, setShowTimeExpiredNotification] = useState<boolean>(false);

  const studentAnswersRef = useRef(studentAnswers);
  useEffect(() => {
    studentAnswersRef.current = studentAnswers;
  }, [studentAnswers]);

  const quizQuestionsRef = useRef(quizQuestions);
  useEffect(() => {
    quizQuestionsRef.current = quizQuestions;
  }, [quizQuestions]);

  // AI Tutor State
  const [isAiOpen, setIsAiOpen] = useState(false);
  const [aiMessage, setAiMessage] = useState("");
  const [aiHistory, setAiHistory] = useState<ChatMessage[]>([]);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const chatBottomRef = useRef<HTMLDivElement>(null);

  // Admin State
  const [adminCourseId, setAdminCourseId] = useState("");
  const [adminMaterialName, setAdminMaterialName] = useState("");
  const [adminMaterialUrl, setAdminMaterialUrl] = useState("");
  const [adminMaterialType, setAdminMaterialType] = useState("pdf");
  const [adminMaterialWeek, setAdminMaterialWeek] = useState<number | "">("");
  const [adminUploadSuccess, setAdminUploadSuccess] = useState("");
  const [adminBulkTier, setAdminBulkTier] = useState<Tier>("easy");
  const [adminBulkCount, setAdminBulkCount] = useState(50);
  const [adminBulkResponse, setAdminBulkResponse] = useState("");
  const [adminBulkError, setAdminBulkError] = useState("");
  const [adminQuestionsJson, setAdminQuestionsJson] = useState("");

  // Dynamic Course Creator State
  const [customCourseModalOpen, setCustomCourseModalOpen] = useState(false);
  const [customCode, setCustomCode] = useState("");
  const [customTitle, setCustomTitle] = useState("");
  const [customDept, setCustomDept] = useState("Computer Science");
  const [customCollege, setCustomCollege] = useState("Science and Computing");
  const [customUnits, setCustomUnits] = useState(3);
  const [customLevel, setCustomLevel] = useState<Level>("400L");
  const [selectedCustomPrograms, setSelectedCustomPrograms] = useState<string[]>([]);
  const [isGeneratingCourse, setIsGeneratingCourse] = useState(false);
  const [customCourseError, setCustomCourseError] = useState("");

  // Mobile responsive filters
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  // File upload state
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploadingFile, setIsUploadingFile] = useState(false);

  // Material Viewer Modal State
  const [activeViewerMaterial, setActiveViewerMaterial] = useState<Material | null>(null);

  // Initialize and Theme toggling
  useEffect(() => {
    if (currentUser) {
      fetchCourses();
      fetchProgress(currentUser.id);
    }
  }, [currentUser, activeBrowseLevel, selectedCollege, selectedDept]);

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  }, [isDarkMode]);

  useEffect(() => {
    if (chatBottomRef.current) {
      chatBottomRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [aiHistory, isAiLoading]);

  // Timer effect for Quiz
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

  // API Call Helpers
  const fetchCourses = async () => {
    try {
      // Fetch all courses for admin dropdowns
      const allRes = await fetch("/api/courses");
      if (allRes.ok) {
        const allData = await allRes.json();
        setAllCourses(allData);
      }

      // Fetch level/faculty filtered courses for student directory
      let url = `/api/courses?level=${activeBrowseLevel}`;
      if (selectedCollege !== "All") url += `&college=${encodeURIComponent(selectedCollege)}`;
      if (selectedDept !== "All") url += `&department=${encodeURIComponent(selectedDept)}`;
      
      const res = await fetch(url);
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

  const fetchActiveStudyPlan = async (userId: string, courseId: string, tier: Tier) => {
    try {
      const res = await fetch(`/api/study-plans/active?userId=${userId}&courseId=${courseId}&tier=${tier}`);
      if (res.ok) {
        const data = await res.json();
        setActivePlan(data.activePlan);
      }
    } catch (e) {
      console.error("Error fetching active study plan", e);
    }
  };

  // Onboarding / Auth Handlers
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
        setActiveBrowseLevel(user.level);
        setSelectedDept(user.department);
        if (user.role === "admin") {
          setCurrentView("admin");
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
        setActiveBrowseLevel(user.level);
        setSelectedDept(user.department);
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

  // Course Detail Handler
  const selectCourse = async (course: Course) => {
    setSelectedCourse(course);
    setCurrentView("course-detail");
    setCourseTab("curriculum");
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

  // Study Plan Launcher
  const handleStartTier = async (tier: Tier) => {
    if (!currentUser || !selectedCourse) return;
    setActiveTier(tier);
    await fetchActiveStudyPlan(currentUser.id, selectedCourse.id, tier);
    setStudyPlanModalOpen(true);
  };

  const handleConfirmPlan = async () => {
    if (!currentUser || !selectedCourse) return;
    setIsStartingPlan(true);
    try {
      const res = await fetch("/api/study-plans/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: currentUser.id,
          courseId: selectedCourse.id,
          tier: activeTier,
          planType: selectedPlanType,
        }),
      });
      if (res.ok) {
        const plan = await res.json();
        setActivePlan(plan);
      }
    } catch (e) {
      console.error("Error starting study plan", e);
    } finally {
      setIsStartingPlan(false);
    }
  };

  const handleResetPlan = async () => {
    if (!currentUser || !selectedCourse) return;
    if (!confirm("Are you sure you want to reset this study plan? All current progress for this tier will be cleared.")) return;
    
    try {
      const res = await fetch("/api/study-plans/reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: currentUser.id,
          courseId: selectedCourse.id,
          tier: activeTier,
        }),
      });
      if (res.ok) {
        setActivePlan(null);
      }
    } catch (e) {
      console.error("Error resetting study plan", e);
    }
  };

  // Quiz Launchers and Handlers
  const startDailyQuiz = async () => {
    if (!currentUser || !selectedCourse || !activePlan) return;
    setCurrentQuestionIdx(0);
    setStudentAnswers({});
    setFlaggedQuestions({});
    setQuizResult(null);
    setShowTimeExpiredNotification(false);

    try {
      // Fetch all questions for this tier
      const res = await fetch(`/api/courses/${selectedCourse.id}/tiers/${activeTier}/questions`);
      if (res.ok) {
        const allQuestions = await res.json();
        // Filter questions corresponding to active day
        const dayQuestionIds = activePlan.questionsPerDay[activePlan.currentDay] || [];
        const dayQuestions = allQuestions.filter((q: any) => dayQuestionIds.includes(q.id));
        
        setQuizQuestions(dayQuestions);
        // Set dynamic duration: 1.5 minutes per question
        setTimeLeft(dayQuestions.length * 90);
        setCurrentView("quiz");
        setStudyPlanModalOpen(false);
      }
    } catch (e) {
      console.error("Error starting daily quiz", e);
    }
  };

  const handleSelectOption = (option: string) => {
    setStudentAnswers({
      ...studentAnswers,
      [currentQuestionIdx]: option,
    });
  };

  const handleTypeAnswer = (text: string) => {
    setStudentAnswers({
      ...studentAnswers,
      [currentQuestionIdx]: text,
    });
  };

  const toggleFlagQuestion = () => {
    setFlaggedQuestions({
      ...flaggedQuestions,
      [currentQuestionIdx]: !flaggedQuestions[currentQuestionIdx],
    });
  };

  const handleQuizTimeout = async () => {
    await submitDailyAnswers();
    setShowTimeExpiredNotification(true);
  };

  const submitDailyAnswers = async () => {
    if (!currentUser || !selectedCourse || !activePlan) return;
    setIsSubmittingQuiz(true);

    const answersArray = quizQuestions.map((_, idx) => studentAnswers[idx] || "");

    try {
      const res = await fetch("/api/study-plans/submit-day", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: currentUser.id,
          courseId: selectedCourse.id,
          tier: activeTier,
          day: activePlan.currentDay,
          answers: answersArray,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setQuizResult(data);
        fetchProgress(currentUser.id);
        fetchLeaderboard(selectedCourse.id, activeTier);
      }
    } catch (e) {
      console.error("Error submitting daily answers", e);
    } finally {
      setIsSubmittingQuiz(false);
    }
  };

  // Custom Course Creator Handlers
  const handleCreateCustomCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    setCustomCourseError("");
    
    if (selectedCustomPrograms.length === 0) {
      alert("Please select at least one academic program for this course.");
      return;
    }

    setIsGeneratingCourse(true);

    try {
      const res = await fetch("/api/courses/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: customCode,
          title: customTitle,
          department: selectedCustomPrograms.join(", "),
          college: customCollege,
          units: customUnits,
          level: customLevel,
          userId: currentUser?.id,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setCustomCourseModalOpen(false);
        setCustomCode("");
        setCustomTitle("");
        setCustomLevel("400L");
        setSelectedCustomPrograms([]);
        fetchCourses();
        // Select newly created course
        selectCourse(data.course);
      } else {
        const err = await res.json();
        setCustomCourseError(err.error || "Course creation failed.");
      }
    } catch (error) {
      setCustomCourseError("Network error. AI Generation failed.");
    } finally {
      setIsGeneratingCourse(false);
    }
  };

  const handleAdminDeleteCourse = async (courseId: string, courseCode: string) => {
    const pin = prompt(`To delete course ${courseCode} and all its materials/progress, please enter the Admin Security PIN (PIN: 1234):`);
    if (pin === null) return; // user cancelled

    if (pin !== "1234") {
      alert("Unauthorized: Invalid Admin Security PIN.");
      return;
    }

    try {
      const res = await fetch(`/api/courses/${courseId}?pin=${encodeURIComponent(pin)}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pin })
      });

      if (res.ok) {
        alert(`Course ${courseCode} deleted successfully.`);
        fetchCourses();
        if (selectedCourse && selectedCourse.id === courseId) {
          setSelectedCourse(null);
        }
      } else {
        const err = await res.json();
        alert("Failed to delete course: " + (err.error || "Unknown error"));
      }
    } catch (e) {
      console.error(e);
      alert("Network error occurred while deleting course.");
    }
  };

  // Socratic Chat Handlers
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
      console.error("AI Socratic Tutor error", e);
    } finally {
      setIsAiLoading(false);
    }
  };

  // Admin Portal uploaders
  const handleAdminUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    setAdminUploadSuccess("");
    if (!adminCourseId || !adminMaterialName) {
      alert("Please select a course and enter a material name.");
      return;
    }

    let finalUrl = adminMaterialUrl;

    if (selectedFile) {
      setIsUploadingFile(true);
      const formData = new FormData();
      formData.append("file", selectedFile);

      try {
        const uploadRes = await fetch("/api/admin/upload-file", {
          method: "POST",
          body: formData,
        });

        if (!uploadRes.ok) {
          const err = await uploadRes.json();
          alert("File upload failed: " + (err.error || "Unknown error"));
          setIsUploadingFile(false);
          return;
        }

        const uploadData = await uploadRes.json();
        finalUrl = uploadData.fileUrl;
      } catch (uploadErr) {
        console.error("Upload error:", uploadErr);
        alert("Network error uploading file.");
        setIsUploadingFile(false);
        return;
      }
    }

    if (!finalUrl) {
      alert("Please either select a file to upload or enter a material URL.");
      return;
    }

    try {
      const res = await fetch("/api/admin/upload-material", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          courseId: adminCourseId,
          fileName: adminMaterialName,
          fileUrl: finalUrl,
          fileType: adminMaterialType,
          week: adminMaterialWeek || undefined
        }),
      });

      if (res.ok) {
        setAdminUploadSuccess("Academic material uploaded and logged successfully!");
        setAdminMaterialName("");
        setAdminMaterialUrl("");
        setAdminMaterialWeek("");
        setSelectedFile(null);
        // Reset file input element manually
        const fileInput = document.getElementById("materialFile") as HTMLInputElement;
        if (fileInput) fileInput.value = "";
        
        if (selectedCourse && selectedCourse.id === adminCourseId) {
          selectCourse(selectedCourse); // Refresh materials
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsUploadingFile(false);
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

    let questionPayload = [];

    if (adminQuestionsJson.trim()) {
      try {
        const parsed = JSON.parse(adminQuestionsJson);
        if (!Array.isArray(parsed)) {
          setAdminBulkError("Invalid JSON: Root must be a JSON array of questions.");
          return;
        }
        questionPayload = parsed;
      } catch (err: any) {
        setAdminBulkError("JSON Parsing Error: " + err.message);
        return;
      }
    } else {
      // Simulation fallback
      for (let i = 1; i <= adminBulkCount; i++) {
        questionPayload.push({
          questionText: `Admin custom uploaded sample question #${i} testing critical validation rules.`,
          options: ["Option A (Correct)", "Option B", "Option C", "Option D"],
          correctAnswer: "A",
          explanation: "Detail explanation validating exact admin tier requirements.",
        });
      }
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
        setAdminBulkResponse(data.message || `Uploaded exactly ${questionPayload.length} questions successfully!`);
        setAdminQuestionsJson(""); // Clear JSON on success
      } else {
        setAdminBulkError(data.error || "Validation error occurred.");
      }
    } catch (e: any) {
      setAdminBulkError("Network upload error.");
    }
  };

  // Helper Stats Calculation
  const getOverallProgress = () => {
    if (progressList.length === 0) return 0;
    const completedCount = progressList.filter((p) => p.status === "completed").length;
    return Math.round((completedCount / progressList.length) * 100);
  };

  const getFilteredCourses = () => {
    return courses.filter((c) => {
      // Text Search query
      const matchesSearch = c.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            c.title.toLowerCase().includes(searchQuery.toLowerCase());
      
      if (!matchesSearch) return false;

      // Progress Status filter
      if (selectedStatus === "All") return true;

      const courseProgress = progressList.filter((p) => p.courseId === c.id);
      const isCompleted = courseProgress.every((p) => p.status === "completed") && courseProgress.length > 0;
      const isStarted = courseProgress.some((p) => p.score > 0 || p.status === "completed");

      if (selectedStatus === "Completed") return isCompleted;
      if (selectedStatus === "In Progress") return isStarted && !isCompleted;
      if (selectedStatus === "Not Started") return !isStarted;

      return true;
    });
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className="bg-slate-50 dark:bg-slate-950 min-h-screen text-slate-800 dark:text-slate-100 font-sans antialiased relative transition-colors duration-305">
      
      {/* 1. ONBOARDING & LOGIN SCREEN */}
      {currentView === "login" && (
        <div className="min-h-screen flex flex-col items-center justify-center px-4 py-12 relative overflow-hidden">
          {/* Decorative blur elements */}
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-450/10 dark:bg-blue-950/20 rounded-full filter blur-3xl opacity-40 animate-pulse" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-450/10 dark:bg-indigo-950/20 rounded-full filter blur-3xl opacity-40 animate-pulse delay-100" />

          {/* Theme Switcher */}
          <div className="absolute top-6 right-6 z-50">
            <button
              onClick={() => setIsDarkMode(!isDarkMode)}
              className="p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-lg hover:scale-105 active:scale-95 transition-all text-slate-700 dark:text-slate-300 cursor-pointer"
            >
              {isDarkMode ? <Sun className="h-5 w-5 text-amber-400" /> : <Moon className="h-5 w-5" />}
            </button>
          </div>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full max-w-md text-center mb-8 z-10"
          >
            <div className="inline-flex p-4 bg-slate-900 dark:bg-slate-800 text-white rounded-2xl shadow-xl mb-4">
              <GraduationCap className="h-10 w-10" />
            </div>
            <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white font-serif mb-2">Wigwe Compass</h1>
            <p className="text-slate-650 dark:text-slate-400 font-medium">Navigating academics, nurturing fearless leaders.</p>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl shadow-2xl p-8 z-10"
          >
            <AnimatePresence mode="wait">
              {!isRegistering ? (
                // Login Form
                <motion.div
                  key="login"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  className="space-y-6"
                >
                  <div>
                    <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Welcome Back</h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Access your curated departmental resources.</p>
                  </div>

                  {loginError && (
                    <div className="p-3 bg-rose-50 dark:bg-rose-950/30 text-rose-700 dark:text-rose-400 text-xs rounded-lg flex items-center gap-2">
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
                        className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3.5 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-slate-900 dark:focus:ring-white transition-all"
                        required
                      />
                      <p className="text-[11px] text-slate-400 mt-1">Try <span className="font-semibold text-slate-500 dark:text-slate-300">student@university.edu</span> or <span className="font-semibold text-slate-505 dark:text-slate-300">admin@university.edu</span></p>
                    </div>

                    <div>
                      <div className="flex justify-between mb-1.5">
                        <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400">Password</label>
                        <span className="text-xs text-slate-400 cursor-not-allowed">Auto-filled</span>
                      </div>
                      <input 
                        type="password" 
                        defaultValue="••••••••"
                        className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3.5 text-sm text-slate-400 cursor-not-allowed"
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
                    <p className="text-sm text-slate-505 dark:text-slate-400">
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
                // Register Form
                <motion.div
                  key="register"
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  className="space-y-6"
                >
                  <div className="flex items-center gap-3">
                    <button 
                      onClick={() => setIsRegistering(false)}
                      className="p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800"
                    >
                      <ChevronLeft className="h-5 w-5 text-slate-600 dark:text-slate-400" />
                    </button>
                    <div>
                      <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Academic Onboarding</h2>
                      <p className="text-sm text-slate-500 dark:text-slate-400">Configure level and department.</p>
                    </div>
                  </div>

                  <form onSubmit={handleRegister} className="space-y-4">
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5">Full Name</label>
                      <input 
                        type="text" 
                        value={regName}
                        onChange={(e) => setRegName(e.target.value)}
                        placeholder="Alex Johnson"
                        className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3.5 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-slate-900 transition-all"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5">Email Address</label>
                      <input 
                        type="email" 
                        value={regEmail}
                        onChange={(e) => setRegEmail(e.target.value)}
                        placeholder="student@university.edu"
                        className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3.5 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-slate-900 transition-all"
                        required
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5">Level</label>
                        <select 
                          value={regLevel}
                          onChange={(e: any) => setRegLevel(e.target.value)}
                          className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3.5 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-slate-900 transition-all"
                        >
                          <option value="100L">100L</option>
                          <option value="200L">200L</option>
                          <option value="300L">300L</option>
                          <option value="400L">400L</option>
                          <option value="500L">500L</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5">Program</label>
                        <select 
                          value={regDept}
                          onChange={(e) => setRegDept(e.target.value)}
                          className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3.5 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-slate-900 transition-all"
                        >
                          <option value="BSc Data Science">BSc Data Science</option>
                          <option value="BSc Mathematics">BSc Mathematics</option>
                          <option value="BSc Computer Science">BSc Computer Science</option>
                          <option value="BSc Cybersecurity">BSc Cybersecurity</option>
                          <option value="BSc Software Engineering">BSc Software Engineering</option>
                          <option value="BSc Forensics Science">BSc Forensics Science</option>
                          <option value="BSc Robotics (Artificial Intelligence)">BSc Robotics (Artificial Intelligence)</option>
                          <option value="Information and Communications Technology">Information and Communications Technology</option>
                          <option value="BEng Electrical Engineering">BEng Electrical Engineering</option>
                          <option value="BEng Mechanical Engineering">BEng Mechanical Engineering</option>
                          <option value="BEng Computer Engineering">BEng Computer Engineering</option>
                          <option value="BA Theatre Arts">BA Theatre Arts</option>
                          <option value="BA Fine Arts">BA Fine Arts</option>
                          <option value="BSc Film and Screen Studies">BSc Film and Screen Studies</option>
                          <option value="BA/BSc Media and Communications">BA/BSc Media and Communications</option>
                          <option value="BSc Economics">BSc Economics</option>
                          <option value="BSc Business Administration">BSc Business Administration</option>
                          <option value="BSc Innovation and Social Entrepreneurship">BSc Innovation and Social Entrepreneurship</option>
                          <option value="BSc Accounting and Data Analytics">BSc Accounting and Data Analytics</option>
                          <option value="BSc Finance">BSc Finance</option>
                          <option value="BSc Finance and Financial Technology">BSc Finance and Financial Technology</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5">System Role</label>
                      <div className="flex gap-4">
                        <label className="flex items-center gap-2 cursor-pointer text-sm font-medium dark:text-slate-300">
                          <input 
                            type="radio" 
                            name="regRole"
                            checked={regRole === "student"}
                            onChange={() => setRegRole("student")}
                            className="text-slate-900 dark:text-slate-100 focus:ring-slate-900 dark:focus:ring-white"
                          />
                          Student
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer text-sm font-medium dark:text-slate-300">
                          <input 
                            type="radio" 
                            name="regRole"
                            checked={regRole === "admin"}
                            onChange={() => setRegRole("admin")}
                            className="text-slate-900 dark:text-slate-100 focus:ring-slate-900 dark:focus:ring-white"
                          />
                          Faculty Admin
                        </label>
                      </div>
                    </div>

                    <button 
                      type="submit"
                      className="w-full bg-slate-900 hover:bg-slate-800 dark:bg-slate-800 dark:hover:bg-slate-750 text-white font-semibold py-4 rounded-xl shadow-lg transition-transform active:scale-[0.98] flex items-center justify-center gap-2 mt-2"
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
          <header className="sticky top-0 w-full bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 z-30 shadow-xs">
            <div className="max-w-7xl mx-auto px-6 h-20 flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-slate-900 dark:bg-slate-800 text-white flex items-center justify-center shadow-lg animate-pulse">
                  <GraduationCap className="h-6 w-6" />
                </div>
                <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white font-serif">Wigwe Compass</h1>
                
                <button
                  type="button"
                  onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
                  className="hidden lg:flex p-2 text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all cursor-pointer ml-2"
                  title={isSidebarCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
                >
                  {isSidebarCollapsed ? <ChevronRight className="h-4.5 w-4.5" /> : <ChevronLeft className="h-4.5 w-4.5" />}
                </button>
              </div>

              <div className="flex items-center gap-4">
                {currentUser.role === "admin" && (
                  <button 
                    onClick={() => setCurrentView("admin")}
                    className="text-xs bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-800 font-semibold px-3 py-1.5 rounded-lg text-slate-700 dark:text-slate-300"
                  >
                    Admin Panel
                  </button>
                )}
                <div className="text-right hidden sm:block">
                  <p className="text-sm font-bold text-slate-900 dark:text-white">{currentUser.name}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">{currentUser.email}</p>
                </div>
                <button
                  onClick={() => setIsDarkMode(!isDarkMode)}
                  className="p-2.5 text-slate-400 hover:text-slate-950 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all cursor-pointer"
                >
                  {isDarkMode ? <Sun className="h-5 w-5 text-amber-400" /> : <Moon className="h-5 w-5" />}
                </button>
                <button 
                  onClick={() => {
                    setCurrentUser(null);
                    setCurrentView("login");
                  }}
                  className="p-2.5 text-slate-400 hover:text-slate-950 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all cursor-pointer"
                  title="Logout"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>
          </header>

          <main className="flex-grow max-w-7xl mx-auto w-full px-6 py-8 grid grid-cols-1 lg:grid-cols-4 gap-8 pb-24">
            
            {/* Left Filter Sidebar */}
            <div className={`lg:col-span-1 space-y-6 hidden ${isSidebarCollapsed ? "lg:hidden" : "lg:block"}`}>
              
              {/* Profile card & Level switch */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-slate-900 dark:bg-slate-800 text-white flex items-center justify-center font-bold text-lg">
                    {currentUser.name[0]}
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 dark:text-white truncate max-w-[150px]">{currentUser.name}</h3>
                    <p className="text-xs text-slate-400">{currentUser.department}</p>
                  </div>
                </div>

                <div className="border-t border-slate-100 dark:border-slate-800 pt-4 space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-slate-400 uppercase">Browse Level</span>
                    <span className="text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-300 px-2 py-0.5 rounded-md">{activeBrowseLevel}</span>
                  </div>
                  <div className="grid grid-cols-5 gap-1 bg-slate-50 dark:bg-slate-950 p-1 rounded-xl border border-slate-200 dark:border-slate-800">
                    {(["100L", "200L", "300L", "400L", "500L"] as Level[]).map((lvl) => (
                      <button
                        key={lvl}
                        onClick={() => setActiveBrowseLevel(lvl)}
                        className={`text-[10px] py-1.5 font-bold rounded-lg transition-all text-center cursor-pointer ${
                          activeBrowseLevel === lvl
                            ? "bg-slate-900 dark:bg-white text-white dark:text-slate-950 shadow-xs"
                            : "text-slate-400 hover:text-slate-600"
                        }`}
                      >
                        {lvl.replace("L", "")}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* College directory */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-5">
                <div className="flex items-center gap-2 text-slate-900 dark:text-white font-bold text-sm">
                  <Filter className="h-4 w-4" />
                  <span>College Directory</span>
                </div>

                <div className="space-y-2">
                  <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Colleges</span>
                  {["All", "Science and Computing", "Management and Social Sciences", "Engineering", "Art"].map((college) => (
                    <button
                      key={college}
                      onClick={() => {
                        setSelectedCollege(college);
                        setSelectedDept("All");
                      }}
                      className={`w-full text-left px-3.5 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center justify-between ${
                        selectedCollege === college
                          ? "bg-slate-900 dark:bg-white text-white dark:text-slate-950 shadow-xs"
                          : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800"
                      }`}
                    >
                      <span className="truncate">{college === "All" ? "All Faculties" : college}</span>
                      {selectedCollege === college && <CheckCircle2 className="h-3.5 w-3.5 shrink-0 ml-2" />}
                    </button>
                  ))}
                </div>

                <div className="space-y-2 border-t border-slate-100 dark:border-slate-800 pt-4">
                  <span className="block text-[10px] font-bold text-slate-450 uppercase tracking-wider mb-1.5">Programs</span>
                  {["All", "BSc Data Science", "BSc Mathematics", "BSc Computer Science", "BSc Cybersecurity", "BSc Software Engineering", "BSc Forensics Science", "BSc Robotics (Artificial Intelligence)", "Information and Communications Technology", "BEng Electrical Engineering", "BEng Mechanical Engineering", "BEng Computer Engineering", "BA Theatre Arts", "BA Fine Arts", "BSc Film and Screen Studies", "BA/BSc Media and Communications", "BSc Economics", "BSc Business Administration", "BSc Innovation and Social Entrepreneurship", "BSc Accounting and Data Analytics", "BSc Finance", "BSc Finance and Financial Technology"].map((dept) => {
                    const isSci = ["BSc Data Science", "BSc Mathematics", "BSc Computer Science", "BSc Cybersecurity", "BSc Software Engineering", "BSc Forensics Science", "BSc Robotics (Artificial Intelligence)", "Information and Communications Technology"].includes(dept);
                    const isEng = ["BEng Electrical Engineering", "BEng Mechanical Engineering", "BEng Computer Engineering"].includes(dept);
                    const isArt = ["BA Theatre Arts", "BA Fine Arts", "BSc Film and Screen Studies", "BA/BSc Media and Communications"].includes(dept);
                    const isMgt = ["BSc Economics", "BSc Business Administration", "BSc Innovation and Social Entrepreneurship", "BSc Accounting and Data Analytics", "BSc Finance", "BSc Finance and Financial Technology"].includes(dept);

                    if (selectedCollege === "Science and Computing" && !isSci && dept !== "All") return null;
                    if (selectedCollege === "Management and Social Sciences" && !isMgt && dept !== "All") return null;
                    if (selectedCollege === "Engineering" && !isEng && dept !== "All") return null;
                    if (selectedCollege === "Art" && !isArt && dept !== "All") return null;

                    return (
                      <button
                        key={dept}
                        onClick={() => setSelectedDept(dept)}
                        className={`w-full text-left px-3.5 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center justify-between ${
                          selectedDept === dept
                            ? "bg-slate-900 dark:bg-white text-white dark:text-slate-950 shadow-xs"
                            : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800"
                        }`}
                      >
                        <span className="truncate">{dept === "All" ? "All Programs" : dept}</span>
                        {selectedDept === dept && <CheckCircle2 className="h-3.5 w-3.5 shrink-0 ml-2" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Right Course Catalog List */}
            <div className={`${isSidebarCollapsed ? "lg:col-span-4" : "lg:col-span-3"} space-y-6`}>
              
              {/* Mobile Filter Trigger Tags */}
              <div className="lg:hidden flex flex-col gap-3">
                <div className="flex gap-2 items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold text-slate-400 uppercase">My Profile:</span>
                    <span className="text-xs font-bold text-slate-800 dark:text-white bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-2.5 py-1 rounded-xl">
                      {currentUser.name} ({currentUser.department})
                    </span>
                  </div>
                  <button 
                    onClick={() => setIsMobileFilterOpen(true)}
                    className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-950 dark:bg-white text-white dark:text-slate-950 text-xs font-extrabold rounded-xl shadow-md cursor-pointer transition-all active:scale-[0.97]"
                  >
                    <Filter className="h-3.5 w-3.5" />
                    Filters
                  </button>
                </div>

                <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
                  {/* Quick-pill for Level */}
                  <div className="flex items-center gap-1 shrink-0 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-2.5 py-1.5 rounded-xl">
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Lvl</span>
                    <select
                      value={activeBrowseLevel}
                      onChange={(e: any) => setActiveBrowseLevel(e.target.value)}
                      className="text-xs font-bold text-slate-800 dark:text-slate-250 bg-transparent focus:outline-none cursor-pointer"
                    >
                      <option value="100L">100L</option>
                      <option value="200L">200L</option>
                      <option value="300L">300L</option>
                      <option value="400L">400L</option>
                      <option value="500L">500L</option>
                    </select>
                  </div>

                  {/* Active filters summary */}
                  {selectedCollege !== "All" && (
                    <button 
                      onClick={() => setSelectedCollege("All")}
                      className="shrink-0 flex items-center gap-1.5 text-xs font-semibold bg-indigo-50 border border-indigo-100 text-indigo-700 dark:bg-indigo-950/20 dark:border-indigo-900/40 dark:text-indigo-400 px-3 py-1.5 rounded-xl cursor-pointer"
                    >
                      {selectedCollege}
                      <X className="h-3 w-3" />
                    </button>
                  )}
                  {selectedDept !== "All" && (
                    <button 
                      onClick={() => setSelectedDept("All")}
                      className="shrink-0 flex items-center gap-1.5 text-xs font-semibold bg-indigo-50 border border-indigo-100 text-indigo-700 dark:bg-indigo-950/20 dark:border-indigo-900/40 dark:text-indigo-400 px-3 py-1.5 rounded-xl cursor-pointer"
                    >
                      {selectedDept}
                      <X className="h-3 w-3" />
                    </button>
                  )}
                </div>
              </div>
              
              {/* Header Actions */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Syllabus Catalog</span>
                  <div className="flex items-center gap-2">
                    <h2 className="text-2xl font-bold font-serif text-slate-900 dark:text-white">Active Courses</h2>
                    <span className="bg-slate-100 dark:bg-slate-900 text-slate-700 dark:text-slate-350 text-xs px-2.5 py-0.5 rounded-full font-bold animate-pulse">
                      {getFilteredCourses().length} courses
                    </span>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                  <div className="relative flex-grow sm:flex-grow-0">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <input 
                      type="text"
                      placeholder="Search code or title..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full sm:w-60 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl pl-10 pr-4 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-slate-950 dark:focus:ring-white transition-all shadow-xs"
                    />
                  </div>
                </div>
              </div>

              {/* Status filtering row */}
              <div className="flex gap-2 overflow-x-auto pb-1">
                {["All", "Not Started", "In Progress", "Completed"].map((status) => (
                  <button
                    key={status}
                    onClick={() => setSelectedStatus(status)}
                    className={`px-4 py-1.5 rounded-full text-xs font-semibold border transition-all cursor-pointer shrink-0 ${
                      selectedStatus === status
                        ? "bg-slate-900 border-slate-900 text-white dark:bg-white dark:border-white dark:text-slate-950 shadow-xs"
                        : "bg-white dark:bg-slate-900 border-slate-200 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-350"
                    }`}
                  >
                    {status}
                  </button>
                ))}
              </div>

              {/* Course list grid */}
              {getFilteredCourses().length === 0 ? (
                <div className="p-16 text-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs">
                  <BookOpen className="h-12 w-12 text-slate-300 dark:text-slate-700 mx-auto mb-3" />
                  <h3 className="font-bold text-slate-900 dark:text-white text-md">No Courses Found</h3>
                  <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">No courses match the active filters or search terms. Try selecting a different college, level or clicking "Create Course".</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {getFilteredCourses().map((course) => {
                    const courseProgress = progressList.filter((p) => p.courseId === course.id);
                    const completedTiers = courseProgress.filter((p) => p.status === "completed").length;
                    const scorePercentage = completedTiers === 1 ? 33 : completedTiers === 2 ? 66 : completedTiers === 3 ? 100 : 0;
                    
                    return (
                      <motion.div
                        whileHover={{ y: -3 }}
                        key={course.id}
                        onClick={() => selectCourse(course)}
                        className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-6 shadow-sm hover:shadow-md transition-all cursor-pointer flex justify-between items-start gap-4"
                      >
                        <div className="space-y-4 flex-1 min-w-0">
                          <div className="space-y-1.5">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="bg-slate-100 dark:bg-slate-200 text-slate-900 dark:text-slate-950 text-[10px] font-bold uppercase tracking-widest px-2.5 py-0.5 rounded-md">
                                {course.code}
                              </span>
                              <span className="text-[10px] font-bold text-slate-400">
                                {course.units || 3} Units
                              </span>
                            </div>
                            <h4 className="text-lg font-bold font-serif text-slate-900 dark:text-white leading-snug truncate mt-1">
                              {course.title}
                            </h4>
                          </div>
                          
                          <div className="space-y-1">
                            <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold truncate">
                              {course.college || "General Studies"}
                            </p>
                            <p className="text-[10px] text-slate-400 font-medium">
                              {course.department} • Level {course.level}
                            </p>
                          </div>
                        </div>

                        {/* circular progress ring */}
                        <div className="relative w-16 h-16 flex-shrink-0 flex items-center justify-center">
                          <svg className="w-full h-full transform -rotate-90">
                            <circle cx="32" cy="32" r="24" stroke="#f1f5f9" className="dark:stroke-slate-800" strokeWidth="4" fill="transparent" />
                            <circle 
                              cx="32" cy="32" r="24" 
                              stroke="#0f172a" className="dark:stroke-white" strokeWidth="4" fill="transparent" 
                              strokeDasharray={150.7}
                              strokeDashoffset={150.7 - (150.7 * scorePercentage) / 100}
                              strokeLinecap="round"
                            />
                          </svg>
                          <span className="absolute text-xs font-bold text-slate-800 dark:text-white">{scorePercentage}%</span>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              )}

              {/* Bento Stats Row */}
              <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
                
                <div className="p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl flex items-center justify-between shadow-xs">
                  <div className="space-y-1">
                    <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Completion</p>
                    <p className="text-3xl font-bold text-slate-950 dark:text-white font-serif">{getOverallProgress()}%</p>
                  </div>
                  <div className="w-12 h-12 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-800 dark:text-emerald-400 rounded-xl flex items-center justify-center">
                    <CheckCircle2 className="h-6 w-6" />
                  </div>
                </div>

                <div className="p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl flex items-center justify-between shadow-xs">
                  <div className="space-y-1">
                    <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Study Streak</p>
                    <p className="text-3xl font-bold text-slate-950 dark:text-white font-serif">5 Days</p>
                  </div>
                  <div className="w-12 h-12 bg-amber-50 dark:bg-amber-900/20 text-amber-800 dark:text-amber-400 rounded-xl flex items-center justify-center">
                    <Calendar className="h-6 w-6" />
                  </div>
                </div>

                <div className="p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl flex items-center justify-between shadow-xs">
                  <div className="space-y-1">
                    <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Next Action</p>
                    <p className="text-md font-bold text-slate-900 dark:text-white font-serif leading-tight">Start Practice</p>
                    <p className="text-[10px] text-slate-400 font-medium">Continue active study plan</p>
                  </div>
                  <div className="w-12 h-12 bg-blue-50 dark:bg-blue-900/20 text-blue-800 dark:text-blue-400 rounded-xl flex items-center justify-center">
                    <Sparkles className="h-6 w-6" />
                  </div>
                </div>
              </section>
            </div>
          </main>

          {/* Socratic Tutor Chat FAB */}
          <button 
            onClick={() => {
              if (courses.length > 0) {
                if (!selectedCourse) setSelectedCourse(courses[0]);
                setIsAiOpen(true);
              }
            }}
            className="fixed right-6 bottom-6 w-14 h-14 bg-slate-950 dark:bg-white dark:text-slate-950 text-white rounded-full shadow-2xl flex items-center justify-center z-40 hover:scale-105 active:scale-95 transition-all cursor-pointer"
          >
            <Sparkles className="h-6 w-6 animate-pulse" />
          </button>

          {/* MOBILE RESPONSIVE BOTTOM SHEET DRAWER */}
        <AnimatePresence>
          {isMobileFilterOpen && (
            <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-end lg:hidden">
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-transparent"
                onClick={() => setIsMobileFilterOpen(false)}
              />
              <motion.div
                initial={{ y: "100%" }}
                animate={{ y: 0 }}
                exit={{ y: "100%" }}
                transition={{ type: "spring", damping: 25, stiffness: 220 }}
                className="bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 rounded-t-3xl p-6 w-full max-h-[80vh] overflow-y-auto space-y-6 z-10 shadow-2xl relative animate-none"
              >
                <div className="w-12 h-1.5 bg-slate-300 dark:bg-slate-700 rounded-full mx-auto mb-2" />
                <div className="flex justify-between items-center pb-2 border-b border-slate-100 dark:border-slate-800">
                  <h3 className="font-bold font-serif text-slate-900 dark:text-white text-md flex items-center gap-1.5">
                    <Filter className="h-4.5 w-4.5 text-indigo-500" />
                    Syllabus Navigation Filters
                  </h3>
                  <button 
                    onClick={() => setIsMobileFilterOpen(false)}
                    className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full text-slate-400"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                {/* College directory */}
                <div className="space-y-4">
                  <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Browse Colleges</span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {["All", "Science and Computing", "Management and Social Sciences", "Engineering", "Art"].map((college) => (
                      <button
                        key={college}
                        onClick={() => {
                          setSelectedCollege(college);
                          setSelectedDept("All");
                        }}
                        className={`text-left px-4 py-3 rounded-xl text-xs font-bold transition-all flex items-center justify-between cursor-pointer ${
                          selectedCollege === college
                            ? "bg-slate-900 dark:bg-white text-white dark:text-slate-950 shadow-md"
                            : "bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                        }`}
                      >
                        <span className="truncate">{college === "All" ? "All Faculties" : college}</span>
                        {selectedCollege === college && <CheckCircle2 className="h-4 w-4 shrink-0" />}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-4 border-t border-slate-100 dark:border-slate-800 pt-4">
                  <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Browse Programs</span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {["All", "BSc Data Science", "BSc Mathematics", "BSc Computer Science", "BSc Cybersecurity", "BSc Software Engineering", "BSc Forensics Science", "BSc Robotics (Artificial Intelligence)", "Information and Communications Technology", "BEng Electrical Engineering", "BEng Mechanical Engineering", "BEng Computer Engineering", "BA Theatre Arts", "BA Fine Arts", "BSc Film and Screen Studies", "BA/BSc Media and Communications", "BSc Economics", "BSc Business Administration", "BSc Innovation and Social Entrepreneurship", "BSc Accounting and Data Analytics", "BSc Finance", "BSc Finance and Financial Technology"].map((dept) => {
                      const isSci = ["BSc Data Science", "BSc Mathematics", "BSc Computer Science", "BSc Cybersecurity", "BSc Software Engineering", "BSc Forensics Science", "BSc Robotics (Artificial Intelligence)", "Information and Communications Technology"].includes(dept);
                      const isEng = ["BEng Electrical Engineering", "BEng Mechanical Engineering", "BEng Computer Engineering"].includes(dept);
                      const isArt = ["BA Theatre Arts", "BA Fine Arts", "BSc Film and Screen Studies", "BA/BSc Media and Communications"].includes(dept);
                      const isMgt = ["BSc Economics", "BSc Business Administration", "BSc Innovation and Social Entrepreneurship", "BSc Accounting and Data Analytics", "BSc Finance", "BSc Finance and Financial Technology"].includes(dept);

                      if (selectedCollege === "Science and Computing" && !isSci && dept !== "All") return null;
                      if (selectedCollege === "Management and Social Sciences" && !isMgt && dept !== "All") return null;
                      if (selectedCollege === "Engineering" && !isEng && dept !== "All") return null;
                      if (selectedCollege === "Art" && !isArt && dept !== "All") return null;

                      return (
                        <button
                          key={dept}
                          onClick={() => {
                            setSelectedDept(dept);
                            setIsMobileFilterOpen(false);
                          }}
                          className={`text-left px-4 py-3 rounded-xl text-xs font-bold transition-all flex items-center justify-between cursor-pointer ${
                            selectedDept === dept
                              ? "bg-slate-900 dark:bg-white text-white dark:text-slate-950 shadow-md"
                              : "bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                          }`}
                        >
                          <span className="truncate">{dept === "All" ? "All Programs" : dept}</span>
                          {selectedDept === dept && <CheckCircle2 className="h-4 w-4 shrink-0" />}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <button
                  onClick={() => setIsMobileFilterOpen(false)}
                  className="w-full py-3.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-md cursor-pointer transition-all"
                >
                  Apply Filters
                </button>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
      )}

      {/* 3. COURSE DETAIL VIEW */}
      {currentView === "course-detail" && currentUser && selectedCourse && (
        <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 transition-colors duration-300">
          <header className="sticky top-0 w-full bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 z-30 shadow-xs">
            <div className="max-w-4xl mx-auto px-6 h-20 flex justify-between items-center">
              <button 
                onClick={() => {
                  setSelectedCourse(null);
                  setCurrentView("dashboard");
                }}
                className="flex items-center gap-2 text-sm font-semibold text-slate-650 hover:text-slate-900 dark:text-slate-350 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 px-3 py-1.5 rounded-lg transition-all cursor-pointer"
              >
                <ChevronLeft className="h-4 w-4" />
                Back to Dashboard
              </button>

              <div className="flex items-center gap-4">
                <button
                  onClick={() => setIsDarkMode(!isDarkMode)}
                  className="p-2 text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all cursor-pointer"
                >
                  {isDarkMode ? <Sun className="h-5 w-5 text-amber-400" /> : <Moon className="h-5 w-5" />}
                </button>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold bg-slate-100 dark:bg-slate-200 px-2.5 py-1 rounded text-slate-900 dark:text-slate-955">{selectedCourse.code}</span>
                </div>
              </div>
            </div>
          </header>

          <main className="flex-grow max-w-4xl mx-auto w-full px-6 py-8 space-y-8 pb-24">
            
            {/* Header banner */}
            <div className="bg-slate-900 rounded-3xl overflow-hidden relative h-44 shadow-md text-white flex flex-col justify-end p-6">
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/35 to-transparent z-10" />
              <img 
                src="https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?q=80&w=1200&auto=format&fit=crop"
                alt="Header"
                className="absolute inset-0 w-full h-full object-cover opacity-55"
              />
              <div className="relative z-20 space-y-1.5">
                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-300 bg-white/10 px-2 py-0.5 rounded-md">
                  {selectedCourse.college || "CORE MODULE"}
                </span>
                <h2 className="text-2xl sm:text-3xl font-extrabold font-serif leading-tight">{selectedCourse.title}</h2>
                <p className="text-xs text-slate-300">
                  {selectedCourse.department} Department • {selectedCourse.units || 3} Credit Units
                </p>
              </div>
            </div>

            {/* Tab selector */}
            <div className="flex border-b border-slate-200 dark:border-slate-800 gap-6">
              <button
                onClick={() => setCourseTab("curriculum")}
                className={`pb-4 text-sm font-semibold relative transition-all cursor-pointer ${
                  courseTab === "curriculum"
                    ? "text-slate-950 dark:text-white"
                    : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-300"
                }`}
              >
                Curriculum & Quizzes
                {courseTab === "curriculum" && (
                  <motion.div
                    layoutId="activeCourseTab"
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-slate-950 dark:bg-white"
                  />
                )}
              </button>
              <button
                onClick={() => setCourseTab("leaderboard")}
                className={`pb-4 text-sm font-semibold relative transition-all cursor-pointer flex items-center gap-2 ${
                  courseTab === "leaderboard"
                    ? "text-slate-950 dark:text-white"
                    : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-300"
                }`}
              >
                <Trophy className="h-4 w-4 text-amber-500" />
                Global Leaderboard
                {courseTab === "leaderboard" && (
                  <motion.div
                    layoutId="activeCourseTab"
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-slate-950 dark:bg-white"
                  />
                )}
              </button>
            </div>

            {courseTab === "curriculum" ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
                
                {/* Course materials list */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-bold font-serif text-slate-950 dark:text-white flex items-center gap-2">
                      <BookOpen className="h-5 w-5 text-slate-750 dark:text-slate-300" />
                      Course Documents
                    </h3>
                    <span className="text-xs font-bold text-slate-400 uppercase">{materials.length} files</span>
                  </div>

                  {materials.length === 0 ? (
                    <div className="p-8 text-center bg-white dark:bg-slate-900 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">
                      <FileText className="h-10 w-10 text-slate-303 mx-auto mb-2" />
                      <p className="text-xs text-slate-500">No materials uploaded yet.</p>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {(() => {
                        const grouped: { [key: string]: typeof materials } = {};
                        materials.forEach((m) => {
                          const key = m.week ? `Week ${m.week}` : "General Reference";
                          if (!grouped[key]) grouped[key] = [];
                          grouped[key].push(m);
                        });

                        const sortedKeys = Object.keys(grouped).sort((a, b) => {
                          if (a === "General Reference") return 1;
                          if (b === "General Reference") return -1;
                          const numA = parseInt(a.replace("Week ", ""), 10);
                          const numB = parseInt(b.replace("Week ", ""), 10);
                          return numA - numB;
                        });

                        return sortedKeys.map((groupKey) => (
                          <div key={groupKey} className="space-y-3">
                            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5 border-b border-slate-100 dark:border-slate-800 pb-1.5 mt-2">
                              <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                              {groupKey}
                            </h4>
                            <div className="grid grid-cols-1 gap-3">
                              {grouped[groupKey].map((m) => (
                                <div key={m.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs space-y-3">
                                  <div className="flex items-center gap-3">
                                    <div className={`p-2.5 rounded-xl ${m.fileName.endsWith('.pdf') ? 'bg-red-55 text-red-700 dark:bg-red-900/20 dark:text-red-400' : 'bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400'}`}>
                                      <FileText className="h-5.5 w-5.5" />
                                    </div>
                                    <div className="flex-1 overflow-hidden">
                                      <h4 className="text-sm font-bold text-slate-900 dark:text-white truncate">{m.fileName}</h4>
                                      <p className="text-[10px] text-slate-400 capitalize">{m.fileType} document</p>
                                    </div>
                                  </div>
                                  <div className="flex gap-2">
                                    <button 
                                      onClick={() => setActiveViewerMaterial(m)}
                                      className="flex-grow bg-slate-950 hover:bg-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 text-white font-semibold py-2 rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                                    >
                                      <BookOpen className="h-3.5 w-3.5" />
                                      Open Document
                                    </button>
                                    <a 
                                      href={m.fileUrl}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="p-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-white rounded-xl flex items-center justify-center transition-all cursor-pointer"
                                    >
                                      <Download className="h-3.5 w-3.5" />
                                    </a>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        ));
                      })()}
                    </div>
                  )}
                </div>

                {/* Difficulty Tiers practice */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-bold font-serif text-slate-950 dark:text-white flex items-center gap-2">
                      <Clock className="h-5 w-5 text-slate-750 dark:text-slate-300" />
                      Difficulty Tiers
                    </h3>
                    <span className="text-xs font-bold text-slate-400 uppercase">50 Qs Each</span>
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
                          className={`border rounded-2xl p-5 flex items-center justify-between transition-all ${
                            isLocked 
                              ? 'bg-slate-100/50 dark:bg-slate-900/30 border-slate-200/50 dark:border-slate-800/40 text-slate-400 dark:text-slate-500 opacity-70' 
                              : isCompleted 
                                ? 'bg-emerald-50/40 dark:bg-emerald-950/15 border-emerald-200 dark:border-emerald-900/50 text-emerald-950 dark:text-emerald-300'
                                : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white hover:border-slate-400 dark:hover:border-slate-700 shadow-sm'
                          }`}
                        >
                          <div className="flex gap-4 items-center">
                            <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                              isLocked 
                                ? 'bg-slate-200 dark:bg-slate-800 text-slate-400' 
                                : isCompleted 
                                  ? 'bg-emerald-100 dark:bg-emerald-900/50 text-emerald-800 dark:text-emerald-250'
                                  : 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white'
                            }`}>
                              {isLocked ? <Lock className="h-5 w-5" /> : <Unlock className="h-5 w-5" />}
                            </div>
                            <div>
                              <h4 className="font-bold font-serif capitalize text-sm flex items-center gap-2">
                                {tier} Tier
                                {isCompleted && (
                                  <span className="bg-emerald-100 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-300 text-[9px] uppercase font-bold px-1.5 py-0.5 rounded">PASSED</span>
                                )}
                              </h4>
                              <p className="text-xs text-slate-500 dark:text-slate-400">
                                {tier === "easy" ? "Definitions & recall check" : tier === "medium" ? "Analytical & conceptual tasks" : "Advanced scenario synthesis"}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            {scoreText && (
                              <span className="text-xs font-bold text-slate-750 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded">{scoreText}</span>
                            )}
                            {!isLocked && (
                              <button 
                                onClick={() => handleStartTier(tier)}
                                className="bg-slate-950 hover:bg-slate-800 dark:bg-slate-800 dark:hover:bg-slate-750 text-white font-semibold px-4 py-2 rounded-xl text-xs flex items-center gap-1 cursor-pointer transition-all"
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

                  <div className="p-4 bg-blue-50 dark:bg-blue-950/20 text-blue-900 dark:text-blue-300 rounded-2xl border border-blue-105 dark:border-blue-900/40 flex gap-3 items-start animate-pulse">
                    <AlertCircle className="h-5 w-5 text-blue-700 shrink-0 mt-0.5" />
                    <p className="text-xs leading-relaxed">
                      <strong>Nigeria University Standard:</strong> Unlocking consecutive difficulty tiers requires a cumulative score of <strong>70%</strong> (at least 35/50 correct answers).
                    </p>
                  </div>
                </div>

              </div>
            ) : (
              // Global Leaderboard
              <div className="space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div>
                    <h3 className="text-lg font-bold font-serif text-slate-950 dark:text-white flex items-center gap-2">
                      <Trophy className="h-5 w-5 text-amber-500" />
                      Classroom Standings
                    </h3>
                    <p className="text-xs text-slate-450">Top scoring peer student reviews</p>
                  </div>
                  
                  <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-800 self-start sm:self-auto">
                    {(["easy", "medium", "hard"] as Tier[]).map((t) => (
                      <button
                        key={t}
                        onClick={() => setActiveLeaderboardTier(t)}
                        className={`px-3 py-1.5 text-xs font-bold rounded-lg uppercase transition-all cursor-pointer ${
                          activeLeaderboardTier === t
                            ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs"
                            : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                        }`}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </div>

                {isLeaderboardLoading ? (
                  <div className="p-12 text-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl flex flex-col items-center justify-center gap-2 animate-pulse">
                    <div className="w-8 h-8 border-4 border-slate-950 border-t-transparent dark:border-white dark:border-t-transparent rounded-full animate-spin" />
                    <p className="text-xs text-slate-400">Loading standings...</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {leaderboard.map((student, idx) => {
                      const isMe = student.userId === currentUser.id;
                      return (
                        <div 
                          key={student.userId}
                          className={`flex items-center justify-between p-4 rounded-2xl border transition-all ${
                            isMe
                              ? "bg-slate-950 border-slate-950 text-white dark:bg-slate-800 dark:border-slate-750 shadow-md"
                              : "bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800 text-slate-800 dark:text-slate-100"
                          }`}
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <span className="w-6 font-bold text-center text-sm">{idx + 1}</span>
                            <div className="truncate">
                              <h4 className="font-bold text-sm truncate">{student.name}</h4>
                              <p className="text-xs opacity-75 truncate">{student.department} • Level {student.level}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <span className="font-bold text-sm">{student.score}</span>
                            <span className="text-xs opacity-60">/ 50</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </main>

          {/* Persistent FAB */}
          <button 
            onClick={() => setIsAiOpen(true)}
            className="fixed right-6 bottom-6 w-14 h-14 bg-slate-950 dark:bg-white dark:text-slate-950 text-white rounded-full shadow-2xl flex items-center justify-center z-40 hover:scale-105 active:scale-95 transition-all cursor-pointer"
          >
            <Sparkles className="h-6 w-6" />
          </button>
        </div>
      )}

      {/* 4. ACTIVE QUIZ INTERFACE */}
      {currentView === "quiz" && selectedCourse && quizQuestions.length > 0 && (
        <div className="min-h-screen flex flex-col bg-white dark:bg-slate-950 transition-colors duration-300">
          
          <header className="sticky top-0 w-full bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 z-30 px-6 py-4">
            <div className="max-w-4xl mx-auto flex justify-between items-center mb-3">
              <button 
                onClick={() => {
                  if (confirm("Exit quiz? Daily progress on this session will not be saved.")) {
                    setCurrentView("course-detail");
                  }
                }}
                className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full text-slate-500 cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
              <h2 className="font-bold font-serif text-lg text-slate-900 dark:text-white">
                {selectedCourse.code} Practice
              </h2>
              
              <div className={`flex items-center gap-1.5 px-3 py-1.5 border rounded-full font-mono text-xs font-bold ${
                timeLeft < 60 ? "bg-rose-50 border-rose-200 text-rose-605 animate-pulse" : "bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400"
              }`}>
                <Clock className="h-3.5 w-3.5" />
                <span>{formatTime(timeLeft)}</span>
              </div>
            </div>
            
            <div className="max-w-4xl mx-auto">
              <div className="flex justify-between items-center text-[10px] text-slate-400 font-bold uppercase mb-1">
                <span>Day {activePlan?.currentDay} of {activePlan?.totalDays}</span>
                <span>Question {currentQuestionIdx + 1} of {quizQuestions.length}</span>
              </div>
              <div className="bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                <div 
                  className="bg-slate-950 dark:bg-white h-full rounded-full transition-all duration-300"
                  style={{ width: `${((currentQuestionIdx + 1) / quizQuestions.length) * 100}%` }}
                />
              </div>
            </div>
          </header>

          <main className="flex-grow max-w-2xl mx-auto w-full px-6 py-8 flex flex-col justify-between">
            <div className="space-y-6">
              
              {/* Question card */}
              <div className="space-y-2">
                <span className="text-[10px] bg-slate-100 dark:bg-slate-805 text-slate-600 dark:text-slate-350 px-2 py-0.5 rounded font-bold uppercase tracking-wider">
                  {quizQuestions[currentQuestionIdx].type || "mcq"}
                </span>
                <h3 className="text-lg sm:text-xl font-bold font-serif text-slate-900 dark:text-white leading-relaxed">
                  {quizQuestions[currentQuestionIdx].questionText}
                </h3>
              </div>

              {/* Dynamic Inputs depending on question type */}
              <div className="space-y-3">
                {(!quizQuestions[currentQuestionIdx].type || quizQuestions[currentQuestionIdx].type === "mcq" || quizQuestions[currentQuestionIdx].type === "true_false") && (
                  <div className="grid grid-cols-1 gap-3">
                    {quizQuestions[currentQuestionIdx].options?.map((option, index) => {
                      const label = String.fromCharCode(65 + index);
                      const isSelected = studentAnswers[currentQuestionIdx] === label || studentAnswers[currentQuestionIdx] === option;
                      
                      return (
                        <button
                          key={index}
                          onClick={() => handleSelectOption(quizQuestions[currentQuestionIdx].type === "true_false" ? option : label)}
                          className={`w-full text-left p-4 rounded-xl border font-semibold text-xs sm:text-sm flex items-center transition-all cursor-pointer ${
                            isSelected
                              ? "bg-slate-950 border-slate-950 text-white dark:bg-white dark:border-white dark:text-slate-950 shadow-md"
                              : "bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                          }`}
                        >
                          <span className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold mr-3 ${
                            isSelected ? "bg-white dark:bg-slate-950 text-slate-950 dark:text-white" : "bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
                          }`}>
                            {quizQuestions[currentQuestionIdx].type === "true_false" ? (index === 0 ? "T" : "F") : label}
                          </span>
                          <span className="truncate">{option}</span>
                        </button>
                      );
                    })}
                  </div>
                )}

                {quizQuestions[currentQuestionIdx].type === "fill_blank" && (
                  <div className="space-y-2">
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider">Type Your Answer</label>
                    <input
                      type="text"
                      placeholder="Type the exact term..."
                      value={studentAnswers[currentQuestionIdx] || ""}
                      onChange={(e) => handleTypeAnswer(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3.5 text-sm focus:outline-none focus:ring-2 focus:ring-slate-950 dark:focus:ring-white transition-all shadow-inner text-slate-900 dark:text-white"
                    />
                  </div>
                )}

                {quizQuestions[currentQuestionIdx].type === "short_answer" && (
                  <div className="space-y-2">
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider">Type Your Short Answer Explanation</label>
                    <textarea
                      placeholder="Explain your understanding of the concept in 1-2 sentences..."
                      value={studentAnswers[currentQuestionIdx] || ""}
                      onChange={(e) => handleTypeAnswer(e.target.value)}
                      className="w-full h-32 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-805 rounded-xl px-4 py-3.5 text-sm focus:outline-none focus:ring-2 focus:ring-slate-950 dark:focus:ring-white transition-all shadow-inner resize-none text-slate-900 dark:text-white"
                    />
                    <div className="text-right text-[10px] text-slate-400 font-bold">
                      {(studentAnswers[currentQuestionIdx] || "").length} characters
                    </div>
                  </div>
                )}
              </div>

              {/* Flag question */}
              <div className="flex justify-center">
                <button
                  onClick={toggleFlagQuestion}
                  className={`flex items-center gap-1.5 px-4 py-2 border rounded-full text-[10px] font-bold uppercase transition-all cursor-pointer ${
                    flaggedQuestions[currentQuestionIdx]
                      ? "bg-amber-50 border-amber-205 text-amber-805 dark:bg-amber-900/20 dark:text-amber-400"
                      : "border-slate-200 dark:border-slate-800 text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-900"
                  }`}
                >
                  <Flag className={`h-3.5 w-3.5 ${flaggedQuestions[currentQuestionIdx] ? "fill-amber-600 text-amber-600" : ""}`} />
                  {flaggedQuestions[currentQuestionIdx] ? "Flagged" : "Flag"}
                </button>
              </div>
            </div>

            {/* Navigation footer */}
            <div className="flex justify-between items-center gap-4 pt-6 border-t border-slate-100 dark:border-slate-800 mt-12">
              <button 
                onClick={() => setCurrentQuestionIdx((p) => Math.max(0, p - 1))}
                disabled={currentQuestionIdx === 0}
                className="flex-1 py-3.5 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold rounded-xl hover:bg-slate-50 dark:hover:bg-slate-900 transition-all disabled:opacity-40 cursor-pointer"
              >
                Previous
              </button>

              {currentQuestionIdx < quizQuestions.length - 1 ? (
                <button 
                  onClick={() => setCurrentQuestionIdx((p) => p + 1)}
                  className="flex-1 py-3.5 bg-slate-950 dark:bg-white text-white dark:text-slate-950 text-xs font-bold rounded-xl hover:bg-slate-800 transition-all cursor-pointer"
                >
                  Next
                </button>
              ) : (
                <button 
                  onClick={submitDailyAnswers}
                  disabled={isSubmittingQuiz}
                  className="flex-1 py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-md"
                >
                  {isSubmittingQuiz ? "Submitting..." : "Finish Day Quiz"}
                  <CheckCircle2 className="h-4 w-4" />
                </button>
              )}
            </div>

          </main>
        </div>
      )}

      {/* 5. POST-QUIZ DAILY/FINAL RESULTS MODAL */}
      <AnimatePresence>
        {quizResult && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-2xl max-w-xl w-full max-h-[85vh] overflow-y-auto space-y-6 relative overflow-hidden"
            >
              {/* Confetti decoration for passing score */}
              {quizResult.passed && (
                <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-3xl z-10">
                  {Array.from({ length: 30 }).map((_, i) => {
                    const colors = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899"];
                    const randomColor = colors[Math.floor(Math.random() * colors.length)];
                    const left = Math.random() * 100;
                    const delay = Math.random() * 1.2;
                    const duration = 2.0 + Math.random() * 1.5;
                    
                    return (
                      <motion.div
                        key={i}
                        className="absolute w-2 h-4 rounded-xs"
                        style={{
                          backgroundColor: randomColor,
                          left: `${left}%`,
                          top: -20,
                        }}
                        animate={{
                          y: [0, 500],
                          x: [0, (Math.random() - 0.5) * 80],
                          rotate: [0, 360 + Math.random() * 360],
                        }}
                        transition={{
                          duration,
                          delay,
                          ease: "easeOut",
                          repeat: Infinity,
                        }}
                      />
                    );
                  })}
                </div>
              )}

              <div className="text-center space-y-2">
                <div className="inline-flex p-3 rounded-2xl bg-slate-950 dark:bg-slate-800 text-white shadow-xl">
                  <GraduationCap className="h-8 w-8" />
                </div>
                <h3 className="text-2xl font-bold font-serif text-slate-900 dark:text-white">
                  {quizResult.passed !== undefined ? "Plan Completed!" : "Day Completed!"}
                </h3>
                <p className="text-xs text-slate-500">
                  Evaluation for {selectedCourse?.title}
                </p>
              </div>

              {/* Scores Grid */}
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-2xl text-center">
                  <span className="block text-[10px] font-bold text-slate-400 uppercase">Day Correct</span>
                  <p className="text-2xl font-extrabold text-slate-900 dark:text-white mt-1">
                    {quizResult.score} / {quizResult.totalQuestions}
                  </p>
                </div>
                
                <div className={`p-4 rounded-2xl border text-center ${
                  quizResult.passed 
                    ? "bg-emerald-50 border-emerald-200 text-emerald-800 dark:bg-emerald-950/20 dark:text-emerald-400" 
                    : "bg-slate-50 dark:bg-slate-950 border-slate-100 dark:border-slate-800 text-slate-900 dark:text-white"
                }`}>
                  <span className="block text-[10px] font-bold text-slate-400 uppercase">Cumulative Progress</span>
                  <p className="text-2xl font-extrabold mt-1">
                    {quizResult.cumulativeScore !== undefined ? `${quizResult.cumulativeScore}/50` : `${quizResult.percentage.toFixed(0)}%`}
                  </p>
                </div>
              </div>

              {/* Status Banner */}
              {quizResult.passed !== undefined && (
                <div className={`p-4 rounded-xl border text-xs font-bold text-center ${
                  quizResult.passed
                    ? "bg-emerald-50 border-emerald-200 text-emerald-800 dark:bg-emerald-950/20 dark:text-emerald-400"
                    : "bg-rose-50 border-rose-200 text-rose-800 dark:bg-rose-950/20 dark:text-rose-450"
                }`}>
                  {quizResult.passed
                    ? "🎉 Congratulations! You cleared the 70% threshold (at least 35/50) and unlocked the next difficulty tier."
                    : "📚 Benchmark unmet. You scored less than the 70% cumulative threshold. Chat with Socratic Assistant or try again!"}
                </div>
              )}

              {/* Daily quiz list review */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Review Daily Answers</h4>
                <div className="space-y-4 max-h-56 overflow-y-auto pr-1 divide-y divide-slate-100 dark:divide-slate-800">
                  {quizResult.results.map((r: any, idx: number) => (
                    <div key={idx} className="pt-3 space-y-1.5 text-xs">
                      <p className="font-bold text-slate-900 dark:text-white">{r.questionText}</p>
                      <div className="flex gap-4">
                        <span className="text-slate-500">Your Answer: <strong className={r.isCorrect ? "text-emerald-650" : "text-rose-600"}>{r.studentAnswer || "Empty"}</strong></span>
                        <span className="text-slate-500">Correct: <strong className="text-emerald-650">{r.correctAnswer}</strong></span>
                      </div>
                      <div className="p-3 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-lg italic">
                        <strong>Explanation:</strong> {r.explanation}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <button
                onClick={() => {
                  setQuizResult(null);
                  setCurrentView("course-detail");
                  if (currentUser && selectedCourse) {
                    fetchActiveStudyPlan(currentUser.id, selectedCourse.id, activeTier);
                  }
                }}
                className="w-full py-4 bg-slate-950 dark:bg-white text-white dark:text-slate-950 font-bold text-xs rounded-2xl shadow-lg hover:bg-slate-800 transition-all cursor-pointer"
              >
                {quizResult.passed !== undefined ? "Return to Course Details" : "Back to study planner"}
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 6. STUDY PLAN SELECTOR MODAL */}
      <AnimatePresence>
        {studyPlanModalOpen && selectedCourse && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 15 }}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto space-y-6"
            >
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-slate-800 dark:text-white" />
                  <h3 className="font-bold font-serif text-md text-slate-900 dark:text-white">Study Plan Dashboard</h3>
                </div>
                <button 
                  onClick={() => setStudyPlanModalOpen(false)}
                  className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full text-slate-400"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {!activePlan ? (
                // Setup plan selector
                <div className="space-y-4">
                  <div className="space-y-1">
                    <p className="text-xs text-slate-400 dark:text-slate-400 leading-relaxed">
                      Choose how to distribute the 50 practice questions based on your schedule. Tier locks and evaluations are validated when all days are complete.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {[
                      { type: "blitz", label: "⚡ Blitz (1 Day)", desc: "50 questions in a single session", dur: "1 Day" },
                      { type: "sprint", label: "🏃‍♂️ Two-Day Sprint", desc: "25 questions per day", dur: "2 Days" },
                      { type: "three-day", label: "🗓️ Three-Day Plan", desc: "17, 17, and 16 questions per day", dur: "3 Days" },
                      { type: "weekly", label: "📅 Weekly Plan", desc: "7 questions per day (8 on day 7)", dur: "7 Days" }
                    ].map((planOpt) => (
                      <button
                        key={planOpt.type}
                        onClick={() => setSelectedPlanType(planOpt.type as any)}
                        className={`text-left p-4 border rounded-xl transition-all cursor-pointer flex flex-col justify-between gap-1.5 ${
                          selectedPlanType === planOpt.type
                            ? "border-slate-950 dark:border-white bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white shadow-xs"
                            : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:border-slate-350"
                        }`}
                      >
                        <h4 className="font-bold text-xs sm:text-sm">{planOpt.label}</h4>
                        <p className="text-[10px] text-slate-400">{planOpt.desc}</p>
                        <span className="text-[10px] font-extrabold bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded self-start mt-1 text-slate-600 dark:text-slate-400">
                          {planOpt.dur}
                        </span>
                      </button>
                    ))}
                  </div>

                  <button
                    onClick={handleConfirmPlan}
                    disabled={isStartingPlan}
                    className="w-full py-4 bg-slate-950 hover:bg-slate-900 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-950 font-bold text-xs rounded-xl shadow-md cursor-pointer transition-all"
                  >
                    {isStartingPlan ? "Setting Up Planner..." : "Initialize Study Plan"}
                  </button>
                </div>
              ) : (
                // Render Day-by-Day Study Planner Dashboard
                <div className="space-y-6">
                  <div className="p-4 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-2xl flex justify-between items-center">
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase">Plan Type</span>
                      <h4 className="font-bold text-xs uppercase text-slate-950 dark:text-white capitalize">{activePlan.planType} Plan</h4>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] font-bold text-slate-400 uppercase">Status</span>
                      <h4 className="font-extrabold text-xs text-amber-600">{activePlan.completedDays.length} / {activePlan.totalDays} Days Completed</h4>
                    </div>
                  </div>

                  {/* Day Checklist */}
                  <div className="space-y-2">
                    <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Day Progress Timeline</span>
                    {Array.from({ length: activePlan.totalDays }).map((_, index) => {
                      const day = index + 1;
                      const isCompleted = activePlan.completedDays.includes(day);
                      const isActive = activePlan.currentDay === day && activePlan.status === "active";
                      const isLocked = day > activePlan.currentDay;
                      const score = activePlan.scoresPerDay[day];

                      return (
                        <div 
                          key={day}
                          className={`p-3.5 border rounded-xl flex items-center justify-between transition-all ${
                            isCompleted
                              ? "bg-emerald-50/40 border-emerald-100 text-emerald-950 dark:bg-emerald-950/10 dark:border-emerald-900/40 dark:text-emerald-450"
                              : isActive
                                ? "bg-slate-50 border-slate-300 text-slate-950 dark:bg-slate-950 dark:border-slate-700 dark:text-white scale-[1.01] shadow-xs"
                                : "bg-slate-100/50 border-slate-200/50 text-slate-400 dark:bg-slate-900/20 dark:border-slate-800/40 opacity-70"
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <span className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-[10px] ${
                              isCompleted 
                                ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-305" 
                                : isActive 
                                  ? "bg-slate-950 text-white dark:bg-white dark:text-slate-950" 
                                  : "bg-slate-200 dark:bg-slate-800 text-slate-400"
                            }`}>
                              {day}
                            </span>
                            <div className="text-xs font-bold">
                              Day {day} study and review questions
                              {isCompleted && <span className="block text-[9px] text-slate-400 font-semibold mt-0.5">Score: {score} Correct</span>}
                            </div>
                          </div>

                          <div>
                            {isCompleted ? (
                              <span className="text-[10px] font-bold text-emerald-650">Done</span>
                            ) : isActive ? (
                              <button 
                                onClick={startDailyQuiz}
                                className="bg-slate-950 hover:bg-slate-900 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-950 font-bold px-3 py-1.5 rounded-lg text-[10px] transition-all cursor-pointer shadow-sm"
                              >
                                Start Quiz
                              </button>
                            ) : (
                              <Lock className="h-4 w-4 text-slate-350 dark:text-slate-600" />
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={handleResetPlan}
                      className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs rounded-xl flex items-center justify-center gap-1 cursor-pointer transition-all border border-slate-200 dark:border-slate-700"
                    >
                      <RefreshCw className="h-4 w-4" />
                      Reset Plan
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 7. CUSTOM COURSE CREATOR MODAL */}
      <AnimatePresence>
        {customCourseModalOpen && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-2xl max-w-md w-full space-y-6"
            >
              <div className="flex justify-between items-center">
                <h3 className="font-bold font-serif text-md text-slate-900 dark:text-white flex items-center gap-2">
                  <Plus className="h-5 w-5 text-indigo-500" />
                  Add Custom Subject
                </h3>
                <button 
                  onClick={() => setCustomCourseModalOpen(false)}
                  className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full text-slate-400"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {customCourseError && (
                <div className="p-3 bg-rose-50 text-rose-705 text-xs rounded-xl font-bold flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{customCourseError}</span>
                </div>
              )}

              {isGeneratingCourse ? (
                <div className="py-10 text-center space-y-4">
                  <div className="w-10 h-10 border-4 border-slate-950 border-t-transparent dark:border-white dark:border-t-transparent rounded-full animate-spin mx-auto" />
                  <div className="space-y-1">
                    <h4 className="font-bold text-xs text-slate-900 dark:text-white">AI Engine Working</h4>
                    <p className="text-[10px] text-slate-450 leading-relaxed max-w-[200px] mx-auto">
                      Creating course syllabus, seeding curriculum, and generating 50 dynamic practice questions...
                    </p>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleCreateCustomCourse} className="space-y-4">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-450 uppercase mb-1.5">Course Code</label>
                    <input
                      type="text"
                      placeholder="e.g. MTH101"
                      value={customCode}
                      onChange={(e) => setCustomCode(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-xs focus:outline-none focus:ring-2 focus:ring-slate-950 transition-all text-slate-900 dark:text-white"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1.5">Course Title</label>
                    <input
                      type="text"
                      placeholder="e.g. Elementary Mathematics"
                      value={customTitle}
                      onChange={(e) => setCustomTitle(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-xs focus:outline-none focus:ring-2 focus:ring-slate-950 transition-all text-slate-900 dark:text-white"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1.5">College</label>
                      <select
                        value={customCollege}
                        onChange={(e) => setCustomCollege(e.target.value)}
                        className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-3 text-xs focus:outline-none text-slate-900 dark:text-white"
                      >
                        <option value="Science and Computing">Science and Computing</option>
                        <option value="Management and Social Sciences">Management and Social Sciences</option>
                        <option value="Engineering">Engineering</option>
                        <option value="Art">Art</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1.5">Units</label>
                      <input
                        type="number"
                        min="1"
                        max="6"
                        value={customUnits}
                        onChange={(e) => setCustomUnits(Number(e.target.value))}
                        className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-xs focus:outline-none text-slate-900 dark:text-white"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1.5">Level</label>
                    <select
                      value={customLevel}
                      onChange={(e: any) => setCustomLevel(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-3 text-xs focus:outline-none text-slate-900 dark:text-white"
                    >
                      <option value="100L">100L</option>
                      <option value="200L">200L</option>
                      <option value="300L">300L</option>
                      <option value="400L">400L</option>
                      <option value="500L">500L</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1.5">Offered by Programs (Select All That Apply)</label>
                    <div className="max-h-40 overflow-y-auto border border-slate-200 dark:border-slate-800 rounded-xl p-3 space-y-2 bg-slate-50 dark:bg-slate-950 text-left">
                      {[
                        "BSc Data Science", "BSc Mathematics", "BSc Computer Science", "BSc Cybersecurity",
                        "BSc Software Engineering", "BSc Forensics Science", "BSc Robotics (Artificial Intelligence)",
                        "Information and Communications Technology", "BEng Electrical Engineering", "BEng Mechanical Engineering",
                        "BEng Computer Engineering", "BA Theatre Arts", "BA Fine Arts", "BSc Film and Screen Studies",
                        "BA/BSc Media and Communications", "BSc Economics", "BSc Business Administration",
                        "BSc Innovation and Social Entrepreneurship", "BSc Accounting and Data Analytics",
                        "BSc Finance", "BSc Finance and Financial Technology"
                      ].map((prog) => {
                        const isChecked = selectedCustomPrograms.includes(prog);
                        return (
                          <label key={prog} className="flex items-start gap-2.5 cursor-pointer text-xs font-semibold text-slate-700 dark:text-slate-350 select-none">
                            <input 
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => {
                                if (isChecked) {
                                  setSelectedCustomPrograms(selectedCustomPrograms.filter(p => p !== prog));
                                } else {
                                  setSelectedCustomPrograms([...selectedCustomPrograms, prog]);
                                }
                              }}
                              className="mt-0.5 rounded border-slate-300 text-indigo-650 focus:ring-indigo-500"
                            />
                            <span>{prog}</span>
                          </label>
                        );
                      })}
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-4 bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-950 font-bold text-xs rounded-xl shadow-md cursor-pointer transition-all"
                  >
                    AI Create Custom Course
                  </button>
                </form>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 8. ADMIN PORTAL VIEW */}
      {currentView === "admin" && currentUser && (
        <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 transition-colors duration-300">
          <header className="sticky top-0 w-full bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 z-30 shadow-xs">
            <div className="max-w-4xl mx-auto px-6 h-20 flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-red-600 text-white flex items-center justify-center shadow-md">
                  <GraduationCap className="h-5 w-5" />
                </div>
                <h1 className="text-md font-bold font-serif text-slate-900 dark:text-white">Admin Faculty Panel</h1>
              </div>

              <div className="flex items-center gap-3">
                <button 
                  onClick={() => {
                    setCurrentView("dashboard");
                    fetchCourses();
                  }}
                  className="text-[10px] bg-slate-950 dark:bg-white text-white dark:text-slate-950 font-bold px-3 py-1.5 rounded-lg cursor-pointer"
                >
                  Student Dashboard
                </button>
                <button 
                  onClick={() => {
                    setCurrentUser(null);
                    setCurrentView("login");
                  }}
                  className="p-2 text-slate-400 hover:text-slate-950 dark:hover:text-white"
                >
                  Logout
                </button>
              </div>
            </div>
          </header>

          <main className="max-w-4xl mx-auto w-full px-6 py-8 space-y-8 pb-24">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h2 className="text-2xl font-bold text-slate-950 dark:text-white font-serif">Welcome, Dr. Ojo</h2>
                <p className="text-xs text-slate-500">Log new syllabi papers and run validation checks on question sizes.</p>
              </div>
              <button 
                onClick={() => setCustomCourseModalOpen(true)}
                className="bg-slate-950 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-950 font-bold px-4 py-2.5 rounded-xl text-xs flex items-center justify-center gap-1.5 cursor-pointer transition-all shadow-md shrink-0 self-start sm:self-auto"
              >
                <Plus className="h-4.5 w-4.5" />
                Create Course
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              
              {/* Upload document */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs space-y-4">
                <h3 className="font-bold font-serif text-md text-slate-950 dark:text-white flex items-center gap-1.5">
                  <Upload className="h-4.5 w-4.5 text-blue-500" />
                  Upload Course Material
                </h3>

                {adminUploadSuccess && (
                  <div className="p-3 bg-emerald-50 text-emerald-800 text-[10px] rounded-xl font-bold">
                    {adminUploadSuccess}
                  </div>
                )}

                <form onSubmit={handleAdminUpload} className="space-y-4">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Select Course</label>
                    <select
                      value={adminCourseId}
                      onChange={(e) => setAdminCourseId(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-3 text-xs focus:outline-none text-slate-900 dark:text-white"
                      required
                    >
                      <option value="">-- Choose Course --</option>
                      {allCourses.map((c) => (
                        <option key={c.id} value={c.id}>{c.code} - {c.title}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1.5">Upload Local Document</label>
                    <div className="border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl p-4 text-center bg-slate-50/30 dark:bg-slate-950/20 hover:border-slate-400 dark:hover:border-slate-600 transition-all">
                      <input
                        type="file"
                        id="materialFile"
                        accept=".pdf,.ppt,.pptx"
                        onChange={(e) => {
                          const file = e.target.files?.[0] || null;
                          setSelectedFile(file);
                          if (file) {
                            setAdminMaterialName(file.name.replace(/\.[^/.]+$/, ""));
                            const ext = file.name.split('.').pop()?.toLowerCase();
                            if (ext === 'ppt' || ext === 'pptx') {
                              setAdminMaterialType('ppt');
                            } else {
                              setAdminMaterialType('pdf');
                            }
                          }
                        }}
                        className="hidden"
                      />
                      <label htmlFor="materialFile" className="cursor-pointer space-y-2 block">
                        <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 flex items-center justify-center mx-auto">
                          <Upload className="h-5 w-5" />
                        </div>
                        <div className="text-xs">
                          {selectedFile ? (
                            <span className="font-bold text-slate-900 dark:text-white">{selectedFile.name} ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)</span>
                          ) : (
                            <span className="text-slate-500">Drag & drop or <strong className="text-indigo-650 dark:text-indigo-400 hover:underline">browse</strong> to choose a file</span>
                          )}
                        </div>
                        <p className="text-[10px] text-slate-400">Supports PDF and PowerPoint (.ppt, .pptx) files up to 10MB</p>
                      </label>
                    </div>
                  </div>

                  <div className="text-center text-[10px] text-slate-400 font-bold uppercase py-1">— OR —</div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-450 uppercase mb-1">External Material URL</label>
                    <input
                      type="text"
                      placeholder="e.g. https://storage-link.pdf"
                      value={adminMaterialUrl}
                      onChange={(e) => {
                        setAdminMaterialUrl(e.target.value);
                        if (e.target.value) {
                          setSelectedFile(null);
                        }
                      }}
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-xs text-slate-950 dark:text-white"
                      disabled={!!selectedFile}
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Material Display Name</label>
                    <input
                      type="text"
                      placeholder="e.g. Dynamic Programming Handbook"
                      value={adminMaterialName}
                      onChange={(e) => setAdminMaterialName(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-xs text-slate-950 dark:text-white"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Type</label>
                    <select
                      value={adminMaterialType}
                      onChange={(e) => setAdminMaterialType(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-3 text-xs focus:outline-none text-slate-900 dark:text-white"
                    >
                      <option value="pdf">PDF File</option>
                      <option value="ppt">PowerPoint Presentation</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Target Week / Chapter</label>
                    <select
                      value={adminMaterialWeek}
                      onChange={(e) => setAdminMaterialWeek(e.target.value ? Number(e.target.value) : "")}
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-3 text-xs focus:outline-none text-slate-900 dark:text-white"
                    >
                      <option value="">-- No Specific Week (General Reference) --</option>
                      {Array.from({ length: 15 }).map((_, idx) => (
                        <option key={idx + 1} value={idx + 1}>Week {idx + 1}</option>
                      ))}
                    </select>
                  </div>

                  <button
                    type="submit"
                    disabled={isUploadingFile}
                    className="w-full py-3.5 bg-slate-950 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-md cursor-pointer transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {isUploadingFile ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Uploading local file...
                      </>
                    ) : (
                      "Upload & Log Material"
                    )}
                  </button>
                </form>
              </div>

              {/* Strict questions validator */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs space-y-4">
                <h3 className="font-bold font-serif text-md text-slate-950 dark:text-white flex items-center gap-1.5">
                  <Clock className="h-4.5 w-4.5 text-red-500" />
                  Strict 50-Question Validator
                </h3>

                <p className="text-[11px] text-slate-500 leading-relaxed">
                  Test the backend endpoint constraint validator. Uploading anything other than exactly 50 questions triggers a 400 validation error.
                </p>

                {adminBulkResponse && (
                  <div className="p-3 bg-emerald-50 text-emerald-800 text-xs rounded-xl border border-emerald-200">
                    {adminBulkResponse}
                  </div>
                )}

                {adminBulkError && (
                  <div className="p-3 bg-rose-50 text-rose-705 text-xs rounded-xl border border-rose-200">
                    <strong>Validation Error:</strong> {adminBulkError}
                  </div>
                )}

                <form onSubmit={handleAdminGenerateBulk} className="space-y-4">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Select Course</label>
                    <select
                      value={adminCourseId}
                      onChange={(e) => setAdminCourseId(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-805 rounded-xl px-3 py-3 text-xs focus:outline-none text-slate-900 dark:text-white"
                      required
                    >
                      <option value="">-- Choose Course --</option>
                      {allCourses.map((c) => (
                        <option key={c.id} value={c.id}>{c.code} - {c.title}</option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Tier</label>
                      <select
                        value={adminBulkTier}
                        onChange={(e: any) => setAdminBulkTier(e.target.value)}
                        className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-3 text-xs text-slate-900 dark:text-white"
                      >
                        <option value="easy">Easy</option>
                        <option value="medium">Medium</option>
                        <option value="hard">Hard</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Count</label>
                      <input 
                        type="number"
                        value={adminBulkCount}
                        onChange={(e) => setAdminBulkCount(Number(e.target.value))}
                        className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-xs text-slate-900 dark:text-white"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
                      Paste Custom Questions JSON (Optional)
                    </label>
                    <textarea
                      placeholder='[{"questionText": "Question text?", "options": ["A", "B", "C", "D"], "correctAnswer": "A", "explanation": "Why...", "type": "mcq"}, ...]'
                      value={adminQuestionsJson}
                      onChange={(e) => setAdminQuestionsJson(e.target.value)}
                      className="w-full h-28 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-805 rounded-xl px-3 py-2.5 text-xs focus:outline-none text-slate-900 dark:text-white font-mono resize-y"
                    />
                    <span className="text-[9px] text-slate-400 block mt-1 leading-normal">
                      Leave empty to auto-generate 50 simulated questions. Or paste a JSON array of questions containing: questionText, options (array of strings or null), correctAnswer, explanation, and type (optional).
                    </span>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-md cursor-pointer transition-all"
                  >
                    Simulate Bulk Question Upload
                  </button>
                </form>
              </div>

            </div>

            {/* Admin Course Directory & Management */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs space-y-4 mt-8">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                <h3 className="font-bold font-serif text-md text-slate-900 dark:text-white flex items-center gap-1.5">
                  <BookOpen className="h-4.5 w-4.5 text-indigo-500" />
                  Manage Academic Course Catalog
                </h3>
                <button
                  type="button"
                  onClick={() => setCustomCourseModalOpen(true)}
                  className="bg-slate-950 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-950 font-bold px-3.5 py-2 rounded-xl text-xs flex items-center justify-center gap-1.5 cursor-pointer transition-all shadow-md shrink-0"
                >
                  <Plus className="h-4 w-4" />
                  Create Course
                </button>
              </div>
              
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 font-bold uppercase tracking-wider">
                      <th className="py-3 px-2">Code</th>
                      <th className="py-3 px-2">Title</th>
                      <th className="py-3 px-2">Level</th>
                      <th className="py-3 px-2">Faculties & Programs</th>
                      <th className="py-3 px-2 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {allCourses.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-8 text-center text-slate-500 italic">No courses found in database state.</td>
                      </tr>
                    ) : (
                      allCourses.map((c) => (
                        <tr key={c.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors">
                          <td className="py-3.5 px-2 font-bold text-slate-900 dark:text-white">{c.code}</td>
                          <td className="py-3.5 px-2 font-semibold text-slate-700 dark:text-slate-300">{c.title}</td>
                          <td className="py-3.5 px-2"><span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded font-bold">{c.level}</span></td>
                          <td className="py-3.5 px-2 text-slate-500 max-w-xs truncate" title={c.department}>{c.department}</td>
                          <td className="py-3.5 px-2 text-right">
                            <button
                              type="button"
                              onClick={() => handleAdminDeleteCourse(c.id, c.code)}
                              className="p-2 bg-rose-50 hover:bg-rose-100 dark:bg-rose-900/20 dark:hover:bg-rose-900/30 text-rose-600 dark:text-rose-400 rounded-lg cursor-pointer transition-all flex items-center justify-center gap-1.5 ml-auto"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                              <span className="font-bold text-[10px] uppercase">Delete</span>
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </main>
        </div>
      )}

      {/* 9. SOCRATIC COMPASS AI ASSISTANT SLIDE DRAWER */}
      <AnimatePresence>
        {isAiOpen && selectedCourse && (
          <>
            <div 
              className="fixed inset-0 bg-black/35 backdrop-blur-xs z-40 transition-opacity"
              onClick={() => setIsAiOpen(false)}
            />

            <motion.aside
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              className="fixed right-0 top-0 h-full w-full max-w-sm bg-white dark:bg-slate-900 border-l border-slate-200/80 dark:border-slate-800 shadow-2xl z-50 flex flex-col justify-between"
            >
              {/* Header */}
              <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-950">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-slate-950 dark:bg-slate-800 text-white flex items-center justify-center shadow-md">
                    <Sparkles className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white font-serif">Wigwe Socratic AI</h3>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Socratic Tutor</p>
                  </div>
                </div>
                <button 
                  onClick={() => setIsAiOpen(false)}
                  className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full text-slate-400"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Message thread */}
              <div className="flex-1 overflow-y-auto p-5 space-y-4 bg-white dark:bg-slate-900">
                {aiHistory.length === 0 && (
                  <div className="space-y-4 text-center py-8">
                    <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-805 flex items-center justify-center mx-auto text-slate-400">
                      <Sparkles className="h-6 w-6" />
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm font-bold text-slate-900 dark:text-white">Active Socratic Guide</p>
                      <p className="text-xs text-slate-400 max-w-[220px] mx-auto leading-relaxed font-medium">
                        I guide your learning recursively. Ask concept clarifications.
                      </p>
                    </div>

                    <div className="pt-4 space-y-2 max-w-xs mx-auto">
                      <button 
                        onClick={() => handleSendAi("Clarify key macroeconomics concepts from our Fiscal Policy material.")}
                        className="w-full text-left px-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-[11px] font-semibold text-slate-700 dark:text-slate-350 hover:bg-slate-100 transition-all flex items-center justify-between cursor-pointer"
                      >
                        Review key concepts
                        <ArrowRight className="h-3 w-3" />
                      </button>
                      <button 
                        onClick={() => handleSendAi("Can you summarize the core takeaways of the lecture slides please?")}
                        className="w-full text-left px-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-[11px] font-semibold text-slate-700 dark:text-slate-350 hover:bg-slate-100 transition-all flex items-center justify-between cursor-pointer"
                      >
                        Summarize takeaways
                        <ArrowRight className="h-3 w-3" />
                      </button>
                      <button 
                        onClick={() => handleSendAi("Give me a Socratic hint on how Bellman-Ford differs from Dijkstra.")}
                        className="w-full text-left px-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-[11px] font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 transition-all flex items-center justify-between cursor-pointer"
                      >
                        Compare algorithms
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
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-805 dark:text-slate-200 rounded-bl-none border border-slate-200/50 dark:border-slate-700/50'
                    }`}>
                      <p>{msg.text}</p>
                    </div>
                    <span className="text-[9px] text-slate-400 font-semibold mt-1 uppercase">{msg.timestamp}</span>
                  </div>
                ))}

                {isAiLoading && (
                  <div className="flex flex-col items-start max-w-[85%] mr-auto space-y-1">
                    <div className="p-3.5 rounded-2xl rounded-bl-none bg-slate-100 dark:bg-slate-800 border border-slate-200/50 dark:border-slate-700/50 text-slate-400 text-xs flex items-center gap-2">
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
              <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950">
                <div className="relative">
                  <input 
                    type="text" 
                    value={aiMessage}
                    onChange={(e) => setAiMessage(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSendAi()}
                    placeholder="Ask study-related questions..."
                    className="w-full bg-white dark:bg-slate-900 text-slate-900 dark:text-white px-4 py-3.5 pr-12 rounded-xl border border-slate-200 dark:border-slate-800 text-xs focus:outline-none focus:ring-2 focus:ring-slate-950 dark:focus:ring-white transition-all shadow-inner"
                  />
                  <button 
                    onClick={() => handleSendAi()}
                    className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-slate-950 dark:bg-white dark:text-slate-950 text-white rounded-lg flex items-center justify-center hover:bg-slate-800 cursor-pointer"
                  >
                    <Send className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
      {/* 10. MATERIAL DOCUMENT VIEWER MODAL */}
      <AnimatePresence>
        {activeViewerMaterial && (
          <div className="fixed inset-0 bg-black/65 backdrop-blur-xs z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="bg-white dark:bg-slate-900 rounded-3xl overflow-hidden max-w-3xl w-full h-[80vh] flex flex-col shadow-2xl border border-slate-200 dark:border-slate-800"
            >
              <div className="p-5 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <FileText className="h-6 w-6 text-slate-800 dark:text-white" />
                  <div>
                    <h3 className="font-bold text-slate-900 dark:text-white font-serif text-sm">{activeViewerMaterial.fileName}</h3>
                    <p className="text-[10px] text-slate-400 font-semibold tracking-wider uppercase">In-Browser Reference Reader</p>
                  </div>
                </div>
                <button 
                  onClick={() => setActiveViewerMaterial(null)}
                  className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-full text-slate-400"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Document contents (Iframe for uploaded files or Simulated for mock ones) */}
              <div className="flex-grow overflow-hidden bg-slate-100 dark:bg-slate-950">
                {activeViewerMaterial.fileUrl.startsWith("/uploads/") || activeViewerMaterial.fileUrl.endsWith(".pdf") ? (
                  <iframe 
                    src={activeViewerMaterial.fileUrl} 
                    className="w-full h-full border-none"
                    title={activeViewerMaterial.fileName}
                  />
                ) : (
                  <div className="w-full h-full overflow-y-auto p-6 space-y-6 leading-relaxed font-serif">
                    <div className="max-w-xl mx-auto bg-white dark:bg-slate-900 p-8 sm:p-12 rounded-xl shadow-md border border-slate-200 dark:border-slate-805 space-y-6">
                      <div className="text-center border-b border-slate-100 dark:border-slate-800 pb-4">
                        <span className="text-[10px] font-bold text-indigo-500 tracking-widest uppercase">WIGWE UNIVERSITY CURRICULUM</span>
                        <h1 className="text-xl font-bold text-slate-900 dark:text-white mt-1">{selectedCourse?.title} Study Context</h1>
                        <p className="text-xs text-slate-400 mt-1 font-sans">Reference standard • Level {currentUser?.level}</p>
                      </div>

                      {selectedCourse?.code === "ECO401" ? (
                        <>
                          <h3 className="text-sm font-bold text-slate-900 dark:text-white font-sans">Chapter 1: Fiscal Policy and Stabilisation Framework</h3>
                          <p className="text-xs leading-relaxed">
                            In developing economies like Nigeria, fiscal policy plays a double role. It not only finances crucial public infrastructure but also stabilizes aggregate supply during resource-dependent cycle fluctuations.
                          </p>
                          <p className="text-xs leading-relaxed">
                            The Multiplier Effect occurs when the first cycle of public spending results in consecutive consumer and investment spending, shifting the Aggregate Demand (AD) curves outwards. However, the crowding-out effect might occur if public spending drives interest rates higher, hindering local private investments.
                          </p>
                        </>
                      ) : selectedCourse?.code === "CSC401" ? (
                        <>
                          <h3 className="text-sm font-bold text-slate-900 dark:text-white font-sans">Module 4: Dynamic Programming and Optimisation</h3>
                          <p className="text-xs leading-relaxed">
                            Dynamic programming solves complex problems by breaking them down into simpler subproblems. It is applicable to problems exhibiting properties of overlapping subproblems and optimal substructure.
                          </p>
                          <p className="text-xs leading-relaxed">
                            Memoization is the top-down approach where we recursively solve subproblems and store their results in a lookup table. Tabulation is the bottom-up approach that iteratively fills a table starting from the baseline conditions.
                          </p>
                        </>
                      ) : (
                        <>
                          <h3 className="text-sm font-bold text-slate-900 dark:text-white font-sans">Syllabus Reference Outline</h3>
                          <p className="text-xs leading-relaxed">
                            This syllabus document outlines critical methodologies, theories, and concepts related to {selectedCourse?.title}. Focus on identifying Socratic linkages between the theory and structural practice quizzes.
                          </p>
                        </>
                      )}

                      <div className="p-4 bg-slate-50 dark:bg-slate-950 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 text-center font-sans space-y-2">
                        <p className="text-xs text-slate-500 font-bold">Ready to test your comprehension?</p>
                        <button 
                          onClick={() => {
                            setActiveViewerMaterial(null);
                            handleStartTier("easy");
                          }}
                          className="inline-flex items-center gap-1.5 bg-slate-900 hover:bg-slate-800 text-white font-bold px-4 py-2 rounded-lg text-xs cursor-pointer"
                        >
                          Start Quiz Session
                          <ArrowRight className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
