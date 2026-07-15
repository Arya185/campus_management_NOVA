import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth-middleware";
import { connectToDatabase } from "@/lib/db";

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectToDatabase();
    const { AgentAuditLogModel } = await import("@/lib/models");

    const logs = await AgentAuditLogModel.find()
      .sort({ createdAt: -1 })
      .limit(100)
      .lean();

    return NextResponse.json(logs.map((log: any) => ({
      id: log._id.toString(),
      agentType: log.agentType,
      actorId: log.actorId.toString(),
      action: log.action,
      status: log.status,
      createdAt: log.createdAt,
      errorDetail: log.errorDetail
    })));
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
