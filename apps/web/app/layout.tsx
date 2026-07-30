import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "GEO Sprint — Votre marque est-elle invisible dans ChatGPT ?",
  description:
    "Testez gratuitement votre visibilité dans ChatGPT, Claude, Gemini et Perplexity en 90 secondes. Puis rendez votre marque visible avec le Sprint GEO de 30 jours.",
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"),
};

const orgJsonLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "GEO Sprint",
  description:
    "Agence GEO (Generative Engine Optimization) pour PME francophones : nous rendons votre marque visible dans les réponses de ChatGPT, Claude, Gemini et Perplexity.",
  url: process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000",
  areaServed: ["FR", "BE", "CH", "IT"],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(orgJsonLd) }} />
        {children}
      </body>
    </html>
  );
}
