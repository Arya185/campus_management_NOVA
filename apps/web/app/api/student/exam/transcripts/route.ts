import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth-middleware";
import { connectToDatabase } from "@/lib/db";
import { TranscriptModel } from "@/lib/models";

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "student") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectToDatabase();
    const transcripts = await TranscriptModel.find({ studentId: session.user.id }).sort({ academicYear: 1, semester: 1 });
    return NextResponse.json({ transcripts, total: transcripts.length });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to fetch transcripts" }, { status: 500 });
  }
}
