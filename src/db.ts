import fs from "fs";
import path from "path";
import { DatabaseState, User, Course, Material, Question, Progress, Tier, Level } from "./types.js";

const DB_FILE = path.join(process.cwd(), "db.json");

// Helper to seed initial questions for a course & tier to guarantee exactly 50 questions.
function generateSeedQuestions(courseId: string, tier: Tier, courseCode: string, courseTitle: string): Question[] {
  const baseQuestions: Omit<Question, "id" | "courseId" | "tier">[] = [];

  if (courseCode === "CSC401") { // Advanced Algorithms
    if (tier === "easy") {
      baseQuestions.push(
        {
          questionText: "Which of the following describes the time complexity of the classic binary search algorithm?",
          options: ["O(N log N)", "O(log N)", "O(N)", "O(1)"],
          correctAnswer: "B",
          explanation: "Binary search divides the search interval in half each time, resulting in a logarithmic time complexity of O(log N)."
        },
        {
          questionText: "What is the primary memory overhead constraint in recursive Depth-First Search (DFS)?",
          options: ["Heap space allocation", "Call stack frames depth", "Garbage collection cycles", "Register allocation limits"],
          correctAnswer: "B",
          explanation: "Recursive DFS relies on the system call stack for storing frames, leading to potential stack overflow if recursion depth is high."
        },
        {
          questionText: "Which design paradigm is primarily utilized in Dijkstra's shortest path algorithm?",
          options: ["Divide and Conquer", "Dynamic Programming", "Greedy Method", "Backtracking"],
          correctAnswer: "C",
          explanation: "Dijkstra's algorithm is greedy because it always chooses the next closest unvisited vertex with the minimum distance."
        }
      );
    } else if (tier === "medium") {
      baseQuestions.push(
        {
          questionText: "In Dynamic Programming, what is the key difference between Memoization and Tabulation?",
          options: [
            "Memoization is bottom-up (iterative); Tabulation is top-down (recursive).",
            "Memoization is top-down (recursive); Tabulation is bottom-up (iterative).",
            "Memoization uses O(N) auxiliary space while Tabulation uses O(1) space.",
            "Memoization never caches sub-problem states whereas Tabulation does."
          ],
          correctAnswer: "B",
          explanation: "Memoization caches results of recursive calls (top-down), while Tabulation fills up a table starting from base cases upwards (bottom-up)."
        },
        {
          questionText: "What does the Bellman-Ford algorithm offer that Dijkstra's algorithm cannot handle?",
          options: [
            "Unweighted adjacency lists",
            "Negative edge weights in graph",
            "Self-loop detections",
            "Faster asymptotic running time"
          ],
          correctAnswer: "B",
          explanation: "Bellman-Ford can handle graphs with negative edge weights and detect negative cycles, unlike Dijkstra's algorithm."
        }
      );
    } else {
      baseQuestions.push(
        {
          questionText: "Which of the following statements is TRUE regarding NP-Complete problems?",
          options: [
            "They can be solved in polynomial time on a deterministic Turing machine.",
            "A polynomial-time solution for any NP-Complete problem solves all NP problems in polynomial time.",
            "They are strictly simpler than NP-Hard problems.",
            "No NP-Complete problem can be verified in polynomial time."
          ],
          correctAnswer: "B",
          explanation: "NP-Complete is the subclass of NP problems such that if any of them is solved in polynomial time, P = NP (all NP problems are solved in polynomial time)."
        }
      );
    }
  } else if (courseCode === "ECO401") { // Advanced Macroeconomics
    if (tier === "easy") {
      baseQuestions.push(
        {
          questionText: "According to Keynsian fiscal policy, what is the primary consequence of an increase in government expenditure during a recession?",
          options: [
            "An immediate decrease in tax rates",
            "A shift of aggregate demand to the right through the multiplier effect",
            "An increase in long-run aggregate supply without inflation",
            "A proportional reduction in national deficit"
          ],
          correctAnswer: "B",
          explanation: "An increase in government spending increases overall demand, which shifts the AD curve to the right, magnified by the fiscal multiplier."
        },
        {
          questionText: "Which institution is primarily responsible for implementing monetary policy in Nigeria?",
          options: ["Ministry of Finance", "Central Bank of Nigeria (CBN)", "National Bureau of Statistics", "Securities and Exchange Commission"],
          correctAnswer: "B",
          explanation: "The CBN is the apex monetary authority in Nigeria responsible for regulating currency, interest rates, and overall money supply."
        }
      );
    } else if (tier === "medium") {
      baseQuestions.push(
        {
          questionText: "What does the Ricardian Equivalence hypothesis state about government deficit spending?",
          options: [
            "It leads to hyperinflation in all circumstances.",
            "Consumers anticipate future tax increases, offsetting any expansionary fiscal impact by saving their current income.",
            "It permanently increases interest rates and crowd-out private investment.",
            "It reduces national savings to zero."
          ],
          correctAnswer: "B",
          explanation: "Ricardian Equivalence posits that government spending funded by debt has no effect on total demand because taxpayers save today to pay future taxes."
        }
      );
    } else {
      baseQuestions.push(
        {
          questionText: "Under a Mundell-Fleming framework with perfect capital mobility and flexible exchange rates, what is the effect of expansionary fiscal policy?",
          options: [
            "Highly effective, leading to a massive increase in GDP.",
            "Completely ineffective, as currency appreciation crowds out net exports entirely.",
            "Somewhat effective, causing capital flight.",
            "Extremely effective in lower-income countries only."
          ],
          correctAnswer: "B",
          explanation: "Under flexible exchange rates and high capital mobility, fiscal expansion attracts capital, drives up exchange rate, crowding out net exports completely."
        }
      );
    }
  } else { // Generic / Neural Pathways (BIO405)
    baseQuestions.push(
      {
        questionText: `Which neurotransmitter is primarily responsible for the rapid relay of signals between neurons in the mammalian central nervous system?`,
        options: [
          "Dopamine and its associated reward pathways",
          "Glutamate, acting on excitatory ionotropic receptors",
          "Serotonin regulation in the prefrontal cortex",
          "GABA acting as the primary inhibitory controller"
        ],
        correctAnswer: "B",
        explanation: "Glutamate is the primary fast excitatory neurotransmitter in the mammalian brain, acting on AMPA, NMDA, and kainate receptors."
      }
    );
  }

  // Fallback if empty
  if (baseQuestions.length === 0) {
    baseQuestions.push({
      questionText: `Foundational study question for ${courseTitle} (${tier} level).`,
      options: ["Correct answer option", "Incorrect option B", "Incorrect option C", "Incorrect option D"],
      correctAnswer: "A",
      explanation: "This is a detailed academic explanation."
    });
  }

  // Expand to exactly 50 questions
  const seeded: Question[] = [];
  for (let i = 1; i <= 50; i++) {
    const base = baseQuestions[(i - 1) % baseQuestions.length];
    seeded.push({
      id: `${courseId}-${tier}-${i}`,
      courseId,
      tier,
      questionText: `[Q${i}] ${base.questionText}`,
      options: [...base.options],
      correctAnswer: base.correctAnswer,
      explanation: `${base.explanation} (Reference concept context Q${i}).`
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
    progress: []
  };

  constructor() {
    this.load();
  }

  private load() {
    try {
      if (fs.existsSync(DB_FILE)) {
        const raw = fs.readFileSync(DB_FILE, "utf-8");
        this.state = JSON.parse(raw);
      } else {
        this.seedDefaults();
        this.save();
      }
    } catch (e) {
      console.error("Error loading local database:", e);
      this.seedDefaults();
      this.save();
    }
  }

  private save() {
    try {
      fs.writeFileSync(DB_FILE, JSON.stringify(this.state, null, 2), "utf-8");
    } catch (e) {
      console.error("Error saving local database:", e);
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
        department: "Computer Science"
      },
      {
        id: "admin1",
        role: "admin",
        name: "Dr. Ojo",
        email: "admin@university.edu",
        level: "500L",
        department: "Computer Science"
      }
    ];

    // Courses matching screenshots and level
    const seedCourses: Course[] = [
      {
        id: "course-csc401",
        code: "CSC401",
        title: "Advanced Algorithms",
        department: "Computer Science",
        level: "400L"
      },
      {
        id: "course-csc402",
        code: "CSC402",
        title: "UI/UX Design Systems",
        department: "Computer Science",
        level: "400L"
      },
      {
        id: "course-eco401",
        code: "ECO401",
        title: "Advanced Macroeconomics",
        department: "Economics",
        level: "400L"
      },
      {
        id: "course-bio405",
        code: "BIO405",
        title: "Neural Pathways",
        department: "Biochemistry",
        level: "400L"
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
      }
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
      progress: seedProgress
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
    return this.state.questions.filter((q) => q.courseId === courseId && q.tier === tier);
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
}

export const db = new LocalDatabase();
