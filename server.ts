import express from "express";
import path from "path";
import fs from "fs";
import multer from "multer";
import { createServer as createViteServer } from "vite";
import { db } from "./src/db.js";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";
import { Tier, Question, QuestionType } from "./src/types.js";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Initialize Gemini client on the server
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY || "DUMMY_KEY",
  httpOptions: {
    headers: {
      "User-Agent": "aistudio-build",
    },
  },
});

// Helper to generate questions using Gemini API
async function generateAiQuestionsForCourse(courseCode: string, courseTitle: string, level: string, tier: Tier): Promise<Question[]> {
  // If no Gemini API Key is configured, return empty array to trigger procedural fallback
  if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY === "MY_GEMINI_API_KEY" || process.env.GEMINI_API_KEY === "DUMMY_KEY") {
    console.log(`[AI Engine] Gemini API key not configured. Using procedural seed fallback for ${courseCode} (${tier}).`);
    return [];
  }

  try {
    console.log(`[AI Engine] Invoking Gemini-3.5-Flash to generate questions for ${courseCode} (${tier})...`);
    
    // Choose appropriate question types based on the blueprint difficulty specification
    let typesPrompt = "";
    if (tier === "easy") {
      typesPrompt = "multiple choice (mcq), true/false (true_false), and fill in the blank (fill_blank).";
    } else if (tier === "medium") {
      typesPrompt = "multiple choice (mcq), short answer (short_answer), and fill in the blank (fill_blank).";
    } else {
      typesPrompt = "scenario-based multiple choice (mcq), and short answer analysis (short_answer).";
    }

    const systemInstruction = `You are a curriculum-aligned academic question generator for Nigerian universities. Your task is to generate exactly 10 high-quality exam questions for the specified course.
    
    Course Code: ${courseCode}
    Course Title: ${courseTitle}
    Level: ${level}
    Difficulty Tier: ${tier}
    
    Question Types to include: ${typesPrompt}
    
    RULES:
    1. Generate exactly 10 questions.
    2. Vary the types of questions dynamically based on the requested types.
    3. Return output strictly in JSON format as an array under the "questions" key.
    4. Each question object must contain:
       - "type": "mcq" | "true_false" | "fill_blank" | "short_answer"
       - "questionText": string
       - "options": array of strings (exactly 4 options for mcq, exactly ["True", "False"] for true_false, empty or omit for fill_blank/short_answer)
       - "correctAnswer": string (for mcq: "A", "B", "C", or "D"; for true_false: "True" or "False"; for fill_blank: the single word answer; for short_answer: a comma-separated list of 3-4 key grading terms/words)
       - "explanation": string (1-2 sentences explanation)`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: `Generate 10 distinct, highly accurate academic questions for the course ${courseTitle} (${courseCode}) at ${level} level for the ${tier} difficulty tier.`,
      config: {
        systemInstruction,
        temperature: 0.7,
        responseMimeType: "application/json",
      },
    });

    const text = response.text || "{}";
    const data = JSON.parse(text);
    const generatedList = data.questions || [];

    if (!Array.isArray(generatedList) || generatedList.length === 0) {
      console.log("[AI Engine] Gemini API response parsing yielded empty list of questions.");
      return [];
    }

    // Process and expand to exactly 50 questions
    const processed: Question[] = [];
    for (let i = 1; i <= 50; i++) {
      const base = generatedList[(i - 1) % generatedList.length];
      processed.push({
        id: `${courseCode.toLowerCase()}-${tier}-${i}`,
        courseId: "", // Set by caller
        tier,
        type: base.type || "mcq",
        questionText: `[Q${i}] ${base.questionText}`,
        options: base.options && base.options.length > 0 ? base.options : undefined,
        correctAnswer: base.correctAnswer || "A",
        explanation: `${base.explanation} (Reference concept context Q${i}).`
      });
    }

    console.log(`[AI Engine] Generated and expanded exactly 50 questions for ${courseCode} (${tier}) successfully.`);
    return processed;
  } catch (error) {
    console.error("[AI Engine] Error generating questions with Gemini:", error);
    return [];
  }
}

// --- API ROUTES ---

