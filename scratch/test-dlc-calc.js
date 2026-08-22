const { calculateDifferentialSummary } = require("./test-calc-export.js");

// Dummy parameters matching CBC
const params = [
  { id: 1, name: "COMPLETE BLOOD COUNT (CBC)", isHeader: true, parentId: null },
  { id: 2, name: "Total W.B.C. Count", code: "WBC", unit: "cells/cumm", isHeader: false, parentId: 1 },
  { id: 3, name: "Hemoglobin (Hb)", code: "HB", unit: "g/dL", isHeader: false, parentId: 1 },
  { id: 11, name: "Differential Cell Count", isHeader: true, parentId: null },
  { id: 12, name: "Neutrophils", code: "NEUT", unit: "%", isHeader: false, parentId: 11 },
  { id: 13, name: "Lymphocytes", code: "LYMPH", unit: "%", isHeader: false, parentId: 11 },
  { id: 14, name: "Eosinophils", code: "EOS", unit: "%", isHeader: false, parentId: 11 },
  { id: 15, name: "Monocytes", code: "MONO", unit: "%", isHeader: false, parentId: 11 },
  { id: 16, name: "Basophils", code: "BASO", unit: "%", isHeader: false, parentId: 11 },
  { id: 17, name: "ABSOLUTE CELL COUNT", isHeader: true, parentId: null },
  { id: 18, name: "Absolute Neutrophils Count", code: "ANC", unit: "cells/cumm", isHeader: false, parentId: 17 },
  { id: 19, name: "Absolute Lymphocytes Count", code: "ALC", unit: "cells/cumm", isHeader: false, parentId: 17 },
];

const values1 = {
  2: "4000",
  12: "50",
  13: "23",
  14: "5",
  15: "10",
  16: "12",
  18: "2000",
  19: "920",
};

console.log("Test 1 (50+23+5+10+12 = 100):", calculateDifferentialSummary(params, values1, 11));

const values2 = {
  2: "4000",
  12: "50",
  13: "12",
  14: "23",
  15: "2",
  16: "2",
  18: "2000",
};

console.log("Test 2 (50+12+23+2+2 = 89):", calculateDifferentialSummary(params, values2, 11));
