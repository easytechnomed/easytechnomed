import AboutPageClient from "./AboutPageClient";

export const metadata = {
  title: "About Us | EasyTechnoMed",
  description: "Modern, secure, and professional diagnostic laboratory software for managing patient reports, referral metrics, and data summaries efficiently.",
  alternates: {
    canonical: "/about",
  },
};

export default function Page() {
  return <AboutPageClient />;
}
