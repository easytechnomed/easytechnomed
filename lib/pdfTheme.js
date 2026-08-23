import { rgb, StandardFonts } from "pdf-lib";

/**
 * Converts a hex color code (e.g. #0f766e or #fff) to a pdf-lib rgb() object.
 */
export function hexToRgb(hex, fallback = { r: 0, g: 0, b: 0 }) {
  if (!hex || typeof hex !== "string") {
    return rgb(fallback.r, fallback.g, fallback.b);
  }
  let clean = hex.replace("#", "").trim();
  if (clean.length === 3) {
    clean = clean.split("").map((c) => c + c).join("");
  }
  if (clean.length !== 6) {
    return rgb(fallback.r, fallback.g, fallback.b);
  }
  const num = parseInt(clean, 16);
  if (isNaN(num)) {
    return rgb(fallback.r, fallback.g, fallback.b);
  }
  const r = ((num >> 16) & 255) / 255;
  const g = ((num >> 8) & 255) / 255;
  const b = (num & 255) / 255;
  return rgb(r, g, b);
}

/**
 * Maps a font family name to pdf-lib StandardFonts.
 */
export function getFontFamilyDefinitions(fontFamily = "Helvetica") {
  const norm = String(fontFamily || "").toLowerCase().replace(/[\s\-_]/g, "");
  if (norm.includes("times") || norm.includes("serif")) {
    return {
      regular: StandardFonts.TimesRoman,
      bold: StandardFonts.TimesRomanBold,
      oblique: StandardFonts.TimesRomanItalic,
    };
  }
  if (norm.includes("courier") || norm.includes("mono")) {
    return {
      regular: StandardFonts.Courier,
      bold: StandardFonts.CourierBold,
      oblique: StandardFonts.CourierOblique,
    };
  }
  // Default to Helvetica
  return {
    regular: StandardFonts.Helvetica,
    bold: StandardFonts.HelveticaBold,
    oblique: StandardFonts.HelveticaOblique,
  };
}

/**
 * Standard default pathology table columns.
 */
export const DEFAULT_COLUMNS = [
  { id: "sNo", label: "S/No", widthRatio: 0.08, align: "left", visible: true },
  { id: "parameter", label: "Test Parameter", widthRatio: 0.38, align: "left", visible: true },
  { id: "value", label: "Observed Value", widthRatio: 0.20, align: "left", visible: true },
  { id: "unit", label: "Unit", widthRatio: 0.12, align: "left", visible: true },
  { id: "range", label: "Normal Reference Range", widthRatio: 0.22, align: "left", visible: true },
];

/**
 * Calculates absolute X positions and widths for visible columns to fill contentWidth.
 */
export function computeColumnLayout(columnsConfig, leftMargin = 45, contentWidth = 505.27) {
  let columns = [];
  if (Array.isArray(columnsConfig)) {
    columns = columnsConfig;
  } else if (typeof columnsConfig === "string") {
    try {
      columns = JSON.parse(columnsConfig);
    } catch {
      columns = DEFAULT_COLUMNS;
    }
  } else {
    columns = DEFAULT_COLUMNS;
  }

  // Filter visible columns only
  const visibleCols = columns.filter((col) => col.visible !== false);
  if (visibleCols.length === 0) {
    visibleCols.push(...DEFAULT_COLUMNS);
  }

  // Calculate sum of ratios
  const totalRatio = visibleCols.reduce((sum, col) => sum + (parseFloat(col.widthRatio) || 0.2), 0);

  let currentX = leftMargin;
  return visibleCols.map((col, index) => {
    const rawRatio = parseFloat(col.widthRatio) || 0.2;
    const normalizedRatio = rawRatio / totalRatio;
    const width = contentWidth * normalizedRatio;
    const x = currentX;
    currentX += width;

    return {
      id: col.id,
      label: col.label || col.id,
      align: col.align || "left",
      x,
      width,
      isFirst: index === 0,
      isLast: index === visibleCols.length - 1,
    };
  });
}

/**
 * Preset Color Themes for 1-click styling
 */
export const PDF_THEME_PRESETS = [
  {
    id: "modern-teal",
    name: "Modern Teal (Default)",
    primaryColor: "#0f766e",
    headerBgColor: "#e2e8f0",
    headerTextColor: "#1e293b",
    textColor: "#0f172a",
    patientCardBgColor: "#f8fafc",
    patientCardBorderColor: "#e2e8f0",
    tableRowBorderColor: "#e2e8f0",
    departmentTextColor: "#ffffff",
  },
  {
    id: "classic-navy",
    name: "Classic Navy",
    primaryColor: "#1e3a8a",
    headerBgColor: "#1e3a8a",
    headerTextColor: "#ffffff",
    textColor: "#0f172a",
    patientCardBgColor: "#eff6ff",
    patientCardBorderColor: "#bfdbfe",
    tableRowBorderColor: "#e2e8f0",
    departmentTextColor: "#ffffff",
  },
  {
    id: "clinical-slate",
    name: "Clinical Slate",
    primaryColor: "#334155",
    headerBgColor: "#f1f5f9",
    headerTextColor: "#0f172a",
    textColor: "#1e293b",
    patientCardBgColor: "#f8fafc",
    patientCardBorderColor: "#cbd5e1",
    tableRowBorderColor: "#e2e8f0",
    departmentTextColor: "#ffffff",
  },
  {
    id: "emerald-health",
    name: "Emerald Health",
    primaryColor: "#065f46",
    headerBgColor: "#d1fae5",
    headerTextColor: "#064e3b",
    textColor: "#064e3b",
    patientCardBgColor: "#f0fdf4",
    patientCardBorderColor: "#a7f3d0",
    tableRowBorderColor: "#dcfce7",
    departmentTextColor: "#ffffff",
  },
  {
    id: "monochrome-pro",
    name: "Monochrome Pro",
    primaryColor: "#18181b",
    headerBgColor: "#27272a",
    headerTextColor: "#ffffff",
    textColor: "#18181b",
    patientCardBgColor: "#fafafa",
    patientCardBorderColor: "#e4e4e7",
    tableRowBorderColor: "#e4e4e7",
    departmentTextColor: "#ffffff",
  },
  {
    id: "hospital-crimson",
    name: "Hospital Crimson",
    primaryColor: "#991b1b",
    headerBgColor: "#fee2e2",
    headerTextColor: "#7f1d1d",
    textColor: "#450a0a",
    patientCardBgColor: "#fef2f2",
    patientCardBorderColor: "#fecaca",
    tableRowBorderColor: "#fee2e2",
    departmentTextColor: "#ffffff",
  },
];
