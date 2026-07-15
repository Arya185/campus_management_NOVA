import { loadEnvConfig } from "@next/env";
import path from "path";

// Load environment variables securely
const projectDir = path.resolve(process.cwd());
loadEnvConfig(projectDir);

import bcrypt from "bcryptjs";
import mongoose from "mongoose";
import { connectToDatabase } from "../lib/db";
import {
  StudentModel,
  TeacherModel,
  ClassroomModel,
  TimetableModel,
  AttendanceModel,
  AssignmentModel,
  StudentFeesModel,
  ExamResultModel,
  TranscriptModel,
  ExamHallTicketModel,
  AnnouncementModel,
  TeacherResourceModel,
} from "../lib/models";

async function runSeed() {
  try {
    await connectToDatabase();
    console.log("Database connection successful.");

    // Demo identities
    const studentEmail = "rahul.sharma@student.edu";
    const teacherEmail = "jane.doe@teacher.edu";

    // Upsert Teacher
    const teacherPassword = await bcrypt.hash("Password@123", 12);
    await TeacherModel.findOneAndUpdate(
      { email: teacherEmail },
      {
        firstName: "Jane",
        lastName: "Doe",
        password: teacherPassword,
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
      { upsert: true }
    );
    let teacher = await TeacherModel.findOne({ email: teacherEmail });

    // Upsert Student
    const studentPassword = await bcrypt.hash("Password@123", 12);
    await StudentModel.findOneAndUpdate(
      { email: studentEmail },
      {
        firstName: "Rahul",
        lastName: "Sharma",
        password: studentPassword,
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
      { upsert: true }
    );
    let student = await StudentModel.findOne({ email: studentEmail });

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

    // Student Fees
    await StudentFeesModel.deleteMany({ studentId: student._id });
    await StudentFeesModel.create([
      {
        studentId: student._id,
        semester: 6,
        academicYear: "2024-25",
        totalFees: 150000,
        paidAmount: 150000,
        dueAmount: 0,
        paymentStatus: "paid",
        dueDateLimit: new Date("2025-12-31"),
        paymentRecords: [
          { amount: 70000, paymentDate: new Date("2025-01-15"), paymentMethod: "online", transactionId: "TXN20250115001", reference: "Semester 6 Fees" },
          { amount: 80000, paymentDate: new Date("2025-02-01"), paymentMethod: "online", transactionId: "TXN20250201001", reference: "Semester 6 Fees" }
        ]
      },
      {
        studentId: student._id,
        semester: 7,
        academicYear: "2025-26",
        totalFees: 150000,
        paidAmount: 100000,
        dueAmount: 50000,
        paymentStatus: "partial",
        dueDateLimit: new Date("2025-07-31"),
        paymentRecords: [
          { amount: 100000, paymentDate: new Date("2025-06-10"), paymentMethod: "online", transactionId: "TXN20250610001", reference: "Semester 7 Fees" }
        ]
      }
    ]);

    // Exam Results
    await ExamResultModel.deleteMany({ studentId: student._id });
    await ExamResultModel.create([
      {
        studentId: student._id,
        courseCode: "CS-301",
        courseName: "Data Structures and Algorithms",
        semester: 6,
        examType: "end-term",
        totalMarks: 100,
        marksObtained: 95,
        grade: "A",
        gpa: 4.0,
        resultDate: new Date("2025-04-30"),
        status: "pass",
        remarks: "Excellent performance",
        publishedAt: new Date("2025-04-30")
      },
      {
        studentId: student._id,
        courseCode: "CS-303",
        courseName: "Database Management Systems",
        semester: 6,
        examType: "end-term",
        totalMarks: 100,
        marksObtained: 92,
        grade: "A",
        gpa: 4.0,
        resultDate: new Date("2025-04-30"),
        status: "pass",
        remarks: "Very good",
        publishedAt: new Date("2025-04-30")
      },
      {
        studentId: student._id,
        courseCode: "CS-302",
        courseName: "Operating Systems",
        semester: 6,
        examType: "mid-term",
        totalMarks: 50,
        marksObtained: 44,
        grade: "A-",
        gpa: 3.7,
        resultDate: new Date("2025-03-15"),
        status: "pass",
        remarks: "Good",
        publishedAt: new Date("2025-03-15")
      },
      {
        studentId: student._id,
        courseCode: "CS-306",
        courseName: "Software Engineering",
        semester: 6,
        examType: "continuous",
        totalMarks: 50,
        marksObtained: 42,
        grade: "B+",
        gpa: 3.3,
        resultDate: new Date("2025-04-15"),
        status: "pass",
        remarks: "Satisfactory",
        publishedAt: new Date("2025-04-15")
      }
    ]);

    // Transcripts
    await TranscriptModel.deleteMany({ studentId: student._id });
    await TranscriptModel.create([
      {
        studentId: student._id,
        academicYear: "2024-25",
        semester: 6,
        courses: [
          { courseCode: "CS-301", courseName: "Data Structures and Algorithms", credits: 4, grade: "A", gpa: 4.0, marks: 95 },
          { courseCode: "CS-303", courseName: "Database Management Systems", credits: 4, grade: "A", gpa: 4.0, marks: 92 },
          { courseCode: "CS-302", courseName: "Operating Systems", credits: 4, grade: "A-", gpa: 3.7, marks: 88 },
          { courseCode: "CS-304", courseName: "Computer Networks", credits: 4, grade: "A", gpa: 4.0, marks: 94 },
          { courseCode: "CS-306", courseName: "Software Engineering", credits: 4, grade: "B+", gpa: 3.3, marks: 85 }
        ],
        sgpa: 3.8,
        cgpa: 3.85,
        totalCreditsEarned: 20,
        status: "active",
        issuedDate: new Date("2025-03-01")
      },
      {
        studentId: student._id,
        academicYear: "2024-25",
        semester: 5,
        courses: [
          { courseCode: "CS-201", courseName: "Web Development", credits: 4, grade: "A-", gpa: 3.7, marks: 89 },
          { courseCode: "CS-203", courseName: "Mobile App Development", credits: 4, grade: "A", gpa: 4.0, marks: 96 },
          { courseCode: "CS-204", courseName: "Machine Learning", credits: 4, grade: "B+", gpa: 3.3, marks: 83 },
          { courseCode: "CS-205", courseName: "Cloud Computing", credits: 4, grade: "A", gpa: 4.0, marks: 91 },
          { courseCode: "CS-206", courseName: "Cyber Security", credits: 4, grade: "A-", gpa: 3.7, marks: 87 }
        ],
        sgpa: 3.74,
        cgpa: 3.80,
        totalCreditsEarned: 40,
        status: "active",
        issuedDate: new Date("2024-09-01")
      }
    ]);

    // Hall Tickets
    await ExamHallTicketModel.deleteMany({ studentId: student._id });
    await ExamHallTicketModel.create([
      {
        studentId: student._id,
        hallTicketNumber: `HT-${new Date().getFullYear()}-0001`,
        examCode: "CS-301",
        examName: "Data Structures and Algorithms",
        examDate: new Date("2025-04-20"),
        examTime: "9:00 AM - 12:00 PM",
        venue: "Examination Hall A - Building B",
        seatNumber: "A-045",
        reportingTime: "8:45 AM",
        instructions: [
          "Arrive 15 minutes before reporting time",
          "Carry valid ID card and hall ticket",
          "Only blue/black pen allowed",
          "No calculators or electronic devices allowed",
          "Rough work should be on provided sheets only"
        ],
        issuedDate: new Date("2025-04-10")
      },
      {
        studentId: student._id,
        hallTicketNumber: `HT-${new Date().getFullYear()}-0002`,
        examCode: "CS-303",
        examName: "Database Management Systems",
        examDate: new Date("2025-04-22"),
        examTime: "2:00 PM - 5:00 PM",
        venue: "Examination Hall B - Building C",
        seatNumber: "B-052",
        reportingTime: "1:45 PM",
        instructions: [
          "Arrive 15 minutes before reporting time",
          "Carry valid ID card and hall ticket",
          "Only blue/black pen allowed",
          "No calculators or electronic devices allowed",
          "Rough work should be on provided sheets only"
        ],
        issuedDate: new Date("2025-04-10")
      }
    ]);

    // Announcements
    await AnnouncementModel.deleteMany({});
    await AnnouncementModel.create([
      {
        title: "Mid-Semester Examination Schedule Released",
        description: "Mid-semester examination schedule for Semester 6 has been released",
        content: "The mid-semester examination for all Semester 6 students will be held from March 10-20, 2025. Please check your hall tickets on the student portal. Timings and venues will be displayed along with your hall ticket.",
        postedBy: "admin",
        postedById: teacher._id,
        postedByName: "Academic Administration",
        category: "academic",
        targetAudience: "all-students",
        priority: "high",
        attachments: [],
        expiryDate: new Date("2025-03-20"),
        isActive: true,
        viewCount: 245
      },
      {
        title: "Campus Maintenance - Water Supply Interruption",
        description: "Scheduled water supply maintenance on March 5, 2025",
        content: "Campus water supply will be interrupted on March 5, 2025 from 6 AM to 2 PM for scheduled maintenance. Kindly make necessary arrangements. Drinking water will be available at designated points.",
        postedBy: "admin",
        postedById: teacher._id,
        postedByName: "Facilities Management",
        category: "maintenance",
        targetAudience: "all",
        priority: "normal",
        attachments: [],
        expiryDate: new Date("2025-03-06"),
        isActive: true,
        viewCount: 189
      },
      {
        title: "Registration Open for Summer Internship",
        description: "Summer internship registration now open for students",
        content: "Dear Students, Registration for Summer 2025 internship program is now open. Companies like Google, Microsoft, TCS, Infosys and others are participating. Interested candidates should register within 2 weeks on the internship portal.",
        postedBy: "admin",
        postedById: teacher._id,
        postedByName: "Placement Cell",
        category: "events",
        targetAudience: "all-students",
        priority: "high",
        attachments: [{ fileName: "Internship_Companies_2025.pdf", fileUrl: "/files/internships.pdf", uploadDate: new Date("2025-02-25") }],
        expiryDate: new Date("2025-03-15"),
        isActive: true,
        viewCount: 512
      }
    ]);

    // Teacher Resources
    await TeacherResourceModel.deleteMany({});
    await TeacherResourceModel.create([
      {
        title: "Data Structures Lecture Notes",
        subject: "Data Structures",
        description: "Comprehensive lecture notes covering arrays, linked lists, trees, and graphs",
        content: "This document covers fundamental data structures including arrays, linked lists, stacks, queues, trees, and graphs. Each data structure is explained with examples and complexity analysis.",
        category: "notes",
        postedBy: teacher._id,
        fileSize: "125.5 KB",
        downloads: 45
      },
      {
        title: "Database Management Systems Slides",
        subject: "Database Systems",
        description: "Presentation slides for DBMS course covering SQL, normalization, and transactions",
        content: "These slides cover the fundamentals of database management systems including SQL queries, database design, normalization, ACID properties, and transaction management.",
        category: "slides",
        postedBy: teacher._id,
        fileSize: "2.3 MB",
        downloads: 32
      },
      {
        title: "Operating Systems Assignment",
        subject: "Operating Systems",
        description: "Practical assignment on process scheduling and memory management",
        content: "This assignment requires students to implement process scheduling algorithms and simulate memory management techniques. Submit your code and analysis report.",
        category: "assignment",
        postedBy: teacher._id,
        fileSize: "45.2 KB",
        downloads: 28
      }
    ]);

    // Verify
    const counts = {
      student: await StudentModel.countDocuments({ _id: student._id }),
      timetable: await TimetableModel.countDocuments({ weekStartDate: mondayStr }),
      attendance: await AttendanceModel.countDocuments({ studentId: student._id }),
      assignments: await AssignmentModel.countDocuments({ studentId: student._id }),
      fees: await StudentFeesModel.countDocuments({ studentId: student._id }),
      examResults: await ExamResultModel.countDocuments({ studentId: student._id }),
      transcripts: await TranscriptModel.countDocuments({ studentId: student._id }),
      hallTickets: await ExamHallTicketModel.countDocuments({ studentId: student._id }),
      announcements: await AnnouncementModel.countDocuments(),
      teacherResources: await TeacherResourceModel.countDocuments()
    };
    
    console.log(`Demo seed completed. Student: ${studentEmail}`);
    console.log(`Verification counts: Student(${counts.student}), Timetable(${counts.timetable}), Attendance(${counts.attendance}), Assignments(${counts.assignments}), Fees(${counts.fees}), Exam Results(${counts.examResults}), Transcripts(${counts.transcripts}), Hall Tickets(${counts.hallTickets}), Announcements(${counts.announcements}), Teacher Resources(${counts.teacherResources})`);
    
    process.exit(0);
  } catch (error: any) {
    let category = "Unknown Database Error";

    if (!process.env.MONGODB_URI) {
      category = "Configuration Missing";
    } else if (error.name === "MongoNetworkError" || error.name === "MongoServerSelectionError" || (error.message && (error.message.includes("ENOTFOUND") || error.message.includes("ECONNREFUSED") || error.message.includes("querySrv")))) {
      category = "DNS/Network Connectivity";
    } else if (error.name === "MongoServerError") {
      if (error.code === 8000 || (error.message && (error.message.includes("bad auth") || error.message.includes("Authentication")))) {
        category = "Authentication Failure";
      } else if (error.code === 13 || (error.message && error.message.includes("not authorized"))) {
        category = "Authorization Failure";
      } else if (error.code === 11000) {
        category = "Duplicate Key Conflict";
      } else {
        category = "Database Operation Failure";
      }
    } else if (error.name === "ValidationError") {
      category = "Schema Validation Failure";
    } else if (error.name === "MongoParseError") {
      category = "Configuration Missing (Invalid URI format)";
    }

    console.error("Seed execution failed.");
    console.error(`Sanitized Error Category: ${category}`);
    process.exit(1);
  }
}

runSeed();
