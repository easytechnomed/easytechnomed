"use client";

import React from "react";
import {
    Box,
    Container,
    Typography,
    Grid,
    Card,
    CardContent,
    TextField,
    Button,
    InputAdornment,
    CircularProgress,
    Chip
} from "@mui/material";
import {
    SupportAgent as SupportIcon,
    PhoneAndroid as PhoneIcon,
    ArrowForward as ArrowForwardIcon
} from "@mui/icons-material";
import EmailOutlinedIcon from "@mui/icons-material/EmailOutlined";

export default function Contact({
    contactInput,
    setContactInput,
    inputType,
    loading,
    handleLeadSubmit
}) {
    return (
        <Box
            id="contact"
            sx={{
                py: { xs: 8, md: 12 },
                bgcolor: "background.default",
                borderTop: "1px solid rgba(15, 118, 110, 0.05)"
            }}
        >
            <Container maxWidth="md">
                <Card
                    variant="outlined"
                    sx={{
                        border: "1px solid rgba(15, 118, 110, 0.12)",
                        bgcolor: "rgba(255, 255, 255, 0.8)",
                        backdropFilter: "blur(8px)",
                        borderRadius: "20px",
                        p: { xs: 1, sm: 3, md: 4 }
                    }}
                >

                    <CardContent>
                        <Grid container spacing={4} sx={{ alignItems: "center" }}>
                            {/* Support Agent Icon Column */}
                            <Grid size={{ xs: 12, md: 4 }} sx={{ display: "flex", justifyContent: "center" }}>
                                <Box
                                    sx={{
                                        p: 3,
                                        borderRadius: "50%",
                                        bgcolor: "rgba(20, 184, 166, 0.08)",
                                        color: "primary.main",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center"
                                    }}
                                >
                                    <SupportIcon sx={{ fontSize: { xs: 56, md: 64 } }} />
                                </Box>
                            </Grid>

                            {/* Contact Form Column */}
                            <Grid size={{ xs: 12, md: 8 }}>
                                <Chip
                                    label="GET IN TOUCH"
                                    color="primary"
                                    size="small"
                                    sx={{ fontWeight: 700, mb: 1.5, bgcolor: "primary.main", borderRadius: "9999px" }}
                                />
                                <Typography
                                    variant="h3"
                                    sx={{
                                        fontSize: { xs: "1.5rem", sm: "1.8rem" },
                                        fontWeight: 800,
                                        mb: 2,
                                        color: "text.primary"
                                    }}
                                >
                                    Contact Us & Support
                                </Typography>
                                    <Typography
                                    variant="body1"
                                    color="text.secondary"
                                    sx={{ mb: 3.5, lineHeight: 1.6, fontSize: { xs: "0.9rem", sm: "0.95rem" } }}
                                >
                                    Enter your email address or mobile number below to claim your 5-day free trial or to ask any questions. Our team will get in touch with you shortly.
                                </Typography>

                                {/* Contact Lead Capture Form */}
                                <Box
                                    component="form"
                                    onSubmit={handleLeadSubmit}
                                    sx={{
                                        p: 0.75,
                                        borderRadius: "12px",
                                        bgcolor: "#ffffff",
                                        boxShadow: "0 4px 20px rgba(15, 118, 110, 0.05)",
                                        border: "1px solid rgba(15, 118, 110, 0.12)",
                                        display: "flex",
                                        flexDirection: { xs: "column", sm: "row" },
                                        gap: 1,
                                        mb: 3
                                    }}
                                >
                                    <TextField
                                        fullWidth
                                        variant="standard"
                                        placeholder="Enter mobile number or email"
                                        value={contactInput}
                                        onChange={(e) => setContactInput(e.target.value)}
                                        slotProps={{
                                            input: {
                                                disableUnderline: true,
                                                startAdornment: (
                                                    <InputAdornment position="start" sx={{ pl: 1.5, pr: 0.5 }}>
                                                        {inputType === "mobile" ? (
                                                            <PhoneIcon sx={{ color: "primary.main" }} />
                                                        ) : (
                                                            <EmailOutlinedIcon sx={{ color: "primary.main" }} />
                                                        )}
                                                    </InputAdornment>
                                                ),
                                            }
                                        }}
                                        sx={{
                                            justifyContent: "center",
                                            "& .MuiInputBase-input": {
                                                py: 1,
                                                fontSize: "0.95rem",
                                                fontWeight: 500
                                            }
                                        }}
                                    />
                                    <Button
                                        type="submit"
                                        variant="contained"
                                        color="primary"
                                        disabled={loading}
                                        sx={{
                                            py: { xs: 1.5, sm: 1 },
                                            px: 3,
                                            whiteSpace: "nowrap",
                                            borderRadius: "8px",
                                            fontWeight: 700,
                                            textTransform: "none",
                                            boxShadow: "0 2px 8px rgba(15, 118, 110, 0.15)"
                                        }}
                                    >
                                        {loading ? (
                                            <CircularProgress size={20} color="inherit" />
                                        ) : (
                                            "Claim Free Trial"
                                        )}
                                    </Button>
                                </Box>

                                {/* WhatsApp Instant Chat */}
                                <Box sx={{ display: "flex", flexDirection: { xs: "column", sm: "row" }, alignItems: { xs: "stretch", sm: "center" }, gap: 2 }}>
                                    <Button
                                        variant="contained"
                                        component="a"
                                        href="https://wa.me/911234567890" // Placeholder phone link
                                        target="_blank"
                                        sx={{
                                            bgcolor: "#25d366", // WhatsApp Green
                                            color: "#fff",
                                            fontWeight: 700,
                                            py: 1.25,
                                            px: 3,
                                            borderRadius: "24px",
                                            textTransform: "none",
                                            boxShadow: "0 8px 16px rgba(37, 211, 102, 0.2)",
                                            "&:hover": { bgcolor: "#128c7e" }
                                        }}
                                    >
                                        Chat with support on WhatsApp
                                    </Button>
                                    <Typography variant="caption" color="text.secondary" sx={{ textAlign: { xs: "center", sm: "left" } }}>
                                        Or connect instantly with our team for 10-minute setup help.
                                    </Typography>
                                </Box>
                            </Grid>
                        </Grid>
                    </CardContent>
                </Card>
            </Container>
        </Box>
    );
}
