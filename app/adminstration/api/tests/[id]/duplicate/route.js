import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { verifySuperAdminAPI } from "@/lib/auth";

// Helper to serialize Decimal, Dates, and flatten parameter fields so frontend continues to see them directly
function serializeSingleTest(test) {
  if (!test) return null;
  const serialized = JSON.parse(JSON.stringify(test));
  if (serialized.parameters) {
    serialized.parameters = serialized.parameters.map(tp => {
      if (tp.parameter) {
        const { parameter, ...rest } = tp;
        return {
          ...rest,
          name: parameter.name,
          unit: parameter.unit,
          minValMale: parameter.minValMale,
          maxValMale: parameter.maxValMale,
          normalRangeMale: parameter.normalRangeMale,
          minValFemale: parameter.minValFemale,
          maxValFemale: parameter.maxValFemale,
          normalRangeFemale: parameter.normalRangeFemale,
          minValBaby: parameter.minValBaby,
          maxValBaby: parameter.maxValBaby,
          normalRangeBaby: parameter.normalRangeBaby,
          normalRangeDefault: parameter.normalRangeDefault,
        };
      }
      return tp;
    });
  }
  return serialized;
}

export async function POST(req, { params }) {
  try {
    await verifySuperAdminAPI();
    const { id } = await params;
    const testId = parseInt(id);

    if (isNaN(testId)) {
      return NextResponse.json({ success: false, error: "Invalid test ID." }, { status: 400 });
    }

    const body = await req.json().catch(() => ({}));
    const { name, code } = body;

    if (!name || typeof name !== "string" || name.trim() === "") {
      return NextResponse.json({ success: false, error: "New test name is required." }, { status: 400 });
    }

    // Check if code is already used by another default test
    if (code && code.trim() !== "") {
      const duplicateCode = await prisma.test.findFirst({
        where: {
          workspaceId: null,
          code: code.trim(),
          isDeleted: false,
        }
      });
      if (duplicateCode) {
        return NextResponse.json({ success: false, error: `Test code "${code.trim()}" is already in use by another default test.` }, { status: 400 });
      }
    }

    // Find the source test
    const sourceTest = await prisma.test.findFirst({
      where: { id: testId, workspaceId: null, isDeleted: false },
      include: {
        parameters: {
          where: { isDeleted: false },
          orderBy: { order: "asc" }
        },
        formulas: true
      }
    });

    if (!sourceTest) {
      return NextResponse.json({ success: false, error: "Source test not found." }, { status: 404 });
    }

    const newTest = await prisma.$transaction(async (tx) => {
      // 1. Create new Test record
      const testRecord = await tx.test.create({
        data: {
          name: name.trim(),
          code: code && code.trim() !== "" ? code.trim() : null,
          price: sourceTest.price,
          workspaceId: null,
          isDeleted: false,
          departmentId: sourceTest.departmentId,
        }
      });

      // 2. Clone parameters
      const oldToNewTpId = {};
      const childParams = [];

      // Pass 1: Clone all header parameters
      for (const tp of sourceTest.parameters) {
        if (!tp.isHeader) {
          childParams.push(tp);
          continue;
        }

        const newTp = await tx.testParameter.create({
          data: {
            testId: testRecord.id,
            parameterId: tp.parameterId,
            order: tp.order,
            isHeader: true,
            parentId: null,
            isDeleted: false,
            editable: tp.editable,
            isCalculated: tp.isCalculated,
            decimalPlace: tp.decimalPlace,
            roundingMethod: tp.roundingMethod,
            section: tp.section,
            unit: tp.unit,
          }
        });

        oldToNewTpId[tp.id] = newTp.id;
      }

      // Pass 2: Clone all child parameters with parent linkage
      for (const tp of childParams) {
        const resolvedParentId = tp.parentId ? (oldToNewTpId[tp.parentId] ?? null) : null;
        await tx.testParameter.create({
          data: {
            testId: testRecord.id,
            parameterId: tp.parameterId,
            order: tp.order,
            isHeader: false,
            parentId: resolvedParentId,
            isDeleted: false,
            editable: tp.editable,
            isCalculated: tp.isCalculated,
            decimalPlace: tp.decimalPlace,
            roundingMethod: tp.roundingMethod,
            section: tp.section,
            unit: tp.unit,
          }
        });
      }

      // 3. Clone formulas
      for (const formula of sourceTest.formulas) {
        await tx.testFormula.create({
          data: {
            testId: testRecord.id,
            outputParameterId: formula.outputParameterId,
            formula: formula.formula,
            description: formula.description,
            name: formula.name,
            version: formula.version,
            isActive: formula.isActive,
            workspaceId: null
          }
        });
      }

      return await tx.test.findUnique({
        where: { id: testRecord.id },
        include: {
          parameters: {
            where: { isDeleted: false },
            orderBy: { order: "asc" },
            include: {
              parameter: true
            }
          }
        }
      });
    });

    return NextResponse.json({
      success: true,
      message: "Test duplicated successfully.",
      test: serializeSingleTest(newTest)
    });

  } catch (error) {
    console.error("SuperAdmin Test Duplicate Error:", error);
    const status = error.message === "Unauthorized" ? 401 : 500;
    return NextResponse.json({ success: false, error: error.message }, { status });
  }
}
