import { redirect } from "next/navigation";
import { getSuperAdmin } from "@/lib/auth";
import SuperAdminLoginForm from "../SuperAdminLoginForm";

export default async function SuperAdminLoginPage() {
  const superAdmin = await getSuperAdmin();

  if (superAdmin) {
    redirect("/adminstration/dashboard");
  }

  return <SuperAdminLoginForm />;
}
