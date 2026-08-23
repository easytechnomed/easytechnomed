export function addValueToValuesMap(valuesMap, param, numVal) {
  if (numVal === null || numVal === undefined || isNaN(numVal)) return;

  // 1. By ID / parameterId
  const id = param.id;
  if (id) {
    valuesMap[id] = numVal;
    valuesMap[String(id)] = numVal;
  }
  const parameterId = param.parameterId;
  if (parameterId) {
    valuesMap[parameterId] = numVal;
    valuesMap[String(parameterId)] = numVal;
  }

  // 2. By Code (case-insensitive)
  const rawCode = param.code || param.parameter?.code || "";
  if (rawCode) {
    const code = rawCode.trim().toUpperCase();
    valuesMap[code] = numVal;
    valuesMap[code.toLowerCase()] = numVal;

    // Exact standard medical code aliases (Code-to-Code mapping)
    if (code === "HB" || code === "HGB") {
      valuesMap["HB"] = numVal;
      valuesMap["HGB"] = numVal;
      valuesMap["hb"] = numVal;
      valuesMap["hgb"] = numVal;
    } else if (code === "PCV" || code === "HCT") {
      valuesMap["PCV"] = numVal;
      valuesMap["HCT"] = numVal;
      valuesMap["pcv"] = numVal;
      valuesMap["hct"] = numVal;
    } else if (code === "WBC" || code === "TLC") {
      valuesMap["WBC"] = numVal;
      valuesMap["TLC"] = numVal;
      valuesMap["wbc"] = numVal;
      valuesMap["tlc"] = numVal;
    } else if (code === "NEUT" || code === "POLY") {
      valuesMap["NEUT"] = numVal;
      valuesMap["POLY"] = numVal;
      valuesMap["neut"] = numVal;
      valuesMap["poly"] = numVal;
    } else if (code === "TG" || code === "TRIG") {
      valuesMap["TG"] = numVal;
      valuesMap["TRIG"] = numVal;
      valuesMap["tg"] = numVal;
      valuesMap["trig"] = numVal;
    } else if (code === "CHOL" || code === "TC") {
      valuesMap["CHOL"] = numVal;
      valuesMap["TC"] = numVal;
      valuesMap["chol"] = numVal;
      valuesMap["tc"] = numVal;
    } else if (code === "CR" || code === "CREAT") {
      valuesMap["CR"] = numVal;
      valuesMap["CREAT"] = numVal;
      valuesMap["cr"] = numVal;
      valuesMap["creat"] = numVal;
    } else if (code === "TB" || code === "TBIL") {
      valuesMap["TB"] = numVal;
      valuesMap["TBIL"] = numVal;
      valuesMap["tb"] = numVal;
      valuesMap["tbil"] = numVal;
    } else if (code === "DB" || code === "DBIL") {
      valuesMap["DB"] = numVal;
      valuesMap["DBIL"] = numVal;
      valuesMap["db"] = numVal;
      valuesMap["dbil"] = numVal;
    } else if (code === "IB" || code === "IBIL") {
      valuesMap["IB"] = numVal;
      valuesMap["IBIL"] = numVal;
      valuesMap["ib"] = numVal;
      valuesMap["ibil"] = numVal;
    } else if (code === "SGOT" || code === "AST") {
      valuesMap["SGOT"] = numVal;
      valuesMap["AST"] = numVal;
      valuesMap["sgot"] = numVal;
      valuesMap["ast"] = numVal;
    } else if (code === "SGPT" || code === "ALT") {
      valuesMap["SGPT"] = numVal;
      valuesMap["ALT"] = numVal;
      valuesMap["sgpt"] = numVal;
      valuesMap["alt"] = numVal;
    }
  }

  // 3. By Exact Parameter Name (trimmed and alphanumeric normalized)
  const rawName = param.name || param.parameter?.name || param.parameterName || "";
  if (rawName) {
    const trimmed = rawName.trim();
    valuesMap[trimmed] = numVal;
    const normName = trimmed.toLowerCase().replace(/[^a-z0-9]/g, "");
    valuesMap[normName] = numVal;
    valuesMap[normName.toUpperCase()] = numVal;

    // Exact name-to-code fallbacks (ONLY if code was missing or not already handled)
    const EXACT_NAME_TO_CODES = {
      // CBC
      "totalwbccount": ["WBC", "TLC"],
      "wbccount": ["WBC", "TLC"],
      "tlc": ["WBC", "TLC"],
      "wbc": ["WBC", "TLC"],
      "hemoglobin": ["HB", "HGB"],
      "haemoglobin": ["HB", "HGB"],
      "hemoglobinhb": ["HB", "HGB"],
      "hb": ["HB", "HGB"],
      "hgb": ["HB", "HGB"],
      "rbccount": ["RBC"],
      "rbccountredbloodcells": ["RBC"],
      "rbc": ["RBC"],
      "hematocrit": ["PCV", "HCT"],
      "haematocrit": ["PCV", "HCT"],
      "hematocritpcv": ["PCV", "HCT"],
      "pcvhaematocrit": ["PCV", "HCT"],
      "pcv": ["PCV", "HCT"],
      "hct": ["PCV", "HCT"],
      "meancorpuscularvolume": ["MCV"],
      "meancorpuscularvolumemcv": ["MCV"],
      "mcv": ["MCV"],
      "meancorpuscularhemoglobin": ["MCH"],
      "meancorpuscularhemoglobinmch": ["MCH"],
      "mch": ["MCH"],
      "meancorpuscularhbconcentration": ["MCHC"],
      "meancorpuscularhbconcentrationmchc": ["MCHC"],
      "mchc": ["MCHC"],
      "neutrophils": ["NEUT", "POLY"],
      "polymorphs": ["NEUT", "POLY"],
      "polymorphsneutrophils": ["NEUT", "POLY"],
      "neut": ["NEUT", "POLY"],
      "poly": ["NEUT", "POLY"],
      "lymphocytes": ["LYMPH"],
      "lymph": ["LYMPH"],
      "eosinophils": ["EOS"],
      "eos": ["EOS"],
      "monocytes": ["MONO"],
      "mono": ["MONO"],
      "basophils": ["BASO"],
      "baso": ["BASO"],
      "absoluteneutrophilcount": ["ANC"],
      "absoluteneutrophilcountanc": ["ANC"],
      "absoluteneutrophilscount": ["ANC"],
      "anc": ["ANC"],
      "absolutelymphocytecount": ["ALC"],
      "absolutelymphocytecountalc": ["ALC"],
      "absolutelymphocytescount": ["ALC"],
      "alc": ["ALC"],
      "absoluteeosinophilcount": ["AEC"],
      "absoluteeosinophilcountaec": ["AEC"],
      "absoluteeosinophilscount": ["AEC"],
      "aec": ["AEC"],
      "absolutemonocytecount": ["AMC"],
      "absolutemonocytecountamc": ["AMC"],
      "absolutemonocytescount": ["AMC"],
      "amc": ["AMC"],
      "absolutebasophilcount": ["ABC"],
      "absolutebasophilcountabc": ["ABC"],
      "absolutebasophilscount": ["ABC"],
      "abc": ["ABC"],
      "plateletcount": ["PLT"],
      "plateletscount": ["PLT"],
      "plt": ["PLT"],
      "rdwcv": ["RDW_CV"],
      "rdwsd": ["RDW_SD"],
      "mentzerindex": ["MENTZER_INDEX"],

      // LFT
      "totalbilirubin": ["TB", "TBIL"],
      "serumtotalbilirubin": ["TB", "TBIL"],
      "bilirubintotal": ["TB", "TBIL"],
      "tb": ["TB", "TBIL"],
      "tbil": ["TB", "TBIL"],
      "directbilirubin": ["DB", "DBIL"],
      "serumdirectbilirubin": ["DB", "DBIL"],
      "bilirubindirect": ["DB", "DBIL"],
      "db": ["DB", "DBIL"],
      "dbil": ["DB", "DBIL"],
      "indirectbilirubin": ["IB", "IBIL"],
      "serumindirectbilirubin": ["IB", "IBIL"],
      "bilirubinindirect": ["IB", "IBIL"],
      "ib": ["IB", "IBIL"],
      "ibil": ["IB", "IBIL"],
      "totalprotein": ["TP"],
      "serumtotalprotein": ["TP"],
      "proteintotal": ["TP"],
      "tp": ["TP"],
      "albumin": ["ALB"],
      "serumalbumin": ["ALB"],
      "alb": ["ALB"],
      "globulin": ["GLOB"],
      "serumglobulin": ["GLOB"],
      "glob": ["GLOB"],
      "albuminglobulinratio": ["AGR", "A_G_RATIO"],
      "agratio": ["AGR", "A_G_RATIO"],
      "sgot": ["SGOT", "AST"],
      "sgotast": ["SGOT", "AST"],
      "ast": ["SGOT", "AST"],
      "sgpt": ["SGPT", "ALT"],
      "sgptalt": ["SGPT", "ALT"],
      "alt": ["SGPT", "ALT"],
      "alkalinephosphatase": ["ALP"],
      "alp": ["ALP"],

      // KFT / Renal
      "bloodurea": ["UREA"],
      "serumurea": ["UREA"],
      "urea": ["UREA"],
      "bloodureanitrogen": ["BUN"],
      "bloodureanitrogenbun": ["BUN"],
      "bun": ["BUN"],
      "serumcreatinine": ["CR", "CREAT"],
      "creatinine": ["CR", "CREAT"],
      "cr": ["CR", "CREAT"],
      "creat": ["CR", "CREAT"],
      "ureacreatinineratio": ["UCR"],
      "buncreatinineratio": ["BCR"],
      "serumuricacid": ["URIC_ACID"],
      "uricacid": ["URIC_ACID"],

      // Lipids
      "totalcholesterol": ["CHOL", "TC"],
      "cholesteroltotal": ["CHOL", "TC"],
      "serumcholesterol": ["CHOL", "TC"],
      "cholesterol": ["CHOL", "TC"],
      "chol": ["CHOL", "TC"],
      "tc": ["CHOL", "TC"],
      "triglycerides": ["TG", "TRIG"],
      "triglyceride": ["TG", "TRIG"],
      "serumtriglycerides": ["TG", "TRIG"],
      "tg": ["TG", "TRIG"],
      "trig": ["TG", "TRIG"],
      "hdlcholesterol": ["HDL"],
      "serumhdl": ["HDL"],
      "hdl": ["HDL"],
      "ldlcholesterol": ["LDL"],
      "serumldl": ["LDL"],
      "ldl": ["LDL"],
      "vldlcholesterol": ["VLDL"],
      "serumvldl": ["VLDL"],
      "vldl": ["VLDL"],
      "nonhdlcholesterol": ["NON_HDL"],
      "nonhdl": ["NON_HDL"],
      "cholesterolhdlratio": ["CHOL_HDL_RATIO"],
      "ldlhdlratio": ["LDL_HDL_RATIO"],
    };

    const mappedCodes = EXACT_NAME_TO_CODES[normName];
    if (mappedCodes) {
      mappedCodes.forEach((aliasCode) => {
        valuesMap[aliasCode] = numVal;
        valuesMap[aliasCode.toLowerCase()] = numVal;
      });
    }
  }
}

