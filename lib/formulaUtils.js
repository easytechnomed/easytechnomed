/**
 * Pure utility functions for Formula Engine and Result Calculation.
 * Safe for both Client and Server environments (no Prisma or DB dependencies).
 */

/**
 * Maps parameter code, id, name, and exact medical aliases to numeric values in valuesMap.
 * Note: Never uses loose substring matching (.includes) to avoid cross-parameter pollution.
 */
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

/**
 * Safely evaluates a math expression by replacing tokens and sanitizing inputs.
 * Supports +, -, *, /, %, parenthesis, and standard math functions (ROUND, ABS, SQRT, MIN, MAX, IF).
 */
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

/**
 * Checks if all parameter dependency tokens in the formula exist in valuesMap.
 */
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

/**
 * Resolves reference range (min, max, rangeStr) based on patient age and gender.
 */
export function getReferenceRange(param, reg) {
  if (!reg || !param) {
    return {
      rangeStr: param?.normalRangeDefault || "",
      min: param?.minValMale ?? null,
      max: param?.maxValMale ?? null,
    };
  }
  const isBaby = reg.ageUnit !== "Year" || reg.age < 12;
  if (isBaby) {
    return {
      rangeStr: param.normalRangeBaby || param.normalRangeDefault || "",
      min: param.minValBaby,
      max: param.maxValBaby,
    };
  }
  if (reg.gender === "Female") {
    return {
      rangeStr: param.normalRangeFemale || param.normalRangeDefault || "",
      min: param.minValFemale,
      max: param.maxValFemale,
    };
  }
  return {
    rangeStr: param.normalRangeMale || param.normalRangeDefault || "",
    min: param.minValMale,
    max: param.maxValMale,
  };
}

/**
 * Resolves standard and critical range thresholds based on patient age and gender.
 */
export function getRangeAndCriticalThresholds(param, reg) {
  const isBaby = reg.ageUnit !== "Year" || reg.age < 12;

  let min = param.minValMale;
  let max = param.maxValMale;
  let rangeStr = param.normalRangeMale || param.normalRangeDefault || "";
  let criticalMin = param.criticalMinValMale ?? param.criticalMinValDefault;
  let criticalMax = param.criticalMaxValMale ?? param.criticalMaxValDefault;

  if (isBaby) {
    min = param.minValBaby;
    max = param.maxValBaby;
    rangeStr = param.normalRangeBaby || param.normalRangeDefault || "";
    criticalMin = param.criticalMinValBaby ?? param.criticalMinValDefault;
    criticalMax = param.criticalMaxValBaby ?? param.criticalMaxValDefault;
  } else if (reg.gender === "Female") {
    min = param.minValFemale;
    max = param.maxValFemale;
    rangeStr = param.normalRangeFemale || param.normalRangeDefault || "";
    criticalMin = param.criticalMinValFemale ?? param.criticalMinValDefault;
    criticalMax = param.criticalMaxValFemale ?? param.criticalMaxValDefault;
  }

  return {
    min,
    max,
    rangeStr,
    criticalMin,
    criticalMax,
    valueType: param.valueType,
    options: param.options,
    normalRangeDefault: param.normalRangeDefault,
  };
}

/**
 * Qualitative abnormality check.
 */