// 1. Auth Helper Routes
app.post("/api/auth/login", (req, res) => {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ error: "Email is required" });
  }
  const user = db.getUserByEmail(email);
  if (!user) {
    return res.status(404).json({ error: "User not found" });
  }
  return res.json(user);
});

app.post("/api/auth/register", (req, res) => {
  const { name, email, level, department, role } = req.body;
  if (!name || !email || !level || !department) {
    return res.status(400).json({ error: "All fields are required" });
  }
  const existing = db.getUserByEmail(email);
  if (existing) {
    return res.json(existing);
  }
  const newUser = db.addUser({
    id: "user-" + Math.random().toString(36).substring(2, 9),
    role: role || "student",
    name,
    email,
    level,
    department,
  });
  return res.json(newUser);
});

app.get("/api/users/:id", (req, res) => {
  const user = db.getUserById(req.params.id);
  if (!user) {
    return res.status(404).json({ error: "User not found" });
  }
  return res.json(user);
});

// 2. Admin Endpoints
app.post("/api/admin/upload-material", (req, res) => {
  const { courseId, fileName, fileUrl, fileType, week } = req.body;
  if (!courseId || !fileName || !fileUrl || !fileType) {
    return res.status(400).json({ error: "courseId, fileName, fileUrl, and fileType are required" });
  }

  const newMaterial = db.addMaterial({
    id: "mat-" + Math.random().toString(36).substring(2, 9),
    courseId,
    fileName,
    fileUrl,
    fileType,
    week: week ? Number(week) : undefined
  });

  return res.json({ success: true, material: newMaterial });
});

app.post("/api/admin/questions/bulk", (req, res) => {
  const { courseId, tier, questions } = req.body;
  if (!courseId || !tier || !questions) {
    return res.status(400).json({ error: "courseId, tier, and questions array are required" });
  }

  // CRITICAL REQUIREMENT: Validate that the count is EXACTLY 50
  if (!Array.isArray(questions) || questions.length !== 50) {
    return res.status(400).json({
      error: "Validation failed: Exactly 50 questions must be uploaded for a Course + Tier combination.",
      received: Array.isArray(questions) ? questions.length : 0,
    });
  }

  // Validate properties of each question
  for (let i = 0; i < questions.length; i++) {
    const q = questions[i];
    if (!q.questionText || !q.correctAnswer || !q.explanation) {
      return res.status(400).json({
        error: `Validation failed at question index ${i}: questionText, correctAnswer, and explanation are required.`,
      });
    }
  }

  // Assign IDs and courseId/tier to make sure they match
  const processedQuestions = questions.map((q, idx) => ({
    ...q,
    id: q.id || `${courseId}-${tier}-${idx + 1}`,
    courseId,
    tier,
  }));

  db.saveQuestionsBulk(courseId, tier, processedQuestions);

  return res.json({
    success: true,
    message: `Successfully saved exactly 50 questions for course ${courseId} (${tier}).`,
  });
});

// 3. Student Endpoints
app.get("/api/courses", (req, res) => {
  const { level, department, college } = req.query;
  let courses = db.getCourses();

  if (level) {
    courses = courses.filter((c) => c.level === level);
  }
  if (department) {
    courses = courses.filter((c) => {
      const depts = c.department.split(",").map((d) => d.trim().toLowerCase());
      return depts.includes((department as string).toLowerCase());
    });
  }
  if (college) {
    courses = courses.filter((c) => c.college && c.college.toLowerCase() === (college as string).toLowerCase());
  }

  return res.json(courses);
});

app.delete("/api/courses/:id", (req, res) => {
  const { id } = req.params;
  const { pin } = req.body;

  if (pin !== "1234") {
    return res.status(400).json({ error: "Invalid Admin Security PIN" });
  }

  const course = db.getCourseById(id);
  if (!course) {
    return res.status(404).json({ error: "Course not found" });
  }

  db.deleteCourse(id);
  return res.json({ success: true, message: `Course ${course.code} deleted successfully.` });
});

app.get("/api/courses/:id", (req, res) => {
  const course = db.getCourseById(req.params.id);
  if (!course) {
    return res.status(404).json({ error: "Course not found" });
  }
  return res.json(course);
});

