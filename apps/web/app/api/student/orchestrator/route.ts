import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth-middleware";
import { routeToAgent } from "@/lib/orchestrator";
import { connectToDatabase } from "@/lib/db";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { prompt } = body;

    if (!prompt || typeof prompt !== "string") {
      return NextResponse.json({ error: "Prompt is required" }, { status: 400 });
    }

    const user = await connectToDatabase().then(async () => {
      if (session.user.role === "student") {
        const { StudentModel } = await import("@/lib/models");
        return (await StudentModel.findById(session.user.id).lean()) as any;
      } else {
        const { TeacherModel } = await import("@/lib/models");
        return (await TeacherModel.findById(session.user.id).lean()) as any;
      }
    });

    if (!user) {
      return NextResponse.json({ error: "User profile not found" }, { status: 404 });
    }

    const result = await routeToAgent(user._id.toString(), session.user.role as "student" | "teacher", prompt);
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
