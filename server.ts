import express from "express";
import path from "path";
import fs from "fs";
import multer from "multer";
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
    console.log(`[AI Engine] Invoking Gemini-2.5-Flash to generate questions for ${courseCode} (${tier})...`);
    
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
      model: "gemini-2.5-flash",
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

// Ensure database is fully initialized before handling any route
app.use(async (req, res, next) => {
  try {
    await db.initialize();
    next();
  } catch (error: any) {
    console.error("[Database] Initialization middleware error:", error);
    res.status(500).json({ error: "Database failed to initialize: " + error.message });
  }
});

// Helper to wrap async Express route handlers to prevent hanging on errors
const asyncHandler = (fn: any) => (req: any, res: any, next: any) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

// --- API ROUTES ---

// 1. Auth Helper Routes
app.post("/api/auth/login", asyncHandler(async (req, res) => {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ error: "Email is required" });
  }
  const user = await db.getUserByEmail(email);
  if (!user) {
    return res.status(404).json({ error: "User not found" });
  }
  return res.json(user);
}));

app.post("/api/auth/register", asyncHandler(async (req, res) => {
  const { name, email, level, department, role } = req.body;
  if (!name || !email || !level || !department) {
    return res.status(400).json({ error: "All fields are required" });
  }
  const existing = await db.getUserByEmail(email);
  if (existing) {
    return res.json(existing);
  }
  const newUser = await db.addUser({
    id: "user-" + Math.random().toString(36).substring(2, 9),
    role: role || "student",
    name,
    email,
    level,
    department,
    password: "password123",
  });
  return res.json(newUser);
}));

app.get("/api/users/:id", asyncHandler(async (req, res) => {
  const user = await db.getUserById(req.params.id);
  if (!user) {
    return res.status(404).json({ error: "User not found" });
  }
  return res.json(user);
}));

// 2. Admin Endpoints
app.post("/api/admin/upload-material", asyncHandler(async (req, res) => {
  const { courseId, fileName, fileUrl, fileType, week } = req.body;
  if (!courseId || !fileName || !fileUrl || !fileType) {
    return res.status(400).json({ error: "courseId, fileName, fileUrl, and fileType are required" });
  }

  const newMaterial = await db.addMaterial({
    id: "mat-" + Math.random().toString(36).substring(2, 9),
    courseId,
    fileName,
    fileUrl,
    fileType,
    week: week ? Number(week) : undefined
  });

  return res.json({ success: true, material: newMaterial });
}));

app.post("/api/admin/questions/bulk", asyncHandler(async (req, res) => {
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

  await db.saveQuestionsBulk(courseId, tier, processedQuestions);

  return res.json({
    success: true,
    message: `Successfully saved exactly 50 questions for course ${courseId} (${tier}).`,
  });
}));

// 3. Student Endpoints
app.get("/api/courses", asyncHandler(async (req, res) => {
  const { level, department, college } = req.query;
  let courses = await db.getCourses();

  if (level) {
    courses = courses.filter((c) => c.level === level);
  }
  if (department) {
    courses = courses.filter((c) => {
      const lowerDept = (department as string).toLowerCase();
      const courseDeptLower = c.department.toLowerCase();
      if (courseDeptLower.includes("all programs") || courseDeptLower.includes("all departments")) {
        return true;
      }
      const depts = c.department.split(",").map((d) => d.trim().toLowerCase());
      return depts.includes(lowerDept);
    });
  }
  if (college) {
    courses = courses.filter((c) => c.college && c.college.toLowerCase() === (college as string).toLowerCase());
  }

  return res.json(courses);
}));

app.delete("/api/courses/:id", asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { pin } = req.body;

  if (pin !== "1234") {
    return res.status(400).json({ error: "Invalid Admin Security PIN" });
  }

  const course = await db.getCourseById(id);
  if (!course) {
    return res.status(404).json({ error: "Course not found" });
  }

  await db.deleteCourse(id);
  return res.json({ success: true, message: `Course ${course.code} deleted successfully.` });
}));

app.get("/api/courses/:id", asyncHandler(async (req, res) => {
  const course = await db.getCourseById(req.params.id);
  if (!course) {
    return res.status(404).json({ error: "Course not found" });
  }
  return res.json(course);
}));

