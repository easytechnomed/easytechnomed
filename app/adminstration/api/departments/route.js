import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { verifySuperAdminAPI } from "@/lib/auth";

export async function GET(req) {
  try {
    await verifySuperAdminAPI();
    const departments = await prisma.testDepartment.findMany({
      orderBy: { name: "asc" }
    });
    return NextResponse.json({ success: true, departments });
  } catch (error) {
    console.error("SuperAdmin Departments GET Error:", error);
    const status = error.message === "Unauthorized" ? 401 : 500;
    return NextResponse.json({ success: false, error: error.message }, { status });
  }
}
