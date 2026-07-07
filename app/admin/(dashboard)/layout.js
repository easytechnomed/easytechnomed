import React from "react";
import { requireAdmin } from "@/lib/auth";
import AdminLayoutClient from "@/components/AdminLayoutClient";

export const dynamic = "force-dynamic";

export default async function AdminDashboardLayout({ children }) {
  // Ensure user is admin with view permissions
  const admin = await requireAdmin("admin:view");

  // Format admin profile safely
  const safeAdmin = {
    id: admin.id,
    name: admin.name,
    email: admin.email,
    role: admin.role ? { name: admin.role.name } : { name: "Admin" }
  };

  return (
    <AdminLayoutClient admin={safeAdmin}>
      {children}
    </AdminLayoutClient>
  );
}
