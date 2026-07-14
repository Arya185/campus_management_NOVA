import { StudentModel, TimetableModel, AttendanceModel, AssignmentModel } from './models';
import { connectToDatabase } from './db';

/**
 * Retrieves the current week's timetable for a given student.
 * 
 * @param identifier The student's string ID (e.g., "student1") or email.
 * @returns A concise array of schedule entries.
 */
export async function getStudentTimetable(identifier: string) {
  await connectToDatabase();
  const student = await StudentModel.findOne({
    $or: [{ studentId: identifier }, { email: identifier }]
  });
  if (!student) throw new Error("Student not found");
  
  // Format based on standard seed: e.g. "3rd Year CS-A"
  const branchShort = student.branch === "Computer Science" ? "CS" : student.branch;
  const className = `${student.year} ${branchShort}-${student.section}`;
  
  // Get current week's Monday to only return this week's schedule
  const today = new Date();
  const day = today.getDay();
  const diff = today.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(today.setDate(diff)).toISOString().split("T")[0];

  const timetable = await TimetableModel.find({ className, weekStartDate: monday }).lean();
  
  return timetable.map(entry => ({
    day: entry.day,
    timeSlot: entry.timeSlot,
    subject: entry.subjectName || entry.type,
    type: entry.type,
    room: entry.room || "TBA"
  }));
}

/**
 * Retrieves and aggregates the attendance summary for a given student.
 * 
 * @param identifier The student's string ID (e.g., "student1") or email.
 * @returns A concise array of attendance aggregates by subject with risk classification.
 */
export async function getAttendanceSummary(identifier: string) {
  await connectToDatabase();
  const student = await StudentModel.findOne({
    $or: [{ studentId: identifier }, { email: identifier }]
  });
  if (!student) throw new Error("Student not found");

  const records = await AttendanceModel.find({ studentId: student._id }).lean();
  
  const summary: Record<string, { attended: number; total: number }> = {};
  for (const record of records) {
    if (!summary[record.subjectName]) {
      summary[record.subjectName] = { attended: 0, total: 0 };
    }
    summary[record.subjectName].total++;
    if (record.status === 'present') {
      summary[record.subjectName].attended++;
    }
  }

  return Object.entries(summary).map(([subject, data]) => {
    const percentage = data.total > 0 ? Math.round((data.attended / data.total) * 100) : 0;
    let risk = "healthy";
    if (percentage < 75) risk = "at-risk";
    else if (percentage < 85) risk = "borderline";
    
    return {
      subject,
      attended: data.attended,
      total: data.total,
      percentage,
      risk
    };
  });
}

/**
 * Retrieves upcoming academic assignments for a given student.
 * 
 * @param identifier The student's string ID (e.g., "student1") or email.
 * @returns A concise array of upcoming assignments sorted by urgency.
 */
export async function getUpcomingAssignments(identifier: string) {
  await connectToDatabase();
  const student = await StudentModel.findOne({
    $or: [{ studentId: identifier }, { email: identifier }]
  });
  if (!student) throw new Error("Student not found");

  const now = new Date();
  const assignments = await AssignmentModel.find({ 
    studentId: student._id,
    dueDate: { $gte: now } 
  }).sort({ dueDate: 1 }).lean();

  return assignments.map(a => {
    const daysRemaining = Math.ceil((new Date(a.dueDate).getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    let urgency = "normal";
    if (daysRemaining <= 2) urgency = "high";
    else if (daysRemaining <= 7) urgency = "medium";

    return {
      assignmentId: a._id.toString(),
      course: a.courseCode,
      title: a.title,
      dueDate: new Date(a.dueDate).toISOString().split('T')[0],
      status: a.status,
      daysRemaining,
      urgency
    };
  });
}
