import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";

// Helper to serialize Decimal, Dates, and flatten parameter fields so frontend continues to see them directly
function serializeRegistration(reg) {
  if (!reg) return null;
  const serialized = JSON.parse(JSON.stringify(reg));
  if (serialized.tests) {
    serialized.tests = serialized.tests.map(t => {
      if (t.test && t.test.parameters) {
        t.test.parameters = t.test.parameters.map(tp => {
          if (tp.parameter) {
            const { parameter, ...rest } = tp;
            return {
              ...rest,
              name: parameter.name,
              code: parameter.code,
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
      return t;
    });
  }
  return serialized;
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
                parameters: {
                  where: { isDeleted: false },
                  orderBy: { order: "asc" },
                  include: { parameter: true }
                },
                formulas: {
                  include: {
                    outputParameter: true
                  }
                }
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

    return NextResponse.json({ success: true, registration: serializeRegistration(registration) });
  } catch (error) {
    if (error.message === "NEXT_REDIRECT" || (error.digest && error.digest.startsWith("NEXT_REDIRECT"))) {
      return NextResponse.json({ success: false, error: "Unauthorized", message: "Unauthorized" }, { status: 401 });
    }
    console.error("Workspace Registration Parameters GET Error:", error);
    return NextResponse.json({ success: false, error: error.message, message: error.message }, { status: 500 });
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

    const incomingList = Array.isArray(parametersList) ? parametersList : [];

    await prisma.$transaction(async (tx) => {
      // Clear legacy parameter mappings for this test
      await tx.testParameter.deleteMany({ where: { testId } });

      let index = 0;
      for (const param of incomingList) {
        const normName = (param.name || "").trim();
        if (!normName) continue;

        // Resolve or create parameter in the master dictionary
        let parameter = await tx.parameter.findFirst({
          where: { name: { equals: normName } }
        });

        const pData = {
          name: normName,
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
        };

        if (!parameter) {
          parameter = await tx.parameter.create({
            data: pData
          });
        } else {
          // Keep shared ranges in sync
          parameter = await tx.parameter.update({
            where: { id: parameter.id },
            data: pData
          });
        }

        await tx.testParameter.create({
          data: {
            testId,
            parameterId: parameter.id,
            order: index + 1,
            isHeader: param.isHeader || false,
            isDeleted: false,
          }
        });
        index++;
      }
    }, {
      maxWait: 15000,
      timeout: 30000
    });

    return NextResponse.json({ success: true, message: "Parameters updated successfully." });
  } catch (error) {
    if (error.message === "NEXT_REDIRECT" || (error.digest && error.digest.startsWith("NEXT_REDIRECT"))) {
      return NextResponse.json({ success: false, error: "Unauthorized", message: "Unauthorized" }, { status: 401 });
    }
    console.error("Workspace Registration Parameters POST Error:", error);
    return NextResponse.json({ success: false, error: error.message, message: error.message }, { status: 500 });
  }
}
