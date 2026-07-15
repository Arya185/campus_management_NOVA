import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth-middleware";
import { connectToDatabase } from "@/lib/db";
import { CareerRoadmapModel, StudentModel } from "@/lib/models";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "student") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { roadmapId, status } = body;

    if (!roadmapId || !["approved", "rejected"].includes(status)) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }

    await connectToDatabase();
    const student = (await StudentModel.findById(session.user.id).lean()) as any;
    if (!student) {
      return NextResponse.json({ error: "Student profile not found" }, { status: 404 });
    }

    const roadmap = await CareerRoadmapModel.findById(roadmapId);
    if (!roadmap) {
      return NextResponse.json({ error: "Career roadmap not found" }, { status: 404 });
    }
    if (roadmap.studentId.toString() !== student._id.toString()) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }
    if (roadmap.status !== "pending") {
      return NextResponse.json({ error: `Roadmap is already ${roadmap.status}` }, { status: 400 });
    }

    roadmap.status = status;
    await roadmap.save();

    return NextResponse.json({
      success: true,
      status,
      roadmap: {
        id: roadmap._id.toString(),
        targetRole: roadmap.targetRole,
        milestones: roadmap.milestones,
        rationale: roadmap.rationale,
        status: roadmap.status,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
