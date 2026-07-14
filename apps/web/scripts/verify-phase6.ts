import { loadEnvConfig } from "@next/env";
import path from "path";

const projectDir = path.resolve(process.cwd());
loadEnvConfig(projectDir);

import { connectToDatabase } from "../lib/db";
import { StudentModel, StudyPlanModel, AgentActionModel } from "../lib/models";
import { completeStudySession, skipStudySession, proposeReschedule, resolveAgentAction } from "../lib/agent-tools";
import mongoose from "mongoose";

async function verify() {
  try {
    await connectToDatabase();
    
    const student = await StudentModel.findOne({ email: "rahul.sharma@student.edu" }).lean();
    if (!student) {
      console.error("Demo student not found.");
      process.exit(1);
    }
    const studentId = student._id.toString();

    // Setup an approved plan with two sessions
    await StudyPlanModel.deleteMany({ studentId, goal: "Phase 6 Verification Plan" });
    await AgentActionModel.deleteMany({ studentId, actionType: "reschedule_session" });

    const plan = await StudyPlanModel.create({
      studentId,
      goal: "Phase 6 Verification Plan",
      status: "approved",
      sessions: [
        { title: "S1", date: "2026-07-20", startTime: "10:00", endTime: "11:00", status: "planned" },
        { title: "S2", date: "2026-07-21", startTime: "10:00", endTime: "11:00", status: "planned" }
      ]
    });
    
    const planId = plan._id.toString();
    const sessionId1 = plan.sessions[0]._id.toString();
    const sessionId2 = plan.sessions[1]._id.toString();

    console.log("--- Testing Session Completion ---");
    await completeStudySession(studentId, planId, sessionId1);
    const updatedPlan1 = await StudyPlanModel.findById(planId);
    if (updatedPlan1?.sessions.id(sessionId1)?.status !== "completed") {
      console.error("FAIL: Session 1 not marked as completed");
      process.exit(1);
    }
    console.log("PASS: Session successfully marked completed.");

    console.log("--- Testing Session Skip ---");
    await skipStudySession(studentId, planId, sessionId2);
    const updatedPlan2 = await StudyPlanModel.findById(planId);
    if (updatedPlan2?.sessions.id(sessionId2)?.status !== "skipped") {
      console.error("FAIL: Session 2 not marked as skipped");
      process.exit(1);
    }
    console.log("PASS: Session successfully marked skipped.");

    console.log("--- Testing Reschedule Proposal ---");
    const proposal = await proposeReschedule(studentId, planId, sessionId2, {
      title: "S2 (Rescheduled)",
      date: "2026-07-22",
      startTime: "12:00",
      endTime: "13:00"
    });
    console.log(`PASS: Reschedule proposed successfully. Action ID: ${proposal.actionId}`);
    
    // Verify the new session was added as planned
    const updatedPlan3 = await StudyPlanModel.findById(planId);
    if (updatedPlan3?.sessions.length !== 3) {
      console.error("FAIL: New session not appended to plan");
      process.exit(1);
    }

    console.log("--- Testing Unauthorized Action Resolution ---");
    const otherStudentId = new mongoose.Types.ObjectId().toString();
    try {
      await resolveAgentAction(otherStudentId, proposal.actionId, "approved");
      console.error("FAIL: Unauthorized student resolved the action");
      process.exit(1);
    } catch (e: any) {
      if (e.message.includes("Unauthorized")) {
        console.log("PASS: Unauthorized action resolution safely blocked.");
      } else {
        console.error("FAIL: Unexpected error message:", e.message);
        process.exit(1);
      }
    }

    console.log("\nPhase 6 Verification Successful.");
    process.exit(0);

  } catch (error: any) {
    console.error("Verification failed:", error.message);
    process.exit(1);
  }
}

verify();
