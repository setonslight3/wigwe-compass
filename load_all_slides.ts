import { db } from "./src/db.js";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";
import { Course, Material, Tier } from "./src/types.js";

dotenv.config();

const SLIDES_DIR = "C:/Users/Hello/OneDrive/Documents/ALL slides";

// Official program lists
const SCIENCE_COMPUTING_PROGRAMS = [
  "BSc Computer Science",
  "BSc Cybersecurity",
  "BSc Software Engineering",
  "BSc Data Science",
  "BSc Robotics (Artificial Intelligence)",
  "Information and Communications Technology"
];

const ALL_PROGRAMS = [
  "BSc Data Science", "BSc Mathematics", "BSc Computer Science", "BSc Cybersecurity",
  "BSc Software Engineering", "BSc Forensics Science", "BSc Robotics (Artificial Intelligence)",
  "Information and Communications Technology", "BEng Electrical Engineering", "BEng Mechanical Engineering",
  "BEng Computer Engineering", "BA Theatre Arts", "BA Fine Arts", "BSc Film and Screen Studies",
  "BA/BSc Media and Communications", "BSc Economics", "BSc Business Administration",
  "BSc Innovation and Social Entrepreneurship", "BSc Accounting and Data Analytics",
  "BSc Finance", "BSc Finance and Financial Technology"
];

// Helper to parse week from file name
function parseWeekFromFileName(fileName: string): number | undefined {
  const name = fileName.toLowerCase();
  
  // Match patterns like "week 1", "week-1", "week_1", "week1"
  const numMatch = name.match(/week[-_\s]?(\d+)/i);
  if (numMatch) return parseInt(numMatch[1]);
  
  // Match word forms
  if (name.includes("week one") || name.includes("week i ") || name.includes("week-i") || name.includes("week_i") || name.includes("week 1 ")) return 1;
  if (name.includes("week two") || name.includes("week ii")) return 2;
  if (name.includes("week three") || name.includes("week iii")) return 3;
  if (name.includes("week four") || name.includes("week iv")) return 4;
  if (name.includes("week five") || name.includes("week v")) return 5;
  if (name.includes("week six") || name.includes("week vi")) return 6;
  if (name.includes("week seven") || name.includes("week vii") || name.includes("seve")) return 7;
  if (name.includes("week eight") || name.includes("week viii")) return 8;
  if (name.includes("week nine") || name.includes("week ix")) return 9;
  if (name.includes("week ten") || name.includes("week x")) return 10;
  if (name.includes("week eleven") || name.includes("week xi")) return 11;
  if (name.includes("week twelve") || name.includes("week xii")) return 12;
  if (name.includes("week thirteen") || name.includes("week xiii")) return 13;
  if (name.includes("week fourteen") || name.includes("week xiv")) return 14;
  if (name.includes("week fifteen") || name.includes("week xv")) return 15;
  
  return undefined;
}

