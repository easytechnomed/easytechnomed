"use client";

import React, { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import { CssBaseline, Box } from "@mui/material";
import Navbar from "./home/Navbar";
import Footer from "./home/Footer";

// Flat Design System Theme
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
      main: "#0f766e",
      light: "#14b8a6",
      dark: "#115e59",
      contrastText: "#FFFFFF",
    },
    secondary: {
      main: "#10B981",
      contrastText: "#FFFFFF",
    },
    background: {
      default: "#FFFFFF",
      paper: "#FFFFFF",
    },
    text: {
      primary: "#111827",
      secondary: "#6B7280",
    },
    divider: "#E5E7EB",
  },
  typography: {
    fontFamily: "var(--font-outfit), 'Outfit', system-ui, sans-serif",
    h1: {
      fontWeight: 800,
      letterSpacing: "-0.02em",
    },
    h2: {
      fontWeight: 800,
      letterSpacing: "-0.02em",
    },
    h3: {
      fontWeight: 800,
      letterSpacing: "-0.02em",
    },
    h4: {
      fontWeight: 700,
      letterSpacing: "-0.01em",
    },
    h5: {
      fontWeight: 700,
    },
    h6: {
      fontWeight: 700,
    },
    button: {
      textTransform: "none",
      fontWeight: 700,
      letterSpacing: "0.01em",
    },
  },
  shape: {
    borderRadius: 8,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          boxShadow: "none !important",
          padding: "10px 22px",
          transition: "all 0.2s ease-in-out",
          "&:hover": {
            boxShadow: "none !important",
            transform: "scale(1.04)",
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          boxShadow: "none !important",
          border: "none",
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          boxShadow: "none !important",
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
      if (window.scrollY > 20) {
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
      <Box sx={{ minHeight: "100vh", display: "flex", flexDirection: "column", bgcolor: "#FFFFFF" }}>
        {!isDashboard && (
          <>
            <script
              type="application/ld+json"
              dangerouslySetInnerHTML={{ __html: JSON.stringify(siteNavigationSchema) }}
            />
            <Navbar
              scrolled={scrolled}
              alwaysSolid={pathname.startsWith("/auth")}
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
