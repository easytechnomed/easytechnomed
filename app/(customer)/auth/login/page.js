import LoginPageClient from "./LoginPageClient";

export const metadata = {
  title: "Login | EasyTechnoMed",
  description: "Access your EasyTechnoMed laboratory information management system workspace.",
  alternates: {
    canonical: "/auth/login",
  },
};

export default function Page() {
  return <LoginPageClient />;
}
