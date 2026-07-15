import RegisterPageClient from "./RegisterPageClient";

export const metadata = {
  title: "Register | EasyTechnoMed",
  description: "Create a new laboratory workspace on EasyTechnoMed and start your 5-day free trial.",
  alternates: {
    canonical: "/auth/register",
  },
};

export default function Page() {
  return <RegisterPageClient />;
}
