import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { uploadFileToR2 } from "@/lib/r2";

export async function POST(req) {
  try {
    await requireAdmin("SETTINGS_WRITE");
    const formData = await req.formData();
    const file = formData.get("file");
    const requestedFolder = formData.get("folder") || "logos";

    if (!file) {
      return NextResponse.json({ success: false, error: "No file provided." }, { status: 400 });
    }

    const allowedFolders = ["frame-templates", "signatures", "logos"];
    const folder = allowedFolders.includes(requestedFolder) ? requestedFolder : "logos";

    if (folder === "frame-templates" && file.type !== "application/pdf") {
      return NextResponse.json({ success: false, error: "Only PDF files are allowed for letterhead templates." }, { status: 400 });
    }
    if ((folder === "signatures" || folder === "logos") && !file.type.startsWith("image/")) {
      return NextResponse.json({ success: false, error: "Only image files (PNG, JPG, JPEG) are allowed for signatures and logos." }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const result = await uploadFileToR2(buffer, file.name, file.type, folder);
    return NextResponse.json(result);
  } catch (error) {
    console.error("Workspace Media Upload Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
