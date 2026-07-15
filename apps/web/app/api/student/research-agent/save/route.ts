import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth-middleware";
import { connectToDatabase } from "@/lib/db";
import { StudentModel } from "@/lib/models";
import { saveResearchNote } from "@/lib/agent-tools";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "student") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectToDatabase();
    const student = (await StudentModel.findById(session.user.id).lean()) as any;
    if (!student) {
      return NextResponse.json({ error: "Student profile not found" }, { status: 404 });
    }

    const body = await req.json();
    const { topic, content, sources, tags } = body;

    if (!topic || !content) {
      return NextResponse.json({ error: "Topic and content are required" }, { status: 400 });
    }

    const result = await saveResearchNote(student._id.toString(), {
      topic,
      content,
      sources,
      tags,
    });

    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
