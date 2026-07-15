import { prisma } from "./db.js";

/**
 * Safely evaluates a math expression by replacing tokens and sanitizing inputs.
 * Supports +, -, *, /, %, parenthesis, and numbers.
 */
export function evaluateExpression(formulaStr, valuesMap) {
  if (!formulaStr) return null;

  // Identify alphanumeric tokens (which represent parameter codes or names)
  const tokenRegex = /[a-zA-Z_][a-zA-Z0-9_]*/g;

  // Replace tokens with their numeric values if present in valuesMap
  const substituted = formulaStr.replace(tokenRegex, (match) => {
    // If the token is found in the valuesMap, return its numeric value
    if (valuesMap[match] !== undefined && valuesMap[match] !== null) {
      return valuesMap[match];
    }
    return match; // Keep unchanged
  });

  // Sanitize the expression to allow only numbers, math operators, spaces, and parenthesis
  const sanitized = substituted.replace(/[^0-9+\-*/%().\s]/g, "");

  // If the sanitized expression still contains letters/identifiers, we cannot evaluate it safely
  if (/[a-zA-Z_]/.test(sanitized)) {
    return null;
  }

  try {
    // Evaluate sanitized string safely
    const result = new Function(`return (${sanitized});`)();
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

  const tokenRegex = /[a-zA-Z_][a-zA-Z0-9_]*/g;
  const matches = formulaStr.match(tokenRegex) || [];

  for (const match of matches) {
    if (valuesMap[match] === undefined || valuesMap[match] === null || valuesMap[match] === "") {
      return false; // Dependency is missing
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
  let criticalMin = param.criticalMinValMale ?? param.criticalMinValDefault;
  let criticalMax = param.criticalMaxValMale ?? param.criticalMaxValDefault;

  if (isBaby) {
    min = param.minValBaby;
    max = param.maxValBaby;
    criticalMin = param.criticalMinValBaby ?? param.criticalMinValDefault;
    criticalMax = param.criticalMaxValBaby ?? param.criticalMaxValDefault;
  } else if (reg.gender === "Female") {
    min = param.minValFemale;
    max = param.maxValFemale;
    criticalMin = param.criticalMinValFemale ?? param.criticalMinValDefault;
    criticalMax = param.criticalMaxValFemale ?? param.criticalMaxValDefault;
  }

  return { min, max, criticalMin, criticalMax };
}

/**
 * Automatically determines result flag (Low, High, Critical Low, Critical High, or Normal).
 */
export function determineFlag(value, thresholds) {
  const num = parseFloat(value);
  if (isNaN(num)) return null;

  // Check critical limits first
  if (thresholds.criticalMin !== null && thresholds.criticalMin !== undefined && num < thresholds.criticalMin) {
    return "Critical Low";
  }
  if (thresholds.criticalMax !== null && thresholds.criticalMax !== undefined && num > thresholds.criticalMax) {
    return "Critical High";
  }

  // Check standard limits
  if (thresholds.min !== null && thresholds.min !== undefined && num < thresholds.min) {
    return "Low";
  }
  if (thresholds.max !== null && thresholds.max !== undefined && num > thresholds.max) {
    return "High";
  }

  return "Normal";
}

/**
 * Runs the LIMS formula engine for a given registration.
 * Fetches formulas, evaluates them based on manual values, and updates PatientResult flags.
 */
export async function runFormulaEngine(registrationId, tx) {
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
                include: { parameter: true }
              },
              formulas: {
                include: {
                  outputParameter: true
                }
              }
            }
          }
        }
      },
      results: true
    }
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

  registration.tests.forEach(rt => {
    if (rt.test && rt.test.parameters) {
      rt.test.parameters.forEach(tp => {
        allParams.push(tp.parameter);
        testParamMap[tp.parameter.id] = tp.id;
        testParamConfigMap[tp.parameter.id] = tp;
      });
    }
  });

  registration.results.forEach(res => {
    // Find parameter linked to this testParameterId
    const param = allParams.find(p => testParamMap[p.id] === res.testParameterId);
    if (param && res.value !== null && res.value !== undefined && res.value !== "") {
      const numVal = parseFloat(res.value);
      if (!isNaN(numVal)) {
        valuesMap[param.id] = numVal;
        valuesMap[param.name.trim()] = numVal;

        // Strip spaces and special chars for key mapping (e.g. "Total Cholesterol" -> "totalcholesterol")
        const strippedName = param.name.toLowerCase().replace(/[^a-z0-9]/g, "");
        valuesMap[strippedName] = numVal;

        // Map by Parameter code if configured
        if (param.code) {
          valuesMap[param.code.trim()] = numVal;
          valuesMap[param.code.trim().toLowerCase()] = numVal;
        }
      }
    }
  });

  // 3. Extract and compile all formulas to run
  const formulasToRun = [];
  registration.tests.forEach(rt => {
    if (rt.test && rt.test.formulas) {
      rt.test.formulas.forEach(form => {
        const tp = (rt.test.parameters || []).find(p => p.parameterId === form.outputParameterId);
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
            outputParameterTestConfig: testParamConfig
          });
        }
      });
    }
  });

  // 4. Multi-pass Evaluation Loop (resolves dependency chains)
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

          // Save calculation back to valuesMap
          valuesMap[form.outputParameterId] = roundedResult;
          valuesMap[form.outputParameter.name.trim()] = roundedResult;
          valuesMap[form.outputParameterNameStripped] = roundedResult;
          if (form.outputParameterCode) {
            valuesMap[form.outputParameterCode.trim()] = roundedResult;
            valuesMap[form.outputParameterCode.trim().toLowerCase()] = roundedResult;
          }

          // Determine flag
          const thresholds = getRangeAndCriticalThresholds(form.outputParameter, registration);
          const flag = determineFlag(roundedResult, thresholds);

          // Save/update PatientResult
          await db.patientResult.upsert({
            where: {
              registrationId_testParameterId: {
                registrationId,
                testParameterId: form.outputTestParameterId
              }
            },
            update: {
              value: String(roundedResult),
              flag: flag
            },
            create: {
              registrationId,
              testParameterId: form.outputTestParameterId,
              value: String(roundedResult),
              flag: flag
            }
          });

          console.log(`[FormulaEngine] Evaluated: ID=${form.outputParameterId} Code=${form.outputParameterCode} Name=${form.outputParameter.name} Value=${roundedResult} Flag=${flag}`);

          evaluatedFormulas.add(form.id);
          changed = true;
        }
      }
    }
  }
}
