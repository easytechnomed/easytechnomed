import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { verifySuperAdminAPI } from "@/lib/auth";

export async function DELETE(req, { params }) {
  try {
    await verifySuperAdminAPI();
    const { id } = await params;
    const testId = parseInt(id);

    if (isNaN(testId)) {
      return NextResponse.json({ success: false, error: "Invalid test ID." }, { status: 400 });
    }

    const test = await prisma.test.findFirst({
      where: { id: testId, workspaceId: null, isDeleted: false },
    });

    if (!test) {
      return NextResponse.json({ success: false, error: "Default test not found or already deleted." }, { status: 404 });
    }

    // Soft delete the test and its parameters
    await prisma.$transaction(async (tx) => {
      await tx.test.update({
        where: { id: testId },
        data: {
          isDeleted: true,
          deletedAt: new Date(),
        },
      });

      await tx.testParameter.updateMany({
        where: { testId },
        data: {
          isDeleted: true,
          deletedAt: new Date(),
        },
      });
    });

    return NextResponse.json({ success: true, message: "Default test deleted successfully." });
  } catch (error) {
    console.error("SuperAdmin Default Test DELETE Error:", error);
    const status = error.message === "Unauthorized" ? 401 : 500;
    return NextResponse.json({ success: false, error: error.message }, { status });
  }
}

export async function PUT(req, { params }) {
  try {
    await verifySuperAdminAPI();
    const { id } = await params;
    const testId = parseInt(id);

    if (isNaN(testId)) {
      return NextResponse.json({ success: false, error: "Invalid test ID." }, { status: 400 });
    }

    const body = await req.json().catch(() => ({}));
    const { name, code, price, parameters } = body;

    if (!name || typeof name !== "string" || name.trim() === "") {
      return NextResponse.json({ success: false, error: "Test name is required." }, { status: 400 });
    }

    if (price === undefined || isNaN(parseFloat(price))) {
      return NextResponse.json({ success: false, error: "Valid test price is required." }, { status: 400 });
    }

    const test = await prisma.test.findFirst({
      where: { id: testId, workspaceId: null, isDeleted: false },
    });

    if (!test) {
      return NextResponse.json({ success: false, error: "Default test not found." }, { status: 404 });
    }

    // Check if code is already used by another default test
    if (code && code.trim() !== "") {
      const duplicate = await prisma.test.findFirst({
        where: {
          workspaceId: null,
          code: code.trim(),
          isDeleted: false,
          id: { not: testId }
        }
      });
      if (duplicate) {
        return NextResponse.json({ success: false, error: `Test code "${code.trim()}" is already in use by another default test.` }, { status: 400 });
      }
    }

    // Process parameters update and deletion
    await prisma.$transaction(async (tx) => {
      // 1. Update Test record
      await tx.test.update({
        where: { id: testId },
        data: {
          name: name.trim(),
          code: code ? code.trim() : null,
          price: parseFloat(price),
        }
      });

      // 2. Identify existing parameters
      const existingParams = await tx.testParameter.findMany({
        where: { testId, isDeleted: false }
      });
      const existingIds = existingParams.map(p => p.id);

      const incomingParams = parameters || [];
      const incomingIds = incomingParams.map(p => p.id).filter(Boolean);

      // 3. Delete parameters not in incoming payload
      const toDeleteIds = existingIds.filter(id => !incomingIds.includes(id));
      if (toDeleteIds.length > 0) {
        await tx.testParameter.updateMany({
          where: { id: { in: toDeleteIds } },
          data: {
            isDeleted: true,
            deletedAt: new Date()
          }
        });
      }

      // 4. Update or Create incoming parameters
      for (const p of incomingParams) {
        const paramData = {
          name: p.name || "",
          minValMale: p.minValMale !== undefined && p.minValMale !== null && p.minValMale !== "" ? parseFloat(p.minValMale) : null,
          maxValMale: p.maxValMale !== undefined && p.maxValMale !== null && p.maxValMale !== "" ? parseFloat(p.maxValMale) : null,
          normalRangeMale: p.normalRangeMale || null,
          minValFemale: p.minValFemale !== undefined && p.minValFemale !== null && p.minValFemale !== "" ? parseFloat(p.minValFemale) : null,
          maxValFemale: p.maxValFemale !== undefined && p.maxValFemale !== null && p.maxValFemale !== "" ? parseFloat(p.maxValFemale) : null,
          normalRangeFemale: p.normalRangeFemale || null,
          minValBaby: p.minValBaby !== undefined && p.minValBaby !== null && p.minValBaby !== "" ? parseFloat(p.minValBaby) : null,
          maxValBaby: p.maxValBaby !== undefined && p.maxValBaby !== null && p.maxValBaby !== "" ? parseFloat(p.maxValBaby) : null,
          normalRangeBaby: p.normalRangeBaby || null,
          normalRangeDefault: p.normalRangeDefault || null,
          unit: p.unit || null,
          order: parseInt(p.order) || 1
        };

        if (p.id) {
          await tx.testParameter.update({
            where: { id: p.id },
            data: paramData
          });
        } else {
          await tx.testParameter.create({
            data: {
              ...paramData,
              testId
            }
          });
        }
      }
    });

    return NextResponse.json({ success: true, message: "Default test and parameters updated successfully!" });
  } catch (error) {
    console.error("SuperAdmin Default Test PUT Error:", error);
    const status = error.message === "Unauthorized" ? 401 : 500;
    return NextResponse.json({ success: false, error: error.message }, { status });
  }
}
