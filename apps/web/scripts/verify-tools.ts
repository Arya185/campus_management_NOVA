import { loadEnvConfig } from "@next/env";
import path from "path";

// Load environment variables securely
loadEnvConfig(path.resolve(process.cwd()));

import { 
  getStudentTimetable, 
  getAttendanceSummary, 
  getUpcomingAssignments 
} from "../lib/agent-tools";
import mongoose from "mongoose";

async function verify() {
  try {
    const studentId = "student1";
    console.log(`Verifying Phase 3A tools for student: ${studentId}...`);

    console.log("\n--- Timetable ---");
    const timetable = await getStudentTimetable(studentId);
    console.log(`Found ${timetable.length} entries.`);
    console.table(timetable);

    console.log("\n--- Attendance ---");
    const attendance = await getAttendanceSummary(studentId);
    console.table(attendance);
    
    const hasHealthy = attendance.some(a => a.risk === "healthy");
    const hasAtRisk = attendance.some(a => a.risk === "at-risk");
    console.log(`Has healthy subject? ${hasHealthy}`);
    console.log(`Has at-risk subject? ${hasAtRisk}`);

    console.log("\n--- Upcoming Assignments ---");
    const assignments = await getUpcomingAssignments(studentId);
    console.log(`Found ${assignments.length} upcoming assignments.`);
    console.table(assignments);

    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error("Verification failed:", error);
    process.exit(1);
  }
}

verify();
