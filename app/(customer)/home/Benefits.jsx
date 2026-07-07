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
    Security as SecurityIcon
} from "@mui/icons-material";

export default function Benefits() {
    const benefitsData = [
        {
            icon: <SpeedIcon sx={{ fontSize: 28, mx: "auto" }} />,
            title: "Super Fast Report Delivery",
            description: "Instantly record patient details, enter values, and generate PDF lab reports. No lag, no system crashes. Deliver digital results to patients in real-time."
        },
        {
            icon: <CheckCircleIcon sx={{ fontSize: 28, mx: "auto" }} />,
            title: "Zero Learning Curve UI",
            description: "A clean and intuitive layout that laboratory technicians can master within 5 minutes. Spend zero time on training, and more time processing medical samples."
        },
        {
            icon: <SecurityIcon sx={{ fontSize: 28, mx: "auto" }} />,
            title: "Secure Cloud Platform",
            description: "Your diagnostic lab database is backed up continuously on secure endpoints. Control patient privacy and restrict user accesses with roles and permissions."
        }
    ];

    return (
        <Box
            id="benefits"
            sx={{
                py: { xs: 8, md: 12 },
                bgcolor: "#ffffff",
                borderTop: "1px solid rgba(15, 118, 110, 0.05)"
            }}
        >
            <Container maxWidth="xl">
                <Box sx={{ textAlign: "center", mb: { xs: 6, md: 8 }, maxWidth: 640, mx: "auto" }}>
                    <Typography
                        variant="h2"
                        sx={{
                            fontSize: { xs: "1.75rem", sm: "2.25rem", md: "2.5rem" },
                            fontWeight: 800,
                            mb: 2,
                            color: "text.primary"
                        }}
                    >
                        Why Diagnostic Labs Love Pathlab
                    </Typography>
                    <Typography variant="body1" color="text.secondary" sx={{ fontSize: { xs: "0.95rem", md: "1.05rem" } }}>
                        Designed by medical software experts to eliminate paper bottlenecks and speed up patient test report delivery.
                    </Typography>
                </Box>

                <Grid container spacing={4}>
                    {benefitsData.map((benefit, index) => (
                        <Grid key={index} size={{ xs: 12, md: 4 }}>
                            <Card
                                variant="outlined"
                                sx={{
                                    height: "100%",
                                    bgcolor: "rgba(248, 250, 252, 0.5)",
                                    borderColor: "rgba(15, 118, 110, 0.08)",
                                    borderRadius: "16px",
                                    transition: "all 0.3s ease",
                                    "&:hover": {
                                        transform: "translateY(-4px)",
                                        boxShadow: "0 12px 30px -10px rgba(15, 118, 110, 0.1)",
                                        borderColor: "rgba(15, 118, 110, 0.2)"
                                    }
                                }}
                            >
                                <CardContent sx={{ p: { xs: 3, md: 4 } }}>
                                    <Box
                                        sx={{
                                            p: 1.5,
                                            width: 56,
                                            height: 56,
                                            borderRadius: 3,
                                            bgcolor: "rgba(20, 184, 166, 0.1)",
                                            color: "primary.main",
                                            mb: 3,
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "center"
                                        }}
                                    >
                                        {benefit.icon}
                                    </Box>
                                    <Typography
                                        variant="h5"
                                        sx={{
                                            fontWeight: 700,
                                            fontSize: { xs: "1.2rem", md: "1.35rem" },
                                            mb: 1.5,
                                            color: "text.primary"
                                        }}
                                    >
                                        {benefit.title}
                                    </Typography>
                                    <Typography
                                        variant="body2"
                                        color="text.secondary"
                                        sx={{
                                            lineHeight: 1.6,
                                            fontSize: "0.9rem"
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
