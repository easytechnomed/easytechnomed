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
      where: { workspaceId: admin.workspaceId, isDeleted: false },
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

    const newDoctor = await prisma.$transaction(async (tx) => {
      const doc = await tx.doctor.create({
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

      await tx.doctorIncentive.create({
        data: {
          doctorId: doc.id,
          incentivePercent: doc.incentivePercent,
        },
      });

      return doc;
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

export async function PUT(req) {
  try {
    const admin = await requireAdmin("DOCTOR_WRITE");
    const body = await req.json().catch(() => ({}));
    const { doctorId, name, code, incentivePercent, degree, address, clinicName } = body;

    if (!doctorId || isNaN(parseInt(doctorId))) {
      return NextResponse.json({ success: false, message: "Doctor ID is required." }, { status: 400 });
    }

    const existing = await prisma.doctor.findFirst({
      where: { id: parseInt(doctorId), workspaceId: admin.workspaceId, isDeleted: false }
    });

    if (!existing) {
      return NextResponse.json({ success: false, message: "Doctor not found." }, { status: 404 });
    }

    const updatedDoctor = await prisma.$transaction(async (tx) => {
      const updateData = {};
      if (name !== undefined) updateData.name = name.trim();
      if (code !== undefined) updateData.code = code ? code.trim() : null;
      if (degree !== undefined) updateData.degree = degree ? degree.trim() : null;
      if (address !== undefined) updateData.address = address ? address.trim() : null;
      if (clinicName !== undefined) updateData.clinicName = clinicName ? clinicName.trim() : null;
      if (incentivePercent !== undefined) updateData.incentivePercent = parseFloat(incentivePercent) || 0.00;

      const updated = await tx.doctor.update({
        where: { id: parseInt(doctorId) },
        data: updateData
      });

      // Log to history if incentive rate changed
      if (incentivePercent !== undefined && Number(updated.incentivePercent) !== Number(existing.incentivePercent)) {
        await tx.doctorIncentive.create({
          data: {
            doctorId: updated.id,
            incentivePercent: updated.incentivePercent,
          }
        });
      }

      return updated;
    });

    return NextResponse.json({
      success: true,
      message: "Doctor updated successfully!",
      doctor: serializeData(updatedDoctor)
    });
  } catch (error) {
    console.error("Workspace Doctors PUT Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(req) {
  try {
    const admin = await requireAdmin("DOCTOR_WRITE");
    const { searchParams } = new URL(req.url);
    const doctorId = searchParams.get("doctorId");

    if (!doctorId || isNaN(parseInt(doctorId))) {
      return NextResponse.json({ success: false, message: "Doctor ID is required." }, { status: 400 });
    }

    const existing = await prisma.doctor.findFirst({
      where: { id: parseInt(doctorId), workspaceId: admin.workspaceId, isDeleted: false }
    });

    if (!existing) {
      return NextResponse.json({ success: false, message: "Doctor not found." }, { status: 404 });
    }

    await prisma.doctor.update({
      where: { id: parseInt(doctorId) },
      data: {
        isDeleted: true,
        deletedAt: new Date()
      }
    });

    return NextResponse.json({
      success: true,
      message: "Doctor deleted successfully!"
    });
  } catch (error) {
    console.error("Workspace Doctors DELETE Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

