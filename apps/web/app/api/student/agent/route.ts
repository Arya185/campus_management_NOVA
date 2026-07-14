import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth-middleware";
import { runAcademicAgent } from "@/lib/academic-agent";
import { StudentModel } from "@/lib/models";
import { connectToDatabase } from "@/lib/db";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "student") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Resolve real MongoDB _id using the auth session id
    await connectToDatabase();
    const student = (await StudentModel.findById(session.user.id).lean()) as any;
    if (!student) {
      return NextResponse.json({ error: "Student profile not found" }, { status: 404 });
    }

    const body = await req.json();
    const { prompt } = body;

    if (!prompt) {
      return NextResponse.json({ error: "Prompt is required" }, { status: 400 });
    }

    const result = await runAcademicAgent(student._id.toString(), prompt);
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
