# GEO Sprint — plateforme d'agence GEO

Agence GEO (Generative Engine Optimization) pour PME/ETI francophones : faire apparaître les marques clientes dans ChatGPT, Claude, Gemini et Perplexity.

Le cahier des charges complet est dans `SPEC.md`. À lire avant toute modification structurante.

## Monorepo (Turborepo + pnpm)
- `packages/core` — logique partagée : 4 providers LLM (`LLMProvider.ask`), génération de requêtes, détection de mentions (déterministe + LLM), scoring 0-100, runner de scan asynchrone, client Supabase, log de coûts.
- `apps/web` — landing + scanner public + rapports (Next.js 15 App Router, port 3000).
- `apps/admin` — back-office leads/clients/sprints (Next.js 15, port 3001, auth mot de passe env).
- `packages/toolkit` — CLI interne de livraison des sprints : `pnpm toolkit <commande>` (audit-technique, generate-fixes, content-brief, draft-content, citation-targets, rescan). Sorties dans `deliverables/<client>/`.
- `supabase/migrations` — schéma Postgres.

## Mode démo
`GEO_MOCK=1` (env) remplace les 4 providers ET la base Supabase par des simulations
(`packages/core/src/mock/`) — base en mémoire persistée dans un fichier du dossier temporaire,
partagée entre web et admin. Les guards sont dans getDb, getProviders, generateQueries,
classifyMentions, generatePriorityActions. Ne jamais laisser GEO_MOCK en production.

## Commandes
- `pnpm install` puis `pnpm dev` (turbo), `pnpm test` (vitest dans core), `pnpm typecheck`.
- Scan en CLI (validation Phase 1) : `pnpm --filter @geo/core scan:cli -- --brand "X" --url https://x.fr --sector "..." --competitors "A,B"`.

## Pièges connus
- Ne JAMAIS lancer `pnpm build` pendant que les serveurs dev tournent : ils partagent `.next` et le cache se corrompt (MODULE_NOT_FOUND sur vendor-chunks). Stopper les dev servers d'abord, ou `rm -rf apps/*/.next` puis redémarrer.
- Le projet est sur le Bureau (synchronisé iCloud) : des doublons « fichier 2.ts » peuvent apparaître — exclus des tsconfig, mais y penser si un build casse bizarrement.

## Règles métier à ne pas casser
- Scoring : mention 50 %, position 20 %, recommandation explicite 20 %, sentiment 10 %.
- Mix de requêtes : 40 % comparatives, 25 % problème, 20 % locales, 15 % confiance.
- Re-scan = strictement les MÊMES requêtes que le scan initial.
- Coût par scan loggé, cible < 1,50 €. Rate limit 3 scans/jour/IP + Turnstile.
- Non-objectifs (refuser) : comptes prospects, paiement en ligne, scraping des UIs de chatbots, multi-tenant, dashboard de monitoring continu.
