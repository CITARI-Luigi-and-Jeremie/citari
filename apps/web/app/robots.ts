import type { MetadataRoute } from "next";

// Le site est sa propre démonstration GEO : tous les crawlers IA sont les bienvenus.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: "*", allow: "/", disallow: ["/api/", "/scan/", "/rapport/"] },
      { userAgent: ["GPTBot", "ClaudeBot", "Claude-Web", "PerplexityBot", "Google-Extended", "CCBot", "anthropic-ai"], allow: "/" },
    ],
    sitemap: `${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/sitemap.xml`,
  };
}
