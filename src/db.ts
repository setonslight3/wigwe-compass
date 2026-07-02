import fs from "fs";
import path from "path";
import { DatabaseState, User, Course, Material, Question, Progress, Tier, Level, StudyPlan } from "./types.js";

const DB_FILE = process.env.VERCEL 
  ? path.join("/tmp", "db.json")
  : path.join(process.cwd(), "db.json");

// Helper to seed initial questions for a course & tier to guarantee exactly 50 questions of varied types.
function generateSeedQuestions(courseId: string, tier: Tier, courseCode: string, courseTitle: string): Question[] {
  const seeded: Question[] = [];

  for (let i = 1; i <= 50; i++) {
    let type: "mcq" | "true_false" | "fill_blank" | "short_answer" = "mcq";
    if (i > 40) type = "short_answer";
    else if (i > 30) type = "fill_blank";
    else if (i > 20) type = "true_false";

    let questionText = "";
    let options: string[] = [];
    let correctAnswer = "";
    let explanation = "";

    if (type === "mcq") {
      if (courseCode === "CSC401") {
        if (tier === "easy") {
          const mcqs = [
            {
              q: "Which of the following describes the time complexity of the classic binary search algorithm?",
              opts: ["O(N log N)", "O(log N)", "O(N)", "O(1)"],
              ans: "B",
              exp: "Binary search divides the search interval in half each time, resulting in a logarithmic time complexity of O(log N)."
            },
            {
              q: "What is the primary memory overhead constraint in recursive Depth-First Search (DFS)?",
              opts: ["Heap space allocation", "Call stack frames depth", "Garbage collection cycles", "Register allocation limits"],
              ans: "B",
              exp: "Recursive DFS relies on the system call stack for storing frames, leading to potential stack overflow if recursion depth is high."
            },
            {
              q: "Which design paradigm is primarily utilized in Dijkstra's shortest path algorithm?",
              opts: ["Divide and Conquer", "Dynamic Programming", "Greedy Method", "Backtracking"],
              ans: "C",
              exp: "Dijkstra's algorithm is greedy because it always chooses the next closest unvisited vertex with the minimum distance."
            }
          ];
          const base = mcqs[(i - 1) % mcqs.length];
          questionText = base.q;
          options = [...base.opts];
          correctAnswer = base.ans;
          explanation = base.exp;
        } else if (tier === "medium") {
          const mcqs = [
            {
              q: "In Dynamic Programming, what is the key difference between Memoization and Tabulation?",
              opts: [
                "Memoization is bottom-up (iterative); Tabulation is top-down (recursive).",
                "Memoization is top-down (recursive); Tabulation is bottom-up (iterative).",
                "Memoization uses O(N) auxiliary space while Tabulation uses O(1) space.",
                "Memoization never caches sub-problem states whereas Tabulation does."
              ],
              ans: "B",
              exp: "Memoization caches results of recursive calls (top-down), while Tabulation fills up a table starting from base cases upwards (bottom-up)."
            },
            {
              q: "What does the Bellman-Ford algorithm offer that Dijkstra's algorithm cannot handle?",
              opts: [
                "Unweighted adjacency lists",
                "Negative edge weights in graph",
                "Self-loop detections",
                "Faster asymptotic running time"
              ],
              ans: "B",
              exp: "Bellman-Ford can handle graphs with negative edge weights and detect negative cycles, unlike Dijkstra's algorithm."
            }
          ];
          const base = mcqs[(i - 1) % mcqs.length];
          questionText = base.q;
          options = [...base.opts];
          correctAnswer = base.ans;
          explanation = base.exp;
        } else {
          questionText = "Which of the following statements is TRUE regarding NP-Complete problems?";
          options = [
            "They can be solved in polynomial time on a deterministic Turing machine.",
            "A polynomial-time solution for any NP-Complete problem solves all NP problems in polynomial time.",
            "They are strictly simpler than NP-Hard problems.",
            "No NP-Complete problem can be verified in polynomial time."
          ];
          correctAnswer = "B";
          explanation = "NP-Complete is the subclass of NP problems such that if any of them is solved in polynomial time, P = NP.";
        }
      } else if (courseCode === "ECO401") {
        if (tier === "easy") {
          const mcqs = [
            {
              q: "According to Keynesian fiscal policy, what is the primary consequence of an increase in government expenditure during a recession?",
              opts: [
                "An immediate decrease in tax rates",
                "A shift of aggregate demand to the right through the multiplier effect",
                "An increase in long-run aggregate supply without inflation",
                "A proportional reduction in national deficit"
              ],
              ans: "B",
              exp: "An increase in government spending increases overall demand, which shifts the AD curve to the right, magnified by the fiscal multiplier."
            },
            {
              q: "Which institution is primarily responsible for implementing monetary policy in Nigeria?",
              opts: ["Ministry of Finance", "Central Bank of Nigeria (CBN)", "National Bureau of Statistics", "Securities and Exchange Commission"],
              ans: "B",
              exp: "The CBN is the apex monetary authority in Nigeria responsible for regulating currency, interest rates, and overall money supply."
            }
          ];
          const base = mcqs[(i - 1) % mcqs.length];
          questionText = base.q;
          options = [...base.opts];
          correctAnswer = base.ans;
          explanation = base.exp;
        } else if (tier === "medium") {
          questionText = "What does the Ricardian Equivalence hypothesis state about government deficit spending?";
          options = [
            "It leads to hyperinflation in all circumstances.",
            "Consumers anticipate future tax increases, offsetting any expansionary fiscal impact by saving their current income.",
            "It permanently increases interest rates and crowds out private investment.",
            "It reduces national savings to zero."
          ];
          correctAnswer = "B";
          explanation = "Ricardian Equivalence posits that government spending funded by debt has no effect on total demand because taxpayers save today to pay future taxes.";
        } else {
          questionText = "Under a Mundell-Fleming framework with perfect capital mobility and flexible exchange rates, what is the effect of expansionary fiscal policy?";
          options = [
            "Highly effective, leading to a massive increase in GDP.",
            "Completely ineffective, as currency appreciation crowds out net exports entirely.",
            "Somewhat effective, causing capital flight.",
            "Extremely effective in lower-income countries only."
          ];
          correctAnswer = "B";
          explanation = "Under flexible exchange rates and high capital mobility, fiscal expansion attracts capital, drives up exchange rate, crowding out net exports completely.";
        }
      } else if (courseCode === "ART401") {
        questionText = "Which culture is famous for producing highly sophisticated terracotta sculptures in Nigeria between 1500 BC and 200 AD?";
        options = ["Nok Culture", "Kingdom of Benin", "Igbo-Ukwu", "Kingdom of Ife"];
        correctAnswer = "A";
        explanation = "The Nok Culture is famous for its distinct terracotta sculptures, representing some of the earliest refined art in West Africa.";
      } else {
        questionText = "Which neurotransmitter is primarily responsible for the rapid relay of signals between neurons in the mammalian central nervous system?";
        options = [
          "Dopamine and its associated reward pathways",
          "Glutamate, acting on excitatory ionotropic receptors",
          "Serotonin regulation in the prefrontal cortex",
          "GABA acting as the primary inhibitory controller"
        ];
        correctAnswer = "B";
        explanation = "Glutamate is the primary fast excitatory neurotransmitter in the mammalian brain, acting on AMPA, NMDA, and kainate receptors.";
      }
      questionText = `[Q${i}] ${questionText}`;
    } else if (type === "true_false") {
      options = ["True", "False"];
      correctAnswer = i % 2 === 0 ? "True" : "False";
      questionText = `[Q${i} - True/False] Is it correct to state that Nok terracotta art represents the oldest known figurative sculpture in Sub-Saharan Africa?`;
      explanation = "Yes, Nok terracottas date back to at least 500 BC (and newer evidence suggests 1500 BC), making them the oldest figurative art in Sub-Saharan Africa.";
      if (courseCode === "CSC401") {
        questionText = `[Q${i} - True/False] Is it correct to state that the optimal substructure property is a prerequisite for applying Dynamic Programming techniques to a problem?`;
        explanation = "Yes, dynamic programming requires both optimal substructure and overlapping subproblems.";
      } else if (courseCode === "ECO401") {
        questionText = `[Q${i} - True/False] Under fixed exchange rates, fiscal policy is highly effective compared to monetary policy under perfect capital mobility.`;
        correctAnswer = "True";
        explanation = "Under fixed exchange rates, monetary policy is locked in to maintain the peg, leaving fiscal policy highly effective.";
      }
    } else if (type === "fill_blank") {
      correctAnswer = courseCode === "CSC401" ? "Memoization" : courseCode === "ECO401" ? "Inflation" : courseCode === "ART401" ? "Terracotta" : "Neuron";
      questionText = `[Q${i} - Fill in the blank] The artistic medium consisting of baked clay, widely used in Nok and Ife sculptures, is known as ___________.`;
      if (courseCode === "CSC401") {
        questionText = `[Q${i} - Fill in the blank] The top-down optimization approach in dynamic programming that stores computed results of recursive calls is known as ___________.`;
      } else if (courseCode === "ECO401") {
        questionText = `[Q${i} - Fill in the blank] A general and progressive increase in prices and fall in the purchasing value of money is known as ___________.`;
      } else if (courseCode === "BIO405") {
        questionText = `[Q${i} - Fill in the blank] The basic working unit of the brain, a specialized cell designed to transmit information to other nerve cells, is a ___________.`;
      }
      explanation = `The correct answer is ${correctAnswer}. This is a fundamental terminology check.`;
    } else { // short_answer
      correctAnswer = courseCode === "CSC401" ? "overlapping, subproblems, recursion, space" : courseCode === "ECO401" ? "aggregate, demand, supply, equilibrium" : courseCode === "ART401" ? "clay, terracotta, figures, nok" : "synapse, neurotransmitter, receptor, signal";
      questionText = `[Q${i} - Short Answer] Briefly explain the artistic significance of Nok terracotta heads in African art history.`;
      if (courseCode === "CSC401") {
        questionText = `[Q${i} - Short Answer] Briefly explain the core difference between Dynamic Programming and Divide-and-Conquer algorithms.`;
      } else if (courseCode === "ECO401") {
        questionText = `[Q${i} - Short Answer] Briefly explain the impact of high inflation rates on the purchasing power of the Nigerian Naira.`;
      } else if (courseCode === "BIO405") {
        questionText = `[Q${i} - Short Answer] Briefly explain the process of synaptic transmission between two neurons.`;
      }
      explanation = `Short answer evaluated based on academic keyword coverage: ${correctAnswer.split(", ").join(", ")}.`;
    }

    seeded.push({
      id: `${courseId}-${tier}-${i}`,
      courseId,
      tier,
      type,
      questionText,
      options: options.length > 0 ? options : undefined,
      correctAnswer,
      explanation
    });
  }

  return seeded;
}

