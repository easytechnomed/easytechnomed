"use client";

import React, { useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { TrackingProvider } from "@/app/context/TrackingContext";
import {
  Box,
  Typography,
  AppBar,
  Toolbar,
  IconButton,
  Divider,
  Avatar,
  Button,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  ThemeProvider,
  createTheme,
  CssBaseline,
  Tooltip
} from "@mui/material";
import {
  Menu as MenuIcon,
  ExitToApp as LogoutIcon,
  Business as WorkspaceIcon,
  People as PeopleIcon,
  Security as SecurityIcon,
  CloudUpload as UploadIcon,
  Science as ScienceIcon,
  TrendingUp as TrendingUpIcon,
  Email as EmailIcon
} from "@mui/icons-material";
import { toast } from "sonner";
import NextTopLoader from "nextjs-toploader";

const drawerWidth = 260;

// Custom light purple theme matching the SuperAdmin dashboard theme
const lightPurpleTheme = createTheme({
  palette: {
    mode: "light",
    primary: {
      main: "#7c3aed", // Purple 600
      light: "#a78bfa", // Purple 400
      dark: "#6d28d9", // Purple 700
      contrastText: "#ffffff",
    },
    secondary: {
      main: "#db2777", // Pink 600
    },
    background: {
      default: "#f8fafc", // Slate 50
      paper: "#ffffff", // Card backgrounds
    },
    text: {
      primary: "#0f172a", // Slate 900
      secondary: "#475569", // Slate 600
    },
    divider: "rgba(0, 0, 0, 0.08)",
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
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          boxShadow: "0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)",
        },
      },
    },
  },
});

