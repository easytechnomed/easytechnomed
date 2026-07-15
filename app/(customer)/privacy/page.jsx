import PrivacyPageClient from "./PrivacyPageClient";

export const metadata = {
  title: "Privacy Policy | EasyTechnoMed",
  description: "Modern, secure, and professional diagnostic laboratory software for managing patient reports, referral metrics, and data summaries efficiently.",
  alternates: {
    canonical: "/privacy",
  },
};

export default function Page() {
  return <PrivacyPageClient />;
}
