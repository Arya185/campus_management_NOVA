import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth-middleware";
import { connectToDatabase } from "@/lib/db";
import { ExamHallTicketModel } from "@/lib/models";

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "student") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectToDatabase();
    const tickets = await ExamHallTicketModel.find({ studentId: session.user.id }).sort({ examDate: 1 });
    return NextResponse.json({ hallTickets: tickets, total: tickets.length });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to fetch hall tickets" }, { status: 500 });
  }
}
