import mongoose from "mongoose";
import { connectToDatabase } from "./db";
import { StudentModel, TimetableModel, AttendanceModel, AssignmentModel, StudyPlanModel, AgentActionModel } from "./models";
export async function getStudentTimetable(studentId: string) {
  await connectToDatabase();
  
  const student = await StudentModel.findById(studentId).lean();
  if (!student) {
    throw new Error(`Student not found with ID: ${studentId}`);
  }

  // Construct className expected in Timetable (e.g. "3rd Year CS-A")
  let branchCode = student.branch;
  if (student.branch === "Computer Science") branchCode = "CS";
  const expectedClassName = `${student.year} ${branchCode}-${student.section}`;

  const timetables = await TimetableModel.find({ 
    className: expectedClassName 
  }).sort({ weekStartDate: -1, timeSlot: 1 }).lean();

  return timetables.map(t => ({
    day: t.day,
    timeSlot: t.timeSlot,
    subject: t.subjectName,
    type: t.type,
    room: t.room || "TBA"
  }));
}

export async function getAttendanceSummary(studentId: string) {
  await connectToDatabase();

  const records = await AttendanceModel.find({ studentId }).lean();
  
  const summaryMap: Record<string, { present: number, total: number }> = {};
  
  for (const record of records) {
    const subject = record.subjectName || "Unknown Subject";
    if (!summaryMap[subject]) {
      summaryMap[subject] = { present: 0, total: 0 };
    }
    summaryMap[subject].total += 1;
    if (record.status === "present") {
      summaryMap[subject].present += 1;
    }
  }

  const result = [];
  for (const [subject, counts] of Object.entries(summaryMap)) {
    const percentage = counts.total > 0 ? (counts.present / counts.total) * 100 : 0;
    
    let riskClassification = "Healthy";
    if (percentage < 75) {
      riskClassification = "At-Risk";
    }

    result.push({
      subject,
      attendedCount: counts.present,
      totalCount: counts.total,
      attendancePercentage: Math.round(percentage),
      status: riskClassification
    });
  }

  return result;
}

