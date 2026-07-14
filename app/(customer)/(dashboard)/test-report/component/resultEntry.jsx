"use client";

import React, { useState, useEffect } from "react";
import {
  Box,
  Card,
  Grid,
  Button,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Divider,
  CircularProgress,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  MenuItem,
  Stack,
  TextField,
  Snackbar,
  Alert,
  InputAdornment
} from "@mui/material";
import {
  Close as CloseIcon,
  Save as SaveIcon,
  Settings as SettingsIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
  Warning as WarningIcon,
  Calculate as CalculateIcon,
  Print as PrintIcon
} from "@mui/icons-material";

// Helper functions for parameter keys and expression evaluation
const getParamKey = (name) => {
  if (!name) return "";
  const normalized = name
    .replace(/^[\s\d.\-*()#+:/]*/, "") // Strip numbers, dots, spaces, special chars at start
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();

  // Bilirubin
  if (normalized === "total bilirubin" || normalized === "bilirubin total" || normalized.includes("serum bilirubin (total)") || normalized === "serum bilirubin total") return "tb";
  if (normalized === "direct bilirubin" || normalized === "bilirubin direct" || normalized.includes("serum bilirubin (direct)") || normalized === "serum bilirubin direct") return "db";
  if (normalized === "indirect bilirubin" || normalized === "bilirubin indirect" || normalized.includes("serum bilirubin (indirect)") || normalized === "serum bilirubin indirect") return "ib";

  // Proteins
  if (normalized === "total protein" || normalized === "protein total" || normalized === "serum total protein") return "tp";
  if (normalized === "albumin" || normalized === "serum albumin") return "alb";
  if (normalized === "globulin" || normalized === "serum globulin") return "glob";
  if (normalized === "albumin/globulin ratio" || normalized === "a/g ratio" || normalized === "a : g ratio" || normalized.includes("albumin globulin ratio") || normalized.includes("albumin/globulin")) return "agr";

  // Renal
  if (normalized === "blood urea" || normalized === "serum urea" || normalized === "urea") return "urea";
  if (normalized === "blood urea nitrogen" || normalized === "bun" || normalized === "blood urea nitrogen(bun)" || normalized === "blood urea nitrogen (bun)") return "bun";
  if (normalized === "serum creatinine" || normalized === "creatinine") return "cr";
  if (normalized === "bun/creatinine ratio" || normalized === "bun:creatinine ratio" || normalized.includes("bun/creatinine")) return "bcr";
  if (normalized === "urea/creatinine ratio" || normalized === "urea:creatinine ratio" || normalized.includes("urea/creatinine")) return "ucr";

  // Lipids
  if (normalized === "total cholesterol" || normalized === "cholesterol" || normalized === "serum cholesterol") return "tc";
  if (normalized === "hdl cholesterol" || normalized === "hdl" || normalized === "hdl-cholesterol" || normalized === "serum hdl") return "hdl";
  if (normalized === "ldl cholesterol" || normalized === "ldl" || normalized === "ldl-cholesterol" || normalized === "serum ldl") return "ldl";
  if (normalized === "vldl cholesterol" || normalized === "vldl" || normalized === "vldl-cholesterol" || normalized === "serum vldl") return "vldl";
  if (normalized === "triglycerides" || normalized === "triglyceride" || normalized === "serum triglycerides") return "tg";
  if (normalized === "cholesterol/hdl ratio" || normalized === "chol/hdl ratio" || normalized.includes("cholesterol/hdl")) return "chr";
  if (normalized === "ldl/hdl ratio" || normalized.includes("ldl/hdl")) return "lhr";

  // CBC
  if (normalized === "haemoglobin" || normalized === "hemoglobin" || normalized === "hb") return "hb";
  if (normalized === "pcv (haematocrit)" || normalized === "pcv" || normalized === "haematocrit" || normalized === "hematocrit") return "pcv";
  if (normalized === "rbc count (red blood cells)" || normalized === "rbc count" || normalized === "rbc" || normalized === "red blood cells") return "rbc";
  if (normalized === "mcv") return "mcv";
  if (normalized === "mch") return "mch";
  if (normalized === "mchc") return "mchc";

  return null;
};

const evaluateExpression = (formulaStr, valuesMap) => {
  if (!formulaStr) return null;

  // Replace exponentiation operator ^ with JS standard **
  let prepared = formulaStr.replace(/\^/g, "**");

  // Identify variable tokens (excluding function keywords and null/boolean literals)
  const tokenRegex = /\b(?!ROUND|ABS|SQRT|MIN|MAX|IF|null|NULL\b)[a-zA-Z_][a-zA-Z0-9_]*\b/g;

  const substituted = prepared.replace(tokenRegex, (match) => {
    if (valuesMap[match] !== undefined && valuesMap[match] !== null) {
      return valuesMap[match];
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
    if (valuesMap[match] === undefined || valuesMap[match] === null || valuesMap[match] === "") {
      return false;
    }
  }
  return true;
};

const calculateAllDependents = (values, tests, changedId, overrides = new Set()) => {
  const res = { ...values };

  // 1. Build helper maps
  const paramIdToTestParamId = {};
  const testParamIdToParam = {};

  tests.forEach((test) => {
    (test.parameters || []).forEach((tp) => {
      paramIdToTestParamId[tp.parameterId] = tp.id;
      testParamIdToParam[tp.id] = tp;
    });
  });

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
    "mchc": "MCHC",
    "totalcholesterol": "TC",
    "triglycerides": "TG",
    "hdlcholesterol": "HDL",
    "ldlcholesterol": "LDL",
    "vldlcholesterol": "VLDL",
    "totalbilirubin": "TB",
    "directbilirubin": "DB",
    "indirectbilirubin": "IB",
    "sgotast": "AST",
    "sgptalt": "ALT",
    "alkalinephosphatase": "ALP",
    "totalprotein": "TP",
    "albumin": "ALB",
    "globulin": "GLOB",
    "albuminglobulinratio": "AGR",
    "bloodurea": "UREA",
    "serumcreatinine": "CREAT",
    "bloodureanitrogenbun": "BUN",
    "buncreatinineratio": "BCR",
    "ureacreatinineratio": "UCR",
    "serumuricacid": "UA",
    "serumsodiumna": "NA",
    "serumpotassiumk": "K",
    "serumchloridecl": "CL",
    "estimatedaverageglucoseeag": "EAG",
    "urineproteincreatinineratio": "UPCR"
  };

  // 2. Build valuesMap of currently typed values
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

  // 3. Extract all formulas from the loaded tests
  const formulasToRun = [];
  tests.forEach((test) => {
    (test.formulas || []).forEach((form) => {
      const testParamId = paramIdToTestParamId[form.outputParameterId];
      const testParamConfig = testParamIdToParam[testParamId];
      if (testParamId) {
        // Skip formula calculation if parameter is editable and has manual input override
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

  // 4. Multi-pass evaluation loop
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

          // Save to valuesMap
          valuesMap[form.outputParameterId] = roundedResult;
          valuesMap[form.outputParameter.name.trim()] = roundedResult;
          valuesMap[form.outputParameterNameStripped] = roundedResult;
          if (form.outputParameterCode) {
            valuesMap[form.outputParameterCode.trim()] = roundedResult;
            valuesMap[form.outputParameterCode.trim().toLowerCase()] = roundedResult;
          }

          // Save to res (which maps testParameterId -> stringVal)
          res[form.outputTestParameterId] = String(roundedResult);
          evaluatedFormulas.add(form.id);
          changed = true;
        }
      }
    }
  }

  // --- Retro-compatibility (keep old hardcoded calculations in case formulas are not configured yet) ---
  if (evaluatedFormulas.size === 0) {
    const keyToId = {};
    const idToKey = {};
    tests.forEach((test) => {
      (test.parameters || []).forEach((param) => {
        const key = getParamKey(param.name);
        if (key) {
          keyToId[key] = param.id;
          idToKey[param.id] = key;
        }
      });
    });

    const changedKey = changedId ? idToKey[changedId] : null;

    const getVal = (key) => {
      const id = keyToId[key];
      if (!id) return null;
      const val = res[id];
      if (val === undefined || val === null || val === "") return null;
      const num = parseFloat(val);
      return isNaN(num) ? null : num;
    };

    const setVal = (key, value) => {
      const id = keyToId[key];
      if (id && value !== null && !isNaN(value) && isFinite(value)) {
        const formatted = Number.isInteger(value) ? value.toString() : parseFloat(value.toFixed(2)).toString();
        res[id] = formatted;
      }
    };

    // Bilirubin
    const tb = getVal("tb");
    const db = getVal("db");
    const ib = getVal("ib");
    if (changedKey === "tb") {
      if (db !== null) setVal("ib", tb - db);
      else if (ib !== null) setVal("db", tb - ib);
    } else if (changedKey === "db") {
      if (tb !== null) setVal("ib", tb - db);
      else if (ib !== null) setVal("tb", db + ib);
    } else if (changedKey === "ib") {
      if (tb !== null) setVal("db", tb - ib);
      else if (db !== null) setVal("tb", db + ib);
    }

    // Proteins
    const tp = getVal("tp");
    const alb = getVal("alb");
    const glob = getVal("glob");
    if (changedKey === "tp") {
      if (alb !== null) setVal("glob", tp - alb);
      else if (glob !== null) setVal("alb", tp - glob);
    } else if (changedKey === "alb") {
      if (tp !== null) setVal("glob", tp - alb);
      else if (glob !== null) setVal("tp", alb + glob);
    } else if (changedKey === "glob") {
      if (tp !== null) setVal("alb", tp - glob);
      else if (alb !== null) setVal("tp", alb + glob);
    }

    const updatedAlb = getVal("alb");
    const updatedGlob = getVal("glob");
    if (updatedAlb !== null && updatedGlob !== null && updatedGlob !== 0) {
      setVal("agr", updatedAlb / updatedGlob);
    }

    // Renal
    const urea = getVal("urea");
    const bun = getVal("bun");
    const cr = getVal("cr");
    if (changedKey === "urea") {
      setVal("bun", urea / 2.14);
    } else if (changedKey === "bun") {
      setVal("urea", bun * 2.14);
    }
    const updatedBun = getVal("bun");
    const updatedUrea = getVal("urea");
    if (cr !== null && cr !== 0) {
      if (updatedBun !== null) setVal("bcr", updatedBun / cr);
      if (updatedUrea !== null) setVal("ucr", updatedUrea / cr);
    }

    // Lipids
    const tg = getVal("tg");
    if (changedKey === "tg" && tg !== null) {
      setVal("vldl", tg / 5);
    }
    const tc = getVal("tc");
    const hdl = getVal("hdl");
    const ldl = getVal("ldl");
    const vldl = getVal("vldl");
    if (changedKey === "tc") {
      if (hdl !== null && vldl !== null) setVal("ldl", tc - hdl - vldl);
    } else if (changedKey === "ldl") {
      if (hdl !== null && vldl !== null) setVal("tc", hdl + ldl + vldl);
    } else if (changedKey === "hdl") {
      if (ldl !== null && vldl !== null) setVal("tc", hdl + ldl + vldl);
    } else if (changedKey === "tg" && tg !== null) {
      const currentVldl = tg / 5;
      if (hdl !== null && ldl !== null) setVal("tc", hdl + ldl + currentVldl);
    }
    const updatedTc = getVal("tc");
    const updatedHdl = getVal("hdl");
    const updatedLdl = getVal("ldl");
    if (updatedHdl !== null && updatedHdl !== 0) {
      if (updatedTc !== null) setVal("chr", updatedTc / updatedHdl);
      if (updatedLdl !== null) setVal("lhr", updatedLdl / updatedHdl);
    }

    // CBC
    const hb = getVal("hb");
    const pcv = getVal("pcv");
    const rbc = getVal("rbc");
    if (pcv !== null && rbc !== null && rbc !== 0) setVal("mcv", (pcv / rbc) * 10);
    if (hb !== null && rbc !== null && rbc !== 0) setVal("mch", (hb / rbc) * 10);
    if (hb !== null && pcv !== null && pcv !== 0) setVal("mchc", (hb / pcv) * 100);
  }

  return res;
};

const isOutOfRange = (valStr, min, max) => {
  if (!valStr || min === null || max === null) return false;
  const num = parseFloat(valStr);
  if (isNaN(num)) return false;
  return num < min || num > max;
};

const getReferenceRange = (param, reg) => {
  const isBaby = reg.ageUnit !== "Year" || reg.age < 12;
  if (isBaby) {
    return {
      rangeStr: param.normalRangeBaby || param.normalRangeDefault || "Normal",
      min: param.minValBaby,
      max: param.maxValBaby,
    };
  }
  if (reg.gender === "Female") {
    return {
      rangeStr: param.normalRangeFemale || param.normalRangeDefault || "Normal",
      min: param.minValFemale,
      max: param.maxValFemale,
    };
  }
  return {
    rangeStr: param.normalRangeMale || param.normalRangeDefault || "Normal",
    min: param.minValMale,
    max: param.maxValMale,
  };
};

export default function ResultEntry({ open, onClose, selectedReg, onSaveSuccess, canWrite, handlePrintReport }) {
  const [loading, setLoading] = useState(true);
  const [resultRegDetails, setResultRegDetails] = useState(null);
  const [resultTests, setResultTests] = useState([]);
  const [resultValues, setResultValues] = useState({});
  const [manualOverrides, setManualOverrides] = useState(new Set());
  const [reportNotes, setReportNotes] = useState("");
  const [resultSaving, setResultSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  // Configurator States
  const [configDialogOpen, setConfigDialogOpen] = useState(false);
  const [configTest, setConfigTest] = useState(null);
  const [configParams, setConfigParams] = useState([]);

  // Toast notifications inside component
  const [toast, setToast] = useState({ open: false, message: "", severity: "success" });

  const showToast = (message, severity = "success") => {
    setToast({ open: true, message, severity });
  };

  const loadParameters = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/registrations/${selectedReg.id}/parameters`).then((r) => r.json());
      if (res.success) {
        setResultRegDetails(res.registration);
        const tests = res.registration.tests.map((rt) => rt.test);
        setResultTests(tests);

        const values = {};
        const overrides = new Set();
        res.registration.results.forEach((r) => {
          values[r.testParameterId] = r.value;
          if (r.value !== undefined && r.value !== null && r.value !== "") {
            overrides.add(r.testParameterId);
            overrides.add(String(r.testParameterId));
          }
        });
        setResultValues(values);
        setManualOverrides(overrides);
        setReportNotes(res.registration.remark || "");
      } else {
        showToast(res.message || "Failed to load parameters", "error");
      }
    } catch (err) {
      showToast(err.message || "Failed to load result parameters", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open && selectedReg) {
      setIsSaved(false);
      // eslint-disable-next-line react-hooks/set-state-in-effect
      loadParameters();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, selectedReg]);

  const handleResultValueChange = (paramId, val) => {
    const newOverrides = new Set(manualOverrides);
    if (val !== undefined && val !== null && val !== "") {
      newOverrides.add(paramId);
      newOverrides.add(String(paramId));
    } else {
      newOverrides.delete(paramId);
      newOverrides.delete(String(paramId));
    }
    setManualOverrides(newOverrides);

    const updatedValues = {
      ...resultValues,
      [paramId]: val
    };
    const finalValues = calculateAllDependents(updatedValues, resultTests, paramId, newOverrides);
    setResultValues(finalValues);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      const inputs = Array.from(document.querySelectorAll(
        ".result-input-field input:not([type='hidden']), .result-input-field [role='combobox'], .result-input-field [role='button']"
      ));
      const index = inputs.indexOf(e.target);
      if (index > -1 && index < inputs.length - 1) {
        const nextInput = inputs[index + 1];
        nextInput.focus();
        if (typeof nextInput.select === "function") {
          nextInput.select();
        }
      } else {
        const remarks = document.getElementById("remarks-field");
        if (remarks) {
          remarks.focus();
        }
      }
    }
  };

  const handleSaveResults = async () => {
    setResultSaving(true);
    try {
      const resultsData = Object.keys(resultValues).map((paramId) => ({
        testParameterId: parseInt(paramId),
        value: resultValues[paramId]
      }));

      const res = await fetch(`/api/registrations/${resultRegDetails.id}/results`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resultsData, reportNotes }),
      }).then((r) => r.json());

      if (res.success) {
        showToast(res.message || "Results saved successfully", "success");
        setIsSaved(true);
        if (onSaveSuccess) onSaveSuccess();
      } else {
        showToast(res.message, "error");
      }
    } catch (err) {
      showToast(err.message || "Failed to save results", "error");
    } finally {
      setResultSaving(false);
    }
  };

  // Configurator Handlers
  const handleOpenConfigurator = (test) => {
    setConfigTest(test);
    const params = test.parameters.map((p) => ({
      id: p.id,
      name: p.name,
      minValMale: p.minValMale !== null ? String(p.minValMale) : "",
      maxValMale: p.maxValMale !== null ? String(p.maxValMale) : "",
      normalRangeMale: p.normalRangeMale || "",
      minValFemale: p.minValFemale !== null ? String(p.minValFemale) : "",
      maxValFemale: p.maxValFemale !== null ? String(p.maxValFemale) : "",
      normalRangeFemale: p.normalRangeFemale || "",
      minValBaby: p.minValBaby !== null ? String(p.minValBaby) : "",
      maxValBaby: p.maxValBaby !== null ? String(p.maxValBaby) : "",
      normalRangeBaby: p.normalRangeBaby || "",
      normalRangeDefault: p.normalRangeDefault || "",
      unit: p.unit || "-NA-"
    }));
    setConfigParams(params);
    setConfigDialogOpen(true);
  };

  const handleConfigParamChange = (index, field, value) => {
    const updated = [...configParams];
    updated[index][field] = value;

    const getAutoRangeString = (min, max) => {
      const trimmedMin = String(min === null || min === undefined ? "" : min).trim();
      const trimmedMax = String(max === null || max === undefined ? "" : max).trim();
      if (trimmedMin && trimmedMax) return `${trimmedMin} - ${trimmedMax}`;
      if (trimmedMin) return `>= ${trimmedMin}`;
      if (trimmedMax) return `<= ${trimmedMax}`;
      return "";
    };

    if (field === "minValMale" || field === "maxValMale") {
      updated[index].normalRangeMale = getAutoRangeString(updated[index].minValMale, updated[index].maxValMale);
    } else if (field === "minValFemale" || field === "maxValFemale") {
      updated[index].normalRangeFemale = getAutoRangeString(updated[index].minValFemale, updated[index].maxValFemale);
    } else if (field === "minValBaby" || field === "maxValBaby") {
      updated[index].normalRangeBaby = getAutoRangeString(updated[index].minValBaby, updated[index].maxValBaby);
    }

    setConfigParams(updated);
  };

  const handleAddConfigParam = () => {
    setConfigParams([
      ...configParams,
      {
        name: "",
        minValMale: "",
        maxValMale: "",
        normalRangeMale: "",
        minValFemale: "",
        maxValFemale: "",
        normalRangeFemale: "",
        minValBaby: "",
        maxValBaby: "",
        normalRangeBaby: "",
        normalRangeDefault: "Normal / Negative",
        unit: "-NA-"
      }
    ]);
  };

  const handleRemoveConfigParam = (index) => {
    const updated = [...configParams];
    updated.splice(index, 1);
    setConfigParams(updated);
  };

  const handleSaveConfigParameters = async () => {
    try {
      const res = await fetch(`/api/registrations/${configTest.id}/parameters`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ parametersList: configParams }),
      }).then((r) => r.json());

      if (res.success) {
        showToast(res.message, "success");
        setConfigDialogOpen(false);
        // Refresh local parameter list
        loadParameters();
      } else {
        showToast(res.message, "error");
      }
    } catch (err) {
      showToast(err.message || "Failed to update parameters setup", "error");
    }
  };

  if (!open) return null;

  return (
    <>
      <Dialog
        open={open}
        onClose={onClose}
        maxWidth="lg"
        fullWidth
        PaperProps={{ sx: { borderRadius: 2 } }}
      >
        <DialogTitle sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", bgcolor: "primary.main", color: "primary.contrastText", py: 1.5 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>
            🧪 Test Result of Patient : {resultRegDetails ? `${resultRegDetails.name} / Age: ${resultRegDetails.age.toFixed(2)} ${resultRegDetails.ageUnit} / ${resultRegDetails.gender} / Reg No: ${resultRegDetails.regNo}` : "Loading..."}
          </Typography>
          <IconButton onClick={onClose} size="small" sx={{ color: "primary.contrastText" }}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ p: 2, mt: 1 }}>
          {loading ? (
            <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", py: 8 }}>
              <CircularProgress />
            </Box>
          ) : resultRegDetails ? (
            <>
              {/* Header info */}
              <Box sx={{ mb: 3, p: 2, bgcolor: "grey.50", borderRadius: 1 }}>
                <Grid container spacing={2}>
                  <Grid item xs={3}>
                    <Typography variant="caption" color="text.secondary">Barcode</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 700 }}>{resultRegDetails.barcode?.replace(/^,\s*/, "") || "-"}</Typography>
                  </Grid>
                  <Grid item xs={3}>
                    <Typography variant="caption" color="text.secondary">Mobile No</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 700 }}>{resultRegDetails.mobileNo}</Typography>
                  </Grid>
                  <Grid item xs={3}>
                    <Typography variant="caption" color="text.secondary">Department</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 700 }}>All Departments</Typography>
                  </Grid>
                  <Grid item xs={3}>
                    <Typography variant="caption" color="text.secondary">Referred By</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 700 }}>Self</Typography>
                  </Grid>
                </Grid>
              </Box>

              {/* Loop through each test and render its parameters */}
              {resultTests.map((test) => {
                const params = test.parameters || [];
                return (
                  <Box key={test.id} sx={{ mb: 4 }}>
                    <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1, px: 1 }}>
                      <Typography variant="subtitle2" sx={{ fontWeight: 800, color: "primary.main", borderLeft: "4px solid", pl: 1, borderColor: "primary.main" }}>
                        {test.name} ({test.code})
                      </Typography>
                      <Button
                        size="small"
                        variant="outlined"
                        startIcon={<SettingsIcon />}
                        onClick={() => handleOpenConfigurator(test)}
                        sx={{ textTransform: "none", py: 0.3 }}
                      >
                        Configure Parameters
                      </Button>
                    </Box>
                    <Divider sx={{ mb: 1.5 }} />

                    {params.length === 0 ? (
                      <Box sx={{ p: 3, border: "1px dashed", borderColor: "grey.300", borderRadius: 1, textAlign: "center" }}>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
                          No parameters configured for this test yet.
                        </Typography>
                        <Button size="small" variant="contained" onClick={() => handleOpenConfigurator(test)}>
                          Add/Configure Parameters
                        </Button>
                      </Box>
                    ) : (
                      <TableContainer component={Paper} variant="outlined" sx={{ mb: 2 }}>
                        <Table size="small">
                          <TableHead sx={{ bgcolor: "grey.100" }}>
                            <TableRow>
                              <TableCell sx={{ fontWeight: 700, width: 60 }}>S/No</TableCell>
                              <TableCell sx={{ fontWeight: 700 }}>Test Parameter</TableCell>
                              <TableCell sx={{ fontWeight: 700 }}>Normal Value</TableCell>
                              <TableCell sx={{ fontWeight: 700 }}>Unit</TableCell>
                              <TableCell sx={{ fontWeight: 700, width: 250 }}>Result</TableCell>
                              <TableCell sx={{ fontWeight: 700, width: 80 }}>Order</TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {(() => {
                              let currentHeader = null;
                              let serialNo = 0;
                              return params.map((param) => {
                                const ref = getReferenceRange(param, resultRegDetails);
                                const isHeader = param.isHeader || (!param.unit && (!ref || !ref.rangeStr || ref.rangeStr === "" || ref.rangeStr === "-NA-"));

                                if (isHeader) {
                                  currentHeader = param.name;
                                  return (
                                    <TableRow key={param.id} sx={{ bgcolor: "rgba(15, 118, 110, 0.04)" }}>
                                      <TableCell colSpan={6} sx={{ fontWeight: 800, color: "primary.main", py: 1 }}>
                                        {param.name}
                                      </TableCell>
                                    </TableRow>
                                  );
                                }

                                serialNo++;
                                const val = resultValues[param.id] || "";
                                const isAbnormal = isOutOfRange(val, ref.min, ref.max);

                                const normalValLower = (ref.rangeStr || "").toLowerCase();
                                const isNegativeOrPositive = normalValLower.includes("negative") || normalValLower.includes("positive");
                                const isReactiveOrNonReactive = normalValLower.includes("reactive");
                                const showDropdown = isNegativeOrPositive || isReactiveOrNonReactive;
                                let dropdownOptions = [];
                                if (isReactiveOrNonReactive) {
                                  dropdownOptions = ["Non-reactive", "Reactive"];
                                } else if (isNegativeOrPositive) {
                                  dropdownOptions = ["Negative", "Positive"];
                                }
                                if (val && !dropdownOptions.includes(val)) {
                                  dropdownOptions.push(val);
                                }

                                const isChild = !!currentHeader;

                                // Check if parameter has an active math formula
                                const testFormulas = resultTests.flatMap(t => t.formulas || []);
                                const paramFormula = testFormulas.find(f => f.outputParameterId === param.parameterId);
                                const hasFormula = !!paramFormula;
                                const isOverridden = manualOverrides.has(param.id) || manualOverrides.has(String(param.id));

                                return (
                                  <TableRow key={param.id} hover>
                                    <TableCell>{serialNo}</TableCell>
                                    <TableCell sx={{ fontWeight: 600, pl: isChild ? 4 : 2 }}>
                                      {isChild ? `▪ ${param.name}` : param.name}
                                    </TableCell>
                                    <TableCell>{ref.rangeStr}</TableCell>
                                    <TableCell>{param.unit}</TableCell>
                                    <TableCell>
                                      <TextField
                                        className="result-input-field"
                                        select={showDropdown}
                                        size="small"
                                        fullWidth
                                        disabled={!param.editable}
                                        value={val}
                                        onChange={(e) => handleResultValueChange(param.id, e.target.value)}
                                        onKeyDown={handleKeyDown}
                                        error={isAbnormal}
                                        sx={{
                                          "& .MuiInputBase-root": {
                                            bgcolor: isAbnormal ? "rgba(239, 68, 68, 0.15)" : "inherit"
                                          },
                                          "& .MuiInputBase-input": {
                                            py: 0.5,
                                            fontSize: "0.85rem",
                                            fontWeight: isAbnormal ? 700 : (hasFormula && !isOverridden ? 700 : 500)
                                          }
                                        }}
                                        InputProps={{
                                          endAdornment: (isAbnormal || hasFormula) && (
                                            <InputAdornment position="end">
                                              {hasFormula && (
                                                <Tooltip title={isOverridden ? "Formula overridden (manual entry)" : `Calculated by formula: ${paramFormula.formula}`}>
                                                  <IconButton size="small" tabIndex={-1} sx={{ p: 0.25, mr: isAbnormal ? 0.5 : 0 }}>
                                                    <CalculateIcon
                                                      color={isOverridden ? "action" : "primary"}
                                                      sx={{ fontSize: "1.1rem", opacity: isOverridden ? 0.5 : 0.8 }}
                                                    />
                                                  </IconButton>
                                                </Tooltip>
                                              )}
                                              {isAbnormal && (
                                                <Tooltip title="Out of normal range!">
                                                  <WarningIcon color="error" fontSize="small" sx={{ mr: 0.5 }} />
                                                </Tooltip>
                                              )}
                                            </InputAdornment>
                                          )
                                        }}
                                      >
                                        {showDropdown ? (
                                          [
                                            <MenuItem key="empty" value=""><em>Select</em></MenuItem>,
                                            ...dropdownOptions.map(opt => (
                                              <MenuItem key={opt} value={opt}>{opt}</MenuItem>
                                            ))
                                          ]
                                        ) : null}
                                      </TextField>
                                    </TableCell>
                                    <TableCell>{param.order}</TableCell>
                                  </TableRow>
                                );
                              });
                            })()}
                          </TableBody>
                        </Table>
                      </TableContainer>
                    )}
                  </Box>
                );
              })}

              {/* Note/Remark editor */}
              <Box sx={{ mt: 3 }}>
                <Typography variant="body2" sx={{ fontWeight: 700, mb: 1 }}>Report Remarks / Summary Note</Typography>
                <TextField
                  id="remarks-field"
                  fullWidth
                  multiline
                  rows={4}
                  value={reportNotes}
                  onChange={(e) => setReportNotes(e.target.value)}
                  placeholder="Enter overall review comment, findings summary or notes..."
                  variant="outlined"
                />
              </Box>
            </>
          ) : (
            <Typography variant="body2" color="text.secondary" align="center">
              No registration details found.
            </Typography>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          {isSaved && (
            <Button
              onClick={() => {
                onClose();
                if (handlePrintReport) {
                  handlePrintReport();
                }
              }}
              variant="contained"
              color="success"
              size="small"
              startIcon={<PrintIcon />}
            >
              Print Report
            </Button>
          )}
          <Box sx={{ flexGrow: 1 }} />
          <Button onClick={onClose} variant="outlined" size="small">Cancel</Button>
          <Tooltip title={!canWrite ? "You do not have permission to enter results" : ""}>
            <span>
              <Button
                onClick={handleSaveResults}
                variant="contained"
                size="small"
                startIcon={resultSaving ? <CircularProgress size={16} color="inherit" /> : <SaveIcon />}
                disabled={resultSaving || !canWrite || loading}
              >
                Save Results & Complete
              </Button>
            </span>
          </Tooltip>
        </DialogActions>
      </Dialog>

      {/* --- PARAMETER CONFIGURATOR DIALOG --- */}
      {configTest && (
        <Dialog
          open={configDialogOpen}
          onClose={() => setConfigDialogOpen(false)}
          maxWidth="md"
          fullWidth
          PaperProps={{ sx: { borderRadius: 2 } }}
        >
          <DialogTitle sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", bgcolor: "primary.main", color: "primary.contrastText", py: 1.5 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>
              ⚙ Configure Parameters : {configTest.name}
            </Typography>
            <IconButton onClick={() => setConfigDialogOpen(false)} size="small" sx={{ color: "primary.contrastText" }}>
              <CloseIcon />
            </IconButton>
          </DialogTitle>
          <DialogContent sx={{ p: 2 }}>
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", my: 2 }}>
              <Typography variant="body2" color="text.secondary">
                Setup the sub-fields and normal reference ranges for Male, Female, and Baby groups.
              </Typography>
              <Button
                variant="outlined"
                size="small"
                startIcon={<AddIcon />}
                onClick={handleAddConfigParam}
                sx={{ textTransform: "none" }}
              >
                Add Field
              </Button>
            </Box>

            {configParams.length === 0 ? (
              <Box sx={{ py: 6, textAlign: "center", border: "1px dashed", borderColor: "grey.300", borderRadius: 1 }}>
                <Typography variant="body2" color="text.secondary">
                  No parameters defined. Click &quot;Add Field&quot; to define parameters.
                </Typography>
              </Box>
            ) : (
              <Stack spacing={2} sx={{ maxHeight: 450, overflowY: "auto", pr: 1 }}>
                {configParams.map((param, index) => (
                  <Card variant="outlined" key={index} sx={{ p: 2, overflow: "visible" }}>
                    <Grid container spacing={2} alignItems="center">
                      <Grid item xs={5.5}>
                        <TextField
                          label="Parameter Name"
                          size="small"
                          fullWidth
                          value={param.name}
                          onChange={(e) => handleConfigParamChange(index, "name", e.target.value)}
                        />
                      </Grid>
                      <Grid item xs={2.5}>
                        <TextField
                          label="Unit"
                          size="small"
                          fullWidth
                          value={param.unit}
                          onChange={(e) => handleConfigParamChange(index, "unit", e.target.value)}
                        />
                      </Grid>
                      <Grid item xs={3}>
                        <TextField
                          label="Default Normal Text"
                          size="small"
                          fullWidth
                          value={param.normalRangeDefault}
                          onChange={(e) => handleConfigParamChange(index, "normalRangeDefault", e.target.value)}
                        />
                      </Grid>
                      <Grid item xs={1} sx={{ display: "flex", justifyContent: "flex-end", alignItems: "center" }}>
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => handleRemoveConfigParam(index)}
                          title="Remove Parameter"
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Grid>

                      <Grid item xs={12} sx={{ my: 0.5 }}><Divider /></Grid>

                      {/* Male Ranges */}
                      <Grid item xs={4}>
                        <Typography variant="caption" sx={{ fontWeight: 700, color: "primary.main" }}>Male Ranges</Typography>
                        <Stack direction="row" spacing={1} sx={{ mt: 0.5 }}>
                          <TextField label="Min" size="small" type="number" value={param.minValMale} onChange={(e) => handleConfigParamChange(index, "minValMale", e.target.value)} />
                          <TextField label="Max" size="small" type="number" value={param.maxValMale} onChange={(e) => handleConfigParamChange(index, "maxValMale", e.target.value)} />
                        </Stack>
                        <TextField label="Display Range Label" size="small" fullWidth sx={{ mt: 1 }} disabled value={param.normalRangeMale} />
                      </Grid>

                      {/* Female Ranges */}
                      <Grid item xs={4}>
                        <Typography variant="caption" sx={{ fontWeight: 700, color: "secondary.main" }}>Female Ranges</Typography>
                        <Stack direction="row" spacing={1} sx={{ mt: 0.5 }}>
                          <TextField label="Min" size="small" type="number" value={param.minValFemale} onChange={(e) => handleConfigParamChange(index, "minValFemale", e.target.value)} />
                          <TextField label="Max" size="small" type="number" value={param.maxValFemale} onChange={(e) => handleConfigParamChange(index, "maxValFemale", e.target.value)} />
                        </Stack>
                        <TextField label="Display Range Label" size="small" fullWidth sx={{ mt: 1 }} disabled value={param.normalRangeFemale} />
                      </Grid>

                      {/* Baby Ranges */}
                      <Grid item xs={4}>
                        <Typography variant="caption" sx={{ fontWeight: 700, color: "warning.main" }}>Baby/Child Ranges</Typography>
                        <Stack direction="row" spacing={1} sx={{ mt: 0.5 }}>
                          <TextField label="Min" size="small" type="number" value={param.minValBaby} onChange={(e) => handleConfigParamChange(index, "minValBaby", e.target.value)} />
                          <TextField label="Max" size="small" type="number" value={param.maxValBaby} onChange={(e) => handleConfigParamChange(index, "maxValBaby", e.target.value)} />
                        </Stack>
                        <TextField label="Display Range Label" size="small" fullWidth sx={{ mt: 1 }} disabled value={param.normalRangeBaby} />
                      </Grid>
                    </Grid>
                  </Card>
                ))}
              </Stack>
            )}
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2 }}>
            <Button onClick={() => setConfigDialogOpen(false)} variant="outlined" size="small">Cancel</Button>
            <Tooltip title={!canWrite ? "You do not have permission to save configuration parameters" : ""}>
              <span>
                <Button onClick={handleSaveConfigParameters} variant="contained" size="small" startIcon={<SaveIcon />} disabled={!canWrite}>
                  Save Parameters Setup
                </Button>
              </span>
            </Tooltip>
          </DialogActions>
        </Dialog>
      )}

      {/* Internal Component Toast Alerts */}
      <Snackbar
        open={toast.open}
        autoHideDuration={4000}
        onClose={() => setToast({ ...toast, open: false })}
        anchorOrigin={{ vertical: "top", horizontal: "right" }}
      >
        <Alert severity={toast.severity} onClose={() => setToast({ ...toast, open: false })} sx={{ width: "100%" }}>
          {toast.message}
        </Alert>
      </Snackbar>
    </>
  );
}
