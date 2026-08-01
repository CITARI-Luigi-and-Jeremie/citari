# Citari — plateforme d'agence GEO

**Citari** : agence GEO (Generative Engine Optimization) pour PME/ETI francophones.
On fait apparaître les marques clientes dans les réponses de ChatGPT, Claude, Gemini,
Perplexity et Grok.

> Le produit vendu s'appelle **Sprint GEO** (2 900 €) — ne pas confondre avec le nom
> de la société. « GEO Sprint » était l'ancien nom, il ne doit plus apparaître nulle part.

## Architecture — décidée le 2026-08-01

| Où | Quoi | Qui édite |
|---|---|---|
| **Lovable** (`150f9fa5-b533-49e7-a797-19c52f94db36`) | Tout le front : landing, scan, rapport, admin, Supabase | Luigi |
| **Ce dépôt** | Le back : moteur de scan et usine de livraison | Claude Code |

Le front ne se développe plus ici. `apps/web` et `apps/admin` sont conservés comme
référence de travail et pour le mode démo, mais ne sont plus la cible.

## Ce dépôt

- `packages/core` — 5 providers LLM (`LLMProvider.ask`), génération de requêtes,
  détection de mentions (déterministe + LLM), scoring, runner de scan, log de coûts.
- `packages/toolkit` — l'usine : `pnpm toolkit <commande>`.
  Livraison : `audit-technique`, `generate-fixes`, `content-brief`, `draft-content`,
  `citation-targets`, `sprint-report`, `rescan`.
  Preuve : `verify-fixes`, `crawler-log`.
  Commercial : `relance`, `proposition`.
  Sorties dans `deliverables/<client>/`.
- `supabase/citari/` — complément au schéma posé depuis Lovable. **C'est le schéma
  de référence**, pas `supabase/migrations/` (celui de l'ancienne version locale).

## ⚠ Chantier ouvert : réconcilier les schémas

Le schéma Lovable et l'ancien schéma local nomment les colonnes différemment :

| Lovable (référence) | Ancien local |
|---|---|
| `scans.brand_name` | `scans.brand` |
| `scans.website_url` | `scans.url` |
| `scans.score_global` | `scans.score` |
| `scans.score_chatgpt/claude/gemini/perplexity/grok` | `scans.score_detail` (jsonb) |
| `scans.phase` | `scans.status` + `progress` |
| `scans.ip_hash` | `scans.ip` |
| `queries.rank` / `queries.intent` | `queries.position` / `category` |
| `responses.raw_text` / `sources` / `cost_eur` | `text` / `citations` / `cost_cents` |
| `mentions.recommended` / `is_target` / `verbatim` | `is_recommended` (pas d'équivalent) |
| `deliverables.sprint_id` | `deliverables.client_id` |
| `follow_ups.due_on` / `cancelled` | `scheduled_for` / `status` |

**Tant que ce n'est pas fait, le toolkit ne fonctionne pas contre la base Lovable.**
C'est le prochain gros morceau.

## Commandes
- `pnpm install` puis `pnpm test` (vitest) et `pnpm typecheck`.
- Scan en CLI : `pnpm --filter @geo/core scan:cli -- --brand "X" --url https://x.fr --sector "..." --competitors "A,B"`.

## Mode démo
`GEO_MOCK=1` remplace les 5 providers ET Supabase par des simulations
(`packages/core/src/mock/`). Base en mémoire persistée dans un fichier du dossier
temporaire, partagée entre process. Ne jamais laisser en production.

## Règles métier à ne pas casser
- Scoring : mention 50 %, position 20 %, recommandation explicite 20 %, sentiment 10 %.
- Mix de requêtes : 40 % comparatives, 25 % problème, 20 % locales, 15 % confiance.
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
