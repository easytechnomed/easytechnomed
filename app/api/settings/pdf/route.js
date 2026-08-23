import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";

export const DEFAULT_COLUMN_ORDER = [
  { id: "sNo", label: "S/No", widthRatio: 0.08, align: "left", visible: true },
  { id: "parameter", label: "Test Parameter", widthRatio: 0.38, align: "left", visible: true },
  { id: "value", label: "Observed Value", widthRatio: 0.20, align: "left", visible: true },
  { id: "unit", label: "Unit", widthRatio: 0.12, align: "left", visible: true },
  { id: "range", label: "Normal Reference Range", widthRatio: 0.22, align: "left", visible: true },
];

export const DEFAULT_PDF_SETTINGS = {
  framePdfUrl: null,
  useFrameDefault: true,
  headerMargin: 140,
  footerMargin: 100,
  leftMargin: 45,
  rightMargin: 45,
  primaryColor: "#0f766e",
  headerBgColor: "#e2e8f0",
  headerTextColor: "#1e293b",
  textColor: "#0f172a",
  patientCardBgColor: "#f8fafc",
  patientCardBorderColor: "#e2e8f0",
  tableRowBorderColor: "#e2e8f0",
  departmentTextColor: "#ffffff",
  fontFamily: "Helvetica",
  headerFontSize: 9.0,
  parameterFontSize: 8.5,
  patientInfoFontSize: 9.0,
  departmentFontSize: 9.5,
  remarkFontSize: 8.5,
  columnOrder: JSON.stringify(DEFAULT_COLUMN_ORDER),
  authorizedSignatoryName1: "",
  authorizedSignatoryDegree1: "",
  authorizedSignatoryName2: "",
  authorizedSignatoryDegree2: "",
  showSignatures: true,
  showQrCode: true,
  showDepartmentBanner: true,
  showPatientBox: true,
};

