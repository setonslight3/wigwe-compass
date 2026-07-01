export type Role = "student" | "admin";
export type Level = "100L" | "200L" | "300L" | "400L" | "500L";
export type Tier = "easy" | "medium" | "hard";
export type ProgressStatus = "locked" | "unlocked" | "completed";

export interface User {
  id: string;
  role: Role;
  name: string;
  email: string;
  level: Level;
  department: string;
}

export interface Course {
  id: string;
  code: string;
  title: string;
  department: string;
  level: Level;
}

export interface Material {
  id: string;
  courseId: string;
  fileName: string;
  fileUrl: string;
  fileType: string;
}

export interface Question {
  id: string;
  courseId: string;
  tier: Tier;
  questionText: string;
  options: string[]; // e.g. ["Option A", "Option B", "Option C", "Option D"]
  correctAnswer: string; // e.g. "A" or "B" or "C" or "D"
  explanation: string;
}

export interface Progress {
  userId: string;
  courseId: string;
  tier: Tier;
  score: number;
  status: ProgressStatus;
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
}
