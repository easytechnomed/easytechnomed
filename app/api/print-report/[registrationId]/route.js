import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { PDFDocument, rgb } from "pdf-lib";
import { cookies } from "next/headers";
import { verifyToken } from "@/lib/auth";
import {
  hexToRgb,
  getFontFamilyDefinitions,
  computeColumnLayout,
  DEFAULT_COLUMNS,
  DEFAULT_PDF_SETTINGS
} from "@/lib/pdfTheme";

const isQualitativeAbnormal = (valStr, refRangeStr = "") => {
  if (!valStr || typeof valStr !== "string") return false;
  const valLower = valStr.trim().toLowerCase();
  const refLower = (refRangeStr || "").trim().toLowerCase();

  // If matches ref exactly, it's normal
  if (refLower && valLower === refLower) return false;

  // Abnormal keywords
  if (valLower.includes("reactive") && !valLower.includes("non")) return true;
  if (valLower.includes("positive") && !valLower.includes("non")) return true;
  if (valLower.includes("present") && !valLower.includes("absent")) return true;
  if (valLower.includes("detected") && !valLower.includes("not")) return true;
  if (["abnormal", "trace", "seen", "+", "++", "+++", "++++", "1+", "2+", "3+", "4+", "cloudy", "turbid", "hazy"].some(k => valLower === k || (k.startsWith("+") && valLower.includes(k)))) {
    return true;
  }

  // Normal keywords
  if (valLower.includes("negative") || valLower.includes("non-reactive") || valLower.includes("non reactive") || valLower.includes("nonreactive") || valLower.includes("absent") || valLower.includes("not detected") || valLower === "nil" || valLower === "normal" || valLower === "clear") {
    return false;
  }

  // If normal range expects negative/absent/nil and value is different
  if (refLower.includes("negative") && valLower.includes("positive")) return true;
  if ((refLower.includes("non-reactive") || refLower.includes("non reactive")) && valLower.includes("reactive") && !valLower.includes("non")) return true;
  if ((refLower.includes("absent") || refLower.includes("nil")) && valLower.includes("present")) return true;

  return false;
};

const isOutOfRange = (valStr, min, max, refRangeStr = "") => {
  if (!valStr) return false;
  const valRaw = String(valStr).trim();
  const num = parseFloat(valRaw);
  if (!isNaN(num) && /^-?\d+(\.\d+)?$/.test(valRaw) && (min !== null || max !== null)) {
    if (min !== null && min !== undefined && num < min) return true;
    if (max !== null && max !== undefined && num > max) return true;
    return false;
  }
  return isQualitativeAbnormal(valRaw, refRangeStr);
};

const getReferenceRange = (param, reg) => {
  const isBaby = reg.ageUnit !== "Year" || reg.age < 12;
  if (isBaby) {
    return {
      rangeStr: param.normalRangeBaby || param.normalRangeDefault || "",
      min: param.minValBaby,
      max: param.maxValBaby,
    };
  }
  if (reg.gender === "Female") {
    return {
      rangeStr: param.normalRangeFemale || param.normalRangeDefault || "",
      min: param.minValFemale,
      max: param.maxValFemale,
    };
  }
  return {
    rangeStr: param.normalRangeMale || param.normalRangeDefault || "",
    min: param.minValMale,
    max: param.maxValMale,
  };
};

const formatDate = (dateStr) => {
  if (!dateStr) return "-";
  const d = new Date(dateStr);
  return d.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
};

