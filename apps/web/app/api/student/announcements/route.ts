import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth-middleware";
import { connectToDatabase } from "@/lib/db";
import { AnnouncementModel } from "@/lib/models";

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "student") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const category = searchParams.get("category");
    const priority = searchParams.get("priority");
    const limit = parseInt(searchParams.get("limit") || "10");

    await connectToDatabase();
    const query: any = {
      isActive: true,
      $or: [{ targetAudience: "all-students" }, { targetAudience: "all" }]
    };

    if (category) {
      query.category = category;
    }
    if (priority) {
      query.priority = priority;
    }

    const announcements = await AnnouncementModel.find(query).sort({ createdAt: -1 }).limit(limit);
    const total = await AnnouncementModel.countDocuments(query);

    return NextResponse.json({ announcements, total });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to fetch announcements" }, { status: 500 });
  }
}
