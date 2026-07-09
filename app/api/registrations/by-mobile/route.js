import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";

// Helper to serialize Decimal and Dates
function serializeData(data) {
  return JSON.parse(JSON.stringify(data));
}

export async function GET(req) {
  try {
    const admin = await requireAdmin("REGISTRATION_READ");
    const searchParams = req.nextUrl.searchParams;
    const mobileNo = searchParams.get("mobileNo");

    if (!mobileNo || mobileNo.trim().length !== 10) {
      return NextResponse.json(
        { success: false, message: "Valid 10-digit mobile number is required." },
        { status: 400 }
      );
    }

    const registrations = await prisma.registration.findMany({
      where: {
        workspaceId: admin.workspaceId,
        mobileNo: mobileNo.trim(),
        isDeleted: false,
      },
      orderBy: { date: "desc" },
    });

    const patientsMap = new Map();
    for (const reg of registrations) {
      const key = `${reg.name.toLowerCase().trim()}_${reg.gender}_${reg.age}_${reg.ageUnit}`;
      if (!patientsMap.has(key)) {
        patientsMap.set(key, {
          title: reg.title,
          name: reg.name,
          gender: reg.gender,
          age: reg.age,
          ageUnit: reg.ageUnit,
          city: reg.city,
        });
      }
    }

    const patients = Array.from(patientsMap.values());

    return NextResponse.json({ success: true, patients: serializeData(patients) });
  } catch (error) {
    if (error.message === "NEXT_REDIRECT" || (error.digest && error.digest.startsWith("NEXT_REDIRECT"))) {
      return NextResponse.json({ success: false, error: "Unauthorized", message: "Unauthorized" }, { status: 401 });
    }
    console.error("Workspace Registrations GET by mobile Error:", error);
    return NextResponse.json({ success: false, error: error.message, message: error.message }, { status: 500 });
  }
}
