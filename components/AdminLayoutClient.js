"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { TrackingProvider } from "@/app/context/TrackingContext";
import {
  Box,
  Drawer,
  AppBar,
  Toolbar,
  List,
  Typography,
  Divider,
  IconButton,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Avatar,
  Menu,
  MenuItem,
  MenuList,
  Button,
  useMediaQuery,
  ThemeProvider,
  createTheme,
  CssBaseline,
  Popper,
  Paper
} from "@mui/material";
import {
  Menu as MenuIcon,
  ChevronLeft as ChevronLeftIcon,
  Dashboard as DashboardIcon,
  AppRegistration as RegisterIcon,
  Assignment as ReportIcon,
  SupervisorAccount as DoctorIcon,
  CheckCircle as ApprovalsIcon,
  Logout as LogoutIcon,
  Person as PersonIcon,
  Settings as SettingsIcon,
  People as PeopleIcon
} from "@mui/icons-material";

const drawerWidth = 260;

// Create a custom MUI theme matching the app's clean medical theme
const theme = createTheme({
  palette: {
    primary: {
      main: "#0f766e", // Teal 700
      light: "#14b8a6", // Teal 500
      dark: "#115e59", // Teal 800
      contrastText: "#fff",
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

export default function AdminLayoutClient({ admin, children }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [desktopOpen, setDesktopOpen] = useState(true);
  const [isClosing, setIsClosing] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);
  const [hoverAnchorEl, setHoverAnchorEl] = useState(null);
  const [hoveredItem, setHoveredItem] = useState(null);
  const hoverTimeoutRef = React.useRef(null);

  const handleItemHover = (event, item) => {
    if (!isDrawerExpanded && item.subItems) {
      if (hoverTimeoutRef.current) {
        clearTimeout(hoverTimeoutRef.current);
      }
      setHoverAnchorEl(event.currentTarget);
      setHoveredItem(item);
    }
  };

  const handleItemLeave = () => {
    if (!isDrawerExpanded) {
      hoverTimeoutRef.current = setTimeout(() => {
        setHoverAnchorEl(null);
        setHoveredItem(null);
      }, 300);
    }
  };

  const handleMenuEnter = () => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
    }
  };

  const handleMenuLeave = () => {
    setHoverAnchorEl(null);
    setHoveredItem(null);
  };

  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
    if (admin) {
      sessionStorage.setItem("admin_profile", JSON.stringify(admin));
    }
  }, [admin]);

  const isMdUp = useMediaQuery(theme.breakpoints.up("md"));

  const currentDrawerWidth = isMdUp ? (desktopOpen ? drawerWidth : 72) : drawerWidth;
  const isDrawerExpanded = isMdUp ? desktopOpen : true;

  const handleDrawerClose = () => {
    setIsClosing(true);
    setMobileOpen(false);
  };

  const handleDrawerTransitionEnd = () => {
    setIsClosing(false);
  };

  const handleDrawerToggle = () => {
    if (isMdUp) {
      setDesktopOpen(!desktopOpen);
    } else {
      if (!isClosing) {
        setMobileOpen(!mobileOpen);
      }
    }
  };

  const handleProfileMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleProfileMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = async () => {
    handleProfileMenuClose();
    const res = await fetch("/api/auth/logout", {
      method: "POST",
    }).then((r) => r.json());
    if (res?.success) {
      router.push(res.redirect);
    }
  };

  const menuItems = [
    { text: "Dashboard", path: "/dashboard", icon: <DashboardIcon /> },
    { text: "Patient Registration", path: "/registration", icon: <RegisterIcon /> },
    { text: "Test Reports", path: "/test-report", icon: <ReportIcon /> },
    { text: "Dr. Referral Summary", path: "/doctor-summary", icon: <DoctorIcon /> },
    // { text: "Manage Approvals", path: "/userApprove", icon: <ApprovalsIcon /> },
    { text: "Manage Members", path: "/members", icon: <PeopleIcon /> },
    {
      text: "System Settings",
      path: "/settings",
      icon: <SettingsIcon />,
      subItems: [
        { text: "Profile Setting", path: "/settings?tab=profile" },
        { text: "Address Setting", path: "/settings/address" },
        { text: "Test & Parameter", path: "/settings?tab=tests" },
        { text: "PDF Frame Setting", path: "/settings?tab=pdf" },
      ]
    },
  ];

  const drawerContent = (
    <Box sx={{ height: "100%", display: "flex", flexDirection: "column", overflowX: "hidden" }}>
      <Toolbar sx={{ display: "flex", alignItems: "center", justifyContent: isDrawerExpanded ? "space-between" : "center", px: [2] }}>
        {isDrawerExpanded ? (
          <Box component="img" src="/logo/logobg.png" alt="PathLab Logo" sx={{ height: 48, width: "auto", maxWidth: "100%", borderRadius: "4px" }} />
        ) : (
          <Box component="img" src="/android-chrome-512x512.png" alt="Logo" sx={{ height: 36, width: 36, borderRadius: "6px" }} />
        )}

        {mounted && !isMdUp && (
          <IconButton onClick={handleDrawerClose}>
            <ChevronLeftIcon />
          </IconButton>
        )}
      </Toolbar>
      <Divider />
      <Box sx={{ overflowY: "auto", overflowX: "hidden", flexGrow: 1, py: 2 }}>
        <List sx={{ px: isDrawerExpanded ? 2 : 1 }}>
          {menuItems.map((item) => {
            const isAdmin = pathname.startsWith("/admin");
            const cleanPath = isAdmin ? pathname.slice(6) || "/" : pathname;
            const isActive = cleanPath === item.path || cleanPath.startsWith(item.path + "/");
            const itemHref = isAdmin ? `/admin${item.path}` : item.path;
            return (
              <React.Fragment key={item.text}>
                <ListItem disablePadding sx={{ mb: 0.5 }}>
                  <Link href={itemHref} style={{ textDecoration: "none", width: "100%" }}>
                    <ListItemButton
                      onClick={() => mounted && !isMdUp && handleDrawerClose()}
                      onMouseEnter={(e) => handleItemHover(e, item)}
                      onMouseLeave={handleItemLeave}
                      sx={{
                        borderRadius: "8px",
                        py: 1.2,
                        px: 2.5,
                        backgroundColor: isActive ? "primary.light" : "transparent",
                        color: isActive ? "primary.contrastText" : "text.secondary",
                        justifyContent: isDrawerExpanded ? "initial" : "center",
                        "&:hover": {
                          backgroundColor: isActive ? "primary.main" : "rgba(15, 118, 110, 0.08)",
                          color: isActive ? "primary.contrastText" : "primary.main",
                          "& .MuiListItemIcon-root": {
                            color: isActive ? "primary.contrastText" : "primary.main",
                          },
                        },
                      }}
                    >
                      <ListItemIcon
                        sx={{
                          color: isActive ? "primary.contrastText" : "text.secondary",
                          display: "flex",
                          justifyContent: "center",
                          minWidth: 0,
                          mr: isDrawerExpanded ? 3 : "auto",
                        }}
                      >
                        {item.icon}
                      </ListItemIcon>
                      <ListItemText
                        primary={item.text}
                        sx={{
                          opacity: isDrawerExpanded ? 1 : 0,
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          width: isDrawerExpanded ? "auto" : 0,
                          transition: (theme) =>
                            theme.transitions.create("opacity", {
                              easing: theme.transitions.easing.sharp,
                              duration: theme.transitions.duration.shorter,
                            }),
                        }}
                        primaryTypographyProps={{
                          fontWeight: isActive ? 700 : 500,
                          fontSize: "0.9rem",
                        }}
                      />
                    </ListItemButton>
                  </Link>
                </ListItem>
                {isDrawerExpanded && item.subItems && (
                  <List component="div" disablePadding sx={{ pl: 4, mb: 1 }}>
                    {item.subItems.map((sub) => {
                      const searchParamsStr = sub.path.split("?")[1] || "";
                      const tabName = searchParamsStr.split("=")[1] || "";
                      const currentTab = searchParams.get("tab") || (cleanPath === "/settings" ? "profile" : "");
                      const isSubActive = sub.path.includes("?")
                        ? (cleanPath === "/settings" && currentTab === tabName)
                        : (cleanPath === sub.path || cleanPath.startsWith(sub.path + "/"));
                      const subHref = isAdmin ? `/admin${sub.path}` : sub.path;

                      return (
                        <ListItem key={sub.text} disablePadding sx={{ mb: 0.5 }}>
                          <Link href={subHref} style={{ textDecoration: "none", width: "100%" }}>
                            <ListItemButton
                              onClick={() => mounted && !isMdUp && handleDrawerClose()}
                              sx={{
                                borderRadius: "6px",
                                py: 0.6,
                                px: 2,
                                backgroundColor: isSubActive ? "rgba(15, 118, 110, 0.08)" : "transparent",
                                color: isSubActive ? "primary.main" : "text.secondary",
                                "&:hover": {
                                  backgroundColor: "rgba(15, 118, 110, 0.04)",
                                  color: "primary.main",
                                },
                              }}
                            >
                              <ListItemText
                                primary={sub.text}
                                primaryTypographyProps={{
                                  fontWeight: isSubActive ? 700 : 500,
                                  fontSize: "0.825rem",
                                }}
                              />
                            </ListItemButton>
                          </Link>
                        </ListItem>
                      );
                    })}
                  </List>
                )}
              </React.Fragment>
            );
          })}
        </List>
      </Box>
      <Divider />
      {/* Bottom Profile Info */}
      <Box sx={{ p: 2, backgroundColor: "grey.50", display: "flex", alignItems: "center", gap: 1.5 }}>
        <Avatar sx={{ bgcolor: "primary.main", width: 40, height: 40 }}>
          {admin?.name?.charAt(0).toUpperCase() || "A"}
        </Avatar>
        <Box sx={{ minWidth: 0, flexGrow: 1 }}>
          <Typography variant="subtitle2" noWrap sx={{ fontWeight: 700, color: "text.primary" }}>
            {admin?.name || "System Admin"}
          </Typography>
          <Typography variant="caption" noWrap sx={{ display: "block", color: "text.secondary" }}>
            {admin?.email || "admin@pathlab.com"}
          </Typography>
        </Box>
      </Box>
    </Box>
  );

  const getPageTitle = () => {
    const matched = menuItems.find((item) => pathname === item.path);
    return matched ? matched.text : "Admin Workspace";
  };

  return (
    <TrackingProvider type="admin">
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <Box sx={{ display: "flex", minHeight: "100vh" }}>
        {/* AppBar */}
        <AppBar
          position="fixed"
          sx={{
            width: { md: `calc(100% - ${currentDrawerWidth}px)` },
            ml: { md: `${currentDrawerWidth}px` },
            backgroundColor: "background.paper",
            color: "text.primary",
            boxShadow: "0 1px 3px 0 rgba(0,0,0,0.05)",
            borderBottom: "1px solid",
            borderColor: "divider",
            transition: (theme) => theme.transitions.create(["width", "margin"], {
              easing: theme.transitions.easing.sharp,
              duration: theme.transitions.duration.enteringScreen,
            }),
          }}
        >
          <Toolbar sx={{ justifyContent: "space-between", px: 3 }}>
            <Box sx={{ display: "flex", alignItems: "center" }}>
              <IconButton
                color="inherit"
                aria-label="open drawer"
                edge="start"
                onClick={handleDrawerToggle}
                sx={{ mr: 2 }}
              >
                <MenuIcon />
              </IconButton>
              <Typography variant="h6" noWrap component="div" sx={{ fontWeight: 700, fontSize: "1.1rem" }}>
                {getPageTitle()}
              </Typography>
            </Box>

            {/* Profile Dropdown */}
            <Box>
              <Button
                onClick={handleProfileMenuOpen}
                startIcon={
                  <Avatar sx={{ bgcolor: "primary.main", width: 32, height: 32, fontSize: "0.875rem" }}>
                    {admin?.name?.charAt(0).toUpperCase() || "A"}
                  </Avatar>
                }
                sx={{ color: "text.primary", px: 1.5, py: 0.5 }}
              >
                <Typography variant="subtitle2" sx={{ display: { xs: "none", sm: "block" }, fontWeight: 600, ml: 1 }}>
                  {admin?.name || "Admin"}
                </Typography>
              </Button>
              <Menu
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={handleProfileMenuClose}
                transformOrigin={{ horizontal: "right", vertical: "top" }}
                anchorOrigin={{ horizontal: "right", vertical: "bottom" }}
                PaperProps={{
                  sx: {
                    mt: 1.5,
                    boxShadow: "0 4px 20px 0 rgba(0,0,0,0.08)",
                    border: "1px solid",
                    borderColor: "divider",
                    borderRadius: 2,
                    minWidth: 180,
                  },
                }}
              >
                <Box sx={{ px: 2, py: 1.5 }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                    {admin?.name || "System Admin"}
                  </Typography>
                  <Typography variant="caption" sx={{ color: "text.secondary" }}>
                    Role: {admin?.role?.name || "Admin"}
                  </Typography>
                </Box>
                <Divider />
                <MenuItem onClick={handleLogout} sx={{ py: 1.2, color: "error.main", gap: 1 }}>
                  <LogoutIcon fontSize="small" />
                  Logout
                </MenuItem>
              </Menu>
            </Box>
          </Toolbar>
        </AppBar>

        {/* Sidebar Drawer */}
        <Box
          component="nav"
          sx={{
            width: { md: currentDrawerWidth },
            flexShrink: { md: 0 },
            transition: (theme) => theme.transitions.create("width", {
              easing: theme.transitions.easing.sharp,
              duration: theme.transitions.duration.enteringScreen,
            })
          }}
          aria-label="mailbox folders"
        >
          {/* Temporary Drawer for Mobile */}
          <Drawer
            variant="temporary"
            open={mobileOpen}
            onTransitionEnd={handleDrawerTransitionEnd}
            onClose={handleDrawerClose}
            ModalProps={{
              keepMounted: true, // Better open performance on mobile.
            }}
            sx={{
              display: { xs: "block", md: "none" },
              "& .MuiDrawer-paper": { boxSizing: "border-box", width: drawerWidth, borderRight: "1px solid", borderColor: "divider" },
            }}
          >
            {drawerContent}
          </Drawer>
          {/* Permanent Drawer for Desktop */}
          <Drawer
            variant="permanent"
            sx={{
              display: { xs: "none", md: "block" },
              "& .MuiDrawer-paper": {
                boxSizing: "border-box",
                width: currentDrawerWidth,
                borderRight: "1px solid",
                borderColor: "divider",
                overflowX: "hidden",
                transition: (theme) => theme.transitions.create("width", {
                  easing: theme.transitions.easing.sharp,
                  duration: theme.transitions.duration.enteringScreen,
                }),
              },
            }}
            open
          >
            {drawerContent}
          </Drawer>
        </Box>

        {/* Main Content Area */}
        <Box
          component="main"
          sx={{
            flexGrow: 1,
            p: { xs: 1.5, sm: 3 },
            width: { md: `calc(100% - ${currentDrawerWidth}px)` },
            minWidth: 0,
            mt: "64px",
            backgroundColor: "background.default",
            minHeight: "calc(100vh - 64px)",
            transition: (theme) => theme.transitions.create(["width", "margin"], {
              easing: theme.transitions.easing.sharp,
              duration: theme.transitions.duration.enteringScreen,
            }),
          }}
        >
          {children}
        </Box>

        {/* Floating Submenu for Collapsed Drawer */}
        <Popper
          open={Boolean(hoverAnchorEl)}
          anchorEl={hoverAnchorEl}
          placement="right-start"
          style={{ zIndex: 1400 }}
        >
          <Paper
            onMouseEnter={handleMenuEnter}
            onMouseLeave={handleMenuLeave}
            sx={{
              boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
              border: "1px solid",
              borderColor: "divider",
              minWidth: 180,
              py: 0.5,
              ml: 0.5
            }}
          >
            <Box sx={{ px: 2, py: 0.8, bgcolor: "rgba(15, 118, 110, 0.04)" }}>
              <Typography variant="caption" sx={{ fontWeight: 700, color: "primary.main", textTransform: "uppercase", letterSpacing: 0.5 }}>
                {hoveredItem?.text}
              </Typography>
            </Box>
            <Divider sx={{ opacity: 0.6 }} />
            <MenuList>
              {hoveredItem?.subItems?.map((sub) => {
                const isAdmin = pathname.startsWith("/admin");
                const cleanPath = isAdmin ? pathname.slice(6) || "/" : pathname;
                const searchParamsStr = sub.path.split("?")[1] || "";
                const tabName = searchParamsStr.split("=")[1] || "";
                const currentTab = searchParams.get("tab") || (cleanPath === "/settings" ? "profile" : "");
                const isSubActive = sub.path.includes("?")
                  ? (cleanPath === "/settings" && currentTab === tabName)
                  : (cleanPath === sub.path || cleanPath.startsWith(sub.path + "/"));
                const subHref = isAdmin ? `/admin${sub.path}` : sub.path;

                return (
                  <MenuItem
                    key={sub.text}
                    onClick={() => {
                      handleMenuLeave();
                      router.push(subHref);
                    }}
                    sx={{
                      py: 1,
                      px: 2,
                      fontSize: "0.825rem",
                      fontWeight: isSubActive ? 700 : 500,
                      color: isSubActive ? "primary.main" : "text.secondary",
                      backgroundColor: isSubActive ? "rgba(15, 118, 110, 0.08)" : "transparent",
                      "&:hover": {
                        backgroundColor: "rgba(15, 118, 110, 0.04)",
                        color: "primary.main"
                      }
                    }}
                  >
                    {sub.text}
                  </MenuItem>
                );
              })}
            </MenuList>
          </Paper>
        </Popper>
      </Box>
    </ThemeProvider>
  </TrackingProvider>
  );
}
