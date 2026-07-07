import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { PDFDocument, rgb, StandardFonts } from "pdf-lib";

const isOutOfRange = (valStr, min, max) => {
  if (!valStr || min === null || max === null) return false;
  const num = parseFloat(valStr);
  if (isNaN(num)) return false;
  return num < min || num > max;
};

const getReferenceRange = (param, reg) => {
  const isBaby = reg.ageUnit !== "Year" || reg.age < 12;
  if (isBaby) {
    return {
      rangeStr: param.normalRangeBaby || param.normalRangeDefault || "Normal",
      min: param.minValBaby,
      max: param.maxValBaby,
    };
  }
  if (reg.gender === "Female") {
    return {
      rangeStr: param.normalRangeFemale || param.normalRangeDefault || "Normal",
      min: param.minValFemale,
      max: param.maxValFemale,
    };
  }
  return {
    rangeStr: param.normalRangeMale || param.normalRangeDefault || "Normal",
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
                  parameters: {
                    orderBy: { order: "asc" },
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
                  parameters: {
                    orderBy: { order: "asc" },
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

    // Retrieve active PDF configuration settings from the admin in the same workspace
    const configAdmin = await prisma.admin.findFirst({
      where: { workspaceId: reg.workspaceId },
      select: {
        framePdfUrl: true,
        headerMargin: true,
        footerMargin: true,
        useFrameDefault: true,
      },
    });

    const searchParams = req.nextUrl.searchParams;
    const withFrameParam = searchParams.get("withFrame");
    
    // Determine whether to use frame
    let useFrame = configAdmin?.useFrameDefault ?? true;
    if (withFrameParam !== null) {
      useFrame = withFrameParam === "true";
    }

    const framePdfUrl = configAdmin?.framePdfUrl;
    const headerMargin = configAdmin?.headerMargin ?? 140;
    const footerMargin = configAdmin?.footerMargin ?? 100;

    // Create a new PDF document
    const pdfDoc = await PDFDocument.create();
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    const fontOblique = await pdfDoc.embedFont(StandardFonts.HelveticaOblique);

    // Fetch and embed QR Code image
    let qrImage = null;
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
    const leftMargin = 45;
    const contentWidth = pageWidth - leftMargin * 2;

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
      // Default blank page header
      page.drawRectangle({
        x: leftMargin,
        y: pageHeight - 75,
        width: contentWidth,
        height: 40,
        color: rgb(0.06, 0.46, 0.43), // Teal
      });
      page.drawText("PATHLAB REPORT SYSTEM", {
        x: leftMargin + 15,
        y: pageHeight - 58,
        size: 14,
        font: fontBold,
        color: rgb(1, 1, 1),
      });
      page.drawText("Premium Clinical Diagnosis and Pathology Lab Services", {
        x: leftMargin + 15,
        y: pageHeight - 70,
        size: 8,
        font: fontOblique,
        color: rgb(0.8, 0.95, 0.95),
      });

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
        end: { x: pageWidth - leftMargin, y: 55 },
        thickness: 0.5,
        color: rgb(0.8, 0.8, 0.8),
      });
    };

    // Helper to draw text
    const drawText = (page, text, x, y, size = 9, isBold = false, color = rgb(0.09, 0.12, 0.18)) => {
      page.drawText(String(text || ""), {
        x,
        y,
        size,
        font: isBold ? fontBold : font,
        color,
      });
    };

    // Initialize first page
    await addNewPage();

    // 1. Draw Patient Demographics Box (starts just below header margin)
    let currentY = pageHeight - headerMargin - 15;

    currentPage.drawRectangle({
      x: leftMargin,
      y: currentY - 70,
      width: contentWidth,
      height: 70,
      borderColor: rgb(0.85, 0.88, 0.92), // Slate 200
      borderWidth: 1,
      color: rgb(0.97, 0.98, 0.99), // Subtle light blue-grey fill
    });

    const c1 = leftMargin + 12;
    const c2 = leftMargin + 270;

    drawText(currentPage, `Patient Name:`, c1, currentY - 20, 9, true);
    drawText(currentPage, `${reg.title} ${reg.name}`, c1 + 80, currentY - 20, 9, false);

    drawText(currentPage, `Age / Gender:`, c2, currentY - 20, 9, true);
    drawText(currentPage, `${reg.age.toFixed(2)} ${reg.ageUnit} / ${reg.gender}`, c2 + 80, currentY - 20, 9, false);

    drawText(currentPage, `Lab No / ID:`, c1, currentY - 40, 9, true);
    drawText(currentPage, `${reg.labId} (${reg.regNo})`, c1 + 80, currentY - 40, 9, false);

    drawText(currentPage, `Ref. Doctor:`, c1, currentY - 60, 9, true);
    drawText(currentPage, `${reg.refBy?.name || "Self / Walk-in"}`, c1 + 80, currentY - 60, 9, false);

    drawText(currentPage, `Registered On:`, c2, currentY - 40, 9, true);
    drawText(currentPage, `${formatDate(reg.date)}`, c2 + 80, currentY - 40, 9, false);

    drawText(currentPage, `Report Status:`, c2, currentY - 60, 9, true);
    drawText(currentPage, `${reg.status}`, c2 + 80, currentY - 60, 9, true, reg.status === "Completed" ? rgb(0.06, 0.46, 0.23) : rgb(0.72, 0.44, 0.05));

    currentY = currentY - 95;

    // 2. Draw Clinical Parameters Table
    const drawTableHeader = (page, y) => {
      // Table Header Row background bar
      page.drawRectangle({
        x: leftMargin,
        y: y - 20,
        width: contentWidth,
        height: 20,
        color: rgb(0.92, 0.94, 0.96),
      });

      drawText(page, "Test Parameter", leftMargin + 10, y - 14, 9, true);
      drawText(page, "Observed Value", leftMargin + 200, y - 14, 9, true);
      drawText(page, "Unit", leftMargin + 310, y - 14, 9, true);
      drawText(page, "Normal Reference Range", leftMargin + 380, y - 14, 9, true);

      page.drawLine({
        start: { x: leftMargin, y: y - 21 },
        end: { x: pageWidth - leftMargin, y: y - 21 },
        thickness: 0.8,
        color: rgb(0.75, 0.78, 0.82),
      });

      return y - 22;
    };

    let tableActiveY = drawTableHeader(currentPage, currentY);

    // Map result values for easy access
    const resultsMap = {};
    reg.results.forEach((r) => {
      resultsMap[r.testParameterId] = r.value;
    });

    for (const regTest of reg.tests) {
      const test = regTest.test;
      const params = test.parameters || [];

      // Test Heading
      if (tableActiveY < footerMargin + 50) {
        await addNewPage();
        tableActiveY = drawTableHeader(currentPage, pageHeight - headerMargin - 15);
      }

      // Draw Test Name group header
      currentPage.drawRectangle({
        x: leftMargin,
        y: tableActiveY - 20,
        width: contentWidth,
        height: 18,
        color: rgb(0.96, 0.97, 0.98),
      });
      drawText(currentPage, `${test.name} (${test.code})`, leftMargin + 10, tableActiveY - 13, 9, true, rgb(0.06, 0.46, 0.43));
      tableActiveY -= 20;

      for (const param of params) {
        const val = resultsMap[param.id] || "";
        const ref = getReferenceRange(param, reg);

        // Check page wrap
        if (tableActiveY < footerMargin + 35) {
          await addNewPage();
          tableActiveY = drawTableHeader(currentPage, pageHeight - headerMargin - 15);
          
          // Re-draw Test group header on new page for context
          currentPage.drawRectangle({
            x: leftMargin,
            y: tableActiveY - 20,
            width: contentWidth,
            height: 18,
            color: rgb(0.96, 0.97, 0.98),
          });
          drawText(currentPage, `${test.name} (${test.code}) - Continued`, leftMargin + 10, tableActiveY - 13, 9, true, rgb(0.06, 0.46, 0.43));
          tableActiveY -= 20;
        }

        // Draw Row Border line
        currentPage.drawLine({
          start: { x: leftMargin, y: tableActiveY },
          end: { x: pageWidth - leftMargin, y: tableActiveY },
          thickness: 0.3,
          color: rgb(0.9, 0.92, 0.94),
        });

        // Determine formatting: bold red for abnormal values
        const isAbnormal = isOutOfRange(val, ref.min, ref.max);
        const resultColor = isAbnormal ? rgb(0.85, 0.12, 0.12) : rgb(0.09, 0.12, 0.18);

        // If parameter is a section header (e.g. no unit/normal range, only title)
        const isSectionHeader = !param.unit && !ref.rangeStr && !val;

        if (isSectionHeader) {
          drawText(currentPage, param.name, leftMargin + 10, tableActiveY - 14, 9, true, rgb(0.3, 0.35, 0.4));
        } else {
          drawText(currentPage, param.name, leftMargin + 10, tableActiveY - 14, 9, false);
          drawText(currentPage, val || "-", leftMargin + 200, tableActiveY - 14, 9, isAbnormal, resultColor);
          drawText(currentPage, param.unit || "-", leftMargin + 310, tableActiveY - 14, 9, false);
          drawText(currentPage, ref.rangeStr || "-", leftMargin + 380, tableActiveY - 14, 9, false);
        }

        tableActiveY -= 20;
      }
      
      // Bottom spacer after test group
      tableActiveY -= 10;
    }

    // 3. Draw Remarks & Pathologist Signatures
    if (tableActiveY < footerMargin + 120) {
      await addNewPage();
      tableActiveY = pageHeight - headerMargin - 15;
    }

    // Draw Report Remarks / Notes
    if (reg.remark) {
      currentPage.drawRectangle({
        x: leftMargin,
        y: tableActiveY - 50,
        width: contentWidth,
        height: 45,
        borderColor: rgb(0.88, 0.9, 0.94),
        borderWidth: 0.5,
        color: rgb(0.99, 0.99, 1),
      });
      drawText(currentPage, "Report Remarks / Summary Note:", leftMargin + 10, tableActiveY - 15, 8.5, true, rgb(0.2, 0.25, 0.3));
      drawText(currentPage, reg.remark, leftMargin + 10, tableActiveY - 30, 8.5, false, rgb(0.25, 0.3, 0.4));
      tableActiveY -= 65;
    }

    // Double check spacing for signatures
    if (tableActiveY < footerMargin + 80) {
      await addNewPage();
      tableActiveY = pageHeight - headerMargin - 15;
    }

    // Draw Pathologist Signatures and QR Code
    const sigY = tableActiveY - 50;

    // Chief Medical Officer (Left)
    currentPage.drawLine({
      start: { x: leftMargin + 15, y: sigY + 12 },
      end: { x: leftMargin + 155, y: sigY + 12 },
      thickness: 0.5,
      color: rgb(0.6, 0.6, 0.6),
    });
    drawText(currentPage, "Dr. Ahmadi", leftMargin + 15, sigY, 9, true);
    drawText(currentPage, "M.B.B.S, Chief CMO", leftMargin + 15, sigY - 12, 8, false, rgb(0.4, 0.45, 0.5));

    // Chief Pathologist (Middle-Right)
    currentPage.drawLine({
      start: { x: 240, y: sigY + 12 },
      end: { x: 380, y: sigY + 12 },
      thickness: 0.5,
      color: rgb(0.6, 0.6, 0.6),
    });
    drawText(currentPage, "Dr. ANAND KUMAR", 240, sigY, 9, true);
    drawText(currentPage, "M.D. (Pathology), Chief Pathologist", 240, sigY - 12, 8, false, rgb(0.4, 0.45, 0.5));

    // QR Code (Far Right)
    if (qrImage) {
      currentPage.drawImage(qrImage, {
        x: pageWidth - leftMargin - 65,
        y: sigY - 15,
        width: 60,
        height: 60,
      });
      drawText(currentPage, "Scan to Verify", pageWidth - leftMargin - 65, sigY - 25, 7.5, false, rgb(0.4, 0.45, 0.5));
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
