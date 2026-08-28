"use client";

import React from "react";
import {
    Box,
    Container,
    Typography,
    Button,
    Grid,
    Card,
    CardContent,
    List,
    ListItem
} from "@mui/material";
import { CheckCircle as CheckCircleIcon } from "@mui/icons-material";

export default function Pricing() {
    const handlePlanSelect = () => {
        const contactSection = document.getElementById("contact");
        if (contactSection) {
            contactSection.scrollIntoView({ behavior: "smooth" });
        }
    };

    const plans = [
        {
            subtitle: "TRIAL PLAN",
            title: "Free Trial",
            desc: "Test all features with zero risk.",
            price: "₹0",
            period: "/ 5 Days",
            features: [
                "5 Days Full Access",
                "No feature limitations",
                "Register unlimited test profiles",
                "Smart PDF & WhatsApp reports",
                "Standard phone & email support"
            ],
            buttonText: "Start Free Trial",
            variant: "outlined",
            highlight: false
        },
        {
            subtitle: "MONTHLY PLAN",
            title: "Standard",
            desc: "Ideal for growing pathology labs.",
            price: "₹499",
            oldPrice: "₹599",
            period: "/ month",
            features: [
                "Full platform access",
                "Unlimited patient registrations",
                "Permanent QR code report scanning",
                "All diagnostic report templates",
                "Doctor Referral summaries",
                "Daily secure cloud backups"
            ],
            buttonText: "Subscribe Monthly",
            variant: "outlined",
            highlight: false
        },
        {
            subtitle: "YEARLY PLAN",
            title: "Premium Value",
            desc: "Best choice for established centers.",
            price: "₹4,999",
            oldPrice: "₹5,999",
            period: "/ year",
            features: [
                "Full platform access",
                "Save ~₹1,000 (16%+ discount)",
                "Unlimited patient registrations",
                "Permanent QR code report scanning",
                "All templates & custom configurations",
                "Priority 24/7 Phone & WhatsApp support",
                "Automated daily cloud backups"
            ],
            buttonText: "Subscribe Yearly",
            variant: "contained",
            highlight: true,
            badge: "POPULAR VALUE"
        }
    ];

    return (
        <Box
            id="pricing"
            sx={{
                py: { xs: 9, md: 14 },
                bgcolor: "#F3F4F6", // Solid Gray 100 Color Block Section
                borderTop: "2px solid #E5E7EB"
            }}
        >
            <Container maxWidth="xl">
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
                            Transparent Pricing
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
                        Simple, Predictable Plans for Every Lab
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
                        Activate your account in seconds. Test the full platform for 5 days with zero credit card required.
                    </Typography>
                </Box>

                {/* Flat Pricing Grid */}
                <Box
                    sx={{
                        display: "flex",
                        flexDirection: { xs: "row", md: "row" },
                        flexWrap: { xs: "nowrap", md: "wrap" },
                        overflowX: { xs: "auto", md: "visible" },
                        scrollSnapType: { xs: "x mandatory", md: "none" },
                        gap: 3.5,
                        pb: { xs: 4, md: 0 },
                        px: { xs: 2, md: 0 },
                        mx: { xs: -2, md: 0 },
                        justifyContent: { xs: "flex-start", md: "center" },
                        alignItems: "stretch",
                        "&::-webkit-scrollbar": { display: "none" },
                        msOverflowStyle: "none",
                        scrollbarWidth: "none"
                    }}
                >
                    {plans.map((plan, index) => (
                        <Box
                            key={index}
                            sx={{
                                minWidth: { xs: "85vw", sm: "320px", md: "calc(33.333% - 24px)" },
                                maxWidth: { xs: "90vw", sm: "360px", md: "380px" },
                                scrollSnapAlign: "center",
                                flexShrink: { xs: 0, md: 1 },
                                display: "flex",
                                transform: plan.highlight ? { md: "scale(1.04)" } : "none",
                                zIndex: plan.highlight ? 5 : 1,
                                position: "relative"
                            }}
                        >
                            {/* Popular Value Badge */}
                            {plan.badge && (
                                <Box
                                    sx={{
                                        position: "absolute",
                                        top: -16,
                                        left: "50%",
                                        transform: "translateX(-50%)",
                                        bgcolor: "#0f766e",
                                        color: "#FFFFFF",
                                        fontWeight: 800,
                                        fontSize: "0.75rem",
                                        letterSpacing: "0.06em",
                                        textTransform: "uppercase",
                                        py: 0.6,
                                        px: 2.2,
                                        borderRadius: "6px",
                                        border: "2px solid #111827",
                                        zIndex: 10
                                    }}
                                >
                                    {plan.badge}
                                </Box>
                            )}

                            <Card
                                elevation={0}
                                sx={{
                                    width: "100%",
                                    display: "flex",
                                    flexDirection: "column",
                                    border: plan.highlight ? "3px solid #111827" : "2px solid #E5E7EB",
                                    borderRadius: "10px",
                                    bgcolor: "#FFFFFF",
                                    position: "relative",
                                    overflow: "visible",
                                    transition: "transform 0.2s ease-in-out",
                                    "&:hover": {
                                        transform: "translateY(-4px)"
                                    }
                                }}
                            >
                                <CardContent sx={{ p: { xs: 3, sm: 4 }, flexGrow: 1, display: "flex", flexDirection: "column" }}>
                                    <Typography
                                        sx={{
                                            fontFamily: "var(--font-outfit), sans-serif",
                                            fontWeight: 800,
                                            fontSize: "0.8rem",
                                            letterSpacing: "0.08em",
                                            color: plan.highlight ? "#0f766e" : "#6B7280",
                                            mb: 1
                                        }}
                                    >
                                        {plan.subtitle}
                                    </Typography>
                                    <Typography
                                        variant="h3"
                                        sx={{
                                            fontFamily: "var(--font-outfit), sans-serif",
                                            fontWeight: 800,
                                            fontSize: "1.6rem",
                                            color: "#111827",
                                            mb: 0.5
                                        }}
                                    >
                                        {plan.title}
                                    </Typography>
                                    <Typography variant="body2" sx={{ color: "#4B5563", mb: 3 }}>
                                        {plan.desc}
                                    </Typography>

                                    <Box sx={{ display: "flex", alignItems: "baseline", gap: 1, mb: 3 }}>
                                        <Typography
                                            variant="h4"
                                            sx={{
                                                fontFamily: "var(--font-outfit), sans-serif",
                                                fontWeight: 800,
                                                fontSize: { xs: "2.4rem", md: "2.6rem" },
                                                color: plan.highlight ? "#0f766e" : "#111827"
                                            }}
                                        >
                                            {plan.price}
                                        </Typography>
                                        {plan.oldPrice && (
                                            <Typography
                                                variant="body1"
                                                sx={{
                                                    textDecoration: "line-through",
                                                    color: "#9CA3AF",
                                                    fontSize: "1.1rem"
                                                }}
                                            >
                                                {plan.oldPrice}
                                            </Typography>
                                        )}
                                        <Typography variant="body2" sx={{ color: "#6B7280", fontWeight: 600 }}>
                                            {plan.period}
                                        </Typography>
                                    </Box>

                                    <Box sx={{ borderBottom: "2px solid #E5E7EB", my: 2 }} />

                                    <List sx={{ p: 0, flexGrow: 1 }}>
                                        {plan.features.map((feat, idx) => (
                                            <ListItem key={idx} disableGutters sx={{ py: 0.8, display: "flex", alignItems: "flex-start", gap: 1.5 }}>
                                                <CheckCircleIcon sx={{ color: "#0f766e", fontSize: "1.25rem", mt: 0.2 }} />
                                                <Typography
                                                    variant="body2"
                                                    sx={{
                                                        color: "#111827",
                                                        fontSize: "0.95rem",
                                                        fontWeight: plan.highlight && idx === 1 ? 800 : 500
                                                    }}
                                                >
                                                    {feat}
                                                </Typography>
                                            </ListItem>
                                        ))}
                                    </List>
                                </CardContent>

                                <Box sx={{ p: 4, pt: 0 }}>
                                    <Button
                                        variant="contained"
                                        fullWidth
                                        onClick={handlePlanSelect}
                                        sx={{
                                            py: 1.5,
                                            fontWeight: 800,
                                            fontSize: "0.95rem",
                                            borderRadius: "8px",
                                            textTransform: "none",
                                            bgcolor: plan.highlight ? "#0f766e" : "#F3F4F6",
                                            color: plan.highlight ? "#FFFFFF" : "#111827",
                                            boxShadow: "none !important",
                                            border: plan.highlight ? "none" : "2px solid #E5E7EB",
                                            "&:hover": {
                                                bgcolor: plan.highlight ? "#115e59" : "#E5E7EB",
                                                boxShadow: "none !important",
                                                transform: "scale(1.04)"
                                            }
                                        }}
                                    >
                                        {plan.buttonText}
                                    </Button>
                                </Box>
                            </Card>
                        </Box>
                    ))}
                </Box>

                {/* Flat Lifetime Scanability Guarantee */}
                <Box
                    sx={{
                        mt: 7,
                        mx: "auto",
                        maxWidth: 750,
                        p: 3.5,
                        borderRadius: "8px",
                        bgcolor: "#FFFFFF",
                        border: "3px solid #0f766e",
                        textAlign: "center",
                        display: "flex",
                        flexDirection: "column",
                        gap: 1,
                        boxShadow: "none !important"
                    }}
                >
                    <Typography
                        sx={{
                            fontFamily: "var(--font-outfit), sans-serif",
                            fontWeight: 800,
                            color: "#0f766e",
                            fontSize: "1.1rem"
                        }}
                    >
                        🔒 Lifetime Report Scanability Guarantee
                    </Typography>
                    <Typography variant="body2" sx={{ color: "#4B5563", lineHeight: 1.65, fontSize: "0.95rem" }}>
                        When you use EasyTechnoMed to generate diagnostic reports, <strong>patient QR codes remain permanently scanable and accessible</strong> even if your subscription plan expires in the future. We never lock patient medical data!
                    </Typography>
                </Box>
            </Container>
        </Box>
    );
}
