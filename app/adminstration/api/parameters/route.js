import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { verifySuperAdminAPI } from "@/lib/auth";

export async function GET(req) {
  try {
    await verifySuperAdminAPI();
    
    // Fetch all parameters from the master Parameter table
    const parameters = await prisma.parameter.findMany({
      orderBy: { name: "asc" }
    });

    return NextResponse.json({
      success: true,
      parameters
    });
  } catch (error) {
    console.error("SuperAdmin GET Parameters Error:", error);
    const status = error.message === "Unauthorized" ? 401 : 500;
    return NextResponse.json({ success: false, error: error.message }, { status });
  }
}
