import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { verifySuperAdminAPI } from "@/lib/auth";

export async function POST(req, { params }) {
  try {
    await verifySuperAdminAPI();
    const { id } = await params;
    const oldParameterId = parseInt(id);

    if (isNaN(oldParameterId)) {
      return NextResponse.json({ success: false, error: "Invalid parameter ID." }, { status: 400 });
    }

    const body = await req.json().catch(() => ({}));
    const { targetParameterId } = body;
    const targetId = parseInt(targetParameterId);

    if (isNaN(targetId)) {
      return NextResponse.json({ success: false, error: "Target parameter is required for re-mapping." }, { status: 400 });
    }

    if (oldParameterId === targetId) {
      return NextResponse.json({ success: false, error: "Cannot merge a parameter into itself." }, { status: 400 });
    }

    // Run merge & delete in transaction
    await prisma.$transaction(async (tx) => {
      // 1. Fetch all mappings for oldParameterId
      const oldMappings = await tx.testParameter.findMany({
        where: { parameterId: oldParameterId }
      });

      // 2. Resolve mappings to targetId
      for (const mapping of oldMappings) {
        // Check if the target parameter is already mapped to the test
        const targetMappingExists = await tx.testParameter.findFirst({
          where: {
            testId: mapping.testId,
            parameterId: targetId,
            isDeleted: false
          }
        });

        if (targetMappingExists) {
          // If already mapped to the target parameter, we delete the old mapping
          await tx.testParameter.delete({
            where: { id: mapping.id }
          });
        } else {
          // Otherwise, re-link/update the mapping to use the target parameter
          await tx.testParameter.update({
            where: { id: mapping.id },
            data: { parameterId: targetId }
          });
        }
      }

      // 3. Delete the old Parameter
      await tx.parameter.delete({
        where: { id: oldParameterId }
      });
    }, {
      maxWait: 5000,
      timeout: 10000
    });

    return NextResponse.json({ success: true, message: "Parameter merged and deleted successfully." });
  } catch (error) {
    console.error("SuperAdmin Parameter Merge/Delete Error:", error);
    const status = error.message === "Unauthorized" ? 401 : 500;
    return NextResponse.json({ success: false, error: error.message }, { status });
  }
}