export class LocalDatabase {
  private state: DatabaseState = {
    users: [],
    courses: [],
    materials: [],
    questions: [],
    progress: [],
    studyPlans: []
  };

  private isSaving = false;
  private pendingSave = false;
  private initialized = false;
  private initPromise: Promise<void> | null = null;

  constructor() {
    // Synchronous load for local dev fallback (non-blocking)
    if (!process.env.SUPABASE_URL) {
      try {
        if (fs.existsSync(DB_FILE)) {
          const raw = fs.readFileSync(DB_FILE, "utf-8");
          this.state = JSON.parse(raw);
          this.guaranteeInitializations();
        } else {
          this.seedDefaults();
          fs.writeFileSync(DB_FILE, JSON.stringify(this.state, null, 2), "utf-8");
        }
      } catch (e) {
        this.seedDefaults();
      }
    }
  }

  public async initialize(): Promise<void> {
    if (this.initialized) return;
    if (this.initPromise) return this.initPromise;

    this.initPromise = (async () => {
      await this.load();
      this.initialized = true;
    })();

    return this.initPromise;
  }

  private async load(): Promise<void> {
    const supabaseUrl = process.env.SUPABASE_URL?.replace(/\/$/, "");
    const supabaseKey = process.env.SUPABASE_ANON_KEY;

    if (supabaseUrl && supabaseKey) {
      if (typeof fetch === "undefined") {
        throw new Error("global fetch is not defined in this Node.js runtime. Please upgrade your Vercel Node runtime to Node 18 or 20.");
      }
      try {
        console.log(`[Database] Connecting to Supabase at: ${supabaseUrl}`);
        const res = await fetch(`${supabaseUrl}/rest/v1/compass_store?id=eq.1`, {
          headers: {
            "apikey": supabaseKey,
            "Authorization": `Bearer ${supabaseKey}`
          }
        });
        if (res.ok) {
          const rows: any = await res.json();
          if (rows && rows.length > 0) {
            console.log("[Database] Loaded state successfully from Supabase.");
            this.state = rows[0].state;
            this.guaranteeInitializations();
            return;
          }
        }
        console.warn("[Database] No state found in Supabase table. Initializing defaults...");
      } catch (e: any) {
        console.error("[Database] Error loading from Supabase:", e.message);
      }
    }

    // Local file fallback
    try {
      if (process.env.VERCEL && !fs.existsSync(DB_FILE)) {
        const templatePath = path.join(process.cwd(), "db.json");
        if (fs.existsSync(templatePath)) {
          fs.copyFileSync(templatePath, DB_FILE);
        }
      }

      if (fs.existsSync(DB_FILE)) {
        const raw = fs.readFileSync(DB_FILE, "utf-8");
        this.state = JSON.parse(raw);
        this.guaranteeInitializations();
      } else {
        this.seedDefaults();
        this.save();
      }
    } catch (e) {
      console.error("[Database] Error loading local database:", e);
      this.seedDefaults();
      this.save();
    }
  }