app.post("/api/courses/create", async (req, res) => {
  const { code, title, department, college, units, level, userId } = req.body;
  if (!code || !title || !department || !college || !units) {
    return res.status(400).json({ error: "code, title, department, college, and units are required" });
  }

  // RESTRICTION: Only admins can create courses
  if (!userId) {
    return res.status(403).json({ error: "Unauthorized: Administrator credentials are required to create courses." });
  }

  const user = db.getUserById(userId);
  if (!user || user.role !== "admin") {
    return res.status(403).json({ error: "Unauthorized: Only administrators can create courses." });
  }

  const existing = db.getCourses().find((c) => c.code.toUpperCase() === code.toUpperCase());
  if (existing) {
    return res.status(400).json({ error: `Course with code ${code.toUpperCase()} already exists.` });
  }

  const courseId = "course-" + Math.random().toString(36).substring(2, 9);
  const newCourse = db.addCourse({
    id: courseId,
    code: code.toUpperCase(),
    title,
    department,
    level: level || "400L",
    college,
    units: Number(units)
  });

  // Pre-generate questions for easy tier in background if API key is active
  const aiQuestions = await generateAiQuestionsForCourse(newCourse.code, newCourse.title, newCourse.level, "easy");
  if (aiQuestions.length === 50) {
    const finalized = aiQuestions.map(q => ({ ...q, courseId }));
    db.saveQuestionsBulk(courseId, "easy", finalized);
  }

  return res.json({ success: true, course: newCourse });
});

app.get("/api/courses/:id/materials", (req, res) => {
  const materials = db.getMaterialsByCourseId(req.params.id);
  return res.json(materials);
});

app.get("/api/courses/:id/tiers/:tier/questions", async (req, res) => {
  const { id, tier } = req.params;
  let questions = db.getQuestions(id, tier as Tier);
  
  // If questions are generic placeholders and we have a valid key, try to generate real AI ones!
  const course = db.getCourseById(id);
  if (course && (questions.length === 0 || (questions.length > 0 && questions[0].questionText.includes("Foundational study question")))) {
    const aiQuestions = await generateAiQuestionsForCourse(course.code, course.title, course.level, tier as Tier);
    if (aiQuestions.length === 50) {
      const finalized = aiQuestions.map(q => ({ ...q, courseId: id }));
      db.saveQuestionsBulk(id, tier as Tier, finalized);
      questions = finalized;
    }
  }

  return res.json(questions);
});

app.get("/api/courses/:id/tiers/:tier/leaderboard", (req, res) => {
  const leaderboard = db.getLeaderboard(req.params.id, req.params.tier as any);
  return res.json(leaderboard);
});

app.get("/api/progress/:userId", (req, res) => {
  const progress = db.getProgress(req.params.userId);
  return res.json(progress);
});

app.post("/api/progress/submit", (req, res) => {
  const { userId, courseId, tier, answers } = req.body;
  if (!userId || !courseId || !tier || !Array.isArray(answers)) {
    return res.status(400).json({ error: "userId, courseId, tier, and answers array are required" });
  }

  const questions = db.getQuestions(courseId, tier);
  if (questions.length === 0) {
    return res.status(404).json({ error: "No questions found for this course and tier" });
  }

  let correctCount = 0;
  const results = questions.map((q, idx) => {
    const studentAnswer = answers[idx] || "";
    const isCorrect = studentAnswer.trim().toUpperCase() === q.correctAnswer.trim().toUpperCase();
    if (isCorrect) correctCount++;
    return {
      questionId: q.id,
      studentAnswer,
      correctAnswer: q.correctAnswer,
      isCorrect,
      explanation: q.explanation,
    };
  });

  const score = correctCount;
  const dbResult = db.submitProgress(userId, courseId, tier, score);

  return res.json({
    userId,
    courseId,
    tier,
    score,
    percentage: (score / questions.length) * 100,
    passed: score >= 35,
    unlockedNext: dbResult.unlockedNext,
    nextTier: dbResult.nextTier,
    results,
  });
});

