import { NextResponse } from "next/server";
import { PDFDocument, rgb } from "pdf-lib";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";
import {
  hexToRgb,
  getFontFamilyDefinitions,
  computeColumnLayout,
  DEFAULT_COLUMNS,
  DEFAULT_PDF_SETTINGS
} from "@/lib/pdfTheme";

const formatDate = (d = new Date()) => {
  return d.toLocaleString("en-IN", {
    timeZone: "Asia/Kolkata",
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
};

export async function GET(req) {
  try {
    const admin = await requireAdmin("SETTINGS_READ");
    const { searchParams } = new URL(req.url);

    // Fetch existing settings from DB as fallback
    let dbPdf = null;
    if (admin.workspaceId) {
      dbPdf = await prisma.workspacePdf.findUnique({
        where: { workspaceId: admin.workspaceId },
      });
    }

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

    const getParam = (key, fallback) => {
      const val = searchParams.get(key);
      return val !== null && val !== undefined ? val : fallback;
    };

    const framePdfUrl = getParam("framePdfUrl", dbPdf?.framePdfUrl || adminRecord?.framePdfUrl || null);
    const headerMargin = parseInt(getParam("headerMargin", dbPdf?.headerMargin ?? adminRecord?.headerMargin ?? 140), 10) || 140;
    const footerMargin = parseInt(getParam("footerMargin", dbPdf?.footerMargin ?? adminRecord?.footerMargin ?? 100), 10) || 100;
    const leftMargin = parseInt(getParam("leftMargin", dbPdf?.leftMargin ?? 45), 10) || 45;
    const rightMargin = parseInt(getParam("rightMargin", dbPdf?.rightMargin ?? 45), 10) || 45;
    const useFrame = getParam("useFrame", String(dbPdf?.useFrameDefault ?? adminRecord?.useFrameDefault ?? true)) === "true";

    // Colors
    const primaryColorHex = getParam("primaryColor", dbPdf?.primaryColor || "#0f766e");
    const headerBgColorHex = getParam("headerBgColor", dbPdf?.headerBgColor || "#e2e8f0");
    const headerTextColorHex = getParam("headerTextColor", dbPdf?.headerTextColor || "#1e293b");
    const textColorHex = getParam("textColor", dbPdf?.textColor || "#0f172a");
    const patientCardBgColorHex = getParam("patientCardBgColor", dbPdf?.patientCardBgColor || "#f8fafc");
    const patientCardBorderColorHex = getParam("patientCardBorderColor", dbPdf?.patientCardBorderColor || "#e2e8f0");
    const tableRowBorderColorHex = getParam("tableRowBorderColor", dbPdf?.tableRowBorderColor || "#e2e8f0");
    const departmentTextColorHex = getParam("departmentTextColor", dbPdf?.departmentTextColor || "#ffffff");

    // Fonts & Sizes
    const fontFamily = getParam("fontFamily", dbPdf?.fontFamily || "Helvetica");
    const headerFontSize = parseFloat(getParam("headerFontSize", dbPdf?.headerFontSize ?? 9.0)) || 9.0;
    const parameterFontSize = parseFloat(getParam("parameterFontSize", dbPdf?.parameterFontSize ?? 8.5)) || 8.5;
    const patientInfoFontSize = parseFloat(getParam("patientInfoFontSize", dbPdf?.patientInfoFontSize ?? 9.0)) || 9.0;
    const departmentFontSize = parseFloat(getParam("departmentFontSize", dbPdf?.departmentFontSize ?? 9.5)) || 9.5;
    const remarkFontSize = parseFloat(getParam("remarkFontSize", dbPdf?.remarkFontSize ?? 8.5)) || 8.5;

    // Columns
    const columnOrderRaw = getParam("columnOrder", dbPdf?.columnOrder || JSON.stringify(DEFAULT_COLUMNS));
    
    // Signatories & Toggles
    const authorizedSignatoryName1 = getParam("authorizedSignatoryName1", dbPdf?.authorizedSignatoryName1 ?? adminRecord?.authorizedSignatoryName1 ?? "Dr. Ramesh Kumar");
    const authorizedSignatoryDegree1 = getParam("authorizedSignatoryDegree1", dbPdf?.authorizedSignatoryDegree1 ?? adminRecord?.authorizedSignatoryDegree1 ?? "MBBS, MD (Pathology)");
    const authorizedSignatoryName2 = getParam("authorizedSignatoryName2", dbPdf?.authorizedSignatoryName2 ?? adminRecord?.authorizedSignatoryName2 ?? "Dr. Anita Sharma");
    const authorizedSignatoryDegree2 = getParam("authorizedSignatoryDegree2", dbPdf?.authorizedSignatoryDegree2 ?? adminRecord?.authorizedSignatoryDegree2 ?? "DCP, Consulting Pathologist");

    const showSignatures = getParam("showSignatures", String(dbPdf?.showSignatures ?? true)) === "true";
    const showQrCode = getParam("showQrCode", String(dbPdf?.showQrCode ?? true)) === "true";
    const showDepartmentBanner = getParam("showDepartmentBanner", String(dbPdf?.showDepartmentBanner ?? true)) === "true";
    const showPatientBox = getParam("showPatientBox", String(dbPdf?.showPatientBox ?? true)) === "true";

    // Convert hex to pdf-lib rgb colors
    const primaryColor = hexToRgb(primaryColorHex, { r: 0.06, g: 0.46, b: 0.43 });
    const headerBgColor = hexToRgb(headerBgColorHex, { r: 0.88, g: 0.91, b: 0.94 });
    const headerTextColor = hexToRgb(headerTextColorHex, { r: 0.12, g: 0.16, b: 0.23 });
    const textColor = hexToRgb(textColorHex, { r: 0.09, g: 0.12, b: 0.18 });
    const mutedTextColor = hexToRgb(textColorHex, { r: 0.35, g: 0.4, b: 0.45 });
    const patientCardBgColor = hexToRgb(patientCardBgColorHex, { r: 0.97, g: 0.98, b: 0.99 });
    const patientCardBorderColor = hexToRgb(patientCardBorderColorHex, { r: 0.85, g: 0.88, b: 0.92 });
    const tableRowBorderColor = hexToRgb(tableRowBorderColorHex, { r: 0.88, g: 0.91, b: 0.94 });
    const departmentTextColor = hexToRgb(departmentTextColorHex, { r: 1, g: 1, b: 1 });

    // Create PDF Document
    const pdfDoc = await PDFDocument.create();
    const fontDefs = getFontFamilyDefinitions(fontFamily);
    const font = await pdfDoc.embedFont(fontDefs.regular);
    const fontBold = await pdfDoc.embedFont(fontDefs.bold);
    const fontOblique = await pdfDoc.embedFont(fontDefs.oblique);

    // Fetch and embed QR Code image if enabled
    let qrImage = null;
    if (showQrCode) {
      try {
        const qrData = `${req.nextUrl.origin}/settings/pdf`;
        const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(qrData)}`;
        const qrRes = await fetch(qrUrl);
        if (qrRes.ok) {
          const qrBytes = await qrRes.arrayBuffer();
          qrImage = await pdfDoc.embedPng(qrBytes);
        }
      } catch (err) {
        console.error("Preview QR code fetch error:", err);
      }
    }

    // Load background letterhead frame template if requested
    let framePdfDoc = null;
    if (useFrame && framePdfUrl) {
      try {
        const frameRes = await fetch(framePdfUrl);
        if (frameRes.ok) {
          const frameBytes = await frameRes.arrayBuffer();
          framePdfDoc = await PDFDocument.load(frameBytes);
        }
      } catch (err) {
        console.error("Preview Frame PDF fetch error:", err);
      }
    }

    const pageWidth = 595.27; // A4 Width
    const pageHeight = 842.89; // A4 Height
    const contentWidth = pageWidth - leftMargin - rightMargin;

    let currentPage = null;
    if (framePdfDoc && framePdfDoc.getPageCount() > 0) {
      const [copiedPage] = await pdfDoc.copyPages(framePdfDoc, [0]);
      currentPage = pdfDoc.addPage(copiedPage);
    } else {
      currentPage = pdfDoc.addPage([pageWidth, pageHeight]);
      // Default blank page bottom line
      currentPage.drawText("Preview Mode: Demo Report generated with customizable PDF settings.", {
        x: leftMargin,
        y: 40,
        size: 8,
        font: font,
        color: rgb(0.4, 0.45, 0.5),
      });
      currentPage.drawLine({
        start: { x: leftMargin, y: 55 },
        end: { x: pageWidth - rightMargin, y: 55 },
        thickness: 0.5,
        color: rgb(0.8, 0.8, 0.8),
      });
    }

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

    // Calculate dynamic column layout
    const columnsLayout = computeColumnLayout(columnOrderRaw, leftMargin, contentWidth);

    let activeY = pageHeight - headerMargin - 15;

    // 1. Patient Demographics Box
    if (showPatientBox) {
      const boxHeight = 72;
      currentPage.drawRectangle({
        x: leftMargin,
        y: activeY - boxHeight,
        width: contentWidth,
        height: boxHeight,
        borderColor: patientCardBorderColor,
        borderWidth: 1,
        color: patientCardBgColor,
      });

      const col1X = leftMargin + 12;
      const col2X = leftMargin + (contentWidth / 2) + 8;
      const labelW = 75;

      // Left Column (3 items - aligned with rows 1, 2, 3)
      drawText(currentPage, `Patient Name:`, col1X, activeY - 15, patientInfoFontSize, true, textColor);
      drawText(currentPage, `Mr. Rajesh Sharma`, col1X + labelW, activeY - 15, patientInfoFontSize, false, textColor);

      drawText(currentPage, `Age / Gender:`, col1X, activeY - 30, patientInfoFontSize, true, textColor);
      drawText(currentPage, `32 Year / Male`, col1X + labelW, activeY - 30, patientInfoFontSize, false, textColor);

      drawText(currentPage, `Ref. Doctor:`, col1X, activeY - 45, patientInfoFontSize, true, textColor);
      drawText(currentPage, `Dr. A. K. Gupta (MD, Med.)`, col1X + labelW, activeY - 45, patientInfoFontSize, false, textColor);

      // Right Column (4 items)
      drawText(currentPage, `Reg. No:`, col2X, activeY - 15, patientInfoFontSize, true, textColor);
      drawText(currentPage, `REG-2026-00123`, col2X + labelW, activeY - 15, patientInfoFontSize, false, textColor);

      drawText(currentPage, `Registered On:`, col2X, activeY - 30, patientInfoFontSize, true, textColor);
      drawText(currentPage, formatDate(), col2X + labelW, activeY - 30, patientInfoFontSize, false, textColor);

      drawText(currentPage, `Reported On:`, col2X, activeY - 45, patientInfoFontSize, true, textColor);
      drawText(currentPage, formatDate(), col2X + labelW, activeY - 45, patientInfoFontSize, false, textColor);

      drawText(currentPage, `Report Status:`, col2X, activeY - 60, patientInfoFontSize, true, textColor);
      drawText(currentPage, `Completed`, col2X + labelW, activeY - 60, patientInfoFontSize, true, rgb(0.06, 0.46, 0.23));

      activeY -= boxHeight + 12;
    }

    // 2. Department Banner
    if (showDepartmentBanner) {
      const barHeight = 20;
      currentPage.drawRectangle({
        x: leftMargin,
        y: activeY - barHeight,
        width: contentWidth,
        height: barHeight,
        color: primaryColor,
      });
      drawText(currentPage, `DEPARTMENT: HAEMATOLOGY`, leftMargin + 10, activeY - 14, departmentFontSize, true, departmentTextColor);
      activeY -= barHeight + 8;
    }

    // 3. Dynamic Table Header Row
    const thHeight = 20;
    currentPage.drawRectangle({
      x: leftMargin,
      y: activeY - thHeight,
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
      drawText(currentPage, col.label, Math.max(col.x + 2, textX), activeY - 14, headerFontSize, true, headerTextColor);
    }

    currentPage.drawLine({
      start: { x: leftMargin, y: activeY - thHeight - 1 },
      end: { x: pageWidth - rightMargin, y: activeY - thHeight - 1 },
      thickness: 0.8,
      color: tableRowBorderColor,
    });

    activeY -= thHeight + 4;

    // 4. Test Header
    currentPage.drawRectangle({
      x: leftMargin,
      y: activeY - 18,
      width: contentWidth,
      height: 18,
      color: rgb(0.96, 0.97, 0.98),
    });
    drawText(currentPage, `COMPLETE BLOOD COUNT (CBC)`, leftMargin + 10, activeY - 12, parameterFontSize + 0.5, true, primaryColor);
    activeY -= 20;

    // Sample CBC rows matching standard pathology reports
    const cbcData = [
      { sNo: "1", name: "Total W.B.C. Count", value: "7,200", unit: "cells/cumm", range: "4000 - 11000", isBold: true },
      { sNo: "2", name: "Hemoglobin (Hb)", value: "14.5", unit: "g/dL", range: "13.5 - 17.5", isBold: true },
      { sNo: "3", name: "R.B.C. Count", value: "4.85", unit: "10^6/ul", range: "4.5 - 5.9", isBold: false },
      { sNo: "4", name: "Hematocrit (PCV)", value: "43.2", unit: "%", range: "40.0 - 50.0", isBold: false },
      { sNo: "5", name: "Mean Corpuscular Volume (MCV)", value: "89.1", unit: "fL", range: "80.0 - 100.0", isBold: false },
      { sNo: "6", name: "Mean Corpuscular Hemoglobin (MCH)", value: "29.9", unit: "pg", range: "27.0 - 32.0", isBold: false },
      { sNo: "7", name: "Mean Corpuscular Hb Conc (MCHC)", value: "33.6", unit: "g/dL", range: "32.0 - 36.0", isBold: false },
      { sNo: "8", name: "Platelet Count", value: "2,40,000", unit: "/cumm", range: "1,50,000 - 4,50,000", isBold: true },
      { isHeader: true, name: "DIFFERENTIAL LEUCOCYTE COUNT (DLC)" },
      { sNo: "9.1", name: "Neutrophils", value: "62", unit: "%", range: "40 - 75", isChild: true },
      { sNo: "9.2", name: "Lymphocytes", value: "30", unit: "%", range: "20 - 45", isChild: true },
      { sNo: "9.3", name: "Eosinophils", value: "04", unit: "%", range: "01 - 06", isChild: true },
      { sNo: "9.4", name: "Monocytes", value: "03", unit: "%", range: "02 - 08", isChild: true },
      { sNo: "9.5", name: "Basophils", value: "01", unit: "%", range: "00 - 01", isChild: true },
    ];

    for (const row of cbcData) {
      if (row.isHeader) {
        currentPage.drawLine({
          start: { x: leftMargin, y: activeY },
          end: { x: pageWidth - rightMargin, y: activeY },
          thickness: 0.4,
          color: tableRowBorderColor,
        });

        const paramCol = columnsLayout.find((c) => c.id === "parameter") || columnsLayout[0];
        const sNoCol = columnsLayout.find((c) => c.id === "sNo");

        if (sNoCol) {
          drawText(currentPage, "9", sNoCol.x + 4, activeY - 13, parameterFontSize, true, primaryColor);
        }
        drawText(currentPage, row.name, paramCol.x + 4, activeY - 13, parameterFontSize, true, primaryColor);
        activeY -= 17;
        continue;
      }

      currentPage.drawLine({
        start: { x: leftMargin, y: activeY },
        end: { x: pageWidth - rightMargin, y: activeY },
        thickness: 0.3,
        color: tableRowBorderColor,
      });

      // Render each cell in its dynamic column position
      for (const col of columnsLayout) {
        let cellText = "";
        let isBoldCell = false;
        let cellColor = textColor;
        let xIndent = 0;

        if (col.id === "sNo") {
          cellText = row.sNo || "";
          cellColor = mutedTextColor;
        } else if (col.id === "parameter") {
          cellText = row.name || "";
          isBoldCell = Boolean(row.isBold);
          if (row.isChild) xIndent = 12;
        } else if (col.id === "value") {
          cellText = row.value || "";
          isBoldCell = true;
          cellColor = textColor;
        } else if (col.id === "unit") {
          cellText = row.unit || "";
          cellColor = mutedTextColor;
        } else if (col.id === "range") {
          cellText = row.range || "";
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

        drawText(currentPage, cellText, textX, activeY - 13, parameterFontSize, isBoldCell, cellColor);
      }

      activeY -= 16;
    }

    // 5. Remarks Box
    activeY -= 6;
    const remarkBoxHeight = 34;
    currentPage.drawRectangle({
      x: leftMargin,
      y: activeY - remarkBoxHeight,
      width: contentWidth,
      height: remarkBoxHeight,
      borderColor: patientCardBorderColor,
      borderWidth: 0.5,
      color: patientCardBgColor,
    });

    drawText(currentPage, "Report Remarks / Summary Note:", leftMargin + 10, activeY - 12, remarkFontSize, true, primaryColor);
    drawText(currentPage, "All blood counts and hematological indices are within biological reference limits.", leftMargin + 10, activeY - 24, remarkFontSize - 0.5, false, textColor);

    activeY -= remarkBoxHeight + 15;

    // 6. Signatures and QR Code
    if (showSignatures) {
      const sigY = Math.max(activeY - 15, footerMargin + 30);

      // Left: Authorized Signatory 1
      if (authorizedSignatoryName1 && authorizedSignatoryName1.trim()) {
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

      // Center: QR Code
      if (showQrCode && qrImage) {
        const qrSize = 50;
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
          sigY - 24,
          7.5,
          false,
          mutedTextColor
        );
      }

      // Right: Authorized Signatory 2
      if (authorizedSignatoryName2 && authorizedSignatoryName2.trim()) {
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

    const pdfBytes = await pdfDoc.save();

    return new Response(pdfBytes, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="preview_sample_report.pdf"`,
        "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
      },
    });

  } catch (error) {
    if (error.message === "NEXT_REDIRECT" || (error.digest && error.digest.startsWith("NEXT_REDIRECT"))) {
      return new Response("Unauthorized", { status: 401 });
    }
    console.error("API error generating Preview PDF report:", error);
    return new Response(`Server error generating PDF: ${error.message}`, { status: 500 });
  }
}