  private guaranteeInitializations() {
    this.state.users = this.state.users || [];
    this.state.courses = this.state.courses || [];
    this.state.materials = this.state.materials || [];
    this.state.questions = this.state.questions || [];
    this.state.progress = this.state.progress || [];
    this.state.studyPlans = this.state.studyPlans || [];

    if (this.state.users.length === 0 && this.state.courses.length === 0) {
      console.log("[Database] Loaded database state is empty. Seeding default data...");
      this.seedDefaults();
      this.save();
    } else {
      // Migrate old college names
      this.state.courses.forEach(c => {
        if (c.college === "College of Sciences" || c.college === "Sciences") c.college = "Science and Computing";
        if (c.college === "College of Social Sciences" || c.college === "Social Sciences") c.college = "Management and Social Sciences";
        if (c.college === "College of Engineering" || c.college === "Engineering") c.college = "Engineering";
        if (c.college === "Art") c.college = "Art";
      });
    }
  }

  public save() {
    // 1. Local saving
    try {
      fs.writeFileSync(DB_FILE, JSON.stringify(this.state, null, 2), "utf-8");
    } catch (e: any) {
      console.error("[Database] Local save warning:", e.message);
    }

    // 2. Supabase saving (fire and forget)
    const supabaseUrl = process.env.SUPABASE_URL?.replace(/\/$/, "");
    const supabaseKey = process.env.SUPABASE_ANON_KEY;

    if (supabaseUrl && supabaseKey) {
      this.saveToSupabase(supabaseUrl, supabaseKey);
    }
  }

