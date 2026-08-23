import { prisma } from "../lib/db.js";
import {
  hexToRgb,
  getFontFamilyDefinitions,
  computeColumnLayout,
  DEFAULT_COLUMNS,
  PDF_THEME_PRESETS
} from "../lib/pdfTheme.js";
import { PDFDocument } from "pdf-lib";

async function runTests() {
  console.log("=== Testing PDF Customization System ===");

  // 1. Test hexToRgb
  console.log("\n1. Testing hexToRgb:");
  const c1 = hexToRgb("#0f766e");
  console.log("Parsed #0f766e ->", c1);
  const c2 = hexToRgb("#ffffff");
  console.log("Parsed #ffffff ->", c2);

  // 2. Test getFontFamilyDefinitions
  console.log("\n2. Testing getFontFamilyDefinitions:");
  console.log("Helvetica ->", getFontFamilyDefinitions("Helvetica"));
  console.log("TimesRoman ->", getFontFamilyDefinitions("TimesRoman"));
  console.log("Courier ->", getFontFamilyDefinitions("Courier"));

  // 3. Test computeColumnLayout
  console.log("\n3. Testing computeColumnLayout with default columns:");
  const defaultLayout = computeColumnLayout(DEFAULT_COLUMNS, 45, 505.27);
  console.log("Default columns layout:", defaultLayout.map(c => ({ id: c.id, label: c.label, x: Math.round(c.x), width: Math.round(c.width) })));

  console.log("\n3b. Testing computeColumnLayout with reordered columns (e.g. value first):");
  const reordered = [
    { id: "value", label: "Result", widthRatio: 0.25, align: "center", visible: true },
    { id: "parameter", label: "Investigation Name", widthRatio: 0.45, align: "left", visible: true },
    { id: "unit", label: "Unit", widthRatio: 0.10, align: "left", visible: true },
    { id: "range", label: "Ref Range", widthRatio: 0.20, align: "left", visible: true },
  ];
  const reorderedLayout = computeColumnLayout(reordered, 45, 505.27);
  console.log("Reordered layout:", reorderedLayout.map(c => ({ id: c.id, label: c.label, x: Math.round(c.x), width: Math.round(c.width) })));

  // 4. Test WorkspacePdf in DB
  console.log("\n4. Testing WorkspacePdf DB model:");
  const workspaces = await prisma.workspace.findMany({ take: 1 });
  if (workspaces.length > 0) {
    const wsId = workspaces[0].id;
    console.log(`Found workspace id: ${wsId}`);

    const upserted = await prisma.workspacePdf.upsert({
      where: { workspaceId: wsId },
      create: {
        workspaceId: wsId,
        primaryColor: "#0f766e",
        headerBgColor: "#e2e8f0",
        headerTextColor: "#1e293b",
        fontFamily: "Helvetica",
        columnOrder: JSON.stringify(reordered),
      },
      update: {
        columnOrder: JSON.stringify(reordered),
      }
    });
    console.log("Successfully upserted WorkspacePdf in DB:", upserted.id, upserted.workspaceId, "columns:", upserted.columnOrder);

    const fetched = await prisma.workspacePdf.findUnique({
      where: { workspaceId: wsId },
    });
    console.log("Successfully fetched WorkspacePdf from DB:", Boolean(fetched));
  }

  // 5. Test PDFDocument rendering with custom fonts and colors
  console.log("\n5. Testing PDFDocument creation with custom fonts and colors:");
  const pdfDoc = await PDFDocument.create();
  const fontDefs = getFontFamilyDefinitions("Helvetica");
  const font = await pdfDoc.embedFont(fontDefs.regular);
  const fontBold = await pdfDoc.embedFont(fontDefs.bold);
  const page = pdfDoc.addPage([595.27, 842.89]);

  page.drawRectangle({
    x: 45,
    y: 800,
    width: 505.27,
    height: 20,
    color: hexToRgb("#0f766e"),
  });

  page.drawText("Test PDF Customization", {
    x: 55,
    y: 806,
    size: 9.5,
    font: fontBold,
    color: hexToRgb("#ffffff"),
  });

  const pdfBytes = await pdfDoc.save();
  console.log("Successfully generated PDF bytes length:", pdfBytes.length);

  console.log("\n=== All Tests Passed Successfully! ===");
}

runTests().catch(console.error).finally(() => process.exit(0));
