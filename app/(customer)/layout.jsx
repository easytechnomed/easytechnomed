"use client";

import React, { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import { CssBaseline, Box } from "@mui/material";
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
  { text: "FAQ", href: "/#faq" },
  { text: "About Us", href: "/about" },
  { text: "Contact Us", href: "/contact" },
];

export default function CustomerLayout({ children }) {
  const router = useRouter();
  const pathname = usePathname();
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

  const isDashboard = pathname.startsWith("/dashboard") ||
                      pathname.startsWith("/registration") ||
                      pathname.startsWith("/test-report") ||
                      pathname.startsWith("/doctor-summary") ||
                      pathname.startsWith("/members") ||
                      pathname.startsWith("/settings") ||
                      pathname.startsWith("/userApprove");

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://easytechnomed.com";
  const siteNavigationSchema = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebSite",
        "@id": `${siteUrl}/#website`,
        "url": `${siteUrl}/`,
        "name": "EasyTechnoMed",
        "description": "Cloud-Based Diagnostic Lab & LIMS Management Software"
      },
      {
        "@type": "SiteNavigationElement",
        "@id": `${siteUrl}/#navigation`,
        "name": [
          "Register",
          "Login",
          "About Us",
          "Contact Us",
          "Privacy Policy"
        ],
        "url": [
          `${siteUrl}/auth/register`,
          `${siteUrl}/auth/login`,
          `${siteUrl}/about`,
          `${siteUrl}/contact`,
          `${siteUrl}/privacy`
        ]
      }
    ]
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box sx={{ minHeight: "100vh", display: "flex", flexDirection: "column", bgcolor: "background.default" }}>
        {!isDashboard && (
          <>
            <script
              type="application/ld+json"
              dangerouslySetInnerHTML={{ __html: JSON.stringify(siteNavigationSchema) }}
            />
            <Navbar
              scrolled={scrolled}
              mobileMenuOpen={mobileMenuOpen}
              setMobileMenuOpen={setMobileMenuOpen}
              navLinks={navLinks}
              router={router}
            />
          </>
        )}
        <Box component="main" sx={{ flexGrow: 1, display: "flex", flexDirection: "column" }}>
          {children}
        </Box>
        {!isDashboard && <Footer navLinks={navLinks} />}
      </Box>
    </ThemeProvider>
  );
}
