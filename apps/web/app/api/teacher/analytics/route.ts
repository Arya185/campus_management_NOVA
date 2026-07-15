import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth-middleware";
import { getTeacherAnalytics, getTeacherTrends } from "@/lib/teacher-analytics";
import { connectToDatabase } from "@/lib/db";

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "teacher") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type") || "overview";
    const months = parseInt(searchParams.get("months") || "6");

    const teacher = await connectToDatabase().then(async () => {
      const { TeacherModel } = await import("@/lib/models");
      return (await TeacherModel.findById(session.user.id).lean()) as any;
    });

    if (!teacher) {
      return NextResponse.json({ error: "Teacher profile not found" }, { status: 404 });
    }

    if (type === "overview") {
      const result = await getTeacherAnalytics(teacher._id.toString());
      return NextResponse.json(result);
    }

    if (type === "trends") {
      const result = await getTeacherTrends(teacher._id.toString(), months);
      return NextResponse.json(result);
    }

    return NextResponse.json({ error: "Invalid type parameter" }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
