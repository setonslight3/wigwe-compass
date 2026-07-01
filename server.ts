import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { db } from "./src/db.js";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Initialize Gemini client on the server
// User-Agent set to 'aistudio-build' for telemetry as per the gemini-api skill
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY || "DUMMY_KEY",
  httpOptions: {
    headers: {
      "User-Agent": "aistudio-build",
    },
  },
});

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
  const { courseId, fileName, fileUrl, fileType } = req.body;
  if (!courseId || !fileName || !fileUrl || !fileType) {
    return res.status(400).json({ error: "courseId, fileName, fileUrl, and fileType are required" });
  }

  const newMaterial = db.addMaterial({
    id: "mat-" + Math.random().toString(36).substring(2, 9),
    courseId,
    fileName,
    fileUrl,
    fileType,
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
    if (!q.questionText || !Array.isArray(q.options) || !q.correctAnswer || !q.explanation) {
      return res.status(400).json({
        error: `Validation failed at question index ${i}: questionText, options, correctAnswer, and explanation are required.`,
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
  const { level, department } = req.query;
  let courses = db.getCourses();

  if (level) {
    courses = courses.filter((c) => c.level === level);
  }
  if (department) {
    courses = courses.filter((c) => c.department.toLowerCase() === (department as string).toLowerCase());
  }

  return res.json(courses);
});

app.get("/api/courses/:id", (req, res) => {
  const course = db.getCourseById(req.params.id);
  if (!course) {
    return res.status(404).json({ error: "Course not found" });
  }
  return res.json(course);
});

app.get("/api/courses/:id/materials", (req, res) => {
  const materials = db.getMaterialsByCourseId(req.params.id);
  return res.json(materials);
});

app.get("/api/courses/:id/tiers/:tier/questions", (req, res) => {
  const questions = db.getQuestions(req.params.id, req.params.tier as any);
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

  // answers is an array of 50 answers corresponding to questions
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

  // Calculate score out of 50
  const score = correctCount;

  // GLOBAL RULE: If score >= 70% (35 out of 50 correct), unlock next tier inside db.ts
  const dbResult = db.submitProgress(userId, courseId, tier, score);

  return res.json({
    userId,
    courseId,
    tier,
    score,
    percentage: (score / questions.length) * 100,
    passed: score >= 35, // 35 / 50 is 70%
    unlockedNext: dbResult.unlockedNext,
    nextTier: dbResult.nextTier,
    results,
  });
});

// 4. AI Tutor Endpoint
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

    // Build standard System Instruction as per instructions
    const systemInstruction = `You are Compass Guide, an expert academic tutor for Nigerian university students. Your goal is to help students understand their course materials. 

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
    if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY === "MY_GEMINI_API_KEY") {
      // Fallback Socratic explanation if key is missing
      return res.json({
        text: `Hello ${userName}! I'm Compass Guide. (Note: Gemini API Key is currently unconfigured. Here is a simulated tutor response:)\n\n"To find the right answer, let's look at ${courseTitle}. What do you think is the core concept of the material you mentioned? Let's break it down together step-by-step!"`,
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

// --- VITE MIDDLEWARE SETUP ---
async function startServer() {
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

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
