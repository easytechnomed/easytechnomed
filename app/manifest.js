export default function manifest() {
  return {
    name: "EasyTechnoMed | Laboratory Information Management System",
    short_name: "EasyTechnoMed",
    description: "Secure, reliable, and modern cloud-based Laboratory Information Management System (LIMS) for diagnostic center operations, test tracking, and reports.",
    start_url: "/",
    display: "standalone",
    background_color: "#f8fafc",
    theme_color: "#0f766e",
    orientation: "portrait",
    icons: [
      {
        src: "/android-chrome-192x192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/android-chrome-512x512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/android-chrome-192x192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: "/android-chrome-512x512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: "/apple-touch-icon.png",
        sizes: "180x180",
        type: "image/png",
      },
    ],
    shortcuts: [
      {
        name: "Login to Workspace",
        url: "/auth/login",
        description: "Access your EasyTechnoMed diagnostic workspace portal",
        icons: [{ src: "/android-chrome-192x192.png", sizes: "192x192" }],
      },
      {
        name: "Register Workspace",
        url: "/auth/register",
        description: "Register a new laboratory workspace with EasyTechnoMed",
        icons: [{ src: "/android-chrome-192x192.png", sizes: "192x192" }],
      },
    ],
  };
}
