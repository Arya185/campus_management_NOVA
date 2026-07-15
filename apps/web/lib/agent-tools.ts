import mongoose from "mongoose";
import { connectToDatabase } from "./db";
import {
  StudentModel,
  TimetableModel,
  AttendanceModel,
  AssignmentModel,
  StudyPlanModel,
  AgentActionModel,
  AgentAuditLogModel,
  CareerRoadmapModel,
  ResearchNoteModel,
  ProjectModel,
  ExamResultModel,
} from "./models";

export async function getStudentTimetable(studentId: string) {
  await connectToDatabase();

  const student = (await StudentModel.findById(studentId).lean()) as any;
  if (!student) {
    throw new Error(`Student not found with ID: ${studentId}`);
  }

  // Construct className expected in Timetable (e.g. "3rd Year CS-A")
  let branchCode = student.branch;
  if (student.branch === "Computer Science") branchCode = "CS";
  const expectedClassName = `${student.year} ${branchCode}-${student.section}`;

  const timetables = await TimetableModel.find({
    className: expectedClassName,
  })
    .sort({ weekStartDate: -1, timeSlot: 1 })
    .lean();

  return timetables.map((t) => ({
    day: t.day,
    timeSlot: t.timeSlot,
    subject: t.subjectName,
    type: t.type,
    room: t.room || "TBA",
  }));
}

export async function getAttendanceSummary(studentId: string) {
  await connectToDatabase();

  const records = await AttendanceModel.find({ studentId }).lean();

  const summaryMap: Record<string, { present: number; total: number }> = {};

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
    const percentage =
      counts.total > 0 ? (counts.present / counts.total) * 100 : 0;

    let riskClassification = "Healthy";
    if (percentage < 75) {
      riskClassification = "At-Risk";
    }

    result.push({
      subject,
      attendedCount: counts.present,
      totalCount: counts.total,
      attendancePercentage: Math.round(percentage),
      status: riskClassification,
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
    dueDate: { $gte: now },
  })
    .sort({ dueDate: 1 })
    .lean();

  return assignments.map((a) => {
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
      urgency,
    };
  });
}

