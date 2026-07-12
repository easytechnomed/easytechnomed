import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
import { cookies } from "next/headers";
import { verifyToken } from "@/lib/auth";

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

    // Retrieve active PDF configuration settings from the admin in the same workspace
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
      let cleanText = String(text || "")
        .replace(/[μµ]/g, "u")
        .replace(/–/g, "-")
        .replace(/—/g, "-")
        .replace(/[“”]/g, '"')
        .replace(/[‘’]/g, "'");
      page.drawText(cleanText, {
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

    // Map result values and interpretations for easy access
    const resultsMap = {};
    const flagsMap = {};
    const interpretationsMap = {};
    reg.results.forEach((r) => {
      resultsMap[r.testParameterId] = r.value;
      flagsMap[r.testParameterId] = r.flag;
      interpretationsMap[r.testParameterId] = r.interpretation;
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

      let currentHeader = null;
      for (const secName of sectionOrder) {
        const sectionParams = sectionsMap[secName];

        if (secName !== "Default") {
          // Check page wrap for section header
          if (tableActiveY < footerMargin + 35) {
            await addNewPage();
            tableActiveY = drawTableHeader(currentPage, pageHeight - headerMargin - 15);
          }

          // Draw Section Header divider line
          currentPage.drawLine({
            start: { x: leftMargin, y: tableActiveY },
            end: { x: pageWidth - leftMargin, y: tableActiveY },
            thickness: 0.3,
            color: rgb(0.9, 0.92, 0.94),
          });
          drawText(currentPage, secName.toUpperCase(), leftMargin + 10, tableActiveY - 14, 8, true, rgb(0.3, 0.35, 0.4));
          tableActiveY -= 18;
        }

        for (const param of sectionParams) {
          const rawVal = resultsMap[param.id];
          const val = rawVal ?? "";
          const flag = flagsMap[param.id];
          const interpretation = interpretationsMap[param.id];
          const ref = getReferenceRange(param, reg);

          const isHeader = param.isHeader || (!param.unit && (!ref || !ref.rangeStr || ref.rangeStr === "" || ref.rangeStr === "-NA-"));

          // Skip non-header rows where no result value has been entered (null, undefined, empty, or "-")
          if (!isHeader && (rawVal === null || rawVal === undefined || val === "" || val === "-")) {
            continue;
          }

          if (isHeader) {
            currentHeader = param.name;
          }

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
          const isAbnormal = flag ? flag !== "Normal" : isOutOfRange(val, ref.min, ref.max);
          const resultColor = isAbnormal ? rgb(0.85, 0.12, 0.12) : rgb(0.09, 0.12, 0.18);

          // Format value to target decimal precision if numeric
          let formattedVal = val;
          if (val !== "") {
            const num = parseFloat(val);
            if (!isNaN(num)) {
              const precision = param.decimalPlace ?? 2;
              formattedVal = num.toFixed(precision);
            }
          }

          // Append flag labels to observed values
          let displayVal = formattedVal;
          if (flag && flag !== "Normal" && val !== "") {
            let flagAbbr = "";
            if (flag === "Low") flagAbbr = "L";
            else if (flag === "High") flagAbbr = "H";
            else if (flag === "Critical Low") flagAbbr = "CL*";
            else if (flag === "Critical High") flagAbbr = "CH*";
            else if (flag === "Borderline Low") flagAbbr = "BL";
            else if (flag === "Borderline High") flagAbbr = "BH";

            if (flagAbbr) {
              displayVal = `${formattedVal} (${flagAbbr})`;
            }
          }

          if (isHeader) {
            drawText(currentPage, param.name, leftMargin + 10, tableActiveY - 14, 9, true, rgb(0.06, 0.46, 0.43));
          } else {
            const isChild = !!currentHeader;
            const displayName = isChild ? `  -  ${param.name}` : param.name;
            const indentX = isChild ? 22 : 10;

            drawText(currentPage, displayName, leftMargin + indentX, tableActiveY - 14, 9, false);
            drawText(currentPage, displayVal || "-", leftMargin + 200, tableActiveY - 14, 9, isAbnormal, resultColor);
            drawText(currentPage, param.unit || "-", leftMargin + 310, tableActiveY - 14, 9, false);
            drawText(currentPage, ref.rangeStr || "-", leftMargin + 380, tableActiveY - 14, 9, false);
          }

          tableActiveY -= 20;

          // Draw Parameter level comments/interpretations directly below the row
          if (interpretation) {
            if (tableActiveY < footerMargin + 25) {
              await addNewPage();
              tableActiveY = drawTableHeader(currentPage, pageHeight - headerMargin - 15);
            }
            drawText(currentPage, `* Note: ${interpretation}`, leftMargin + 25, tableActiveY - 12, 7.5, false, rgb(0.4, 0.45, 0.5));
            tableActiveY -= 15;
          }
        }
      }

      // Draw Test level Clinical Interpretation and Comments
      if (regTest.interpretation) {
        if (tableActiveY < footerMargin + 55) {
          await addNewPage();
          tableActiveY = drawTableHeader(currentPage, pageHeight - headerMargin - 15);
        }

        // Draw comment box
        currentPage.drawRectangle({
          x: leftMargin,
          y: tableActiveY - 35,
          width: contentWidth,
          height: 30,
          color: rgb(0.98, 0.98, 0.98),
          borderColor: rgb(0.9, 0.92, 0.94),
          borderWidth: 0.5
        });

        drawText(currentPage, "Clinical Interpretation & Comments:", leftMargin + 10, tableActiveY - 11, 8, true, rgb(0.06, 0.46, 0.43));
        drawText(currentPage, regTest.interpretation, leftMargin + 10, tableActiveY - 23, 7.5, false, rgb(0.2, 0.25, 0.3));
        tableActiveY -= 45;
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

    const hasSig1 = !!(configAdmin?.authorizedSignatoryName1 && configAdmin.authorizedSignatoryName1.trim());
    const hasSig2 = !!(configAdmin?.authorizedSignatoryName2 && configAdmin.authorizedSignatoryName2.trim());

    if (hasSig1) {
      currentPage.drawLine({
        start: { x: leftMargin + 15, y: sigY + 12 },
        end: { x: leftMargin + 155, y: sigY + 12 },
        thickness: 0.5,
        color: rgb(0.6, 0.6, 0.6),
      });
      drawText(currentPage, configAdmin.authorizedSignatoryName1, leftMargin + 15, sigY, 9, true);
      if (configAdmin.authorizedSignatoryDegree1) {
        drawText(currentPage, configAdmin.authorizedSignatoryDegree1, leftMargin + 15, sigY - 12, 8, false, rgb(0.4, 0.45, 0.5));
      }
    }

    if (hasSig2) {
      currentPage.drawLine({
        start: { x: 240, y: sigY + 12 },
        end: { x: 380, y: sigY + 12 },
        thickness: 0.5,
        color: rgb(0.6, 0.6, 0.6),
      });
      drawText(currentPage, configAdmin.authorizedSignatoryName2, 240, sigY, 9, true);
      if (configAdmin.authorizedSignatoryDegree2) {
        drawText(currentPage, configAdmin.authorizedSignatoryDegree2, 240, sigY - 12, 8, false, rgb(0.4, 0.45, 0.5));
      }
    }

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
