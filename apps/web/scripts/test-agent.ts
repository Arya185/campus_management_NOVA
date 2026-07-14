import { loadEnvConfig } from "@next/env";
import path from "path";

const projectDir = path.resolve(process.cwd());
loadEnvConfig(projectDir);

import { connectToDatabase } from "../lib/db";
import { StudentModel } from "../lib/models";
import { runAcademicAgent } from "../lib/academic-agent";

async function testAgent() {
  try {
    await connectToDatabase();
    console.log("Database connected.");

    const student = await StudentModel.findOne({ email: "rahul.sharma@student.edu" });
    if (!student) {
      console.error("Student not found!");
      process.exit(1);
    }

    console.log(`Running agent for student: ${student.email}`);
    const result = await runAcademicAgent(student._id.toString(), "Plan my exam week. I want to study for Data Structures. Schedule 3 sessions for me starting tomorrow. You have my permission to schedule them, please call proposeStudyPlan now.");
    
    console.log("\n--- Agent Result ---");
    console.log("Reply:", result.reply);
    console.log("Activity Log:", result.activityLog);
    console.log("Plan ID:", result.planId);
    console.log("Action ID:", result.actionId);
    if (result.sessions) {
      console.log("Sessions Count:", result.sessions.length);
      console.log("Sessions:", JSON.stringify(result.sessions, null, 2));
    }
    
    process.exit(0);
  } catch (error) {
    console.error("Error:", error);
    process.exit(1);
  }
}

testAgent();
