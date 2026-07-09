import { useState, useEffect } from "react";

export function useAdminPermissions() {
  const [permissions, setPermissions] = useState([]);
  const [role, setRole] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 1. Try sessionStorage first
    const cached = sessionStorage.getItem("admin_profile");
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        setPermissions(parsed.role?.permissions || parsed.permissions || []);
        setRole(parsed.role?.name || parsed.role || "");
        setLoading(false);
      } catch (e) {}
    }

    // 2. Fetch from API
    fetch("/api/profile")
      .then((res) => {
        if (res.status === 401) {
          return res.json().then((data) => {
            if (data && data.error === "deactivated") {
              window.location.href = "/auth/login?error=deactivated";
            } else {
              window.location.href = "/auth/login";
            }
            throw new Error("Unauthorized");
          });
        }
        return res.json();
      })
      .then((data) => {
        if (data && data.success && data.admin) {
          sessionStorage.setItem("admin_profile", JSON.stringify(data.admin));
          setPermissions(data.admin.role?.permissions || []);
          setRole(data.admin.role?.name || "");
        } else if (data && !data.success && (data.error === "Unauthorized" || data.error === "deactivated")) {
          if (data.error === "deactivated") {
            window.location.href = "/auth/login?error=deactivated";
          } else {
            window.location.href = "/auth/login";
          }
        }
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  const hasPermission = (perm) => {
    const rUpper = role.toUpperCase();
    if (rUpper === "ADMIN" || rUpper === "OWNER" || permissions.includes("ALL")) {
      return true;
    }
    return permissions.includes(perm);
  };

  return { permissions, role, loading, hasPermission };
}
