import React from "react";
import { requireAdmin } from "@/lib/auth";
import AdminLayoutClient from "@/components/AdminLayoutClient";
import NextTopLoader from "nextjs-toploader";

export const dynamic = "force-dynamic";

export default async function AdminDashboardLayout({ children }) {
  // Ensure user is admin
  const admin = await requireAdmin();

  // Format admin profile safely
  const safeAdmin = {
    id: admin.id,
    name: admin.name,
    email: admin.email,
    role: admin.role ? { name: admin.role.name } : { name: "Admin" },
    permissions: admin.role?.permissions?.map(p => p.permission) || [],
    expireAt: admin.expireAt
  };

  return (
    <>
      <NextTopLoader color="#0f766e" showSpinner={false} height={3} />
      <AdminLayoutClient admin={safeAdmin}>
        {children}
      </AdminLayoutClient>
    </>
  );
}
