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
    ArrowForward as ArrowForwardIcon,
    Login as LoginIcon
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

    React.useEffect(() => {
        const scrollToHash = () => {
            if (typeof window !== "undefined" && window.location.hash) {
                const targetId = window.location.hash.replace("#", "");
                const el = document.getElementById(targetId);
                if (el) {
                    setTimeout(() => {
                        el.scrollIntoView({ behavior: "smooth", block: "start" });
                    }, 100);
                }
            }
        };

        scrollToHash();
        window.addEventListener("hashchange", scrollToHash);
        return () => window.removeEventListener("hashchange", scrollToHash);
    }, []);

    const handleNavClick = (e, href) => {
        if (href.startsWith("/#") || href.startsWith("#")) {
            e.preventDefault();
            e.stopPropagation();
            const targetId = href.replace(/^\/?#/, "");
            if (typeof window !== "undefined") {
                const isHome = window.location.pathname === "/" || window.location.pathname === "";
                if (isHome) {
                    const el = document.getElementById(targetId);
                    if (el) {
                        el.scrollIntoView({ behavior: "smooth", block: "start" });
                        window.history.pushState(null, "", `#${targetId}`);
                    }
                } else {
                    router.push(`/#${targetId}`, { scroll: false });
                }
            }
        }
    };

    return (
        <>
            <AppBar
                position="fixed"
                elevation={0}
                sx={{
                    bgcolor: "#FFFFFF",
                    borderBottom: isSolid ? "2px solid #E5E7EB" : "2px solid transparent",
                    boxShadow: "none !important",
                    transition: "border-color 0.2s ease-in-out",
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
                            sx={{
                                height: { xs: 38, sm: 42, md: 44 },
                                cursor: "pointer",
                                borderRadius: "6px",
                                transition: "transform 0.2s",
                                "&:hover": { transform: "scale(1.02)" }
                            }}
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
                                    scroll={false}
                                    onClick={(e) => handleNavClick(e, link.href)}
                                    sx={{
                                        textDecoration: "none",
                                        color: "#111827",
                                        fontWeight: 600,
                                        fontSize: "0.95rem",
                                        letterSpacing: "0.01em",
                                        transition: "color 0.15s ease-in-out",
                                        "&:hover": { color: "#0f766e" }
                                    }}
                                >
                                    {link.text}
                                </Typography>
                            ))}
                        </Box>

                        {/* Desktop Action Buttons */}
                        <Box sx={{ display: { xs: "none", md: "flex" }, alignItems: "center", gap: 2 }}>
                            {isLoggedIn ? (
                                <Button
                                    variant="contained"
                                    onClick={() => router.push("/dashboard")}
                                    endIcon={<ArrowForwardIcon sx={{ fontSize: "1.1rem" }} />}
                                    sx={{
                                        fontWeight: 700,
                                        bgcolor: "#0f766e",
                                        color: "#FFFFFF",
                                        borderRadius: "8px",
                                        px: 3,
                                        py: 1.1,
                                        boxShadow: "none !important",
                                        "&:hover": {
                                            bgcolor: "#115e59",
                                            boxShadow: "none !important",
                                            transform: "scale(1.04)"
                                        }
                                    }}
                                >
                                    Open Dashboard
                                </Button>
                            ) : (
                                <>
                                    <Button
                                        variant="text"
                                        onClick={() => router.push("/auth/login")}
                                        startIcon={<LoginIcon sx={{ fontSize: "1.1rem" }} />}
                                        sx={{
                                            fontWeight: 700,
                                            borderRadius: "8px",
                                            px: 2.5,
                                            py: 1.1,
                                            bgcolor: "#F3F4F6",
                                            color: "#111827",
                                            boxShadow: "none !important",
                                            "&:hover": {
                                                bgcolor: "#E5E7EB",
                                                boxShadow: "none !important",
                                                transform: "scale(1.04)"
                                            }
                                        }}
                                    >
                                        Login
                                    </Button>
                                    <Button
                                        variant="contained"
                                        onClick={() => router.push("/auth/register")}
                                        endIcon={<ArrowForwardIcon sx={{ fontSize: "1.1rem" }} />}
                                        sx={{
                                            fontWeight: 700,
                                            borderRadius: "8px",
                                            px: 3,
                                            py: 1.1,
                                            bgcolor: "#0f766e",
                                            color: "#FFFFFF",
                                            boxShadow: "none !important",
                                            "&:hover": {
                                                bgcolor: "#115e59",
                                                boxShadow: "none !important",
                                                transform: "scale(1.04)"
                                            }
                                        }}
                                    >
                                        Start Free Trial
                                    </Button>
                                </>
                            )}
                        </Box>

                        {/* Mobile Action & Menu */}
                        <Box sx={{ display: { xs: "flex", md: "none" }, alignItems: "center", gap: 1 }}>
                            {isLoggedIn ? (
                                <Button
                                    variant="contained"
                                    size="small"
                                    onClick={() => router.push("/dashboard")}
                                    sx={{
                                        fontWeight: 700,
                                        fontSize: "0.82rem",
                                        borderRadius: "6px",
                                        px: 1.8,
                                        py: 0.7,
                                        bgcolor: "#0f766e",
                                        color: "#FFFFFF",
                                        boxShadow: "none !important",
                                    }}
                                >
                                    Dashboard
                                </Button>
                            ) : (
                                <Button
                                    variant="contained"
                                    size="small"
                                    onClick={() => router.push("/auth/login")}
                                    startIcon={<LoginIcon sx={{ fontSize: "1rem !important" }} />}
                                    sx={{
                                        fontWeight: 700,
                                        fontSize: "0.82rem",
                                        borderRadius: "6px",
                                        px: 2,
                                        py: 0.7,
                                        bgcolor: "#0f766e",
                                        color: "#FFFFFF",
                                        boxShadow: "none !important",
                                    }}
                                >
                                    Login
                                </Button>
                            )}

                            <IconButton
                                edge="end"
                                sx={{ color: "#111827", p: 1 }}
                                onClick={() => setMobileMenuOpen(true)}
                                aria-label="open navigation menu"
                            >
                                <MenuIcon />
                            </IconButton>
                        </Box>
                    </Toolbar>
                </Container>
            </AppBar>

            {/* Mobile Navigation Drawer */}
            <Drawer
                anchor="right"
                open={mobileMenuOpen}
                onClose={() => setMobileMenuOpen(false)}
            >
                <Box sx={{ width: 280, p: 3, height: "100%", display: "flex", flexDirection: "column", bgcolor: "#FFFFFF" }}>
                    <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 4 }}>
                        <Box component="img" src="/logo/logobg.png" alt="EasyTechnoMed" sx={{ height: 38, borderRadius: "4px" }} />
                        <IconButton onClick={() => setMobileMenuOpen(false)}>
                            <CloseIcon sx={{ color: "#111827" }} />
                        </IconButton>
                    </Box>
                    <List sx={{ mb: "auto" }}>
                        {navLinks.map((link) => (
                            <ListItem key={link.text} disablePadding>
                                <ListItemButton
                                    component={Link}
                                    href={link.href}
                                    scroll={false}
                                    onClick={(e) => {
                                        setMobileMenuOpen(false);
                                        handleNavClick(e, link.href);
                                    }}
                                    sx={{ py: 1.5, borderRadius: "6px", mb: 0.5 }}
                                >
                                    <ListItemText primary={link.text} slotProps={{ primary: { fontWeight: 700, color: "#111827" } }} />
                                </ListItemButton>
                            </ListItem>
                        ))}
                    </List>
                    <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5, mt: 4 }}>
                        {isLoggedIn ? (
                            <Button
                                variant="contained"
                                fullWidth
                                onClick={() => {
                                    setMobileMenuOpen(false);
                                    router.push("/dashboard");
                                }}
                                endIcon={<ArrowForwardIcon />}
                                sx={{
                                    fontWeight: 700,
                                    borderRadius: "8px",
                                    py: 1.4,
                                    bgcolor: "#0f766e",
                                    color: "#FFFFFF",
                                    boxShadow: "none !important"
                                }}
                            >
                                Open Dashboard
                            </Button>
                        ) : (
                            <>
                                <Button
                                    variant="outlined"
                                    fullWidth
                                    startIcon={<LoginIcon />}
                                    onClick={() => {
                                        setMobileMenuOpen(false);
                                        router.push("/auth/login");
                                    }}
                                    sx={{
                                        fontWeight: 700,
                                        borderRadius: "8px",
                                        py: 1.4,
                                        border: "3px solid #0f766e",
                                        color: "#0f766e",
                                        boxShadow: "none !important",
                                        "&:hover": {
                                            bgcolor: "#0f766e",
                                            color: "#FFFFFF",
                                            border: "3px solid #0f766e"
                                        }
                                    }}
                                >
                                    Login
                                </Button>
                                <Button
                                    variant="contained"
                                    fullWidth
                                    onClick={() => {
                                        setMobileMenuOpen(false);
                                        router.push("/auth/register");
                                    }}
                                    endIcon={<ArrowForwardIcon />}
                                    sx={{
                                        fontWeight: 700,
                                        borderRadius: "8px",
                                        py: 1.4,
                                        bgcolor: "#0f766e",
                                        color: "#FFFFFF",
                                        boxShadow: "none !important"
                                    }}
                                >
                                    Start Free Trial
                                </Button>
                            </>
                        )}
                    </Box>
                </Box>
            </Drawer>
        </>
    );
}
