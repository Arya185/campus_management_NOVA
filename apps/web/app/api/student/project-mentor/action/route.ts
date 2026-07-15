import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth-middleware";
import { connectToDatabase } from "@/lib/db";
import { ProjectModel, StudentModel } from "@/lib/models";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "student") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { projectId, status } = body;

    if (!projectId || !["approved", "rejected"].includes(status)) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }

    await connectToDatabase();
    const student = (await StudentModel.findById(session.user.id).lean()) as any;
    if (!student) {
      return NextResponse.json({ error: "Student profile not found" }, { status: 404 });
    }

    const project = await ProjectModel.findById(projectId);
    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }
    if (project.studentId.toString() !== student._id.toString()) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }
    if (project.status !== "pending") {
      return NextResponse.json({ error: `Project is already ${project.status}` }, { status: 400 });
    }

    project.status = status;
    await project.save();

    return NextResponse.json({
      success: true,
      status,
      project: {
        id: project._id.toString(),
        title: project.title,
        description: project.description,
        domain: project.domain,
        status: project.status,
        technologies: project.technologies,
        milestones: project.milestones,
        mentorFeedback: project.mentorFeedback || [],
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
