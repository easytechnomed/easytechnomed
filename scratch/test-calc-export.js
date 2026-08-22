const DLC_DEFINITIONS = [
  {
    code: "NEUT",
    isMatch: (code, norm) => {
      if (code === "NEUT") return true;
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
    isMatch: (code, norm) => {
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
    isMatch: (code, norm) => {
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
    isMatch: (code, norm) => {
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
    isMatch: (code, norm) => {
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

const calculateDifferentialSummary = (parameters = [], resultValues = {}, headerId = null) => {
  let candidates = parameters;
  if (headerId != null) {
    const directChildren = parameters.filter((p) => p.parentId === headerId);
    if (directChildren.length > 0) {
      candidates = directChildren;
    }
  }

  const dlcParams = [];
  let sum = 0;
  let filledCount = 0;

  candidates.forEach((param) => {
    if (param.isHeader) return;

    const pCode = (param.code || "").toUpperCase().trim();
    const pNameNorm = (param.name || "").toLowerCase().replace(/[^a-z0-9]/g, "");
    const pUnit = (param.unit || "").trim().toLowerCase();

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

    const matchedDef = DLC_DEFINITIONS.find((def) => def.isMatch(pCode, pNameNorm));

    if (matchedDef) {
      const rawVal = resultValues ? resultValues[param.id] : null;
      let numericVal = null;
      if (rawVal !== undefined && rawVal !== null && String(rawVal).trim() !== "") {
        const parsed = parseFloat(String(rawVal).trim());
        if (!isNaN(parsed)) {
          numericVal = parsed;
          sum += parsed;
          filledCount++;
        }
      }
      dlcParams.push({
        key: matchedDef.code,
        param,
        value: numericVal,
      });
    }
  });

  const total = parseFloat(sum.toFixed(2));
  const target = 100;
  const discrepancy = parseFloat((total - target).toFixed(2));
  const remaining = parseFloat((target - total).toFixed(2));
  const isComplete = dlcParams.length > 0 && filledCount === dlcParams.length;
  const isValid = filledCount === 0 || total === target;

  return {
    isDifferential: dlcParams.length >= 2,
    total,
    target,
    filledCount,
    totalCount: dlcParams.length,
    isComplete,
    isValid,
    isOver: total > target,
    isUnder: total < target && filledCount > 0,
    discrepancy: Math.abs(discrepancy),
    remaining: Math.abs(remaining),
    dlcParams,
  };
};

module.exports = { calculateDifferentialSummary };
