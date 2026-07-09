import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";

// Helper to serialize Decimal and Dates
function serializeData(data) {
  return JSON.parse(JSON.stringify(data));
}

export async function GET() {
  try {
    const admin = await requireAdmin("DOCTOR_READ");
    const doctors = await prisma.doctor.findMany({
      where: { workspaceId: admin.workspaceId },
      orderBy: { name: "asc" },
    });
    return NextResponse.json({ success: true, doctors: serializeData(doctors) });
  } catch (error) {
    console.error("Workspace Doctors GET Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const admin = await requireAdmin("DOCTOR_WRITE");
    const body = await req.json().catch(() => ({}));
    const { name, code, incentivePercent, degree, address, clinicName } = body;

    if (!name || typeof name !== "string" || name.trim() === "") {
      return NextResponse.json(
        { success: false, message: "Doctor name is required." },
        { status: 400 }
      );
    }

    let doctorCode = code ? code.trim() : null;

    if (doctorCode) {
      // Check if code is already used in this workspace
      const existingDoctor = await prisma.doctor.findFirst({
        where: {
          workspaceId: admin.workspaceId,
          code: doctorCode,
        },
      });

      if (existingDoctor) {
        return NextResponse.json(
          { success: false, message: `Doctor code "${doctorCode}" is already in use in this workspace.` },
          { status: 400 }
        );
      }
    } else {
      // Auto-generate code
      const docCount = await prisma.doctor.count({
        where: { workspaceId: admin.workspaceId },
      });
      let generatedCode = `DR-${docCount + 1}`;
      
      let isUnique = false;
      let counter = docCount + 1;
      while (!isUnique) {
        const existing = await prisma.doctor.findFirst({
          where: {
            workspaceId: admin.workspaceId,
            code: generatedCode,
          },
        });
        if (existing) {
          counter++;
          generatedCode = `DR-${counter}`;
        } else {
          isUnique = true;
        }
      }
      doctorCode = generatedCode;
    }

    const newDoctor = await prisma.doctor.create({
      data: {
        name: name.trim(),
        code: doctorCode,
        degree: degree ? degree.trim() : null,
        address: address ? address.trim() : null,
        clinicName: clinicName ? clinicName.trim() : null,
        incentivePercent: incentivePercent !== undefined ? parseFloat(incentivePercent) || 0 : 0.00,
        workspaceId: admin.workspaceId,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Doctor created successfully!",
      doctor: serializeData(newDoctor),
    });
  } catch (error) {
    console.error("Workspace Doctors POST Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

