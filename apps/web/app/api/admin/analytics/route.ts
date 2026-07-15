import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth-middleware";
import { getInstitutionAnalytics, getInstitutionTrends, getBranchAnalytics } from "@/lib/admin-analytics";

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type") || "overview";
    const branch = searchParams.get("branch");
    const months = parseInt(searchParams.get("months") || "12");

    if (type === "overview") {
      const result = await getInstitutionAnalytics();
      return NextResponse.json(result);
    }

    if (type === "trends") {
      const result = await getInstitutionTrends(months);
      return NextResponse.json(result);
    }

    if (type === "branch") {
      if (!branch) {
        return NextResponse.json({ error: "branch parameter is required" }, { status: 400 });
      }
      const result = await getBranchAnalytics(branch);
      return NextResponse.json(result);
    }

    return NextResponse.json({ error: "Invalid type parameter" }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
