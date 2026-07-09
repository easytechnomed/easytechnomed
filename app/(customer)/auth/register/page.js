import RegisterPageClient from "./RegisterPageClient";

export const metadata = {
  title: "Register Workspace | EasyTechnoMed",
  description: "Create a new laboratory workspace on EasyTechnoMed and start your 3-day free trial.",
  alternates: {
    canonical: "/auth/register",
  },
};

export default function Page() {
  return <RegisterPageClient />;
}