export async function getStudyPlans(studentId: string) {
  await connectToDatabase();
  const plans = await StudyPlanModel.find({ studentId }).lean();
  return plans.map((p) => ({
    id: p._id.toString(),
    goal: p.goal,
    status: p.status,
    sessions: p.sessions.map((s: any) => ({
      id: s._id.toString(),
      title: s.title,
      date: s.date,
      startTime: s.startTime,
      endTime: s.endTime,
      status: s.status,
    })),
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

export async function proposeStudyPlan(
  studentId: string,
  input: StudyPlanInput,
) {
  await connectToDatabase();

  const student = (await StudentModel.findById(studentId).lean()) as any;
  if (!student) throw new Error(`Student not found with ID: ${studentId}`);
  if (!input.goal) throw new Error("Study plan requires a goal");
  if (!input.sessions || input.sessions.length === 0)
    throw new Error("Study plan requires at least one session");

  for (const session of input.sessions) {
    if (
      !session.title ||
      !session.date ||
      !session.startTime ||
      !session.endTime
    ) {
      throw new Error(
        "Each session must have a title, date, startTime, and endTime",
      );
    }
    if (!validateTime(session.startTime) || !validateTime(session.endTime)) {
      throw new Error("Invalid time format. Use HH:mm");
    }
    const [startH, startM] = session.startTime.split(":").map(Number);
    const [endH, endM] = session.endTime.split(":").map(Number);
    if (startH * 60 + startM >= endH * 60 + endM) {
      throw new Error(
        `Start time (${session.startTime}) must be before end time (${session.endTime})`,
      );
    }
  }

  // Create the StudyPlan in pending state
  const studyPlan = await StudyPlanModel.create({
    studentId,
    goal: input.goal,
    status: "pending",
    sessions: input.sessions.map((s) => ({
      ...s,
      status: "planned",
    })),
  });

  // Create the corresponding AgentAction for audit and approval
  const agentAction = await AgentActionModel.create({
    studentId,
    actionType: "create_plan",
    summary: `Proposed study plan: ${input.goal}`,
    activityLog: input.activityLog || [],
    rationale:
      input.rationale || "Generated based on student academic profile.",
    status: "pending",
    planId: studyPlan._id,
  });

  // Unified audit log entry (pending)
  await AgentAuditLogModel.create({
    agentType: "academic",
    actorId: studentId,
    actorRole: "student",
    summary: `Proposed study plan: ${input.goal}`,
    status: "pending",
    payload: {
      actionId: agentAction._id.toString(),
      planId: studyPlan._id.toString(),
    },
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
      status: s.status,
    })),
  };
}

export async function resolveAgentAction(
  studentId: string,
  actionId: string,
  status: "approved" | "rejected",
) {
  await connectToDatabase();

  const action = await AgentActionModel.findById(actionId);
  if (!action) throw new Error("AgentAction not found");
  if (action.studentId.toString() !== studentId)
    throw new Error("Unauthorized to modify this action");
  if (action.status !== "pending")
    throw new Error(`Action is already ${action.status}`);

  action.status = status;
  await action.save();

  // Unified audit log entry (approval decision)
  await AgentAuditLogModel.create({
    agentType: "academic",
    actorId: studentId,
    actorRole: "student",
    summary: `Academic agent action ${action.actionType} ${status}`,
    status: status === "approved" ? "approved" : "rejected",
    payload: {
      actionId: action._id.toString(),
      planId: action.planId ? action.planId.toString() : null,
      actionType: action.actionType,
    },
  });

  // If the action is tied to a StudyPlan
  if (action.planId) {
    const plan = await StudyPlanModel.findById(action.planId);
    if (plan) {
      if (action.actionType === "create_plan") {
        plan.status = status;
        await plan.save();
      } else if (action.actionType === "reschedule_session") {
        if (status === "approved" && action.payload) {
          try {
            const newSession =
              typeof action.payload === "string"
                ? JSON.parse(action.payload)
                : action.payload;
            plan.sessions.push({
              title: newSession.title,
              date: newSession.date,
              startTime: newSession.startTime,
              endTime: newSession.endTime,
              subject: newSession.subject,
              topics: newSession.topics,
              status: "planned",
            });
            await plan.save();
          } catch (e) {
            console.error("Failed to parse reschedule session payload", e);
          }
        }
      }
    }
  }

  return { success: true, status };
}

export async function completeStudySession(
  studentId: string,
  planId: string,
  sessionId: string,
) {
  await connectToDatabase();
  const plan = await StudyPlanModel.findById(planId);
  if (!plan) throw new Error("StudyPlan not found");
  if (plan.studentId.toString() !== studentId) throw new Error("Unauthorized");
  if (plan.status !== "approved") throw new Error("Plan is not approved");

  const session = plan.sessions.id(sessionId);
  if (!session) throw new Error("Session not found");
  if (session.status !== "planned")
    throw new Error(`Session is already ${session.status}`);

  session.status = "completed";
  await plan.save();

  await AgentAuditLogModel.create({
    agentType: "academic",
    actorId: studentId,
    actorRole: "student",
    summary: `Study session completed: ${session.title}`,
    status: "completed",
    payload: {
      planId: plan._id.toString(),
      sessionId: sessionId,
      title: session.title,
    },
  });

  return { success: true, message: "Session marked as completed." };
}

export async function skipStudySession(
  studentId: string,
  planId: string,
  sessionId: string,
) {
  await connectToDatabase();
  const plan = await StudyPlanModel.findById(planId);
  if (!plan) throw new Error("StudyPlan not found");
  if (plan.studentId.toString() !== studentId) throw new Error("Unauthorized");
  if (plan.status !== "approved") throw new Error("Plan is not approved");

  const session = plan.sessions.id(sessionId);
  if (!session) throw new Error("Session not found");
  if (session.status !== "planned")
    throw new Error(`Session is already ${session.status}`);

  session.status = "skipped";
  await plan.save();

  await AgentAuditLogModel.create({
    agentType: "academic",
    actorId: studentId,
    actorRole: "student",
    summary: `Study session skipped: ${session.title}`,
    status: "completed",
    payload: {
      planId: plan._id.toString(),
      sessionId: sessionId,
      title: session.title,
    },
  });

  await AgentAuditLogModel.create({
    agentType: "academic",
    actorId: studentId,
    actorRole: "student",
    summary: `Study session skipped: ${session.title}`,
    status: "completed",
    payload: {
      planId: plan._id.toString(),
      sessionId: sessionId,
      title: session.title,
    },
  });

  return { success: true, message: "Session marked as skipped." };
}

export async function proposeReschedule(
  studentId: string,
  planId: string,
  sessionId: string,
  newSession: StudySessionInput,
) {
  await connectToDatabase();
  const plan = await StudyPlanModel.findById(planId);
  if (!plan) throw new Error("StudyPlan not found");
  if (plan.studentId.toString() !== studentId) throw new Error("Unauthorized");
  if (plan.status !== "approved") throw new Error("Plan is not approved");

  const session = plan.sessions.id(sessionId);
  if (!session) throw new Error("Session not found");

  if (
    !validateTime(newSession.startTime) ||
    !validateTime(newSession.endTime)
  ) {
    throw new Error("Invalid time format. Use HH:mm");
  }
  const [startH, startM] = newSession.startTime.split(":").map(Number);
  const [endH, endM] = newSession.endTime.split(":").map(Number);
  if (startH * 60 + startM >= endH * 60 + endM) {
    throw new Error(`Start time must be before end time`);
  }

  const agentAction = await AgentActionModel.create({
    studentId,
    actionType: "reschedule_session",
    summary: `Proposed rescheduling session: ${newSession.title} on ${newSession.date}`,
    rationale: "Automated reschedule based on skipped session.",
    payload: newSession,
    status: "pending",
    planId: plan._id,
  });

  await AgentAuditLogModel.create({
    agentType: "academic",
    actorId: studentId,
    actorRole: "student",
    summary: `Proposed reschedule: ${newSession.title} on ${newSession.date}`,
    status: "pending",
    payload: {
      actionId: agentAction._id.toString(),
      planId: plan._id.toString(),
      originalSessionId: sessionId,
    },
  });

  return {
    success: true,
    message: "Reschedule proposed successfully.",
    actionId: agentAction._id.toString(),
    planId: plan._id.toString(),
    sessions: [
      {
        id: "pending-" + Date.now(),
        title: newSession.title,
        date: newSession.date,
        startTime: newSession.startTime,
        endTime: newSession.endTime,
        status: "planned",
      },
    ],
  };
}

// ── Career Roadmap Agent Tools ─────────────────────────────────────────────────────

export async function getStudentProfile(studentId: string) {
  await connectToDatabase();
  const student = (await StudentModel.findById(studentId).lean()) as any;
  if (!student) throw new Error(`Student not found with ID: ${studentId}`);
  return {
    name: student.name,
    branch: student.branch,
    year: student.year,
    skills: student.skills || [],
    interests: student.interests || []
  };
}

export async function getAcademicHistory(studentId: string) {
  await connectToDatabase();
  const examResults = await ExamResultModel.find({ studentId }).lean();
  return examResults.map((r: any) => ({
    courseCode: r.courseCode,
    courseName: r.courseName,
    grade: r.grade,
    gpa: r.gpa
  }));
}

export async function getCareerMemory(studentId: string) {
  await connectToDatabase();
  const roadmaps = await CareerRoadmapModel.find({ studentId }).lean();
  return roadmaps.map((r: any) => ({
    id: r._id.toString(),
    targetRole: r.targetRole,
    status: r.status,
    milestones: r.milestones
  }));
}

export async function proposeCareerRoadmap(studentId: string, input: any) {
  await connectToDatabase();
  const roadmap = await CareerRoadmapModel.create({
    studentId,
    targetRole: input.targetRole,
    milestones: input.milestones,
    rationale: input.rationale,
    status: "pending"
  });
  return {
    success: true,
    roadmapId: roadmap._id.toString()
  };
}

export async function getCareerRoadmaps(studentId: string) {
  await connectToDatabase();
  const roadmaps = await CareerRoadmapModel.find({ studentId }).lean();
  return roadmaps.map((r: any) => ({
    id: r._id.toString(),
    targetRole: r.targetRole,
    status: r.status,
    milestones: r.milestones
  }));
}

// ── Research Assistant Tools ─────────────────────────────────────────────────────

export async function getResearchSources(topic: string) {
  // Mock research sources - in production, this would call a real research API
  return {
    sources: [
      { title: `"${topic}" - Academic Overview`, url: "https://scholar.google.com", summary: "Academic research overview" },
      { title: `"${topic}" - Recent Papers`, url: "https://arxiv.org", summary: "Recent research papers" }
    ]
  };
}

export async function saveResearchNote(studentId: string, input: any) {
  await connectToDatabase();
  const note = await ResearchNoteModel.create({
    studentId,
    topic: input.topic,
    content: input.content,
    sources: input.sources || [],
    tags: input.tags || []
  });
  return {
    success: true,
    noteId: note._id.toString()
  };
}

export async function getResearchNotes(studentId: string, topic?: string) {
  await connectToDatabase();
  const query: any = { studentId };
  if (topic) query.topic = topic;
  const notes = await ResearchNoteModel.find(query).lean();
  return notes.map((n: any) => ({
    id: n._id.toString(),
    topic: n.topic,
    content: n.content,
    sources: n.sources,
    tags: n.tags
  }));
}

// ── Project Mentor Agent Tools ─────────────────────────────────────────────────────

export async function getProjects(studentId: string) {
  await connectToDatabase();
  const projects = await ProjectModel.find({ studentId }).lean();
  return projects.map((p: any) => ({
    id: p._id.toString(),
    title: p.title,
    description: p.description,
    domain: p.domain,
    status: p.status,
    technologies: p.technologies,
    milestones: p.milestones
  }));
}

export async function createProject(studentId: string, input: any) {
  await connectToDatabase();
  const project = await ProjectModel.create({
    studentId,
    title: input.title,
    description: input.description,
    domain: input.domain,
    technologies: input.technologies || [],
    milestones: input.milestones || [],
    status: "planning"
  });
  return {
    success: true,
    projectId: project._id.toString()
  };
}

export async function updateProjectMilestone(studentId: string, projectId: string, milestoneIndex: number, status: "in_progress" | "done") {
  await connectToDatabase();
  const project = await ProjectModel.findOne({ _id: projectId, studentId });
  if (!project) throw new Error("Project not found");
  if (milestoneIndex < 0 || milestoneIndex >= project.milestones.length) {
    throw new Error("Invalid milestone index");
  }
  project.milestones[milestoneIndex].status = status;
  await project.save();
  return {
    success: true,
    message: "Milestone updated successfully."
  };
}
