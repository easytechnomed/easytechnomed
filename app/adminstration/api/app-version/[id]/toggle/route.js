import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { verifySuperAdminAPI } from "@/lib/auth";

export async function PATCH(req, { params }) {
  try {
    await verifySuperAdminAPI();
    const { id } = await params;
    const versionId = parseInt(id, 10);

    if (isNaN(versionId)) {
      return NextResponse.json({ success: false, error: "Invalid version ID." }, { status: 400 });
    }

    const body = await req.json().catch(() => ({}));
    const { field } = body; // "isActive" or "isMandatory"

    if (!["isActive", "isMandatory"].includes(field)) {
      return NextResponse.json(
        { success: false, error: "Invalid toggle field. Must be 'isActive' or 'isMandatory'." },
        { status: 400 }
      );
    }

    const existing = await prisma.appVersion.findUnique({
      where: { id: versionId },
    });

    if (!existing) {
      return NextResponse.json({ success: false, error: "App version not found." }, { status: 404 });
    }

    const newValue = !existing[field];

    const updated = await prisma.appVersion.update({
      where: { id: versionId },
      data: {
        [field]: newValue,
      },
    });

    return NextResponse.json({
      success: true,
      message: `Version ${updated.version} ${field} set to ${newValue ? "enabled" : "disabled"}.`,
      version: updated,
    });
  } catch (error) {
    console.error("SuperAdmin AppVersion Toggle PATCH Error:", error);
    const status = error.message === "Unauthorized" ? 401 : 500;
    return NextResponse.json({ success: false, error: error.message }, { status });
  }
}
