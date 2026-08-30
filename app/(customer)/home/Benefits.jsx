"use client";

import React from "react";
import {
    Box,
    Container,
    Typography,
    Grid,
    Card,
    CardContent
} from "@mui/material";
import {
    Speed as SpeedIcon,
    CheckCircle as CheckCircleIcon,
    Security as SecurityIcon,
    CloudSync as CloudSyncIcon
} from "@mui/icons-material";

export default function Benefits() {
    const benefitsData = [
        {
            icon: <CloudSyncIcon sx={{ fontSize: 30, color: "#FFFFFF" }} />,
            iconBg: "#7c3aed",
            title: "Works Online & Offline (Beta)",
            description: "Never pause your lab operations. Register patients and create test reports even without internet, and all records automatically sync to the cloud once connected."
        },
        {
            icon: <SpeedIcon sx={{ fontSize: 30, color: "#FFFFFF" }} />,
            iconBg: "#0f766e",
            title: "Super Fast Report Delivery",
            description: "Instantly record patient details, enter values, and generate PDF lab reports. No lag, no system crashes. Deliver digital results to patients in real-time."
        },
        {
            icon: <CheckCircleIcon sx={{ fontSize: 30, color: "#FFFFFF" }} />,
            iconBg: "#10B981",
            title: "Zero Learning Curve UI",
            description: "A clean and intuitive layout that laboratory technicians can master within 5 minutes. Spend zero time on training, and more time processing medical samples."
        },
        {
            icon: <SecurityIcon sx={{ fontSize: 30, color: "#FFFFFF" }} />,
            iconBg: "#F59E0B",
            title: "Secure Cloud Platform",
            description: "Your diagnostic lab database is backed up continuously on secure endpoints. Control patient privacy and restrict user accesses with roles and permissions."
        }
    ];

    return (
        <Box
            id="benefits"
            sx={{
                scrollMarginTop: { xs: "72px", md: "80px" },
                py: { xs: 9, md: 14 },
                bgcolor: "#F3F4F6", // Solid Gray 100 Color Block Section
                position: "relative",
                overflow: "hidden"
            }}
        >
            {/* Flat Geometric Decorative Shapes */}
            <Box
                sx={{
                    position: "absolute",
                    top: "10%",
                    left: "-40px",
                    width: "120px",
                    height: "120px",
                    bgcolor: "rgba(15, 118, 110, 0.15)",
                    borderRadius: "50%",
                    pointerEvents: "none"
                }}
            />

            <Container maxWidth="xl" sx={{ position: "relative", zIndex: 1 }}>
                <Box sx={{ textAlign: "center", mb: { xs: 6, md: 9 }, maxWidth: 680, mx: "auto" }}>
                    {/* Flat Section Badge */}
                    <Box
                        sx={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 1.5,
                            px: 2.2,
                            py: 0.8,
                            borderRadius: "6px",
                            bgcolor: "#FFFFFF",
                            border: "2px solid #E5E7EB",
                            mb: 2.5
                        }}
                    >
                        <Box sx={{ width: 8, height: 8, borderRadius: "50%", bgcolor: "#0f766e" }} />
                        <Typography
                            sx={{
                                fontFamily: "var(--font-outfit), sans-serif",
                                fontSize: "0.8rem",
                                letterSpacing: "0.08em",
                                textTransform: "uppercase",
                                color: "#111827",
                                fontWeight: 800
                            }}
                        >
                            Why EasyTechnoMed
                        </Typography>
                    </Box>

                    <Typography
                        variant="h2"
                        sx={{
                            fontFamily: "var(--font-outfit), sans-serif",
                            fontSize: { xs: "2.2rem", sm: "2.75rem", md: "3.2rem" },
                            fontWeight: 800,
                            mb: 2,
                            color: "#111827",
                            letterSpacing: "-0.02em"
                        }}
                    >
                        Built for Speed. Loved by Pathology Labs.
                    </Typography>
                    <Typography
                        variant="body1"
                        sx={{
                            fontFamily: "var(--font-outfit), sans-serif",
                            color: "#4B5563",
                            fontSize: { xs: "1rem", md: "1.1rem" },
                            lineHeight: 1.6
                        }}
                    >
                        Designed by diagnostic experts to eliminate paperwork and accelerate report delivery.
                    </Typography>
                </Box>

                <Grid container spacing={3.5}>
                    {benefitsData.map((benefit, index) => (
                        <Grid key={index} size={{ xs: 12, sm: 6, lg: 3 }}>
                            <Card
                                elevation={0}
                                sx={{
                                    height: "100%",
                                    bgcolor: "#FFFFFF",
                                    border: "2px solid #E5E7EB",
                                    borderRadius: "8px",
                                    p: { xs: 3.5, md: 4.5 },
                                    boxShadow: "none !important",
                                    transition: "all 0.2s ease-in-out",
                                    "&:hover": {
                                        transform: "scale(1.03)",
                                        borderColor: "#0f766e"
                                    }
                                }}
                            >
                                <CardContent sx={{ p: 0, display: "flex", flexDirection: "column", gap: 2.5 }}>
                                    {/* Flat Solid Circle Icon Container */}
                                    <Box
                                        sx={{
                                            width: 56,
                                            height: 56,
                                            borderRadius: "50%",
                                            bgcolor: benefit.iconBg,
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "center",
                                            transition: "transform 0.2s",
                                            "&:hover": { transform: "scale(1.1)" }
                                        }}
                                    >
                                        {benefit.icon}
                                    </Box>
                                    <Typography
                                        variant="h5"
                                        sx={{
                                            fontWeight: 800,
                                            fontSize: { xs: "1.25rem", md: "1.35rem" },
                                            color: "#111827",
                                            letterSpacing: "-0.01em"
                                        }}
                                    >
                                        {benefit.title}
                                    </Typography>
                                    <Typography
                                        variant="body2"
                                        sx={{
                                            color: "#4B5563",
                                            lineHeight: 1.7,
                                            fontSize: "0.95rem"
                                        }}
                                    >
                                        {benefit.description}
                                    </Typography>
                                </CardContent>
                            </Card>
                        </Grid>
                    ))}
                </Grid>
            </Container>
        </Box>
    );
}
