import ContactPageClient from "./ContactPageClient";

export const metadata = {
  title: "Contact Us | EasyTechnoMed",
  description: "Get in touch with the EasyTechnoMed team for support, custom packages, or demo requests.",
  alternates: {
    canonical: "/contact",
  },
};

export default function Page() {
  return <ContactPageClient />;
}
