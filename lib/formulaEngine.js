import { prisma } from "./db.js";
import {
  addValueToValuesMap,
  addPatientContextToValuesMap,
  evaluateExpression,
  checkFormulaDependencies,
  getRangeAndCriticalThresholds,
  determineFlag,
  isQualitativeAbnormal,
  isOutOfRange,
  calculateAllDependents,
  validateDifferentialCount,
} from "./formulaUtils.js";

// Re-export utility functions for existing server callers
export {
  addValueToValuesMap,
  addPatientContextToValuesMap,
  evaluateExpression,
  checkFormulaDependencies,
  getRangeAndCriticalThresholds,
  determineFlag,
  isQualitativeAbnormal,
  isOutOfRange,
  calculateAllDependents,
  validateDifferentialCount,
};

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

    // 2. Build valuesMap of currently entered results & patient demographics
    const valuesMap = {};
    addPatientContextToValuesMap(valuesMap, registration);

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

    const existingResultMap = {};
    registration.results.forEach((res) => {
      existingResultMap[res.testParameterId] = res;
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
          const tp = (rt.test.parameters || []).find(
            (p) =>
              (p.parameterId && form.outputParameterId && p.parameterId === form.outputParameterId) ||
              (p.id && form.outputParameterId && p.id === form.outputParameterId)
          );
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

        // If this parameter is editable and already has a manually entered value, do not overwrite it
        const existingRes = existingResultMap[form.outputTestParameterId];
        const isManualValuePresent =
          form.outputParameterTestConfig?.editable &&
          existingRes &&
          existingRes.value !== null &&
          existingRes.value !== undefined &&
          String(existingRes.value).trim() !== "";

        if (isManualValuePresent) {
          evaluatedFormulas.add(form.id);
          continue;
        }

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