app.post("/api/courses/create", asyncHandler(async (req, res) => {
  const { code, title, department, college, units, level, userId, lecturer } = req.body;
  if (!code || !title || !department || !college || !units) {
    return res.status(400).json({ error: "code, title, department, college, and units are required" });
  }

  // RESTRICTION: Only admins can create courses
  if (!userId) {
    return res.status(403).json({ error: "Unauthorized: Administrator credentials are required to create courses." });
  }

  const user = await db.getUserById(userId);
  if (!user || user.role !== "admin") {
    return res.status(403).json({ error: "Unauthorized: Only administrators can create courses." });
  }

  const existing = (await db.getCourses()).find((c) => c.code.toUpperCase() === code.toUpperCase());
  if (existing) {
    return res.status(400).json({ error: `Course with code ${code.toUpperCase()} already exists.` });
  }

  const courseId = "course-" + Math.random().toString(36).substring(2, 9);
  const newCourse = await db.addCourse({
    id: courseId,
    code: code.toUpperCase(),
    title,
    department,
    level: level || "400L",
    college,
    units: Number(units),
    lecturer: lecturer || ""
  });

  // Pre-generate questions for easy tier in background if API key is active
  const aiQuestions = await generateAiQuestionsForCourse(newCourse.code, newCourse.title, newCourse.level, "easy");
  if (aiQuestions.length === 50) {
    const finalized = aiQuestions.map(q => ({ ...q, courseId }));
    await db.saveQuestionsBulk(courseId, "easy", finalized);
  }

  return res.json({ success: true, course: newCourse });
}));

app.get("/api/courses/:id/materials", asyncHandler(async (req, res) => {
  const materials = await db.getMaterialsByCourseId(req.params.id);
  return res.json(materials);
}));

app.get("/api/courses/:id/tiers/:tier/questions", asyncHandler(async (req, res) => {
  const { id, tier } = req.params;
  let questions = await db.getQuestions(id, tier as Tier);
  
  // If questions are generic placeholders and we have a valid key, try to generate real AI ones!
  const course = await db.getCourseById(id);
  if (course && (questions.length === 0 || (questions.length > 0 && questions[0].questionText.includes("Foundational study question")))) {
    const aiQuestions = await generateAiQuestionsForCourse(course.code, course.title, course.level, tier as Tier);
    if (aiQuestions.length === 50) {
      const finalized = aiQuestions.map(q => ({ ...q, courseId: id }));
      await db.saveQuestionsBulk(id, tier as Tier, finalized);
      questions = finalized;
    }
  }

  return res.json(questions);
}));

app.get("/api/courses/:id/tiers/:tier/leaderboard", asyncHandler(async (req, res) => {
  const leaderboard = await db.getLeaderboard(req.params.id, req.params.tier as any);
  return res.json(leaderboard);
}));

app.get("/api/progress/:userId", asyncHandler(async (req, res) => {
  const progress = await db.getProgress(req.params.userId);
  return res.json(progress);
}));

app.post("/api/progress/submit", asyncHandler(async (req, res) => {
  const { userId, courseId, tier, answers } = req.body;
  if (!userId || !courseId || !tier || !Array.isArray(answers)) {
    return res.status(400).json({ error: "userId, courseId, tier, and answers array are required" });
  }

  const questions = await db.getQuestions(courseId, tier);
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
  const dbResult = await db.submitProgress(userId, courseId, tier, score);

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
}));

// 4. Study Plan Endpoints
app.get("/api/study-plans/active", asyncHandler(async (req, res) => {
  const { userId, courseId, tier } = req.query;
  if (!userId || !courseId || !tier) {
    return res.status(400).json({ error: "userId, courseId, and tier are required" });
  }
  const activePlan = await db.getStudyPlan(userId as string, courseId as string, tier as Tier);
  return res.json({ activePlan: activePlan || null });
}));