export async function GET(req, { params }) {
  try {
    const { registrationId } = await params;
    let regId = parseInt(registrationId);
    let reg = null;

    if (!isNaN(regId)) {
      // First try to find by integer ID
      reg = await prisma.registration.findFirst({
        where: { id: regId, isDeleted: false },
        include: {
          refBy: true,
          tests: {
            include: {
              test: {
                include: {
                  department: true,
                  parameters: {
                    where: { isDeleted: false },
                    orderBy: { order: "asc" },
                    include: { parameter: true }
                  },
                },
              },
            },
          },
          results: true,
        },
      });
    }

    if (!reg) {
      // Find by barcode, regNo, or labId
      reg = await prisma.registration.findFirst({
        where: {
          isDeleted: false,
          OR: [
            { barcode: { contains: registrationId } },
            { regNo: registrationId },
            { labId: registrationId }
          ]
        },
        include: {
          refBy: true,
          tests: {
            include: {
              test: {
                include: {
                  department: true,
                  parameters: {
                    where: { isDeleted: false },
                    orderBy: { order: "asc" },
                    include: { parameter: true }
                  },
                },
              },
            },
          },
          results: true,
        },
      });
    }

    if (!reg) {
      return new Response("Registration not found", { status: 404 });
    }

    // Filter tests by testIds query parameter if specified
    const searchParams = req.nextUrl?.searchParams || new URL(req.url).searchParams;
    const testIdsParam = searchParams.get("testIds");

    if (testIdsParam && reg.tests) {
      const allowedTestIds = new Set(
        testIdsParam
          .split(",")
          .map((s) => parseInt(s.trim()))
          .filter((n) => !isNaN(n))
      );
      if (allowedTestIds.size > 0) {
        reg.tests = reg.tests.filter((t) => allowedTestIds.has(t.testId) || allowedTestIds.has(t.test?.id));
      }
    }

    const cookieStore = await cookies();
    const isAdminToken = cookieStore.get("admin_session_token")?.value;
    const isSuperAdminToken = cookieStore.get("super_admin_session_token")?.value;

    let isStaff = false;

    if (isAdminToken) {
      const decoded = verifyToken(isAdminToken);
      if (decoded) {
        const session = await prisma.adminSession.findUnique({
          where: { token: isAdminToken },
          include: { admin: true },
        });
        if (session && session.expiresAt > new Date() && session.admin.isActive) {
          const admin = session.admin;
          if (admin.workspaceId !== reg.workspaceId) {
            return new Response("Unauthorized: You do not have permission to access reports from this laboratory.", { status: 403 });
          }
          isStaff = true;
        }
      }
    }

    if (isSuperAdminToken) {
      const decoded = verifyToken(isSuperAdminToken);
      if (decoded) {
        const session = await prisma.superAdminSession.findUnique({
          where: { token: isSuperAdminToken },
        });
        if (session && session.expiresAt > new Date()) {
          isStaff = true;
        }
      }
    }

    if (!isStaff && parseFloat(reg.dueAmount || 0) > 0 && reg.status === "Completed") {
      const htmlMsg = `
        <html>
          <head>
            <meta charset="UTF-8">
            <title>Report Hold - Pending Dues</title>
            <style>
              body { font-family: 'Arial', sans-serif; background-color: #f8fafc; color: #1e293b; display: flex; justify-content: center; align-items: center; min-height: 100vh; margin: 0; padding: 20px; text-align: center; }
              .card { background: white; padding: 40px; border-radius: 16px; box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1); max-width: 500px; width: 100%; border-top: 4px solid #ef4444; }
              .icon { font-size: 48px; margin-bottom: 20px; }
              h1 { font-size: 22px; margin-bottom: 12px; font-weight: 800; color: #ef4444; }
              p { font-size: 15px; line-height: 1.6; color: #475569; margin-bottom: 24px; }
              .details { background: #f1f5f9; padding: 12px; border-radius: 8px; font-size: 13px; text-align: left; margin-bottom: 24px; }
              .details-row { display: flex; justify-content: space-between; margin-bottom: 6px; }
              .details-row:last-child { margin-bottom: 0; }
              .button { display: inline-block; background-color: #0f766e; color: white; padding: 10px 24px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 14px; transition: background-color 0.2s; }
              .button:hover { background-color: #0d5c56; }
            </style>
          </head>
          <body>
            <div class="card">
              <div class="icon">⚠️</div>
              <h1>Report on Hold</h1>
              <p>Your report is complete, but because of outstanding dues, it cannot be displayed. Please contact the laboratory to clear your balance.</p>
              <div class="details">
                <div class="details-row"><strong>Patient Name:</strong> <span>${reg.title} ${reg.name}</span></div>
                <div class="details-row"><strong>Reg No:</strong> <span>${reg.regNo}</span></div>
                <div class="details-row"><strong>Pending Dues:</strong> <span>₹${parseFloat(reg.dueAmount).toFixed(2)}</span></div>
              </div>
              <a href="/api/print-bill/${reg.id}" target="_blank" class="button">View & Pay Bill</a>
            </div>
          </body>
        </html>
      `;
      return new Response(htmlMsg, {
        status: 200,
        headers: { "Content-Type": "text/html; charset=utf-8" },
      });
    }

    // Flatten parameter fields so downstream PDF drawing logic sees them directly
    if (reg.tests) {
      reg.tests.forEach(t => {
        if (t.test && t.test.parameters) {
          t.test.parameters = t.test.parameters.map(tp => {
            if (tp.parameter) {
              const { parameter, ...rest } = tp;
              return {
                ...rest,
                name: parameter.name,
                unit: tp.unit || parameter.unit,
                minValMale: parameter.minValMale,
                maxValMale: parameter.maxValMale,
                normalRangeMale: parameter.normalRangeMale,
                minValFemale: parameter.minValFemale,
                maxValFemale: parameter.maxValFemale,
                normalRangeFemale: parameter.normalRangeFemale,
                minValBaby: parameter.minValBaby,
                maxValBaby: parameter.maxValBaby,
                normalRangeBaby: parameter.normalRangeBaby,
                normalRangeDefault: parameter.normalRangeDefault,
              };
            }
            return tp;
          });
        }
      });
    }

    // Retrieve active PDF configuration from WorkspacePdf (with fallback to admin)
    let workspacePdf = null;
    if (reg.workspaceId) {
      workspacePdf = await prisma.workspacePdf.findUnique({
        where: { workspaceId: reg.workspaceId },
      });
    }

    const configAdmin = await prisma.admin.findFirst({
      where: { workspaceId: reg.workspaceId },
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

    const withFrameParam = searchParams.get("withFrame");

    // Determine whether to use frame
    let useFrame = workspacePdf?.useFrameDefault ?? configAdmin?.useFrameDefault ?? true;
    if (withFrameParam !== null) {
      useFrame = withFrameParam === "true";
    }

    const framePdfUrl = workspacePdf?.framePdfUrl || configAdmin?.framePdfUrl;
    const headerMargin = workspacePdf?.headerMargin ?? configAdmin?.headerMargin ?? 140;
    const footerMargin = workspacePdf?.footerMargin ?? configAdmin?.footerMargin ?? 100;
    const leftMargin = workspacePdf?.leftMargin ?? 45;
    const rightMargin = workspacePdf?.rightMargin ?? 45;

    // Colors
    const primaryColor = hexToRgb(workspacePdf?.primaryColor || "#0f766e", { r: 0.06, g: 0.46, b: 0.43 });
    const headerBgColor = hexToRgb(workspacePdf?.headerBgColor || "#e2e8f0", { r: 0.88, g: 0.91, b: 0.94 });
    const headerTextColor = hexToRgb(workspacePdf?.headerTextColor || "#1e293b", { r: 0.12, g: 0.16, b: 0.23 });
    const textColor = hexToRgb(workspacePdf?.textColor || "#0f172a", { r: 0.09, g: 0.12, b: 0.18 });
    const mutedTextColor = hexToRgb(workspacePdf?.textColor || "#0f172a", { r: 0.35, g: 0.4, b: 0.45 });
    const patientCardBgColor = hexToRgb(workspacePdf?.patientCardBgColor || "#f8fafc", { r: 0.97, g: 0.98, b: 0.99 });
    const patientCardBorderColor = hexToRgb(workspacePdf?.patientCardBorderColor || "#e2e8f0", { r: 0.85, g: 0.88, b: 0.92 });
    const tableRowBorderColor = hexToRgb(workspacePdf?.tableRowBorderColor || "#e2e8f0", { r: 0.88, g: 0.91, b: 0.94 });
    const departmentTextColor = hexToRgb(workspacePdf?.departmentTextColor || "#ffffff", { r: 1, g: 1, b: 1 });

    // Typography
    const fontFamily = workspacePdf?.fontFamily || "Helvetica";
    const headerFontSize = workspacePdf?.headerFontSize ?? 9.0;
    const parameterFontSize = workspacePdf?.parameterFontSize ?? 8.5;
    const patientInfoFontSize = workspacePdf?.patientInfoFontSize ?? 9.0;
    const departmentFontSize = workspacePdf?.departmentFontSize ?? 9.5;
    const remarkFontSize = workspacePdf?.remarkFontSize ?? 8.5;

    // Column Configuration
    const columnOrderRaw = workspacePdf?.columnOrder || JSON.stringify(DEFAULT_COLUMNS);

    // Signatories & Toggles
    const authorizedSignatoryName1 = workspacePdf?.authorizedSignatoryName1 || configAdmin?.authorizedSignatoryName1 || "";
    const authorizedSignatoryDegree1 = workspacePdf?.authorizedSignatoryDegree1 || configAdmin?.authorizedSignatoryDegree1 || "";
    const authorizedSignatoryName2 = workspacePdf?.authorizedSignatoryName2 || configAdmin?.authorizedSignatoryName2 || "";
    const authorizedSignatoryDegree2 = workspacePdf?.authorizedSignatoryDegree2 || configAdmin?.authorizedSignatoryDegree2 || "";

    const showSignatures = workspacePdf?.showSignatures ?? true;
    const showQrCode = workspacePdf?.showQrCode ?? true;
    const showDepartmentBanner = workspacePdf?.showDepartmentBanner ?? true;
    const showPatientBox = workspacePdf?.showPatientBox ?? true;

    // Create a new PDF document
    const pdfDoc = await PDFDocument.create();
    const fontDefs = getFontFamilyDefinitions(fontFamily);
    const font = await pdfDoc.embedFont(fontDefs.regular);
    const fontBold = await pdfDoc.embedFont(fontDefs.bold);
    const fontOblique = await pdfDoc.embedFont(fontDefs.oblique);

    // Fetch and embed QR Code image
    let qrImage = null;
    if (showQrCode) {
      try {
        const cleanBarcode = reg.barcode ? reg.barcode.replace(/^,\s*/, "").split(" ")[0] : null;
        const qrData = `${req.nextUrl.origin}/api/print-report/${cleanBarcode || reg.id}?withFrame=true`;
        const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(qrData)}`;
        const qrRes = await fetch(qrUrl);
        if (qrRes.ok) {
          const qrBytes = await qrRes.arrayBuffer();
          qrImage = await pdfDoc.embedPng(qrBytes);
        }
      } catch (err) {
        console.error("Failed to fetch/embed QR code:", err);
      }
    }

    // Load frame template if needed
    let framePdfDoc = null;
    if (useFrame && framePdfUrl) {
      try {
        const frameRes = await fetch(framePdfUrl);
        const frameBytes = await frameRes.arrayBuffer();
        framePdfDoc = await PDFDocument.load(frameBytes);
      } catch (err) {
        console.error("Failed to load frame PDF template:", err);
      }
    }

    const pageWidth = 595.27; // A4 Width
    const pageHeight = 842.89; // A4 Height
    const contentWidth = pageWidth - leftMargin - rightMargin;

    let currentPage = null;
    let pageCount = 0;

    const addNewPage = async () => {
      pageCount++;
      if (framePdfDoc && framePdfDoc.getPageCount() > 0) {
        const [copiedPage] = await pdfDoc.copyPages(framePdfDoc, [0]);
        currentPage = pdfDoc.addPage(copiedPage);
      } else {
        currentPage = pdfDoc.addPage([pageWidth, pageHeight]);
        if (!useFrame) {
          drawDefaultHeaderFooter(currentPage);
        }
      }
      return currentPage;
    };

    const drawDefaultHeaderFooter = (page) => {
      // Default blank page footer
      page.drawText("Report generated automatically by PathLab System. All rights reserved.", {
        x: leftMargin,
        y: 40,
        size: 8,
        font: font,
        color: rgb(0.4, 0.45, 0.5),
      });
      page.drawLine({
        start: { x: leftMargin, y: 55 },
        end: { x: pageWidth - rightMargin, y: 55 },
        thickness: 0.5,
        color: rgb(0.8, 0.8, 0.8),
      });
    };

    // Helper to draw text
    const drawText = (page, text, x, y, size = 9, isBold = false, color = textColor, customFont = null) => {
      let cleanText = String(text || "")
        .replace(/[μµ]/g, "u")
        .replace(/–/g, "-")
        .replace(/—/g, "-")
        .replace(/[“”]/g, '"')
        .replace(/[‘’]/g, "'");
      const chosenFont = customFont || (isBold ? fontBold : font);
      page.drawText(cleanText, {
        x,
        y,
        size,
        font: chosenFont,
        color,
      });
    };

    /**
     * Splits text into paragraphs and word tokens supporting **bold** markdown
     */
    const parseMarkdownTokens = (text) => {
      const cleanText = String(text || "")
        .replace(/[μµ]/g, "u")
        .replace(/–/g, "-")
        .replace(/—/g, "-")
        .replace(/[“”]/g, '"')
        .replace(/[‘’]/g, "'");

      const rawLines = cleanText.split("\n");
      const paragraphs = [];

      for (const rawLine of rawLines) {
        const lineTokens = [];
        const regex = /(\*\*.*?\*\*)|([^\*]+|\*)/g;
        let match;
        while ((match = regex.exec(rawLine)) !== null) {
          const chunk = match[0];
          if (chunk.startsWith("**") && chunk.endsWith("**") && chunk.length >= 4) {
            const boldContent = chunk.slice(2, -2);
            const words = boldContent.split(/(\s+)/);
            words.forEach((w) => {
              if (w) lineTokens.push({ text: w, isBold: true, isSpace: /^\s+$/.test(w) });
            });
          } else {
            const words = chunk.split(/(\s+)/);
            words.forEach((w) => {
              if (w) lineTokens.push({ text: w, isBold: false, isSpace: /^\s+$/.test(w) });
            });
          }
        }
        paragraphs.push(lineTokens);
      }
      return paragraphs;
    };

    /**
     * Word-wraps markdown paragraphs into lines fitting within maxWidth
     */
    const layoutMarkdownLines = (paragraphs, maxWidth, fontSize) => {
      const formattedLines = [];

      for (const tokens of paragraphs) {
        if (tokens.length === 0) {
          formattedLines.push([]);
          continue;
        }

        let currentLine = [];
        let currentLineWidth = 0;

        for (const token of tokens) {
          const activeFont = token.isBold ? fontBold : font;
          const tokenWidth = activeFont.widthOfTextAtSize(token.text, fontSize);

          if (currentLineWidth + tokenWidth > maxWidth && currentLine.length > 0 && !token.isSpace) {
            formattedLines.push(currentLine);
            currentLine = [];
            currentLineWidth = 0;
          }

          if (currentLine.length === 0 && token.isSpace) {
            continue;
          }

          currentLine.push({
            text: token.text,
            isBold: token.isBold,
            width: tokenWidth,
          });
          currentLineWidth += tokenWidth;
        }

        if (currentLine.length > 0) {
          formattedLines.push(currentLine);
        }
      }

      return formattedLines;
    };

    // Calculate dynamic column layout
    const columnsLayout = computeColumnLayout(columnOrderRaw, leftMargin, contentWidth);

    // Helper to draw Patient Demographics Box on any page
    const drawPatientDemographics = (page) => {
      if (!showPatientBox) {
        return pageHeight - headerMargin - 15;
      }

      const topY = pageHeight - headerMargin - 15;
      const boxHeight = 70;

      page.drawRectangle({
        x: leftMargin,
        y: topY - boxHeight,
        width: contentWidth,
        height: boxHeight,
        borderColor: patientCardBorderColor,
        borderWidth: 1,
        color: patientCardBgColor,
      });

      const col1X = leftMargin + 12;
      const col2X = leftMargin + (contentWidth / 2) + 10;
      const labelW = 75;

      drawText(page, `Patient Name:`, col1X, topY - 20, patientInfoFontSize, true, textColor);
      drawText(page, `${reg.title} ${reg.name}`, col1X + labelW, topY - 20, patientInfoFontSize, false, textColor);

      drawText(page, `Age / Gender:`, col2X, topY - 20, patientInfoFontSize, true, textColor);
      drawText(page, `${reg.age.toFixed(2)} ${reg.ageUnit} / ${reg.gender}`, col2X + labelW, topY - 20, patientInfoFontSize, false, textColor);

      drawText(page, `Lab No / ID:`, col1X, topY - 40, patientInfoFontSize, true, textColor);
      drawText(page, `${reg.labId} (${reg.regNo})`, col1X + labelW, topY - 40, patientInfoFontSize, false, textColor);

      drawText(page, `Ref. Doctor:`, col1X, topY - 60, patientInfoFontSize, true, textColor);
      drawText(page, `${reg.refBy?.name || "Self / Walk-in"}`, col1X + labelW, topY - 60, patientInfoFontSize, false, textColor);

      drawText(page, `Registered On:`, col2X, topY - 40, patientInfoFontSize, true, textColor);
      drawText(page, `${formatDate(reg.date)}`, col2X + labelW, topY - 40, patientInfoFontSize, false, textColor);

      drawText(page, `Report Status:`, col2X, topY - 60, patientInfoFontSize, true, textColor);
      drawText(page, `${reg.status}`, col2X + labelW, topY - 60, patientInfoFontSize, true, reg.status === "Completed" ? rgb(0.06, 0.46, 0.23) : rgb(0.72, 0.44, 0.05));

      return topY - boxHeight - 12;
    };

    // Helper to draw Department Header Banner
    const drawDepartmentHeader = (page, y, departmentName, isContinued = false) => {
      if (!showDepartmentBanner) {
        return y;
      }

      const barHeight = 20;
      page.drawRectangle({
        x: leftMargin,
        y: y - barHeight,
        width: contentWidth,
        height: barHeight,
        color: primaryColor,
      });

      const titleText = isContinued
        ? `DEPARTMENT: ${String(departmentName || "GENERAL PATHOLOGY").toUpperCase()} (Continued)`
        : `DEPARTMENT: ${String(departmentName || "GENERAL PATHOLOGY").toUpperCase()}`;

      drawText(page, titleText, leftMargin + 10, y - 14, departmentFontSize, true, departmentTextColor);
      return y - barHeight - 8;
    };

    // Helper to draw Table Header
    const drawTableHeader = (page, y) => {
      const thHeight = 20;
      page.drawRectangle({
        x: leftMargin,
        y: y - thHeight,
        width: contentWidth,
        height: thHeight,
        color: headerBgColor,
      });

      for (const col of columnsLayout) {
        let textX = col.x + 4;
        const textWidth = fontBold.widthOfTextAtSize(col.label, headerFontSize);
        if (col.align === "center") {
          textX = col.x + (col.width - textWidth) / 2;
        } else if (col.align === "right") {
          textX = col.x + col.width - textWidth - 4;
        }
        drawText(page, col.label, Math.max(col.x + 2, textX), y - 14, headerFontSize, true, headerTextColor);
      }

      page.drawLine({
        start: { x: leftMargin, y: y - thHeight - 1 },
        end: { x: pageWidth - rightMargin, y: y - thHeight - 1 },
        thickness: 0.8,
        color: tableRowBorderColor,
      });

      return y - thHeight - 4;
    };

    // Map result values and interpretations for easy access
    const resultsMap = {};
    const flagsMap = {};
    const interpretationsMap = {};
    reg.results.forEach((r) => {
      resultsMap[r.testParameterId] = r.value;
      flagsMap[r.testParameterId] = r.flag;
      interpretationsMap[r.testParameterId] = r.interpretation;
    });

    // Group tests by department
    const departmentGroups = [];
    const deptMap = new Map();

    if (reg.tests && reg.tests.length > 0) {
      for (const regTest of reg.tests) {
        const dept = regTest.test?.department;
        const deptId = dept?.id || "general";
        const deptName = dept?.name || "General Pathology";

        if (!deptMap.has(deptId)) {
          const group = {
            id: deptId,
            name: deptName,
            tests: [],
          };
          deptMap.set(deptId, group);
          departmentGroups.push(group);
        }
        deptMap.get(deptId).tests.push(regTest);
      }
    }

    // Sort departments: HAEMATOLOGY (1st priority) -> BIOCHEMISTRY (2nd priority) -> Rest
    const getDepartmentPriority = (name) => {
      const norm = String(name || "").toUpperCase().trim();
      if (norm.includes("HAEMATOLOGY") || norm.includes("HEMATOLOGY")) return 1;
      if (norm.includes("BIOCHEMISTRY")) return 2;
      return 3;
    };

    departmentGroups.sort((a, b) => {
      const prioA = getDepartmentPriority(a.name);
      const prioB = getDepartmentPriority(b.name);
      if (prioA !== prioB) {
        return prioA - prioB;
      }
      return (a.name || "").localeCompare(b.name || "");
    });

    // Helper to identify CBC test
    const isCbcTest = (testName, testCode) => {
      const name = String(testName || "").toUpperCase().trim();
      const code = String(testCode || "").toUpperCase().trim();
      if (code === "CBC" || code.startsWith("CBC")) return true;
      if (name.includes("CBC")) return true;
      if (name.includes("COMPLETE BLOOD COUNT")) return true;
      if (name.includes("COMPLETE BLOOD PICTURE")) return true;
      if (name.includes("COMPLETE HEMOGRAM") || name.includes("COMPLETE HAEMOGRAM")) return true;
      if (name.includes("HAEMOGRAM") || name.includes("HEMOGRAM")) return true;
      return false;
    };

    // Sort tests within each department so CBC is always on top
    departmentGroups.forEach((group) => {
      group.tests.sort((a, b) => {
        const aIsCbc = isCbcTest(a.test?.name, a.test?.code);
        const bIsCbc = isCbcTest(b.test?.name, b.test?.code);
        if (aIsCbc && !bIsCbc) return -1;
        if (!aIsCbc && bIsCbc) return 1;
        return 0;
      });
    });

    let tableActiveY = pageHeight - headerMargin - 15;

    if (departmentGroups.length === 0) {
      await addNewPage();
      tableActiveY = drawPatientDemographics(currentPage);
    }

    // Render reports grouped by Department, each department starting on a new page
    for (let dIdx = 0; dIdx < departmentGroups.length; dIdx++) {
      const deptGroup = departmentGroups[dIdx];

      // Each department starts on a new page!
      await addNewPage();
      let currentY = drawPatientDemographics(currentPage);
      currentY = drawDepartmentHeader(currentPage, currentY, deptGroup.name, false);
      tableActiveY = drawTableHeader(currentPage, currentY);

      for (const regTest of deptGroup.tests) {
        const test = regTest.test;
        const params = test.parameters || [];

        // Test Heading
        if (tableActiveY < footerMargin + 50) {
          await addNewPage();
          let pageTopY = drawPatientDemographics(currentPage);
          pageTopY = drawDepartmentHeader(currentPage, pageTopY, deptGroup.name, true);
          tableActiveY = drawTableHeader(currentPage, pageTopY);
        }

        // Draw Test Name group header
        currentPage.drawRectangle({
          x: leftMargin,
          y: tableActiveY - 20,
          width: contentWidth,
          height: 18,
          color: rgb(0.96, 0.97, 0.98),
        });
        drawText(currentPage, `${test.name}`, leftMargin + 10, tableActiveY - 13, parameterFontSize + 0.5, true, primaryColor);
        tableActiveY -= 20;

        // Group parameters by section
        const sectionsMap = {};
        const sectionOrder = [];
        params.forEach(param => {
          const sec = param.section || "Default";
          if (!sectionsMap[sec]) {
            sectionsMap[sec] = [];
            sectionOrder.push(sec);
          }
          sectionsMap[sec].push(param);
        });

        for (const secName of sectionOrder) {
          const sectionParams = sectionsMap[secName];

          if (secName !== "Default") {
            // Check page wrap for section header
            if (tableActiveY < footerMargin + 35) {
              await addNewPage();
              let pageTopY = drawPatientDemographics(currentPage);
              pageTopY = drawDepartmentHeader(currentPage, pageTopY, deptGroup.name, true);
              tableActiveY = drawTableHeader(currentPage, pageTopY);
            }

            // Draw Section Header divider line
            currentPage.drawLine({
              start: { x: leftMargin, y: tableActiveY },
              end: { x: pageWidth - rightMargin, y: tableActiveY },
              thickness: 0.3,
              color: tableRowBorderColor,
            });
            drawText(currentPage, secName.toUpperCase(), leftMargin + 10, tableActiveY - 14, parameterFontSize - 0.5, true, mutedTextColor);
            tableActiveY -= 18;
          }

          // Build render groups: prefer explicit parentId, fallback to positional
          const renderGroups = [];
          const hasParentIdData = sectionParams.some(p => p.parentId != null);

          if (hasParentIdData) {
            const childrenByParentId = {};
            sectionParams.forEach(p => {
              if (p.parentId != null) {
                if (!childrenByParentId[p.parentId]) childrenByParentId[p.parentId] = [];
                childrenByParentId[p.parentId].push(p);
              }
            });
            const childParamIds = new Set(
              sectionParams.filter(p => p.parentId != null).map(p => p.id)
            );

            for (const p of sectionParams) {
              if (childParamIds.has(p.id)) continue;
              const pRef = getReferenceRange(p, reg);
              const pIsHeader = p.isHeader || (!p.unit && (!pRef?.rangeStr || pRef.rangeStr === "" || pRef.rangeStr === "-NA-"));
              if (pIsHeader) {
                renderGroups.push({ type: "group", header: p, children: childrenByParentId[p.id] || [] });
              } else {
                renderGroups.push({ type: "standalone", param: p });
              }
            }
          } else {
            let gi = 0;
            while (gi < sectionParams.length) {
              const p = sectionParams[gi];
              const pRef = getReferenceRange(p, reg);
              const pIsHeader = p.isHeader || (!p.unit && (!pRef || !pRef.rangeStr || pRef.rangeStr === "" || pRef.rangeStr === "-NA-"));
              if (pIsHeader) {
                const children = [];
                let ci = gi + 1;
                while (ci < sectionParams.length) {
                  const cp = sectionParams[ci];
                  const cpRef = getReferenceRange(cp, reg);
                  const cpIsHeader = cp.isHeader || (!cp.unit && (!cpRef || !cpRef.rangeStr || cpRef.rangeStr === "" || cpRef.rangeStr === "-NA-"));
                  if (cpIsHeader) break;
                  children.push(cp);
                  ci++;
                }
                renderGroups.push({ type: "group", header: p, children });
                gi = ci;
              } else {
                renderGroups.push({ type: "standalone", param: p });
                gi++;
              }
            }
          }

          // Helper to draw a single data row with dynamic columns
          const drawParamRow = async (param, indented, serialNo = "") => {
            const rawVal = resultsMap[param.id];
            const val = rawVal ?? "";
            const flag = flagsMap[param.id];
            const interpretation = interpretationsMap[param.id];
            const ref = getReferenceRange(param, reg);

            // Skip rows with no result
            if (rawVal === null || rawVal === undefined || val === "" || val === "-") return;

            // Page-wrap check
            if (tableActiveY < footerMargin + 35) {
              await addNewPage();
              let pageTopY = drawPatientDemographics(currentPage);
              pageTopY = drawDepartmentHeader(currentPage, pageTopY, deptGroup.name, true);
              tableActiveY = drawTableHeader(currentPage, pageTopY);
              currentPage.drawRectangle({ x: leftMargin, y: tableActiveY - 20, width: contentWidth, height: 18, color: rgb(0.96, 0.97, 0.98) });
              drawText(currentPage, `${test.name} - Continued`, leftMargin + 10, tableActiveY - 13, parameterFontSize + 0.5, true, primaryColor);
              tableActiveY -= 20;
            }

            currentPage.drawLine({
              start: { x: leftMargin, y: tableActiveY },
              end: { x: pageWidth - rightMargin, y: tableActiveY },
              thickness: 0.3,
              color: tableRowBorderColor,
            });

            const isAbnormal = flag ? flag !== "Normal" : isOutOfRange(val, ref.min, ref.max, ref.rangeStr);
            const resultColor = isAbnormal ? rgb(0.85, 0.12, 0.12) : textColor;

            let formattedVal = val;
            const isNumeric = (param.valueType || "NUMERIC") === "NUMERIC";
            if (val !== "" && isNumeric && /^-?\d+(\.\d+)?$/.test(String(val).trim())) {
              const num = parseFloat(val);
              if (!isNaN(num)) formattedVal = num.toFixed(param.decimalPlace ?? 2);
            }

            let displayVal = formattedVal;
            if (flag && flag !== "Normal" && val !== "") {
              const abbrs = { "Low": "L", "High": "H", "Critical Low": "CL*", "Critical High": "CH*", "Borderline Low": "BL", "Borderline High": "BH" };
              if (abbrs[flag]) displayVal = `${formattedVal} (${abbrs[flag]})`;
            }

            const displayName = indented ? `  -  ${param.name}` : param.name;
            const unitText = (param.unit && param.unit !== "-" && param.unit !== "null" && param.unit !== "undefined") ? String(param.unit).trim() : "";

            // Render each dynamic column
            for (const col of columnsLayout) {
              let cellText = "";
              let isBoldCell = false;
              let cellColor = textColor;
              let xIndent = 0;

              if (col.id === "sNo") {
                cellText = serialNo ? String(serialNo) : "";
                cellColor = indented ? mutedTextColor : textColor;
                isBoldCell = !indented;
              } else if (col.id === "parameter") {
                cellText = displayName;
                cellColor = textColor;
                isBoldCell = false;
                if (indented) xIndent = 6;
              } else if (col.id === "value") {
                cellText = displayVal || "-";
                cellColor = resultColor;
                isBoldCell = isAbnormal;
              } else if (col.id === "unit") {
                cellText = unitText;
                cellColor = mutedTextColor;
              } else if (col.id === "range") {
                cellText = ref.rangeStr || "";
                cellColor = textColor;
              }

              const activeFont = isBoldCell ? fontBold : font;
              let textX = col.x + 4 + xIndent;
              const textWidth = activeFont.widthOfTextAtSize(cellText, parameterFontSize);

              if (col.align === "center") {
                textX = col.x + (col.width - textWidth) / 2;
              } else if (col.align === "right") {
                textX = col.x + col.width - textWidth - 4;
              }

              drawText(currentPage, cellText, textX, tableActiveY - 14, parameterFontSize, isBoldCell, cellColor);
            }

            tableActiveY -= 20;

            if (interpretation) {
              if (tableActiveY < footerMargin + 25) {
                await addNewPage();
                let pageTopY = drawPatientDemographics(currentPage);
                pageTopY = drawDepartmentHeader(currentPage, pageTopY, deptGroup.name, true);
                tableActiveY = drawTableHeader(currentPage, pageTopY);
              }
              const paramCol = columnsLayout.find(c => c.id === "parameter") || columnsLayout[0];
              drawText(currentPage, `* Note: ${interpretation}`, paramCol.x + (indented ? 12 : 4), tableActiveY - 12, 7.5, false, mutedTextColor);
              tableActiveY -= 15;
            }
          };

          let mainCounter = 0;

          for (const group of renderGroups) {
            if (group.type === "standalone") {
              const v = resultsMap[group.param.id];
              if (v !== null && v !== undefined && v !== "" && v !== "-") {
                mainCounter++;
                await drawParamRow(group.param, false, `${mainCounter}`);
              }
            } else {
              const { header, children } = group;
              const activeChildren = children.filter(c => {
                const v = resultsMap[c.id];
                return v !== null && v !== undefined && v !== "" && v !== "-";
              });
              if (activeChildren.length === 0) continue;

              mainCounter++;
              const headerSerial = `${mainCounter}.`;

              // Draw header row
              if (tableActiveY < footerMargin + 35) {
                await addNewPage();
                let pageTopY = drawPatientDemographics(currentPage);
                pageTopY = drawDepartmentHeader(currentPage, pageTopY, deptGroup.name, true);
                tableActiveY = drawTableHeader(currentPage, pageTopY);
                currentPage.drawRectangle({ x: leftMargin, y: tableActiveY - 20, width: contentWidth, height: 18, color: rgb(0.96, 0.97, 0.98) });
                drawText(currentPage, `${test.name} - Continued`, leftMargin + 10, tableActiveY - 13, parameterFontSize + 0.5, true, primaryColor);
                tableActiveY -= 20;
              }
              currentPage.drawLine({
                start: { x: leftMargin, y: tableActiveY },
                end: { x: pageWidth - rightMargin, y: tableActiveY },
                thickness: 0.3,
                color: tableRowBorderColor,
              });

              const sNoCol = columnsLayout.find(c => c.id === "sNo");
              const paramCol = columnsLayout.find(c => c.id === "parameter") || columnsLayout[0];

              if (sNoCol) {
                drawText(currentPage, headerSerial, sNoCol.x + 4, tableActiveY - 14, parameterFontSize, true, primaryColor);
              }
              drawText(currentPage, header.name, paramCol.x + 4, tableActiveY - 14, parameterFontSize, true, primaryColor);
              tableActiveY -= 20;

              // Draw children (indented) with sub-numbering 1.1, 1.2...
              let childCounter = 0;
              for (const child of activeChildren) {
                childCounter++;
                const childSerial = `${mainCounter}.${childCounter}`;

                if (tableActiveY < footerMargin + 35) {
                  await addNewPage();
                  let pageTopY = drawPatientDemographics(currentPage);
                  pageTopY = drawDepartmentHeader(currentPage, pageTopY, deptGroup.name, true);
                  tableActiveY = drawTableHeader(currentPage, pageTopY);
                  currentPage.drawRectangle({ x: leftMargin, y: tableActiveY - 20, width: contentWidth, height: 18, color: rgb(0.96, 0.97, 0.98) });
                  drawText(currentPage, `${test.name} - Continued`, leftMargin + 10, tableActiveY - 13, parameterFontSize + 0.5, true, primaryColor);
                  tableActiveY -= 20;
                  currentPage.drawLine({
                    start: { x: leftMargin, y: tableActiveY },
                    end: { x: pageWidth - rightMargin, y: tableActiveY },
                    thickness: 0.3,
                    color: tableRowBorderColor,
                  });
                  if (sNoCol) {
                    drawText(currentPage, headerSerial, sNoCol.x + 4, tableActiveY - 14, parameterFontSize, true, primaryColor);
                  }
                  drawText(currentPage, `${header.name} (cont.)`, paramCol.x + 4, tableActiveY - 14, parameterFontSize, true, primaryColor);
                  tableActiveY -= 20;
                }
                await drawParamRow(child, true, childSerial);
              }
            }
          }
        }

        // Draw Test level Clinical Interpretation and Comments
        if (regTest.interpretation) {
          if (tableActiveY < footerMargin + 55) {
            await addNewPage();
            let pageTopY = drawPatientDemographics(currentPage);
            pageTopY = drawDepartmentHeader(currentPage, pageTopY, deptGroup.name, true);
            tableActiveY = drawTableHeader(currentPage, pageTopY);
          }

          // Draw comment box
          currentPage.drawRectangle({
            x: leftMargin,
            y: tableActiveY - 35,
            width: contentWidth,
            height: 30,
            color: patientCardBgColor,
            borderColor: patientCardBorderColor,
            borderWidth: 0.5
          });

          drawText(currentPage, "Clinical Interpretation & Comments:", leftMargin + 10, tableActiveY - 11, remarkFontSize - 0.5, true, primaryColor);
          drawText(currentPage, regTest.interpretation, leftMargin + 10, tableActiveY - 23, remarkFontSize - 1, false, textColor);
          tableActiveY -= 45;
        }

        // Bottom spacer after test group
        tableActiveY -= 10;
      }
    }

    // 3. Draw Remarks & Pathologist Signatures
    if (tableActiveY < footerMargin + 120) {
      await addNewPage();
      tableActiveY = drawPatientDemographics(currentPage);
    }

    // Draw Report Remarks / Summary Note Box with Markdown & Text Wrapping
    if (reg.remark && reg.remark.trim()) {
      const lineHeight = 11.5;
      const boxPaddingX = 10;
      const boxPaddingY = 8;
      const titleHeight = 14;
      const maxTextWidth = contentWidth - boxPaddingX * 2;

      const paragraphs = parseMarkdownTokens(reg.remark.trim());
      const wrappedLines = layoutMarkdownLines(paragraphs, maxTextWidth, remarkFontSize);

      const textBlockHeight = wrappedLines.length * lineHeight;
      const totalBoxHeight = titleHeight + textBlockHeight + boxPaddingY * 2;

      // Check if box fits on current page before footer margin
      if (tableActiveY - totalBoxHeight < footerMargin + 80) {
        await addNewPage();
        tableActiveY = drawPatientDemographics(currentPage);
      }

      const boxTopY = tableActiveY - 5;
      const boxBottomY = boxTopY - totalBoxHeight;

      // Draw background rectangle containing the whole remark
      currentPage.drawRectangle({
        x: leftMargin,
        y: boxBottomY,
        width: contentWidth,
        height: totalBoxHeight,
        borderColor: patientCardBorderColor,
        borderWidth: 0.5,
        color: patientCardBgColor,
      });

      // Draw Title
      let textCursorY = boxTopY - boxPaddingY - 4;
      drawText(
        currentPage,
        "Report Remarks / Summary Note:",
        leftMargin + boxPaddingX,
        textCursorY,
        remarkFontSize,
        true,
        primaryColor
      );

      textCursorY -= lineHeight + 2;

      // Draw wrapped lines with inline bold/regular segments
      for (const line of wrappedLines) {
        let textCursorX = leftMargin + boxPaddingX;
        for (const segment of line) {
          currentPage.drawText(segment.text, {
            x: textCursorX,
            y: textCursorY,
            size: remarkFontSize,
            font: segment.isBold ? fontBold : font,
            color: textColor,
          });
          textCursorX += segment.width;
        }
        textCursorY -= lineHeight;
      }

      tableActiveY = boxBottomY - 15;
    }

    // Double check spacing for signatures
    if (tableActiveY < footerMargin + 80) {
      await addNewPage();
      tableActiveY = drawPatientDemographics(currentPage);
    }

    // Draw Pathologist Signatures and QR Code
    if (showSignatures) {
      const sigY = tableActiveY - 50;

      const hasSig1 = !!(authorizedSignatoryName1 && authorizedSignatoryName1.trim());
      const hasSig2 = !!(authorizedSignatoryName2 && authorizedSignatoryName2.trim());

      // Left: Authorized Signatory 1
      if (hasSig1) {
        currentPage.drawLine({
          start: { x: leftMargin + 15, y: sigY + 12 },
          end: { x: leftMargin + 155, y: sigY + 12 },
          thickness: 0.5,
          color: rgb(0.6, 0.6, 0.6),
        });
        drawText(currentPage, authorizedSignatoryName1, leftMargin + 15, sigY, parameterFontSize + 0.5, true, textColor);
        if (authorizedSignatoryDegree1) {
          drawText(currentPage, authorizedSignatoryDegree1, leftMargin + 15, sigY - 12, parameterFontSize - 0.5, false, mutedTextColor);
        }
      }

      // Center: QR Code & Verification Label
      if (showQrCode && qrImage) {
        const qrSize = 55;
        const qrX = (pageWidth - qrSize) / 2;
        currentPage.drawImage(qrImage, {
          x: qrX,
          y: sigY - 15,
          width: qrSize,
          height: qrSize,
        });
        const verifyText = "Scan to Verify";
        const verifyTextWidth = font.widthOfTextAtSize(verifyText, 7.5);
        drawText(
          currentPage,
          verifyText,
          (pageWidth - verifyTextWidth) / 2,
          sigY - 25,
          7.5,
          false,
          mutedTextColor
        );
      }

      // Right: Authorized Signatory 2
      if (hasSig2) {
        const sig2X = pageWidth - rightMargin - 155;
        currentPage.drawLine({
          start: { x: sig2X, y: sigY + 12 },
          end: { x: sig2X + 140, y: sigY + 12 },
          thickness: 0.5,
          color: rgb(0.6, 0.6, 0.6),
        });
        drawText(currentPage, authorizedSignatoryName2, sig2X, sigY, parameterFontSize + 0.5, true, textColor);
        if (authorizedSignatoryDegree2) {
          drawText(currentPage, authorizedSignatoryDegree2, sig2X, sigY - 12, parameterFontSize - 0.5, false, mutedTextColor);
        }
      }
    }

    // Serialize PDF to bytes
    const pdfBytes = await pdfDoc.save();

    return new Response(pdfBytes, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="report_${reg.regNo}.pdf"`,
        "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
      },
    });

  } catch (error) {
    console.error("API error generating PDF report:", error);
    return new Response(`Server error generating PDF: ${error.message}`, { status: 500 });
  }
}
