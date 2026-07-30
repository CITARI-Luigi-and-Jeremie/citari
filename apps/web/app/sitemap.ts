import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  const now = new Date();
  return [
    { url: base, lastModified: now, changeFrequency: "weekly", priority: 1 },
    { url: `${base}/guide-geo`, lastModified: now, changeFrequency: "monthly", priority: 0.8 },
    { url: `${base}/geo-vs-seo`, lastModified: now, changeFrequency: "monthly", priority: 0.8 },
  ];
}
