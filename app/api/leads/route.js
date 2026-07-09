import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function POST(req) {
  try {
    const body = await req.json().catch(() => ({}));
    const contact = body.contact?.trim();

    if (!contact) {
      return NextResponse.json({ success: false, message: "Email or phone number is required." });
    }

    const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact);
    const isPhone = /^\+?[0-9\s-]{10,20}$/.test(contact);

    if (!isEmail && !isPhone) {
      return NextResponse.json({ success: false, message: "Please enter a valid email address or phone number." });
    }

    const type = isEmail ? "email" : "mobile";

    const existingLead = await prisma.lead.findUnique({
      where: { contact },
    });

    if (existingLead) {
      return NextResponse.json({ success: true, message: "You have already registered for the trial!" });
    }

    await prisma.lead.create({
      data: {
        contact,
        type,
      },
    });

    return NextResponse.json({ success: true, message: "Successfully registered for the 5-day free trial!" });
  } catch (error) {
    console.error("Lead Capture API Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
