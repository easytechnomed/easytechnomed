import { calculateAllDependents, evaluateExpression, checkFormulaDependencies } from '../lib/formulaUtils.js';

// Setup test definition matching CBC test with formulas
const testDef = {
  id: 1,
  name: "COMPLETE BLOOD COUNT (CBC)",
  parameters: [
    { id: 101, parameterId: 1, name: "Total W.B.C. Count", code: "WBC", editable: true, isCalculated: false, decimalPlace: 2 },
    { id: 102, parameterId: 2, name: "Hemoglobin (Hb)", code: "HB", editable: true, isCalculated: false, decimalPlace: 2 },
    { id: 103, parameterId: 3, name: "R.B.C. COUNT", code: "RBC", editable: true, isCalculated: false, decimalPlace: 2 },
    { id: 104, parameterId: 4, name: "Hematocrit (PCV)", code: "PCV", editable: true, isCalculated: false, decimalPlace: 2 },
    { id: 105, parameterId: 5, name: "MCV", code: "MCV", editable: true, isCalculated: true, decimalPlace: 2 },
    { id: 106, parameterId: 6, name: "MCH", code: "MCH", editable: true, isCalculated: true, decimalPlace: 2 },
    { id: 107, parameterId: 7, name: "MCHC", code: "MCHC", editable: true, isCalculated: true, decimalPlace: 2 },
    { id: 108, parameterId: 8, name: "Neutrophils", code: "NEUT", editable: true, isCalculated: false, decimalPlace: 2 },
    { id: 109, parameterId: 9, name: "Lymphocytes", code: "LYMPH", editable: true, isCalculated: true, decimalPlace: 2 },
    { id: 110, parameterId: 10, name: "Eosinophils", code: "EOS", editable: true, isCalculated: true, decimalPlace: 2 },
    { id: 111, parameterId: 11, name: "Monocytes", code: "MONO", editable: true, isCalculated: true, decimalPlace: 2 },
    { id: 112, parameterId: 12, name: "Basophils", code: "BASO", editable: true, isCalculated: true, decimalPlace: 2 },
    { id: 113, parameterId: 13, name: "Absolute Neutrophils Count", code: "ANC", editable: true, isCalculated: true, decimalPlace: 2 },
    { id: 114, parameterId: 14, name: "Absolute Lymphocytes Count", code: "ALC", editable: true, isCalculated: true, decimalPlace: 2 },
    { id: 115, parameterId: 15, name: "Absolute Eosinophils Count", code: "AEC", editable: true, isCalculated: true, decimalPlace: 2 },
    { id: 116, parameterId: 16, name: "Absolute Monocyte Count", code: "AMC", editable: true, isCalculated: true, decimalPlace: 2 },
    { id: 117, parameterId: 17, name: "Absolute Basophil Count", code: "ABC", editable: true, isCalculated: true, decimalPlace: 2 },
  ],
  formulas: [
    { id: 1, outputParameterId: 5, formula: "(PCV * 10) / RBC" },
    { id: 2, outputParameterId: 6, formula: "(HB * 10) / RBC" },
    { id: 3, outputParameterId: 7, formula: "(HB * 100) / PCV" },
    { id: 4, outputParameterId: 9, formula: "100 - NEUT" },
    { id: 5, outputParameterId: 10, formula: "100 - (NEUT + LYMPH)" },
    { id: 6, outputParameterId: 11, formula: "100 - (NEUT + LYMPH + EOS)" },
    { id: 7, outputParameterId: 12, formula: "100 - (NEUT + LYMPH + EOS + MONO)" },
    { id: 8, outputParameterId: 13, formula: "(WBC * NEUT) / 100" },
    { id: 9, outputParameterId: 14, formula: "(WBC * LYMPH) / 100" },
    { id: 10, outputParameterId: 15, formula: "(WBC * EOS) / 100" },
    { id: 11, outputParameterId: 16, formula: "(WBC * MONO) / 100" },
    { id: 12, outputParameterId: 17, formula: "(WBC * BASO) / 100" },
  ]
};

console.log("--- TEST 1: User enters only NEUT = 50, WBC = 4000 ---");
const values1 = { 101: "4000", 108: "50" };
const overrides1 = new Set([101, 108]);
const result1 = calculateAllDependents(values1, [testDef], 108, overrides1);
console.log("NEUT:", result1[108]);
console.log("LYMPH (Expected 50):", result1[109]);
console.log("EOS (Expected 0):", result1[110]);
console.log("MONO (Expected 0):", result1[111]);
console.log("BASO (Expected 0):", result1[112]);
const totalDLC1 = Number(result1[108]) + Number(result1[109]) + Number(result1[110]) + Number(result1[111]) + Number(result1[112]);
console.log("Total DLC (Expected 100):", totalDLC1);
console.log("ANC (Expected 2000):", result1[113]);
console.log("ALC (Expected 2000):", result1[114]);

console.log("\n--- TEST 2: User enters NEUT = 50, LYMPH = 30, EOS = 10, MONO = 8, BASO = 2 ---");
const values2 = { 101: "4000", 108: "50", 109: "30", 110: "10", 111: "8", 112: "2" };
const overrides2 = new Set([101, 108, 109, 110, 111, 112]);
const result2 = calculateAllDependents(values2, [testDef], 112, overrides2);
console.log("NEUT:", result2[108]);
console.log("LYMPH:", result2[109]);
console.log("EOS:", result2[110]);
console.log("MONO:", result2[111]);
console.log("BASO:", result2[112]);
const totalDLC2 = Number(result2[108]) + Number(result2[109]) + Number(result2[110]) + Number(result2[111]) + Number(result2[112]);
console.log("Total DLC (Expected 100):", totalDLC2);
console.log("ANC (Expected 2000):", result2[113]);
console.log("ALC (Expected 1200):", result2[114]);
console.log("AEC (Expected 400):", result2[115]);
console.log("AMC (Expected 320):", result2[116]);
console.log("ABC (Expected 80):", result2[117]);
