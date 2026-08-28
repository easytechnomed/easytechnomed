"use client";

import React from "react";
import Link from "next/link";
import {
    Box,
    Container,
    Typography,
    Grid,
    List,
    ListItem
} from "@mui/material";

export default function Footer({ navLinks }) {
    return (
        <Box sx={{ bgcolor: "#111827", color: "#9CA3AF", py: { xs: 7, md: 9 }, borderTop: "2px solid rgba(255, 255, 255, 0.1)" }}>
            <Container maxWidth="xl">
                <Grid container spacing={4} sx={{ mb: 5 }}>
                    {/* Brand Column */}
                    <Grid size={{ xs: 12, md: 6 }}>
                        <Box
                            component="img"
                            src="/logo/logobg.png"
                            alt="EasyTechnoMed Logo"
                            sx={{ height: 44, mb: 2.5, borderRadius: "6px" }}
                        />
                        <Typography variant="body2" sx={{ maxWidth: 380, lineHeight: 1.7, fontSize: "0.92rem", color: "#9CA3AF" }}>
                            Modern, secure, and intuitive diagnostic laboratory software for managing patient reports, referral metrics, and data summaries efficiently.
                        </Typography>
                    </Grid>

                    {/* Product Links Column */}
                    <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                        <Typography
                            sx={{
                                color: "#FFFFFF",
                                fontWeight: 800,
                                mb: 2,
                                fontSize: "0.85rem",
                                fontFamily: "var(--font-outfit), sans-serif",
                                letterSpacing: "0.08em",
                                textTransform: "uppercase"
                            }}
                        >
                            Product
                        </Typography>
                        <List sx={{ p: 0 }}>
                            {navLinks.map((link) => (
                                <ListItem key={link.text} disableGutters sx={{ py: 0.6 }}>
                                    <Typography
                                        component="a"
                                        href={link.href}
                                        sx={{
                                            color: "#9CA3AF",
                                            textDecoration: "none",
                                            fontSize: "0.92rem",
                                            fontWeight: 600,
                                            transition: "color 0.15s",
                                            "&:hover": { color: "#0f766e" }
                                        }}
                                    >
                                        {link.text}
                                    </Typography>
                                </ListItem>
                            ))}
                        </List>
                    </Grid>

                    {/* Trust/Security Column */}
                    <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                        <Typography
                            sx={{
                                color: "#FFFFFF",
                                fontWeight: 800,
                                mb: 2,
                                fontSize: "0.85rem",
                                fontFamily: "var(--font-outfit), sans-serif",
                                letterSpacing: "0.08em",
                                textTransform: "uppercase"
                            }}
                        >
                            Security & Trust
                        </Typography>
                        <Typography variant="body2" sx={{ lineHeight: 1.7, fontSize: "0.92rem", color: "#9CA3AF" }}>
                            100% HIPAA compliant data practices. Daily automated cloud backups and multi-tenant isolated databases.
                        </Typography>
                    </Grid>
                </Grid>

                {/* Bottom Bar */}
                <Box
                    sx={{
                        borderTop: "1px solid rgba(255, 255, 255, 0.1)",
                        pt: 4,
                        display: "flex",
                        flexDirection: { xs: "column", sm: "row" },
                        justifyContent: "space-between",
                        alignItems: "center",
                        gap: 2
                    }}
                >
                    <Typography variant="caption" sx={{ fontSize: "0.8rem", color: "#6B7280", fontWeight: 600, textAlign: { xs: "center", sm: "left" } }}>
                        © {new Date().getFullYear()} EasyTechnoMed. All rights reserved. Cloud-Based Diagnostic Lab & LIMS Software.
                    </Typography>
                    <Box sx={{ display: "flex", gap: 3 }}>
                        <Typography
                            component={Link}
                            href="/privacy"
                            sx={{
                                color: "#9CA3AF",
                                textDecoration: "none",
                                fontSize: "0.8rem",
                                fontWeight: 600,
                                transition: "color 0.15s",
                                "&:hover": { color: "#0f766e" }
                            }}
                        >
                            Privacy Policy
                        </Typography>
                        <Typography
                            component={Link}
                            href="/about"
                            sx={{
                                color: "#9CA3AF",
                                textDecoration: "none",
                                fontSize: "0.8rem",
                                fontWeight: 600,
                                transition: "color 0.15s",
                                "&:hover": { color: "#0f766e" }
                            }}
                        >
                            About Us
                        </Typography>
                    </Box>
                </Box>
            </Container>
        </Box>
    );
}
