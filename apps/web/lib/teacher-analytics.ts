import { connectToDatabase } from "./db";
import { StudentModel, AttendanceModel, ExamResultModel, AssignmentModel, TeacherModel } from "./models";

export async function getTeacherAnalytics(teacherId: string) {
  await connectToDatabase();

  const teacher = (await TeacherModel.findById(teacherId).lean()) as any;
  if (!teacher) throw new Error(`Teacher not found with ID: ${teacherId}`);

  const students = await StudentModel.find({ branch: teacher.branch, year: teacher.year }).lean();
  const studentIds = students.map((s: any) => s._id);

  // Attendance analytics
  const attendanceRecords = await AttendanceModel.find({
    studentId: { $in: studentIds }
  }).lean();

  const attendanceStats = {
    totalRecords: attendanceRecords.length,
    present: attendanceRecords.filter((a: any) => a.status === "present").length,
    absent: attendanceRecords.filter((a: any) => a.status === "absent").length,
    averageAttendance: attendanceRecords.length > 0 
      ? (attendanceRecords.filter((a: any) => a.status === "present").length / attendanceRecords.length) * 100 
      : 0
  };

  // Performance analytics
  const examResults = await ExamResultModel.find({
    studentId: { $in: studentIds }
  }).lean();

  const performanceStats = {
    totalExams: examResults.length,
    averageGPA: examResults.length > 0 
      ? examResults.reduce((sum: number, r: any) => sum + (r.gpa || 0), 0) / examResults.length 
      : 0,
    gradeDistribution: examResults.reduce((dist: any, r: any) => {
      const grade = r.grade || "N/A";
      dist[grade] = (dist[grade] || 0) + 1;
      return dist;
    }, {})
  };

  // Assignment analytics
  const assignments = await AssignmentModel.find({
    studentId: { $in: studentIds }
  }).lean();

  const assignmentStats = {
    totalAssignments: assignments.length,
    submitted: assignments.filter((a: any) => a.status === "submitted").length,
    pending: assignments.filter((a: any) => a.status === "pending").length,
    averageScore: assignments.length > 0 && assignments.some((a: any) => a.marks !== undefined)
      ? assignments.reduce((sum: number, a: any) => sum + (a.marks || 0), 0) / assignments.length
      : null
  };

  // Student count by branch/year
  const studentCount = students.length;

  return {
    teacherId: teacher._id.toString(),
    teacherName: teacher.name,
    branch: teacher.branch,
    year: teacher.year,
    studentCount,
    attendance: attendanceStats,
    performance: performanceStats,
    assignments: assignmentStats
  };
}

export async function getTeacherTrends(teacherId: string, months: number = 6) {
  await connectToDatabase();

  const teacher = (await TeacherModel.findById(teacherId).lean()) as any;
  if (!teacher) throw new Error(`Teacher not found with ID: ${teacherId}`);

  const students = await StudentModel.find({ branch: teacher.branch, year: teacher.year }).lean();
  const studentIds = students.map((s: any) => s._id);

  const startDate = new Date();
  startDate.setMonth(startDate.getMonth() - months);

  // Monthly attendance trend
  const monthlyAttendance = await AttendanceModel.aggregate([
    {
      $match: {
        studentId: { $in: studentIds },
        date: { $gte: startDate }
      }
    },
    {
      $group: {
        _id: {
          year: { $year: "$date" },
          month: { $month: "$date" }
        },
        total: { $sum: 1 },
        present: {
          $sum: { $cond: [{ $eq: ["$status", "present"] }, 1, 0] }
        }
      }
    },
    {
      $sort: { "_id.year": 1, "_id.month": 1 }
    }
  ]);

  // Monthly performance trend
  const monthlyPerformance = await ExamResultModel.aggregate([
    {
      $match: {
        studentId: { $in: studentIds },
        resultDate: { $gte: startDate }
      }
    },
    {
      $group: {
        _id: {
          year: { $year: "$resultDate" },
          month: { $month: "$resultDate" }
        },
        averageGPA: { $avg: "$gpa" },
        count: { $sum: 1 }
      }
    },
    {
      $sort: { "_id.year": 1, "_id.month": 1 }
    }
  ]);

  return {
    monthlyAttendance: monthlyAttendance.map((m: any) => ({
      month: `${m._id.year}-${String(m._id.month).padStart(2, '0')}`,
      attendanceRate: m.total > 0 ? (m.present / m.total) * 100 : 0
    })),
    monthlyPerformance: monthlyPerformance.map((m: any) => ({
      month: `${m._id.year}-${String(m._id.month).padStart(2, '0')}`,
      averageGPA: m.averageGPA,
      examCount: m.count
    }))
  };
}
