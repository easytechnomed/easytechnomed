import { prisma } from "./db.js";

/**
 * Maps all synonyms, medical abbreviations, codes, and names to numeric values in valuesMap.
 */
export function addValueToValuesMap(valuesMap, param, numVal) {
  if (numVal === null || numVal === undefined || isNaN(numVal)) return;

  const id = param.id || param.parameterId;
  if (id) valuesMap[id] = numVal;

  const name = param.name || param.parameterName || "";
  if (name) {
    valuesMap[name.trim()] = numVal;
    const normName = name.toLowerCase().replace(/[^a-z0-9]/g, "");
    valuesMap[normName] = numVal;
    valuesMap[normName.toUpperCase()] = numVal;

    // Lipids
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

    // CBC / DLC
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

    // LFT
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

    // KFT
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
    if (normName.includes("sgot") || normName.includes("ast")) {
      valuesMap["SGOT"] = numVal;
      valuesMap["AST"] = numVal;
      valuesMap["sgot"] = numVal;
      valuesMap["ast"] = numVal;
    }
    if (normName.includes("sgpt") || normName.includes("alt")) {
      valuesMap["SGPT"] = numVal;
      valuesMap["ALT"] = numVal;
      valuesMap["sgpt"] = numVal;
      valuesMap["alt"] = numVal;
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
}

/**
 * Safely evaluates a math expression by replacing tokens and sanitizing inputs.
 * Supports +, -, *, /, %, parenthesis, and numbers.
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
    console.error(`[FormulaEngine] safeEval failed for "${formulaStr}" (sanitized: "${sanitized}"):`, err.message);
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
 * Runs the LIMS formula engine for a given registration.
 * Fetches formulas, evaluates them based on manual values, and updates PatientResult flags.
 */
export async function runFormulaEngine(registrationId, tx) {
  try {
    const db = tx || prisma;

    // 1. Fetch registration info
    const registration = await db.registration.findUnique({
      where: { id: registrationId },
      include: {
        tests: {
          include: {
            test: {
              include: {
                parameters: {
                  where: { isDeleted: false },
                  include: { parameter: true },
                },
                formulas: {
                  include: {
                    outputParameter: true,
                  },
                },
              },
            },
          },
        },
        results: true,
      },
    });

    if (!registration) {
      console.error(`[FormulaEngine] Registration not found: id=${registrationId}`);
      return;
    }

    // 2. Build valuesMap of currently entered results
    const valuesMap = {};

    // Map parameters to their observed values
    const allParams = [];
    const testParamMap = {}; // parameterId -> testParameterId
    const testParamConfigMap = {}; // parameterId -> testParameter

    registration.tests.forEach((rt) => {
      if (rt.test && rt.test.parameters) {
        rt.test.parameters.forEach((tp) => {
          allParams.push(tp.parameter);
          testParamMap[tp.parameter.id] = tp.id;
          testParamConfigMap[tp.parameter.id] = tp;
        });
      }
    });

    registration.results.forEach((res) => {
      // Find parameter linked to this testParameterId
      const param = allParams.find((p) => testParamMap[p.id] === res.testParameterId);
      if (param && res.value !== null && res.value !== undefined && res.value !== "") {
        const numVal = parseFloat(res.value);
        if (!isNaN(numVal)) {
          addValueToValuesMap(valuesMap, param, numVal);
        }
      }
    });

    // 3. Extract and compile all formulas to run
    const formulasToRun = [];
    registration.tests.forEach((rt) => {
      if (rt.test && rt.test.formulas) {
        rt.test.formulas.forEach((form) => {
          const tp = (rt.test.parameters || []).find((p) => p.parameterId === form.outputParameterId);
          if (tp) {
            const testParamId = tp.id;
            const testParamConfig = tp;
            const strippedName = form.outputParameter.name.toLowerCase().replace(/[^a-z0-9]/g, "");
            formulasToRun.push({
              id: form.id,
              formula: form.formula,
              outputTestParameterId: testParamId,
              outputParameterId: form.outputParameterId,
              outputParameterCode: form.outputParameter.code,
              outputParameterNameStripped: strippedName,
              outputParameter: form.outputParameter,
              outputParameterTestConfig: testParamConfig,
            });
          }
        });
      }
    });

    // 4. Multi-pass Evaluation Loop (resolves dependency chains)
    let changed = true;
    let pass = 0;
    const evaluatedFormulas = new Set();
    const resultsToPersist = [];

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

            // Save calculation back to valuesMap with all synonyms and aliases
            addValueToValuesMap(valuesMap, form.outputParameter, roundedResult);

            // Determine flag
            const thresholds = getRangeAndCriticalThresholds(form.outputParameter, registration);
            const flag = determineFlag(roundedResult, thresholds);

            resultsToPersist.push({
              testParameterId: form.outputTestParameterId,
              value: roundedResult,
              flag: flag,
            });

            evaluatedFormulas.add(form.id);
            changed = true;
          }
        }
      }
    }

    // Persist all calculated formulas in a pure Prisma batch transaction (< 10ms)
    if (resultsToPersist.length > 0) {
      const formulaOps = resultsToPersist.map((r) =>
        db.patientResult.upsert({
          where: {
            registrationId_testParameterId: {
              registrationId,
              testParameterId: r.testParameterId,
            },
          },
          update: {
            value: String(r.value),
            flag: r.flag || null,
          },
          create: {
            registrationId,
            testParameterId: r.testParameterId,
            value: String(r.value),
            flag: r.flag || null,
          },
        })
      );

      await db.$transaction(formulaOps);
    }
  } catch (err) {
    console.error("[FormulaEngine] runFormulaEngine Error:", err);
  }
}
