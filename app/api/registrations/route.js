import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { z } from "zod";

// Helper to serialize Decimal and Dates
function serializeData(data) {
  return JSON.parse(JSON.stringify(data));
}

const generateRandomSuffix = (length = 4) => {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let result = "";
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

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
    const admin = await requireAdmin("REGISTRATION_READ");
    const searchParams = req.nextUrl.searchParams;
    const search = searchParams.get("search");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    // Pagination parameters
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "50");
    const skip = (page - 1) * limit;

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

    const [total, registrations] = await Promise.all([
      prisma.registration.count({ where }),
      prisma.registration.findMany({
        where,
        include: {
          refBy: true,
          tests: { include: { test: true } },
        },
        orderBy: { date: "desc" },
        skip,
        take: limit,
      })
    ]);

    return NextResponse.json({
      success: true,
      registrations: serializeData(registrations),
      total,
      page,
      limit
    });
  } catch (error) {
    if (error.message === "NEXT_REDIRECT" || (error.digest && error.digest.startsWith("NEXT_REDIRECT"))) {
      return NextResponse.json({ success: false, error: "Unauthorized", message: "Unauthorized" }, { status: 401 });
    }
    console.error("Workspace Registrations GET Error:", error);
    return NextResponse.json({ success: false, error: error.message, message: error.message }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const admin = await requireAdmin("REGISTRATION_WRITE");
    const body = await req.json().catch(() => ({}));
    const validatedData = registrationSchema.parse(body);
    console.log("validatedData", validatedData);

    const barcodeNumber = Math.floor(100000000 + Math.random() * 900000000);
    const barcode = `,EDT${barcodeNumber} ${barcodeNumber}`;

    const expRptDate = validatedData.expRptDate ? new Date(validatedData.expRptDate) : null;
    const sampleDate = validatedData.sampleDate ? new Date(validatedData.sampleDate) : null;

    const result = await prisma.$transaction(async (tx) => {
      // Atomic increment of workspace counter
      const workspace = await tx.workspace.update({
        where: { id: admin.workspaceId },
        data: {
          nextSequence: { increment: 1 }
        },
        select: {
          nextSequence: true
        }
      });

      const currentSeq = workspace.nextSequence - 1;
      const labId = String(currentSeq).padStart(3, '0');
      const randomPart = generateRandomSuffix(4);
      const regNo = `ETM-${randomPart}-${String(currentSeq).padStart(5, '0')}`;

      let refByIncentive = 0.00;
      let secondRefIncentive = 0.00;

      if (validatedData.refById) {
        const doc = await tx.doctor.findFirst({
          where: { id: validatedData.refById },
          select: { incentivePercent: true }
        });
        if (doc) refByIncentive = Number(doc.incentivePercent);
      }

      if (validatedData.secondRefById) {
        const doc = await tx.doctor.findFirst({
          where: { id: validatedData.secondRefById },
          select: { incentivePercent: true }
        });
        if (doc) secondRefIncentive = Number(doc.incentivePercent);
      }

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
          refByIncentivePercent: refByIncentive,
          secondRefIncentivePercent: secondRefIncentive,
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
          adminId: admin.id,
        },
      });

      if (validatedData.receivedAmount > 0) {
        await tx.registrationPayment.create({
          data: {
            registrationId: registration.id,
            amount: validatedData.receivedAmount,
            paymentMode: validatedData.paymentMode,
            paymentRefNo: validatedData.paymentRefNo,
            remark: "Initial Payment",
          },
        });
      }

      const selectedTests = await tx.test.findMany({
        where: { id: { in: validatedData.testIds } },
        select: { id: true, price: true }
      });
      const priceMap = {};
      selectedTests.forEach((t) => {
        priceMap[t.id] = t.price;
      });

      const registrationTests = validatedData.testIds.map((testId) => ({
        registrationId: registration.id,
        testId: testId,
        price: priceMap[testId] || 0.00,
      }));

      console.log(`Adding ${registrationTests.length} tests to registration ID ${registration.id}`);
      await tx.registrationTest.createMany({ data: registrationTests });
      return registration;
    });

    return NextResponse.json({ success: true, message: "Registration created successfully!", registration: serializeData(result) });
  } catch (error) {
    if (error.message === "NEXT_REDIRECT" || (error.digest && error.digest.startsWith("NEXT_REDIRECT"))) {
      return NextResponse.json({ success: false, error: "Unauthorized", message: "Unauthorized" }, { status: 401 });
    }
    console.error("Workspace Registrations POST Error:", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ success: false, error: error.errors[0]?.message || "Validation error", message: error.errors[0]?.message || "Validation error" }, { status: 400 });
    }
    return NextResponse.json({ success: false, error: error.message, message: error.message }, { status: 500 });
  }
}
