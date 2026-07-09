import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { verifySuperAdminAPI } from "@/lib/auth";

export async function GET(req, { params }) {
  try {
    await verifySuperAdminAPI();
    const { id } = await params;
    const parameterId = parseInt(id);

    if (isNaN(parameterId)) {
      return NextResponse.json({ success: false, error: "Invalid parameter ID." }, { status: 400 });
    }

    // Find all active test parameter mappings, including parent test details
    const mappings = await prisma.testParameter.findMany({
      where: {
        parameterId,
        isDeleted: false
      },
      include: {
        test: {
          select: {
            id: true,
            name: true,
            code: true,
            workspaceId: true,
            workspace: {
              select: {
                name: true
              }
            }
          }
        }
      }
    });

    // Format tests list cleanly
    const tests = mappings
      .filter(m => m.test && !m.test.isDeleted)
      .map(m => ({
        id: m.test.id,
        name: m.test.name,
        code: m.test.code,
        workspace: m.test.workspace ? m.test.workspace.name : "Default Template"
      }));

    return NextResponse.json({
      success: true,
      tests
    });
  } catch (error) {
    console.error("SuperAdmin GET Parameter Usages Error:", error);
    const status = error.message === "Unauthorized" ? 401 : 500;
    return NextResponse.json({ success: false, error: error.message }, { status });
  }
}
