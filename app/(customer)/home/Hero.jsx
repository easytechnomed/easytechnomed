"use client";

import React from "react";
import {
    Box,
    Container,
    Typography,
    Button,
    Grid,
    TextField,
    InputAdornment,
    CircularProgress,
    Card
} from "@mui/material";
import {
    PhoneAndroid as PhoneIcon,
    Email as EmailIcon,
    ArrowForward as ArrowForwardIcon,
    CheckCircle as CheckCircleIcon
} from "@mui/icons-material";

export default function Hero({
    contactInput,
    setContactInput,
    inputType,
    loading,
    leadSuccess,
    setLeadSuccess,
    handleLeadSubmit,
    router
}) {
    return (
        <Box
            sx={{
                minHeight: { xs: "auto", md: "calc(100dvh - 72px)" },
                mt: "72px",
                display: "flex",
                alignItems: "center",
                bgcolor: "#FFFFFF",
                position: "relative",
                overflow: "hidden",
                py: { xs: 5, sm: 7, md: 8 }
            }}
        >
            {/* Flat Poster Geometric Decorative Shapes */}
            <Box
                sx={{
                    position: "absolute",
                    top: "-80px",
                    right: "-80px",
                    width: "320px",
                    height: "320px",
                    borderRadius: "50%",
                    bgcolor: "rgba(15, 118, 110, 0.08)",
                    pointerEvents: "none"
                }}
            />
            <Box
                sx={{
                    position: "absolute",
                    bottom: "-60px",
                    left: "20%",
                    width: "180px",
                    height: "180px",
                    transform: "rotate(45deg)",
                    bgcolor: "rgba(243, 244, 246, 0.9)",
                    pointerEvents: "none"
                }}
            />

            <Container maxWidth="xl" sx={{ position: "relative", zIndex: 1 }}>
                <Grid container spacing={{ xs: 5, md: 6, lg: 8 }} alignItems="center">

                    {/* Left Column: Bold Flat Typography & Inputs */}
                    <Grid size={{ xs: 12, md: 6, lg: 6 }}>
                        <Box sx={{ display: "flex", flexDirection: "column", gap: { xs: 2.5, md: 3 } }}>

                            {/* Flat Section Badge */}
                            <Box
                                sx={{
                                    alignSelf: "flex-start",
                                    display: "inline-flex",
                                    alignItems: "center",
                                    gap: 1,
                                    px: 2,
                                    py: 0.6,
                                    borderRadius: "6px",
                                    bgcolor: "rgba(15, 118, 110, 0.12)",
                                    border: "2px solid #0f766e",
                                }}
                            >
                                <Box
                                    sx={{
                                        width: 8,
                                        height: 8,
                                        borderRadius: "50%",
                                        bgcolor: "#0f766e"
                                    }}
                                />
                                <Typography
                                    variant="caption"
                                    sx={{
                                        fontWeight: 800,
                                        color: "#111827",
                                        letterSpacing: "0.04em",
                                        textTransform: "uppercase",
                                        fontSize: "0.75rem"
                                    }}
                                >
                                    Cloud Diagnostic LIMS
                                </Typography>
                            </Box>

                            {/* Main Headline */}
                            <Typography
                                variant="h1"
                                sx={{
                                    fontSize: { xs: "2.3rem", sm: "3.2rem", md: "3.6rem", lg: "4.2rem" },
                                    fontWeight: 800,
                                    color: "#111827",
                                    lineHeight: { xs: 1.15, md: 1.1 },
                                    letterSpacing: "-0.025em"
                                }}
                            >
                                Pathology Lab Software. <br />
                                <Box component="span" sx={{ color: "#0f766e" }}>
                                    Simple & Fast.
                                </Box>
                            </Typography>

                            {/* Subheadline */}
                            <Typography
                                variant="body1"
                                sx={{
                                    fontSize: { xs: "1rem", md: "1.15rem" },
                                    color: "#4B5563",
                                    fontWeight: 500,
                                    lineHeight: 1.6,
                                    maxWidth: "520px"
                                }}
                            >
                                Create, print and send patient test reports on WhatsApp in 2 minutes. Simple for ground-level lab staff — no computer training needed.
                            </Typography>

                            {/* Flat Action & Form Box */}
                            <Box sx={{ maxWidth: "490px", display: "flex", flexDirection: "column", gap: 1.8 }}>
                                {leadSuccess ? (
                                    <Box
                                        sx={{
                                            p: 2.5,
                                            borderRadius: "8px",
                                            bgcolor: "rgba(16, 185, 129, 0.08)",
                                            border: "2px solid #10B981",
                                            display: "flex",
                                            flexDirection: "column",
                                            gap: 1.2,
                                        }}
                                    >
                                        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                                            <CheckCircleIcon sx={{ color: "#10B981", fontSize: 26 }} />
                                            <Box>
                                                <Typography sx={{ color: "#065F46", fontWeight: 800, fontSize: "1rem" }}>
                                                    Demo Request Received!
                                                </Typography>
                                                <Typography sx={{ color: "#047857", fontWeight: 600, fontSize: "0.88rem" }}>
                                                    Our team will contact you as soon as possible.
                                                </Typography>
                                            </Box>
                                        </Box>
                                        <Button
                                            size="small"
                                            onClick={() => setLeadSuccess(false)}
                                            sx={{
                                                alignSelf: "flex-start",
                                                color: "#047857",
                                                textDecoration: "underline",
                                                fontWeight: 700,
                                                fontSize: "0.78rem",
                                                p: 0,
                                                minWidth: "auto",
                                                "&:hover": { bgcolor: "transparent", textDecoration: "underline" }
                                            }}
                                        >
                                            Submit another contact
                                        </Button>
                                    </Box>
                                ) : (
                                    <Box
                                        component="form"
                                        onSubmit={handleLeadSubmit}
                                        sx={{
                                            p: 0.75,
                                            borderRadius: "8px",
                                            bgcolor: "#F3F4F6",
                                            border: "2px solid #E5E7EB",
                                            display: "flex",
                                            flexDirection: { xs: "column", sm: "row" },
                                            alignItems: "center",
                                            gap: 1,
                                            transition: "border-color 0.2s, background-color 0.2s",
                                            "&:focus-within": {
                                                borderColor: "#0f766e",
                                                bgcolor: "#FFFFFF"
                                            }
                                        }}
                                    >
                                        <TextField
                                            fullWidth
                                            variant="standard"
                                            placeholder="Mobile number or Email"
                                            value={contactInput}
                                            onChange={(e) => setContactInput(e.target.value)}
                                            slotProps={{
                                                input: {
                                                    disableUnderline: true,
                                                    startAdornment: (
                                                        <InputAdornment position="start" sx={{ pl: 1.5, pr: 0.5 }}>
                                                            {inputType === "mobile" ? (
                                                                <PhoneIcon sx={{ color: "#0f766e", fontSize: "1.3rem" }} />
                                                            ) : (
                                                                <EmailIcon sx={{ color: "#0f766e", fontSize: "1.3rem" }} />
                                                            )}
                                                        </InputAdornment>
                                                    ),
                                                }
                                            }}
                                            sx={{
                                                "& .MuiInputBase-input": {
                                                    py: 1.3,
                                                    fontSize: "0.98rem",
                                                    fontWeight: 600,
                                                    color: "#111827"
                                                }
                                            }}
                                        />
                                        <Button
                                            type="submit"
                                            variant="contained"
                                            disabled={loading}
                                            sx={{
                                                py: 1.4,
                                                px: 3.5,
                                                minWidth: { xs: "100%", sm: "165px" },
                                                width: { xs: "100%", sm: "auto" },
                                                fontWeight: 700,
                                                fontSize: "0.95rem",
                                                borderRadius: "8px",
                                                textTransform: "none",
                                                whiteSpace: "nowrap",
                                                bgcolor: "#0f766e",
                                                color: "#FFFFFF",
                                                boxShadow: "none !important",
                                                display: "inline-flex",
                                                alignItems: "center",
                                                justifyContent: "center",
                                                "&:hover": {
                                                    bgcolor: "#115e59",
                                                    boxShadow: "none !important",
                                                    transform: "scale(1.04)"
                                                }
                                            }}
                                        >
                                            {loading ? <CircularProgress size={22} color="inherit" /> : "Get Free Demo"}
                                        </Button>
                                    </Box>
                                )}

                                {/* Flat Outline Secondary Button */}
                                <Button
                                    variant="outlined"
                                    onClick={() => router.push("/auth/register")}
                                    endIcon={<ArrowForwardIcon sx={{ fontSize: "1.1rem" }} />}
                                    sx={{
                                        py: 1.3,
                                        width: "100%",
                                        fontWeight: 800,
                                        fontSize: "0.95rem",
                                        borderRadius: "8px",
                                        textTransform: "none",
                                        border: "3px solid #0f766e !important",
                                        color: "#0f766e",
                                        boxShadow: "none !important",
                                        transition: "all 0.2s ease-in-out",
                                        "&:hover": {
                                            bgcolor: "#0f766e",
                                            color: "#FFFFFF",
                                            borderColor: "#0f766e !important",
                                            boxShadow: "none !important",
                                            transform: "scale(1.03)"
                                        }
                                    }}
                                >
                                    Start 5-Day Free Trial
                                </Button>
                            </Box>

                            {/* Flat Feature Bullet Points */}
                            <Box sx={{ display: "flex", flexWrap: "wrap", gap: { xs: 2, sm: 3 }, pt: 0.5 }}>
                                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                                    <Box sx={{ width: 8, height: 8, borderRadius: "50%", bgcolor: "#10B981" }} />
                                    <Typography variant="body2" sx={{ fontWeight: 700, color: "#374151", fontSize: "0.9rem" }}>
                                        Instant Online Reports
                                    </Typography>
                                </Box>
                                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                                    <Box sx={{ width: 8, height: 8, borderRadius: "50%", bgcolor: "#0f766e" }} />
                                    <Typography variant="body2" sx={{ fontWeight: 700, color: "#374151", fontSize: "0.9rem" }}>
                                        Works on Mobile & PC
                                    </Typography>
                                </Box>
                                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                                    <Box sx={{ width: 8, height: 8, borderRadius: "50%", bgcolor: "#F59E0B" }} />
                                    <Typography variant="body2" sx={{ fontWeight: 700, color: "#374151", fontSize: "0.9rem" }}>
                                        5-Day Free Trial
                                    </Typography>
                                </Box>
                            </Box>
                        </Box>
                    </Grid>

                    {/* Right Column: Flat Window Preview Container */}
                    <Grid size={{ xs: 12, md: 6, lg: 6 }}>
                        <Card
                            elevation={0}
                            sx={{
                                border: "4px solid #E5E7EB",
                                borderRadius: "8px",
                                bgcolor: "#FFFFFF",
                                overflow: "hidden",
                                display: "flex",
                                flexDirection: "column"
                            }}
                        >
                            {/* Window Top Title Bar */}
                            <Box
                                sx={{
                                    bgcolor: "#F3F4F6",
                                    px: 2.5,
                                    py: 1.5,
                                    borderBottom: "3px solid #E5E7EB",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "space-between"
                                }}
                            >
                                <Box sx={{ display: "flex", gap: 1 }}>
                                    <Box sx={{ width: 12, height: 12, borderRadius: "50%", bgcolor: "#EF4444" }} />
                                    <Box sx={{ width: 12, height: 12, borderRadius: "50%", bgcolor: "#F59E0B" }} />
                                    <Box sx={{ width: 12, height: 12, borderRadius: "50%", bgcolor: "#10B981" }} />
                                </Box>
                                <Typography
                                    variant="caption"
                                    sx={{
                                        fontWeight: 800,
                                        color: "#4B5563",
                                        letterSpacing: "0.05em",
                                        fontSize: "0.75rem",
                                        textTransform: "uppercase"
                                    }}
                                >
                                    LIVE DEMO PREVIEW
                                </Typography>
                                <Box sx={{ width: 40 }} />
                            </Box>

                            {/* Image Preview Container */}
                            <Box
                                sx={{
                                    position: "relative",
                                    width: "100%",
                                    bgcolor: "#F9FAFB",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    p: { xs: 1.5, sm: 2 }
                                }}
                            >
                                <Box
                                    component="img"
                                    src="/landing/register patient.png"
                                    alt="Pathology Lab Dashboard Preview"
                                    sx={{
                                        width: "100%",
                                        height: "auto",
                                        maxHeight: { xs: 280, sm: 360, md: 420 },
                                        objectFit: "contain",
                                        borderRadius: "6px"
                                    }}
                                />
                            </Box>
                        </Card>
                    </Grid>
                </Grid>
            </Container>
        </Box>
    );
}
