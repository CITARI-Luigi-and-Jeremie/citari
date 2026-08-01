import type { Metadata } from "next";
import { fontVariables } from "./fonts";
import "./globals.css";

const TITLE = "Citari — Votre marque est-elle invisible dans ChatGPT ?";
const DESCRIPTION =
  "Mesurez gratuitement votre visibilité dans ChatGPT, Claude, Gemini et Perplexity en 90 secondes. Puis rendez votre marque citable avec le Sprint GEO de 30 jours.";

export const metadata: Metadata = {
  title: { default: TITLE, template: "%s — Citari" },
  description: DESCRIPTION,
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"),
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    type: "website",
    locale: "fr_FR",
    siteName: "Citari",
    images: [{ url: "/og.png", width: 1200, height: 630, alt: TITLE }],
  },
  twitter: { card: "summary_large_image", title: TITLE, description: DESCRIPTION, images: ["/og.png"] },
};

const orgJsonLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "Citari",
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
          <div className="border-b border-signal bg-signal px-4 py-1 text-center font-mono text-micro uppercase text-paper">
            Mode démonstration — moteurs et base simulés · les scores ne sont pas réels
          </div>
        )}
        {children}
      </body>
    </html>
  );
}