export function evaluateExpression(formulaStr, valuesMap) {
  if (!formulaStr) return null;

  // Replace exponentiation operator ^ with JS standard **
  let prepared = formulaStr.replace(/\^/g, "**");

  // Identify variable tokens (excluding function keywords and null/boolean literals)
  const tokenRegex = /\b(?!ROUND|ABS|SQRT|MIN|MAX|IF|null|NULL\b)[a-zA-Z_][a-zA-Z0-9_]*\b/g;

  const substituted = prepared.replace(tokenRegex, (match) => {
    const val = valuesMap[match] ?? valuesMap[match.toUpperCase()] ?? valuesMap[match.toLowerCase()];
    if (val !== undefined && val !== null && !isNaN(val)) {
      return val;
    }
    return match;
  });

  // Sanitize the expression to allow only numbers, math operators, logic characters, and allowed keywords
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
      IF: (cond, tVal, fVal) => (cond ? tVal : fVal),
      NULL: null,
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
}

export function checkFormulaDependencies(formulaStr, valuesMap) {
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
}

const regPayload = {
  tests: [
    {
      id: 2398,
      name: "COMPLETE BLOOD COUNT (CBC)",
      parameters: [
        { id: 10036, parameterId: 2748, code: "WBC", name: "Total W.B.C. Count" },
        { id: 18327, parameterId: 2747, code: "HB", name: "Hemoglobin (Hb)" },
        { id: 18328, parameterId: 6301, code: "RBC", name: "R.B.C. COUNT" },
        { id: 10060, parameterId: 2752, code: "PCV", name: "Hematocrit (PCV)" },
        { id: 10062, parameterId: 1955, code: "MCV", name: "MCV" },
        { id: 10064, parameterId: 1956, code: "MCH", name: "MCH" },
        { id: 10066, parameterId: 1957, code: "MCHC", name: "MCHC" },
        { id: 10039, parameterId: 2056, code: "NEUT", name: "Neutrophils" },
        { id: 10041, parameterId: 2020, code: "LYMPH", name: "Lymphocytes" },
        { id: 10043, parameterId: 2062, code: "EOS", name: "Eosinophils" },
        { id: 10045, parameterId: 2063, code: "MONO", name: "Monocytes" },
        { id: 10047, parameterId: 2749, code: "BASO", name: "Basophils" },
        { id: 10049, parameterId: 2750, code: "ANC", name: "Absolute Neutrophils Count" },
        { id: 10051, parameterId: 2751, code: "ALC", name: "Absolute Lymphocytes Count" },
        { id: 10053, parameterId: 2673, code: "AEC", name: "Absolute Eosinophils Count" },
        { id: 10073, parameterId: 2674, code: "AMC", name: "Absolute Monocyte Count" },
        { id: 10075, parameterId: 2675, code: "ABC", name: "Absolute Basophil Count" },
        { id: 10071, parameterId: 2113, code: "PLT", name: "Platelets Count" }
      ],
      formulas: [
        { id: 255, outputParameterId: 2750, formula: "(WBC * NEUT) / 100", outputParameter: { id: 2750, code: "ANC", name: "Absolute Neutrophils Count" } },
        { id: 256, outputParameterId: 2751, formula: "(WBC * LYMPH) / 100", outputParameter: { id: 2751, code: "ALC", name: "Absolute Lymphocytes Count" } },
        { id: 257, outputParameterId: 2673, formula: "(WBC * EOS) / 100", outputParameter: { id: 2673, code: "AEC", name: "Absolute Eosinophils Count" } },
        { id: 258, outputParameterId: 2674, formula: "(WBC * MONO) / 100", outputParameter: { id: 2674, code: "AMC", name: "Absolute Monocyte Count" } },
        { id: 259, outputParameterId: 2675, formula: "(WBC * BASO) / 100", outputParameter: { id: 2675, code: "ABC", name: "Absolute Basophil Count" } },
        { id: 438, outputParameterId: 1955, formula: "(PCV * 10) / RBC", outputParameter: { id: 1955, code: "MCV", name: "MCV" } },
        { id: 439, outputParameterId: 1956, formula: "(HB * 10) / RBC", outputParameter: { id: 1956, code: "MCH", name: "MCH" } },
        { id: 440, outputParameterId: 1957, formula: "(HB * 100) / PCV", outputParameter: { id: 1957, code: "MCHC", name: "MCHC" } },
      ]
    }
  ]
};

const inputValues = {
  10036: "4000", // WBC
  18327: "15",   // HB
  18328: "4.7",  // RBC
  10060: "45",   // PCV
  10039: "79",   // NEUT
  10041: "18",   // LYMPH
  10043: "1",    // EOS
  10045: "1",    // MONO
  10047: "1",    // BASO
};

const valuesMap = {};
regPayload.tests[0].parameters.forEach(tp => {
  if (inputValues[tp.id]) {
    addValueToValuesMap(valuesMap, tp, parseFloat(inputValues[tp.id]));
  }
});

console.log("Initial NEUT:", valuesMap["NEUT"]);

// Multi-pass formula execution
for (let pass = 1; pass <= 3; pass++) {
  console.log(`\n--- Pass ${pass} ---`);
  for (const form of regPayload.tests[0].formulas) {
    if (checkFormulaDependencies(form.formula, valuesMap)) {
      const res = evaluateExpression(form.formula, valuesMap);
      console.log(`Formula ${form.outputParameter.code} = ${form.formula} -> ${res}`);
      addValueToValuesMap(valuesMap, form.outputParameter, res);
      console.log(`After evaluating ${form.outputParameter.code}, valuesMap["NEUT"] =`, valuesMap["NEUT"]);
    }
  }
}
