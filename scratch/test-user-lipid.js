const addValueToValuesMap = (valuesMap, param, numVal) => {
  if (numVal === null || numVal === undefined || isNaN(numVal)) return;

  const id = param.id || param.parameterId;
  if (id) valuesMap[id] = numVal;

  const name = param.name || param.parameterName || "";
  if (name) {
    valuesMap[name.trim()] = numVal;
    const normName = name.toLowerCase().replace(/[^a-z0-9]/g, "");
    valuesMap[normName] = numVal;
    valuesMap[normName.toUpperCase()] = numVal;

    if (normName.includes("triglyceride")) {
      valuesMap["TG"] = numVal;
      valuesMap["TRIG"] = numVal;
      valuesMap["TRIGLYCERIDE"] = numVal;
      valuesMap["TRIGLYCERIDES"] = numVal;
      valuesMap["SERUMTRIGLYCERIDES"] = numVal;
      valuesMap["SERUMTRIGLYCERIDE"] = numVal;
      valuesMap["tg"] = numVal;
      valuesMap["trig"] = numVal;
    }
    if (normName === "cholesterol" || normName === "totalcholesterol" || normName === "serumcholesterol") {
      valuesMap["CHOL"] = numVal;
      valuesMap["TC"] = numVal;
      valuesMap["CHOLESTEROL"] = numVal;
      valuesMap["TOTALCHOLESTEROL"] = numVal;
      valuesMap["chol"] = numVal;
      valuesMap["tc"] = numVal;
    }
    if (normName === "hdl" || normName === "hdlcholesterol" || normName === "serumhdl") {
      valuesMap["HDL"] = numVal;
      valuesMap["HDL_CHOLESTEROL"] = numVal;
      valuesMap["hdl"] = numVal;
    }
    if (normName === "ldl" || normName === "ldlcholesterol" || normName === "serumldl") {
      valuesMap["LDL"] = numVal;
      valuesMap["LDL_CHOLESTEROL"] = numVal;
      valuesMap["ldl"] = numVal;
    }
    if (normName === "vldl" || normName === "vldlcholesterol" || normName === "serumvldl") {
      valuesMap["VLDL"] = numVal;
      valuesMap["VLDL_CHOLESTEROL"] = numVal;
      valuesMap["vldl"] = numVal;
    }
    if (normName.includes("nonhdl")) {
      valuesMap["NON_HDL"] = numVal;
      valuesMap["NON_HDL_CHOLESTEROL"] = numVal;
      valuesMap["NONHDL"] = numVal;
      valuesMap["NONHDLCHOLESTEROL"] = numVal;
    }
    if (normName === "hemoglobin" || normName === "haemoglobin" || normName === "hb" || normName === "hgb") {
      valuesMap["HB"] = numVal;
      valuesMap["HGB"] = numVal;
      valuesMap["hb"] = numVal;
      valuesMap["hgb"] = numVal;
    }
    if (normName === "pcv" || normName === "hematocrit" || normName === "haematocrit" || normName.includes("pcv") || normName.includes("haematocrit") || normName.includes("hematocrit")) {
      valuesMap["PCV"] = numVal;
      valuesMap["HCT"] = numVal;
      valuesMap["pcv"] = numVal;
      valuesMap["hct"] = numVal;
    }
    if (normName === "rbc" || normName === "rbccount" || normName.includes("redbloodcell") || normName.includes("rbccount")) {
      valuesMap["RBC"] = numVal;
      valuesMap["rbc"] = numVal;
    }
    if (normName === "wbc" || normName === "totalwbccount" || normName === "tlc" || normName.includes("leucocytecount") || normName.includes("wbccount")) {
      valuesMap["WBC"] = numVal;
      valuesMap["TLC"] = numVal;
      valuesMap["wbc"] = numVal;
      valuesMap["tlc"] = numVal;
    }
    if (normName.includes("neutrophil") || normName.includes("polymorph")) {
      valuesMap["NEUT"] = numVal;
      valuesMap["POLY"] = numVal;
      valuesMap["neut"] = numVal;
      valuesMap["poly"] = numVal;
    }
    if (normName.includes("lymphocyte")) {
      valuesMap["LYMPH"] = numVal;
      valuesMap["lymph"] = numVal;
    }
    if (normName.includes("eosinophil")) {
      valuesMap["EOS"] = numVal;
      valuesMap["eos"] = numVal;
    }
    if (normName.includes("monocyte")) {
      valuesMap["MONO"] = numVal;
      valuesMap["mono"] = numVal;
    }
    if (normName.includes("basophil")) {
      valuesMap["BASO"] = numVal;
      valuesMap["baso"] = numVal;
    }
    if (normName.includes("platelet") || normName === "plt") {
      valuesMap["PLT"] = numVal;
      valuesMap["plt"] = numVal;
    }
    if (normName.includes("totalbilirubin") || normName === "tb" || normName === "tbil") {
      valuesMap["TB"] = numVal;
      valuesMap["TBIL"] = numVal;
      valuesMap["tb"] = numVal;
      valuesMap["tbil"] = numVal;
    }
    if (normName.includes("directbilirubin") || normName === "db" || normName === "dbil") {
      valuesMap["DB"] = numVal;
      valuesMap["DBIL"] = numVal;
      valuesMap["db"] = numVal;
      valuesMap["dbil"] = numVal;
    }
    if (normName.includes("indirectbilirubin") || normName === "ib" || normName === "ibil") {
      valuesMap["IB"] = numVal;
      valuesMap["IBIL"] = numVal;
      valuesMap["ib"] = numVal;
      valuesMap["ibil"] = numVal;
    }
    if (normName === "totalprotein" || normName === "tp") {
      valuesMap["TP"] = numVal;
      valuesMap["tp"] = numVal;
    }
    if (normName === "albumin" || normName === "alb" || normName === "serumalbumin") {
      valuesMap["ALB"] = numVal;
      valuesMap["alb"] = numVal;
    }
    if (normName === "globulin" || normName === "glob" || normName === "serumglobulin") {
      valuesMap["GLOB"] = numVal;
      valuesMap["glob"] = numVal;
    }
    if (normName.includes("urea") && !normName.includes("ratio") && !normName.includes("nitrogen")) {
      valuesMap["UREA"] = numVal;
      valuesMap["urea"] = numVal;
    }
    if (normName.includes("creatinine") && !normName.includes("ratio")) {
      valuesMap["CR"] = numVal;
      valuesMap["CREAT"] = numVal;
      valuesMap["cr"] = numVal;
      valuesMap["creat"] = numVal;
    }
    if (normName === "bun" || normName.includes("ureanitrogen")) {
      valuesMap["BUN"] = numVal;
      valuesMap["bun"] = numVal;
    }
  }

  const rawCode = param.code || "";
  if (rawCode) {
    const code = rawCode.trim().toUpperCase();
    valuesMap[code] = numVal;
    valuesMap[code.toLowerCase()] = numVal;

    if (code === "TG" || code === "TRIG") {
      valuesMap["TG"] = numVal;
      valuesMap["TRIG"] = numVal;
      valuesMap["TRIGLYCERIDE"] = numVal;
      valuesMap["TRIGLYCERIDES"] = numVal;
      valuesMap["tg"] = numVal;
      valuesMap["trig"] = numVal;
    }
    if (code === "CHOL" || code === "TC") {
      valuesMap["CHOL"] = numVal;
      valuesMap["TC"] = numVal;
      valuesMap["chol"] = numVal;
      valuesMap["tc"] = numVal;
    }
    if (code === "HB" || code === "HGB") {
      valuesMap["HB"] = numVal;
      valuesMap["HGB"] = numVal;
      valuesMap["hb"] = numVal;
      valuesMap["hgb"] = numVal;
    }
    if (code === "PCV" || code === "HCT") {
      valuesMap["PCV"] = numVal;
      valuesMap["HCT"] = numVal;
      valuesMap["pcv"] = numVal;
      valuesMap["hct"] = numVal;
    }
    if (code === "WBC" || code === "TLC") {
      valuesMap["WBC"] = numVal;
      valuesMap["TLC"] = numVal;
      valuesMap["wbc"] = numVal;
      valuesMap["tlc"] = numVal;
    }
  }
};

