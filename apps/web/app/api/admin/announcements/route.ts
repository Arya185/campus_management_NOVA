import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth-middleware";
import { connectToDatabase } from "@/lib/db";
import { AnnouncementModel } from "@/lib/models";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user.role !== "admin" && session.user.role !== "teacher")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { title, description, content, category, targetAudience, priority, attachments, expiryDate } = await req.json();

    if (!title || !content) {
      return NextResponse.json({ error: "title and content are required" }, { status: 400 });
    }

    await connectToDatabase();
    const announcement = await AnnouncementModel.create({
      title,
      description: description || "",
      content,
      category: category || "general",
      targetAudience: targetAudience || "all",
      priority: priority || "normal",
      attachments: attachments || [],
      expiryDate: expiryDate ? new Date(expiryDate) : null,
      postedBy: session.user.role,
      postedById: session.user.id,
      postedByName: session.user.name || session.user.email,
      isActive: true,
      viewCount: 0,
    });

    return NextResponse.json({ announcement }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to create announcement" }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user.role !== "admin" && session.user.role !== "teacher")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Announcement ID is required" }, { status: 400 });
    }

    const { isActive, priority } = await req.json();

    await connectToDatabase();
    const announcement = await AnnouncementModel.findByIdAndUpdate(
      id,
      { isActive, priority },
      { new: true }
    );

    if (!announcement) {
      return NextResponse.json({ error: "Announcement not found" }, { status: 404 });
    }

    return NextResponse.json({ announcement });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to update announcement" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized - only admins can delete announcements" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Announcement ID is required" }, { status: 400 });
    }

    await connectToDatabase();
    const announcement = await AnnouncementModel.findByIdAndDelete(id);

    if (!announcement) {
      return NextResponse.json({ error: "Announcement not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to delete announcement" }, { status: 500 });
  }
}
