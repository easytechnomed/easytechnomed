import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { verifySuperAdminAPI } from "@/lib/auth";

export async function GET(req, { params }) {
  try {
    await verifySuperAdminAPI();
    const { id: testIdParam } = await params;
    const testId = parseInt(testIdParam, 10);
    if (isNaN(testId)) {
      return NextResponse.json({ success: false, error: "Invalid test ID." }, { status: 400 });
    }

    const formulas = await prisma.testFormula.findMany({
      where: {
        testId,
        workspaceId: null,
        isActive: true
      },
      include: {
        outputParameter: true
      },
      orderBy: { id: "asc" }
    });

    return NextResponse.json({ success: true, formulas });
  } catch (error) {
    console.error("GET Formulas Error:", error);
    const status = error.message === "Unauthorized" ? 401 : 500;
    return NextResponse.json({ success: false, error: error.message }, { status });
  }
}

export async function POST(req, { params }) {
  try {
    await verifySuperAdminAPI();
    const { id: testIdParam } = await params;
    const testId = parseInt(testIdParam, 10);
    if (isNaN(testId)) {
      return NextResponse.json({ success: false, error: "Invalid test ID." }, { status: 400 });
    }

    const body = await req.json().catch(() => ({}));
    const { outputParameterId, formula, description, name } = body;

    if (!outputParameterId) {
      return NextResponse.json({ success: false, error: "Output parameter is required." }, { status: 400 });
    }
    if (!formula || !formula.trim()) {
      return NextResponse.json({ success: false, error: "Formula expression is required." }, { status: 400 });
    }

    // Check if formula already exists for this output parameter in default test
    const existing = await prisma.testFormula.findFirst({
      where: {
        testId,
        outputParameterId,
        workspaceId: null
      }
    });

    if (existing) {
      if (existing.isActive) {
        return NextResponse.json({
          success: false,
          error: "A calculation formula is already configured for this output parameter."
        }, { status: 400 });
      } else {
        // Reactivate and update
        const updated = await prisma.testFormula.update({
          where: { id: existing.id },
          data: {
            formula: formula.trim(),
            description: description || null,
            name: name || null,
            isActive: true
          },
          include: {
            outputParameter: true
          }
        });
        return NextResponse.json({ success: true, message: "Formula configured successfully.", formula: updated });
      }
    }

    const created = await prisma.testFormula.create({
      data: {
        testId,
        outputParameterId,
        formula: formula.trim(),
        description: description || null,
        name: name || null,
        workspaceId: null
      },
      include: {
        outputParameter: true
      }
    });

    return NextResponse.json({ success: true, message: "Formula created successfully.", formula: created });
  } catch (error) {
    console.error("POST Formula Error:", error);
    const status = error.message === "Unauthorized" ? 401 : 500;
    return NextResponse.json({ success: false, error: error.message }, { status });
  }
}

export async function PUT(req, { params }) {
  try {
    await verifySuperAdminAPI();
    const { id: testIdParam } = await params;
    const testId = parseInt(testIdParam, 10);
    if (isNaN(testId)) {
      return NextResponse.json({ success: false, error: "Invalid test ID." }, { status: 400 });
    }

    const body = await req.json().catch(() => ({}));
    const { id, formula, description, name, outputParameterId } = body;

    if (!id) {
      return NextResponse.json({ success: false, error: "Formula ID is required." }, { status: 400 });
    }
    if (!formula || !formula.trim()) {
      return NextResponse.json({ success: false, error: "Formula expression is required." }, { status: 400 });
    }

    // Verify ownership and existence
    const existing = await prisma.testFormula.findUnique({
      where: { id }
    });

    if (!existing || existing.testId !== testId || existing.workspaceId !== null) {
      return NextResponse.json({ success: false, error: "Formula not found." }, { status: 404 });
    }

    const updated = await prisma.testFormula.update({
      where: { id },
      data: {
        formula: formula.trim(),
        description: description || null,
        name: name || null,
        outputParameterId: outputParameterId || existing.outputParameterId
      },
      include: {
        outputParameter: true
      }
    });

    return NextResponse.json({ success: true, message: "Formula updated successfully.", formula: updated });
  } catch (error) {
    console.error("PUT Formula Error:", error);
    const status = error.message === "Unauthorized" ? 401 : 500;
    return NextResponse.json({ success: false, error: error.message }, { status });
  }
}

export async function DELETE(req, { params }) {
  try {
    await verifySuperAdminAPI();
    const { id: testIdParam } = await params;
    const testId = parseInt(testIdParam, 10);
    if (isNaN(testId)) {
      return NextResponse.json({ success: false, error: "Invalid test ID." }, { status: 400 });
    }

    const { searchParams } = new URL(req.url);
    const formulaId = parseInt(searchParams.get("formulaId"), 10);

    if (isNaN(formulaId)) {
      return NextResponse.json({ success: false, error: "Invalid formula ID." }, { status: 400 });
    }

    const existing = await prisma.testFormula.findUnique({
      where: { id: formulaId }
    });

    if (!existing || existing.testId !== testId || existing.workspaceId !== null) {
      return NextResponse.json({ success: false, error: "Formula not found." }, { status: 404 });
    }

    // Soft delete/deactivate formula
    await prisma.testFormula.update({
      where: { id: formulaId },
      data: {
        isActive: false
      }
    });

    return NextResponse.json({ success: true, message: "Formula deleted successfully." });
  } catch (error) {
    console.error("DELETE Formula Error:", error);
    const status = error.message === "Unauthorized" ? 401 : 500;
    return NextResponse.json({ success: false, error: error.message }, { status });
  }
}