const evaluateExpression = (formulaStr, valuesMap) => {
  if (!formulaStr) return null;
  let prepared = formulaStr.replace(/\^/g, "**");
  const tokenRegex = /\b(?!ROUND|ABS|SQRT|MIN|MAX|IF|null|NULL\b)[a-zA-Z_][a-zA-Z0-9_]*\b/g;

  const substituted = prepared.replace(tokenRegex, (match) => {
    const val = valuesMap[match] ?? valuesMap[match.toUpperCase()] ?? valuesMap[match.toLowerCase()];
    if (val !== undefined && val !== null && !isNaN(val)) {
      return val;
    }
    return match;
  });

  const sanitized = substituted.replace(/[^0-9+\-*/%().\s*<>!=&|?:,a-zA-Z_]/g, "");
  const allowedKeywords = /^(ROUND|ABS|SQRT|MIN|MAX|IF|null|NULL|true|false)$/i;
  const unknownTokens = sanitized.match(/[a-zA-Z_][a-zA-Z0-9_]*/g) || [];
  for (const token of unknownTokens) {
    if (!allowedKeywords.test(token)) {
      return null;
    }
  }

  try {
    const context = {
      ROUND: (val, dec = 0) => {
        if (val === null || val === undefined || isNaN(val)) return null;
        return Number(Math.round(val + "e" + dec) + "e-" + dec);
      },
      ABS: Math.abs,
      SQRT: Math.sqrt,
      MIN: Math.min,
      MAX: Math.max,
      IF: (cond, tVal, fVal) => cond ? tVal : fVal,
      NULL: null
    };
    const keys = Object.keys(context);
    const values = Object.values(context);
    const fn = new Function(...keys, `return (${sanitized});`);
    const result = fn(...values);
    if (typeof result === "number" && !isNaN(result) && isFinite(result)) {
      return result;
    }
    return null;
  } catch (err) {
    return null;
  }
};

