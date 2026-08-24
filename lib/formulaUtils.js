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
    } else if (code === "EGFR" || code === "GFR") {
      valuesMap["EGFR"] = numVal;
      valuesMap["GFR"] = numVal;
      valuesMap["egfr"] = numVal;
      valuesMap["gfr"] = numVal;
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
      "gfrglomerularfiltrationrate": ["EGFR", "GFR"],
      "glomerularfiltrationrate": ["EGFR", "GFR"],
      "gfr": ["EGFR", "GFR"],
      "egfr": ["EGFR", "GFR"],
      "gfrglomeerularfiltrationrate": ["EGFR", "GFR"],
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
 * Injects patient demographic parameters (age, gender, boolean flags) into valuesMap.
 */
export function addPatientContextToValuesMap(valuesMap, reg) {
  if (!reg || !valuesMap) return;

  // 1. Patient Age (converted to years if unit is Month or Day)
  if (reg.age !== undefined && reg.age !== null && !isNaN(Number(reg.age))) {
    const rawAge = Number(reg.age);
    let ageInYears = rawAge;
    const unit = (reg.ageUnit || "Year").toLowerCase().trim();
    if (unit.startsWith("month")) {
      ageInYears = rawAge / 12;
    } else if (unit.startsWith("day")) {
      ageInYears = rawAge / 365.25;
    }

    valuesMap["AGE"] = ageInYears;
    valuesMap["age"] = ageInYears;
    valuesMap["Age"] = ageInYears;
    valuesMap["patient_age"] = ageInYears;
    valuesMap["PATIENT_AGE"] = ageInYears;
    valuesMap["patientAge"] = ageInYears;
  }

  // 2. Patient Gender
  if (reg.gender) {
    const g = String(reg.gender).trim();
    const gLower = g.toLowerCase();
    const isFemale = gLower === "female" || gLower === "f";
    const isMale = gLower === "male" || gLower === "m";

    const stdGender = isFemale ? "Female" : (isMale ? "Male" : g);
    valuesMap["GENDER"] = stdGender;
    valuesMap["gender"] = stdGender;
    valuesMap["Gender"] = stdGender;
    valuesMap["SEX"] = stdGender;
    valuesMap["sex"] = stdGender;

    // Numeric / Boolean indicators for formulas
    valuesMap["IS_FEMALE"] = isFemale ? 1 : 0;
    valuesMap["is_female"] = isFemale ? 1 : 0;
    valuesMap["FEMALE"] = isFemale ? 1 : 0;
    valuesMap["female"] = isFemale ? 1 : 0;

    valuesMap["IS_MALE"] = isMale ? 1 : 0;
    valuesMap["is_male"] = isMale ? 1 : 0;
    valuesMap["MALE"] = isMale ? 1 : 0;
    valuesMap["male"] = isMale ? 1 : 0;
  }
}

/**
 * Safely evaluates a math expression by replacing tokens and sanitizing inputs.
 * Supports +, -, *, /, %, ^, parenthesis, and standard math functions (ROUND, ABS, SQRT, MIN, MAX, IF, POW, POWER, EXP, LN, LOG, LOG10, CEIL, FLOOR).
 * Supports bracket notation [param] and string comparisons (e.g. gender == 'Female').
 */
export function evaluateExpression(formulaStr, valuesMap) {
  if (!formulaStr) return null;

  // 1. Normalize bracketed tokens: e.g. [age] -> age, [CREAT] -> CREAT, [gender] -> gender
  let prepared = formulaStr.replace(/\[([a-zA-Z0-9_]+)\]/g, "$1");

  // 2. Replace exponentiation operator ^ with JS standard **
  prepared = prepared.replace(/\^/g, "**");

  // 3. Extract and preserve string literals (e.g. 'Female', "Male")
  const stringLiterals = [];
  prepared = prepared.replace(/(['"])(.*?)\1/g, (match, quote, text) => {
    stringLiterals.push(text);
    return `__STR_LIT_${stringLiterals.length - 1}__`;
  });

  // 4. Identify variable tokens (excluding function keywords, string placeholders, and null/boolean literals)
  const tokenRegex = /\b(?!ROUND|ABS|SQRT|MIN|MAX|IF|POW|POWER|EXP|LN|LOG|LOG10|CEIL|FLOOR|null|NULL|true|false|TRUE|FALSE|__STR_LIT_\d+__\b)[a-zA-Z_][a-zA-Z0-9_]*\b/g;

  const substituted = prepared.replace(tokenRegex, (match) => {
    const val = valuesMap[match] ?? valuesMap[match.toUpperCase()] ?? valuesMap[match.toLowerCase()];
    if (val !== undefined && val !== null) {
      if (typeof val === "string") {
        return JSON.stringify(val);
      }
      if (!isNaN(val)) {
        return val;
      }
    }
    return match;
  });

  // 5. Restore string literals
  let restored = substituted.replace(/__STR_LIT_(\d+)__/g, (match, idx) => {
    return JSON.stringify(stringLiterals[Number(idx)]);
  });

  // 6. Sanitize the expression to allow only safe JS characters
  const sanitized = restored.replace(/[^0-9+\-*/%().\s*<>!=&|?:,"'a-zA-Z_]/g, "");

  const allowedKeywords = /^(ROUND|ABS|SQRT|MIN|MAX|IF|POW|POWER|EXP|LN|LOG|LOG10|CEIL|FLOOR|null|NULL|true|false|TRUE|FALSE)$/i;
  const testNoStrings = sanitized.replace(/(['"])(.*?)\1/g, "''");
  const unknownTokens = testNoStrings.match(/[a-zA-Z_][a-zA-Z0-9_]*/g) || [];
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
      POW: Math.pow,
      POWER: Math.pow,
      EXP: Math.exp,
      LN: Math.log,
      LOG: Math.log10,
      LOG10: Math.log10,
      CEIL: Math.ceil,
      FLOOR: Math.floor,
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
 * Handles bracketed tokens, string literals, and function keywords.
 */
export function checkFormulaDependencies(formulaStr, valuesMap) {
  if (!formulaStr) return false;

  let prepared = formulaStr.replace(/\[([a-zA-Z0-9_]+)\]/g, "$1");
  prepared = prepared.replace(/(['"])(.*?)\1/g, "");

  const tokenRegex = /\b(?!ROUND|ABS|SQRT|MIN|MAX|IF|POW|POWER|EXP|LN|LOG|LOG10|CEIL|FLOOR|null|NULL|true|false|TRUE|FALSE\b)[a-zA-Z_][a-zA-Z0-9_]*\b/g;
  const matches = prepared.match(tokenRegex) || [];

  for (const match of matches) {
    const val = valuesMap[match] ?? valuesMap[match.toUpperCase()] ?? valuesMap[match.toLowerCase()];
    if (val === undefined || val === null || val === "") {
      return false;
    }
    if (typeof val !== "string" && isNaN(val)) {
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
export function calculateAllDependents(values, tests, changedId = null, overrides = new Set(), reg = null) {
  const res = { ...values };

  // 1. Build valuesMap of currently typed values & patient demographics
  const valuesMap = {};
  if (reg) {
    addPatientContextToValuesMap(valuesMap, reg);
  }

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

/**
 * Validates Differential Cell Count (Neutrophils, Lymphocytes, Eosinophils, Monocytes, Basophils).
 * Returns error string if invalid, or null if valid.
 */
export function validateDifferentialCount(tests = [], resultValues = {}) {
  const DLC_KEYS = [
    {
      code: "NEUT",
      matches: (code, norm) => {
        if (code === "NEUT" || code === "POLY") return true;
        if (norm.includes("absolute") || norm.includes("anc") || norm.includes("count")) return false;
        return (
          norm === "neutrophils" ||
          norm === "neutrophil" ||
          norm === "neut" ||
          norm === "polymorphs" ||
          norm === "segs" ||
          norm === "segmentedneutrophils"
        );
      },
    },
    {
      code: "LYMPH",
      matches: (code, norm) => {
        if (code === "LYMPH") return true;
        if (norm.includes("absolute") || norm.includes("alc") || norm.includes("count")) return false;
        return (
          norm === "lymphocytes" ||
          norm === "lymphocyte" ||
          norm === "lymph"
        );
      },
    },
    {
      code: "EOS",
      matches: (code, norm) => {
        if (code === "EOS") return true;
        if (norm.includes("absolute") || norm.includes("aec") || norm.includes("count")) return false;
        return (
          norm === "eosinophils" ||
          norm === "eosinophil" ||
          norm === "eos"
        );
      },
    },
    {
      code: "MONO",
      matches: (code, norm) => {
        if (code === "MONO") return true;
        if (norm.includes("absolute") || norm.includes("amc") || norm.includes("count")) return false;
        return (
          norm === "monocytes" ||
          norm === "monocyte" ||
          norm === "mono"
        );
      },
    },
    {
      code: "BASO",
      matches: (code, norm) => {
        if (code === "BASO") return true;
        if (norm.includes("absolute") || norm.includes("abc") || norm.includes("count")) return false;
        return (
          norm === "basophils" ||
          norm === "basophil" ||
          norm === "baso"
        );
      },
    },
  ];

  for (const test of tests) {
    const params = test.parameters || [];
    let sum = 0;
    let filledCount = 0;
    const matchedParams = [];

    params.forEach((param) => {
      if (param.isHeader) return;
      const pCode = (param.code || param.parameter?.code || "").toUpperCase().trim();
      const pNameNorm = (param.name || param.parameter?.name || "").toLowerCase().replace(/[^a-z0-9]/g, "");
      const pUnit = (param.unit || param.parameter?.unit || "").trim().toLowerCase();

      // Exclude absolute counts and WBC
      if (
        pNameNorm.includes("absolute") ||
        pNameNorm.includes("totalwbc") ||
        pCode === "WBC" ||
        pCode === "ANC" ||
        pCode === "ALC" ||
        pCode === "AEC" ||
        pCode === "AMC" ||
        pCode === "ABC" ||
        pUnit.includes("cumm") ||
        pUnit.includes("cells") ||
        pUnit.includes("10^")
      ) {
        return;
      }

      const match = DLC_KEYS.find((def) => def.matches(pCode, pNameNorm));
      if (match) {
        matchedParams.push(param);
        const rawVal = resultValues ? resultValues[param.id] : null;
        if (rawVal !== undefined && rawVal !== null && String(rawVal).trim() !== "") {
          const num = parseFloat(String(rawVal).trim());
          if (!isNaN(num)) {
            sum += num;
            filledCount++;
          }
        }
      }
    });

    if (matchedParams.length >= 2 && filledCount > 0) {
      const roundedSum = parseFloat(sum.toFixed(2));
      if (roundedSum !== 100) {
        return `Differential Cell Count total is ${roundedSum}%. Total 100% hona zaroori hai (Neutrophils + Lymphocytes + Eosinophils + Monocytes + Basophils = 100%).`;
      }
    }
  }

  return null;
}