export function isQualitativeAbnormal(valStr, refRangeStr = "") {
  if (!valStr || typeof valStr !== "string") return false;
  const valLower = valStr.trim().toLowerCase();
  const refLower = (refRangeStr || "").trim().toLowerCase();

  // If matches ref exactly, it's normal
  if (refLower && valLower === refLower) return false;

  // Abnormal keywords
  if (valLower.includes("reactive") && !valLower.includes("non")) return true;
  if (valLower.includes("positive") && !valLower.includes("non")) return true;
  if (valLower.includes("present") && !valLower.includes("absent")) return true;
  if (valLower.includes("detected") && !valLower.includes("not")) return true;
  if (["abnormal", "trace", "seen", "+", "++", "+++", "++++", "1+", "2+", "3+", "4+", "cloudy", "turbid", "hazy"].some(k => valLower === k || (k.startsWith("+") && valLower.includes(k)))) {
    return true;
  }

  // Normal keywords
  if (valLower.includes("negative") || valLower.includes("non-reactive") || valLower.includes("non reactive") || valLower.includes("nonreactive") || valLower.includes("absent") || valLower.includes("not detected") || valLower === "nil" || valLower === "normal" || valLower === "clear") {
    return false;
  }

  // If normal range expects negative/absent/nil and value is different
  if (refLower.includes("negative") && valLower.includes("positive")) return true;
  if ((refLower.includes("non-reactive") || refLower.includes("non reactive")) && valLower.includes("reactive") && !valLower.includes("non")) return true;
  if ((refLower.includes("absent") || refLower.includes("nil")) && valLower.includes("present")) return true;

  return false;
}

/**
 * Out of range check for numeric or qualitative values.
 */
export function isOutOfRange(valStr, min, max, param = null, refRangeStr = "") {
  if (!valStr) return false;
  const valRaw = String(valStr).trim();
  const num = parseFloat(valRaw);
  if (!isNaN(num) && /^-?\d+(\.\d+)?$/.test(valRaw) && (min !== null || max !== null)) {
    if (min !== null && min !== undefined && num < min) return true;
    if (max !== null && max !== undefined && num > max) return true;
    return false;
  }
  return isQualitativeAbnormal(valRaw, refRangeStr);
}

/**
 * Automatically determines result flag (Low, High, Critical Low, Critical High, Normal, or Qualitative Abnormal/Positive/Reactive).
 */
export function determineFlag(value, thresholds, param = null) {
  if (value === null || value === undefined || String(value).trim() === "") return null;
  const rawStr = String(value).trim();
  const valLower = rawStr.toLowerCase();

  const num = parseFloat(rawStr);
  const isNumericValue = !isNaN(num) && /^-?\d+(\.\d+)?$/.test(rawStr);
  const hasNumericThresholds =
    thresholds &&
    (thresholds.min !== null && thresholds.min !== undefined ||
      thresholds.max !== null && thresholds.max !== undefined ||
      thresholds.criticalMin !== null && thresholds.criticalMin !== undefined ||
      thresholds.criticalMax !== null && thresholds.criticalMax !== undefined);

  // If strictly numeric with thresholds:
  if (isNumericValue && hasNumericThresholds) {
    if (thresholds.criticalMin !== null && thresholds.criticalMin !== undefined && num < thresholds.criticalMin) {
      return "Critical Low";
    }
    if (thresholds.criticalMax !== null && thresholds.criticalMax !== undefined && num > thresholds.criticalMax) {
      return "Critical High";
    }
    if (thresholds.min !== null && thresholds.min !== undefined && num < thresholds.min) {
      return "Low";
    }
    if (thresholds.max !== null && thresholds.max !== undefined && num > thresholds.max) {
      return "High";
    }
    return "Normal";
  }

  // Qualitative / Option / Boolean / Text check:
  const normalRef = (thresholds?.rangeStr || thresholds?.normalRangeDefault || "").toLowerCase().trim();

  // Common qualitative normal terms
  const isNormalKeyword = [
    "negative",
    "non-reactive",
    "non reactive",
    "nonreactive",
    "absent",
    "not detected",
    "not-detected",
    "nil",
    "normal",
    "clear",
    "not seen",
    "non-immune",
    "nonimmune",
  ].some((term) => valLower === term || valLower.includes(term) && !valLower.includes("positive") && !valLower.includes("reactive"));

  // Common qualitative abnormal terms
  const isAbnormalKeyword = [
    "positive",
    "reactive",
    "present",
    "detected",
    "abnormal",
    "trace",
    "seen",
    "+",
    "++",
    "+++",
    "++++",
    "1+",
    "2+",
    "3+",
    "4+",
    "cloudy",
    "turbid",
    "hazy",
  ].some((term) => {
    if (term === "reactive") {
      return valLower.includes("reactive") && !valLower.includes("non");
    }
    if (term === "positive") {
      return valLower.includes("positive") && !valLower.includes("non");
    }
    return valLower === term || valLower.startsWith("+") && valLower.includes(term);
  });

  if (normalRef) {
    if (valLower === normalRef) {
      return "Normal";
    }
    if (normalRef.includes("negative") && valLower.includes("positive")) {
      return "Positive";
    }
    if ((normalRef.includes("non-reactive") || normalRef.includes("non reactive")) && valLower.includes("reactive") && !valLower.includes("non")) {
      return "Reactive";
    }
    if ((normalRef.includes("absent") || normalRef.includes("nil")) && (valLower.includes("present") || valLower.includes("+") || valLower === "trace")) {
      return "Abnormal";
    }
    if (normalRef.includes("not detected") && valLower.includes("detected") && !valLower.includes("not")) {
      return "Abnormal";
    }
  }

  if (isAbnormalKeyword) {
    if (valLower.includes("reactive") && !valLower.includes("non")) return "Reactive";
    if (valLower.includes("positive") && !valLower.includes("non")) return "Positive";
    return "Abnormal";
  }

  if (isNormalKeyword) {
    return "Normal";
  }

  return null;
}

