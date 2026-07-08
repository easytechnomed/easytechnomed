import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { verifySuperAdminAPI } from "@/lib/auth";

export async function GET(req) {
  try {
    await verifySuperAdminAPI();
    
    // Find all parameters where test is a default test (workspaceId is null and isDeleted is false)
    const parameters = await prisma.testParameter.findMany({
      where: {
        isDeleted: false,
        test: {
          workspaceId: null,
          isDeleted: false
        }
      },
      select: {
        name: true,
        unit: true,
        minValMale: true,
        maxValMale: true,
        normalRangeMale: true,
        minValFemale: true,
        maxValFemale: true,
        normalRangeFemale: true,
        minValBaby: true,
        maxValBaby: true,
        normalRangeBaby: true,
        normalRangeDefault: true,
      }
    });

    // Make unique by parameter name
    const uniqueParamsMap = new Map();
    parameters.forEach(p => {
      if (p.name && !uniqueParamsMap.has(p.name.toLowerCase().trim())) {
        uniqueParamsMap.set(p.name.toLowerCase().trim(), p);
      }
    });

    const uniqueParameters = Array.from(uniqueParamsMap.values());

    return NextResponse.json({
      success: true,
      parameters: JSON.parse(JSON.stringify(uniqueParameters))
    });
  } catch (error) {
    console.error("SuperAdmin GET Parameters Error:", error);
    const status = error.message === "Unauthorized" ? 401 : 500;
    return NextResponse.json({ success: false, error: error.message }, { status });
  }
}
