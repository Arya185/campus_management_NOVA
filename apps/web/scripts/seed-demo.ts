import { loadEnvConfig } from "@next/env";
import path from "path";

// Load environment variables securely
const projectDir = path.resolve(process.cwd());
loadEnvConfig(projectDir);

import mongoose from "mongoose";
import { connectToDatabase } from "../lib/db";
import {
  StudentModel,
  TeacherModel,
  ClassroomModel,
  TimetableModel,
  AttendanceModel,
  AssignmentModel,
} from "../lib/models";

async function runSeed() {
  try {
    await connectToDatabase();
    console.log("Database connection successful.");

    // Demo identities
    const studentEmail = "rahul.sharma@student.edu";
    const teacherEmail = "jane.doe@teacher.edu";

    // Upsert Teacher
    let teacher = await TeacherModel.findOne({ email: teacherEmail });
    if (!teacher) {
      teacher = await TeacherModel.create({
        firstName: "Jane",
        lastName: "Doe",
        email: teacherEmail,
        password: "Password@123",
        phone: "1234567890",
        gender: "female",
        dateOfBirth: "1980-01-01",
        address: "123 Campus Dr",
        employeeId: "teacher1",
        department: "Computer Science",
        designation: "Professor",
        qualification: "Ph.D.",
        experience: "10 years",
        subjects: ["Data Structures", "Database Systems"],
        joiningDate: "2015-01-01",
        emergencyContactName: "John Doe",
        emergencyContactPhone: "0987654321",
        emergencyContactRelation: "Spouse",
        avatarInitials: "JD"
      });
    }

    // Upsert Student
    let student = await StudentModel.findOne({ email: studentEmail });
    if (!student) {
      student = await StudentModel.create({
        firstName: "Rahul",
        lastName: "Sharma",
        email: studentEmail,
        password: "Password@123",
        phone: "9876543210",
        gender: "male",
        dateOfBirth: "2002-05-15",
        address: "Hostel A, Room 101",
        studentId: "student1",
        course: "B.Tech",
        branch: "Computer Science",
        year: "3rd Year",
        semester: "6th Sem",
        rollNumber: "CS2026-101",
        section: "A",
        emergencyContactName: "Ramesh Sharma",
        emergencyContactPhone: "9988776655",
        emergencyContactRelation: "Father",
        parentGuardianName: "Ramesh Sharma",
        parentGuardianPhone: "9988776655",
        avatarInitials: "RS"
      });
    }

    // Classrooms
    const classes = [
      { id: "CS301", name: "Data Structures" },
      { id: "CS305", name: "Database Systems" }
    ];
    const classroomDocs = [];
    for (const cls of classes) {
      let c = await ClassroomModel.findOne({ classroomId: cls.id });
      if (!c) {
        c = await ClassroomModel.create({
          classroomId: cls.id,
          inviteCode: cls.id,
          title: cls.name,
          subject: cls.name,
          description: cls.name + " Course",
          teacherId: teacher._id,
          teacherName: "Jane Doe",
          teacherEmail: teacherEmail,
          maxStudents: 60,
        });
      }
      classroomDocs.push(c);
    }

    // Timetable
    const today = new Date();
    const day = today.getDay();
    const diff = today.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(today.setDate(diff));
    const mondayStr = monday.toISOString().split("T")[0];

    await TimetableModel.deleteMany({ weekStartDate: mondayStr });
    const timetableEntries = [
      { teacherId: teacher._id, classroomId: classroomDocs[0]._id, weekStartDate: mondayStr, day: "Monday", timeSlot: "09:00-10:00", type: "class", subjectName: "Data Structures", className: "3rd Year CS-A" },
      { teacherId: teacher._id, classroomId: classroomDocs[1]._id, weekStartDate: mondayStr, day: "Tuesday", timeSlot: "11:00-12:00", type: "class", subjectName: "Database Systems", className: "3rd Year CS-A" },
      { teacherId: teacher._id, classroomId: classroomDocs[0]._id, weekStartDate: mondayStr, day: "Wednesday", timeSlot: "09:00-10:00", type: "class", subjectName: "Data Structures", className: "3rd Year CS-A" },
    ];
    await TimetableModel.insertMany(timetableEntries);

    // Attendance - delete old first
    await AttendanceModel.deleteMany({ studentId: student._id });
    
    // Healthy subject
    for (let i = 0; i < 5; i++) {
      await AttendanceModel.create({
        teacherId: teacher._id,
        studentId: student._id,
        className: "3rd Year CS-A",
        subjectName: "Database Systems",
        date: new Date(Date.now() - i * 86400000).toISOString().split('T')[0],
        status: "present"
      });
    }

    // Weak/risk subject
    for (let i = 0; i < 5; i++) {
      await AttendanceModel.create({
        teacherId: teacher._id,
        studentId: student._id,
        className: "3rd Year CS-A",
        subjectName: "Data Structures",
        date: new Date(Date.now() - i * 86400000).toISOString().split('T')[0],
        status: i < 3 ? "absent" : "present" // 40% attendance
      });
    }

    // Assignments
    await AssignmentModel.deleteMany({ studentId: student._id });
    const urgent = new Date(); urgent.setDate(urgent.getDate() + 1);
    const medium = new Date(); medium.setDate(medium.getDate() + 7);
    const later = new Date(); later.setDate(later.getDate() + 14);

    await AssignmentModel.create([
      { studentId: student._id, courseCode: "CS301", title: "Urgent Data Structures Lab", dueDate: urgent, status: "pending" },
      { studentId: student._id, courseCode: "CS305", title: "Mid-term DB Assignment", dueDate: medium, status: "pending" },
      { studentId: student._id, courseCode: "CS301", title: "Final DS Project", dueDate: later, status: "pending" }
    ]);

    // Verify
    const counts = {
      student: await StudentModel.countDocuments({ _id: student._id }),
      timetable: await TimetableModel.countDocuments({ weekStartDate: mondayStr }),
      attendance: await AttendanceModel.countDocuments({ studentId: student._id }),
      assignments: await AssignmentModel.countDocuments({ studentId: student._id })
    };
    
    console.log(`Demo seed completed. Student: ${studentEmail}`);
    console.log(`Verification counts: Student(${counts.student}), Timetable(${counts.timetable}), Attendance(${counts.attendance}), Assignments(${counts.assignments})`);
    
    process.exit(0);
  } catch (error: any) {
    console.error("Seed execution failed.");
    let category = "UnknownError";
    let detail = "";

    if (error?.name === "MongoServerError" || error?.name === "MongooseError") {
      category = "Database operation failure";
      const errMsg = error.message || "";
      if (errMsg.includes("ENOTFOUND") || errMsg.includes("ECONNREFUSED") || errMsg.includes("ETIMEOUT")) {
        category = "DNS/network connectivity";
        detail = "Could not resolve or connect to the database host.";
      } else if (errMsg.includes("Authentication failed") || error.code === 8000) {
        category = "Authentication failure";
        detail = "Invalid database credentials.";
      } else if (errMsg.includes("not authorized") || error.code === 13) {
        category = "Authorization failure";
        detail = "User lacks permission for this operation.";
      } else if (error.code === 11000) {
        category = "Duplicate key conflict";
        detail = "A record with this unique identifier already exists.";
      }
    } else if (error?.name === "ValidationError") {
      category = "Schema validation failure";
      detail = "The seeded data does not match the Mongoose schema requirements.";
    }

    console.error(`Error category: ${category}`);
    if (detail) console.error(`Sanitized detail: ${detail}`);
    process.exit(1);
  }
}

runSeed();
