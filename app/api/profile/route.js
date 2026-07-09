import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import bcrypt from "bcryptjs";

export async function GET() {
  try {
    const admin = await requireAdmin();
    const adminRecord = await prisma.admin.findUnique({
      where: { id: admin.id },
      include: {
        role: {
          include: {
            permissions: true,
          },
        },
      },
    });

    if (!adminRecord) {
      return NextResponse.json({ success: false, error: "Admin profile not found" }, { status: 404 });
    }

    const permissions = adminRecord.role?.permissions.map(p => p.permission) || [];

    return NextResponse.json({
      success: true,
      admin: {
        id: adminRecord.id,
        name: adminRecord.name,
        email: adminRecord.email,
        companyName: adminRecord.companyName,
        mobileNumber: adminRecord.mobileNumber,
        role: {
          name: adminRecord.role?.name || "Admin",
          permissions,
        },
      },
    });
  } catch (error) {
    if (error.message === "NEXT_REDIRECT" || (error.digest && error.digest.startsWith("NEXT_REDIRECT"))) {
      const digest = error.digest || "";
      if (digest.includes("error=deactivated")) {
        return NextResponse.json({ success: false, error: "deactivated", message: "Your account is deactivated." }, { status: 401 });
      }
      return NextResponse.json({ success: false, error: "Unauthorized", message: "Unauthorized" }, { status: 401 });
    }
    console.error("Workspace Admin Profile GET Error:", error);
    return NextResponse.json({ success: false, error: error.message, message: error.message }, { status: 500 });
  }
}

export async function PUT(req) {
  try {
    const admin = await requireAdmin("SETTINGS_WRITE");
    const body = await req.json().catch(() => ({}));
    const { name, oldPassword, newPassword, confirmPassword, companyName, mobileNumber } = body;

    if (!name || typeof name !== "string" || name.trim() === "") {
      return NextResponse.json(
        { success: false, message: "Name is required." },
        { status: 400 }
      );
    }

    // Fetch full admin record with password
    const adminRecord = await prisma.admin.findUnique({
      where: { id: admin.id },
    });

    if (!adminRecord) {
      return NextResponse.json(
        { success: false, message: "Admin not found." },
        { status: 404 }
      );
    }

    const updateData = {
      name: name.trim(),
      companyName: companyName ? companyName.trim() : null,
      mobileNumber: mobileNumber ? mobileNumber.trim() : null,
    };

    // If attempting to change password
    if (oldPassword) {
      if (!newPassword || !confirmPassword) {
        return NextResponse.json(
          { success: false, message: "New password and confirm password are required to change password." },
          { status: 400 }
        );
      }

      if (newPassword !== confirmPassword) {
        return NextResponse.json(
          { success: false, message: "New passwords do not match." },
          { status: 400 }
        );
      }

      // Check current password
      const isMatch = await bcrypt.compare(oldPassword, adminRecord.password);
      if (!isMatch) {
        return NextResponse.json(
          { success: false, message: "Incorrect current password." },
          { status: 400 }
        );
      }

      if (newPassword.length < 6) {
        return NextResponse.json(
          { success: false, message: "New password must be at least 6 characters." },
          { status: 400 }
        );
      }

      // Hash and set new password
      const hashedPassword = await bcrypt.hash(newPassword, 10);
      updateData.password = hashedPassword;
    }

    await prisma.admin.update({
      where: { id: admin.id },
      data: updateData,
    });

    return NextResponse.json({
      success: true,
      message: "Profile updated successfully!",
    });
  } catch (error) {
    console.error("Workspace Admin Profile PUT Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
