import { useEffect } from "react";
import { useRouter } from "@tanstack/react-router";

/**
 * Mesure d'audience — Google Analytics 4.
 *
 * Identifiant public par construction (il voyage dans le HTML de chaque page) :
 * l'écrire ici plutôt que dans une variable d'environnement évite une clé de
 * configuration de plus pour une valeur que n'importe quel visiteur peut lire.
 */
export const MESURE_GA = "G-6XD5KYMRE0";

/**
 * La mesure ne tourne QU'EN PRODUCTION.
 *
 * Un `pnpm dev` sur la machine de l'un de nous enverrait des scans, des emails
 * et des réservations de test dans les mêmes rapports que le trafic réel. Avec
 * le volume attendu des premiers mois — quelques dizaines de visites — dix
 * lancements de test suffiraient à rendre le taux de conversion illisible, et
 * c'est précisément le chiffre sur lequel se juge un batch de prospection.
 *
 * Conséquence à connaître : en local, la console ne montrera rien et le Temps
 * réel de GA restera vide. Pour vérifier une pose d'événement, il faut le site
 * déployé et le DebugView de GA.
 */
const ACTIVE = import.meta.env.PROD;

type ParametresGtag = Record<string, string | number | boolean | null | undefined>;

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

/**
 * Envoie un événement, ou ne fait rien.
 *
 * Trois raisons de ne rien faire, toutes normales et aucune n'est une panne :
 * le rendu serveur (pas de `window`), le mode développement, et le bloqueur de
 * publicité du visiteur — qui empêche `gtag.js` de se charger et laisse donc
 * `window.gtag` indéfini. Une mesure manquante ne doit jamais casser le
 * parcours qu'elle mesure : c'est pour ça que rien ici ne lève d'exception.
 */
export function suivreEvenement(nom: string, parametres: ParametresGtag = {}): void {
  if (!ACTIVE || typeof window === "undefined" || typeof window.gtag !== "function") return;
  try {
    window.gtag("event", nom, parametres);
  } catch {
    /* la mesure est accessoire, le parcours ne l'est pas. */
  }
}

/**
 * Suit les changements de page.
 *
 * Le site est une application à navigation côté client : après le premier
 * chargement, passer de `/` à `/sprint` ne recharge aucun document, et GA ne
 * verrait donc qu'une seule page par visite. Ce hook rejoue un `page_view` à
 * chaque route résolue.
 *
 * La page d'entrée n'est pas comptée ici, et ce n'est pas un oubli : le
 * `gtag('config', …)` posé dans `__root.tsx` l'a déjà envoyée, et `onResolved`
 * ne se déclenche pas à l'hydratation (vérifié le 16/08/2026 en lisant
 * `dataLayer` sur un chargement neuf). Ce partage est aussi le plus sûr : si
 * ce hook cessait un jour de fonctionner, il resterait la vue d'entrée, là où
 * tout confier au routeur ferait disparaître l'audience entière d'un coup.
 */
export function useSuiviPages(): void {
  const router = useRouter();

  useEffect(() => {
    // `onResolved` plutôt qu'un effet sur l'état du routeur.
    //
    // Trois tentatives ont échoué avant celle-ci, le 16/08/2026, et chacune
    // pour une raison qu'un test en local rendait visible immédiatement :
    //   — lire `document.title` et `window.location` dans un effet donne les
    //     valeurs de la page PRÉCÉDENTE : `HeadContent` écrit après ce rendu ;
    //   — les différer d'un `requestAnimationFrame` n'envoie plus rien du tout
    //     dans un onglet d'arrière-plan, où le navigateur suspend les frames ;
    //   — réagir à `s.location` et `s.matches` envoie DEUX vues par navigation,
    //     l'adresse et les correspondances n'étant pas publiées au même moment.
    //
    // `onResolved` ne se déclenche qu'une fois, la navigation entièrement
    // résolue : une vue par page, et le titre est déjà le bon.
    return router.subscribe("onResolved", ({ toLocation }) => {
      suivreEvenement("page_view", {
        page_path: toLocation.href,
        // Reconstruite : `window.location` peut être en retard, le routeur non.
        page_location: window.location.origin + toLocation.href,
        page_title: titreDesMatches(router.state.matches),
      });
    });
  }, [router]);
}

/**
 * Le titre de la page courante, tel que les routes le déclarent.
 *
 * Chaque route pose son titre dans `head().meta` sous la forme
 * `{ title: "…" }`. On parcourt les correspondances de la plus profonde vers
 * la racine : la plus spécifique gagne, exactement comme le fait le document.
 */
function titreDesMatches(matches: readonly { meta?: unknown }[]): string | undefined {
  for (let i = matches.length - 1; i >= 0; i--) {
    const meta = matches[i]?.meta;
    if (!Array.isArray(meta)) continue;
    for (const balise of meta) {
      const titre = (balise as { title?: unknown } | null)?.title;
      if (typeof titre === "string" && titre) return titre;
    }
  }
  return undefined;
}
