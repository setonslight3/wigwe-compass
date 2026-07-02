import { db } from "./src/db.js";
import dotenv from "dotenv";

dotenv.config();

async function run() {
  console.log("Loading database...");
  await db.initialize();
  
  const courses = await db.getCourses();
  console.log("All courses loaded. Finding COS 102...");
  const cos102 = courses.find(c => c.code.toUpperCase() === "COS 102" || c.code.toUpperCase().includes("COS"));
  
  if (!cos102) {
    console.error("COS 102 course not found! Let's check all codes:", courses.map(c => c.code));
    return;
  }
  
  console.log("Found course:", cos102);
  
  // Check questions
  const questions = await db.getQuestions(cos102.id, "easy");
  console.log(`Number of easy questions found for ${cos102.code}:`, questions.length);
  
  try {
    console.log(`Attempting to create study plan for ${cos102.code}...`);
    const plan = await db.createStudyPlan("student1", cos102.id, "easy", "blitz");
    console.log("SUCCESS! Plan created:", plan);
  } catch (error: any) {
    console.error("FAILED! Error details:", error.message || error);
    if (error.stack) {
      console.error(error.stack);
    }
  }
}

run();
