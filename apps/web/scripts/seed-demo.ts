import mongoose from "mongoose";
import { loadEnvConfig } from "@next/env";
import path from "path";

// Load environment variables securely using Next.js built-in env loader
const projectDir = process.cwd();
loadEnvConfig(projectDir);

import {
  StudentModel,
  TeacherModel,
  ClassroomModel,
  TimetableModel,
  AttendanceModel,
  AssignmentModel,
  StudyPlanModel,
  AgentActionModel
} from "../lib/models";

async function seed() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error("SEED_ERROR: MONGODB_URI is not set in the environment.");
    process.exit(1);
  }

  try {
    const dbName = process.env.MONGODB_DB_NAME || "arc-demo";
    console.log(`[SEED] Connecting to database...`);
    await mongoose.connect(uri, { dbName, serverSelectionTimeoutMS: 5000 });
    console.log("[SEED] Connection established.");

    const studentEmail = "rahul.sharma@student.edu";
    const teacherEmail = "jane.doe@teacher.edu";

    console.log("[SEED] Upserting Teacher Demo Identity...");
    const teacher = await TeacherModel.findOneAndUpdate(
      { email: teacherEmail },
      {
        firstName: "Jane",
        lastName: "Doe",
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
      },
      { upsert: true, new: true }
    );

    console.log("[SEED] Upserting Student Demo Identity...");
    const student = await StudentModel.findOneAndUpdate(
      { email: studentEmail },
      {
        firstName: "Rahul",
        lastName: "Sharma",
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
      },
      { upsert: true, new: true }
    );

    console.log("[SEED] Setting up demo classrooms...");
    const dsClass = await ClassroomModel.findOneAndUpdate(
      { classroomId: "CS301" },
      {
        inviteCode: "DS301",
        title: "Data Structures",
        subject: "Data Structures",
        description: "Advanced Data Structures",
        teacherId: teacher._id,
        teacherName: "Jane Doe",
        teacherEmail: teacherEmail,
        maxStudents: 60,
      },
      { upsert: true, new: true }
    );

    const dbClass = await ClassroomModel.findOneAndUpdate(
      { classroomId: "CS305" },
      {
        inviteCode: "DB305",
        title: "Database Systems",
        subject: "Database Systems",
        description: "Relational Databases",
        teacherId: teacher._id,
        teacherName: "Jane Doe",
        teacherEmail: teacherEmail,
        maxStudents: 60,
      },
      { upsert: true, new: true }
    );

    const cnClass = await ClassroomModel.findOneAndUpdate(
      { classroomId: "CS308" },
      {
        inviteCode: "CN308",
        title: "Computer Networks",
        subject: "Computer Networks",
        description: "Networking Protocols",
        teacherId: teacher._id,
        teacherName: "Jane Doe",
        teacherEmail: teacherEmail,
        maxStudents: 60,
      },
      { upsert: true, new: true }
    );

    // Get current Monday
    const today = new Date();
    const day = today.getDay();
    const diff = today.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(today.setDate(diff));
    const mondayStr = monday.toISOString().split("T")[0];

    console.log("[SEED] Purging old timetable records for demo student...");
    await TimetableModel.deleteMany({ weekStartDate: mondayStr, teacherId: teacher._id });

    console.log("[SEED] Inserting new timetable records...");
    await TimetableModel.create([
      { teacherId: teacher._id, classroomId: dsClass._id, weekStartDate: mondayStr, day: "Monday", timeSlot: "09:00-10:00", type: "class", subjectName: "Data Structures", className: "3rd Year CS-A" },
      { teacherId: teacher._id, classroomId: dbClass._id, weekStartDate: mondayStr, day: "Tuesday", timeSlot: "11:00-12:00", type: "class", subjectName: "Database Systems", className: "3rd Year CS-A" },
      { teacherId: teacher._id, classroomId: cnClass._id, weekStartDate: mondayStr, day: "Wednesday", timeSlot: "10:00-11:00", type: "class", subjectName: "Computer Networks", className: "3rd Year CS-A" },
      { teacherId: teacher._id, classroomId: dsClass._id, weekStartDate: mondayStr, day: "Thursday", timeSlot: "09:00-10:00", type: "class", subjectName: "Data Structures", className: "3rd Year CS-A" },
      { teacherId: teacher._id, classroomId: dbClass._id, weekStartDate: mondayStr, day: "Friday", timeSlot: "11:00-12:00", type: "class", subjectName: "Database Systems", className: "3rd Year CS-A" },
    ]);

    console.log("[SEED] Purging old attendance records for demo student...");
    await AttendanceModel.deleteMany({ studentId: student._id });

    console.log("[SEED] Inserting realistic attendance records...");
    const dates = [];
    for(let i=0; i<10; i++) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        dates.push(d.toISOString().split("T")[0]);
    }

    for (const date of dates) {
      // Data Structures - Weak / Risk subject (30% attendance)
      await AttendanceModel.create({
        teacherId: teacher._id,
        studentId: student._id,
        className: "3rd Year CS-A",
        subjectName: "Data Structures",
        date: date,
        status: Math.random() > 0.7 ? "present" : "absent"
      });
      // Database Systems - Borderline subject (70% attendance)
      await AttendanceModel.create({
        teacherId: teacher._id,
        studentId: student._id,
        className: "3rd Year CS-A",
        subjectName: "Database Systems",
        date: date,
        status: Math.random() > 0.3 ? "present" : "absent"
      });
      // Computer Networks - Healthy subject (100% attendance)
      await AttendanceModel.create({
        teacherId: teacher._id,
        studentId: student._id,
        className: "3rd Year CS-A",
        subjectName: "Computer Networks",
        date: date,
        status: "present"
      });
    }

    console.log("[SEED] Purging old assignments for demo student...");
    await AssignmentModel.deleteMany({ studentId: student._id });

    console.log("[SEED] Inserting upcoming deadlines...");
    const urgentDate = new Date();
    urgentDate.setDate(urgentDate.getDate() + 2); // Urgent deadline (2 days)
    
    const mediumDate = new Date();
    mediumDate.setDate(mediumDate.getDate() + 5); // Medium deadline (5 days)
    
    const laterDate = new Date();
    laterDate.setDate(laterDate.getDate() + 14); // Later deadline (2 weeks)

    await AssignmentModel.create([
      {
        studentId: student._id,
        courseCode: "CS301",
        title: "Data Structures Project Phase 1",
        description: "Implement core tree traversal algorithms.",
        dueDate: urgentDate,
        status: "pending"
      },
      {
        studentId: student._id,
        courseCode: "CS305",
        title: "SQL Optimization Assignment",
        description: "Submit optimized queries for the given database dump.",
        dueDate: mediumDate,
        status: "pending"
      },
      {
        studentId: student._id,
        courseCode: "CS308",
        title: "Network Protocols Research Paper",
        description: "Research paper on modern TCP/IP stack implementations.",
        dueDate: laterDate,
        status: "pending"
      }
    ]);

    console.log("[SEED] Clearing old agent plans (cleanup)...");
    await StudyPlanModel.deleteMany({ studentId: student._id });
    await AgentActionModel.deleteMany({ studentId: student._id });

    console.log("[SEED] Verifying seeded data counts...");
    const tCount = await TimetableModel.countDocuments({ teacherId: teacher._id, weekStartDate: mondayStr });
    const aCount = await AttendanceModel.countDocuments({ studentId: student._id });
    const asmCount = await AssignmentModel.countDocuments({ studentId: student._id });
    
    console.log(`[SEED] Verification successful:
- Timetable records: ${tCount}
- Attendance records: ${aCount}
- Upcoming assignments: ${asmCount}`);

    console.log("[SEED] Complete.");
    await mongoose.connection.close();
    process.exit(0);

  } catch (err: any) {
    console.error("SEED_ERROR: Database operation failed. Error details sanitized.");
    console.error(`Type: ${err.name}, Message: ${err.message}`);
    process.exit(1);
  }
}

seed();
