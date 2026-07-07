"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ThemeProvider, createTheme, CssBaseline, Box } from "@mui/material";
import Navbar from "./home/Navbar";
import Footer from "./home/Footer";

// Unified theme for all customer routes
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

const navLinks = [
  { text: "Features", href: "/#features" },
  { text: "Benefits", href: "/#benefits" },
  { text: "Pricing", href: "/#pricing" },
  { text: "About Us", href: "/about" },
  { text: "Contact Us", href: "/contact" },
];

export default function CustomerLayout({ children }) {
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

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

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box sx={{ minHeight: "100vh", display: "flex", flexDirection: "column", bgcolor: "background.default" }}>
        <Navbar
          scrolled={scrolled}
          mobileMenuOpen={mobileMenuOpen}
          setMobileMenuOpen={setMobileMenuOpen}
          navLinks={navLinks}
          router={router}
        />
        <Box component="main" sx={{ flexGrow: 1 }}>
          {children}
        </Box>
        <Footer navLinks={navLinks} />
      </Box>
    </ThemeProvider>
  );
}
