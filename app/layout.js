import { Suspense } from "react";
import { Outfit, Calistoga, Inter, JetBrains_Mono } from "next/font/google";
import ToastProvider from "@/components/ToastProvider";
import PWARegister from "@/components/PWARegister";
import ScrollToTop from "@/components/ScrollToTop";
import "./globals.css";

const outfit = Outfit({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
  variable: "--font-outfit",
  display: "swap",
});

const calistoga = Calistoga({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-calistoga",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-inter",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-mono",
  display: "swap",
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
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "EasyTechnoMed",
  },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#0f766e",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${outfit.variable} ${calistoga.variable} ${inter.variable} ${jetbrainsMono.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-[#FAFAFA] text-slate-900 font-sans selection:bg-[#0052FF] selection:text-white">
        <Suspense fallback={null}>
          <ScrollToTop />
        </Suspense>
        <PWARegister />
        <ToastProvider />
        <div className="flex-1 flex flex-col">{children}</div>
      </body>
    </html>
  );
}
