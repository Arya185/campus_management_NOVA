import { connectToDatabase } from "./db";
import { StudentModel, TeacherModel, AttendanceModel, ExamResultModel, AssignmentModel } from "./models";

export async function getInstitutionAnalytics() {
  await connectToDatabase();

  // Student statistics
  const totalStudents = await StudentModel.countDocuments();
  const studentsByBranch = await StudentModel.aggregate([
    {
      $group: {
        _id: "$branch",
        count: { $sum: 1 }
      }
    }
  ]);
  const studentsByYear = await StudentModel.aggregate([
    {
      $group: {
        _id: "$year",
        count: { $sum: 1 }
      }
    }
  ]);

  // Teacher statistics
  const totalTeachers = await TeacherModel.countDocuments();
  const teachersByBranch = await TeacherModel.aggregate([
    {
      $group: {
        _id: "$branch",
        count: { $sum: 1 }
      }
    }
  ]);

  // Overall attendance
  const totalAttendance = await AttendanceModel.countDocuments();
  const presentAttendance = await AttendanceModel.countDocuments({ status: "present" });
  const overallAttendanceRate = totalAttendance > 0 ? (presentAttendance / totalAttendance) * 100 : 0;

  // Overall performance
  const examResults = await ExamResultModel.find().lean();
  const averageGPA = examResults.length > 0 
    ? examResults.reduce((sum: number, r: any) => sum + (r.gpa || 0), 0) / examResults.length 
    : 0;

  // Assignment statistics
  const totalAssignments = await AssignmentModel.countDocuments();
  const submittedAssignments = await AssignmentModel.countDocuments({ status: "submitted" });
  const assignmentCompletionRate = totalAssignments > 0 ? (submittedAssignments / totalAssignments) * 100 : 0;

  return {
    students: {
      total: totalStudents,
      byBranch: studentsByBranch.map((s: any) => ({ branch: s._id, count: s.count })),
      byYear: studentsByYear.map((s: any) => ({ year: s._id, count: s.count }))
    },
    teachers: {
      total: totalTeachers,
      byBranch: teachersByBranch.map((t: any) => ({ branch: t._id, count: t.count }))
    },
    attendance: {
      totalRecords: totalAttendance,
      present: presentAttendance,
      rate: overallAttendanceRate
    },
    performance: {
      averageGPA,
      totalExams: examResults.length
    },
    assignments: {
      total: totalAssignments,
      submitted: submittedAssignments,
      completionRate: assignmentCompletionRate
    }
  };
}

export async function getInstitutionTrends(months: number = 12) {
  await connectToDatabase();

  const startDate = new Date();
  startDate.setMonth(startDate.getMonth() - months);

  // Monthly student enrollment trend
  const monthlyEnrollment = await StudentModel.aggregate([
    {
      $match: {
        createdAt: { $gte: startDate }
      }
    },
    {
      $group: {
        _id: {
          year: { $year: "$createdAt" },
          month: { $month: "$createdAt" }
        },
        count: { $sum: 1 }
      }
    },
    {
      $sort: { "_id.year": 1, "_id.month": 1 }
    }
  ]);

  // Monthly attendance trend
  const monthlyAttendance = await AttendanceModel.aggregate([
    {
      $match: {
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
    monthlyEnrollment: monthlyEnrollment.map((m: any) => ({
      month: `${m._id.year}-${String(m._id.month).padStart(2, '0')}`,
      newStudents: m.count
    })),
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

export async function getBranchAnalytics(branch: string) {
  await connectToDatabase();

  const students = await StudentModel.find({ branch }).lean();
  const teachers = await TeacherModel.find({ branch }).lean();
  const studentIds = students.map((s: any) => s._id);

  // Branch attendance
  const attendanceRecords = await AttendanceModel.find({
    studentId: { $in: studentIds }
  }).lean();

  const attendanceStats = {
    totalRecords: attendanceRecords.length,
    present: attendanceRecords.filter((a: any) => a.status === "present").length,
    rate: attendanceRecords.length > 0 
      ? (attendanceRecords.filter((a: any) => a.status === "present").length / attendanceRecords.length) * 100 
      : 0
  };

  // Branch performance
  const examResults = await ExamResultModel.find({
    studentId: { $in: studentIds }
  }).lean();

  const performanceStats = {
    averageGPA: examResults.length > 0 
      ? examResults.reduce((sum: number, r: any) => sum + (r.gpa || 0), 0) / examResults.length 
      : 0,
    totalExams: examResults.length
  };

  return {
    branch,
    studentCount: students.length,
    teacherCount: teachers.length,
    attendance: attendanceStats,
    performance: performanceStats
  };
}
