import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth-middleware";
import { connectToDatabase } from "@/lib/db";
import { ExamResultModel } from "@/lib/models";

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "student") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const semester = searchParams.get("semester");

    await connectToDatabase();
    const query: any = { studentId: session.user.id };
    if (semester) {
      query.semester = parseInt(semester);
    }

    const results = await ExamResultModel.find(query).sort({ resultDate: -1 });
    return NextResponse.json({ results, total: results.length });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to fetch exam results" }, { status: 500 });
  }
}
