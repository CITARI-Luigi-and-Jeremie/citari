import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  useRouterState,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import type { ReactNode } from "react";

import appCss from "../styles.css?url";
import { ClickSpark, PageCanvas, ScrollProgress } from "@/components/jeremie/decor";
import { SiteMark } from "@/components/jeremie/SiteMark";
import { SiteFloatingContact } from "@/components/jeremie/SiteFloatingContact";
import { SectionSidebar } from "@/components/jeremie/SectionSidebar";
import { ScanFormFocusProvider } from "@/lib/scan-form-focus";

/**
 * Racine du site.
 *
 * Navigation v3 de Jérémie, portée le 14/08/2026 : l'en-tête collant a disparu
 * au profit de trois éléments flottants — le logo en haut à gauche, le contact
 * en haut à droite, et sur la landing seulement une barre latérale de sections
 * qui se déploie au survol. Les métadonnées, le balisage schema.org et les
 * polices restent ceux de ce dépôt : ils décrivent l'offre réelle, et le site
 * est sa propre démonstration GEO.
 */

function NotFoundComponent() {
  return (
    <div className="mx-auto max-w-2xl px-6 py-32">
      <h1 className="text-[64px] leading-none">Page introuvable</h1>
      <p className="mt-4 text-ink-2">Cette adresse ne correspond à aucune page du site.</p>
      <Link to="/" className="link-underline mt-6 inline-block">
        Revenir à l'accueil
      </Link>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();

  return (
    <div className="mx-auto max-w-2xl px-6 py-32">
      <h1 className="text-[48px] leading-none">Cette page n'a pas pu se charger</h1>
      <p className="mt-4 text-ink-2">Réessayez, ou revenez à l'accueil.</p>
      <div className="mt-8 flex gap-6">
        <button
          onClick={() => {
            router.invalidate();
            reset();
          }}
          className="link-underline"
        >
          Réessayer
        </button>
        <a href="/" className="link-underline">
          Accueil
        </a>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { name: "author", content: "Citari" },
      { property: "og:type", content: "website" },
      { property: "og:site_name", content: "Citari" },
      { property: "og:locale", content: "fr_FR" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Archivo:wght@400;500;600;700;800&family=IBM+Plex+Mono:wght@400;500&family=Newsreader:ital,wght@0,400;1,400&display=swap",
      },
      { rel: "stylesheet", href: appCss },
      { rel: "icon", href: "/favicon.png", type: "image/png" },
    ],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Organization",
          name: "Citari",
          description:
            "Agence française de GEO (Generative Engine Optimization) : mesure et correction de la visibilité des marques dans ChatGPT, Claude, Gemini, Perplexity, Grok et Le Chat.",
          areaServed: "FR",
          knowsLanguage: ["fr", "it", "en"],
          makesOffer: [
            { "@type": "Offer", name: "Sprint GEO", price: "2900", priceCurrency: "EUR" },
            { "@type": "Offer", name: "Sprint Domination", price: "4900", priceCurrency: "EUR" },
          ],
        }),
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="fr">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  // L'écran de scan et le rapport se lisent sans distraction : ni logo
  // flottant, ni contact. L'admin non plus, ce n'est pas une page publique.
  const sansChrome =
    pathname.startsWith("/scan") || pathname.startsWith("/rapport") || pathname.startsWith("/admin");

  return (
    <QueryClientProvider client={queryClient}>
      <ScanFormFocusProvider>
        <PageCanvas />
        <ScrollProgress />
        <ClickSpark />
        {!sansChrome ? (
          <>
            <SiteMark className="fixed left-5 top-5 z-50 rounded-[4px] border border-rule/40 bg-paper/95 px-2.5 py-1.5 backdrop-blur-sm sm:left-8 sm:top-7" />
            <SiteFloatingContact />
          </>
        ) : null}
        {pathname === "/" ? <SectionSidebar /> : null}
        <main className="relative z-10">
          <Outlet />
        </main>
      </ScanFormFocusProvider>
    </QueryClientProvider>
  );
}
