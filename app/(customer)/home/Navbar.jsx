"use client";

import React from "react";
import Link from "next/link";
import {
    Box,
    Container,
    Typography,
    Button,
    AppBar,
    Toolbar,
    IconButton,
    Drawer,
    List,
    ListItem,
    ListItemButton,
    ListItemText
} from "@mui/material";
import {
    Menu as MenuIcon,
    Close as CloseIcon,
    ArrowForward as ArrowForwardIcon
} from "@mui/icons-material";

export default function Navbar({
    scrolled,
    mobileMenuOpen,
    setMobileMenuOpen,
    navLinks,
    router,
    alwaysSolid = false
}) {
    const isSolid = scrolled || alwaysSolid;
    const [isLoggedIn, setIsLoggedIn] = React.useState(false);

    React.useEffect(() => {
        fetch("/api/auth/check")
            .then(res => res.json())
            .then(data => {
                if (data.success) {
                    setIsLoggedIn(data.isLoggedIn);
                }
            })
            .catch(err => {
                console.error("Failed to check auth status", err);
            });
    }, []);

    return (
        <>
            <AppBar
                position="fixed"
                elevation={0}
                sx={{
                    bgcolor: isSolid ? "rgba(255, 255, 255, 0.95)" : "transparent",
                    backdropFilter: isSolid ? "blur(12px)" : "none",
                    borderBottom: "1px solid",
                    borderColor: isSolid ? "rgba(15, 118, 110, 0.1)" : "transparent",
                    transition: "all 0.3s ease",
                    zIndex: 1100
                }}
            >
                <Container maxWidth="xl">
                    <Toolbar disableGutters sx={{ justifyContent: "space-between", height: 72 }}>
                        {/* Logo */}
                        <Box
                            component="img"
                            src="/logo/logobg.png"
                            alt="EasyTechnoMed Logo"
                            sx={{ height: 48, cursor: "pointer", borderRadius: "6px" }}
                            onClick={() => {
                                if (typeof window !== "undefined" && window.location.pathname === "/") {
                                    window.scrollTo({ top: 0, behavior: "smooth" });
                                } else {
                                    router.push("/");
                                }
                            }}
                        />

                        {/* Desktop Navigation Links */}
                        <Box sx={{ display: { xs: "none", md: "flex" }, gap: 4, alignItems: "center" }}>
                            {navLinks.map((link) => (
                                <Typography
                                    key={link.text}
                                    component={Link}
                                    href={link.href}
                                    sx={{
                                        textDecoration: "none",
                                        color: isSolid ? "text.primary" : "#334155",
                                        fontWeight: 600,
                                        fontSize: "0.95rem",
                                        transition: "color 0.2s",
                                        "&:hover": { color: "primary.main" }
                                    }}
                                >
                                    {link.text}
                                </Typography>
                            ))}
                        </Box>

                        {/* Action Buttons */}
                        <Box sx={{ display: { xs: "none", md: "flex" }, gap: 2 }}>
                            {isLoggedIn ? (
                                <Button
                                    variant="contained"
                                    color="primary"
                                    onClick={() => router.push("/dashboard")}
                                    endIcon={<ArrowForwardIcon />}
                                >
                                    Open Dashboard
                                </Button>
                            ) : (
                                <Button
                                    variant="contained"
                                    color="primary"
                                    onClick={() => router.push("/auth/login")}
                                    endIcon={<ArrowForwardIcon />}
                                >
                                    Customer Login
                                </Button>
                            )}
                        </Box>

                        {/* Mobile Menu Icon */}
                        <IconButton
                            edge="end"
                            sx={{ display: { xs: "flex", md: "none" }, color: isSolid ? "primary.main" : "#334155" }}
                            onClick={() => setMobileMenuOpen(true)}
                        >
                            <MenuIcon />
                        </IconButton>
                    </Toolbar>
                </Container>
            </AppBar>

            {/* Mobile Navigation Drawer */}
            <Drawer
                anchor="right"
                open={mobileMenuOpen}
                onClose={() => setMobileMenuOpen(false)}
            >
                <Box sx={{ width: 280, p: 3, height: "100%", display: "flex", flexDirection: "column" }}>
                    <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 4 }}>
                        <Box component="img" src="/logo/logobg.png" alt="EasyTechnoMed" sx={{ height: 40, borderRadius: "4px" }} />
                        <IconButton onClick={() => setMobileMenuOpen(false)}>
                            <CloseIcon />
                        </IconButton>
                    </Box>
                    <List sx={{ mb: "auto" }}>
                        {navLinks.map((link) => (
                            <ListItem key={link.text} disablePadding>
                                <ListItemButton
                                    component={Link}
                                    href={link.href}
                                    onClick={() => setMobileMenuOpen(false)}
                                    sx={{ py: 1.5, borderRadius: 2 }}
                                >
                                    <ListItemText primary={link.text} slotProps={{ primary: { fontWeight: 600, color: "text.primary" } }} />
                                </ListItemButton>
                            </ListItem>
                        ))}
                    </List>
                    <Box sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 4 }}>
                        {isLoggedIn ? (
                            <Button
                                variant="contained"
                                color="primary"
                                fullWidth
                                onClick={() => {
                                    setMobileMenuOpen(false);
                                    router.push("/dashboard");
                                }}
                                endIcon={<ArrowForwardIcon />}
                            >
                                Open Dashboard
                            </Button>
                        ) : (
                            <Button
                                variant="contained"
                                color="primary"
                                fullWidth
                                onClick={() => {
                                    setMobileMenuOpen(false);
                                    router.push("/auth/login");
                                }}
                                endIcon={<ArrowForwardIcon />}
                            >
                                Customer Login
                            </Button>
                        )}
                    </Box>
                </Box>
            </Drawer>
        </>
    );
}
