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

export async function POST(req) {
  try {
    await verifySuperAdminAPI();
    const body = await req.json().catch(() => ({}));
    const {
      name,
      unit,
      minValMale,
      maxValMale,
      normalRangeMale,
      minValFemale,
      maxValFemale,
      normalRangeFemale,
      minValBaby,
      maxValBaby,
      normalRangeBaby,
      normalRangeDefault
    } = body;

    const normName = (name || "").trim();
    if (!normName) {
      return NextResponse.json({ success: false, error: "Parameter name is required." }, { status: 400 });
    }

    // Check if name is already taken
    const duplicate = await prisma.parameter.findFirst({
      where: {
        name: { equals: normName },
        workspaceId: null
      }
    });

    if (duplicate) {
      return NextResponse.json({ success: false, error: `Parameter name "${normName}" is already taken.` }, { status: 400 });
    }

    const created = await prisma.parameter.create({
      data: {
        name: normName,
        unit: unit || null,
        minValMale: minValMale !== "" && minValMale !== null && minValMale !== undefined ? parseFloat(minValMale) : null,
        maxValMale: maxValMale !== "" && maxValMale !== null && maxValMale !== undefined ? parseFloat(maxValMale) : null,
        normalRangeMale: normalRangeMale || null,
        minValFemale: minValFemale !== "" && minValFemale !== null && minValFemale !== undefined ? parseFloat(minValFemale) : null,
        maxValFemale: maxValFemale !== "" && maxValFemale !== null && maxValFemale !== undefined ? parseFloat(maxValFemale) : null,
        normalRangeFemale: normalRangeFemale || null,
        minValBaby: minValBaby !== "" && minValBaby !== null && minValBaby !== undefined ? parseFloat(minValBaby) : null,
        maxValBaby: maxValBaby !== "" && maxValBaby !== null && maxValBaby !== undefined ? parseFloat(maxValBaby) : null,
        normalRangeBaby: normalRangeBaby || null,
        normalRangeDefault: normalRangeDefault || null
      }
    });

    return NextResponse.json({ success: true, message: "Parameter created successfully.", parameter: created });
  } catch (error) {
    console.error("SuperAdmin POST Parameter Error:", error);
    const status = error.message === "Unauthorized" ? 401 : 500;
    return NextResponse.json({ success: false, error: error.message }, { status });
  }
}
