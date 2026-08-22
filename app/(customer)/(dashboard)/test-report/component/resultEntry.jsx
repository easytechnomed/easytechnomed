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
  InputAdornment,
  Chip
} from "@mui/material";
import {
  Close as CloseIcon,
  Save as SaveIcon,
  Settings as SettingsIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
  Warning as WarningIcon,
  Calculate as CalculateIcon,
  Print as PrintIcon,
  CloudDone as CloudDoneIcon,
  CloudQueue as CloudQueueIcon,
  CloudOff as CloudOffIcon,
  Drafts as DraftsIcon
} from "@mui/icons-material";
import DifferentialHeaderBadge, { validateDifferentialOnSave } from "./DifferentialCountTracker";

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
      // Find the corresponding testParameter within the CURRENT test
      const tp = (test.parameters || []).find(p => p.parameterId === form.outputParameterId);
      if (tp) {
        const testParamId = tp.id;
        const testParamConfig = tp;

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
          console.log(`[calculateAllDependents] -> Updated calculated value in res for Parameter "${form.outputParameter.name}" (ID: ${form.outputTestParameterId}) = "${roundedResult}"`);
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

const isQualitativeAbnormal = (valStr, refRangeStr = "") => {
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
};

const isOutOfRange = (valStr, min, max, param = null, refRangeStr = "") => {
  if (!valStr) return false;
  const valRaw = String(valStr).trim();
  const num = parseFloat(valRaw);
  if (!isNaN(num) && /^-?\d+(\.\d+)?$/.test(valRaw) && (min !== null || max !== null)) {
    if (min !== null && min !== undefined && num < min) return true;
    if (max !== null && max !== undefined && num > max) return true;
    return false;
  }
  return isQualitativeAbnormal(valRaw, refRangeStr);
};

const getReferenceRange = (param, reg) => {
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
};

export default function ResultEntry({ open, onClose, selectedReg, onSaveSuccess, canWrite, handlePrintReport }) {
  const [loading, setLoading] = useState(true);
  const [resultRegDetails, setResultRegDetails] = useState(null);
  const [resultTests, setResultTests] = useState([]);
  const [resultValues, setResultValues] = useState({});
  const [manualOverrides, setManualOverrides] = useState(new Set());
  const [reportNotes, setReportNotes] = useState("");
  const [resultSaving, setResultSaving] = useState(false);
  const [isDraftSaving, setIsDraftSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [selectedDepartment, setSelectedDepartment] = useState("all");

  // Auto-Save States (Always ON like Google Forms)
  const [autoSaveStatus, setAutoSaveStatus] = useState("idle"); // "idle" | "saving" | "saved" | "unsaved" | "error"
  const [lastSavedTime, setLastSavedTime] = useState("");
  const debounceTimerRef = React.useRef(null);
  const isInitialLoadRef = React.useRef(true);
  const isSavingRef = React.useRef(false);

  // Configurator States
  const [configDialogOpen, setConfigDialogOpen] = useState(false);
  const [configTest, setConfigTest] = useState(null);
  const [configParams, setConfigParams] = useState([]);

  // Toast notifications inside component
  const [toast, setToast] = useState({ open: false, message: "", severity: "success" });

  const showToast = (message, severity = "success") => {
    setToast({ open: true, message, severity });
  };

  const availableDepartments = React.useMemo(() => {
    const map = new Map();
    resultTests.forEach((t) => {
      const deptName = t.department?.name || "General Pathology";
      const deptId = t.department?.id ? String(t.department.id) : (t.departmentId ? String(t.departmentId) : deptName);
      if (!map.has(deptId)) {
        map.set(deptId, { id: deptId, name: deptName });
      }
    });

    const getPriority = (name) => {
      const norm = String(name || "").toUpperCase().trim();
      if (norm.includes("HAEMATOLOGY") || norm.includes("HEMATOLOGY")) return 1;
      if (norm.includes("BIOCHEMISTRY")) return 2;
      return 3;
    };

    return Array.from(map.values()).sort((a, b) => {
      const pA = getPriority(a.name);
      const pB = getPriority(b.name);
      if (pA !== pB) return pA - pB;
      return a.name.localeCompare(b.name);
    });
  }, [resultTests]);

  const filteredTests = React.useMemo(() => {
    if (selectedDepartment === "all") return resultTests;
    return resultTests.filter((t) => {
      const deptName = t.department?.name || "General Pathology";
      const deptId = t.department?.id ? String(t.department.id) : (t.departmentId ? String(t.departmentId) : deptName);
      return deptId === selectedDepartment || deptName === selectedDepartment;
    });
  }, [resultTests, selectedDepartment]);

  const loadParameters = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/registrations/${selectedReg.id}/parameters`).then((r) => r.json());
      if (res.success) {
        setResultRegDetails(res.registration);
        const tests = res.registration.tests.map((rt) => rt.test);
        setResultTests(tests);

        // Collect all testParameterIds that are calculated by formulas
        const calculatedParamIds = new Set();
        tests.forEach((test) => {
          (test.formulas || []).forEach((form) => {
            const tp = (test.parameters || []).find(p => p.parameterId === form.outputParameterId);
            if (tp) {
              calculatedParamIds.add(tp.id);
              calculatedParamIds.add(String(tp.id));
            }
          });
        });

        const values = {};
        const overrides = new Set();
        res.registration.results.forEach((r) => {
          values[r.testParameterId] = r.value;
          if (r.value !== undefined && r.value !== null && r.value !== "") {
            // Only lock as manual override if this is NOT a formula-calculated parameter
            if (!calculatedParamIds.has(r.testParameterId)) {
              overrides.add(r.testParameterId);
              overrides.add(String(r.testParameterId));
            }
          }
        });
        setResultValues(values);
        setManualOverrides(overrides);
        setReportNotes(res.registration.remark || "");
        setAutoSaveStatus("idle");
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
      setSelectedDepartment("all");
      setAutoSaveStatus("idle");
      setLastSavedTime("");
      isInitialLoadRef.current = true;
      // eslint-disable-next-line react-hooks/set-state-in-effect
      loadParameters();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, selectedReg]);

  // General save API for both manual and background auto-save
  const saveResultsApi = async (isDraft = true, isSilent = false) => {
    if (!resultRegDetails?.id) return;
    if (!canWrite) return;

    // Concurrency guard: If already saving and this is an auto-save, skip this cycle
    if (isSavingRef.current && isSilent) {
      return;
    }

    // --- Differential Count 100% Validation (Only on Final Save & Complete, not Draft / Auto-save) ---
    if (!isDraft) {
      const dlcError = validateDifferentialOnSave(resultTests, resultValues);
      if (dlcError) {
        showToast(dlcError, "error");
        return;
      }
    }

    isSavingRef.current = true;

    if (isDraft) {
      if (isSilent) {
        setAutoSaveStatus("saving");
      } else {
        setIsDraftSaving(true);
      }
    } else {
      setResultSaving(true);
    }

    try {
      const resultsData = Object.keys(resultValues)
        .filter((paramId) => !isNaN(parseInt(paramId)) && parseInt(paramId) > 0)
        .map((paramId) => ({
          testParameterId: parseInt(paramId),
          value: resultValues[paramId] !== undefined && resultValues[paramId] !== null ? String(resultValues[paramId]) : ""
        }));

      const apiUrl = isDraft
        ? `/api/registrations/${resultRegDetails.id}/results/draft`
        : `/api/registrations/${resultRegDetails.id}/results`;

      const res = await fetch(apiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          resultsData,
          reportNotes,
        }),
      }).then((r) => r.json());

      if (res.success) {
        const now = new Date();
        const timeStr = now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
        setLastSavedTime(timeStr);
        setAutoSaveStatus("saved");

        if (!isDraft) {
          showToast(res.message || "Results saved and completed successfully", "success");
          setIsSaved(true);
          if (onSaveSuccess) onSaveSuccess();
        } else if (!isSilent) {
          showToast("Draft saved successfully", "success");
          if (onSaveSuccess) onSaveSuccess();
        }
      } else {
        if (isSilent) {
          setAutoSaveStatus("error");
        } else {
          showToast(res.message || "Failed to save results", "error");
        }
      }
    } catch (err) {
      console.error("Save results error:", err);
      if (isSilent) {
        setAutoSaveStatus("error");
      } else {
        showToast(err.message || "Failed to save results", "error");
      }
    } finally {
      isSavingRef.current = false;
      setIsDraftSaving(false);
      setResultSaving(false);
    }
  };

  // Debounced Auto-save (Always ON like Google Forms)
  useEffect(() => {
    if (loading) {
      isInitialLoadRef.current = true;
      return;
    }

    if (isInitialLoadRef.current) {
      isInitialLoadRef.current = false;
      return;
    }

    if (!canWrite || !open || !resultRegDetails?.id) return;

    setAutoSaveStatus("unsaved");

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(() => {
      saveResultsApi(true, true);
    }, 1200);

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [resultValues, reportNotes]);

  const handleResultValueChange = (paramId, val, triggerCalc = false) => {
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

    if (triggerCalc) {
      const finalValues = calculateAllDependents(updatedValues, resultTests, paramId, newOverrides);
      setResultValues(finalValues);
    } else {
      setResultValues(updatedValues);
    }
  };

  const handleResultValueBlur = (paramId) => {
    const finalValues = calculateAllDependents(resultValues, resultTests, paramId, manualOverrides);
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
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, flexWrap: "wrap" }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>
              🧪 Test Result of Patient : {resultRegDetails ? `${resultRegDetails.name} / Age: ${resultRegDetails.age.toFixed(2)} ${resultRegDetails.ageUnit} / ${resultRegDetails.gender} / Reg No: ${resultRegDetails.regNo}` : "Loading..."}
            </Typography>

            {/* Auto-Save Google Form Style Status Badge */}
            <Box sx={{ display: "flex", alignItems: "center", gap: 0.6, bgcolor: "rgba(255,255,255,0.18)", px: 1, py: 0.3, borderRadius: 1 }}>
              {autoSaveStatus === "saving" && (
                <>
                  <CircularProgress size={12} sx={{ color: "white" }} />
                  <Typography variant="caption" sx={{ color: "white", fontWeight: 700, fontSize: "0.72rem" }}>
                    Saving draft...
                  </Typography>
                </>
              )}
              {autoSaveStatus === "saved" && (
                <>
                  <CloudDoneIcon sx={{ fontSize: 15, color: "#86efac" }} />
                  <Typography variant="caption" sx={{ color: "white", fontWeight: 700, fontSize: "0.72rem" }}>
                    {lastSavedTime ? `Draft saved (${lastSavedTime})` : "All changes saved in draft"}
                  </Typography>
                </>
              )}
              {autoSaveStatus === "unsaved" && (
                <>
                  <CloudQueueIcon sx={{ fontSize: 15, color: "#fef08a" }} />
                  <Typography variant="caption" sx={{ color: "white", fontWeight: 700, fontSize: "0.72rem" }}>
                    Saving changes...
                  </Typography>
                </>
              )}
              {autoSaveStatus === "error" && (
                <>
                  <CloudOffIcon sx={{ fontSize: 15, color: "#fca5a5" }} />
                  <Typography variant="caption" sx={{ color: "#fca5a5", fontWeight: 700, fontSize: "0.72rem" }}>
                    Auto-save offline
                  </Typography>
                </>
              )}
              {autoSaveStatus === "idle" && (
                <>
                  <CloudDoneIcon sx={{ fontSize: 15, color: "#86efac" }} />
                  <Typography variant="caption" sx={{ color: "white", fontWeight: 700, fontSize: "0.72rem" }}>
                    Auto-save is ON
                  </Typography>
                </>
              )}
            </Box>
          </Box>

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
              <Box sx={{ mb: 2.5, p: 2, bgcolor: "grey.50", borderRadius: 1.5, border: "1px solid", borderColor: "grey.200" }}>
                <Grid container spacing={2} alignItems="center">
                  <Grid item xs={12} sm={3}>
                    <Typography variant="caption" color="text.secondary">Barcode</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 700 }}>{resultRegDetails.barcode?.replace(/^,\s*/, "") || "-"}</Typography>
                  </Grid>
                  <Grid item xs={12} sm={3}>
                    <Typography variant="caption" color="text.secondary">Mobile No</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 700 }}>{resultRegDetails.mobileNo}</Typography>
                  </Grid>
                  <Grid item xs={12} sm={3}>
                    <Typography variant="caption" color="text.secondary">Filter by Department</Typography>
                    <TextField
                      select
                      size="small"
                      fullWidth
                      value={selectedDepartment}
                      onChange={(e) => setSelectedDepartment(e.target.value)}
                      sx={{
                        bgcolor: "white",
                        mt: 0.3,
                        "& .MuiSelect-select": { py: 0.5, fontSize: "0.85rem", fontWeight: 700 }
                      }}
                    >
                      <MenuItem value="all">
                        <em>All Departments ({resultTests.length})</em>
                      </MenuItem>
                      {availableDepartments.map((dept) => {
                        const count = resultTests.filter(t => {
                          const dName = t.department?.name || "General Pathology";
                          const dId = t.department?.id ? String(t.department.id) : (t.departmentId ? String(t.departmentId) : dName);
                          return dId === dept.id || dName === dept.name;
                        }).length;
                        return (
                          <MenuItem key={dept.id} value={dept.id}>
                            {dept.name} ({count})
                          </MenuItem>
                        );
                      })}
                    </TextField>
                  </Grid>
                  <Grid item xs={12} sm={3}>
                    <Typography variant="caption" color="text.secondary">Referred By</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 700 }}>{resultRegDetails.refBy?.name || "Self"}</Typography>
                  </Grid>
                </Grid>
              </Box>

              {/* Quick Department Filter Chips */}
              {/* {availableDepartments.length > 1 && (
                <Box sx={{ display: "flex", gap: 1, mb: 2.5, flexWrap: "wrap", alignItems: "center" }}>
                  <Typography variant="caption" sx={{ fontWeight: 700, color: "text.secondary", mr: 0.5 }}>
                    Department:
                  </Typography>
                  <Chip
                    label={`All (${resultTests.length})`}
                    size="small"
                    clickable
                    color={selectedDepartment === "all" ? "primary" : "default"}
                    variant={selectedDepartment === "all" ? "filled" : "outlined"}
                    onClick={() => setSelectedDepartment("all")}
                    sx={{ fontWeight: selectedDepartment === "all" ? 700 : 500 }}
                  />
                  {availableDepartments.map((dept) => {
                    const isSelected = selectedDepartment === dept.id;
                    const count = resultTests.filter(t => {
                      const dName = t.department?.name || "General Pathology";
                      const dId = t.department?.id ? String(t.department.id) : (t.departmentId ? String(t.departmentId) : dName);
                      return dId === dept.id || dName === dept.name;
                    }).length;
                    return (
                      <Chip
                        key={dept.id}
                        label={`${dept.name} (${count})`}
                        size="small"
                        clickable
                        color={isSelected ? "primary" : "default"}
                        variant={isSelected ? "filled" : "outlined"}
                        onClick={() => setSelectedDepartment(dept.id)}
                        sx={{ fontWeight: isSelected ? 700 : 500 }}
                      />
                    );
                  })}
                </Box>
              )} */}

              {/* Loop through filtered tests and render their parameters */}
              {filteredTests.length === 0 ? (
                <Box sx={{ p: 4, textAlign: "center", bgcolor: "grey.50", borderRadius: 2, border: "1px dashed", borderColor: "grey.300" }}>
                  <Typography variant="body2" color="text.secondary">
                    No tests found for the selected department.
                  </Typography>
                </Box>
              ) : (
                filteredTests.map((test) => {
                  const params = test.parameters || [];
                  const testDeptName = test.department?.name || (test.departmentId ? `Dept #${test.departmentId}` : null);
                  return (
                    <Box key={test.id} sx={{ mb: 4 }}>
                      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1, px: 1 }}>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                          <Typography variant="subtitle2" sx={{ fontWeight: 800, color: "primary.main", borderLeft: "4px solid", pl: 1, borderColor: "primary.main" }}>
                            {test.name} ({test.code})
                          </Typography>
                          {testDeptName && (
                            <Chip
                              label={testDeptName}
                              size="small"
                              sx={{
                                height: 20,
                                fontSize: "0.7rem",
                                fontWeight: 700,
                                bgcolor: "rgba(15, 118, 110, 0.08)",
                                color: "primary.main",
                                border: "1px solid rgba(15, 118, 110, 0.2)"
                              }}
                            />
                          )}
                        </Box>
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
                                let mainCounter = 0;
                                let currentHeaderInfo = null;
                                const headerInfoById = new Map();

                                const computedRows = params.map((param) => {
                                  const ref = getReferenceRange(param, resultRegDetails);
                                  const isHeader = Boolean(param.isHeader) || (param.isHeader === undefined && !param.unit && (!ref || !ref.rangeStr || ref.rangeStr === "" || ref.rangeStr === "-NA-"));

                                  if (isHeader) {
                                    mainCounter++;
                                    const headerInfo = {
                                      mainNumber: mainCounter,
                                      name: param.name,
                                      childCounter: 0
                                    };
                                    headerInfoById.set(param.id, headerInfo);
                                    currentHeaderInfo = headerInfo;
                                    return {
                                      param,
                                      ref,
                                      isHeader: true,
                                      isChild: false,
                                      displaySerial: `${mainCounter}.`
                                    };
                                  }

                                  // Check if this parameter is a child
                                  let parentInfo = null;
                                  if (param.parentId != null && headerInfoById.has(param.parentId)) {
                                    parentInfo = headerInfoById.get(param.parentId);
                                  } else if (param.parentId === undefined && currentHeaderInfo != null) {
                                    parentInfo = currentHeaderInfo;
                                  }

                                  if (parentInfo) {
                                    parentInfo.childCounter++;
                                    return {
                                      param,
                                      ref,
                                      isHeader: false,
                                      isChild: true,
                                      displaySerial: `${parentInfo.mainNumber}.${parentInfo.childCounter}`
                                    };
                                  } else {
                                    mainCounter++;
                                    currentHeaderInfo = null;
                                    return {
                                      param,
                                      ref,
                                      isHeader: false,
                                      isChild: false,
                                      displaySerial: `${mainCounter}`
                                    };
                                  }
                                });

                                return computedRows.map(({ param, ref, isHeader, isChild, displaySerial }) => {
                                  if (isHeader) {
                                    return (
                                      <TableRow
                                        key={param.id}
                                        sx={{
                                          bgcolor: "rgba(15, 118, 110, 0.06)",
                                          borderLeft: "4px solid",
                                          borderColor: "primary.main"
                                        }}
                                      >
                                        <TableCell sx={{ fontWeight: 800, color: "primary.main", py: 1 }}>
                                          {displaySerial}
                                        </TableCell>
                                        <TableCell colSpan={5} sx={{ fontWeight: 800, color: "primary.main", py: 1 }}>
                                          <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", pr: 2 }}>
                                            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                                              <Typography variant="subtitle2" sx={{ fontWeight: 800, color: "primary.main" }}>
                                                {param.name}
                                              </Typography>
                                              <Chip
                                                label="Section Header"
                                                size="small"
                                                sx={{
                                                  height: 20,
                                                  fontSize: "0.68rem",
                                                  fontWeight: 700,
                                                  bgcolor: "rgba(15, 118, 110, 0.12)",
                                                  color: "primary.main"
                                                }}
                                              />
                                            </Box>

                                            {/* Differential Count Total Badge */}
                                            <DifferentialHeaderBadge
                                              headerId={param.id}
                                              headerName={param.name}
                                              sectionParams={params}
                                              resultValues={resultValues}
                                            />
                                          </Box>
                                        </TableCell>
                                      </TableRow>
                                    );
                                  }

                                  const val = resultValues[param.id] || "";
                                  const isAbnormal = isOutOfRange(val, ref.min, ref.max, param, ref.rangeStr);

                                  const normalValLower = (ref.rangeStr || "").toLowerCase();
                                  const isParamOptionType = param.valueType === "OPTIONS";
                                  const isParamTextType = param.valueType === "TEXT";

                                  let dropdownOptions = [];
                                  if (param.options) {
                                    dropdownOptions = param.options
                                      .split(",")
                                      .map(o => o.trim())
                                      .filter(Boolean);
                                  } else if (isParamOptionType) {
                                    if (normalValLower.includes("reactive")) {
                                      dropdownOptions = ["Non-Reactive", "Reactive"];
                                    } else if (normalValLower.includes("absent") || normalValLower.includes("present")) {
                                      dropdownOptions = ["Absent", "Present"];
                                    } else if (normalValLower.includes("detected")) {
                                      dropdownOptions = ["Not Detected", "Detected"];
                                    } else {
                                      dropdownOptions = ["Negative", "Positive"];
                                    }
                                  } else if (normalValLower.includes("negative") || normalValLower.includes("positive")) {
                                    dropdownOptions = ["Negative", "Positive"];
                                  } else if (normalValLower.includes("reactive")) {
                                    dropdownOptions = ["Non-Reactive", "Reactive"];
                                  } else if (normalValLower.includes("absent") || normalValLower.includes("present")) {
                                    dropdownOptions = ["Absent", "Present"];
                                  }

                                  if (val && !dropdownOptions.includes(val) && dropdownOptions.length > 0) {
                                    dropdownOptions.push(val);
                                  }

                                  const hasOptions = dropdownOptions.length > 0;

                                  // Check if parameter has an active math formula
                                  const testFormulas = resultTests.flatMap(t => t.formulas || []);
                                  const paramFormula = testFormulas.find(f => f.outputParameterId === param.parameterId);
                                  const hasFormula = !!paramFormula;
                                  const isOverridden = manualOverrides.has(param.id) || manualOverrides.has(String(param.id));

                                  return (
                                    <TableRow key={param.id} hover>
                                      <TableCell sx={{ color: isChild ? "text.secondary" : "text.primary", fontWeight: isChild ? 600 : 700 }}>
                                        {displaySerial}
                                      </TableCell>
                                      <TableCell sx={{ fontWeight: 600, pl: isChild ? 3.5 : 2 }}>
                                        <Box sx={{ display: "flex", alignItems: "center", gap: 0.8 }}>
                                          {isChild && (
                                            <Typography variant="caption" sx={{ color: "text.disabled", fontWeight: 700 }}>↳</Typography>
                                          )}
                                          <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                            {param.name}
                                          </Typography>
                                        </Box>
                                      </TableCell>
                                      <TableCell sx={{ fontSize: "0.85rem" }}>
                                        {ref.rangeStr || ""}
                                      </TableCell>
                                      <TableCell sx={{ color: "text.secondary" }}>{param.unit || "-"}</TableCell>
                                      <TableCell sx={{ minWidth: 220 }}>
                                        {/* Quick Select Buttons for Qualitative Options */}
                                        {hasOptions && (
                                          <Box sx={{ display: "flex", gap: 0.5, flexWrap: "wrap", mb: 0.75 }}>
                                            {dropdownOptions.map((opt) => {
                                              const isSelected = (val || "").trim().toLowerCase() === opt.trim().toLowerCase();
                                              const isOptAbnormal = isQualitativeAbnormal(opt, ref.rangeStr);
                                              return (
                                                <Chip
                                                  key={opt}
                                                  label={opt}
                                                  size="small"
                                                  clickable
                                                  onClick={() => handleResultValueChange(param.id, opt, true)}
                                                  sx={{
                                                    height: 24,
                                                    fontSize: "0.75rem",
                                                    fontWeight: 700,
                                                    cursor: "pointer",
                                                    bgcolor: isSelected
                                                      ? (isOptAbnormal ? "rgba(239, 68, 68, 0.2)" : "rgba(16, 185, 129, 0.2)")
                                                      : "rgba(0, 0, 0, 0.05)",
                                                    color: isSelected
                                                      ? (isOptAbnormal ? "#dc2626" : "#059669")
                                                      : "text.primary",
                                                    border: isSelected
                                                      ? `1.5px solid ${isOptAbnormal ? "#dc2626" : "#059669"}`
                                                      : "1px solid rgba(0, 0, 0, 0.12)",
                                                    "&:hover": {
                                                      bgcolor: isSelected
                                                        ? (isOptAbnormal ? "rgba(239, 68, 68, 0.3)" : "rgba(16, 185, 129, 0.3)")
                                                        : "rgba(0, 0, 0, 0.1)"
                                                    }
                                                  }}
                                                />
                                              );
                                            })}
                                          </Box>
                                        )}

                                        <TextField
                                          className="result-input-field"
                                          select={hasOptions}
                                          size="small"
                                          fullWidth
                                          disabled={!param.editable}
                                          value={val}
                                          onChange={(e) => handleResultValueChange(param.id, e.target.value, hasOptions)}
                                          onBlur={() => handleResultValueBlur(param.id)}
                                          onKeyDown={handleKeyDown}
                                          error={isAbnormal}
                                          placeholder={isParamTextType ? "Enter observation note..." : "Enter result..."}
                                          sx={{
                                            "& .MuiInputBase-root": {
                                              bgcolor: isAbnormal ? "rgba(239, 68, 68, 0.12)" : "inherit",
                                              borderColor: isAbnormal ? "#ef4444" : undefined
                                            },
                                            "& .MuiInputBase-input": {
                                              py: 0.5,
                                              fontSize: "0.85rem",
                                              fontWeight: isAbnormal ? 700 : (hasFormula && !isOverridden ? 700 : 500),
                                              color: isAbnormal ? "#b91c1c" : "inherit"
                                            }
                                          }}
                                          slotProps={{
                                            input: {
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
                                                    <Tooltip title="Out of normal reference range!">
                                                      <WarningIcon color="error" fontSize="small" sx={{ mr: 0.5 }} />
                                                    </Tooltip>
                                                  )}
                                                </InputAdornment>
                                              )
                                            }
                                          }}
                                        >
                                          {hasOptions ? (
                                            [
                                              <MenuItem key="empty" value=""><em>Select option</em></MenuItem>,
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
                }))}

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
        <DialogActions sx={{ px: 3, py: 1.5, bgcolor: "grey.50", borderTop: "1px solid", borderColor: "divider", gap: 1 }}>
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

          {/* Auto-save status badge in footer */}
          <Chip
            icon={
              autoSaveStatus === "saving" ? (
                <CircularProgress size={12} color="inherit" />
              ) : autoSaveStatus === "error" ? (
                <CloudOffIcon sx={{ fontSize: 14 }} />
              ) : (
                <CloudDoneIcon sx={{ fontSize: 14, color: "#0f766e !important" }} />
              )
            }
            label={
              autoSaveStatus === "saving"
                ? "Auto-saving..."
                : autoSaveStatus === "error"
                ? "Offline (Auto-save pending)"
                : lastSavedTime
                ? `Auto-saved (${lastSavedTime})`
                : "Auto-save is ON"
            }
            size="small"
            variant="outlined"
            sx={{
              borderColor: "rgba(15, 118, 110, 0.3)",
              color: "primary.main",
              fontWeight: 600,
              fontSize: "0.75rem",
              bgcolor: "white"
            }}
          />

          <Box sx={{ flexGrow: 1 }} />
          <Button onClick={onClose} variant="outlined" size="small">
            Cancel
          </Button>

          {/* Save as Draft Button */}
          <Tooltip title={!canWrite ? "You do not have permission to enter results" : ""}>
            <span>
              <Button
                onClick={() => saveResultsApi(true, false)}
                variant="outlined"
                color="primary"
                size="small"
                startIcon={isDraftSaving ? <CircularProgress size={16} color="inherit" /> : <DraftsIcon />}
                disabled={isDraftSaving || resultSaving || !canWrite || loading}
                sx={{ fontWeight: 700 }}
              >
                Save as Draft
              </Button>
            </span>
          </Tooltip>

          {/* Save Results & Complete Button */}
          <Tooltip title={!canWrite ? "You do not have permission to enter results" : ""}>
            <span>
              <Button
                onClick={() => saveResultsApi(false, false)}
                variant="contained"
                size="small"
                startIcon={resultSaving ? <CircularProgress size={16} color="inherit" /> : <SaveIcon />}
                disabled={resultSaving || isDraftSaving || !canWrite || loading}
                sx={{ fontWeight: 700 }}
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
