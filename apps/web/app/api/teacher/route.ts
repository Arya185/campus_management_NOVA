import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth-middleware";
import { connectToDatabase } from "@/lib/db";
import { TeacherResourceModel } from "@/lib/models";

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const subject = searchParams.get("subject");
    const category = searchParams.get("category");

    await connectToDatabase();
    const query: any = {};
    if (subject) {
      query.subject = subject;
    }
    if (category) {
      query.category = category;
    }

    const resources = await TeacherResourceModel.find(query).sort({ createdAt: -1 });
    return NextResponse.json({ resources, total: resources.length });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to fetch resources" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "teacher") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { title, subject, description, content, category } = await req.json();

    if (!title || !subject || !content) {
      return NextResponse.json({ error: "title, subject, and content are required" }, { status: 400 });
    }

    await connectToDatabase();
    const resource = await TeacherResourceModel.create({
      title,
      subject,
      description: description || "",
      content,
      category: category || "notes",
      postedBy: session.user.id,
      fileSize: `${Math.round(content.length / 100) / 10} KB`,
      downloads: 0,
    });

    return NextResponse.json({ resource }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to create resource" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "teacher") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Resource ID is required" }, { status: 400 });
    }

    await connectToDatabase();
    const resource = await TeacherResourceModel.findOne({ _id: id });
    if (!resource) {
      return NextResponse.json({ error: "Resource not found" }, { status: 404 });
    }

    // Verify ownership - teacher can only delete their own resources
    if (resource.postedBy.toString() !== session.user.id) {
      return NextResponse.json({ error: "Forbidden - you can only delete your own resources" }, { status: 403 });
    }

    await TeacherResourceModel.deleteOne({ _id: id });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to delete resource" }, { status: 500 });
  }
}