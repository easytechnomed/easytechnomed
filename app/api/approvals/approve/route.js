import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { sendApprovalEmail } from "@/lib/mail";

export async function POST(req) {
  try {
    await requireAdmin("APPROVAL_WRITE");
    const body = await req.json().catch(() => ({}));
    const { userId } = body;

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return NextResponse.json({ success: false, message: "User not found" }, { status: 404 });

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { isApproved: true, rejected: false },
    });

    try {
      await sendApprovalEmail(updatedUser.email);
    } catch (mailErr) {
      console.error("Mail error during approval:", mailErr);
    }

    return NextResponse.json({ success: true, message: `User ${updatedUser.name} approved.` });
  } catch (error) {
    console.error("Workspace Approve POST Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
