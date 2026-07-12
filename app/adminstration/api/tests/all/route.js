import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { verifySuperAdminAPI } from "@/lib/auth";

export async function GET() {
  try {
    await verifySuperAdminAPI();

    const tests = await prisma.test.findMany({
      where: {
        workspaceId: null,
        isDeleted: false,
      },
      select: {
        id: true,
        name: true,
        code: true,
        parameters: {
          where: { isDeleted: false },
          orderBy: { order: "asc" },
          select: {
            id: true,
            parameterId: true,
            order: true,
            isHeader: true,
            editable: true,
            isCalculated: true,
            decimalPlace: true,
            unit: true,
            parameter: {
              select: {
                id: true,
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
              },
            },
          },
        },
      },
      orderBy: { name: "asc" },
    });

    // Flatten parameter fields so the frontend sees them directly (same as existing serializers)
    const serialized = JSON.parse(JSON.stringify(tests)).map((test) => ({
      ...test,
      parameters: test.parameters.map((tp) => {
        const { parameter, ...rest } = tp;
        return {
          ...rest,
          name: parameter.name,
          unit: tp.unit || parameter.unit || "",
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
      }),
    }));

    return NextResponse.json({ success: true, tests: serialized });
  } catch (error) {
    console.error("SuperAdmin Tests/All GET Error:", error);
    const status = error.message === "Unauthorized" ? 401 : 500;
    return NextResponse.json({ success: false, error: error.message }, { status });
  }
}
