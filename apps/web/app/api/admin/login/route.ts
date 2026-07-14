import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { AdminModel } from "@/lib/models";

export async function POST(req: Request) {
  try {
    const { username, password } = await req.json();

    if (!username || !password) {
      return NextResponse.json(
        { error: "Username and password are required." },
        { status: 400 },
      );
    }

    await connectToDatabase();

    const admin = await AdminModel.findOne({
      username: { $regex: `^${String(username).trim()}$`, $options: "i" },
    });

    if (!admin) {
      return NextResponse.json(
        { error: "Invalid admin credentials." },
        { status: 401 },
      );
    }

    const isValid = await bcrypt.compare(password, admin.password);
    if (!isValid) {
      return NextResponse.json(
        { error: "Invalid admin credentials." },
        { status: 401 },
      );
    }

    return NextResponse.json({
      id: admin._id,
      username: admin.username,
      name: admin.name,
      role: admin.role,
      email: admin.email,
    });
  } catch {
    return NextResponse.json(
      { error: "Unable to sign in." },
      { status: 500 },
    );
  }
}
