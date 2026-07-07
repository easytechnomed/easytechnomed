import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";

// Helper to serialize Decimal and Dates
function serializeData(data) {
  return JSON.parse(JSON.stringify(data));
}

export async function GET(req, { params }) {
  try {
    const admin = await requireAdmin("admin:view");
    const { id } = await params;
    const registrationId = parseInt(id);

    if (isNaN(registrationId)) {
      return NextResponse.json({ success: false, error: "Invalid registration ID" }, { status: 400 });
    }

    const registration = await prisma.registration.findFirst({
      where: { id: registrationId, workspaceId: admin.workspaceId },
      include: {
        tests: { include: { test: true } },
      },
    });

    if (!registration) {
      return NextResponse.json({ success: false, message: "Registration not found." }, { status: 404 });
    }

    return NextResponse.json({ success: true, registration: serializeData(registration) });
  } catch (error) {
    console.error("Workspace Registration Samples GET Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req, { params }) {
  try {
    const admin = await requireAdmin("admin:write");
    const { id } = await params;
    const registrationId = parseInt(id);
    const sampleData = await req.json().catch(() => ([]));

    if (isNaN(registrationId)) {
      return NextResponse.json({ success: false, error: "Invalid registration ID" }, { status: 400 });
    }

    const existing = await prisma.registration.findFirst({
      where: { id: registrationId, workspaceId: admin.workspaceId },
    });

    if (!existing) {
      return NextResponse.json({ success: false, message: "Registration not found or unauthorized." }, { status: 404 });
    }

    await prisma.$transaction(
      sampleData.map((s) =>
        prisma.registrationTest.update({
          where: {
            registrationId_testId: {
              registrationId,
              testId: s.testId,
            },
          },
          data: {
            sampleStatus: s.sampleStatus,
            sampleBarcode: s.sampleBarcode,
            sampleRemark: s.sampleRemark,
            sendTo: s.sendTo || "-NA-",
            expense: s.expense !== undefined ? parseFloat(s.expense) : 0.0,
            assessNo: s.assessNo || null,
            pathologist: s.pathologist || "-NA-",
            collectedBy: s.collectedBy || "-NA-",
            product: s.product || "-NA-",
          },
        })
      )
    );

    const firstBarcode = sampleData.find((s) => s.sampleBarcode)?.sampleBarcode;
    if (firstBarcode) {
      await prisma.registration.update({
        where: { id: registrationId },
        data: { barcode: firstBarcode },
      });
    }

    return NextResponse.json({ success: true, message: "Sample details saved successfully." });
  } catch (error) {
    console.error("Workspace Registration Samples POST Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
