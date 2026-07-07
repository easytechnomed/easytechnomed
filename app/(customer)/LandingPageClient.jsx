"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ThemeProvider, createTheme, CssBaseline, Box } from "@mui/material";
import { toast } from "sonner";

// Import modular components
import Navbar from "./home/Navbar";
import Hero from "./home/Hero";
import Benefits from "./home/Benefits";
import Features from "./home/Features";
import Pricing from "./home/Pricing";
import Contact from "./home/Contact";
import Footer from "./home/Footer";

// MUI Theme configured to match the admin dashboard colors
const theme = createTheme({
    breakpoints: {
        values: {
            xs: 0,
            sm: 600,
            md: 900,
            lg: 1200,
            xl: 1440,
        },
    },
    palette: {
        primary: {
            main: "#0f766e", // Teal 700
            light: "#14b8a6", // Teal 500
            dark: "#115e59", // Teal 800
            contrastText: "#ffffff",
        },
        secondary: {
            main: "#3b82f6", // Blue 500
        },
        background: {
            default: "#f8fafc", // Slate 50
            paper: "#ffffff",
        },
        text: {
            primary: "#0f172a", // Slate 900
            secondary: "#475569", // Slate 600
        },
    },
    typography: {
        fontFamily: "var(--font-outfit), 'Outfit', sans-serif",
        h1: {
            fontWeight: 800,
        },
        h2: {
            fontWeight: 800,
        },
        h3: {
            fontWeight: 700,
        },
        button: {
            textTransform: "none",
            fontWeight: 600,
        },
    },
    components: {
        MuiButton: {
            styleOverrides: {
                root: {
                    borderRadius: 8,
                    padding: "10px 24px",
                },
            },
        },
        MuiCard: {
            styleOverrides: {
                root: {
                    borderRadius: 16,
                    boxShadow: "0 10px 30px -15px rgba(0, 0, 0, 0.05), 0 1px 3px 0 rgba(0, 0, 0, 0.05)",
                },
            },
        },
    },
});

export default function LandingPage() {
    const router = useRouter();
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [contactInput, setContactInput] = useState("");
    const [inputType, setInputType] = useState("email"); // "email" or "mobile"
    const [loading, setLoading] = useState(false);
    const [scrolled, setScrolled] = useState(false);

    // Dynamic input type detector
    useEffect(() => {
        const numericRegex = /^[0-9+()-\s]*$/;
        if (contactInput.trim() === "") {
            setInputType("email");
        } else if (numericRegex.test(contactInput)) {
            setInputType("mobile");
        } else {
            setInputType("email");
        }
    }, [contactInput]);

    // Track window scroll to change header background
    useEffect(() => {
        const handleScroll = () => {
            if (window.scrollY > 50) {
                setScrolled(true);
            } else {
                setScrolled(false);
            }
        };
        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    const handleLeadSubmit = async (e) => {
        e.preventDefault();
        if (!contactInput.trim()) {
            toast.error("Please enter your email or mobile number.");
            return;
        }

        setLoading(true);
        try {
            const res = await fetch("/api/leads", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ contact: contactInput }),
            }).then((r) => r.json());

            if (res.success) {
                toast.success(res.message);
                setContactInput("");
            } else {
                toast.error(res.message);
            }
        } catch (err) {
            console.error(err);
            toast.error("Something went wrong. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    const navLinks = [
        { text: "Features", href: "#features" },
        { text: "Benefits", href: "#benefits" },
        { text: "Pricing", href: "#pricing" },
        { text: "Contact Us", href: "#contact" },
    ];

    return (
        <ThemeProvider theme={theme}>
            <CssBaseline />
            <Box sx={{ minHeight: "100vh", display: "flex", flexDirection: "column", bgcolor: "background.default" }}>
                {/* Responsive Header Navbar */}
                <Navbar
                    scrolled={scrolled}
                    mobileMenuOpen={mobileMenuOpen}
                    setMobileMenuOpen={setMobileMenuOpen}
                    navLinks={navLinks}
                    router={router}
                />

                {/* Hero Section */}
                <Hero
                    contactInput={contactInput}
                    setContactInput={setContactInput}
                    inputType={inputType}
                    loading={loading}
                    handleLeadSubmit={handleLeadSubmit}
                    router={router}
                />

                {/* Benefits Section */}
                <Benefits />

                {/* Features Showcase Section */}
                <Features />

                {/* Pricing Section */}
                <Pricing />

                {/* Contact Us & Support Section */}
                <Contact
                    contactInput={contactInput}
                    setContactInput={setContactInput}
                    inputType={inputType}
                    loading={loading}
                    handleLeadSubmit={handleLeadSubmit}
                />

                {/* Footer Section */}
                <Footer navLinks={navLinks} />
            </Box>
        </ThemeProvider>
    );
}
