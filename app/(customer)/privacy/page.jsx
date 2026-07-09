import PrivacyPageClient from "./PrivacyPageClient";

export const metadata = {
  title: "Privacy Policy | EasyTechnoMed",
  description: "Read our privacy policy outlining how we store, secure, and handle diagnostic data under HIPAA compliance.",
  alternates: {
    canonical: "/privacy",
  },
};

export default function Page() {
  return <PrivacyPageClient />;
}
