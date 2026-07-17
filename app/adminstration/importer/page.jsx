"use client";
import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Card,
  Avatar,
  CircularProgress,
  Grid,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Divider,
} from "@mui/material";
import {
  CloudUpload as UploadIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
} from "@mui/icons-material";
import { toast } from "sonner";
import * as XLSX from "xlsx";

export default function ImporterPage() {
  const [workspaces, setWorkspaces] = useState([]);
  const [loadingWs, setLoadingWs] = useState(true);

  // Import state
  const [importWorkspaceId, setImportWorkspaceId] = useState("");
  const [selectedFile, setSelectedFile] = useState(null);
  const [excelHeaders, setExcelHeaders] = useState([]);
  const [excelDataRows, setExcelDataRows] = useState([]);
  const [mappedFields, setMappedFields] = useState({
    name: "",
    code: "",
    price: "",
    baseRate: "",
    curRate: "",
    rate: "",
    collectionCenterRate: "",
    franchiseRate: "",
    superFranchiseRate: "",
    labRate: "",
    offerPrice: "",
    department: "",
    orgName: "",
  });
  const [importStep, setImportStep] = useState(1);
  const [importingProgress, setImportingProgress] = useState(false);
  const [importResult, setImportResult] = useState(null);

  useEffect(() => {
    fetch("/adminstration/api/workspaces")
      .then((r) => r.json())
      .then((res) => {
        if (res.success) setWorkspaces(res.workspaces);
      })
      .catch(console.error)
      .finally(() => setLoadingWs(false));
  }, []);

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSelectedFile(file);
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const data = new Uint8Array(evt.target.result);
        const workbook = XLSX.read(data, { type: "array" });
        const worksheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
        if (jsonData.length === 0) { toast.error("The uploaded file is empty."); return; }
        
        // Clean headers
        const headers = jsonData[0].map((h) => String(h || "").trim()).filter(Boolean);
        setExcelHeaders(headers);
        setExcelDataRows(jsonData.slice(1));

        const detected = {
          name: "",
          code: "",
          price: "",
          baseRate: "",
          curRate: "",
          rate: "",
          collectionCenterRate: "",
          franchiseRate: "",
          superFranchiseRate: "",
          labRate: "",
          offerPrice: "",
          department: "",
          orgName: "",
        };

        headers.forEach((h) => {
          const lower = h.toLowerCase();
          const clean = lower.trim().replace(/[^a-z0-9]/g, "");
          if (clean === "testname" || clean === "name") detected.name = h;
          else if (clean === "code") detected.code = h;
          else if (clean === "baserate") detected.baseRate = h;
          else if (clean === "currate") detected.curRate = h;
          else if (clean === "rate") detected.rate = h;
          else if (clean === "collectioncenter") detected.collectionCenterRate = h;
          else if (clean === "franchises" || clean === "franchise") detected.franchiseRate = h;
          else if (clean === "superfranchises" || clean === "superfranchise") detected.superFranchiseRate = h;
          else if (clean === "labratena" || clean === "labrate") detected.labRate = h;
          else if (clean === "offerprice" || clean === "offer") detected.offerPrice = h;
          else if (clean === "department" || clean === "dept") detected.department = h;
          else if (clean === "orgname" || clean === "parentname" || clean === "originalname") detected.orgName = h;
        });

        // Fallbacks for the basic fields
        if (!detected.name) {
          headers.forEach(h => {
            const lower = h.toLowerCase();
            if (lower.includes("name") || lower.includes("test")) detected.name = h;
          });
        }
        if (!detected.code) {
          headers.forEach(h => {
            const lower = h.toLowerCase();
            if (lower.includes("code") || lower.includes("id")) detected.code = h;
          });
        }
        if (!detected.curRate) {
          headers.forEach(h => {
            const lower = h.toLowerCase();
            if (lower.includes("cur") || lower.includes("current")) detected.curRate = h;
          });
        }
        if (!detected.orgName) {
          headers.forEach(h => {
            const lower = h.toLowerCase();
            if (lower.includes("org") || lower.includes("original") || lower.includes("parent")) detected.orgName = h;
          });
        }
        if (!detected.department) {
          headers.forEach(h => {
            const lower = h.toLowerCase();
            if (lower.includes("dept") || lower.includes("department")) detected.department = h;
          });
        }

        detected.price = detected.curRate || detected.rate || detected.baseRate || "";
        
        setMappedFields(detected);
        setImportStep(2);
      } catch (err) {
        console.error(err);
        toast.error("Failed to parse the Excel file.");
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const handleExecuteImport = async () => {
    if (!importWorkspaceId) { toast.error("Please select a target workspace."); setImportStep(1); return; }
    setImportingProgress(true);
    console.log("Preparing test data payload for server...");

    const nameColIdx = excelHeaders.indexOf(mappedFields.name);
    const codeColIdx = mappedFields.code ? excelHeaders.indexOf(mappedFields.code) : -1;
    const baseRateColIdx = mappedFields.baseRate ? excelHeaders.indexOf(mappedFields.baseRate) : -1;
    const curRateColIdx = mappedFields.curRate ? excelHeaders.indexOf(mappedFields.curRate) : -1;
    const rateColIdx = mappedFields.rate ? excelHeaders.indexOf(mappedFields.rate) : -1;
    const collColIdx = mappedFields.collectionCenterRate ? excelHeaders.indexOf(mappedFields.collectionCenterRate) : -1;
    const franColIdx = mappedFields.franchiseRate ? excelHeaders.indexOf(mappedFields.franchiseRate) : -1;
    const superFranColIdx = mappedFields.superFranchiseRate ? excelHeaders.indexOf(mappedFields.superFranchiseRate) : -1;
    const labRateColIdx = mappedFields.labRate ? excelHeaders.indexOf(mappedFields.labRate) : -1;
    const offerColIdx = mappedFields.offerPrice ? excelHeaders.indexOf(mappedFields.offerPrice) : -1;
    const deptColIdx = mappedFields.department ? excelHeaders.indexOf(mappedFields.department) : -1;
    const orgColIdx = mappedFields.orgName ? excelHeaders.indexOf(mappedFields.orgName) : -1;

    const formattedTests = excelDataRows
      .map((row) => {
        const get = (idx) => (idx !== -1 && row[idx] !== undefined && row[idx] !== null) ? String(row[idx]) : "";
        return {
          name: get(nameColIdx),
          code: get(codeColIdx),
          baseRate: get(baseRateColIdx),
          curRate: get(curRateColIdx),
          rate: get(rateColIdx),
          collectionCenterRate: get(collColIdx),
          franchiseRate: get(franColIdx),
          superFranchiseRate: get(superFranColIdx),
          labRate: get(labRateColIdx),
          offerPrice: get(offerColIdx),
          department: get(deptColIdx),
          orgName: get(orgColIdx),
        };
      })
      .filter((t) => t.name.trim() !== "" || t.orgName.trim() !== "");

    console.log(`Sending ${formattedTests.length} rows to the server for bulk processing. Please wait...`);

    try {
      const res = await fetch("/adminstration/api/tests/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          workspaceId: importWorkspaceId === "global" ? null : importWorkspaceId,
          tests: formattedTests,
        }),
      }).then((r) => r.json());
      if (res.success) {
        console.log("Bulk import finished successfully!", res);
        setImportResult(res);
        setImportStep(4);
        toast.success("Successfully imported tests!");
      }
      else {
        console.error("Bulk import failed:", res.error);
        toast.error(res.error || "Failed to import tests.");
      }
    } catch (err) {
      console.error("Bulk import request error:", err);
      toast.error("An error occurred during the import.");
    } finally {
      setImportingProgress(false);
    }
  };

  const resetImport = () => {
    setImportStep(1); setSelectedFile(null); setExcelHeaders([]);
    setExcelDataRows([]); setMappedFields({
      name: "", code: "", price: "", baseRate: "", curRate: "", rate: "",
      collectionCenterRate: "", franchiseRate: "", superFranchiseRate: "",
      labRate: "", offerPrice: "", department: "", orgName: ""
    }); setImportResult(null);
  };

  return (
    <Box sx={{ flexGrow: 1, p: { xs: 2.5, md: 4 }, bgcolor: "background.default", overflowY: "auto" }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 800, color: "text.primary", mb: 0.5 }}>
          Excel Bulk Lab Test Importer
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Upload an Excel or CSV file, map columns, preview, and bulk import tests into any workspace.
        </Typography>
      </Box>

      <Card variant="outlined" sx={{ borderRadius: 3, p: 3, maxWidth: 900 }}>
        <Typography variant="h5" sx={{ fontWeight: 800, mb: 1, display: "flex", alignItems: "center", gap: 1.5 }}>
          🧪 Import Tests from Excel
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>
          Bulk upload new tests and update prices in one go.
        </Typography>

        {/* Step indicators */}
        <Box sx={{ display: "flex", justifyContent: "space-between", mb: 4, px: 2 }}>
          {[
            { label: "1. Upload File", active: importStep === 1, done: importStep > 1 },
            { label: "2. Column Mapping", active: importStep === 2, done: importStep > 2 },
            { label: "3. Preview Data", active: importStep === 3, done: importStep > 3 },
            { label: "4. Done", active: importStep === 4, done: importStep > 4 },
          ].map((step, idx) => (
            <Box key={idx} sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <Avatar sx={{
                width: 28, height: 28, fontSize: "0.825rem", fontWeight: 700,
                bgcolor: step.active ? "primary.main" : step.done ? "success.main" : "rgba(0,0,0,0.06)",
                color: step.active || step.done ? "#fff" : "text.secondary",
              }}>
                {idx + 1}
              </Avatar>
              <Typography variant="caption" sx={{
                fontWeight: step.active || step.done ? 700 : 500,
                color: step.active ? "primary.main" : step.done ? "success.main" : "text.secondary",
                display: { xs: "none", sm: "block" },
              }}>
                {step.label}
              </Typography>
            </Box>
          ))}
        </Box>

        <Divider sx={{ mb: 4 }} />

        {/* STEP 1 */}
        {importStep === 1 && (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
            <FormControl fullWidth size="small">
              <InputLabel shrink>Target Workspace (Lab)</InputLabel>
              <Select value={importWorkspaceId} onChange={(e) => setImportWorkspaceId(e.target.value)} displayEmpty notched>
                <MenuItem value="" disabled>Select target laboratory...</MenuItem>
                <MenuItem value="global" sx={{ fontWeight: 700, color: "primary.main" }}>[GLOBAL TEMPLATE] Add to global default tests</MenuItem>
                {loadingWs ? (
                  <MenuItem disabled><CircularProgress size={16} /></MenuItem>
                ) : workspaces.map((ws) => (
                  <MenuItem key={ws.id} value={ws.id}>{ws.name} (/{ws.slug})</MenuItem>
                ))}
              </Select>
            </FormControl>

            <Box
              sx={{
                border: "2px dashed", borderColor: "divider", borderRadius: 3, p: 4, textAlign: "center",
                bgcolor: "rgba(0,0,0,0.01)", cursor: "pointer", transition: "all 0.2s",
                "&:hover": { borderColor: "primary.main", bgcolor: "rgba(124,58,237,0.02)" },
              }}
              component="label"
            >
              <input type="file" accept=".xlsx,.xls,.csv" style={{ display: "none" }} onChange={handleFileChange} onClick={(e) => { e.target.value = null; }} />
              <UploadIcon sx={{ fontSize: 48, color: "primary.main", mb: 2 }} />
              <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 0.5 }}>Click to upload test directory file</Typography>
              <Typography variant="caption" color="text.secondary" display="block">Supports Excel files (.xlsx, .xls) and CSV sheets</Typography>
            </Box>
          </Box>
        )}

        {/* STEP 2 */}
        {importStep === 2 && (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>Map columns from your Excel sheet to lab database fields:</Typography>
            
            <Typography variant="body2" sx={{ fontWeight: 700, color: "text.primary", mt: 1 }}>📂 Schema & Structure Mapping</Typography>
            <Grid container spacing={2}>
              {[
                { label: "Test Name / Parameter Name *", field: "name" },
                { label: "Parent Test Name (Org.Name) *", field: "orgName" },
                { label: "Test Code / ID (Optional)", field: "code" },
                { label: "Department (Optional)", field: "department" },
              ].map(({ label, field }) => (
                <Grid key={field} size={{ xs: 12, md: 6 }}>
                  <FormControl fullWidth size="small">
                    <InputLabel shrink>{label}</InputLabel>
                    <Select
                      value={mappedFields[field]}
                      onChange={(e) => setMappedFields((p) => ({ ...p, [field]: e.target.value }))}
                      displayEmpty notched
                    >
                      <MenuItem value="" disabled={field === "name" || field === "orgName"}>Select column...</MenuItem>
                      {excelHeaders.map((h) => <MenuItem key={h} value={h}>{h}</MenuItem>)}
                    </Select>
                  </FormControl>
                </Grid>
              ))}
            </Grid>

            <Typography variant="body2" sx={{ fontWeight: 700, color: "text.primary", mt: 2 }}>💰 Pricing Tier Mappings</Typography>
            <Grid container spacing={2}>
              {[
                { label: "Current Rate (INR) *", field: "curRate" },
                { label: "Patient Rate (INR)", field: "rate" },
                { label: "Base Rate (INR)", field: "baseRate" },
                { label: "Collection Center Rate (INR)", field: "collectionCenterRate" },
                { label: "Franchise Rate (INR)", field: "franchiseRate" },
                { label: "Super Franchise Rate (INR)", field: "superFranchiseRate" },
                { label: "Lab Rate (INR)", field: "labRate" },
                { label: "Offer Price (INR)", field: "offerPrice" },
              ].map(({ label, field }) => (
                <Grid key={field} size={{ xs: 12, sm: 6, md: 3 }}>
                  <FormControl fullWidth size="small">
                    <InputLabel shrink>{label}</InputLabel>
                    <Select
                      value={mappedFields[field]}
                      onChange={(e) => setMappedFields((p) => ({ ...p, [field]: e.target.value }))}
                      displayEmpty notched
                    >
                      <MenuItem value="">{field === "curRate" ? "Select column..." : "[Not Mapped]"}</MenuItem>
                      {excelHeaders.map((h) => <MenuItem key={h} value={h}>{h}</MenuItem>)}
                    </Select>
                  </FormControl>
                </Grid>
              ))}
            </Grid>

            <Box sx={{ display: "flex", justifyContent: "space-between", mt: 4 }}>
              <Button variant="outlined" onClick={() => setImportStep(1)}>Back</Button>
              <Button variant="contained" disabled={!mappedFields.name || !mappedFields.orgName || !mappedFields.curRate} onClick={() => setImportStep(3)}>Preview Data</Button>
            </Box>
          </Box>
        )}

        {/* STEP 3 */}
        {importStep === 3 && (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>Previewing first 5 rows to verify mappings:</Typography>
            <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2 }}>
              <Table size="small">
                <TableHead sx={{ bgcolor: "background.paper" }}>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 700 }}>Row</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Test Name (Parameter)</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Code</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Parent (Org.Name)</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Department</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Cur. Rate</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Base Rate</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {excelDataRows.slice(0, 5).map((row, idx) => {
                    const get = (field) => {
                      const h = mappedFields[field]; if (!h) return null;
                      const ci = excelHeaders.indexOf(h);
                      return ci !== -1 ? String(row[ci] || "").trim() : null;
                    };
                    const name = get("name"), code = get("code"), orgName = get("orgName"), department = get("department"), curRate = get("curRate"), baseRate = get("baseRate");
                    return (
                      <TableRow key={idx}>
                        <TableCell>{idx + 1}</TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>
                          {name !== null ? (name || <span style={{ color: "#ef4444" }}>[Empty]</span>) : <span style={{ color: "rgba(0,0,0,0.3)", fontStyle: "italic" }}>[Not Mapped]</span>}
                        </TableCell>
                        <TableCell sx={{ color: "text.secondary" }}>
                          {mappedFields.code === "" ? <span style={{ color: "#7c3aed", fontStyle: "italic" }}>[Auto-Gen]</span>
                            : code !== null ? (code || <span style={{ color: "rgba(0,0,0,0.2)" }}>-</span>) : <span style={{ color: "rgba(0,0,0,0.3)", fontStyle: "italic" }}>[Not Mapped]</span>}
                        </TableCell>
                        <TableCell sx={{ fontWeight: 500, color: "primary.main" }}>
                          {orgName !== null ? (orgName || <span style={{ color: "#ef4444" }}>[Empty]</span>) : <span style={{ color: "rgba(0,0,0,0.3)", fontStyle: "italic" }}>[Not Mapped]</span>}
                        </TableCell>
                        <TableCell sx={{ color: "text.secondary" }}>
                          {department || <span style={{ color: "rgba(0,0,0,0.2)" }}>-</span>}
                        </TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>
                          {curRate !== null ? (curRate && !isNaN(parseFloat(curRate)) ? `₹${parseFloat(curRate).toFixed(2)}` : <span style={{ color: "#ef4444" }}>[Invalid]</span>)
                            : <span style={{ color: "rgba(0,0,0,0.3)", fontStyle: "italic" }}>[Not Mapped]</span>}
                        </TableCell>
                        <TableCell sx={{ color: "text.secondary" }}>
                          {baseRate !== null ? (baseRate && !isNaN(parseFloat(baseRate)) ? `₹${parseFloat(baseRate).toFixed(2)}` : <span style={{ color: "rgba(0,0,0,0.2)" }}>-</span>)
                            : <span style={{ color: "rgba(0,0,0,0.3)", fontStyle: "italic" }}>[Not Mapped]</span>}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
            <Box sx={{ display: "flex", justifyContent: "space-between", mt: 3 }}>
              <Button variant="outlined" onClick={() => setImportStep(2)} disabled={importingProgress}>Back</Button>
              <Button
                variant="contained" color="success"
                disabled={!mappedFields.name || !mappedFields.orgName || !mappedFields.curRate || importingProgress}
                onClick={handleExecuteImport}
                startIcon={importingProgress ? <CircularProgress size={16} color="inherit" /> : null}
              >
                {importingProgress ? "Importing..." : "Start Import"}
              </Button>
            </Box>
          </Box>
        )}

        {/* STEP 4 */}
        {importStep === 4 && importResult && (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 3, textAlign: "center" }}>
            <Box sx={{ display: "flex", justifyContent: "center", mb: 1 }}>
              {importResult.errors?.length > 0 ? <ErrorIcon color="warning" sx={{ fontSize: 64 }} /> : <CheckCircleIcon color="success" sx={{ fontSize: 64 }} />}
            </Box>
            <Typography variant="h5" sx={{ fontWeight: 800 }}>
              {importResult.errors?.length > 0 ? "Import Completed with Warnings" : "Import Completed Successfully!"}
            </Typography>
            <Grid container spacing={3} sx={{ mt: 1, mb: 2 }}>
              <Grid size={{ xs: 12, md: 6 }}>
                <Card variant="outlined" sx={{ p: 2, borderRadius: 2, bgcolor: "rgba(124,58,237,0.04)" }}>
                  <Typography variant="h4" color="primary.main" sx={{ fontWeight: 800 }}>{importResult.createdCount}</Typography>
                  <Typography variant="body2" color="text.secondary">Tests Created / Synced</Typography>
                </Card>
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <Card variant="outlined" sx={{ p: 2, borderRadius: 2, bgcolor: "rgba(34,197,94,0.04)" }}>
                  <Typography variant="h4" color="success.main" sx={{ fontWeight: 800 }}>{importResult.updatedCount}</Typography>
                  <Typography variant="body2" color="text.secondary">Tests Updated / Repriced</Typography>
                </Card>
              </Grid>
            </Grid>
            {importResult.errors?.length > 0 && (
              <Box sx={{ textAlign: "left" }}>
                <Typography variant="subtitle2" color="warning.main" sx={{ fontWeight: 700, mb: 1 }}>Warnings ({importResult.errors.length}):</Typography>
                <Paper variant="outlined" sx={{ p: 2, maxHeight: 150, overflowY: "auto", bgcolor: "rgba(0,0,0,0.03)", borderRadius: 2 }}>
                  {importResult.errors.map((err, i) => (
                    <Typography key={i} variant="caption" display="block" color="text.secondary" sx={{ mb: 0.5 }}>• {err}</Typography>
                  ))}
                </Paper>
              </Box>
            )}
            <Box sx={{ mt: 3 }}>
              <Button variant="contained" onClick={resetImport}>Import Another File</Button>
            </Box>
          </Box>
        )}
      </Card>
    </Box>
  );
}
