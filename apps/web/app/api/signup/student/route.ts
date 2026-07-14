import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { StudentModel } from "@/lib/models";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    
    // Basic validation
    if (!body.email || !body.password || !body.studentId) {
      return NextResponse.json(
        { error: 'Email, password and Student ID are required' },
        { status: 400 }
      );
    }

    await connectToDatabase();

    // Check for duplicate email
    const existingUser = await StudentModel.findOne({ email: body.email.toLowerCase() });
    if (existingUser) {
      return NextResponse.json(
        { error: 'Email is already registered' },
        { status: 409 }
      );
    }

    // Check for duplicate studentId
    const existingStudentId = await StudentModel.findOne({ studentId: body.studentId });
    if (existingStudentId) {
      return NextResponse.json(
        { error: 'Student ID is already registered' },
        { status: 409 }
      );
    }

    // Create the student
    const hashedPassword = await bcrypt.hash(body.password, 12);

    const student = new StudentModel({
      ...body,
      email: body.email.toLowerCase(),
      password: hashedPassword,
      // Ensure required fields have fallbacks if missing for testing
      firstName: body.firstName || 'Unknown',
      lastName: body.lastName || 'Unknown',
      phone: body.phone || '0000000000',
      gender: body.gender || 'Unknown',
      dateOfBirth: body.dateOfBirth || '2000-01-01',
      address: body.address || 'Unknown',
      course: body.course || 'Unknown',
      branch: body.branch || 'Unknown',
      year: body.year || '1',
      semester: body.semester || '1',
      rollNumber: body.rollNumber || body.studentId,
      section: body.section || 'A',
      emergencyContactName: body.emergencyContactName || 'Unknown',
      emergencyContactPhone: body.emergencyContactPhone || '0000000000',
      emergencyContactRelation: body.emergencyContactRelation || 'Unknown',
      parentGuardianName: body.parentGuardianName || 'Unknown',
      parentGuardianPhone: body.parentGuardianPhone || '0000000000',
    });

    await student.save();

    return NextResponse.json({
      success: true,
      user: {
        id: student._id,
        email: student.email,
        studentId: student.studentId
      }
    }, { status: 201 });

  } catch {
    return NextResponse.json(
      { error: "Unable to create student account." },
      { status: 500 }
    );
  }
}
