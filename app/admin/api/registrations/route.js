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

export async function GET(req) {
  try {
    const admin = await requireAdmin("admin:view");
    const searchParams = req.nextUrl.searchParams;
    const search = searchParams.get("search");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    const where = { workspaceId: admin.workspaceId, isDeleted: false };
    if (startDate || endDate) {
      where.date = {};
      if (startDate) where.date.gte = new Date(startDate);
      if (endDate) where.date.lte = new Date(endDate);
    }
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { regNo: { contains: search } },
        { mobileNo: { contains: search } },
      ];
    }

    const registrations = await prisma.registration.findMany({
      where,
      include: {
        refBy: true,
        tests: { include: { test: true } },
      },
      orderBy: { date: "desc" },
    });

    return NextResponse.json({ success: true, registrations: serializeData(registrations) });
  } catch (error) {
    console.error("Workspace Registrations GET Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const admin = await requireAdmin("admin:create");
    const body = await req.json().catch(() => ({}));
    const validatedData = registrationSchema.parse(body);

    const barcodeNumber = Math.floor(100000000 + Math.random() * 900000000);
    const barcode = `,EDT${barcodeNumber} ${barcodeNumber}`;

    const expRptDate = validatedData.expRptDate ? new Date(validatedData.expRptDate) : null;
    const sampleDate = validatedData.sampleDate ? new Date(validatedData.sampleDate) : null;

    let result;
    let attempts = 0;
    const maxAttempts = 10;

    while (attempts < maxAttempts) {
      try {
        result = await prisma.$transaction(async (tx) => {
          const count = await tx.registration.count();
          const nextVal = count + 1;
          const labId = String(519 + nextVal);
          const regNo = `QMP-${970282932 + nextVal}`;

          const registration = await tx.registration.create({
            data: {
              billOn: validatedData.billOn,
              mobileNo: validatedData.mobileNo,
              labId,
              regNo,
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
              barcode,
              status: validatedData.dueAmount > 0 ? "Pending" : "Completed",
              workspaceId: admin.workspaceId,
            },
          });

          const registrationTests = validatedData.testIds.map((testId) => ({
            registrationId: registration.id,
            testId: testId,
          }));

          await tx.registrationTest.createMany({ data: registrationTests });
          return registration;
        });

        break; // Success! Break out of the loop.
      } catch (error) {
        if (error.code === "P2002") {
          attempts++;
          if (attempts >= maxAttempts) {
            throw new Error("Failed to generate a unique registration number after multiple attempts. Please try again.");
          }
          // Brief random delay to minimize collision chance
          await new Promise((resolve) => setTimeout(resolve, Math.random() * 150));
          continue;
        }
        throw error; // Propagate other errors
      }
    }

    return NextResponse.json({ success: true, message: "Registration created successfully!", registration: serializeData(result) });
  } catch (error) {
    console.error("Workspace Registrations POST Error:", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ success: false, message: error.errors[0]?.message || "Validation error" }, { status: 400 });
    }
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