export async function GET() {
  try {
    const admin = await requireAdmin("SETTINGS_READ");
    const workspaceId = admin.workspaceId;

    if (!workspaceId) {
      return NextResponse.json({ success: false, error: "No workspace associated with this admin" }, { status: 400 });
    }

    let pdfConfig = await prisma.workspacePdf.findUnique({
      where: { workspaceId },
    });

    const adminRecord = await prisma.admin.findUnique({
      where: { id: admin.id },
      select: {
        framePdfUrl: true,
        headerMargin: true,
        footerMargin: true,
        useFrameDefault: true,
        authorizedSignatoryName1: true,
        authorizedSignatoryDegree1: true,
        authorizedSignatoryName2: true,
        authorizedSignatoryDegree2: true,
      },
    });

    if (!pdfConfig) {
      pdfConfig = {
        ...DEFAULT_PDF_SETTINGS,
        workspaceId,
        framePdfUrl: adminRecord?.framePdfUrl || null,
        headerMargin: adminRecord?.headerMargin ?? 140,
        footerMargin: adminRecord?.footerMargin ?? 100,
        useFrameDefault: adminRecord?.useFrameDefault ?? true,
        authorizedSignatoryName1: adminRecord?.authorizedSignatoryName1 || "",
        authorizedSignatoryDegree1: adminRecord?.authorizedSignatoryDegree1 || "",
        authorizedSignatoryName2: adminRecord?.authorizedSignatoryName2 || "",
        authorizedSignatoryDegree2: adminRecord?.authorizedSignatoryDegree2 || "",
      };
    } else {
      // Ensure columnOrder has valid fallback if null or corrupted
      if (!pdfConfig.columnOrder) {
        pdfConfig.columnOrder = JSON.stringify(DEFAULT_COLUMN_ORDER);
      }
    }

    return NextResponse.json({ success: true, settings: pdfConfig });
  } catch (error) {
    if (error.message === "NEXT_REDIRECT" || (error.digest && error.digest.startsWith("NEXT_REDIRECT"))) {
      return NextResponse.json({ success: false, error: "Unauthorized", message: "Unauthorized" }, { status: 401 });
    }
    console.error("PDF Settings GET Error:", error);
    return NextResponse.json({ success: false, error: error.message, message: error.message }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const admin = await requireAdmin("SETTINGS_WRITE");
    const workspaceId = admin.workspaceId;

    if (!workspaceId) {
      return NextResponse.json({ success: false, error: "No workspace associated with this admin" }, { status: 400 });
    }

    const body = await req.json().catch(() => ({}));

    // Normalize column order
    let columnOrderStr = body.columnOrder;
    if (Array.isArray(columnOrderStr)) {
      columnOrderStr = JSON.stringify(columnOrderStr);
    } else if (typeof columnOrderStr !== "string") {
      columnOrderStr = JSON.stringify(DEFAULT_COLUMN_ORDER);
    }

    const payload = {
      framePdfUrl: body.framePdfUrl || null,
      useFrameDefault: body.useFrameDefault !== undefined ? Boolean(body.useFrameDefault) : true,
      headerMargin: parseInt(body.headerMargin) || 140,
      footerMargin: parseInt(body.footerMargin) || 100,
      leftMargin: parseInt(body.leftMargin) || 45,
      rightMargin: parseInt(body.rightMargin) || 45,
      primaryColor: body.primaryColor || "#0f766e",
      headerBgColor: body.headerBgColor || "#e2e8f0",
      headerTextColor: body.headerTextColor || "#1e293b",
      textColor: body.textColor || "#0f172a",
      patientCardBgColor: body.patientCardBgColor || "#f8fafc",
      patientCardBorderColor: body.patientCardBorderColor || "#e2e8f0",
      tableRowBorderColor: body.tableRowBorderColor || "#e2e8f0",
      departmentTextColor: body.departmentTextColor || "#ffffff",
      fontFamily: body.fontFamily || "Helvetica",
      headerFontSize: parseFloat(body.headerFontSize) || 9.0,
      parameterFontSize: parseFloat(body.parameterFontSize) || 8.5,
      patientInfoFontSize: parseFloat(body.patientInfoFontSize) || 9.0,
      departmentFontSize: parseFloat(body.departmentFontSize) || 9.5,
      remarkFontSize: parseFloat(body.remarkFontSize) || 8.5,
      columnOrder: columnOrderStr,
      authorizedSignatoryName1: body.authorizedSignatoryName1 || null,
      authorizedSignatoryDegree1: body.authorizedSignatoryDegree1 || null,
      authorizedSignatoryName2: body.authorizedSignatoryName2 || null,
      authorizedSignatoryDegree2: body.authorizedSignatoryDegree2 || null,
      showSignatures: body.showSignatures !== undefined ? Boolean(body.showSignatures) : true,
      showQrCode: body.showQrCode !== undefined ? Boolean(body.showQrCode) : true,
      showDepartmentBanner: body.showDepartmentBanner !== undefined ? Boolean(body.showDepartmentBanner) : true,
      showPatientBox: body.showPatientBox !== undefined ? Boolean(body.showPatientBox) : true,
    };

    const saved = await prisma.workspacePdf.upsert({
      where: { workspaceId },
      create: {
        workspaceId,
        ...payload,
      },
      update: {
        ...payload,
      },
    });

    // Also keep legacy admin fields in sync
    await prisma.admin.update({
      where: { id: admin.id },
      data: {
        framePdfUrl: payload.framePdfUrl,
        headerMargin: payload.headerMargin,
        footerMargin: payload.footerMargin,
        useFrameDefault: payload.useFrameDefault,
        authorizedSignatoryName1: payload.authorizedSignatoryName1,
        authorizedSignatoryDegree1: payload.authorizedSignatoryDegree1,
        authorizedSignatoryName2: payload.authorizedSignatoryName2,
        authorizedSignatoryDegree2: payload.authorizedSignatoryDegree2,
      },
    }).catch(() => {});

    return NextResponse.json({
      success: true,
      message: "PDF configuration saved successfully!",
      settings: saved,
    });
  } catch (error) {
    if (error.message === "NEXT_REDIRECT" || (error.digest && error.digest.startsWith("NEXT_REDIRECT"))) {
      return NextResponse.json({ success: false, error: "Unauthorized", message: "Unauthorized" }, { status: 401 });
    }
    console.error("PDF Settings POST Error:", error);
    return NextResponse.json({ success: false, error: error.message, message: error.message }, { status: 500 });
  }
}
