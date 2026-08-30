"use client";

import React, { useState, useEffect, useCallback, useRef, useMemo } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { TrackingProvider } from "@/app/context/TrackingContext";
import packageJson from "@/package.json";
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

const STATIC_MENU_ITEMS = [
  {
    text: "Dashboard",
    path: "/dashboard",
    icon: <DashboardIcon />,
    required: ["DASHBOARD_VIEW"]
  },
  {
    text: "Patient Registration",
    path: "/registration",
    icon: <RegisterIcon />,
    required: ["REGISTRATION_READ", "REGISTRATION_WRITE"]
  },
  {
    text: "Test Reports",
    path: "/test-report",
    icon: <ReportIcon />,
    required: ["REGISTRATION_READ", "REGISTRATION_WRITE"]
  },
  {
    text: "Dr. Referral Summary",
    path: "/doctor-summary",
    icon: <DoctorIcon />,
    required: ["DOCTOR_READ", "DOCTOR_WRITE"]
  },
  {
    text: "Manage Members",
    path: "/members",
    icon: <PeopleIcon />,
    required: ["MEMBER_READ", "MEMBER_WRITE"]
  },
  {
    text: "System Settings",
    path: "/settings",
    icon: <SettingsIcon />,
    required: ["SETTINGS_READ", "SETTINGS_WRITE", "TEST_READ", "TEST_WRITE"],
    subItems: [
      { text: "Profile Setting", path: "/settings?tab=profile", required: ["SETTINGS_READ", "SETTINGS_WRITE"] },
      { text: "Address Setting", path: "/settings/address", required: ["SETTINGS_READ", "SETTINGS_WRITE"] },
      { text: "Test & Parameter", path: "/settings/tests", required: ["TEST_READ", "TEST_WRITE"] },
      { text: "PDF Frame Setting", path: "/settings/pdf", required: ["SETTINGS_READ", "SETTINGS_WRITE"] },
      { text: "Subscription & Invoices", path: "/settings/payments", required: ["SETTINGS_READ", "SETTINGS_WRITE"] },
    ]
  },
];

