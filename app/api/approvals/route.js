import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";

export async function GET() {
  try {
    await requireAdmin("admin:view");
    const users = await prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      include: { role: true },
    });
    
    // Strip sensitive fields
    const safeUsers = users.map((u) => {
      const { password, verificationToken, ...safe } = u;
      return safe;
    });

    return NextResponse.json({ success: true, users: safeUsers });
  } catch (error) {
    console.error("Workspace Approvals GET Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
