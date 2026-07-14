import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { TeacherModel } from "@/lib/models";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    if (!body.email || !body.password || !body.employeeId) {
      return NextResponse.json(
        { error: "Email, password and employee ID are required" },
        { status: 400 },
      );
    }

    await connectToDatabase();

    const existingUser = await TeacherModel.findOne({
      email: body.email.toLowerCase(),
    });
    if (existingUser) {
      return NextResponse.json(
        { error: "Email is already registered" },
        { status: 409 },
      );
    }

    const existingEmployeeId = await TeacherModel.findOne({
      employeeId: body.employeeId,
    });
    if (existingEmployeeId) {
      return NextResponse.json(
        { error: "Employee ID is already registered" },
        { status: 409 },
      );
    }

    const hashedPassword = await bcrypt.hash(body.password, 12);

    const teacher = new TeacherModel({
      ...body,
      email: body.email.toLowerCase(),
      password: hashedPassword,
      firstName: body.firstName || "Unknown",
      lastName: body.lastName || "Unknown",
      phone: body.phone || "0000000000",
      gender: body.gender || "Unknown",
      dateOfBirth: body.dateOfBirth || "1990-01-01",
      address: body.address || "Unknown",
      department: body.department || "Unknown",
      designation: body.designation || "Unknown",
      qualification: body.qualification || "Unknown",
      experience: body.experience || "0",
      subjects: Array.isArray(body.subjects) ? body.subjects : [],
      joiningDate: body.joiningDate || "2024-01-01",
      emergencyContactName: body.emergencyContactName || "Unknown",
      emergencyContactPhone: body.emergencyContactPhone || "0000000000",
      emergencyContactRelation: body.emergencyContactRelation || "Unknown",
    });

    await teacher.save();

    return NextResponse.json(
      {
        success: true,
        user: {
          id: teacher._id,
          email: teacher.email,
          employeeId: teacher.employeeId,
        },
      },
      { status: 201 },
    );
  } catch {
    return NextResponse.json(
      { error: "Unable to create teacher account." },
      { status: 500 },
    );
  }
}
