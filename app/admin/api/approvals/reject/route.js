import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { sendRejectionEmail } from "@/lib/mail";

export async function POST(req) {
  try {
    await requireAdmin("admin:reject");
    const body = await req.json().catch(() => ({}));
    const { userId } = body;

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return NextResponse.json({ success: false, message: "User not found" }, { status: 404 });

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { rejected: true, isApproved: false },
    });

    try {
      await sendRejectionEmail(updatedUser.email);
    } catch (mailErr) {
      console.error("Mail error during rejection:", mailErr);
    }

    return NextResponse.json({ success: true, message: `User ${updatedUser.name} rejected.` });
  } catch (error) {
    console.error("Workspace Reject POST Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
