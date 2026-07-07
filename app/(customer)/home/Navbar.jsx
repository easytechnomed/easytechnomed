"use client";

import React from "react";
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
    router
}) {
    return (
        <>
            <AppBar
                position="fixed"
                elevation={0}
                sx={{
                    bgcolor: scrolled ? "rgba(255, 255, 255, 0.95)" : "transparent",
                    backdropFilter: scrolled ? "blur(12px)" : "none",
                    borderBottom: scrolled ? "1px solid rgba(15, 118, 110, 0.1)" : "none",
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
                            alt="PathLab Logo"
                            sx={{ height: 48, cursor: "pointer", borderRadius: "6px" }}
                            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
                        />

                        {/* Desktop Navigation Links */}
                        <Box sx={{ display: { xs: "none", md: "flex" }, gap: 4, alignItems: "center" }}>
                            {navLinks.map((link) => (
                                <Typography
                                    key={link.text}
                                    component="a"
                                    href={link.href}
                                    sx={{
                                        textDecoration: "none",
                                        color: scrolled ? "text.primary" : "#334155",
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
                            <Button
                                variant="outlined"
                                color="primary"
                                onClick={() => router.push("/auth/login")}
                                sx={{ borderColor: "rgba(15, 118, 110, 0.4)", color: scrolled ? "primary.main" : "#334155" }}
                            >
                                Customer Login
                            </Button>
                            <Button
                                variant="contained"
                                color="primary"
                                onClick={() => router.push("/auth/login")}
                                endIcon={<ArrowForwardIcon />}
                            >
                                Admin Console
                            </Button>
                        </Box>

                        {/* Mobile Menu Icon */}
                        <IconButton
                            edge="end"
                            sx={{ display: { xs: "flex", md: "none" }, color: "primary.main" }}
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
                        <Box component="img" src="/logo/logobg.png" alt="Pathlab" sx={{ height: 40, borderRadius: "4px" }} />
                        <IconButton onClick={() => setMobileMenuOpen(false)}>
                            <CloseIcon />
                        </IconButton>
                    </Box>
                    <List sx={{ mb: "auto" }}>
                        {navLinks.map((link) => (
                            <ListItem key={link.text} disablePadding>
                                <ListItemButton
                                    component="a"
                                    href={link.href}
                                    onClick={() => setMobileMenuOpen(false)}
                                    sx={{ py: 1.5, borderRadius: 2 }}
                                >
                                    <ListItemText primary={link.text} primaryTypographyProps={{ fontWeight: 600, color: "text.primary" }} />
                                </ListItemButton>
                            </ListItem>
                        ))}
                    </List>
                    <Box sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 4 }}>
                        <Button
                            variant="outlined"
                            color="primary"
                            fullWidth
                            onClick={() => {
                                setMobileMenuOpen(false);
                                router.push("/auth/login");
                            }}
                        >
                            Customer Login
                        </Button>
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
                            Admin Console
                        </Button>
                    </Box>
                </Box>
            </Drawer>
        </>
    );
}
