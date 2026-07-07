import { Outfit } from "next/font/google";
import ToastProvider from "@/components/ToastProvider";
import "./globals.css";

const outfit = Outfit({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
  variable: "--font-outfit",
});

export const metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL ||
    "https://easytechnomed.com"
  ),
  title: {
    default: "EasyTechnoMed | Laboratory Information Management System",
    template: "%s | EasyTechnoMed",
  },
  description: "Secure, reliable, and modern cloud-based Laboratory Information Management System (LIMS) for diagnostic center operations, test tracking, and reports.",
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
    ],
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
  },
  manifest: "/site.webmanifest",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${outfit.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-slate-50 text-slate-900 font-sans selection:bg-blue-600 selection:text-white">
        <ToastProvider />
        <div className="flex-1 flex flex-col">{children}</div>
      </body>
    </html>
  );
}
