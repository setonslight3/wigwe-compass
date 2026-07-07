export type Role = "student" | "admin";
export type Level = "100L" | "200L" | "300L" | "400L" | "500L";
export type Tier = "easy" | "medium" | "hard";
export type ProgressStatus = "locked" | "unlocked" | "completed";
export type QuestionType = "mcq" | "true_false" | "fill_blank" | "short_answer";

export interface User {
  id: string;
  role: Role;
  name: string;
  email: string;
  level: Level;
  department: string;
  password?: string;
}

export interface Course {
  id: string;
  code: string;
  title: string;
  department: string;
  level: Level;
  college?: string;
  units?: number;
  programs?: string[];
}

export interface Material {
  id: string;
  courseId: string;
  fileName: string;
  fileUrl: string;
  fileType: string;
  week?: number;
  content?: string;
}

export interface Question {
  id: string;
  courseId: string;
  tier: Tier;
  type?: QuestionType; // Defaults to "mcq" if not specified
  questionText: string;
  options?: string[]; // Optional for fill_blank/short_answer. For true_false: ["True", "False"]
  correctAnswer: string; // MCQ options like "A", "B"; True/False like "True", "False"; Fill-in-blank correct text; Short-answer keywords/sample
  explanation: string;
}

export interface Progress {
  id?: string;
  userId: string;
  courseId: string;
  tier: Tier;
  score: number;
  status: ProgressStatus;
}

export interface StudyPlan {
  id: string;
  userId: string;
  courseId: string;
  tier: Tier;
  planType: "blitz" | "sprint" | "three-day" | "weekly";
  totalDays: number;
  currentDay: number;
  completedDays: number[];
  scoresPerDay: { [day: number]: number };
  questionsPerDay: { [day: number]: string[] }; // Stores question IDs partitioned per day
  status: "active" | "completed";
  startDate: string;
}

export interface ChatMessage {
  id: string;
  sender: "user" | "bot";
  text: string;
  timestamp: string;
}

export interface DatabaseState {
  users: User[];
  courses: Course[];
  materials: Material[];
  questions: Question[];
  progress: Progress[];
  studyPlans: StudyPlan[];
}