export default function SuperAdminLayout({ children }) {
  const router = useRouter();
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [desktopDrawerOpen, setDesktopDrawerOpen] = useState(true);

  // We should check if page is public (login page only)
  const isLoginPage = pathname === "/adminstration" || pathname === "/adminstration/login";
  const isPublicPage = isLoginPage;

  const handleLogout = async () => {
    try {
      const res = await fetch("/adminstration/api/auth/logout", { method: "POST" }).then((r) => r.json());
      if (res.success) {
        toast.success("Logged out successfully.");
        router.push(res.redirect || "/adminstration");
      } else {
        toast.error(res.message || "Failed to logout.");
      }
    } catch (err) {
      console.error(err);
      toast.error("Error logging out.");
    }
  };

  const menuItems = [
    { text: "Workspace Controller", icon: <WorkspaceIcon />, path: "/adminstration/dashboard", exact: "/adminstration/dashboard" },
    { text: "Administrators", icon: <PeopleIcon />, path: "/adminstration/admins", exact: "/adminstration/admins" },
    { text: "Import Lab Tests", icon: <UploadIcon />, path: "/adminstration/importer", exact: "/adminstration/importer" },
    { text: "Default Tests & Params", icon: <ScienceIcon />, path: "/adminstration/test-parameter", exact: "/adminstration/test-parameter" },
    { text: "Admin Roles", icon: <SecurityIcon />, path: "/adminstration/adminRole", exact: "/adminstration/adminRole" },
    { text: "Onboard Workspace", icon: <WorkspaceIcon />, path: "/adminstration/onBoarding", exact: "/adminstration/onBoarding" },
  ];

  const drawerContent = (
    <Box sx={{ height: "100%", display: "flex", flexDirection: "column" }}>
      <Toolbar sx={{ display: "flex", flexDirection: "column", alignItems: desktopDrawerOpen ? "flex-start" : "center", justifyContent: "center", px: desktopDrawerOpen ? 3 : 1, py: 2.5, gap: 0.5 }}>
        {desktopDrawerOpen ? (
          <Box component="img" src="/logo/logobg.png" alt="EasyTechnoMed Logo" sx={{ height: 45, objectFit: "contain" }} />
        ) : (
          <ScienceIcon color="primary" sx={{ fontSize: 32 }} />
        )}
        {desktopDrawerOpen && (
          <Typography variant="caption" sx={{ fontWeight: 800, color: "primary.main", letterSpacing: "1px", textTransform: "uppercase" }}>
            SuperAdmin Console
          </Typography>
        )}
      </Toolbar>
      <Divider />
      <Box sx={{ overflow: "auto", flexGrow: 1, py: 2 }}>
        <List sx={{ px: desktopDrawerOpen ? 2 : 1 }}>
          {menuItems.map((item) => {
            const isActive = pathname === item.exact;
            
            return (
              <ListItem key={item.text} disablePadding sx={{ mb: 0.5 }}>
                <Tooltip title={!desktopDrawerOpen ? item.text : ""} placement="right" arrow>
                  <ListItemButton
                    onClick={() => {
                      setMobileOpen(false);
                      router.push(item.path);
                    }}
                    sx={{
                      borderRadius: "8px",
                      py: 1.2,
                      px: desktopDrawerOpen ? 2 : 0,
                      justifyContent: desktopDrawerOpen ? "initial" : "center",
                      backgroundColor: isActive ? "rgba(124, 58, 237, 0.08)" : "transparent",
                      color: isActive ? "primary.main" : "text.secondary",
                      "&:hover": {
                        backgroundColor: isActive ? "rgba(124, 58, 237, 0.12)" : "rgba(124, 58, 237, 0.04)",
                        color: isActive ? "primary.main" : "primary.main",
                        "& .MuiListItemIcon-root": {
                          color: "primary.main",
                        },
                      },
                    }}
                  >
                    <ListItemIcon sx={{
                      color: isActive ? "primary.main" : "text.secondary",
                      minWidth: 0,
                      mr: desktopDrawerOpen ? 2 : 0,
                      justifyContent: "center"
                    }}>
                      {item.icon}
                    </ListItemIcon>
                    {desktopDrawerOpen && (
                      <ListItemText
                        primary={item.text}
                        primaryTypographyProps={{
                          fontWeight: isActive ? 700 : 500,
                          fontSize: "0.9rem",
                        }}
                      />
                    )}
                  </ListItemButton>
                </Tooltip>
              </ListItem>
            );
          })}

          {/* Lead Management Group */}
          <Divider sx={{ my: 1.5 }} />
          {desktopDrawerOpen ? (
            <ListItem sx={{ px: 2, pb: 0.5 }}>
              <Typography variant="caption" sx={{ fontWeight: 800, color: "text.disabled", letterSpacing: "1px", textTransform: "uppercase" }}>
                Lead Management
              </Typography>
            </ListItem>
          ) : null}

          <ListItem disablePadding sx={{ mb: 0.5 }}>
            <Tooltip title={!desktopDrawerOpen ? "Leads" : ""} placement="right" arrow>
              <ListItemButton
                onClick={() => {
                  setMobileOpen(false);
                  router.push("/adminstration/leads");
                }}
                sx={{
                  borderRadius: "8px",
                  py: 1.2,
                  px: desktopDrawerOpen ? 2 : 0,
                  justifyContent: desktopDrawerOpen ? "initial" : "center",
                  backgroundColor: pathname === "/adminstration/leads" ? "rgba(124, 58, 237, 0.08)" : "transparent",
                  color: pathname === "/adminstration/leads" ? "primary.main" : "text.secondary",
                  "&:hover": {
                    backgroundColor: "rgba(124, 58, 237, 0.12)",
                    color: "primary.main",
                    "& .MuiListItemIcon-root": { color: "primary.main" }
                  },
                  "& .MuiListItemIcon-root": { color: pathname === "/adminstration/leads" ? "primary.main" : "text.secondary", minWidth: 0, mr: desktopDrawerOpen ? 2 : 0, justifyContent: "center" }
                }}
              >
                <ListItemIcon><TrendingUpIcon /></ListItemIcon>
                {desktopDrawerOpen && (
                  <ListItemText
                    primary="Leads"
                    primaryTypographyProps={{ fontWeight: pathname === "/adminstration/leads" ? 700 : 500, fontSize: "0.9rem" }}
                  />
                )}
              </ListItemButton>
            </Tooltip>
          </ListItem>

          <ListItem disablePadding sx={{ mb: 0.5 }}>
            <Tooltip title={!desktopDrawerOpen ? "Contact Inquiries" : ""} placement="right" arrow>
              <ListItemButton
                onClick={() => {
                  setMobileOpen(false);
                  router.push("/adminstration/contact");
                }}
                sx={{
                  borderRadius: "8px",
                  py: 1.2,
                  px: desktopDrawerOpen ? 2 : 0,
                  justifyContent: desktopDrawerOpen ? "initial" : "center",
                  backgroundColor: pathname === "/adminstration/contact" ? "rgba(124, 58, 237, 0.08)" : "transparent",
                  color: pathname === "/adminstration/contact" ? "primary.main" : "text.secondary",
                  "&:hover": {
                    backgroundColor: "rgba(124, 58, 237, 0.12)",
                    color: "primary.main",
                    "& .MuiListItemIcon-root": { color: "primary.main" }
                  },
                  "& .MuiListItemIcon-root": { color: pathname === "/adminstration/contact" ? "primary.main" : "text.secondary", minWidth: 0, mr: desktopDrawerOpen ? 2 : 0, justifyContent: "center" }
                }}
              >
                <ListItemIcon><EmailIcon /></ListItemIcon>
                {desktopDrawerOpen && (
                  <ListItemText
                    primary="Contact Inquiries"
                    primaryTypographyProps={{ fontWeight: pathname === "/adminstration/contact" ? 700 : 500, fontSize: "0.9rem" }}
                  />
                )}
              </ListItemButton>
            </Tooltip>
          </ListItem>
        </List>
      </Box>
      <Divider />
      <Box sx={{ p: 2, bgcolor: "rgba(0,0,0,0.02)", display: "flex", alignItems: "center", gap: 1.5, justifyContent: desktopDrawerOpen ? "initial" : "center" }}>
        <Avatar sx={{ bgcolor: "primary.main", color: "primary.contrastText", width: 40, height: 40, fontWeight: 700 }}>
          S
        </Avatar>
        {desktopDrawerOpen && (
          <Box sx={{ minWidth: 0, flexGrow: 1 }}>
            <Typography variant="subtitle2" noWrap sx={{ fontWeight: 700, color: "text.primary" }}>
              System Admin
            </Typography>
            <Typography variant="caption" noWrap sx={{ display: "block", color: "text.secondary" }}>
              superadmin@easytechnomed.com
            </Typography>
          </Box>
        )}
      </Box>
    </Box>
  );

  if (isPublicPage) {
    return (
      <ThemeProvider theme={lightPurpleTheme}>
        <CssBaseline />
        <NextTopLoader color="#7c3aed" showSpinner={false} height={3} />
        {children}
      </ThemeProvider>
    );
  }

  return (
    <TrackingProvider type="superAdmin">
      <ThemeProvider theme={lightPurpleTheme}>
        <CssBaseline />
        <NextTopLoader color="#7c3aed" showSpinner={false} height={3} />
        <Box sx={{ display: "flex", minHeight: "100vh", bgcolor: "background.default" }}>
        
        {/* Sidebar Navigation */}
        <Box component="nav" sx={{ width: { md: desktopDrawerOpen ? drawerWidth : 70 }, flexShrink: { md: 0 }, transition: "width 0.2s" }}>
          {/* Mobile Drawer */}
          <Drawer
            variant="temporary"
            open={mobileOpen}
            onClose={() => setMobileOpen(false)}
            ModalProps={{ keepMounted: true }}
            sx={{
              display: { xs: "block", md: "none" },
              "& .MuiDrawer-paper": { boxSizing: "border-box", width: drawerWidth, borderRight: "1px solid", borderColor: "divider" },
            }}
          >
            {drawerContent}
          </Drawer>

          {/* Desktop Drawer */}
          <Drawer
            variant="permanent"
            sx={{
              display: { xs: "none", md: "block" },
              "& .MuiDrawer-paper": { 
                boxSizing: "border-box", 
                width: desktopDrawerOpen ? drawerWidth : 70, 
                borderRight: "1px solid", 
                borderColor: "divider",
                transition: "width 0.2s",
                overflowX: "hidden"
              },
            }}
            open
          >
            {drawerContent}
          </Drawer>
        </Box>

        {/* Right Area */}
        <Box sx={{ flexGrow: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
          {/* Header AppBar */}
          <AppBar
            position="sticky"
            color="inherit"
            elevation={0}
            sx={{
              top: 0,
              zIndex: (theme) => theme.zIndex.appBar,
              borderBottom: "1px solid",
              borderColor: "divider",
              bgcolor: "background.paper",
            }}
          >
            <Toolbar sx={{ justifyContent: "space-between", px: { xs: 2, md: 4 } }}>
              <Box sx={{ display: "flex", alignItems: "center" }}>
                <IconButton
                  color="inherit"
                  edge="start"
                  onClick={() => setMobileOpen(!mobileOpen)}
                  sx={{ mr: 2, display: { md: "none" } }}
                >
                  <MenuIcon />
                </IconButton>
                <IconButton
                  color="inherit"
                  edge="start"
                  onClick={() => setDesktopDrawerOpen(!desktopDrawerOpen)}
                  sx={{ mr: 2, display: { xs: "none", md: "inline-flex" } }}
                >
                  <MenuIcon />
                </IconButton>
                <Typography variant="h6" noWrap sx={{ fontWeight: 800, fontSize: "1.25rem", color: "primary.main" }}>
                  SuperAdmin Console
                </Typography>
              </Box>

              <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                <Box sx={{ display: { xs: "none", sm: "flex" }, alignItems: "center", gap: 1.5 }}>
                  <Avatar sx={{ bgcolor: "primary.main", color: "primary.contrastText", width: 32, height: 32, fontSize: "0.875rem", fontWeight: 700 }}>
                    S
                  </Avatar>
                  <Typography variant="subtitle2" sx={{ fontWeight: 700, color: "text.primary" }}>
                    System Admin
                  </Typography>
                </Box>
                <Divider orientation="vertical" variant="middle" flexItem sx={{ display: { xs: "none", sm: "block" } }} />
                <Button
                  variant="outlined"
                  color="error"
                  startIcon={<LogoutIcon />}
                  onClick={handleLogout}
                  sx={{ fontWeight: 600 }}
                >
                  Logout
                </Button>
              </Box>
            </Toolbar>
          </AppBar>

          {/* Main content body */}
          <Box sx={{ flexGrow: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
            {children}
          </Box>
        </Box>
      </Box>
    </ThemeProvider>
  </TrackingProvider>
  );
}