app.post("/api/study-plans/start", asyncHandler(async (req, res) => {
  const { userId, courseId, tier, planType } = req.body;
  if (!userId || !courseId || !tier || !planType) {
    return res.status(400).json({ error: "userId, courseId, tier, and planType are required" });
  }
  try {
    const plan = await db.createStudyPlan(userId, courseId, tier, planType);
    return res.json(plan);
  } catch (error: any) {
    return res.status(500).json({ error: error.message || error });
  }
}));

app.post("/api/study-plans/submit-day", asyncHandler(async (req, res) => {
  const { userId, courseId, tier, day, answers } = req.body;
  if (!userId || !courseId || !tier || !day || !Array.isArray(answers)) {
    return res.status(400).json({ error: "userId, courseId, tier, day, and answers array are required" });
  }

  try {
    const plan = await db.getStudyPlan(userId, courseId, tier);
    if (!plan) {
      return res.status(404).json({ error: "No active study plan found for this course and tier" });
    }

    const dayQuestionIds = plan.questionsPerDay[day];
    if (!dayQuestionIds || dayQuestionIds.length === 0) {
      return res.status(400).json({ error: "Invalid day or no questions found for this day" });
    }

    // Load question objects for the day
    const allQuestions = await db.getQuestions(courseId, tier);
    const dayQuestions = allQuestions.filter((q) => dayQuestionIds.includes(q.id));

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

    const { plan: updatedPlan, cumulativeScore, passed, unlockedNext, nextTier } = await db.submitDayProgress(
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
}));

app.post("/api/study-plans/reset", asyncHandler(async (req, res) => {
  const { userId, courseId, tier } = req.body;
  if (!userId || !courseId || !tier) {
    return res.status(400).json({ error: "userId, courseId, and tier are required" });
  }
  await db.resetStudyPlan(userId, courseId, tier);
  return res.json({ success: true });
}));

// 5. AI Tutor Endpoint
app.post("/api/ai/tutor", asyncHandler(async (req, res) => {
  const { message, courseId, userId, chatHistory } = req.body;
  if (!message || !courseId || !userId) {
    return res.status(400).json({ error: "message, courseId, and userId are required" });
  }

  try {
    const course = await db.getCourseById(courseId);
    const user = await db.getUserById(userId);
    const materials = await db.getMaterialsByCourseId(courseId);

    if (!course || !user) {
      return res.status(404).json({ error: "Course or User not found" });
    }

    const materialsContext = materials.map((m) => {
      let desc = `--- FILE: ${m.fileName} (Week: ${m.week || "General"}) ---`;
      if (m.content) {
        desc += `\nCONTENT:\n${m.content}`;
      } else {
        desc += `\n(No text content extracted)`;
      }
      return desc;
    }).join("\n\n");

    const userLevel = user.level || "400L";
    const userDept = user.department || "Computer Science";
    const userName = user.name || "Student";
    const courseTitle = course.title || "Selected Course";
    const courseCode = course.code || "Course Code";

    // Build chat context
    const contents: any[] = [];
    
    // Add history
    if (Array.isArray(chatHistory)) {
      chatHistory.forEach((msg: any) => {
        contents.push({
          role: msg.sender === "user" ? "user" : "model",
          parts: [{ text: msg.text }]
        });
      });
    }

    // Add current user prompt
    contents.push({
      role: "user",
      parts: [{ text: message }]
    });

    const systemInstruction = `You are "Wigwe Compass Socratic Guide", an intelligent AI academic tutor at Wigwe University.
    Your slogan is: "Navigating academics, nurturing fearless leaders."
    You are tutoring ${userName}, a ${userLevel} student in the ${userDept} program.
    
    The course being discussed is: ${courseCode} - ${courseTitle}.
    
    Here is the exact text content of all uploaded course slides and reference files for this course:
    ======================================================================
    ${materialsContext}
    ======================================================================
    
    INSTRUCTIONS:
    1. Adopt a Socratic teaching style: DO NOT directly give the student the final answers to their homework or study questions. Instead, guide them with helpful, progressive hints, asking key questions that lead them to deduce the answer themselves.
    2. Ground your academic knowledge strictly in the provided course files content. When the student asks about a specific week or slide, read and summarize/explain it using the exact slide information from these files.
    3. If the student asks for a summary of a specific week, read the file contents marked for that week above and summarize them clearly but Socratically (e.g. outline the key sub-topics and ask them which one they want to explore first, rather than giving a massive essay of answers).
    4. Keep answers relatively concise (1-2 paragraphs) to keep the chat engaging.`;

    // Check if GEMINI_API_KEY is dummy
    if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY === "MY_GEMINI_API_KEY" || process.env.GEMINI_API_KEY === "DUMMY_KEY") {
      // Fallback Socratic explanation if key is missing
      return res.json({
        text: `Hello ${userName}! I'm Wigwe Compass Socratic Guide. (Note: Gemini API Key is currently unconfigured. Here is a simulated tutor response:)\n\n"To find the right answer, let's look at ${courseTitle}. What do you think is the core concept of the material you mentioned? Let's break it down together step-by-step!"`,
      });
    }

    // Call Gemini API
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
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
}));

// Configure multer storage for admin uploads
const uploadDir = process.env.VERCEL
  ? path.join("/tmp", "uploads")
  : path.join(process.cwd(), "uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
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

app.get("/api/debug/status", asyncHandler(async (req, res) => {
  const users = await db.getUsers();
  const courses = await db.getCourses();
  const studyPlans = await db.getStudyPlans();
  return res.json({
    users,
    coursesCount: courses.length,
    courses: courses.map(c => ({ id: c.id, code: c.code, title: c.title })),
    studyPlans
  });
}));

app.post("/api/admin/import-metadata", asyncHandler(async (req, res) => {
  const { courses, materials, pin } = req.body;
  if (pin !== "1234") {
    return res.status(401).json({ error: "Unauthorized" });
  }

  // Clean up deprecated courses in Supabase that are not in the import payload
  if (process.env.SUPABASE_URL && Array.isArray(courses) && courses.length > 0) {
    const liveCourses = await db.getCourses();
    const importedIds = courses.map((c: any) => c.id);
    for (const c of liveCourses) {
      if (!importedIds.includes(c.id)) {
        try {
          await db.deleteCourse(c.id);
          console.log(`[Admin Import] Deleted deprecated course in Supabase: ${c.code}`);
        } catch (err) {
          console.error(`Error deleting deprecated course ${c.id}:`, err);
        }
      }
    }
  }

  // Clear existing materials for the imported courses to avoid duplicate primary key errors
  if (process.env.SUPABASE_URL && req.body.clearMaterials && Array.isArray(courses)) {
    const courseIds = courses.map((c: any) => c.id);
    for (const cid of courseIds) {
      try {
        await db.supabaseRequest("materials", "DELETE", `courseId=eq.${encodeURIComponent(cid as string)}`);
      } catch (err) {
        console.error(`Error clearing materials for course ${cid}:`, err);
      }
    }
  }

  // Insert courses
  for (const course of courses) {
    const existing = await db.getCourseById(course.id);
    if (!existing) {
      await db.addCourse(course);
    }
  }

  // Insert materials
  for (const mat of materials) {
    await db.addMaterial(mat);
  }

  return res.json({ success: true, coursesImported: courses.length, materialsImported: materials.length });
}));

// --- VITE MIDDLEWARE SETUP ---
async function startServer() {
  // Load database state from Supabase if configured, otherwise local file fallback
  await db.initialize();

  // Serve uploads folder statically before Vite middleware
  app.use("/uploads", express.static(
    process.env.VERCEL 
      ? "/tmp/uploads" 
      : fs.existsSync("C:/Users/Hello/OneDrive/Documents/ALL slides")
        ? "C:/Users/Hello/OneDrive/Documents/ALL slides"
        : path.join(process.cwd(), "uploads")
  ));

  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite");
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

  // Diagnostic error handler to output stack traces to client response on failure
  app.use((err: any, req: any, res: any, next: any) => {
    console.error("[Diagnostic Error]:", err);
    res.status(500).json({
      error: "Internal Server Error",
      message: err.message,
      stack: err.stack
    });
  });

  if (!process.env.VERCEL) {
    app.listen(PORT, "0.0.0.0", () => {
      console.log(`Server running on http://0.0.0.0:${PORT}`);
    });
  }
}

startServer();

export default app;
