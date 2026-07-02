import { db } from "./src/db.js";
import dotenv from "dotenv";

dotenv.config();

async function run() {
  console.log("Loading database...");
  await db.initialize();
  
  if (!process.env.SUPABASE_URL) {
    console.log("Supabase is not configured locally.");
    return;
  }
  
  try {
    console.log("--- Supabase Database Status Check ---");
    
    // Fetch users
    const users = await db.getUsers();
    console.log(`\nUsers count in database: ${users.length}`);
    users.forEach(u => console.log(`- User: ${u.name} (${u.email}) [ID: ${u.id}]`));
    
    // Fetch courses
    const courses = await db.getCourses();
    console.log(`\nCourses count: ${courses.length}`);
    courses.forEach(c => console.log(`- Course: ${c.code} - ${c.title} [ID: ${c.id}]`));
    
    // Fetch study plans
    const plans = await db.getStudyPlans();
    console.log(`\nActive Study Plans count: ${plans.length}`);
    plans.forEach(p => console.log(`- Plan: [ID: ${p.id}] for User ${p.userId} in Course ${p.courseId} (${p.tier})`));
    
  } catch (error: any) {
    console.error("Database check failed:", error.message || error);
  }
}

run();
