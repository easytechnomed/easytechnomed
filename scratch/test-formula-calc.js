function evaluateExpression(formulaStr, valuesMap) {
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

function checkFormulaDependencies(formulaStr, valuesMap) {
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

// Test cases:
// 1. Female, Age 40, Creatinine 0.8
const valuesFemale = {
  CREAT: 0.8,
  creat: 0.8,
  AGE: 40,
  age: 40,
  GENDER: "Female",
  gender: "Female",
  IS_FEMALE: 1,
  is_female: 1,
  IS_MALE: 0,
  is_male: 0,
};

// 2. Male, Age 40, Creatinine 1.0
const valuesMale = {
  CREAT: 1.0,
  creat: 1.0,
  AGE: 40,
  age: 40,
  GENDER: "Male",
  gender: "Male",
  IS_FEMALE: 0,
  is_female: 0,
  IS_MALE: 1,
  is_male: 1,
};

const ckdEpiFormula = "IF([gender] == 'Female' || [is_female] == 1, 142 * (MIN([CREAT] / 0.7, 1) ^ -0.241) * (MAX([CREAT] / 0.7, 1) ^ -1.200) * (0.9938 ^ [age]) * 1.012, 142 * (MIN([CREAT] / 0.9, 1) ^ -0.302) * (MAX([CREAT] / 0.9, 1) ^ -1.200) * (0.9938 ^ [age]))";

console.log("=== Testing Female (Age 40, Creatinine 0.8) ===");
console.log("Dependencies OK?", checkFormulaDependencies(ckdEpiFormula, valuesFemale));
const resF = evaluateExpression(ckdEpiFormula, valuesFemale);
console.log("eGFR Female Result:", resF, "Rounded:", Number(resF.toFixed(2)));

console.log("\n=== Testing Male (Age 40, Creatinine 1.0) ===");
console.log("Dependencies OK?", checkFormulaDependencies(ckdEpiFormula, valuesMale));
const resM = evaluateExpression(ckdEpiFormula, valuesMale);
console.log("eGFR Male Result:", resM, "Rounded:", Number(resM.toFixed(2)));

console.log("\n=== Testing Bare syntax without brackets ===");
const bareFormula = "IF(gender == 'Female' || IS_FEMALE == 1, 142 * (MIN(CREAT / 0.7, 1) ^ -0.241) * (MAX(CREAT / 0.7, 1) ^ -1.200) * (0.9938 ^ AGE) * 1.012, 142 * (MIN(CREAT / 0.9, 1) ^ -0.302) * (MAX(CREAT / 0.9, 1) ^ -1.200) * (0.9938 ^ AGE))";
console.log("Dependencies OK?", checkFormulaDependencies(bareFormula, valuesFemale));
console.log("eGFR Female Result:", evaluateExpression(bareFormula, valuesFemale));
