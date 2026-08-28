"use client";

import React from "react";
import {
    Box,
    Container,
    Typography,
    Grid,
    Card
} from "@mui/material";
import { CheckCircle as CheckCircleIcon } from "@mui/icons-material";

export default function Features() {
    const featuresData = [
        {
            title: "Seamless Patient Registration",
            description: "Add patient profiles, record age/gender details, select bill modes, assign referring doctors, and capture barcode stickers dynamically. Everything on a single, easy-to-use form.",
            bullets: [
                "Real-time validation of patient inputs",
                "Custom stickers, barcodes & payment modes"
            ],
            image: "/landing/register patient.png",
            reverse: false
        },
        {
            title: "Smart Test Parameter Tracking",
            description: "Manage test tables with precise, customizable parameters. Search, filter, and track statuses of medical reports in a responsive table. Process and update findings instantly.",
            bullets: [
                "Customize parameters for male, female, or babies",
                "Quick search & print-to-PDF report generation"
            ],
            image: "/landing/test report table.png",
            reverse: true
        },
        {
            title: "Doctor Referral Summaries",
            description: "Track all doctor references, calculate referral percentages and incentives, and manage balances in a centralized portal. Accelerate B2B lab growth with transparent sharing tools.",
            bullets: [
                "Automated incentive calculations per reference",
                "Easy report summaries ready for billing review"
            ],
            image: "/landing/doctor referal.png",
            reverse: false
        }
    ];

    return (
        <Box id="features" sx={{ py: { xs: 9, md: 14 }, bgcolor: "#FFFFFF", borderTop: "2px solid #E5E7EB" }}>
            <Container maxWidth="xl">
                <Box sx={{ textAlign: "center", mb: { xs: 8, md: 12 }, maxWidth: 680, mx: "auto" }}>
                    {/* Flat Section Badge */}
                    <Box
                        sx={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 1.5,
                            px: 2.2,
                            py: 0.8,
                            borderRadius: "6px",
                            bgcolor: "rgba(15, 118, 110, 0.12)",
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
                                color: "#0f766e",
                                fontWeight: 800
                            }}
                        >
                            Comprehensive Suite
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
                        Built for Modern Diagnostic Workflows
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
                        Explore the powerful, intuitive tools built specifically for diagnostic lab efficiency.
                    </Typography>
                </Box>

                {featuresData.map((feature, index) => (
                    <Grid
                        key={index}
                        container
                        spacing={{ xs: 4, md: 8 }}
                        sx={{
                            alignItems: "center",
                            mb: index !== featuresData.length - 1 ? { xs: 8, md: 14 } : 0,
                        }}
                    >
                        {/* Text Content */}
                        <Grid
                            size={{ xs: 12, md: 6 }}
                            sx={{
                                order: { xs: 2, md: feature.reverse ? 2 : 1 }
                            }}
                        >
                            <Box sx={{ pl: { md: feature.reverse ? 4 : 0 }, pr: { md: feature.reverse ? 0 : 4 } }}>
                                <Typography
                                    variant="h3"
                                    sx={{
                                        fontFamily: "var(--font-outfit), sans-serif",
                                        fontSize: { xs: "1.75rem", sm: "2rem", md: "2.35rem" },
                                        fontWeight: 800,
                                        color: "#111827",
                                        mb: 2,
                                        letterSpacing: "-0.02em"
                                    }}
                                >
                                    {feature.title}
                                </Typography>
                                <Typography
                                    variant="body1"
                                    sx={{
                                        color: "#4B5563",
                                        mb: 3.5,
                                        lineHeight: 1.7,
                                        fontSize: { xs: "0.98rem", md: "1.05rem" }
                                    }}
                                >
                                    {feature.description}
                                </Typography>
                                <Box sx={{ display: "flex", flexDirection: "column", gap: 1.8 }}>
                                    {feature.bullets.map((bullet, idx) => (
                                        <Box key={idx} sx={{ display: "flex", gap: 1.5, alignItems: "flex-start" }}>
                                            <CheckCircleIcon sx={{ color: "#0f766e", fontSize: "1.35rem", mt: 0.2 }} />
                                            <Typography variant="body2" sx={{ fontWeight: 700, color: "#111827", fontSize: "0.98rem" }}>
                                                {bullet}
                                            </Typography>
                                        </Box>
                                    ))}
                                </Box>
                            </Box>
                        </Grid>

                        {/* Image Content */}
                        <Grid
                            size={{ xs: 12, md: 6 }}
                            sx={{
                                order: { xs: 1, md: feature.reverse ? 1 : 2 }
                            }}
                        >
                            <Card
                                elevation={0}
                                sx={{
                                    border: "3px solid #111827",
                                    borderRadius: "10px",
                                    overflow: "hidden",
                                    bgcolor: "#FFFFFF",
                                    boxShadow: "none !important",
                                    transition: "transform 0.2s ease-in-out",
                                    "&:hover": {
                                        transform: "scale(1.02)"
                                    }
                                }}
                            >
                                <Box
                                    component="img"
                                    src={feature.image}
                                    alt={feature.title}
                                    sx={{
                                        width: "100%",
                                        height: "auto",
                                        display: "block",
                                        maxHeight: { xs: 280, sm: 380 },
                                        objectFit: "cover"
                                    }}
                                />
                            </Card>
                        </Grid>
                    </Grid>
                ))}
            </Container>
        </Box>
    );
}
