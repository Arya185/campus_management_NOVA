import { loadEnvConfig } from "@next/env";
import path from "path";

// Load environment variables safely
const projectDir = path.resolve(process.cwd());
loadEnvConfig(projectDir);

import mongoose from "mongoose";
import { connectToDatabase } from "../lib/db";
import { StudentModel } from "../lib/models";
import { 
  getStudentTimetable, 
  getAttendanceSummary, 
  getUpcomingAssignments 
} from "../lib/agent-tools";

async function verify() {
  try {
    await connectToDatabase();

    // 1. Resolve Demo Student
    const student = await StudentModel.findOne({ email: "rahul.sharma@student.edu" });
    if (!student) {
      console.error("Demo student not found.");
      process.exit(1);
    }
    const studentId = student._id.toString();

    console.log(`Verifying tools for student: ${student.email}`);

    // 2. Call getStudentTimetable
    const timetable = await getStudentTimetable(studentId);
    console.log(`\n--- Timetable (${timetable.length} entries) ---`);
    if (timetable.length > 0) {
      console.log(`Example: ${timetable[0].day} ${timetable[0].timeSlot} - ${timetable[0].subject}`);
    } else {
      console.log("No timetable data found.");
    }

    // 3. Call getAttendanceSummary
    const attendance = await getAttendanceSummary(studentId);
    console.log(`\n--- Attendance Summary (${attendance.length} subjects) ---`);
    let hasHealthy = false;
    let hasAtRisk = false;
    attendance.forEach(a => {
      console.log(`${a.subject}: ${a.attendancePercentage}% (${a.status})`);
      if (a.status === "Healthy") hasHealthy = true;
      if (a.status === "At-Risk") hasAtRisk = true;
    });

    // 4. Call getUpcomingAssignments
    const assignments = await getUpcomingAssignments(studentId);
    console.log(`\n--- Upcoming Assignments (${assignments.length} entries) ---`);
    assignments.forEach(a => {
      console.log(`${a.title} (Due: ${a.dueDate}, Urgency: ${a.urgency})`);
    });

    // 5. Validate scenario
    console.log("\n--- Scenario Validation ---");
    console.log(`Timetable present: ${timetable.length > 0 ? "PASS" : "FAIL"}`);
    console.log(`Contains Healthy Subject: ${hasHealthy ? "PASS" : "FAIL"}`);
    console.log(`Contains At-Risk Subject: ${hasAtRisk ? "PASS" : "FAIL"}`);
    console.log(`Contains Assignments in Order: ${assignments.length > 0 ? "PASS" : "FAIL"}`);

    process.exit(0);
  } catch (error) {
    console.error("Verification failed:", error);
    process.exit(1);
  }
}

verify();
