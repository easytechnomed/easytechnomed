import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";

export async function GET() {
  try {
    const admin = await requireAdmin();
    const adminRecord = await prisma.admin.findUnique({
      where: { id: admin.id },
      select: {
        name: true,
        email: true,
        framePdfUrl: true,
        headerMargin: true,
        footerMargin: true,
        useFrameDefault: true,
      },
    });
    return NextResponse.json({ success: true, settings: adminRecord });
  } catch (error) {
    console.error("Workspace Settings GET Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const admin = await requireAdmin();
    const body = await req.json().catch(() => ({}));
    const headerMargin = parseInt(body.headerMargin) || 140;
    const footerMargin = parseInt(body.footerMargin) || 100;
    const useFrameDefault = Boolean(body.useFrameDefault);
    const framePdfUrl = body.framePdfUrl || null;

    await prisma.admin.update({
      where: { id: admin.id },
      data: {
        framePdfUrl,
        headerMargin,
        footerMargin,
        useFrameDefault,
      },
    });

    return NextResponse.json({ success: true, message: "Settings saved successfully!" });
  } catch (error) {
    console.error("Workspace Settings POST Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
