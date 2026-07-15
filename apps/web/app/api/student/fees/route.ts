import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth-middleware";
import { connectToDatabase } from "@/lib/db";
import { StudentFeesModel } from "@/lib/models";

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "student") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectToDatabase();
    const fees = await StudentFeesModel.find({ studentId: session.user.id }).sort({ semester: 1 });
    return NextResponse.json({ fees, total: fees.length });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to fetch fees" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "student") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { feesId, amount, paymentMethod, transactionId } = await req.json();

    await connectToDatabase();
    const fees = await StudentFeesModel.findOne({ _id: feesId, studentId: session.user.id });
    if (!fees) {
      return NextResponse.json({ error: "Fees record not found" }, { status: 404 });
    }

    fees.paymentRecords.push({
      amount,
      paymentDate: new Date(),
      paymentMethod,
      transactionId,
      reference: `Payment for Sem ${fees.semester}`,
    });
    fees.paidAmount += amount;
    fees.dueAmount -= amount;
    fees.paymentStatus = fees.dueAmount === 0 ? "paid" : "partial";
    await fees.save();

    return NextResponse.json({
      success: true,
      message: "Payment recorded successfully",
      fees,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to process payment" }, { status: 500 });
  }
}
