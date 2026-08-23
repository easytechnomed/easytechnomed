import { calculateAllDependents } from '../lib/formulaUtils.js';

// Registration 17 data provided by user
const testDefinition = {
  id: 2398,
  name: "COMPLETE BLOOD COUNT (CBC)",
  parameters: [
    { id: 10036, parameterId: 2748, name: "Total W.B.C. Count", code: "WBC", decimalPlace: 2 },
    { id: 18327, parameterId: 2747, name: "Hemoglobin (Hb)", code: "HB", decimalPlace: 2 },
    { id: 18328, parameterId: 6301, name: "R.B.C. COUNT", code: "RBC", decimalPlace: 2 },
    { id: 10060, parameterId: 2752, name: "Hematocrit (PCV)", code: "PCV", decimalPlace: 2 },
    { id: 10062, parameterId: 1955, name: "MCV", code: "MCV", decimalPlace: 2 },
    { id: 10064, parameterId: 1956, name: "MCH", code: "MCH", decimalPlace: 2 },
    { id: 10066, parameterId: 1957, name: "MCHC", code: "MCHC", decimalPlace: 2 },
    { id: 10039, parameterId: 2056, name: "Neutrophils", code: "NEUT", decimalPlace: 2 },
    { id: 10041, parameterId: 2020, name: "Lymphocytes", code: "LYMPH", decimalPlace: 2 },
    { id: 10043, parameterId: 2062, name: "Eosinophils", code: "EOS", decimalPlace: 2 },
    { id: 10045, parameterId: 2063, name: "Monocytes", code: "MONO", decimalPlace: 2 },
    { id: 10047, parameterId: 2749, name: "Basophils", code: "BASO", decimalPlace: 2 },
    { id: 10049, parameterId: 2750, name: "Absolute Neutrophils Count", code: "ANC", decimalPlace: 2 },
    { id: 10051, parameterId: 2751, name: "Absolute Lymphocytes Count", code: "ALC", decimalPlace: 2 },
    { id: 10053, parameterId: 2673, name: "Absolute Eosinophils Count", code: "AEC", decimalPlace: 2 },
    { id: 10073, parameterId: 2674, name: "Absolute Monocyte Count", code: "AMC", decimalPlace: 2 },
    { id: 10075, parameterId: 2675, name: "Absolute Basophil Count", code: "ABC", decimalPlace: 2 },
  ],
  formulas: [
    // Standard correct formulas
    { id: 255, outputParameterId: 2750, formula: "(WBC * NEUT) / 100" },
    { id: 256, outputParameterId: 2751, formula: "(WBC * LYMPH) / 100" },
    { id: 257, outputParameterId: 2673, formula: "(WBC * EOS) / 100" },
    { id: 258, outputParameterId: 2674, formula: "(WBC * MONO) / 100" },
    { id: 259, outputParameterId: 2675, formula: "(WBC * BASO) / 100" },
    { id: 438, outputParameterId: 1955, formula: "(PCV * 10) / RBC" },
    { id: 439, outputParameterId: 1956, formula: "(HB * 10) / RBC" },
    { id: 440, outputParameterId: 1957, formula: "(HB * 100) / PCV" },
    // Irrelevant formulas attached to test for other parameterIds
    { id: 432, outputParameterId: 2671, formula: "(WBC * 1000 * NEUT) / 100" },
    { id: 433, outputParameterId: 2672, formula: "(WBC * 1000 * LYMPH) / 100" },
    { id: 434, outputParameterId: 2842, formula: "(WBC * 1000 * EOS) / 100" },
  ]
};

const inputValues = {
  10036: "4630", // WBC
  18327: "16.6", // HB
  18328: "5.57", // RBC
  10060: "47",   // PCV
  10039: "50",   // NEUT
  10041: "32",   // LYMPH
  10043: "17",   // EOS
  10045: "1",    // MONO
  10047: "0",    // BASO
};

const result = calculateAllDependents(inputValues, [testDefinition]);
console.log("=== CALCULATION TEST OUTPUT ===");
console.log("WBC:", inputValues[10036]);
console.log("Neutrophils:", inputValues[10039]);
console.log("Lymphocytes:", inputValues[10041]);
console.log("Eosinophils:", inputValues[10043]);
console.log("Monocytes:", inputValues[10045]);
console.log("Basophils:", inputValues[10047]);
console.log("-------------------------------");
console.log("ANC (Expected 2315):", result[10049]);
console.log("ALC (Expected 1481.6):", result[10051]);
console.log("AEC (Expected 787.1):", result[10053]);
console.log("AMC (Expected 46.3):", result[10073]);
console.log("ABC (Expected 0):", result[10075]);
console.log("MCV (Expected 84.38):", result[10062]);
console.log("MCH (Expected 29.8):", result[10064]);
console.log("MCHC (Expected 35.32):", result[10066]);
