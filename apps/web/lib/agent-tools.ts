import mongoose from "mongoose";
import { connectToDatabase } from "./db";
import { StudentModel, TimetableModel, AttendanceModel, AssignmentModel } from "./models";

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
