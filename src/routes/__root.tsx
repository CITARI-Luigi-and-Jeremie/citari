import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";

import appCss from "../styles.css?url";
import { Grain } from "../components/fond";
import { reportLovableError } from "../lib/lovable-error-reporting";


function NotFoundComponent() {
  return (
    <div className="mx-auto max-w-2xl px-6 py-32">
      <h1 className="text-[64px] leading-none">Page introuvable</h1>
      <p className="mt-4 text-ink-2">Cette adresse ne correspond à aucune page du site.</p>
      <Link to="/" className="ink-link mt-6 inline-block">
        Revenir à l’accueil
      </Link>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <div className="mx-auto max-w-2xl px-6 py-32">
      <h1 className="text-[48px] leading-none">Cette page n’a pas pu se charger</h1>
      <p className="mt-4 text-ink-2">Réessayez, ou revenez à l’accueil.</p>
      <div className="mt-8 flex gap-6">
        <button
          onClick={() => {
            router.invalidate();
            reset();
          }}
          className="ink-link"
        >
          Réessayer
        </button>
        <a href="/" className="ink-link">
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
      { name: "author", content: "GEO Sprint" },
      { property: "og:type", content: "website" },
      { property: "og:site_name", content: "GEO Sprint" },
      { property: "og:locale", content: "fr_FR" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;1,300;1,400&family=Manrope:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;500&display=swap",
      },
      { rel: "stylesheet", href: appCss },
      { rel: "icon", href: "/favicon.ico", type: "image/x-icon" },
    ],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Organization",
          name: "GEO Sprint",
          description:
            "Agence française de GEO (Generative Engine Optimization) : mesure et correction de la visibilité des marques dans ChatGPT, Claude, Gemini et Perplexity.",
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

  return (
    <QueryClientProvider client={queryClient}>
      <Grain />
      <Outlet />
    </QueryClientProvider>
  );
}

