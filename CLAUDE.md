# Citari — plateforme d'agence GEO

**Citari** : agence GEO (Generative Engine Optimization) pour PME/ETI francophones.
On fait apparaître les marques clientes dans les réponses de ChatGPT, Claude, Gemini,
Perplexity, Grok et Le Chat.

> Le produit vendu s'appelle **Sprint GEO** (2 900 €) — ne pas confondre avec le nom
> de la société. « GEO Sprint » était l'ancien nom, il ne doit plus apparaître nulle part.

## Architecture — décidée le 2026-08-01

| Dossier | Quoi | Dépôt Git | Outillage |
|---|---|---|---|
| `apps/citari` | Le front **et son moteur de scan** : landing, scan, teaser, rapport, lead | [sprint-voice-insight](https://github.com/LuigiRevelli/sprint-voice-insight) — autonome | bun, TanStack Start |
| `apps/admin` | Back-office de livraison : sprints, livrables, relances, citations | ce dépôt | pnpm, Next.js |
| `packages/*` | Toolkit CLI + socle partagé | ce dépôt | pnpm |

### `apps/citari` est un checkout lié, pas un sous-dossier

Il a son propre `.git`, synchronisé avec le projet Lovable
`150f9fa5-b533-49e7-a797-19c52f94db36`. Luigi édite sur Lovable, on récupère
avec `git -C apps/citari pull` ; on édite ici, on pousse. Il est **gitignoré**
et **exclu du workspace pnpm** (`!apps/citari`) : le versionner dans ce dépôt
recréerait deux sources de vérité.

S'il est absent après un clone :
`git clone https://github.com/LuigiRevelli/sprint-voice-insight.git apps/citari`

**Règle de travail : une seule personne à la fois sur le front.** Luigi fait le
design sur Lovable (il voit le rendu en direct) ; on fait ici la logique, les
bugs et tout ce qui touche à la base (on a le typecheck et la vue sur le
toolkit). Toujours `git -C apps/citari pull` AVANT de modifier quoi que ce soit.

Deux réglages locaux déjà en place, à refaire après un nouveau clone :

```bash
# bun est absent de cette machine : dépendances installées avec npm.
# Le lockfile npm ne doit pas partir vers Lovable, qui reste sur bun.lock.
echo "package-lock.json" >> apps/citari/.git/info/exclude

# routeTree.gen.ts est régénéré à chaque `npm run dev` et pollue chaque diff.
git -C apps/citari update-index --skip-worktree src/routeTree.gen.ts
```

Si un `pull` se plaint de ce fichier : `--no-skip-worktree`, `checkout --`,
`pull`, puis remettre `--skip-worktree`.

Le front tourne en local sur **8080** (imposé par la config Lovable), pas 3000.
Il s'affiche, mais **ne peut pas lancer de scan** : les clés serveur (service
role, Anthropic, Perplexity, passerelle Lovable) ne sont pas dans le dépôt.

### Un seul moteur de score

`apps/citari/src/lib/orchestrateur.server.ts` interroge les moteurs, calcule le
score et écrit en base. C'est **le seul** qui mesure. Ne jamais en exécuter un
second : l'intérêt du J+90 est l'écart avec le J0, et un écart entre deux
implémentations différentes ne veut rien dire. `packages/core` contient encore
un moteur complet — il sert au mode démo et aux tests, pas à la production.

**Le schéma Supabase appartient au front.** Le toolkit en est consommateur ;
il ne crée ni scans, ni leads, ni clients.

### Sécurité vérifiée le 2026-08-01

Le `.env` du front est versionné sur GitHub (dépôt privé) mais ne contient que
l'URL Supabase et la clé `sb_publishable_`, publique par conception. RLS est
actif sur les 16 tables avec **zéro policy** — donc « tout refuser » pour cette
clé. Tout passe par le service role dans les server functions. Si un jour une
policy est ajoutée, revérifier que `leads` (emails, RGPD) reste inaccessible.

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
  `Claude`, `Gemini`, `Perplexity`, `Grok`, `Le Chat`), pas des identifiants.
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
`GEO_MOCK=1` remplace les 6 providers ET Supabase par des simulations
(`packages/core/src/mock/`). Base en mémoire persistée dans un fichier du dossier
temporaire, partagée entre process. Ne jamais laisser en production.

## Règles métier à ne pas casser
- **6 moteurs** : ChatGPT, Claude, Gemini, Perplexity, Grok, Le Chat (Mistral).
  Décidé le 2026-08-01, avant le premier client — et c'était la dernière
  occasion : la promesse « mêmes questions, mêmes moteurs à J+90 » interdit de
  toucher à cette liste dès qu'un scan a été vendu. Un scan antérieur à un
  changement de liste n'est plus comparable à son re-scan.
- « Le Chat » est l'étiquette affichée, `mistral` l'identifiant et
  `score_mistral` la colonne : on nomme partout l'assistant que le public
  utilise, mais la base garde le nom de l'éditeur, plus stable.
- La table des prix `packages/core/src/cost.ts` est typée `Record<EngineId, …>` :
  ajouter un moteur sans son tarif ne compile pas. C'est volontaire.
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
