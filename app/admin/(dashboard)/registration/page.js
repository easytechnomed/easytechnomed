"use client";

import React, { useState, useEffect } from "react";
import {
  Box,
  Card,
  CardContent,
  Grid,
  TextField,
  MenuItem,
  Button,
  Typography,
  Autocomplete,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Divider,
  FormControlLabel,
  Switch,
  CircularProgress,
  Snackbar,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Menu,
  createFilterOptions,
  Tooltip
} from "@mui/material";
import {
  Delete as DeleteIcon,
  Save as SaveIcon,
  Print as PrintIcon,
  Refresh as RefreshIcon,
  Add as AddIcon,
  Edit as EditIcon
} from "@mui/icons-material";
import { useSearchParams, useRouter } from "next/navigation";
import { useAdminPermissions } from "@/lib/clientAuth";

const filter = createFilterOptions();

export default function RegistrationPage() {
  const { hasPermission } = useAdminPermissions();
  const canWrite = hasPermission("REGISTRATION_WRITE");
  // Page states
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams.get("edit");
  const [doctors, setDoctors] = useState([]);
  const [tests, setTests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Form states
  const [billOn, setBillOn] = useState("Patient Rate");
  const [mobileNo, setMobileNo] = useState("");
  const [regDate, setRegDate] = useState(new Date().toISOString().substring(0, 10));
  const [title, setTitle] = useState("Mr.");
  const [name, setName] = useState("");
  const [city, setCity] = useState("-NA-");
  const [age, setAge] = useState("");
  const [ageUnit, setAgeUnit] = useState("Year");
  const [gender, setGender] = useState("Male");
  const [refBy, setRefBy] = useState(null);
  const [secondRef, setSecondRef] = useState(null);
  const [remark, setRemark] = useState("");

  const [selectedTests, setSelectedTests] = useState([]);
  const [testSearchInput, setTestSearchInput] = useState("");

  // Dialog states for adding a new doctor
  const [openAddDocDialog, setOpenAddDocDialog] = useState(false);
  const [newDocName, setNewDocName] = useState("");
  const [newDocCode, setNewDocCode] = useState("");
  const [newDocDegree, setNewDocDegree] = useState("");
  const [newDocAddress, setNewDocAddress] = useState("");
  const [newDocClinicName, setNewDocClinicName] = useState("");
  const [newDocIncentive, setNewDocIncentive] = useState("0");
  const [addDocTarget, setAddDocTarget] = useState("refBy");
  const [isAddingDoc, setIsAddingDoc] = useState(false);

  // Dialog states for adding/editing a test on the fly
  const [openAddTestDialog, setOpenAddTestDialog] = useState(false);
  const [newTestName, setNewTestName] = useState("");
  const [newTestCode, setNewTestCode] = useState("");
  const [newTestPrice, setNewTestPrice] = useState("");
  const [isSavingTest, setIsSavingTest] = useState(false);

  const [openEditTestDialog, setOpenEditTestDialog] = useState(false);
  const [editingTest, setEditingTest] = useState(null);
  const [editingTestName, setEditingTestName] = useState("");
  const [editingTestPrice, setEditingTestPrice] = useState("");

  // Mobile lookup states
  const [matchingPatients, setMatchingPatients] = useState([]);
  const [mobileAnchorEl, setMobileAnchorEl] = useState(null);
  const [isLookingUpMobile, setIsLookingUpMobile] = useState(false);

  // Payment states
  const [colType, setColType] = useState("Camp");
  const [expRptDate, setExpRptDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1); // default tomorrow
    return d.toISOString().substring(0, 16);
  });
  const [sampleDate, setSampleDate] = useState(new Date().toISOString().substring(0, 16));
  const [sampleNo, setSampleNo] = useState("");
  const [sampleBy, setSampleBy] = useState("-NA-");
  const [paymentMode, setPaymentMode] = useState("Cash");
  const [paymentRefNo, setPaymentRefNo] = useState("");
  const [collectionCharge, setCollectionCharge] = useState(0);
  const [discountPercent, setDiscountPercent] = useState(0);
  const [discountAmount, setDiscountAmount] = useState(0);
  const [receivedAmount, setReceivedAmount] = useState(0);
  const [stickerCount, setStickerCount] = useState(1);

  // Notifications
  const [notification, setNotification] = useState({ open: false, message: "", severity: "success" });

  // Load initial data (doctors & tests)
  useEffect(() => {
    async function loadData() {
      try {
        const [docsRes, testsRes] = await Promise.all([
          fetch("/api/doctors").then((r) => r.json()),
          fetch("/api/tests").then((r) => r.json())
        ]);
        if (docsRes.success) setDoctors(docsRes.doctors);
        if (testsRes.success) {
          const parsedTests = testsRes.tests.map((t) => ({
            ...t,
            price: Number(t.price) || 0,
          }));
          setTests(parsedTests);
        }
      } catch (err) {
        console.error(err);
        showNotification("Failed to load initial data", "error");
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  // Load registration data for editing if editId is active
  useEffect(() => {
    if (!editId || doctors.length === 0 || tests.length === 0) return;

    async function fetchReg() {
      setLoading(true);
      try {
        const res = await fetch(`/api/registrations/${parseInt(editId)}`).then((r) => r.json());
        if (res.success) {
          const reg = res.registration;
          setBillOn(reg.billOn);
          setMobileNo(reg.mobileNo);
          setRegDate(new Date(reg.date).toISOString().substring(0, 10));
          setTitle(reg.title);
          setName(reg.name);
          setCity(reg.city);
          setAge(reg.age);
          setAgeUnit(reg.ageUnit);
          setGender(reg.gender);
          setRemark(reg.remark || "");
          setColType(reg.colType);
          if (reg.expRptDate) setExpRptDate(new Date(reg.expRptDate).toISOString().substring(0, 16));
          if (reg.sampleDate) setSampleDate(new Date(reg.sampleDate).toISOString().substring(0, 16));
          setSampleNo(reg.sampleNo || "");
          setSampleBy(reg.sampleBy);
          setPaymentMode(reg.paymentMode);
          setPaymentRefNo(reg.paymentRefNo || "");
          setCollectionCharge(Number(reg.collectionCharge));
          setDiscountPercent(Number(reg.discountPercent));
          setDiscountAmount(Number(reg.discountAmount));
          setReceivedAmount(Number(reg.receivedAmount));
          setStickerCount(reg.stickerCount);

          if (reg.refById) {
            const doc = doctors.find((d) => d.id === reg.refById);
            if (doc) setRefBy(doc);
          }
          if (reg.secondRefId) {
            const doc = doctors.find((d) => d.id === reg.secondRefId);
            if (doc) setSecondRef(doc);
          }

          const mappedTests = reg.tests.map((rt) => {
            let match = tests.find((t) => t.id === rt.testId);
            if (!match && rt.test) {
              match = tests.find((t) => 
                (rt.test.code && t.code === rt.test.code) ||
                (t.name.toLowerCase() === rt.test.name.toLowerCase())
              );
            }
            return match;
          }).filter(Boolean);
          setSelectedTests(mappedTests);
        } else {
          showNotification(res.message, "error");
        }
      } catch (err) {
        console.error(err);
        showNotification("Failed to load registration details", "error");
      } finally {
        setLoading(false);
      }
    }
    fetchReg();
  }, [editId, doctors, tests]);

  // Keyboard shortcut F10 for saving
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "F10") {
        e.preventDefault();
        handleSave();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [
    billOn, mobileNo, regDate, title, name, city, age, ageUnit, gender,
    refBy, secondRef, remark, selectedTests, colType, expRptDate, sampleDate,
    sampleNo, sampleBy, paymentMode, paymentRefNo, collectionCharge,
    discountPercent, discountAmount, receivedAmount, stickerCount
  ]);

  const showNotification = (message, severity = "success") => {
    setNotification({ open: true, message, severity });
  };

  const handleCloseNotification = () => {
    setNotification({ ...notification, open: false });
  };

  const handleTitleChange = (val) => {
    setTitle(val);
    const maleTitles = ["Mr.", "Mast.", "Md.", "Baba (M)", "S/O"];
    const femaleTitles = ["Mrs.", "Ms.", "Miss.", "Sister", "Baby (F)", "W/O", "D/O"];

    if (maleTitles.includes(val)) {
      setGender("Male");
    } else if (femaleTitles.includes(val)) {
      setGender("Female");
    }
  };

  // Calculations
  const totalTestsAmount = selectedTests.reduce((sum, t) => sum + t.price, 0);
  const totalBillAmount = totalTestsAmount + Number(collectionCharge);
  const calculatedDue = Math.max(0, totalBillAmount - Number(discountAmount) - Number(receivedAmount));

  // Handle discount updates
  const handleDiscountPercentChange = (val) => {
    const pct = parseFloat(val) || 0;
    setDiscountPercent(pct);
    const amt = parseFloat(((totalTestsAmount * pct) / 100).toFixed(2));
    setDiscountAmount(amt);
  };

  const handleDiscountAmountChange = (val) => {
    const amt = parseFloat(val) || 0;
    setDiscountAmount(amt);
    const pct = totalTestsAmount > 0 ? parseFloat(((amt / totalTestsAmount) * 100).toFixed(2)) : 0;
    setDiscountPercent(pct);
  };

  // Reset form
  const handleReset = () => {
    setMobileNo("");
    setName("");
    setAge("");
    setRefBy(null);
    setSecondRef(null);
    setRemark("");
    setSelectedTests([]);
    setCollectionCharge(0);
    setDiscountPercent(0);
    setDiscountAmount(0);
    setReceivedAmount(0);
    setSampleNo("");
    setPaymentRefNo("");
  };

  // Add selected test
  const handleAddTest = (test) => {
    if (!test) return;
    if (selectedTests.some((t) => t.id === test.id)) {
      showNotification("Test is already added", "warning");
      return;
    }
    const updated = [...selectedTests, test];
    setSelectedTests(updated);

    // Recalculate discount if percentage is set
    const totalAmt = updated.reduce((sum, t) => sum + t.price, 0);
    if (discountPercent > 0) {
      const amt = parseFloat(((totalAmt * discountPercent) / 100).toFixed(2));
      setDiscountAmount(amt);
    }
  };

  // Remove test
  const handleRemoveTest = (id) => {
    const updated = selectedTests.filter((t) => t.id !== id);
    setSelectedTests(updated);

    // Recalculate discount if percentage is set
    const totalAmt = updated.reduce((sum, t) => sum + t.price, 0);
    if (discountPercent > 0) {
      const amt = parseFloat(((totalAmt * discountPercent) / 100).toFixed(2));
      setDiscountAmount(amt);
    }
  };

  // Create test on the fly
  const handleCreateTest = async () => {
    if (!newTestName.trim()) {
      showNotification("Test name is required.", "error");
      return;
    }
    if (!newTestPrice || isNaN(parseFloat(newTestPrice))) {
      showNotification("Please enter a valid price.", "error");
      return;
    }

    setIsSavingTest(true);
    try {
      const res = await fetch("/api/tests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newTestName.trim(),
          code: newTestCode.trim() || null,
          price: parseFloat(newTestPrice),
        }),
      }).then((r) => r.json());

      if (res.success) {
        showNotification("Test added successfully!", "success");

        const parsedTest = {
          ...res.test,
          price: Number(res.test.price) || 0,
        };

        // Update the master test catalog list
        setTests((prev) => {
          const updated = [...prev, parsedTest];
          return updated.sort((a, b) => a.name.localeCompare(b.name));
        });

        // Automatically select/add it to the registration form
        handleAddTest(parsedTest);

        // Reset state & close dialog
        setOpenAddTestDialog(false);
        setNewTestName("");
        setNewTestCode("");
        setNewTestPrice("");
      } else {
        showNotification(res.message || "Failed to add test.", "error");
      }
    } catch (err) {
      console.error(err);
      showNotification("An error occurred while adding test.", "error");
    } finally {
      setIsSavingTest(false);
    }
  };

  // Open Edit Test Dialog
  const handleOpenEditTest = (test) => {
    setEditingTest(test);
    setEditingTestName(test.name);
    setEditingTestPrice(String(test.price));
    setOpenEditTestDialog(true);
  };

  // Update Test Details
  const handleUpdateTest = async () => {
    if (!editingTest) return;
    if (!editingTestName.trim()) {
      showNotification("Test name is required.", "error");
      return;
    }
    if (!editingTestPrice || isNaN(parseFloat(editingTestPrice))) {
      showNotification("Please enter a valid price.", "error");
      return;
    }

    setIsSavingTest(true);
    try {
      const res = await fetch("/api/tests", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          testId: editingTest.id,
          name: editingTestName.trim(),
          price: parseFloat(editingTestPrice),
        }),
      }).then((r) => r.json());

      if (res.success) {
        showNotification("Test updated successfully!", "success");

        const parsedTest = {
          ...res.test,
          price: Number(res.test.price) || 0,
        };

        // Update test in master tests list
        setTests((prev) => {
          return prev.map((t) => (t.id === parsedTest.id ? parsedTest : t))
            .sort((a, b) => a.name.localeCompare(b.name));
        });

        // Update test inside selectedTests array if it was selected and adjust totals
        setSelectedTests((prev) => {
          const updated = prev.map((t) => (t.id === parsedTest.id ? parsedTest : t));
          const totalAmt = updated.reduce((sum, t) => sum + t.price, 0);
          if (discountPercent > 0) {
            const amt = parseFloat(((totalAmt * discountPercent) / 100).toFixed(2));
            setDiscountAmount(amt);
          }
          return updated;
        });

        setOpenEditTestDialog(false);
        setEditingTest(null);
        setEditingTestName("");
        setEditingTestPrice("");
      } else {
        showNotification(res.message || "Failed to update test.", "error");
      }
    } catch (err) {
      console.error(err);
      showNotification("An error occurred while updating test.", "error");
    } finally {
      setIsSavingTest(false);
    }
  };

  // Save Registration
  const handleSave = async () => {
    if (!mobileNo || mobileNo.length < 10) {
      showNotification("Please enter a valid 10-digit mobile number", "error");
      return;
    }
    if (!name) {
      showNotification("Patient name is required", "error");
      return;
    }
    if (!age) {
      showNotification("Patient age is required", "error");
      return;
    }
    if (selectedTests.length === 0) {
      showNotification("At least one test must be selected", "error");
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        billOn,
        mobileNo,
        title,
        name,
        city,
        age: parseFloat(age),
        ageUnit,
        gender,
        refById: refBy ? refBy.id : null,
        secondRefById: secondRef ? secondRef.id : null,
        remark,
        colType,
        expRptDate,
        sampleDate,
        sampleNo: sampleNo || null,
        sampleBy,
        paymentMode,
        paymentRefNo: paymentRefNo || null,
        totalAmount: totalTestsAmount,
        collectionCharge: parseFloat(collectionCharge) || 0,
        discountPercent: parseFloat(discountPercent) || 0,
        discountAmount: parseFloat(discountAmount) || 0,
        receivedAmount: parseFloat(receivedAmount) || 0,
        dueAmount: calculatedDue,
        stickerCount: parseInt(stickerCount) || 1,
        testIds: selectedTests.map((t) => t.id),
      };

      const res = editId
        ? await fetch(`/api/registrations/${parseInt(editId)}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }).then((r) => r.json())
        : await fetch("/api/registrations", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }).then((r) => r.json());

      if (res.success) {
        showNotification(res.message, "success");
        if (editId) {
          setTimeout(() => router.push("/test-report"), 1000);
        } else {
          handleReset();
        }
      } else {
        showNotification(res.message, "error");
      }
    } catch (err) {
      console.error(err);
      showNotification("An unexpected error occurred while saving", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddDoctorSave = async () => {
    if (!newDocName.trim()) return;
    setIsAddingDoc(true);
    try {
      const res = await fetch("/api/doctors", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newDocName.trim(),
          code: newDocCode.trim() || null,
          degree: newDocDegree.trim() || null,
          address: newDocAddress.trim() || null,
          clinicName: newDocClinicName.trim() || null,
          incentivePercent: parseFloat(newDocIncentive) || 0,
        }),
      }).then((r) => r.json());

      if (res.success) {
        showNotification(res.message || "Doctor added successfully!", "success");

        // Add new doctor to doctors option list
        const createdDoctor = res.doctor;
        setDoctors((prev) => {
          const updated = [...prev, createdDoctor];
          return updated.sort((a, b) => a.name.localeCompare(b.name));
        });

        // Set selected doctor for the triggering field
        if (addDocTarget === "refBy") {
          setRefBy(createdDoctor);
        } else if (addDocTarget === "secondRef") {
          setSecondRef(createdDoctor);
        }

        // Reset dialog states
        setOpenAddDocDialog(false);
        setNewDocName("");
        setNewDocCode("");
        setNewDocDegree("");
        setNewDocAddress("");
        setNewDocClinicName("");
        setNewDocIncentive("0");
      } else {
        showNotification(res.message || "Failed to add doctor", "error");
      }
    } catch (err) {
      console.error(err);
      showNotification("An unexpected error occurred", "error");
    } finally {
      setIsAddingDoc(false);
    }
  };

  const handleClearPatientFields = () => {
    setTitle("Mr.");
    setName("");
    setGender("Male");
    setAge("");
    setAgeUnit("Year");
    setCity("-NA-");
  };

  const handlePrefillPatient = (p) => {
    setTitle(p.title || "Mr.");
    setName(p.name || "");
    setGender(p.gender || "Male");
    setAge(p.age || "");
    setAgeUnit(p.ageUnit || "Year");
    if (p.city) setCity(p.city);
    showNotification(`Prefilled patient details for ${p.name}.`, "success");
  };

  const handleMobileNoChange = async (e) => {
    const val = e.target.value.replace(/\D/g, ""); // Allow only digits
    if (val.length > 10) return; // Limit to 10 digits
    setMobileNo(val);

    if (val.length === 10) {
      const targetInput = e.currentTarget;
      setIsLookingUpMobile(true);
      try {
        const res = await fetch(`/api/registrations/by-mobile?mobileNo=${val}`).then((r) => r.json());
        if (res.success && res.patients && res.patients.length > 0) {
          if (res.patients.length === 1) {
            // Exactly one patient, prefill immediately
            handlePrefillPatient(res.patients[0]);
          } else {
            // Multiple patients, open dropdown anchored to the input field
            setMatchingPatients(res.patients);
            setMobileAnchorEl(targetInput);
          }
        } else {
          // New number detected (no previous registrations), clear patient fields
          handleClearPatientFields();
        }
      } catch (err) {
        console.error("Failed to lookup mobile number:", err);
      } finally {
        setIsLookingUpMobile(false);
      }
    } else {
      // Clear dropdown if they modify the number below 10 digits
      setMobileAnchorEl(null);
      setMatchingPatients([]);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "60vh" }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ flexGrow: 1 }}>
      {/* Header Info */}
      <Box sx={{ display: "flex", flexDirection: { xs: "column", sm: "row" }, justifyContent: "space-between", alignItems: { xs: "flex-start", sm: "center" }, gap: 1, mb: 3 }}>
        <Typography variant="h5" sx={{ fontWeight: 800, color: "primary.main" }}>
          {editId ? "Edit Patient Registration" : "New Patient Registration"}
        </Typography>
        <Typography variant="body2" sx={{ color: "text.secondary" }}>
          {editId ? `Editing Patient ID: ${editId}` : "Autogenerated ID & Reg Number on save"}
        </Typography>
      </Box>

      <Grid container spacing={3}>
        {/* Left Form Panel: Patient Details & Tests */}
        <Grid size={{ xs: 12, md: 8 }}>
          <Card variant="outlined" sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2, color: "primary.main" }}>
                Patient Information
              </Typography>
              <Grid container spacing={2}>
                <Grid size={{ xs: 12, sm: 4 }}>
                  <TextField
                    select
                    label="Bill On"
                    fullWidth
                    size="small"
                    value={billOn}
                    onChange={(e) => setBillOn(e.target.value)}
                  >
                    <MenuItem value="Patient Rate">Patient Rate</MenuItem>
                    <MenuItem value="Camp Rate">Camp Rate</MenuItem>
                    <MenuItem value="Corporate Rate">Corporate Rate</MenuItem>
                  </TextField>
                </Grid>
                <Grid size={{ xs: 12, sm: 4 }}>
                  <TextField
                    label="Mobile No"
                    fullWidth
                    size="small"
                    value={mobileNo}
                    onChange={handleMobileNoChange}
                    placeholder="Enter 10 digit number"
                    InputProps={{
                      endAdornment: isLookingUpMobile ? (
                        <CircularProgress size={20} color="inherit" />
                      ) : null
                    }}
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 4 }}>
                  <TextField
                    label="Lab ID / Reg No"
                    fullWidth
                    size="small"
                    disabled
                    value="Auto Generated"
                  />
                </Grid>

                <Grid size={{ xs: 12, sm: 2 }}>
                  <TextField
                    select
                    label="Title"
                    fullWidth
                    size="small"
                    value={title}
                    onChange={(e) => handleTitleChange(e.target.value)}
                  >
                    <MenuItem value="Mr.">Mr.</MenuItem>
                    <MenuItem value="Mrs.">Mrs.</MenuItem>
                    <MenuItem value="Ms.">Ms.</MenuItem>
                    <MenuItem value="Miss.">Miss.</MenuItem>
                    <MenuItem value="Mast.">Mast.</MenuItem>
                    <MenuItem value="Dr.">Dr.</MenuItem>
                    <MenuItem value="Baby (F)">Baby (F)</MenuItem>
                    <MenuItem value="Baba (M)">Baba (M)</MenuItem>
                    <MenuItem value="Md.">Md.</MenuItem>
                    <MenuItem value="Sister">Sister</MenuItem>
                    <MenuItem value="S/O">S/O</MenuItem>
                    <MenuItem value="D/O">D/O</MenuItem>
                    <MenuItem value="W/O">W/O</MenuItem>
                  </TextField>
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    label="Patient Name"
                    fullWidth
                    size="small"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 4 }}>
                  <TextField
                    select
                    label="City"
                    fullWidth
                    size="small"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                  >
                    <MenuItem value="-NA-">-NA-</MenuItem>
                    <MenuItem value="Delhi">Delhi</MenuItem>
                    <MenuItem value="Noida">Noida</MenuItem>
                    <MenuItem value="Gurgaon">Gurgaon</MenuItem>
                    <MenuItem value="Ghaziabad">Ghaziabad</MenuItem>
                  </TextField>
                </Grid>

                <Grid size={{ xs: 12, sm: 4 }}>
                  <Box sx={{ display: "flex", gap: 1 }}>
                    <TextField
                      label="Age"
                      fullWidth
                      size="small"
                      type="number"
                      value={age}
                      onChange={(e) => setAge(e.target.value)}
                      required
                    />
                    <TextField
                      select
                      size="small"
                      value={ageUnit}
                      onChange={(e) => setAgeUnit(e.target.value)}
                      sx={{ minWidth: 90 }}
                    >
                      <MenuItem value="Year">Year</MenuItem>
                      <MenuItem value="Month">Month</MenuItem>
                      <MenuItem value="Day">Day</MenuItem>
                    </TextField>
                  </Box>
                </Grid>
                <Grid size={{ xs: 12, sm: 4 }}>
                  <TextField
                    select
                    label="Gender"
                    fullWidth
                    size="small"
                    value={gender}
                    onChange={(e) => setGender(e.target.value)}
                  >
                    <MenuItem value="Male">Male</MenuItem>
                    <MenuItem value="Female">Female</MenuItem>
                    <MenuItem value="Other">Other</MenuItem>
                  </TextField>
                </Grid>
                <Grid size={{ xs: 12, sm: 4 }}>
                  <TextField
                    label="Date"
                    type="date"
                    fullWidth
                    size="small"
                    value={regDate}
                    onChange={(e) => setRegDate(e.target.value)}
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>

                <Grid size={{ xs: 12, sm: 6 }}>
                  <Autocomplete
                    options={doctors}
                    filterOptions={(options, params) => {
                      const filtered = filter(options, params);
                      const { inputValue } = params;

                      const isExisting = options.some(
                        (option) => inputValue.toLowerCase().trim() === option.name.toLowerCase().trim()
                      );
                      if (inputValue !== "" && !isExisting) {
                        filtered.push({
                          inputValue,
                          name: `+ Add "${inputValue}" as Ref Doctor`,
                          isNew: true,
                        });
                      }

                      return filtered;
                    }}
                    selectOnFocus
                    clearOnBlur
                    handleHomeEndKeys
                    getOptionLabel={(option) => {
                      if (typeof option === "string") {
                        return option;
                      }
                      if (option.inputValue) {
                        return option.inputValue;
                      }
                      return `${option.name} (${option.code || "N/A"})`;
                    }}
                    renderOption={(props, option) => {
                      const { key, ...restProps } = props;
                      return (
                        <li key={key || (option.isNew ? "new-opt" : option.id)} {...restProps}>
                          {option.name}
                        </li>
                      );
                    }}
                    value={refBy}
                    onChange={(event, newValue) => {
                      if (newValue && newValue.isNew) {
                        setNewDocName(newValue.inputValue);
                        setNewDocCode("");
                        setAddDocTarget("refBy");
                        setOpenAddDocDialog(true);
                      } else {
                        setRefBy(newValue);
                      }
                    }}
                    renderInput={(params) => (
                      <TextField {...params} label="Ref By Doctor" size="small" placeholder="Select..." />
                    )}
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Autocomplete
                    options={doctors}
                    filterOptions={(options, params) => {
                      const filtered = filter(options, params);
                      const { inputValue } = params;

                      const isExisting = options.some(
                        (option) => inputValue.toLowerCase().trim() === option.name.toLowerCase().trim()
                      );
                      if (inputValue !== "" && !isExisting) {
                        filtered.push({
                          inputValue,
                          name: `+ Add "${inputValue}" as Ref Doctor`,
                          isNew: true,
                        });
                      }

                      return filtered;
                    }}
                    selectOnFocus
                    clearOnBlur
                    handleHomeEndKeys
                    getOptionLabel={(option) => {
                      if (typeof option === "string") {
                        return option;
                      }
                      if (option.inputValue) {
                        return option.inputValue;
                      }
                      return `${option.name} (${option.code || "N/A"})`;
                    }}
                    renderOption={(props, option) => {
                      const { key, ...restProps } = props;
                      return (
                        <li key={key || (option.isNew ? "new-opt-second" : option.id)} {...restProps}>
                          {option.name}
                        </li>
                      );
                    }}
                    value={secondRef}
                    onChange={(event, newValue) => {
                      if (newValue && newValue.isNew) {
                        setNewDocName(newValue.inputValue);
                        setNewDocCode("");
                        setAddDocTarget("secondRef");
                        setOpenAddDocDialog(true);
                      } else {
                        setSecondRef(newValue);
                      }
                    }}
                    renderInput={(params) => (
                      <TextField {...params} label="2nd Ref Doctor" size="small" placeholder="Select..." />
                    )}
                  />
                </Grid>

                <Grid size={{ xs: 12 }}>
                  <TextField
                    label="Remarks"
                    fullWidth
                    size="small"
                    value={remark}
                    onChange={(e) => setRemark(e.target.value)}
                    placeholder="Any patient remarks or health details..."
                  />
                </Grid>
              </Grid>
            </CardContent>
          </Card>

          {/* Test Addition Section */}
          <Card variant="outlined">
            <CardContent>
              <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2, color: "primary.main" }}>
                Test Selection
              </Typography>
              <Autocomplete
                options={tests}
                getOptionLabel={(option) => {
                  if (typeof option === "string") {
                    return option;
                  }
                  if (option.inputValue) {
                    return option.inputValue;
                  }
                  return `${option.name} (${option.code || "N/A"}) - ₹${option.price}`;
                }}
                filterOptions={(options, params) => {
                  const filtered = filter(options, params);
                  const { inputValue } = params;

                  const isExisting = options.some(
                    (option) => inputValue.toLowerCase().trim() === option.name.toLowerCase().trim()
                  );
                  if (inputValue !== "" && !isExisting) {
                    filtered.push({
                      inputValue,
                      name: `+ Add "${inputValue}" as New Test`,
                      isNew: true,
                    });
                  }

                  return filtered;
                }}
                selectOnFocus
                clearOnBlur
                handleHomeEndKeys
                inputValue={testSearchInput}
                onInputChange={(event, newInputValue) => setTestSearchInput(newInputValue)}
                onChange={(event, newValue) => {
                  if (newValue && newValue.isNew) {
                    setNewTestName(newValue.inputValue);
                    setNewTestCode("");
                    setNewTestPrice("");
                    setOpenAddTestDialog(true);
                  } else if (newValue) {
                    handleAddTest(newValue);
                    setTestSearchInput(""); // reset input
                  }
                }}
                renderOption={(props, option) => {
                  const { key, ...restProps } = props;
                  if (option.isNew) {
                    return (
                      <li key={key || "new-test-opt"} {...restProps} style={{ fontWeight: 700, color: "#1a73e8" }}>
                        {option.name}
                      </li>
                    );
                  }

                  return (
                    <li key={key || option.id} {...restProps} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%" }}>
                      <span>
                        {option.name} ({option.code || "N/A"}) - ₹{Number(option.price).toFixed(2)}
                      </span>
                      <IconButton
                        size="small"
                        color="primary"
                        onClick={(e) => {
                          e.stopPropagation(); // prevent selecting the row
                          handleOpenEditTest(option);
                        }}
                      >
                        <EditIcon fontSize="small" />
                      </IconButton>
                    </li>
                  );
                }}
                renderInput={(params) => (
                  <TextField {...params} label="Search & Add Test" size="small" placeholder="Select to add..." />
                )}
                sx={{ mb: 3 }}
              />

              <TableContainer component={Paper} variant="outlined">
                <Table size="small">
                  <TableHead sx={{ bgcolor: "grey.100" }}>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 700 }}>SNO</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Test Code</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Test Name</TableCell>
                      <TableCell sx={{ fontWeight: 700 }} align="right">Price (₹)</TableCell>
                      <TableCell sx={{ fontWeight: 700 }} align="center">Action</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {selectedTests.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} align="center" sx={{ py: 3, color: "text.secondary" }}>
                          No tests selected. Use search bar above to add tests.
                        </TableCell>
                      </TableRow>
                    ) : (
                      selectedTests.map((t, idx) => (
                        <TableRow key={t.id}>
                          <TableCell>{idx + 1}</TableCell>
                          <TableCell>{t.code}</TableCell>
                          <TableCell sx={{ fontWeight: 500 }}>{t.name}</TableCell>
                          <TableCell align="right">₹{t.price.toFixed(2)}</TableCell>
                          <TableCell align="center">
                            <IconButton color="error" size="small" onClick={() => handleRemoveTest(t.id)}>
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* Right Form Panel: Billing & Collection Info */}
        <Grid size={{ xs: 12, md: 4 }}>
          <Card variant="outlined" sx={{ height: "100%", display: "flex", flexDirection: "column" }}>
            <CardContent sx={{ flexGrow: 1 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2, color: "primary.main" }}>
                Collection & Billing
              </Typography>
              <Grid container spacing={2}>
                <Grid size={{ xs: 12 }}>
                  <TextField
                    select
                    label="Collection Type"
                    fullWidth
                    size="small"
                    value={colType}
                    onChange={(e) => setColType(e.target.value)}
                  >
                    <MenuItem value="Camp">Camp</MenuItem>
                    <MenuItem value="Lab">Lab</MenuItem>
                    <MenuItem value="Home Collection">Home Collection</MenuItem>
                  </TextField>
                </Grid>
                <Grid size={{ xs: 12 }}>
                  <TextField
                    label="Expected Report Date"
                    type="datetime-local"
                    fullWidth
                    size="small"
                    value={expRptDate}
                    onChange={(e) => setExpRptDate(e.target.value)}
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>
                <Grid size={{ xs: 12 }}>
                  <TextField
                    label="Sample Date"
                    type="datetime-local"
                    fullWidth
                    size="small"
                    value={sampleDate}
                    onChange={(e) => setSampleDate(e.target.value)}
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>
                <Grid size={{ xs: 12 }}>
                  <TextField
                    label="Sample No"
                    fullWidth
                    size="small"
                    value={sampleNo}
                    onChange={(e) => setSampleNo(e.target.value)}
                  />
                </Grid>
                <Grid size={{ xs: 12 }}>
                  <TextField
                    select
                    label="Sample By"
                    fullWidth
                    size="small"
                    value={sampleBy}
                    onChange={(e) => setSampleBy(e.target.value)}
                  >
                    <MenuItem value="-NA-">-NA-</MenuItem>
                    <MenuItem value="Self">Self</MenuItem>
                    <MenuItem value="Lab Tech 1">Lab Tech 1</MenuItem>
                    <MenuItem value="Lab Tech 2">Lab Tech 2</MenuItem>
                  </TextField>
                </Grid>

                <Grid size={{ xs: 12 }}>
                  <Divider sx={{ my: 1 }} />
                </Grid>

                <Grid size={{ xs: 6 }}>
                  <TextField
                    select
                    label="Payment Mode"
                    fullWidth
                    size="small"
                    value={paymentMode}
                    onChange={(e) => setPaymentMode(e.target.value)}
                  >
                    <MenuItem value="Cash">Cash</MenuItem>
                    <MenuItem value="Card">Card</MenuItem>
                    <MenuItem value="UPI">UPI</MenuItem>
                    <MenuItem value="Net Banking">Net Banking</MenuItem>
                  </TextField>
                </Grid>
                <Grid size={{ xs: 6 }}>
                  <TextField
                    label="Payment Ref.No"
                    fullWidth
                    size="small"
                    value={paymentRefNo}
                    onChange={(e) => setPaymentRefNo(e.target.value)}
                    placeholder="Txn ID"
                  />
                </Grid>

                <Grid size={{ xs: 12 }}>
                  <TextField
                    label="Total Tests Amount"
                    fullWidth
                    size="small"
                    type="number"
                    value={totalTestsAmount}
                    disabled
                  />
                </Grid>
                <Grid size={{ xs: 12 }}>
                  <TextField
                    label="Collection Charge"
                    fullWidth
                    size="small"
                    type="number"
                    value={collectionCharge}
                    onChange={(e) => setCollectionCharge(Number(e.target.value) || 0)}
                  />
                </Grid>

                <Grid size={{ xs: 6 }}>
                  <TextField
                    label="Discount %"
                    fullWidth
                    size="small"
                    type="number"
                    value={discountPercent}
                    onChange={(e) => handleDiscountPercentChange(e.target.value)}
                  />
                </Grid>
                <Grid size={{ xs: 6 }}>
                  <TextField
                    label="Discount ₹"
                    fullWidth
                    size="small"
                    type="number"
                    value={discountAmount}
                    onChange={(e) => handleDiscountAmountChange(e.target.value)}
                  />
                </Grid>

                <Grid size={{ xs: 12 }}>
                  <TextField
                    label="Net Bill Amount"
                    fullWidth
                    size="small"
                    type="number"
                    value={totalBillAmount - discountAmount}
                    disabled
                  />
                </Grid>

                <Grid size={{ xs: 12 }}>
                  <TextField
                    label="Received Amount"
                    fullWidth
                    size="small"
                    type="number"
                    value={receivedAmount}
                    onChange={(e) => setReceivedAmount(Number(e.target.value) || 0)}
                  />
                </Grid>

                <Grid size={{ xs: 6 }}>
                  <TextField
                    label="Due Amount"
                    fullWidth
                    size="small"
                    type="number"
                    value={calculatedDue}
                    disabled
                    InputProps={{
                      style: {
                        color: calculatedDue > 0 ? "#dc2626" : "#16a34a",
                        fontWeight: 700
                      }
                    }}
                  />
                </Grid>
                <Grid size={{ xs: 6 }}>
                  <TextField
                    label="Sticker Count"
                    fullWidth
                    size="small"
                    type="number"
                    value={stickerCount}
                    onChange={(e) => setStickerCount(Number(e.target.value) || 1)}
                  />
                </Grid>
              </Grid>
            </CardContent>

            <Divider />

            {/* Save / Reset Footer */}
            <Box sx={{ p: 2, display: "flex", flexWrap: "wrap", gap: 1.5 }}>
              <Tooltip title={!canWrite ? "You do not have permission to save registrations" : ""} style={{ width: "100%" }}>
                <span>
                  <Button
                    variant="contained"
                    color="primary"
                    fullWidth
                    startIcon={submitting ? <CircularProgress size={20} color="inherit" /> : <SaveIcon />}
                    disabled={submitting || !canWrite}
                    onClick={handleSave}
                  >
                    Save (F10)
                  </Button>
                </span>
              </Tooltip>
              <Box sx={{ display: "flex", width: "100%", gap: 1 }}>
                <Tooltip title={!canWrite ? "You do not have permission to reset the form" : ""} style={{ width: "100%" }}>
                  <span>
                    <Button
                      variant="outlined"
                      color="secondary"
                      fullWidth
                      startIcon={<RefreshIcon />}
                      onClick={handleReset}
                      disabled={!canWrite}
                    >
                      Clear Form
                    </Button>
                  </span>
                </Tooltip>
              </Box>
            </Box>
          </Card>
        </Grid>
      </Grid>

      {/* Snackbar notification */}
      <Snackbar
        open={notification.open}
        autoHideDuration={6000}
        onClose={handleCloseNotification}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
      >
        <Alert onClose={handleCloseNotification} severity={notification.severity} variant="filled">
          {notification.message}
        </Alert>
      </Snackbar>

      {/* Dialog for adding a new doctor */}
      <Dialog open={openAddDocDialog} onClose={() => setOpenAddDocDialog(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 800 }}>Add New Doctor</DialogTitle>
        <DialogContent>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 1 }}>
            <TextField
              label="Doctor Name"
              fullWidth
              size="small"
              value={newDocName}
              onChange={(e) => setNewDocName(e.target.value)}
              required
            />
            <TextField
              label="Doctor Code (Optional)"
              fullWidth
              size="small"
              value={newDocCode}
              onChange={(e) => setNewDocCode(e.target.value)}
              placeholder="Will be auto-generated if left empty"
            />
            <TextField
              label="Doctor Degree / Qualification (Optional)"
              fullWidth
              size="small"
              value={newDocDegree}
              onChange={(e) => setNewDocDegree(e.target.value)}
              placeholder="e.g. MBBS, MD"
            />
            <TextField
              label="Clinic Name (Optional)"
              fullWidth
              size="small"
              value={newDocClinicName}
              onChange={(e) => setNewDocClinicName(e.target.value)}
              placeholder="e.g. City Care Center"
            />
            <TextField
              label="Address (Optional)"
              fullWidth
              size="small"
              value={newDocAddress}
              onChange={(e) => setNewDocAddress(e.target.value)}
              placeholder="e.g. 123 Main St, Delhi"
            />
            <TextField
              label="Incentive (%)"
              fullWidth
              size="small"
              type="number"
              value={newDocIncentive}
              onChange={(e) => setNewDocIncentive(e.target.value)}
              placeholder="e.g. 50"
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setOpenAddDocDialog(false)} color="inherit" disabled={isAddingDoc}>
            Cancel
          </Button>
          <Tooltip title={!canWrite ? "You do not have permission to add doctors" : ""}>
            <span>
              <Button
                onClick={handleAddDoctorSave}
                variant="contained"
                disabled={isAddingDoc || !newDocName.trim() || !canWrite}
              >
                {isAddingDoc ? <CircularProgress size={24} /> : "Add & Select"}
              </Button>
            </span>
          </Tooltip>
        </DialogActions>
      </Dialog>

      {/* Dialog for adding a new test on the fly */}
      <Dialog open={openAddTestDialog} onClose={() => setOpenAddTestDialog(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 800 }}>Add New Test</DialogTitle>
        <DialogContent>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 1 }}>
            <TextField
              label="Test Name"
              fullWidth
              size="small"
              value={newTestName}
              onChange={(e) => setNewTestName(e.target.value)}
              required
            />
            <TextField
              label="Test Code (Optional)"
              fullWidth
              size="small"
              value={newTestCode}
              onChange={(e) => setNewTestCode(e.target.value)}
              placeholder="Will be auto-generated if left empty"
            />
            <TextField
              label="Test Price (₹)"
              type="number"
              fullWidth
              size="small"
              value={newTestPrice}
              onChange={(e) => setNewTestPrice(e.target.value)}
              required
              InputProps={{ inputProps: { min: 0, step: "0.01" } }}
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setOpenAddTestDialog(false)} color="inherit" disabled={isSavingTest}>
            Cancel
          </Button>
          <Button
            onClick={handleCreateTest}
            variant="contained"
            disabled={isSavingTest || !newTestName.trim() || !newTestPrice}
          >
            {isSavingTest ? <CircularProgress size={24} /> : "Add & Select"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog for editing an existing test */}
      <Dialog open={openEditTestDialog} onClose={() => setOpenEditTestDialog(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 800 }}>Edit Test Details</DialogTitle>
        <DialogContent>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 1 }}>
            <TextField
              label="Test Name"
              fullWidth
              size="small"
              value={editingTestName}
              onChange={(e) => setEditingTestName(e.target.value)}
              required
            />
            {editingTest && (
              <Typography variant="body2" sx={{ fontWeight: 500, color: "text.secondary" }}>
                Test Code: <strong>{editingTest.code || "N/A"}</strong>
              </Typography>
            )}
            <TextField
              label="Custom Workspace Price (₹)"
              type="number"
              fullWidth
              size="small"
              value={editingTestPrice}
              onChange={(e) => setEditingTestPrice(e.target.value)}
              required
              InputProps={{ inputProps: { min: 0, step: "0.01" } }}
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setOpenEditTestDialog(false)} color="inherit" disabled={isSavingTest}>
            Cancel
          </Button>
          <Button
            onClick={handleUpdateTest}
            variant="contained"
            disabled={isSavingTest || !editingTestPrice || !editingTestName.trim()}
          >
            {isSavingTest ? <CircularProgress size={24} /> : "Save Changes"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Patient lookup dropdown menu */}
      <Menu
        anchorEl={mobileAnchorEl}
        open={Boolean(mobileAnchorEl) && matchingPatients.length > 0}
        onClose={() => setMobileAnchorEl(null)}
        slotProps={{
          paper: {
            style: {
              maxHeight: 300,
              width: mobileAnchorEl ? mobileAnchorEl.clientWidth : "auto",
            },
          },
        }}
      >
        <MenuItem disabled sx={{ fontWeight: 800, fontSize: "0.75rem", textTransform: "uppercase", color: "text.secondary" }}>
          Select Patient Profile
        </MenuItem>
        {matchingPatients.map((p, idx) => (
          <MenuItem
            key={`${p.name}-${idx}`}
            onClick={() => {
              handlePrefillPatient(p);
              setMobileAnchorEl(null);
            }}
            sx={{ py: 1 }}
          >
            <Box>
              <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                {p.title} {p.name}
              </Typography>
              <Typography variant="caption" sx={{ color: "text.secondary" }}>
                {p.gender}, {p.age} {p.ageUnit} {p.city && p.city !== "-NA-" ? `| ${p.city}` : ""}
              </Typography>
            </Box>
          </MenuItem>
        ))}
        <Divider />
        <MenuItem onClick={() => setMobileAnchorEl(null)} sx={{ color: "primary.main", fontWeight: 600, py: 1 }}>
          + Register New Patient
        </MenuItem>
      </Menu>
    </Box>
  );
}
