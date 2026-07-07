import LandingPage from "./LandingPageClient";

export const metadata = {
  title: "EasyTechnoMed | Cloud-Based Diagnostic Lab & LIMS Management Software",
  description: "EasyTechnoMed is an all-in-one Laboratory Information Management System (LIMS). Seamlessly manage patient registration, track test parameters, generate smart PDF reports, and manage doctor referrals in real-time.",
  keywords: [
    "EasyTechnoMed",
    "easytechnomed",
    "LIMS software",
    "laboratory information management system",
    "diagnostic lab software",
    "pathology lab management",
    "medical lab reporting",
    "blood test report generator",
    "doctor referral tracking",
    "pathology reporting software",
    "cloud LIMS"
  ],
  authors: [{ name: "EasyTechnoMed Team" }],
  creator: "EasyTechnoMed",
  publisher: "EasyTechnoMed",
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL ||
    "https://easytechnomed.com"
  ),
  alternates: {
    canonical: "/",
  },
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
    ],
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
    other: [
      {
        rel: "android-chrome-192x192",
        url: "/android-chrome-192x192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        rel: "android-chrome-512x512",
        url: "/android-chrome-512x512.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],
  },
  manifest: "/site.webmanifest",
  openGraph: {
    title: "EasyTechnoMed | Cloud-Based Diagnostic Lab & LIMS Management Software",
    description: "All-in-one Laboratory Information Management System (LIMS). Streamline patient registration, report generation, and reference doctor tracking today.",
    url: "/",
    siteName: "EasyTechnoMed",
    images: [
      {
        url: "/logo/logobg.png",
        width: 1200,
        height: 630,
        alt: "EasyTechnoMed - Cloud-Based LIMS Software",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "EasyTechnoMed | Cloud-Based Diagnostic Lab & LIMS Management Software",
    description: "Streamline your pathology and diagnostic lab workflow with EasyTechnoMed. Quick patient registration, smart test parameters, and PDF reporting.",
    images: ["/logo/logobg.png"],
  },
  robots: {
    index: true,
    follow: true,
    nocache: true,
    googleBot: {
      index: true,
      follow: true,
      noimageindex: false,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

export default function Page() {
  return <LandingPage />;
}
