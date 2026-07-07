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
            description: "Add patient profiles, record age/gender details, select bill modes, assign referring doctors, and capture barcode stickers dynamically. Everything you need on a single, easy-to-use form.",
            bullets: [
                "Real-time validation of patient inputs",
                "Custom stickers, barcodes & payment modes"
            ],
            image: "/landing/register patient.png",
            reverse: false
        },
        {
            title: "Smart Test Parameter Tracking",
            description: "Manage test tables with precise, customizable parameters. Search, filter, and track statuses of medical reports in a responsive table. Process and update patient findings instantly.",
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
        <Box id="features" sx={{ py: { xs: 8, md: 12 }, bgcolor: "background.default" }}>
            <Container maxWidth="xl">
                <Box sx={{ textAlign: "center", mb: { xs: 8, md: 10 }, maxWidth: 640, mx: "auto" }}>
                    <Typography
                        variant="h2"
                        sx={{
                            fontSize: { xs: "1.75rem", sm: "2.25rem", md: "2.5rem" },
                            fontWeight: 800,
                            mb: 2,
                            color: "text.primary"
                        }}
                    >
                        Comprehensive Laboratory Suite
                    </Typography>
                    <Typography variant="body1" color="text.secondary" sx={{ fontSize: { xs: "0.95rem", md: "1.05rem" } }}>
                        Explore the powerful tools built directly into our platform designed for diagnostic efficiency.
                    </Typography>
                </Box>

                {featuresData.map((feature, index) => (
                    <Grid
                        key={index}
                        container
                        spacing={{ xs: 4, md: 8 }}
                        sx={{
                            alignItems: "center",
                            mb: index !== featuresData.length - 1 ? { xs: 8, md: 12 } : 0,
                            // Alternating order: text first/image second on reverse:false, image first/text second on reverse:true
                            // On mobile, we always stack: image on top (order 1), text at the bottom (order 2)
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
                                        fontSize: { xs: "1.5rem", sm: "1.75rem", md: "2rem" },
                                        fontWeight: 800,
                                        color: "text.primary",
                                        mb: 2
                                    }}
                                >
                                    {feature.title}
                                </Typography>
                                <Typography
                                    variant="body1"
                                    color="text.secondary"
                                    sx={{ mb: 4, lineHeight: 1.7, fontSize: { xs: "0.95rem", md: "1rem" } }}
                                >
                                    {feature.description}
                                </Typography>
                                <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
                                    {feature.bullets.map((bullet, idx) => (
                                        <Box key={idx} sx={{ display: "flex", gap: 1.5, alignItems: "flex-start" }}>
                                            <CheckCircleIcon sx={{ color: "primary.main", fontSize: "1.25rem", mt: 0.25 }} />
                                            <Typography variant="body2" sx={{ fontWeight: 600, color: "text.primary", fontSize: "0.95rem" }}>
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
                                sx={{
                                    border: "1px solid rgba(15, 118, 110, 0.08)",
                                    boxShadow: "0 15px 45px rgba(0, 0, 0, 0.06)",
                                    borderRadius: "16px",
                                    overflow: "hidden"
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
                                        maxHeight: { xs: 260, sm: 360 },
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
