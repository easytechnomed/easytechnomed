import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { z } from "zod";

// Helper to serialize Decimal and Dates
function serializeData(data) {
  return JSON.parse(JSON.stringify(data));
}

// Zod Schema for Registration
const registrationSchema = z.object({
  billOn: z.string().default("Patient Rate"),
  mobileNo: z.string().min(10, "Mobile number must be at least 10 digits"),
  title: z.string(),
  name: z.string().min(2, "Patient name must be at least 2 characters"),
  city: z.string().default("-NA-"),
  age: z.number().positive("Age must be positive"),
  ageUnit: z.string().default("Year"),
  gender: z.string(),
  refById: z.number().nullable().optional(),
  secondRefById: z.number().nullable().optional(),
  remark: z.string().nullable().optional(),
  colType: z.string().default("Camp"),
  expRptDate: z.string().nullable().optional(),
  sampleDate: z.string().nullable().optional(),
  sampleNo: z.string().nullable().optional(),
  sampleBy: z.string().default("-NA-"),
  paymentMode: z.string().default("Cash"),
  paymentRefNo: z.string().nullable().optional(),
  totalAmount: z.number().default(0),
  collectionCharge: z.number().default(0),
  discountPercent: z.number().default(0),
  discountAmount: z.number().default(0),
  receivedAmount: z.number().default(0),
  dueAmount: z.number().default(0),
  stickerCount: z.number().default(1),
  testIds: z.array(z.number()).min(1, "At least one test must be selected"),
});

export async function GET(req, { params }) {
  try {
    const admin = await requireAdmin("REGISTRATION_READ");
    const { id } = await params;
    const regId = parseInt(id);

    if (isNaN(regId)) {
      return NextResponse.json({ success: false, error: "Invalid registration ID" }, { status: 400 });
    }

    const registration = await prisma.registration.findFirst({
      where: { id: regId, workspaceId: admin.workspaceId, isDeleted: false },
      include: {
        tests: {
          include: {
            test: true,
          },
        },
        payments: {
          orderBy: {
            createdAt: "asc",
          },
        },
      },
    });

    if (!registration) {
      return NextResponse.json({ success: false, message: "Registration not found." }, { status: 404 });
    }

    return NextResponse.json({ success: true, registration: serializeData(registration) });
  } catch (error) {
    console.error("Workspace Registration GET ID Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PUT(req, { params }) {
  try {
    const admin = await requireAdmin("REGISTRATION_WRITE");
    const { id } = await params;
    const regId = parseInt(id);
    const body = await req.json().catch(() => ({}));

    if (isNaN(regId)) {
      return NextResponse.json({ success: false, error: "Invalid registration ID" }, { status: 400 });
    }

    const existing = await prisma.registration.findFirst({
      where: { id: regId, workspaceId: admin.workspaceId, isDeleted: false },
    });

    if (!existing) {
      return NextResponse.json({ success: false, message: "Registration not found or unauthorized." }, { status: 404 });
    }

    const validatedData = registrationSchema.parse(body);
    const expRptDate = validatedData.expRptDate ? new Date(validatedData.expRptDate) : null;
    const sampleDate = validatedData.sampleDate ? new Date(validatedData.sampleDate) : null;

    const result = await prisma.$transaction(async (tx) => {
      const registration = await tx.registration.update({
        where: { id: regId },
        data: {
          billOn: validatedData.billOn,
          mobileNo: validatedData.mobileNo,
          title: validatedData.title,
          name: validatedData.name,
          city: validatedData.city,
          age: validatedData.age,
          ageUnit: validatedData.ageUnit,
          gender: validatedData.gender,
          refById: validatedData.refById,
          secondRefId: validatedData.secondRefById,
          remark: validatedData.remark,
          colType: validatedData.colType,
          expRptDate,
          sampleDate,
          sampleNo: validatedData.sampleNo,
          sampleBy: validatedData.sampleBy,
          paymentMode: validatedData.paymentMode,
          paymentRefNo: validatedData.paymentRefNo,
          totalAmount: validatedData.totalAmount,
          collectionCharge: validatedData.collectionCharge,
          discountPercent: validatedData.discountPercent,
          discountAmount: validatedData.discountAmount,
          receivedAmount: validatedData.receivedAmount,
          dueAmount: validatedData.dueAmount,
          stickerCount: validatedData.stickerCount,
          status: validatedData.dueAmount > 0 ? "Pending" : "Completed",
        },
      });

      await tx.registrationTest.deleteMany({ where: { registrationId: regId } });
      const registrationTests = validatedData.testIds.map((testId) => ({
        registrationId: regId,
        testId: testId,
      }));
      await tx.registrationTest.createMany({ data: registrationTests });
      return registration;
    });

    return NextResponse.json({ success: true, message: "Registration updated successfully!", registration: serializeData(result) });
  } catch (error) {
    console.error("Workspace Registration PUT ID Error:", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ success: false, message: error.errors[0]?.message || "Validation error" }, { status: 400 });
    }
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(req, { params }) {
  try {
    const admin = await requireAdmin("REGISTRATION_DELETE");
    const { id } = await params;
    const regId = parseInt(id);

    if (isNaN(regId)) {
      return NextResponse.json({ success: false, error: "Invalid registration ID" }, { status: 400 });
    }

    const existing = await prisma.registration.findFirst({
      where: { id: regId, workspaceId: admin.workspaceId, isDeleted: false },
    });

    if (!existing) {
      return NextResponse.json({ success: false, message: "Registration not found or unauthorized." }, { status: 404 });
    }

    await prisma.registration.update({
      where: { id: regId },
      data: { isDeleted: true, deletedAt: new Date() },
    });
    return NextResponse.json({ success: true, message: "Registration deleted successfully." });
  } catch (error) {
    console.error("Workspace Registration DELETE ID Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
