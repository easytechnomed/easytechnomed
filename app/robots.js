export default function robots() {
  return {
    rules: [
      {
        userAgent: [
          "GPTBot",
          "ClaudeBot",
          "Google-Extended",
          "meta-externalagent",
          "*",
        ],
        allow: "/",
      },
    ],
    sitemap: "https://easytechnomed.com/sitemap.xml",
  };
}
