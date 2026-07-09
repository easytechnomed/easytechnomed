import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";

// Helper to serialize Decimal and Dates
function serializeData(data) {
  return JSON.parse(JSON.stringify(data));
}

export async function GET(req, { params }) {
  try {
    const admin = await requireAdmin("REGISTRATION_READ");
    const { id } = await params;
    const registrationId = parseInt(id);

    if (isNaN(registrationId)) {
      return NextResponse.json({ success: false, error: "Invalid registration ID" }, { status: 400 });
    }

    const registration = await prisma.registration.findFirst({
      where: { id: registrationId, workspaceId: admin.workspaceId },
      include: {
        tests: {
          include: {
            test: {
              include: {
                parameters: { orderBy: { order: "asc" } },
              },
            },
          },
        },
        results: true,
      },
    });

    if (!registration) {
      return NextResponse.json({ success: false, message: "Registration not found." }, { status: 404 });
    }

    return NextResponse.json({ success: true, registration: serializeData(registration) });
  } catch (error) {
    console.error("Workspace Registration Parameters GET Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req, { params }) {
  try {
    await requireAdmin("REGISTRATION_WRITE");
    const { id } = await params;
    const testId = parseInt(id); // Dynamic ID parameter represents testId in parameters configuration
    const body = await req.json().catch(() => ({}));
    const { parametersList } = body;

    if (isNaN(testId)) {
      return NextResponse.json({ success: false, error: "Invalid test ID" }, { status: 400 });
    }

    await prisma.$transaction(async (tx) => {
      await tx.testParameter.deleteMany({ where: { testId } });
      const dataToCreate = parametersList.map((param, index) => ({
        testId,
        name: param.name,
        minValMale: param.minValMale !== undefined && param.minValMale !== null && param.minValMale !== "" ? parseFloat(param.minValMale) : null,
        maxValMale: param.maxValMale !== undefined && param.maxValMale !== null && param.maxValMale !== "" ? parseFloat(param.maxValMale) : null,
        normalRangeMale: param.normalRangeMale || null,
        minValFemale: param.minValFemale !== undefined && param.minValFemale !== null && param.minValFemale !== "" ? parseFloat(param.minValFemale) : null,
        maxValFemale: param.maxValFemale !== undefined && param.maxValFemale !== null && param.maxValFemale !== "" ? parseFloat(param.maxValFemale) : null,
        normalRangeFemale: param.normalRangeFemale || null,
        minValBaby: param.minValBaby !== undefined && param.minValBaby !== null && param.minValBaby !== "" ? parseFloat(param.minValBaby) : null,
        maxValBaby: param.maxValBaby !== undefined && param.maxValBaby !== null && param.maxValBaby !== "" ? parseFloat(param.maxValBaby) : null,
        normalRangeBaby: param.normalRangeBaby || null,
        normalRangeDefault: param.normalRangeDefault || null,
        unit: param.unit || "-NA-",
        order: index + 1,
      }));
      if (dataToCreate.length > 0) {
        await tx.testParameter.createMany({ data: dataToCreate });
      }
    });

    return NextResponse.json({ success: true, message: "Parameters updated successfully." });
  } catch (error) {
    console.error("Workspace Registration Parameters POST Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
