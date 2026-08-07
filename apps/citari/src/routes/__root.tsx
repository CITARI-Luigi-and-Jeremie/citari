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
import { useEffect, useState, type ReactNode } from "react";

import appCss from "../styles.css?url";
import { ClickSpark, PageCanvas, ScrollProgress } from "@/components/jeremie/decor";
import { ScanFormFocusProvider, useScanFormFocus } from "@/lib/scan-form-focus";

/**
 * Racine du site.
 *
 * L'habillage (en-tête, fond de page, barre de lecture) vient du projet
 * Lovable de Jérémie, porté le 07/08/2026. Les métadonnées, le balisage
 * schema.org et les polices restent ceux de ce dépôt : ils décrivent l'offre
 * réelle, et le site est sa propre démonstration GEO.
 *
 * Les trois familles typographiques sont celles de la charte de Jérémie :
 * Archivo pour Citari, Newsreader italique pour les citations d'IA, IBM Plex
 * Mono pour toute donnée. Cormorant Garamond et Manrope, utilisés par
 * l'ancienne maquette, ne sont plus chargés.
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

function SiteHeader() {
  const { focusAndScroll } = useScanFormFocus();
  const [defile, setDefile] = useState(false);

  useEffect(() => {
    const onScroll = () => setDefile(window.scrollY > 220);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`sticky top-0 z-40 transition-all duration-500 lg:border-b lg:border-rule lg:bg-paper/75 lg:backdrop-blur-md ${
        defile
          ? "border-b border-transparent bg-transparent backdrop-blur-none"
          : "border-b border-rule bg-paper/75 backdrop-blur-md"
      }`}
    >
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-5 py-4 sm:px-8">
        <Link to="/" aria-label="Citari, retour à l'accueil" className="flex items-center">
          <img
            src="/img/citari-monogramme.svg"
            alt="Citari"
            width={100}
            height={100}
            className={`h-[34px] w-[34px] rounded-full transition-all duration-500 [transition-timing-function:cubic-bezier(0.22,1,0.36,1)] lg:hidden ${
              defile
                ? "rotate-0 scale-100 opacity-100"
                : "pointer-events-none absolute -rotate-180 scale-50 opacity-0"
            }`}
          />
          <img
            src="/img/citari-logo.png"
            alt="Citari"
            width={680}
            height={160}
            className={`h-[22px] w-auto transition-all duration-500 [transition-timing-function:cubic-bezier(0.22,1,0.36,1)] sm:h-[26px] lg:!static lg:rotate-0 lg:scale-100 lg:opacity-100 ${
              defile
                ? "pointer-events-none absolute rotate-180 scale-50 opacity-0"
                : "rotate-0 scale-100 opacity-100"
            }`}
          />
        </Link>

        <nav className="flex items-center gap-5 text-[15px]">
          <Link
            to="/"
            onClick={focusAndScroll}
            className="cta-sweep mono hidden border border-ink bg-ink px-3.5 py-2 text-[13px] text-paper lg:inline-flex"
          >
            Scan gratuit
          </Link>
        </nav>
      </div>
    </header>
  );
}

/** Bouton d'appel permanent, mobile seulement. */
function FloatingScanCta() {
  const { focusAndScroll } = useScanFormFocus();
  return (
    <Link
      to="/"
      onClick={focusAndScroll}
      className="mono fixed bottom-5 left-1/2 z-40 -translate-x-1/2 rounded-[4px] border border-ink bg-ink px-5 py-3 text-[13px] uppercase tracking-[0.08em] text-paper transition-transform duration-200 active:scale-[0.97] lg:hidden"
      style={{ bottom: "calc(1.25rem + env(safe-area-inset-bottom))" }}
    >
      Scan gratuit
    </Link>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  // L'écran de scan et le rapport se lisent sans distraction : ni en-tête, ni
  // bouton flottant. L'admin non plus, ce n'est pas une page publique.
  const sansChrome =
    pathname.startsWith("/scan") || pathname.startsWith("/rapport") || pathname.startsWith("/admin");

  return (
    <QueryClientProvider client={queryClient}>
      <ScanFormFocusProvider>
        <PageCanvas />
        <ScrollProgress />
        <ClickSpark />
        {!sansChrome ? <SiteHeader /> : null}
        {!sansChrome ? <FloatingScanCta /> : null}
        <main className="relative z-10">
          <Outlet />
        </main>
      </ScanFormFocusProvider>
    </QueryClientProvider>
  );
}
