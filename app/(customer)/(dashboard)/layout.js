import React from "react";
import { requireAdmin } from "@/lib/auth";
import AdminLayoutClient from "@/components/AdminLayoutClient";
import ExpiredPlanView from "@/components/ExpiredPlanView";
import NextTopLoader from "nextjs-toploader";

export const dynamic = "force-dynamic";

export default async function AdminDashboardLayout({ children }) {
  // Ensure user is admin
  const admin = await requireAdmin();

  // Expiry is tied to the Workspace
  const workspaceExpireAt = admin.workspace?.expireAt || null;
  const isExpired = workspaceExpireAt ? new Date(workspaceExpireAt).getTime() < Date.now() : false;

  // Format admin profile safely
  const safeAdmin = {
    id: admin.id,
    name: admin.name,
    email: admin.email,
    mobileNumber: admin.mobileNumber || "",
    companyName: admin.companyName || "",
    workspaceName: admin.workspace?.name || "",
    role: admin.role ? { name: admin.role.name } : { name: "Admin" },
    permissions: admin.role?.permissions?.map(p => p.permission) || [],
    expireAt: workspaceExpireAt ? new Date(workspaceExpireAt).toISOString() : null,
  };

  if (isExpired) {
    return (
      <>
        <NextTopLoader color="#0f766e" showSpinner={false} height={3} />
        <ExpiredPlanView admin={safeAdmin} />
      </>
    );
  }

  return (
    <>
      <NextTopLoader color="#0f766e" showSpinner={false} height={3} />
      <AdminLayoutClient admin={safeAdmin}>
        {children}
      </AdminLayoutClient>
    </>
  );
}
