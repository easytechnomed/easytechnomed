"use client";

import React from "react";
import { Chip, Tooltip } from "@mui/material";

// Exact 5 DLC definitions with strict exclusion of Absolute counts and WBC
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

/**
 * Check if a section header represents Differential Cell Count
 */
export const isDifferentialHeader = (headerName = "") => {
  const norm = String(headerName || "").toLowerCase().replace(/[^a-z0-9]/g, "");
  return (
    norm.includes("differential") ||
    norm.includes("dlc") ||
    norm.includes("diffcount") ||
    norm.includes("differentialcount") ||
    norm.includes("differentialcellcount") ||
    norm.includes("differentialleucocytecount")
  );
};

/**
 * Calculate the Differential Cell Count summary strictly for the 5 DLC parameters
 */
export const calculateDifferentialSummary = (parameters = [], resultValues = {}, headerId = null) => {
  // If headerId is provided and direct children exist, restrict candidate search
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
    // Skip if it's a section header itself
    if (param.isHeader) return;

    const pCode = (param.code || "").toUpperCase().trim();
    const pNameNorm = (param.name || "").toLowerCase().replace(/[^a-z0-9]/g, "");
    const pUnit = (param.unit || "").trim().toLowerCase();

    // STRICT EXCLUSION: Never match Absolute counts, WBC count, or cells/cumm
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

/**
 * Pre-Save Validator for Differential Cell Count
 * Returns error string if invalid, or null if valid
 */
export const validateDifferentialOnSave = (tests = [], resultValues = {}) => {
  for (const test of tests) {
    const params = test.parameters || [];
    const summary = calculateDifferentialSummary(params, resultValues);

    if (summary.isDifferential && summary.filledCount > 0 && summary.total !== 100) {
      if (summary.total > 100) {
        return `Differential Cell Count total is ${summary.total}% (+${summary.discrepancy}% Over Limit). Total must equal exactly 100% before saving.`;
      } else {
        return `Differential Cell Count total is ${summary.total}% (-${summary.remaining}% Remaining). Total must equal exactly 100% before saving.`;
      }
    }
  }
  return null;
};

/**
 * Dedicated Differential Header Badge Component
 */
export default function DifferentialHeaderBadge({ headerId, headerName, sectionParams, resultValues }) {
  if (!isDifferentialHeader(headerName)) {
    return null;
  }

  const summary = calculateDifferentialSummary(sectionParams, resultValues, headerId);
  if (!summary.isDifferential) {
    return null;
  }

  const { total, filledCount, isValid, isOver, isUnder, discrepancy, remaining } = summary;

  let label = "Target: 100%";
  let color = "default";
  let tooltipText = "Differential Cell Count parameters should total 100%";

  if (filledCount > 0) {
    if (isValid) {
      label = `Total: ${total}% ✓`;
      color = "success";
      tooltipText = "Differential count is perfectly balanced at 100%!";
    } else if (isOver) {
      label = `Total: ${total}% (+${discrepancy}% Over Limit)`;
      color = "error";
      tooltipText = `Total is ${total}%, which is ${discrepancy}% over the 100% limit!`;
    } else if (isUnder) {
      label = `Total: ${total}% (-${remaining}% Remaining)`;
      color = "warning";
      tooltipText = `Total is ${total}%, which is ${remaining}% short of 100%!`;
    }
  }

  return (
    <Tooltip title={tooltipText} arrow>
      <Chip
        label={label}
        size="small"
        color={color}
        sx={{
          fontWeight: 800,
          fontSize: "0.75rem",
          height: 24,
          boxShadow: filledCount > 0 && !isValid ? (isOver ? "0 0 8px rgba(239, 68, 68, 0.5)" : "0 0 8px rgba(245, 158, 11, 0.4)") : "none",
        }}
      />
    </Tooltip>
  );
}
