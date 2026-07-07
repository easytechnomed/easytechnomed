import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import bcrypt from "bcryptjs";

export async function PUT(req) {
  try {
    const admin = await requireAdmin();
    const body = await req.json().catch(() => ({}));
    const { name, oldPassword, newPassword, confirmPassword } = body;

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

    const updateData = { name: name.trim() };

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
