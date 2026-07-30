# GEO Sprint — plateforme complète

Agence GEO (Generative Engine Optimization) : scanner de visibilité IA (lead magnet), landing de vente du Sprint GEO, back-office et usine de livraison CLI. Cahier des charges complet : [SPEC.md](SPEC.md).

## Mode démo (aucune clé requise)

`GEO_MOCK=1` (déjà actif dans `apps/*/.env.local`) simule les 4 moteurs IA et la base de données
(fichier partagé entre web et admin). Tout le parcours fonctionne : scan → teaser → rapport →
lead → client → checklist → re-scan J+90 avec comparaison. Un bandeau jaune signale le mode démo.
Mot de passe admin démo : `demo`. Pour passer en réel : suivre [SETUP.md](SETUP.md).

## Démarrage

```bash
pnpm install
cp .env.example .env   # remplir les clés (les apps Next lisent .env à la racine via leur cwd : copier aussi dans apps/web/.env.local et apps/admin/.env.local, ou exporter les variables)
```

1. **Base de données** : créer un projet Supabase, puis exécuter `supabase/migrations/0001_init.sql` (SQL Editor ou `supabase db push`).
2. **PDF (optionnel)** : `pnpm --filter web exec playwright install chromium` pour joindre le PDF aux emails.
3. **Lancer** :

```bash
pnpm dev            # web sur :3000 + admin sur :3001
```

## Valider le pipeline sans UI (Phase 1)

```bash
pnpm --filter @geo/core scan:cli -- --brand "Acme" --url https://acme.fr --sector "logiciel RH" --competitors "PayFit,Lucca"
```

À faire sur 3 vraies marques avant de servir des prospects ; vérifier manuellement la détection de mentions sur 5 scans réels (définition de « terminé », §11).

## Livraison d'un sprint (toolkit)

```bash
pnpm toolkit audit-technique https://client.fr --client "Client"   # Chantier 1 : audit
pnpm toolkit generate-fixes "Client"                               # Chantier 1 : robots.txt, llms.txt, JSON-LD, specs
pnpm toolkit content-brief "Client"                                # Chantier 2 : 4-6 briefs
pnpm toolkit draft-content "Client" <brief-id>                     # Chantier 2 : rédaction (relecture obligatoire)
pnpm toolkit citation-targets "Client"                             # Chantier 3 : cibles + pitchs
pnpm toolkit rescan "Client"                                       # J+90 : mêmes requêtes, rapport avant/après
```

Sorties fichiers dans `deliverables/<client>/`, suivi dans l'admin (`/clients/<id>`).

## Workflow business

1. Prospect scanne sur le site → teaser (score, part de voix, verbatim) → capture email → rapport complet + PDF.
2. Call de restitution (BOOKING_URL) → vente du Sprint (2 900 € / Domination 4 900 €).
3. Admin : lead → client (checklist 30 jours créée automatiquement) → livraison via toolkit.
4. Re-scan J+90 (rappel email automatique via `GET /api/cron/rescan-reminder?secret=CRON_SECRET`, à appeler quotidiennement) → rapport avant/après → upsell.

## Tests & qualité

```bash
pnpm test        # unitaires core (détection de mentions, scoring)
pnpm typecheck   # tout le monorepo
```

Garde-fous intégrés : coût par scan loggé (`cost_log`) et plafonné à 1,50 €, rate limit 3 scans/jour/IP, Turnstile optionnel, APIs officielles uniquement (pas de scraping d'UI — limite mentionnée dans le rapport).
