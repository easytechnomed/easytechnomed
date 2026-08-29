import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { verifySuperAdminAPI } from "@/lib/auth";

export async function GET(req, { params }) {
  try {
    await verifySuperAdminAPI();
    const { id } = await params;
    const versionId = parseInt(id, 10);

    if (isNaN(versionId)) {
      return NextResponse.json({ success: false, error: "Invalid version ID." }, { status: 400 });
    }

    const appVersion = await prisma.appVersion.findUnique({
      where: { id: versionId },
    });

    if (!appVersion) {
      return NextResponse.json({ success: false, error: "App version not found." }, { status: 404 });
    }

    return NextResponse.json({ success: true, version: appVersion });
  } catch (error) {
    console.error("SuperAdmin AppVersion GET [id] Error:", error);
    const status = error.message === "Unauthorized" ? 401 : 500;
    return NextResponse.json({ success: false, error: error.message }, { status });
  }
}

export async function PUT(req, { params }) {
  try {
    await verifySuperAdminAPI();
    const { id } = await params;
    const versionId = parseInt(id, 10);

    if (isNaN(versionId)) {
      return NextResponse.json({ success: false, error: "Invalid version ID." }, { status: 400 });
    }

    const body = await req.json().catch(() => ({}));
    const version = body.version?.trim();
    const title = body.title?.trim();
    const description = body.description !== undefined ? body.description?.trim() || null : undefined;
    const changes = body.changes !== undefined ? body.changes?.trim() || null : undefined;
    const isMandatory = body.isMandatory !== undefined ? Boolean(body.isMandatory) : undefined;
    const isActive = body.isActive !== undefined ? Boolean(body.isActive) : undefined;
    const releaseDate = body.releaseDate ? new Date(body.releaseDate) : undefined;

    if (!version || !title) {
      return NextResponse.json(
        { success: false, error: "Version string and Title are required." },
        { status: 400 }
      );
    }

    // Verify existing record
    const existing = await prisma.appVersion.findUnique({
      where: { id: versionId },
    });

    if (!existing) {
      return NextResponse.json({ success: false, error: "App version not found." }, { status: 404 });
    }

    // Check version uniqueness if changed
    if (version !== existing.version) {
      const duplicate = await prisma.appVersion.findUnique({
        where: { version },
      });
      if (duplicate && duplicate.id !== versionId) {
        return NextResponse.json(
          { success: false, error: `Version "${version}" is already assigned to another release.` },
          { status: 409 }
        );
      }
    }

    const updateData = {
      version,
      title,
    };

    if (description !== undefined) updateData.description = description;
    if (changes !== undefined) updateData.changes = changes;
    if (isMandatory !== undefined) updateData.isMandatory = isMandatory;
    if (isActive !== undefined) updateData.isActive = isActive;
    if (releaseDate !== undefined) updateData.releaseDate = releaseDate;

    const updated = await prisma.appVersion.update({
      where: { id: versionId },
      data: updateData,
    });

    return NextResponse.json({
      success: true,
      message: `Version ${updated.version} updated successfully.`,
      version: updated,
    });
  } catch (error) {
    console.error("SuperAdmin AppVersion PUT Error:", error);
    const status = error.message === "Unauthorized" ? 401 : 500;
    return NextResponse.json({ success: false, error: error.message }, { status });
  }
}

export async function DELETE(req, { params }) {
  try {
    await verifySuperAdminAPI();
    const { id } = await params;
    const versionId = parseInt(id, 10);

    if (isNaN(versionId)) {
      return NextResponse.json({ success: false, error: "Invalid version ID." }, { status: 400 });
    }

    const existing = await prisma.appVersion.findUnique({
      where: { id: versionId },
    });

    if (!existing) {
      return NextResponse.json({ success: false, error: "App version not found." }, { status: 404 });
    }

    await prisma.appVersion.delete({
      where: { id: versionId },
    });

    return NextResponse.json({
      success: true,
      message: `Version ${existing.version} deleted successfully.`,
    });
  } catch (error) {
    console.error("SuperAdmin AppVersion DELETE Error:", error);
    const status = error.message === "Unauthorized" ? 401 : 500;
    return NextResponse.json({ success: false, error: error.message }, { status });
  }
}