async function run() {
  if (!fs.existsSync(SLIDES_DIR)) {
    console.error(`ERROR: Directory not found at: ${SLIDES_DIR}`);
    return;
  }

  console.log("Initializing Database...");
  await db.initialize();

  const isSupabase = !!process.env.SUPABASE_URL;
  console.log(`Running in ${isSupabase ? "Supabase Cloud" : "Local db.json"} mode.`);

  // Define target courses
  const targetCourses: { [code: string]: Omit<Course, "id"> } = {
    "COS 101": {
      code: "COS 101",
      title: "Introduction to Computer Science & Programming",
      department: SCIENCE_COMPUTING_PROGRAMS.join(", "),
      level: "100L",
      college: "Science and Computing",
      units: 3
    },
    "COS 102": {
      code: "COS 102",
      title: "Problem Solving and Algorithms",
      department: SCIENCE_COMPUTING_PROGRAMS.join(", "),
      level: "100L",
      college: "Science and Computing",
      units: 3
    },
    "MTH 101": {
      code: "MTH 101",
      title: "General Mathematics I: Algebra & Calculus",
      department: [
        "BSc Mathematics", 
        "BSc Computer Science", 
        "BSc Cybersecurity", 
        "BSc Software Engineering", 
        "BSc Data Science", 
        "BSc Robotics (Artificial Intelligence)"
      ].join(", "),
      level: "100L",
      college: "Science and Computing",
      units: 3
    },
    "PHY 102": {
      code: "PHY 102",
      title: "General Physics II: Electricity and Magnetism",
      department: SCIENCE_COMPUTING_PROGRAMS.join(", "),
      level: "100L",
      college: "Science and Computing",
      units: 3
    },
    "PHY 104": {
      code: "PHY 104",
      title: "General Physics IV: Modern Physics & Optics",
      department: SCIENCE_COMPUTING_PROGRAMS.join(", "),
      level: "100L",
      college: "Science and Computing",
      units: 3
    },
    "PHY 107": {
      code: "PHY 107",
      title: "General Physics Laboratory I",
      department: SCIENCE_COMPUTING_PROGRAMS.join(", "),
      level: "100L",
      college: "Science and Computing",
      units: 1
    },
    "GST 112": {
      code: "GST 112",
      title: "Nigerian Peoples and Culture",
      department: ALL_PROGRAMS.join(", "),
      level: "100L",
      college: "College of Arts",
      units: 2
    },
    "WU 100": {
      code: "WU 100",
      title: "Wigwe University Seminar & Resilience",
      department: ALL_PROGRAMS.join(", "),
      level: "100L",
      college: "College of Arts",
      units: 2
    }
  };

  // Get current courses to map or create them
  const currentCourses = await db.getCourses();
  const courseMap: { [code: string]: Course } = {};

  for (const code of Object.keys(targetCourses)) {
    const existing = currentCourses.find(c => c.code.toUpperCase() === code.toUpperCase());
    if (existing) {
      console.log(`Course ${code} already exists.`);
      courseMap[code] = existing;
    } else {
      console.log(`Creating new course: ${code}...`);
      const courseId = "course-" + code.replace(/\s+/g, "").toLowerCase();
      const courseObj = await db.addCourse({
        id: courseId,
        ...targetCourses[code]
      });
      courseMap[code] = courseObj;
    }
  }

  const importedMaterialsList: Material[] = [];
  let uploadCount = 0;
  
  // Scan subfolders
  const subfolders = fs.readdirSync(SLIDES_DIR);
  for (const folder of subfolders) {
    const folderPath = path.join(SLIDES_DIR, folder);
    if (!fs.statSync(folderPath).isDirectory()) continue;

    console.log(`Scanning subfolder: ${folder}...`);
    const files = fs.readdirSync(folderPath);

    for (const file of files) {
      const filePath = path.join(folderPath, file);
      if (fs.statSync(filePath).isDirectory()) continue;

      const ext = path.extname(file).toLowerCase();
      if (![".pdf", ".pptx", ".ppt", ".docx", ".mp4", ".png"].includes(ext)) continue;

      // Determine course association
      let targetCourse: Course | undefined;
      const lowerFile = file.toLowerCase();

      if (folder === "COS") {
        if (lowerFile.includes("cos101")) targetCourse = courseMap["COS 101"];
        else targetCourse = courseMap["COS 102"];
      } else if (folder === "MTH") {
        targetCourse = courseMap["MTH 101"];
      } else if (folder === "PHY") {
        if (lowerFile.includes("phy104") || lowerFile.includes("phy 104")) targetCourse = courseMap["PHY 104"];
        else if (lowerFile.includes("phy107") || lowerFile.includes("phy 107")) targetCourse = courseMap["PHY 107"];
        else targetCourse = courseMap["PHY 102"];
      } else if (folder === "GST" || folder === "GST 112" || folder === "WU_GST 112") {
        targetCourse = courseMap["GST 112"];
      } else if (folder === "WU 100") {
        targetCourse = courseMap["WU 100"];
      }

      if (!targetCourse) {
        console.warn(`Skipping file: ${file} (No matching course found).`);
        continue;
      }

      const week = parseWeekFromFileName(file);
      const fileType = [".ppt", ".pptx"].includes(ext) ? "ppt" : ext === ".mp4" ? "video" : "pdf";
      const fileUrl = `/uploads/${encodeURIComponent(folder)}/${encodeURIComponent(file)}`;

      const materialId = "mat-" + Math.random().toString(36).substring(2, 9);
      console.log(`Registering material: [${targetCourse.code}] ${file} (Week: ${week || "General"})`);

      const matObj = {
        id: materialId,
        courseId: targetCourse.id,
        fileName: file,
        fileUrl,
        fileType,
        week
      };

      await db.addMaterial(matObj);
      importedMaterialsList.push(matObj);
      uploadCount++;
    }
  }

  console.log(`\nSUCCESS: Completed importing ${uploadCount} slides to local database!`);
  
  console.log("\nSyncing metadata to production serverless database...");
  try {
    const response = await fetch("https://wigwe-compass.vercel.app/api/admin/import-metadata", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        pin: "1234",
        courses: Object.values(courseMap),
        materials: importedMaterialsList
      })
    });
    if (response.ok) {
      const resJson = await response.json();
      console.log(`SUCCESS: Successfully synchronized to production Supabase!`, resJson);
    } else {
      console.error(`ERROR: Failed to synchronize to production:`, await response.text());
    }
  } catch (err) {
    console.error(`ERROR: Failed to connect to production server for sync:`, err);
  }
}

run().catch(console.error);