const checkFormulaDependencies = (formulaStr, valuesMap) => {
  if (!formulaStr) return false;
  const tokenRegex = /\b(?!ROUND|ABS|SQRT|MIN|MAX|IF|null|NULL\b)[a-zA-Z_][a-zA-Z0-9_]*\b/g;
  const matches = formulaStr.match(tokenRegex) || [];

  for (const match of matches) {
    const val = valuesMap[match] ?? valuesMap[match.toUpperCase()] ?? valuesMap[match.toLowerCase()];
    if (val === undefined || val === null || val === "" || isNaN(val)) {
      return false;
    }
  }
  return true;
};

// Simulation with the user's exact data
const userParams = [
  { id: 9950, parameterId: 3163, name: "CHOLESTEROL", code: "CHOL" },
  { id: 18304, parameterId: 6287, name: "Serum Triglyceride", code: "TG" },
  { id: 18305, parameterId: 6288, name: "HDL CHOLESTEROL", code: "HDL" },
  { id: 18306, parameterId: 2192, name: "LDL CHOLESTEROL", code: "LDL" },
  { id: 18307, parameterId: 6289, name: "VLDL CHOLESTEROL", code: "VLDL" },
  { id: 9984, parameterId: 3170, name: "NON-HDL CHOLESTEROL", code: "NON_HDL_CHOLESTEROL" },
  { id: 18309, parameterId: 6290, name: "TOTAL CHOLESTEROL / HDL RATIO", code: "TC_HDL_RATIO" },
  { id: 18310, parameterId: 6291, name: "LDL / HDL RATIO", code: "LDL_HDL_RATIO" },
  { id: 18311, parameterId: 2827, name: "CHOLESTEROL / HDL RATIO", code: "CHOLHDL" },
];

const formulas = [
  { id: 345, outputParameterId: 2192, formula: "CHOL - HDL - (TRIG / 5)", outputParameter: { id: 2192, name: "LDL CHOLESTEROL", code: "LDL" } },
  { id: 346, outputParameterId: 6289, formula: "TRIG / 5", outputParameter: { id: 6289, name: "VLDL CHOLESTEROL", code: "VLDL" } },
  { id: 347, outputParameterId: 3170, formula: "CHOL - HDL", outputParameter: { id: 3170, name: "NON-HDL CHOLESTEROL", code: "NON_HDL_CHOLESTEROL" } },
  { id: 348, outputParameterId: 6290, formula: "CHOL / HDL", outputParameter: { id: 6290, name: "TOTAL CHOLESTEROL / HDL RATIO", code: "TC_HDL_RATIO" } },
  { id: 349, outputParameterId: 6291, formula: "LDL / HDL", outputParameter: { id: 6291, name: "LDL / HDL RATIO", code: "LDL_HDL_RATIO" } },
  { id: 350, outputParameterId: 2827, formula: "CHOL / HDL", outputParameter: { id: 2827, name: "CHOLESTEROL / HDL RATIO", code: "CHOLHDL" } },
];

// User inputs CHOL = 200, TG = 150, HDL = 50
const typedValues = {
  9950: "200",
  18304: "150",
  18305: "50"
};

const valuesMap = {};
userParams.forEach(tp => {
  const raw = typedValues[tp.id];
  if (raw) {
    addValueToValuesMap(valuesMap, tp, parseFloat(raw));
  }
});

const res = { ...typedValues };
let changed = true;
let pass = 0;
const evaluatedFormulas = new Set();

while (changed && pass < 5) {
  changed = false;
  pass++;
  console.log(`--- PASS ${pass} ---`);
  for (const form of formulas) {
    if (evaluatedFormulas.has(form.id)) continue;
    const tp = userParams.find(p => p.parameterId === form.outputParameterId);
    if (!tp) continue;

    const canEval = checkFormulaDependencies(form.formula, valuesMap);
    console.log(`Formula ${form.id} ("${form.outputParameter.name}": "${form.formula}"): canEval=${canEval}`);
    if (canEval) {
      const result = evaluateExpression(form.formula, valuesMap);
      console.log(`  Result: ${result}`);
      if (result !== null && !isNaN(result)) {
        const roundedResult = parseFloat(result.toFixed(2));
        addValueToValuesMap(valuesMap, form.outputParameter, roundedResult);
        res[tp.id] = String(roundedResult);
        evaluatedFormulas.add(form.id);
        changed = true;
      }
    }
  }
}

console.log("\nFinal Calculated Values:");
userParams.forEach(tp => {
  console.log(`  ${tp.name} (${tp.code}): ${res[tp.id] || "EMPTY"}`);
});
