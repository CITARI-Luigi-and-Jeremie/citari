# Citari — plateforme d'agence GEO

**Citari** : agence GEO (Generative Engine Optimization) pour PME/ETI francophones.
On fait apparaître les marques clientes dans les réponses de ChatGPT, Claude, Gemini,
Perplexity et Grok.

> Le produit vendu s'appelle **Sprint GEO** (2 900 €) — ne pas confondre avec le nom
> de la société. « GEO Sprint » était l'ancien nom, il ne doit plus apparaître nulle part.

## Architecture — décidée le 2026-08-01

| Où | Quoi | Qui édite |
|---|---|---|
| **Lovable** (`150f9fa5-b533-49e7-a797-19c52f94db36`) | Tunnel public **et son moteur de scan** : landing, scan, teaser, rapport, capture de lead, Supabase | Luigi |
| **Ce dépôt** | L'usine de livraison : `packages/toolkit` + `apps/admin` | Claude Code |

Le projet Lovable n'est pas qu'un front : c'est une app TanStack Start dont
`src/lib/orchestrateur.server.ts` interroge les moteurs, calcule le score et
écrit en base. Ce moteur est **le seul** qui mesure. Ce dépôt ne doit jamais en
exécuter un second : l'intérêt du J+90 est l'écart avec le J0, et un écart entre
deux implémentations de score différentes ne veut rien dire.

`apps/web` a été supprimé le 2026-08-01 — il refaisait le tunnel public déjà
servi par Lovable. `apps/admin` est conservé : l'admin Lovable liste et modifie
un statut, celui-ci gère conversion, relances, sprints, livrables et citations.

**Le schéma Supabase appartient au front.** Le toolkit en est consommateur ;
il ne crée ni scans, ni leads, ni clients.

## Ce dépôt

- `packages/core` — accès Supabase, appels Claude pour les commandes du toolkit,
  crawl, utilitaires. Contient aussi un moteur de scan complet (providers,
  scoring, runner) **qui n'est plus la référence** : c'est celui de Lovable qui
  mesure. Le code est gardé pour le mode démo et les tests ; ne pas le brancher
  sur la production sans relire la note d'architecture ci-dessus.
- `packages/toolkit` — l'usine : `pnpm toolkit <commande>`.
  Livraison : `audit-technique`, `generate-fixes`, `content-brief`, `draft-content`,
  `citation-targets`, `sprint-report`, `rescan`.
  Preuve : `verify-fixes`, `crawler-log`.
  Commercial : `relance`, `proposition`.
  Sorties dans `deliverables/<client>/`.
- `supabase/citari/` — complément au schéma posé depuis Lovable. **C'est le schéma
  de référence**, pas `supabase/migrations/` (celui de l'ancienne version locale).

## Schéma : la traduction est centralisée

Le toolkit garde son vocabulaire métier ; la traduction vers les colonnes réelles
vit dans **`packages/toolkit/src/lib/context.ts` et `lib/insights.ts`**, et nulle
part ailleurs. Une colonne qui bouge côté Lovable se répare là.

Pièges vérifiés sur la base réelle (2026-08-01) — ne pas les redécouvrir :

- `responses.engine` et `mentions.engine` stockent les **libellés** (`ChatGPT`,
  `Claude`, `Gemini`, `Perplexity`), pas des identifiants techniques.
- **`mentions` n'a pas de colonne `mentioned`** : une ligne *est* une mention.
  La marque suivie s'identifie par `is_target`, jamais par comparaison de noms.
- `share_of_voice` est un **tableau** `[{name,count,share,target}]`, pas un dict.
- `citation_targets` n'a que `name/url/status/notes` : le détail (pourquoi,
  difficulté, pitch) va dans le livrable Markdown.
- `directories.kind` / `authority_note` (et non `type` / `notes`).
- `leads` n'a ni `brand`, ni `sector`, ni `score` — passer par le scan lié.
- `follow_ups` n'a pas de `status` : `sent_at` et `cancelled` le dérivent.
- Le rappel de re-scan J+90 porte sur `sprints.rescan_due_on`, pas sur `clients`.
- `scans` n'a ni `email` ni `cost_cents` (les coûts vivent dans `cost_log`).

`supabase/citari/002_back_office.sql` complète ce schéma (colonnes du toolkit,
`crawler_hits`, 53 annuaires). Il est **rejouable** : `if not exists` partout et
un index unique `(sector, url)` qui rend le seed idempotent.

⚠ `apps/admin` utilise encore l'ancien vocabulaire. Le typecheck ne le signale
pas (le client Supabase y est typé `any`) — c'est le prochain morceau.

## Commandes
- `pnpm install` puis `pnpm test` (vitest) et `pnpm typecheck`.
- Scan en CLI : `pnpm --filter @geo/core scan:cli -- --brand "X" --url https://x.fr --sector "..." --competitors "A,B"`.

## Mode démo
`GEO_MOCK=1` remplace les 5 providers ET Supabase par des simulations
(`packages/core/src/mock/`). Base en mémoire persistée dans un fichier du dossier
temporaire, partagée entre process. Ne jamais laisser en production.

## Règles métier à ne pas casser
- **4 moteurs en production** : ChatGPT, Claude, Gemini, Perplexity. Grok existe
  dans `packages/core` mais le moteur Lovable ne l'interroge pas — ne jamais
  l'annoncer au client tant que ce n'est pas le cas.
- Scoring : mention 50 %, position 20 %, recommandation explicite 20 %, sentiment 10 %.
- Mix de requêtes : 24 questions — 10 comparatives, 6 problème, 5 locales, 3 confiance.
- Re-scan = strictement les MÊMES requêtes que le scan initial.
- Coût par scan loggé, cible < 1,50 €. Rate limit 3 scans/jour/IP + Turnstile.
- Non-objectifs : comptes prospects, paiement en ligne, scraping des UIs de chatbots,
  multi-tenant, dashboard de monitoring continu.

## Doctrine d'honnêteté (elle est le produit)
- Aucun faux résultat client, aucun témoignage, aucun logo — il n'y a pas encore de client.
- Toute réponse d'IA montrée en exemple est étiquetée comme telle, noms de concurrents fictifs.
- On garantit les actions livrées, jamais un score.
- Aucun compteur simulé à l'écran : on n'affiche que des données réellement enregistrées.
- Les emails commerciaux sont des gabarits déterministes remplis avec les vrais chiffres
  du scan — jamais de génération LLM libre sur un email de prospection.

## Pièges connus
- Ne JAMAIS lancer `pnpm build` pendant que les serveurs dev tournent : ils partagent
  `.next` et le cache se corrompt. Stopper d'abord, ou `rm -rf apps/*/.next`.
- Le projet est sur le Bureau (synchronisé iCloud) : des doublons « fichier 2.ts »
  peuvent apparaître — exclus des tsconfig, mais y penser si un build casse bizarrement.

## Direction artistique
`DESIGN.md` — mais **le front Lovable fait désormais autorité** : porcelaine/graphite/bronze,
Cormorant Garamond + Manrope + IBM Plex Mono. Charger le skill `artifact-design` avant
toute décision visuelle et `dataviz` pour valider une palette.