/**
 * Calculates all dependent formula results given current values and test definitions.
 */
export function calculateAllDependents(values, tests, changedId = null, overrides = new Set()) {
  const res = { ...values };

  // 1. Build valuesMap of currently typed values
  const valuesMap = {};
  tests.forEach((test) => {
    (test.parameters || []).forEach((tp) => {
      const rawVal = res[tp.id];
      if (rawVal !== undefined && rawVal !== null && rawVal !== "") {
        const numVal = parseFloat(rawVal);
        if (!isNaN(numVal)) {
          addValueToValuesMap(valuesMap, tp, numVal);
        }
      }
    });
  });

  // 2. Extract all formulas from the loaded tests
  const formulasToRun = [];
  tests.forEach((test) => {
    (test.formulas || []).forEach((form) => {
      // Find the corresponding testParameter within the test strictly by parameterId or testParameter id
      const tp = (test.parameters || []).find(
        (p) =>
          (p.parameterId && form.outputParameterId && p.parameterId === form.outputParameterId) ||
          (p.id && form.outputParameterId && p.id === form.outputParameterId)
      );

      if (tp) {
        const testParamId = tp.id;
        const testParamConfig = tp;

        // Skip formula calculation if parameter is editable and has manual input override
        if (testParamConfig.editable && (overrides.has(testParamId) || overrides.has(String(testParamId)))) {
          return;
        }

        formulasToRun.push({
          id: form.id,
          formula: form.formula,
          outputTestParameterId: testParamId,
          outputParameterId: form.outputParameterId,
          outputParameterCode: form.outputParameter?.code || tp.code,
          outputParameter: form.outputParameter || tp,
          outputParameterTestConfig: testParamConfig,
        });
      }
    });
  });

  // 3. Multi-pass evaluation loop
  let changed = true;
  let pass = 0;
  const evaluatedFormulas = new Set();

  while (changed && pass < 5) {
    changed = false;
    pass++;
    for (const form of formulasToRun) {
      if (evaluatedFormulas.has(form.id)) continue;

      const canEval = checkFormulaDependencies(form.formula, valuesMap);
      if (canEval) {
        const result = evaluateExpression(form.formula, valuesMap);
        if (result !== null && !isNaN(result)) {
          const precision = form.outputParameterTestConfig?.decimalPlace ?? 2;
          const roundedResult = parseFloat(result.toFixed(precision));

          // Save to valuesMap with all aliases
          addValueToValuesMap(valuesMap, form.outputParameter, roundedResult);

          // Save to res (which maps testParameterId -> stringVal)
          res[form.outputTestParameterId] = String(roundedResult);
          evaluatedFormulas.add(form.id);
          changed = true;
        }
      }
    }
  }

  return res;
}
