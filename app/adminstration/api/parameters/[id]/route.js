import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { verifySuperAdminAPI } from "@/lib/auth";

// Edit master parameter details
export async function PUT(req, { params }) {
  try {
    await verifySuperAdminAPI();
    const { id } = await params;
    const parameterId = parseInt(id);

    if (isNaN(parameterId)) {
      return NextResponse.json({ success: false, error: "Invalid parameter ID." }, { status: 400 });
    }

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

    // Check if name is already taken by another parameter
    const duplicate = await prisma.parameter.findFirst({
      where: {
        name: { equals: normName },
        id: { not: parameterId }
      }
    });

    if (duplicate) {
      return NextResponse.json({ success: false, error: `Parameter name "${normName}" is already taken.` }, { status: 400 });
    }

    const updated = await prisma.parameter.update({
      where: { id: parameterId },
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

    return NextResponse.json({ success: true, message: "Parameter updated successfully.", parameter: updated });
  } catch (error) {
    console.error("SuperAdmin PUT Parameter Error:", error);
    const status = error.message === "Unauthorized" ? 401 : 500;
    return NextResponse.json({ success: false, error: error.message }, { status });
  }
}

// Simple direct delete (only if no mappings exist)
export async function DELETE(req, { params }) {
  try {
    await verifySuperAdminAPI();
    const { id } = await params;
    const parameterId = parseInt(id);

    if (isNaN(parameterId)) {
      return NextResponse.json({ success: false, error: "Invalid parameter ID." }, { status: 400 });
    }

    // Check if any mappings exist
    const mappingsCount = await prisma.testParameter.count({
      where: { parameterId, isDeleted: false }
    });

    if (mappingsCount > 0) {
      return NextResponse.json({
        success: false,
        error: `Cannot delete directly: this parameter is linked to ${mappingsCount} active tests. Use merge/delete instead.`
      }, { status: 400 });
    }

    await prisma.parameter.delete({
      where: { id: parameterId }
    });

    return NextResponse.json({ success: true, message: "Parameter deleted successfully." });
  } catch (error) {
    console.error("SuperAdmin DELETE Parameter Error:", error);
    const status = error.message === "Unauthorized" ? 401 : 500;
    return NextResponse.json({ success: false, error: error.message }, { status });
  }
}
