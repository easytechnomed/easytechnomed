import React from "react";
import ResetPasswordClient from "./ResetPasswordClient";

export const metadata = {
  title: "Reset Workspace Password - EasyTechnoMed",
  description: "Reset your pathology workspace admin password securely.",
};

export default async function ResetPasswordPage({ searchParams }) {
  const params = await searchParams;
  const token = params?.token || "";

  return <ResetPasswordClient token={token} />;
}