  private async saveToSupabase(url: string, key: string) {
    if (this.isSaving) {
      this.pendingSave = true;
      return;
    }
    this.isSaving = true;

    try {
      const res = await fetch(`${url}/rest/v1/compass_store?id=eq.1`, {
        method: "PATCH",
        headers: {
          "apikey": key,
          "Authorization": `Bearer ${key}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ state: this.state })
      });
      if (!res.ok) {
        const errText = await res.text();
        console.error("[Database] Supabase save failure status:", res.status, errText);
      }
    } catch (e: any) {
      console.error("[Database] Supabase save error:", e.message);
    } finally {
      this.isSaving = false;
      if (this.pendingSave) {
        this.pendingSave = false;
        this.saveToSupabase(url, key);
      }
    }
  }

  private seedDefaults() {
    // Initial users (including an admin and a student)
    const seedUsers: User[] = [
      {
        id: "student1",
        role: "student",
        name: "Alex",
        email: "student@university.edu",
        level: "400L",
        department: "BSc Computer Science"
      },
      {
        id: "admin1",
        role: "admin",
        name: "Dr. Ojo",
        email: "admin@university.edu",
        level: "500L",
        department: "BSc Computer Science"
      }
    ];

    // Courses matching screenshots, level, colleges and units
    const seedCourses: Course[] = [
      {
        id: "course-csc401",
        code: "CSC401",
        title: "Advanced Algorithms",
        department: "BSc Computer Science",
        level: "400L",
        college: "Science and Computing",
        units: 3
      },
      {
        id: "course-csc402",
        code: "CSC402",
        title: "UI/UX Design Systems",
        department: "BSc Computer Science",
        level: "400L",
        college: "Science and Computing",
        units: 3
      },
      {
        id: "course-eco401",
        code: "ECO401",
        title: "Advanced Macroeconomics",
        department: "BSc Economics",
        level: "400L",
        college: "Management and Social Sciences",
        units: 4
      },
      {
        id: "course-bio405",
        code: "BIO405",
        title: "Neural Pathways",
        department: "BSc Robotics (Artificial Intelligence)",
        level: "400L",
        college: "Science and Computing",
        units: 2
      }
    ];

    // Seed materials
    const seedMaterials: Material[] = [
      {
        id: "mat1",
        courseId: "course-eco401",
        fileName: "Fiscal Policy Framework.pdf",
        fileUrl: "https://pdf-viewer-link.edu/fiscal_policy.pdf",
        fileType: "pdf"
      },
      {
        id: "mat2",
        courseId: "course-eco401",
        fileName: "Lecture Slides - Week 4.ppt",
        fileUrl: "https://slides-link.edu/eco401_slides_w4.ppt",
        fileType: "ppt"
      },
      {
        id: "mat3",
        courseId: "course-eco401",
        fileName: "Data Set: Regional Growth.pdf",
        fileUrl: "https://pdf-viewer-link.edu/regional_growth_data.pdf",
        fileType: "pdf"
      },
      {
        id: "mat4",
        courseId: "course-csc402",
        fileName: "UI_UX_Design_Systems_Intro.pdf",
        fileUrl: "https://pdf-viewer-link.edu/uiux_design_systems.pdf",
        fileType: "pdf"
      },
      {
        id: "mat5",
        courseId: "course-csc401",
        fileName: "Dynamic Programming Guide.pdf",
        fileUrl: "https://pdf-viewer-link.edu/dynamic_programming.pdf",
        fileType: "pdf"
      }
    ];

    // Seed initial progress for "student1" (Alex)
    const seedProgress: Progress[] = [
      // ECO401: Easy completed, Medium locked, Hard locked
      {
        userId: "student1",
        courseId: "course-eco401",
        tier: "easy",
        score: 41, // 82%
        status: "completed"
      },
      {
        userId: "student1",
        courseId: "course-eco401",
        tier: "medium",
        score: 0,
        status: "locked"
      },
      {
        userId: "student1",
        courseId: "course-eco401",
        tier: "hard",
        score: 0,
        status: "locked"
      },
      // CSC402: Easy unlocked (75%), overall 75%
      {
        userId: "student1",
        courseId: "course-csc402",
        tier: "easy",
        score: 38, // 76%
        status: "completed"
      },
      {
        userId: "student1",
        courseId: "course-csc402",
        tier: "medium",
        score: 0,
        status: "unlocked"
      },
      {
        userId: "student1",
        courseId: "course-csc402",
        tier: "hard",
        score: 0,
        status: "locked"
      },
      // CSC401: Easy unlocked
      {
        userId: "student1",
        courseId: "course-csc401",
        tier: "easy",
        score: 0,
        status: "unlocked"
      },
      {
        userId: "student1",
        courseId: "course-csc401",
        tier: "medium",
        score: 0,
        status: "locked"
      },
      {
        userId: "student1",
        courseId: "course-csc401",
        tier: "hard",
        score: 0,
        status: "locked"
      },
      // BIO405: Easy unlocked
      {
        userId: "student1",
        courseId: "course-bio405",
        tier: "easy",
        score: 0,
        status: "unlocked"
      },
      {
        userId: "student1",
        courseId: "course-bio405",
        tier: "medium",
        score: 0,
        status: "locked"
      },
      {
        userId: "student1",
        courseId: "course-bio405",
        tier: "hard",
        score: 0,
        status: "locked"
      },
    ];

    // Seed questions for all courses and tiers (guaranteeing exactly 50 per tier)
    const seedQuestions: Question[] = [];
    for (const course of seedCourses) {
      for (const tier of ["easy", "medium", "hard"] as Tier[]) {
        const generated = generateSeedQuestions(course.id, tier, course.code, course.title);
        seedQuestions.push(...generated);
      }
    }

    this.state = {
      users: seedUsers,
      courses: seedCourses,
      materials: seedMaterials,
      questions: seedQuestions,
      progress: seedProgress,
      studyPlans: []
    };
  }

  // --- API Methods ---

  public getUsers(): User[] {
    return this.state.users;
  }

  public getUserByEmail(email: string): User | undefined {
    return this.state.users.find((u) => u.email.toLowerCase() === email.toLowerCase());
  }

  public getUserById(id: string): User | undefined {
    return this.state.users.find((u) => u.id === id);
  }

  public addUser(user: User): User {
    this.state.users.push(user);
    this.save();
    return user;
  }

  public getCourses(): Course[] {
    return this.state.courses;
  }

  public addCourse(course: Course): Course {
    this.state.courses.push(course);
    this.save();
    return course;
  }

  public deleteCourse(id: string): void {
    this.state.courses = this.state.courses.filter((c) => c.id !== id);
    this.state.materials = this.state.materials.filter((m) => m.courseId !== id);
    this.state.questions = this.state.questions.filter((q) => q.courseId !== id);
    this.state.progress = this.state.progress.filter((p) => p.courseId !== id);
    this.state.studyPlans = this.state.studyPlans.filter((s) => s.courseId !== id);
    this.save();
  }

  public getCourseById(id: string): Course | undefined {
    return this.state.courses.find((c) => c.id === id);
  }

  public getMaterialsByCourseId(courseId: string): Material[] {
    return this.state.materials.filter((m) => m.courseId === courseId);
  }

  public addMaterial(material: Material): Material {
    this.state.materials.push(material);
    this.save();
    return material;
  }

  public getQuestions(courseId: string, tier: Tier): Question[] {
    const qList = this.state.questions.filter((q) => q.courseId === courseId && q.tier === tier);
    if (qList.length === 0) {
      // Generate default 50 questions if they don't exist
      const course = this.getCourseById(courseId);
      if (course) {
        const generated = generateSeedQuestions(courseId, tier, course.code, course.title);
        this.state.questions.push(...generated);
        this.save();
        return generated;
      }
    }
    return qList;
  }

  public saveQuestionsBulk(courseId: string, tier: Tier, questions: Question[]): void {
    // Remove existing questions for this Course+Tier
    this.state.questions = this.state.questions.filter(
      (q) => !(q.courseId === courseId && q.tier === tier)
    );
    // Add new ones
    this.state.questions.push(...questions);
    this.save();
  }

  public getProgress(userId: string): Progress[] {
    // If no progress exists for this student, initialize it with all course easy tiers unlocked
    const userProgress = this.state.progress.filter((p) => p.userId === userId);
    if (userProgress.length === 0) {
      const initialProgress: Progress[] = [];
      for (const course of this.state.courses) {
        initialProgress.push(
          { userId, courseId: course.id, tier: "easy", score: 0, status: "unlocked" },
          { userId, courseId: course.id, tier: "medium", score: 0, status: "locked" },
          { userId, courseId: course.id, tier: "hard", score: 0, status: "locked" }
        );
      }
      this.state.progress.push(...initialProgress);
      this.save();
      return initialProgress;
    }
    return userProgress;
  }

  public submitProgress(
    userId: string,
    courseId: string,
    tier: Tier,
    score: number
  ): { score: number; unlockedNext: boolean; nextTier: Tier | null } {
    // Get all progress for this user
    this.getProgress(userId);

    // Find the current progress entry
    let currentEntry = this.state.progress.find(
      (p) => p.userId === userId && p.courseId === courseId && p.tier === tier
    );

    if (!currentEntry) {
      currentEntry = {
        userId,
        courseId,
        tier,
        score,
        status: score >= 35 ? "completed" : "unlocked"
      };
      this.state.progress.push(currentEntry);
    } else {
      currentEntry.score = Math.max(currentEntry.score, score);
      if (score >= 35) {
        currentEntry.status = "completed";
      }
    }

    let unlockedNext = false;
    let nextTier: Tier | null = null;

    // GLOBAL RULE: If score >= 70% (which is >= 35 correct answers out of 50), unlock the next tier
    if (score >= 35) { // 35 / 50 = 70%
      if (tier === "easy") {
        nextTier = "medium";
      } else if (tier === "medium") {
        nextTier = "hard";
      }

      if (nextTier) {
        let nextEntry = this.state.progress.find(
          (p) => p.userId === userId && p.courseId === courseId && p.tier === nextTier
        );
        if (!nextEntry) {
          nextEntry = {
            userId,
            courseId,
            tier: nextTier,
            score: 0,
            status: "unlocked"
          };
          this.state.progress.push(nextEntry);
          unlockedNext = true;
        } else if (nextEntry.status === "locked") {
          nextEntry.status = "unlocked";
          unlockedNext = true;
        }
      }
    }

    this.save();
    return { score, unlockedNext, nextTier };
  }

  public getLeaderboard(courseId: string, tier: Tier) {
    const matchingProgress = this.state.progress.filter(
      (p) => p.courseId === courseId && p.tier === tier && p.score > 0
    );

    const results = matchingProgress.map((p) => {
      const user = this.getUserById(p.userId);
      return {
        userId: p.userId,
        name: user ? user.name : "Anonymous Student",
        department: user ? user.department : "Computer Science",
        level: user ? user.level : "400L",
        score: p.score,
      };
    });

    // Merge with preset competitors to encourage a competitive atmosphere
    const competitors = [
      { name: "Chidi Nwachukwu", department: "Computer Science", level: "400L", baseScore: 47 },
      { name: "Zainab Abubakar", department: "Computer Science", level: "400L", baseScore: 44 },
      { name: "Femi Adebayo", department: "Computer Science", level: "400L", baseScore: 41 },
      { name: "Ngozi Okafor", department: "Computer Science", level: "400L", baseScore: 38 },
      { name: "Tunde Bakare", department: "Computer Science", level: "400L", baseScore: 33 },
    ];

    competitors.forEach((c) => {
      if (!results.some((r) => r.name === c.name)) {
        results.push({
          userId: `mock-${c.name.toLowerCase().replace(/\s+/g, "-")}`,
          name: c.name,
          department: c.department,
          level: c.level as Level,
          score: c.baseScore,
        });
      }
    });

    // Sort descending by score
    results.sort((a, b) => b.score - a.score);

    // Limit to top 5
    return results.slice(0, 5);
  }

  // --- Study Plan Methods ---

  public getStudyPlans(): StudyPlan[] {
    this.state.studyPlans = this.state.studyPlans || [];
    return this.state.studyPlans;
  }

  public getStudyPlan(userId: string, courseId: string, tier: Tier): StudyPlan | undefined {
    this.getStudyPlans();
    return this.state.studyPlans.find(
      (sp) => sp.userId === userId && sp.courseId === courseId && sp.tier === tier && sp.status === "active"
    );
  }

  public createStudyPlan(
    userId: string,
    courseId: string,
    tier: Tier,
    planType: "blitz" | "sprint" | "three-day" | "weekly"
  ): StudyPlan {
    this.getStudyPlans();
    
    // Deactivate any existing active plan for this user + course + tier
    this.state.studyPlans = this.state.studyPlans.filter(
      (sp) => !(sp.userId === userId && sp.courseId === courseId && sp.tier === tier && sp.status === "active")
    );

    const questions = this.getQuestions(courseId, tier);
    const questionIds = questions.map((q) => q.id);

    // Shuffle questionIds to randomize daily distribution
    const shuffledIds = [...questionIds].sort(() => Math.random() - 0.5);

    let totalDays = 1;
    if (planType === "sprint") totalDays = 2;
    else if (planType === "three-day") totalDays = 3;
    else if (planType === "weekly") totalDays = 7;

    const questionsPerDay: { [day: number]: string[] } = {};
    for (let day = 1; day <= totalDays; day++) {
      questionsPerDay[day] = [];
    }

    // Partition 50 questions into days
    shuffledIds.forEach((id, index) => {
      const day = (index % totalDays) + 1;
      questionsPerDay[day].push(id);
    });

    const newPlan: StudyPlan = {
      id: "plan-" + Math.random().toString(36).substring(2, 9),
      userId,
      courseId,
      tier,
      planType,
      totalDays,
      currentDay: 1,
      completedDays: [],
      scoresPerDay: {},
      questionsPerDay,
      status: "active",
      startDate: new Date().toISOString()
    };

    this.state.studyPlans.push(newPlan);
    this.save();
    return newPlan;
  }

  public submitDayProgress(
    userId: string,
    courseId: string,
    tier: Tier,
    day: number,
    score: number
  ): { plan: StudyPlan; cumulativeScore: number; passed: boolean; unlockedNext: boolean; nextTier: Tier | null } {
    this.getStudyPlans();
    const plan = this.state.studyPlans.find(
      (sp) => sp.userId === userId && sp.courseId === courseId && sp.tier === tier && sp.status === "active"
    );

    if (!plan) {
      throw new Error("Active study plan not found");
    }

    plan.scoresPerDay[day] = score;
    if (!plan.completedDays.includes(day)) {
      plan.completedDays.push(day);
    }

    let cumulativeScore = 0;
    Object.values(plan.scoresPerDay).forEach((s) => {
      cumulativeScore += s;
    });

    let passed = false;
    let unlockedNext = false;
    let nextTier: Tier | null = null;

    if (plan.completedDays.length === plan.totalDays) {
      plan.status = "completed";
      passed = cumulativeScore >= 35; // 70% threshold

      // If they passed the entire plan, submit progress to unlock next tier
      const result = this.submitProgress(userId, courseId, tier, cumulativeScore);
      unlockedNext = result.unlockedNext;
      nextTier = result.nextTier;
    } else {
      // Advance to next day
      plan.currentDay = Math.min(plan.totalDays, day + 1);
    }

    this.save();
    return { plan, cumulativeScore, passed, unlockedNext, nextTier };
  }

  public resetStudyPlan(userId: string, courseId: string, tier: Tier): void {
    this.getStudyPlans();
    this.state.studyPlans = this.state.studyPlans.filter(
      (sp) => !(sp.userId === userId && sp.courseId === courseId && sp.tier === tier && sp.status === "active")
    );
    this.save();
  }
}

export const db = new LocalDatabase();
