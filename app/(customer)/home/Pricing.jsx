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
    ListItem,
    Chip
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
            subtitle: "Trial Plan",
            title: "Free Trial",
            desc: "Try it out first.",
            price: "₹0",
            period: "/ 5 Days",
            features: [
                "5 Days Access",
                "No limitations on features",
                "Create patient profiles",
                "Generate reports",
                "Support team access"
            ],
            buttonText: "Start Free Trial",
            variant: "outlined",
            highlight: false
        },
        {
            subtitle: "Monthly Plan",
            title: "Standard",
            desc: "Perfect for growing labs.",
            price: "499",
            oldPrice: "₹599",
            period: "/ month",
            features: [
                "Full access",
                "Unlimited registrations",
                "All PDF templates",
                "Doctor Referral summaries",
                "Email support",
                "Cloud backups"
            ],
            buttonText: "Subscribe Monthly",
            variant: "outlined",
            highlight: false
        },
        {
            subtitle: "Yearly Plan",
            title: "Premium Value",
            desc: "Best offer for labs.",
            price: "₹4,999",
            oldPrice: "₹5,999",
            period: "/ year",
            features: [
                "Full access",
                "Save ~₹800 (15%+ off)",
                "Unlimited registrations",
                "All PDF templates & custom configs",
                "Priority 24/7 Phone & Whatsapp support",
                "Daily database backups"
            ],
            buttonText: "Subscribe Yearly",
            variant: "contained",
            highlight: true,
            badge: "WELCOME OFFER"
        }
    ];

    return (
        <Box
            id="pricing"
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
                        Transparent Pricing Built for Labs
                    </Typography>
                    <Typography variant="body1" color="text.secondary" sx={{ fontSize: { xs: "0.95rem", md: "1.05rem" } }}>
                        Activate your account in seconds. Test the full platform for 5 days without any credit card or limitations.
                    </Typography>
                </Box>

                {/* Grid container with responsive horizontal snap scrolling on mobile */}
                <Box
                    sx={{
                        display: "flex",
                        flexDirection: { xs: "row", md: "row" },
                        flexWrap: { xs: "nowrap", md: "wrap" },
                        overflowX: { xs: "auto", md: "visible" },
                        scrollSnapType: { xs: "x mandatory", md: "none" },
                        gap: 4,
                        pb: { xs: 4, md: 0 },
                        px: { xs: 2, md: 0 },
                        mx: { xs: -2, md: 0 },
                        justifyContent: { xs: "flex-start", md: "center" },
                        alignItems: "stretch",
                        // Hide scrollbar on mobile
                        "&::-webkit-scrollbar": { display: "none" },
                        msOverflowStyle: "none",
                        scrollbarWidth: "none"
                    }}
                >
                    {plans.map((plan, index) => (
                        <Box
                            key={index}
                            sx={{
                                minWidth: { xs: "85vw", sm: "320px", md: "calc(33.333% - 22px)" },
                                maxWidth: { xs: "90vw", sm: "360px", md: "380px" },
                                scrollSnapAlign: "center",
                                flexShrink: { xs: 0, md: 1 },
                                display: "flex",
                                transform: plan.highlight ? { md: "scale(1.03)" } : "none",
                                zIndex: plan.highlight ? 5 : 1,
                                transition: "all 0.3s ease"
                            }}
                        >
                            <Card
                                elevation={plan.highlight ? 6 : 0}
                                variant={plan.highlight ? "elevation" : "outlined"}
                                sx={{
                                    width: "100%",
                                    height: "100%",
                                    borderColor: plan.highlight ? "primary.main" : "rgba(15, 118, 110, 0.12)",
                                    borderWidth: plan.highlight ? "2px" : "1px",
                                    borderRadius: "20px",
                                    display: "flex",
                                    flexDirection: "column",
                                    position: "relative",
                                    overflow: "visible",
                                    bgcolor: "#ffffff"
                                }}
                            >
                                {plan.badge && (
                                    <Box
                                        sx={{
                                            position: "absolute",
                                            top: -14,
                                            right: 24,
                                            bgcolor: "primary.main",
                                            color: "primary.contrastText",
                                            fontSize: "0.75rem",
                                            fontWeight: 800,
                                            px: 2,
                                            py: 0.5,
                                            borderRadius: "9999px",
                                            boxShadow: "0 4px 12px rgba(15, 118, 110, 0.25)",
                                            letterSpacing: "0.05em"
                                        }}
                                    >
                                        {plan.badge}
                                    </Box>
                                )}

                                <CardContent sx={{ p: { xs: 4, md: 4.5 }, flexGrow: 1, display: "flex", flexDirection: "column" }}>
                                    <Typography
                                        variant="subtitle2"
                                        sx={{
                                            color: plan.highlight ? "primary.main" : "text.secondary",
                                            fontWeight: 700,
                                            textTransform: "uppercase",
                                            mb: 1.5,
                                            letterSpacing: "0.05em",
                                            fontSize: "0.8rem"
                                        }}
                                    >
                                        {plan.subtitle}
                                    </Typography>
                                    <Typography
                                        variant="h3"
                                        sx={{
                                            fontSize: { xs: "1.85rem", md: "2.1rem" },
                                            fontWeight: 800,
                                            color: "text.primary",
                                            mb: 1
                                        }}
                                    >
                                        {plan.title}
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                                        {plan.desc}
                                    </Typography>

                                    <Box sx={{ display: "flex", alignItems: "baseline", gap: 1, mb: 3 }}>
                                        <Typography
                                            variant="h4"
                                            sx={{
                                                fontWeight: 800,
                                                fontSize: { xs: "2.2rem", md: "2.4rem" },
                                                color: plan.highlight ? "primary.main" : "text.primary"
                                            }}
                                        >
                                            {plan.price}
                                        </Typography>
                                        {plan.oldPrice && (
                                            <Typography
                                                variant="body1"
                                                sx={{
                                                    textDecoration: "line-through",
                                                    color: "text.secondary",
                                                    fontSize: "1.1rem"
                                                }}
                                            >
                                                {plan.oldPrice}
                                            </Typography>
                                        )}
                                        <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
                                            {plan.period}
                                        </Typography>
                                    </Box>

                                    <Box sx={{ borderBottom: "1px solid rgba(15, 118, 110, 0.08)", my: 2.5 }} />

                                    <List sx={{ p: 0, flexGrow: 1 }}>
                                        {plan.features.map((feat, idx) => (
                                            <ListItem key={idx} disableGutters sx={{ py: 0.75, display: "flex", alignItems: "flex-start", gap: 1.5 }}>
                                                <CheckCircleIcon sx={{ color: "primary.main", fontSize: "1.15rem", mt: 0.25 }} />
                                                <Typography
                                                    variant="body2"
                                                    color="text.secondary"
                                                    sx={{
                                                        fontSize: "0.9rem",
                                                        fontWeight: plan.highlight && idx === 1 ? 700 : 400
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
                                        variant={plan.variant}
                                        color="primary"
                                        fullWidth
                                        onClick={handlePlanSelect}
                                        sx={{
                                            py: 1.5,
                                            fontWeight: 700,
                                            fontSize: "0.95rem",
                                            borderRadius: "10px",
                                            textTransform: "none",
                                            boxShadow: plan.highlight ? "0 8px 20px -4px rgba(15, 118, 110, 0.3)" : "none"
                                        }}
                                    >
                                        {plan.buttonText}
                                    </Button>
                                </Box>
                            </Card>
                        </Box>
                    ))}
                </Box>
            </Container>
        </Box>
    );
}
