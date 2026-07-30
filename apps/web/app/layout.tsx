import type { Metadata } from "next";
import { fontVariables } from "./fonts";
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
    <html lang="fr" className={fontVariables}>
      <body>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(orgJsonLd) }} />
        {process.env.GEO_MOCK === "1" && (
          <div className="border-b border-signal bg-signal px-4 py-1 text-center font-mono text-micro uppercase text-ink">
            Mode démonstration — moteurs et base simulés · les scores ne sont pas réels
          </div>
        )}
        {children}
      </body>
    </html>
  );
}
