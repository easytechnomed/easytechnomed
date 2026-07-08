import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";

export async function GET() {
  try {
    const admin = await requireAdmin();

    const addressRecord = await prisma.adminAddress.findUnique({
      where: { adminId: admin.id },
    });

    return NextResponse.json({
      success: true,
      address: addressRecord || {
        address1: "",
        address2: "",
        city: "",
        state: "",
        pincode: "",
        country: "",
      },
    });
  } catch (error) {
    console.error("Admin Address GET Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const admin = await requireAdmin();
    const body = await req.json().catch(() => ({}));

    const { address1, address2, city, state, pincode, country } = body;

    const updatedAddress = await prisma.adminAddress.upsert({
      where: { adminId: admin.id },
      update: {
        address1: address1 ? address1.trim() : "",
        address2: address2 ? address2.trim() : "",
        city: city ? city.trim() : "",
        state: state ? state.trim() : "",
        pincode: pincode ? pincode.trim() : "",
        country: country ? country.trim() : "",
      },
      create: {
        adminId: admin.id,
        address1: address1 ? address1.trim() : "",
        address2: address2 ? address2.trim() : "",
        city: city ? city.trim() : "",
        state: state ? state.trim() : "",
        pincode: pincode ? pincode.trim() : "",
        country: country ? country.trim() : "",
      },
    });

    return NextResponse.json({
      success: true,
      message: "Address saved successfully!",
      address: updatedAddress,
    });
  } catch (error) {
    console.error("Admin Address POST Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
