import { loadEnvConfig } from "@next/env";
import path from "path";

const projectDir = path.resolve(process.cwd());
loadEnvConfig(projectDir);

import { connectToDatabase } from "../lib/db";
import { StudentModel, AgentActionModel, StudyPlanModel } from "../lib/models";
import { proposeStudyPlan, resolveAgentAction } from "../lib/agent-tools";

async function verify() {
  try {
    await connectToDatabase();

    const student = await StudentModel.findOne({ email: "rahul.sharma@student.edu" });
    if (!student) {
      console.error("Demo student not found.");
      process.exit(1);
    }
    const studentId = student._id.toString();

    // Clean up any previous verification records to stay idempotent
    await AgentActionModel.deleteMany({ studentId, summary: { $regex: "Test Plan" } });
    await StudyPlanModel.deleteMany({ studentId, goal: "Test Plan Goal" });

    console.log("--- Testing proposeStudyPlan ---");
    // Invalid time
    try {
      await proposeStudyPlan(studentId, {
        goal: "Test Plan Goal",
        sessions: [{ title: "S1", date: "2026-07-20", startTime: "10:00", endTime: "09:00" }]
      });
      console.error("FAIL: Did not reject invalid time.");
      process.exit(1);
    } catch (e: any) {
      console.log(`PASS: Rejected invalid time (${e.message})`);
    }

    // Valid plan
    const proposal = await proposeStudyPlan(studentId, {
      goal: "Test Plan Goal",
      rationale: "Rationale for testing",
      activityLog: ["Checked timetable", "Created plan"],
      sessions: [
        { title: "Review DS", date: "2026-07-20", startTime: "10:00", endTime: "12:00", subject: "Data Structures" }
      ]
    });
    
    console.log(`PASS: Proposed valid plan. ActionID: ${proposal.actionId}, PlanID: ${proposal.planId}`);

    // Verify initial states
    const checkAction = await AgentActionModel.findById(proposal.actionId);
    const checkPlan = await StudyPlanModel.findById(proposal.planId);
    
    if (checkAction?.status !== "pending" || checkPlan?.status !== "pending") {
      console.error("FAIL: Initial status must be pending.");
      process.exit(1);
    }
    console.log("PASS: Initial statuses are pending.");

    // Resolve Action
    await resolveAgentAction(studentId, proposal.actionId, "approved");
    
    const finalAction = await AgentActionModel.findById(proposal.actionId);
    const finalPlan = await StudyPlanModel.findById(proposal.planId);

    if (finalAction?.status !== "approved" || finalPlan?.status !== "approved") {
      console.error("FAIL: Status was not updated to approved.");
      process.exit(1);
    }
    console.log("PASS: Resolution successfully synced status to approved.");

    console.log("\nPhase 3B Verification Successful.");
    process.exit(0);

  } catch (error) {
    console.error("Verification failed:", error);
    process.exit(1);
  }
}

verify();
