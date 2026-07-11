const STANDARD_CODE_FALLBACKS = {
  "polymorphsneutrophils": "NEUT",
  "neutrophils": "NEUT",
  "lymphocytes": "LYMPH",
  "eosinophils": "EOS",
  "monocytes": "MONO",
  "basophils": "BASO",
  "haemoglobin": "HB",
  "hemoglobin": "HB",
  "rbccountredbloodcells": "RBC",
  "rbccount": "RBC",
  "totalwbccount": "WBC",
  "wbccount": "WBC",
  "pcvhaematocrit": "PCV",
  "pcv": "PCV",
  "mcv": "MCV",
  "mch": "MCH",
  "mchc": "MCHC"
};

const evaluateExpression = (formulaStr, valuesMap) => {
  if (!formulaStr) return null;
  let prepared = formulaStr.replace(/\^/g, "**");
  const tokenRegex = /\b(?!ROUND|ABS|SQRT|MIN|MAX|IF|null|NULL\b)[a-zA-Z_][a-zA-Z0-9_]*\b/g;
  const substituted = prepared.replace(tokenRegex, (match) => {
    if (valuesMap[match] !== undefined && valuesMap[match] !== null) {
      return valuesMap[match];
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
    console.log("DEBUG EVALUATING SANITIZED EXPRESSION:", sanitized);
    const fn = new Function(...keys, `return (${sanitized});`);
    const result = fn(...values);
    return result;
  } catch (err) {
    console.log("DEBUG EVALUATE EXCEPTION:", err);
    return null;
  }
};

const checkFormulaDependencies = (formulaStr, valuesMap) => {
  if (!formulaStr) return false;
  const tokenRegex = /\b(?!ROUND|ABS|SQRT|MIN|MAX|IF|null|NULL\b)[a-zA-Z_][a-zA-Z0-9_]*\b/g;
  const matches = formulaStr.match(tokenRegex) || [];
  for (const match of matches) {
    if (valuesMap[match] === undefined || valuesMap[match] === null || valuesMap[match] === "") {
      return false;
    }
  }
  return true;
};

const calculateAllDependents = (values, tests, changedId, overrides = new Set()) => {
  const res = { ...values };
  const paramIdToTestParamId = {};
  const testParamIdToParam = {};
  
  tests.forEach((test) => {
    (test.parameters || []).forEach((tp) => {
      paramIdToTestParamId[tp.parameterId] = tp.id;
      testParamIdToParam[tp.id] = tp;
    });
  });

  const valuesMap = {};
  tests.forEach((test) => {
    (test.parameters || []).forEach((tp) => {
      const rawVal = res[tp.id];
      if (rawVal !== undefined && rawVal !== null && rawVal !== "") {
        const numVal = parseFloat(rawVal);
        if (!isNaN(numVal)) {
          valuesMap[tp.parameterId] = numVal;
          valuesMap[tp.name.trim()] = numVal;
          const normName = tp.name.toLowerCase().replace(/[^a-z0-9]/g, "");
          valuesMap[normName] = numVal;
          
          const code = (tp.code || STANDARD_CODE_FALLBACKS[normName])?.toUpperCase().trim();
          if (code) {
            valuesMap[code] = numVal;
            valuesMap[code.toLowerCase()] = numVal;
          }
        }
      }
    });
  });
  console.log("DEBUG valuesMap:", valuesMap);

  const formulasToRun = [];
  tests.forEach((test) => {
    (test.formulas || []).forEach((form) => {
      const testParamId = paramIdToTestParamId[form.outputParameterId];
      const testParamConfig = testParamIdToParam[testParamId];
      if (testParamId) {
        if (testParamConfig.editable && overrides.has(testParamId)) {
          return;
        }
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
  });
  console.log("DEBUG formulasToRun:", formulasToRun);

  let changed = true;
  let pass = 0;
  const evaluatedFormulas = new Set();

  while (changed && pass < 5) {
    changed = false;
    pass++;
    for (const form of formulasToRun) {
      if (evaluatedFormulas.has(form.id)) continue;
      const canEval = checkFormulaDependencies(form.formula, valuesMap);
      console.log("DEBUG canEval for formula:", form.formula, "is:", canEval);
      if (canEval) {
        const result = evaluateExpression(form.formula, valuesMap);
        console.log("DEBUG result for formula:", form.formula, "is:", result);
        if (result !== null && !isNaN(result)) {
          const precision = form.outputParameterTestConfig?.decimalPlace ?? 2;
          const roundedResult = parseFloat(result.toFixed(precision));
          valuesMap[form.outputParameterId] = roundedResult;
          valuesMap[form.outputParameter.name.trim()] = roundedResult;
          valuesMap[form.outputParameterNameStripped] = roundedResult;
          if (form.outputParameterCode) {
            valuesMap[form.outputParameterCode.trim()] = roundedResult;
            valuesMap[form.outputParameterCode.trim().toLowerCase()] = roundedResult;
          }
          res[form.outputTestParameterId] = String(roundedResult);
          evaluatedFormulas.add(form.id);
          changed = true;
        }
      }
    }
  }
  return res;
};

// Simulation of test case
const tests = [
  {
    id: 15928,
    parameters: [
      { id: 10594, parameterId: 5142, name: "Polymorphs (Neutrophils)", code: "NEUT", editable: true },
      { id: 10595, parameterId: 5143, name: "Lymphocytes", code: "LYMPH", editable: true }
    ],
    formulas: [
      {
        id: 72,
        outputParameterId: 5143,
        formula: "100-NEUT",
        outputParameter: { id: 5143, name: "Lymphocytes", code: "LYMPH" }
      }
    ]
  }
];

const initialValues = { 10594: "40" };
const overrides = new Set([10594]);
const result = calculateAllDependents(initialValues, tests, 10594, overrides);
console.log("SIMULATION RESULT:", result);