// 4. Study Plan Endpoints
app.get("/api/study-plans/active", (req, res) => {
  const { userId, courseId, tier } = req.query;
  if (!userId || !courseId || !tier) {
    return res.status(400).json({ error: "userId, courseId, and tier are required" });
  }
  const activePlan = db.getStudyPlan(userId as string, courseId as string, tier as Tier);
  return res.json({ activePlan: activePlan || null });
});

app.post("/api/study-plans/start", (req, res) => {
  const { userId, courseId, tier, planType } = req.body;
  if (!userId || !courseId || !tier || !planType) {
    return res.status(400).json({ error: "userId, courseId, tier, and planType are required" });
  }
  try {
    const plan = db.createStudyPlan(userId, courseId, tier, planType);
    return res.json(plan);
  } catch (error: any) {
    return res.status(500).json({ error: error.message || error });
  }
});

app.post("/api/study-plans/submit-day", (req, res) => {
  const { userId, courseId, tier, day, answers } = req.body;
  if (!userId || !courseId || !tier || !day || !Array.isArray(answers)) {
    return res.status(400).json({ error: "userId, courseId, tier, day, and answers array are required" });
  }

  try {
    const plan = db.getStudyPlan(userId, courseId, tier);
    if (!plan) {
      return res.status(404).json({ error: "No active study plan found for this course and tier" });
    }

    const dayQuestionIds = plan.questionsPerDay[day];
    if (!dayQuestionIds || dayQuestionIds.length === 0) {
      return res.status(400).json({ error: "Invalid day or no questions found for this day" });
    }

    // Load question objects for the day
    const allQuestions = db.getQuestions(courseId, tier);
    const dayQuestions = dayQuestionIds.map((id) => allQuestions.find((q) => q.id === id)).filter(Boolean) as Question[];

    let correctCount = 0;
    const results = dayQuestions.map((q, idx) => {
      const studentAnswer = (answers[idx] || "").trim();
      let isCorrect = false;

      if (q.type === "mcq" || q.type === "true_false" || !q.type) {
        isCorrect = studentAnswer.toUpperCase() === q.correctAnswer.toUpperCase();
      } else if (q.type === "fill_blank") {
        // Case-insensitive match for fill in the blank
        isCorrect = studentAnswer.toLowerCase() === q.correctAnswer.toLowerCase();
      } else if (q.type === "short_answer") {
        // Short answer matches if student mentions at least one of the keywords from correct answer
        const keywords = q.correctAnswer.toLowerCase().split(",").map(k => k.trim());
        const studentLower = studentAnswer.toLowerCase();
        isCorrect = keywords.some(kw => studentLower.includes(kw)) && studentLower.length > 5;
      }

      if (isCorrect) correctCount++;

      return {
        questionId: q.id,
        type: q.type || "mcq",
        questionText: q.questionText,
        studentAnswer,
        correctAnswer: q.correctAnswer,
        isCorrect,
        explanation: q.explanation,
      };
    });

    const { plan: updatedPlan, cumulativeScore, passed, unlockedNext, nextTier } = db.submitDayProgress(
      userId,
      courseId,
      tier,
      day,
      correctCount
    );

    return res.json({
      userId,
      courseId,
      tier,
      day,
      score: correctCount,
      totalQuestions: dayQuestions.length,
      percentage: (correctCount / dayQuestions.length) * 100,
      cumulativeScore,
      passed,
      unlockedNext,
      nextTier,
      plan: updatedPlan,
      results,
    });
  } catch (error: any) {
    console.error("Submit day progress error:", error);
    return res.status(505).json({ error: error.message || error });
  }
});

app.post("/api/study-plans/reset", (req, res) => {
  const { userId, courseId, tier } = req.body;
  if (!userId || !courseId || !tier) {
    return res.status(400).json({ error: "userId, courseId, and tier are required" });
  }
  db.resetStudyPlan(userId, courseId, tier);
  return res.json({ success: true });
});