// Create a custom MUI theme matching the app's clean medical theme
const theme = createTheme({
  palette: {
    primary: {
      main: "#0f766e", // Deep Teal Primary
      light: "#14b8a6",
      dark: "#115e59",
      contrastText: "#fff",
    },
    secondary: {
      main: "#10b981", // Emerald 500
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
      fontWeight: 700,
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          boxShadow: "none !important",
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 10,
          boxShadow: "none !important",
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

const getExpiryMessage = (expireAt) => {
  if (!expireAt) return null;
  const expiry = new Date(expireAt);
  const now = new Date();
  const diffMs = expiry.getTime() - now.getTime();

  if (diffMs <= 0) {
    return { text: "Expired", color: "error.main", severity: "error" };
  }

  // Calculate remaining days based on local calendar dates (timezone-aware system time)
  const expiryDateOnly = new Date(expiry.getFullYear(), expiry.getMonth(), expiry.getDate());
  const nowDateOnly = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const oneDayMs = 24 * 60 * 60 * 1000;
  const diffDays = Math.round((expiryDateOnly - nowDateOnly) / oneDayMs);

  if (diffDays === 0) {
    const diffHours = diffMs / (1000 * 60 * 60);
    const hours = Math.floor(diffHours);
    const minutes = Math.floor((diffHours - hours) * 60);
    return {
      text: `${hours}h ${minutes}m left`,
      color: "error.main",
      severity: "warning"
    };
  }

  return {
    text: `${diffDays} ${diffDays === 1 ? "day" : "days"} left`,
    color: diffDays <= 7 ? "warning.main" : "text.secondary",
    severity: diffDays <= 7 ? "warning" : "info"
  };
};

export default function AdminLayoutClient({ admin, children }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [desktopOpen, setDesktopOpen] = useState(true);
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

      const isAdmin = pathname.startsWith("/admin");
      const cleanPath = isAdmin ? pathname.slice(6) || "/" : pathname;

      const roleUpper = (admin.role?.name || admin.role || "").toUpperCase();
      const userPerms = admin.permissions || [];
      const hasAll = roleUpper === "ADMIN" || roleUpper === "OWNER" || userPerms.includes("ALL");

      if (!hasAll) {
        let hasAccess = true;

        if (cleanPath === "/" || cleanPath === "/dashboard") {
          hasAccess = userPerms.includes("DASHBOARD_VIEW");
        } else if (cleanPath.startsWith("/registration")) {
          hasAccess = userPerms.includes("REGISTRATION_READ") || userPerms.includes("REGISTRATION_WRITE");
        } else if (cleanPath.startsWith("/test-report")) {
          hasAccess = userPerms.includes("REGISTRATION_READ") || userPerms.includes("REGISTRATION_WRITE");
        } else if (cleanPath.startsWith("/doctor-summary")) {
          hasAccess = userPerms.includes("DOCTOR_READ") || userPerms.includes("DOCTOR_WRITE");
        } else if (cleanPath.startsWith("/members")) {
          hasAccess = userPerms.includes("MEMBER_READ") || userPerms.includes("MEMBER_WRITE");
        } else if (cleanPath.startsWith("/settings")) {
          hasAccess = userPerms.includes("SETTINGS_READ") || userPerms.includes("SETTINGS_WRITE") ||
            userPerms.includes("TEST_READ") || userPerms.includes("TEST_WRITE");
        }

        if (!hasAccess) {
          // Find first permitted route
          let targetPath = null;
          if (userPerms.includes("DASHBOARD_VIEW")) {
            targetPath = "/dashboard";
          } else if (userPerms.includes("REGISTRATION_READ") || userPerms.includes("REGISTRATION_WRITE")) {
            targetPath = "/registration";
          } else if (userPerms.includes("DOCTOR_READ") || userPerms.includes("DOCTOR_WRITE")) {
            targetPath = "/doctor-summary";
          } else if (userPerms.includes("MEMBER_READ") || userPerms.includes("MEMBER_WRITE")) {
            targetPath = "/members";
          } else if (
            userPerms.includes("SETTINGS_READ") || userPerms.includes("SETTINGS_WRITE") ||
            userPerms.includes("TEST_READ") || userPerms.includes("TEST_WRITE")
          ) {
            targetPath = "/settings";
          }

          if (targetPath) {
            router.replace(isAdmin ? `/admin${targetPath}` : targetPath);
          } else {
            router.replace("/auth/login?error=unauthorized");
          }
        }
      }
    }
  }, [admin, pathname, router, mounted]);

  const isMdUp = useMediaQuery(theme.breakpoints.up("md"));

  const currentDrawerWidth = isMdUp ? (desktopOpen ? drawerWidth : 72) : drawerWidth;
  const isDrawerExpanded = isMdUp ? desktopOpen : true;
  const lastOpenTimeRef = useRef(0);

  const handleDrawerClose = (event, reason) => {
    // Prevent mobile touch bleed-through / ghost click on freshly mounted backdrop
    if (reason === "backdropClick" && Date.now() - lastOpenTimeRef.current < 500) {
      return;
    }
    if (typeof document !== "undefined" && document.activeElement && typeof document.activeElement.blur === "function") {
      document.activeElement.blur();
    }
    setMobileOpen(false);
  };

  const handleDrawerToggle = (e) => {
    if (e && typeof e.stopPropagation === "function") {
      e.stopPropagation();
    }
    if (typeof document !== "undefined" && document.activeElement && typeof document.activeElement.blur === "function") {
      document.activeElement.blur();
    }
    const isMobile = typeof window !== "undefined" ? window.innerWidth < 900 : !isMdUp;
    if (isMobile) {
      lastOpenTimeRef.current = Date.now();
      setMobileOpen((prev) => !prev);
    } else {
      setDesktopOpen((prev) => !prev);
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

  const hasPermission = (requiredPermissions) => {
    if (!admin) return false;
    const roleUpper = (admin.role?.name || admin.role || "").toUpperCase();
    const userPerms = admin.permissions || [];

    if (roleUpper === "ADMIN" || roleUpper === "OWNER" || userPerms.includes("ALL")) {
      return true;
    }

    return requiredPermissions.some(perm => userPerms.includes(perm));
  };

  const filteredMenuItems = useMemo(() => {
    return STATIC_MENU_ITEMS
      .filter(item => !item.required || hasPermission(item.required))
      .map(item => {
        if (item.subItems) {
          return {
            ...item,
            subItems: item.subItems.filter(sub => !sub.required || hasPermission(sub.required))
          };
        }
        return item;
      });
  }, [admin]);

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
          {filteredMenuItems.map((item) => {
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
                        backgroundColor: isActive ? "#0f766e" : "transparent",
                        color: isActive ? "#FFFFFF" : "text.secondary",
                        justifyContent: isDrawerExpanded ? "initial" : "center",
                        "&:hover": {
                          backgroundColor: isActive ? "#115e59" : "rgba(15, 118, 110, 0.1)",
                          color: isActive ? "#FFFFFF" : "#0f766e",
                          "& .MuiListItemIcon-root": {
                            color: isActive ? "#FFFFFF" : "#0f766e",
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
                        slotProps={{
                          primary: {
                            fontWeight: isActive ? 700 : 500,
                            fontSize: "0.9rem",
                          }
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
                                backgroundColor: isSubActive ? "rgba(15, 118, 110, 0.15)" : "transparent",
                                color: isSubActive ? "#0f766e" : "text.secondary",
                                "&:hover": {
                                  backgroundColor: "rgba(15, 118, 110, 0.08)",
                                  color: "#0f766e",
                                },
                              }}
                            >
                              <ListItemText
                                primary={sub.text}
                                slotProps={{
                                  primary: {
                                    fontWeight: isSubActive ? 700 : 500,
                                    fontSize: "0.825rem",
                                  }
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
      <Box sx={{ p: 2, pb: 0, backgroundColor: "grey.50", display: "flex", flexDirection: "column", gap: 1 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, justifyContent: isDrawerExpanded ? "initial" : "center" }}>
          <Avatar sx={{ bgcolor: "primary.main", width: 40, height: 40 }}>
            {admin?.name?.charAt(0).toUpperCase() || "A"}
          </Avatar>
          {isDrawerExpanded && (
            <Box sx={{ minWidth: 0, flexGrow: 1 }}>
              <Typography variant="subtitle2" noWrap sx={{ fontWeight: 700, color: "text.primary" }}>
                {admin?.name || "System Admin"}
              </Typography>
              <Typography variant="caption" noWrap sx={{ display: "block", color: "text.secondary" }}>
                {admin?.email || "admin@pathlab.com"}
              </Typography>
            </Box>
          )}
        </Box>
        {isDrawerExpanded ? (
          <Box sx={{ mt: 0.5, display: "flex", gap: 1, alignItems: "stretch" }}>
            {admin?.expireAt && (() => {
              const expiryInfo = getExpiryMessage(admin.expireAt);
              if (!expiryInfo) return null;
              return (
                <Box
                  sx={{
                    flex: 1.1,
                    px: 1,
                    py: 0.5,
                    borderRadius: 1.5,
                    bgcolor: expiryInfo.severity === "error"
                      ? "#fee2e2"
                      : expiryInfo.severity === "warning"
                        ? "#fffbeb"
                        : "#f1f5f9",
                    border: "1px solid",
                    borderColor: expiryInfo.severity === "error"
                      ? "#fca5a5"
                      : expiryInfo.severity === "warning"
                        ? "#fcd34d"
                        : "#cbd5e1",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "center",
                    alignItems: "center",
                    textAlign: "center"
                  }}
                >
                  <Typography variant="caption" sx={{ fontWeight: 700, color: "text.primary", fontSize: "0.62rem", lineHeight: 1.1 }}>
                    Ends in:
                  </Typography>
                  <Typography
                    variant="caption"
                    sx={{
                      fontWeight: 800,
                      color: expiryInfo.severity === "error"
                        ? "#991b1b"
                        : expiryInfo.severity === "warning"
                          ? "#92400e"
                          : "#334155",
                      fontSize: "0.65rem",
                      lineHeight: 1.1
                    }}
                  >
                    {expiryInfo.text}
                  </Typography>
                </Box>
              );
            })()}
            <Button
              variant="outlined"
              color="error"
              size="small"
              startIcon={<LogoutIcon />}
              onClick={handleLogout}
              sx={{
                flex: 1,
                py: 0.5,
                borderRadius: 1.5,
                fontWeight: 700,
                fontSize: "0.8rem",
                justifyContent: "center",
                borderColor: "rgba(239, 68, 68, 0.4)",
                "& .MuiButton-startIcon": {
                  marginRight: "4px"
                }
              }}
            >
              Logout
            </Button>
          </Box>
        ) : (
          <Button
            variant="outlined"
            color="error"
            size="small"
            startIcon={<LogoutIcon />}
            onClick={handleLogout}
            sx={{
              mt: 0,
              py: 0,
              minWidth: 0,
              px: 0,
              borderRadius: 1.5,
              fontWeight: 700,
              fontSize: "0.8rem",
              justifyContent: "center",
              borderColor: "rgba(239, 68, 68, 0.4)",
              "& .MuiButton-startIcon": {
                margin: 0
              }
            }}
          />
        )}
        {/* App Version at bottom */}
        {packageJson?.version && (
          <Typography
            variant="caption"
            sx={{
              display: "block",
              textAlign: "center",
              fontSize: "0.68rem",
              fontWeight: 600,
              color: "text.disabled",
              letterSpacing: "0.02em",
              mt: 0
            }}
          >
            v{packageJson.version}
          </Typography>
        )}
      </Box>
    </Box >
  );

  const getPageTitle = () => {
    const matched = STATIC_MENU_ITEMS.find((item) => pathname === item.path);
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
            elevation={0}
            sx={{
              width: { md: `calc(100% - ${currentDrawerWidth}px)` },
              ml: { md: `${currentDrawerWidth}px` },
              backgroundColor: "background.paper",
              color: "text.primary",
              boxShadow: "none",
              borderBottom: "none",
              transition: isMdUp ? (theme) => theme.transitions.create(["width", "margin"], {
                easing: theme.transitions.easing.sharp,
                duration: theme.transitions.duration.enteringScreen,
              }) : "none",
            }}
          >
            <Toolbar sx={{ justifyContent: "space-between", px: { xs: 1.5, sm: 3 } }}>
              <Box sx={{ display: "flex", alignItems: "center" }}>
                <IconButton
                  color="inherit"
                  aria-label="open drawer"
                  edge="start"
                  onClick={handleDrawerToggle}
                  sx={{
                    mr: { xs: 1, sm: 2 },
                    p: 1,
                    touchAction: "manipulation",
                    cursor: "pointer",
                    WebkitTapHighlightColor: "transparent",
                    "& .MuiSvgIcon-root": {
                      fontSize: { xs: "1.75rem", sm: "1.5rem" },
                      pointerEvents: "none",
                    },
                  }}
                >
                  <MenuIcon />
                </IconButton>
                <Typography variant="h6" noWrap component="div" sx={{ fontWeight: 700, fontSize: { xs: "1rem", sm: "1.1rem" } }}>
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
            }}
            aria-label="mailbox folders"
          >
            {/* Temporary Drawer for Mobile */}
            <Drawer
              variant="temporary"
              anchor="left"
              open={mobileOpen}
              onClose={handleDrawerClose}
              disableScrollLock
              ModalProps={{
                keepMounted: false,
                disableScrollLock: true,
                disableAutoFocus: true,
                disableEnforceFocus: true,
                disableRestoreFocus: true,
              }}
              PaperProps={{
                elevation: 6,
                sx: {
                  boxSizing: "border-box",
                  width: drawerWidth,
                  backgroundColor: "#ffffff",
                  backgroundImage: "none",
                  borderRight: "1px solid",
                  borderColor: "divider",
                  boxShadow: "4px 0 24px rgba(0, 0, 0, 0.15)",
                },
              }}
              sx={{
                display: { xs: "block", md: "none" },
                zIndex: 1400,
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
              mt: { xs: "56px", sm: "64px" },
              backgroundColor: "background.default",
              minHeight: { xs: "calc(100vh - 56px)", sm: "calc(100vh - 64px)" },
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
