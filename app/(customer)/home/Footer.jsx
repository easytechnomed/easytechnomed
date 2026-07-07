"use client";

import React from "react";
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
        <Box sx={{ bgcolor: "#0f172a", color: "#94a3b8", py: { xs: 6, md: 8 }, borderTop: "1px solid rgba(255,255,255,0.05)" }}>
            <Container maxWidth="xl">
                <Grid container spacing={4} sx={{ mb: 4 }}>
                    {/* Brand Column */}
                    <Grid size={{ xs: 12, md: 6 }}>
                        <Box
                            component="img"
                            src="/logo/logobg.png"
                            alt="PathLab Logo"
                            sx={{ height: 48, mb: 2.5, borderRadius: "6px", filter: "brightness(0.9)" }}
                        />
                        <Typography variant="body2" sx={{ maxWidth: 360, lineHeight: 1.7, fontSize: "0.9rem" }}>
                            Modern, secure, and professional diagnostic laboratory software for managing patient reports, referral metrics, and data summaries efficiently.
                        </Typography>
                    </Grid>

                    {/* Product Links Column */}
                    <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                        <Typography variant="subtitle2" sx={{ color: "#f8fafc", fontWeight: 700, mb: 2, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                            Product
                        </Typography>
                        <List sx={{ p: 0 }}>
                            {navLinks.map((link) => (
                                <ListItem key={link.text} disableGutters sx={{ py: 0.75 }}>
                                    <Typography
                                        component="a"
                                        href={link.href}
                                        sx={{
                                            color: "#94a3b8",
                                            textDecoration: "none",
                                            fontSize: "0.9rem",
                                            transition: "color 0.2s",
                                            "&:hover": { color: "#ffffff" }
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
                        <Typography variant="subtitle2" sx={{ color: "#f8fafc", fontWeight: 700, mb: 2, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                            Security & Trust
                        </Typography>
                        <Typography variant="body2" sx={{ lineHeight: 1.7, fontSize: "0.9rem" }}>
                            100% HIPAA compliant data practices. Continuous backup and encrypted records transfer.
                        </Typography>
                    </Grid>
                </Grid>

                {/* Bottom Bar */}
                <Box
                    sx={{
                        borderTop: "1px solid rgba(255,255,255,0.08)",
                        pt: 4,
                        display: "flex",
                        flexDirection: { xs: "column", sm: "row" },
                        justifyContent: "space-between",
                        alignItems: "center",
                        gap: 2
                    }}
                >
                    <Typography variant="caption" sx={{ fontSize: "0.75rem", textAlign: { xs: "center", sm: "left" } }}>
                        © {new Date().getFullYear()} Pathlab. All rights reserved. Authorized personnel console access under license.
                    </Typography>
                    <Box sx={{ display: "flex", gap: 3 }}>
                        <Typography
                            component="a"
                            href="#"
                            sx={{
                                color: "#94a3b8",
                                textDecoration: "none",
                                fontSize: "0.75rem",
                                transition: "color 0.2s",
                                "&:hover": { color: "#ffffff" }
                            }}
                        >
                            Privacy Policy
                        </Typography>
                        <Typography
                            component="a"
                            href="#"
                            sx={{
                                color: "#94a3b8",
                                textDecoration: "none",
                                fontSize: "0.75rem",
                                transition: "color 0.2s",
                                "&:hover": { color: "#ffffff" }
                            }}
                        >
                            Terms of Service
                        </Typography>
                    </Box>
                </Box>
            </Container>
        </Box>
    );
}