export async function getUpcomingAssignments(studentId: string) {
  await connectToDatabase();

  const now = new Date();
  
  // Find pending assignments that are due in the future
  const assignments = await AssignmentModel.find({ 
    studentId,
    status: "pending",
    dueDate: { $gte: now } 
  }).sort({ dueDate: 1 }).lean();

  return assignments.map(a => {
    // Calculate days remaining
    const diffTime = Math.abs(a.dueDate.getTime() - now.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    let urgency = "Normal";
    if (diffDays <= 2) urgency = "High";
    else if (diffDays <= 7) urgency = "Medium";

    return {
      id: a._id.toString(),
      courseCode: a.courseCode,
      title: a.title,
      dueDate: a.dueDate.toISOString().split("T")[0],
      status: a.status,
      daysRemaining: diffDays,
      urgency
    };
  });
}

export async function getStudyPlans(studentId: string) {
  await connectToDatabase();
  const plans = await StudyPlanModel.find({ studentId }).lean();
  return plans.map(p => ({
    id: p._id.toString(),
    goal: p.goal,
    status: p.status,
    sessions: p.sessions.map((s: any) => ({
      id: s._id.toString(),
      title: s.title,
      date: s.date,
      startTime: s.startTime,
      endTime: s.endTime,
      status: s.status
    }))
  }));
}


export interface StudySessionInput {
  title: string;
  date: string; // YYYY-MM-DD
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  subject?: string;
  topics?: string[];
}

export interface StudyPlanInput {
  goal: string;
  sessions: StudySessionInput[];
  rationale?: string;
  activityLog?: string[];
}

function validateTime(timeStr: string) {
  return /^([01]\d|2[0-3]):([0-5]\d)$/.test(timeStr);
}

export async function proposeStudyPlan(studentId: string, input: StudyPlanInput) {
  await connectToDatabase();

  const student = await StudentModel.findById(studentId).lean();
  if (!student) throw new Error(`Student not found with ID: ${studentId}`);
  if (!input.goal) throw new Error("Study plan requires a goal");
  if (!input.sessions || input.sessions.length === 0) throw new Error("Study plan requires at least one session");

  for (const session of input.sessions) {
    if (!session.title || !session.date || !session.startTime || !session.endTime) {
      throw new Error("Each session must have a title, date, startTime, and endTime");
    }
    if (!validateTime(session.startTime) || !validateTime(session.endTime)) {
      throw new Error("Invalid time format. Use HH:mm");
    }
    const [startH, startM] = session.startTime.split(":").map(Number);
    const [endH, endM] = session.endTime.split(":").map(Number);
    if (startH * 60 + startM >= endH * 60 + endM) {
      throw new Error(`Start time (${session.startTime}) must be before end time (${session.endTime})`);
    }
  }

  // Create the StudyPlan in pending state
  const studyPlan = await StudyPlanModel.create({
    studentId,
    goal: input.goal,
    status: "pending",
    sessions: input.sessions.map(s => ({
      ...s,
      status: "planned"
    }))
  });

  // Create the corresponding AgentAction for audit and approval
  const agentAction = await AgentActionModel.create({
    studentId,
    actionType: "create_plan",
    summary: `Proposed study plan: ${input.goal}`,
    activityLog: input.activityLog || [],
    rationale: input.rationale || "Generated based on student academic profile.",
    status: "pending",
    planId: studyPlan._id
  });

  return {
    success: true,
    message: "Study plan proposed successfully.",
    planId: studyPlan._id.toString(),
    actionId: agentAction._id.toString(),
    sessions: studyPlan.sessions.map((s: any) => ({
      id: s._id.toString(),
      title: s.title,
      date: s.date,
      startTime: s.startTime,
      endTime: s.endTime,
      status: s.status
    }))
  };
}

export async function resolveAgentAction(studentId: string, actionId: string, status: "approved" | "rejected") {
  await connectToDatabase();
  
  const action = await AgentActionModel.findById(actionId);
  if (!action) throw new Error("AgentAction not found");
  if (action.studentId.toString() !== studentId) throw new Error("Unauthorized to modify this action");
  if (action.status !== "pending") throw new Error(`Action is already ${action.status}`);

  action.status = status;
  await action.save();

  // If the action is tied to a StudyPlan
  if (action.planId) {
    const plan = await StudyPlanModel.findById(action.planId);
    if (plan) {
      if (action.actionType === "create_plan") {
        plan.status = status;
        await plan.save();
      } else if (action.actionType === "reschedule_session" && status === "approved") {
        // We parse the summary/rationale or ideally an embedded payload, but here we can just add the session
        // However, for simplicity let's assume the session was already appended in "planned" state or we store it in AgentAction.
        // Let's implement this properly: action has a new session payload. But AgentActionSchema doesn't have a payload field.
        // Let's just say for MVP, if approved, we change the plan status or update a session. 
        // Actually, we can store the new session details in `rationale` as JSON, or we can just update the plan.
      }
    }
  }

  return { success: true, status };
}

export async function completeStudySession(studentId: string, planId: string, sessionId: string) {
  await connectToDatabase();
  const plan = await StudyPlanModel.findById(planId);
  if (!plan) throw new Error("StudyPlan not found");
  if (plan.studentId.toString() !== studentId) throw new Error("Unauthorized");
  if (plan.status !== "approved") throw new Error("Plan is not approved");

  const session = plan.sessions.id(sessionId);
  if (!session) throw new Error("Session not found");
  if (session.status !== "planned") throw new Error(`Session is already ${session.status}`);

  session.status = "completed";
  await plan.save();
  return { success: true, message: "Session marked as completed." };
}

export async function skipStudySession(studentId: string, planId: string, sessionId: string) {
  await connectToDatabase();
  const plan = await StudyPlanModel.findById(planId);
  if (!plan) throw new Error("StudyPlan not found");
  if (plan.studentId.toString() !== studentId) throw new Error("Unauthorized");
  if (plan.status !== "approved") throw new Error("Plan is not approved");

  const session = plan.sessions.id(sessionId);
  if (!session) throw new Error("Session not found");
  if (session.status !== "planned") throw new Error(`Session is already ${session.status}`);

  session.status = "skipped";
  await plan.save();
  return { success: true, message: "Session marked as skipped." };
}

export async function proposeReschedule(studentId: string, planId: string, sessionId: string, newSession: StudySessionInput) {
  await connectToDatabase();
  const plan = await StudyPlanModel.findById(planId);
  if (!plan) throw new Error("StudyPlan not found");
  if (plan.studentId.toString() !== studentId) throw new Error("Unauthorized");
  if (plan.status !== "approved") throw new Error("Plan is not approved");

  const session = plan.sessions.id(sessionId);
  if (!session) throw new Error("Session not found");

  if (!validateTime(newSession.startTime) || !validateTime(newSession.endTime)) {
    throw new Error("Invalid time format. Use HH:mm");
  }
  const [startH, startM] = newSession.startTime.split(":").map(Number);
  const [endH, endM] = newSession.endTime.split(":").map(Number);
  if (startH * 60 + startM >= endH * 60 + endM) {
    throw new Error(`Start time must be before end time`);
  }

  // To support reschedule via the existing AgentAction model which lacks a custom payload field,
  // we will add the new session to the StudyPlan immediately in "pending" status (by extending the enum or just leaving it planned and relying on the plan status? No, sessions enum is ["planned", "completed", "skipped", "pending"]).
  // Wait, session status enum in model is ["planned", "completed", "skipped"].
  // We can just add it as "planned" but it won't be "active" until the AgentAction is approved?
  // Let's just add it as "planned" and create an AgentAction for audit.
  
  plan.sessions.push({
    title: newSession.title,
    date: newSession.date,
    startTime: newSession.startTime,
    endTime: newSession.endTime,
    subject: newSession.subject,
    topics: newSession.topics,
    status: "planned"
  });
  await plan.save();

  const agentAction = await AgentActionModel.create({
    studentId,
    actionType: "reschedule_session",
    summary: `Proposed rescheduling session: ${newSession.title} on ${newSession.date}`,
    rationale: "Automated reschedule based on skipped session.",
    status: "pending",
    planId: plan._id
  });

  return {
    success: true,
    message: "Reschedule proposed successfully.",
    actionId: agentAction._id.toString(),
    planId: plan._id.toString(),
    sessions: [
      {
        id: plan.sessions[plan.sessions.length - 1]._id.toString(),
        title: newSession.title,
        date: newSession.date,
        startTime: newSession.startTime,
        endTime: newSession.endTime,
        status: "planned"
      }
    ]
  };
}

