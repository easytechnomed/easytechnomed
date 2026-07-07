import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { uploadFileToR2 } from "@/lib/r2";

export async function POST(req) {
  try {
    await requireAdmin();
    const formData = await req.formData();
    const file = formData.get("file");

    if (!file) {
      return NextResponse.json({ success: false, error: "No file provided." }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const result = await uploadFileToR2(buffer, file.name, file.type);
    return NextResponse.json(result);
  } catch (error) {
    console.error("Workspace Frame PDF Upload Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
