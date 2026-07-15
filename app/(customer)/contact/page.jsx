import ContactPageClient from "./ContactPageClient";

export const metadata = {
  title: "Contact Us | EasyTechnoMed",
  description: "Have questions about our cloud LIMS features or pricing? Contact the EasyTechnoMed support team today. We typically reply within 1 to 2 hours.",
  alternates: {
    canonical: "/contact",
  },
};

export default function Page() {
  return <ContactPageClient />;
}