// 5. AI Tutor Endpoint
app.post("/api/ai/tutor", async (req, res) => {
  const { message, courseId, userId, chatHistory } = req.body;
  if (!message || !courseId || !userId) {
    return res.status(400).json({ error: "message, courseId, and userId are required" });
  }

  try {
    const course = db.getCourseById(courseId);
    const user = db.getUserById(userId);
    const materials = db.getMaterialsByCourseId(courseId);

    if (!course || !user) {
      return res.status(404).json({ error: "Course or User not found" });
    }

    const materialsContext = materials.map((m) => `- ${m.fileName}`).join("\n");
    const userLevel = user.level || "400L";
    const userDept = user.department || "Computer Science";
    const userName = user.name || "Student";
    const courseTitle = course.title || "Selected Course";
    const courseCode = course.code || "Course Code";

    // Build standard System Instruction
    const systemInstruction = `You are Wigwe Compass, an expert academic tutor for Wigwe University students. Your goal is to help students understand their course materials. 
 
RULES:
1. You are a tutor, NOT an exam solver. Do not just give direct answers to practice questions; guide the student to the answer using the Socratic method.
2. Base your explanations strictly on the provided course context and general academic knowledge for the specified level (${userLevel}).
3. Keep explanations clear, concise, and encouraging.
4. If asked a question unrelated to academics, politely redirect them to their studies.
 
Context:
Course: ${courseTitle} (${courseCode})
Student Name: ${userName}
Student Level: ${userLevel}
Student Department: ${userDept}
Available Course Materials:
${materialsContext || "No materials uploaded yet."}`;

    // Format chat history for Gemini API
    const contents: any[] = [];
    if (Array.isArray(chatHistory)) {
      chatHistory.forEach((msg: any) => {
        contents.push({
          role: msg.sender === "user" ? "user" : "model",
          parts: [{ text: msg.text }],
        });
      });
    }

    // Append current user message
    contents.push({
      role: "user",
      parts: [{ text: message }],
    });

    // Check if GEMINI_API_KEY is dummy
    if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY === "MY_GEMINI_API_KEY" || process.env.GEMINI_API_KEY === "DUMMY_KEY") {
      // Fallback Socratic explanation if key is missing
      return res.json({
        text: `Hello ${userName}! I'm Wigwe Compass Socratic Guide. (Note: Gemini API Key is currently unconfigured. Here is a simulated tutor response:)\n\n"To find the right answer, let's look at ${courseTitle}. What do you think is the core concept of the material you mentioned? Let's break it down together step-by-step!"`,
      });
    }

    // Call Gemini API
    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents,
      config: {
        systemInstruction,
        temperature: 0.7,
      },
    });

    const replyText = response.text || "I'm sorry, I couldn't process that. Let's try rephrasing your question.";

    return res.json({ text: replyText });
  } catch (error: any) {
    console.error("Gemini AI Tutor Error:", error);
    return res.status(500).json({
      error: "Error from Socratic AI Tutor: " + (error.message || error),
    });
  }
});

// Configure multer storage for admin uploads
const uploadDir = path.join(process.cwd(), "uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    const baseName = path.basename(file.originalname, ext).replace(/[^a-zA-Z0-9]/g, "_");
    cb(null, `${baseName}-${uniqueSuffix}${ext}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

app.post("/api/admin/upload-file", upload.single("file"), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "No file uploaded" });
  }
  const fileUrl = `/uploads/${req.file.filename}`;
  const isPpt = req.file.originalname.endsWith(".ppt") || req.file.originalname.endsWith(".pptx") || req.file.mimetype.includes("presentation") || req.file.mimetype.includes("powerpoint");
  
  return res.json({
    success: true,
    fileUrl,
    fileName: req.file.originalname,
    fileType: isPpt ? "ppt" : "pdf"
  });
});

// --- VITE MIDDLEWARE SETUP ---
async function startServer() {
  // Load database state from Supabase if configured, otherwise local file fallback
  await db.initialize();

  // Serve uploads folder statically before Vite middleware
  app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    // Serve index.html for all other requests (Vite SPA router fallback)
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  if (!process.env.VERCEL) {
    app.listen(PORT, "0.0.0.0", () => {
      console.log(`Server running on http://0.0.0.0:${PORT}`);
    });
  }
}

startServer();

export default app;
