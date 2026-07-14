import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth-middleware";
import { completeStudySession, skipStudySession } from "@/lib/agent-tools";
import { connectToDatabase } from "@/lib/db";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "student") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { planId, sessionId, action } = body;

    if (!planId || !sessionId || !["complete", "skip"].includes(action)) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }

    const student = await connectToDatabase().then(async () => {
      const { StudentModel } = await import("@/lib/models");
      return (await StudentModel.findById(session.user.id).lean()) as any;
    });

    if (!student) {
      return NextResponse.json({ error: "Student profile not found" }, { status: 404 });
    }

    let result;
    if (action === "complete") {
      result = await completeStudySession(student._id.toString(), planId, sessionId);
    } else {
      result = await skipStudySession(student._id.toString(), planId, sessionId);
    }
    
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
