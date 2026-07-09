import AboutPageClient from "./AboutPageClient";

export const metadata = {
  title: "About Us | EasyTechnoMed",
  description: "Learn more about EasyTechnoMed and our mission to modernize pathology laboratories.",
  alternates: {
    canonical: "/about",
  },
};

export default function Page() {
  return <AboutPageClient />;
}
