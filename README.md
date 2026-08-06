# Citari

Agence GEO : on mesure si une marque est citée par les IA, puis on l'y fait
apparaître. Ce dépôt contient tout, le site public, le moteur de mesure, le
back-office et l'usine de livraison.

- **Reprendre le projet à froid** : [CLAUDE.md](CLAUDE.md), lu automatiquement
  par Claude Code.
- **Pourquoi les choses sont comme elles sont** : [JOURNAL.md](JOURNAL.md).
  C'est le document le plus utile du dépôt, il garde les décisions ET leurs
  raisons, y compris les pièges déjà payés.
- **Mettre en ligne** : [docs/DEPLOIEMENT.md](docs/DEPLOIEMENT.md).
- **Ce qu'il reste à créer comme comptes** : [SETUP.md](SETUP.md).

## Ce qu'il y a dans le dépôt

| Dossier | Rôle | Techno |
|---|---|---|
| `apps/citari` | Site public **et moteur de scan** | TanStack Start, port 8080 |
| `apps/admin` | Back-office : leads, clients, sprints, relances | Next.js, port 3001 |
| `packages/toolkit` | 19 commandes de livraison en CLI | tsx |
| `packages/core` | Briques partagées : accès Supabase, appels JSON au modèle, crawl |  |

**Un seul moteur de scan existe** : `apps/citari/src/lib/orchestrateur.server.ts`.
Il y en a eu un second dans `packages/core`, resté sur un schéma périmé ; il a
été supprimé le 06/08/2026. N'en recréez pas.

## Démarrer

```bash
pnpm install
```

Les clés vivent dans `apps/citari/.env.local`, jamais versionné. Le modèle des
variables est dans [.env.example](.env.example), qui documente aussi pourquoi
les modèles interrogés sont figés.

```bash
npm --prefix apps/citari run dev   # site + moteur, http://localhost:8080
pnpm --filter admin dev            # back-office, http://localhost:3001
```

Le site est **hors du workspace pnpm** (`!apps/citari` dans
`pnpm-workspace.yaml`) : il a son propre gestionnaire de paquets. Un
`pnpm --filter tanstack_start_ts …` répond « No projects matched ». C'est npm
pour lui, pnpm pour tout le reste.

La base est déjà en place, Supabase région Paris. Son schéma fidèle est dans
[supabase/schema.sql](supabase/schema.sql) : 16 tables, RLS activé sans aucune
politique, donc tout passe par la clé de service, côté serveur uniquement.

## Le scan en trois modes

| Mode | Questions × moteurs | Recherche web | Coût réel | Plafond |
|---|---|---|---|---|
| `apercu` | 20 × 2 (ChatGPT, Gemini) | non | ~0,14 € | 0,25 € |
| `complet` | 24 × 6 | oui | ~1,06 € | 3 € |
| `controle` | 24 × 4 | oui | ~0,84 € | 1,50 € |

Deux scans par jour et par adresse IP, résultat mis en cache trois jours. Le
navigateur pilote la mesure en sondant le serveur, et chaque réponse est écrite
individuellement, donc une requête coupée ne perd rien.

**La formule du score est figée** : présence 50 %, rang 20 %, recommandation
explicite 20 %, tonalité 10 %. Elle ne doit pas bouger, sinon la comparaison
J+90 vendue au client perd son sens. Les modèles interrogés sont figés pour la
même raison, et un test le fait respecter.

## Livrer un sprint

```bash
pnpm toolkit --help
pnpm toolkit audit-technique https://client.fr --client "Client"
pnpm toolkit relance --all
pnpm toolkit concurrents
pnpm toolkit controle-45 "Client"
```

Le manuel complet : [docs/LIVRAISON.md](docs/LIVRAISON.md). Les sorties
atterrissent dans `deliverables/<client>/`, le suivi se fait dans l'admin.

**Rien n'est envoyé automatiquement.** Le toolkit prépare, un humain relit et
envoie.

## Vérifier

```bash
pnpm -r typecheck
pnpm -r test
```

90 tests, qui couvrent ce qui coûte de l'argent ou de la crédibilité :
regroupement des marques, part de voix, rédaction des emails, gagnabilité,
modèles figés. Le site se vérifie en le construisant :

```bash
npm --prefix apps/citari run build
```

## Ce qui bloque aujourd'hui (06/08/2026)

Le code est prêt et éprouvé sur des scans réels. Ce qui manque n'est pas du
code, ce sont des comptes :

1. **Deux back-offices coexistent**, et l'un doit disparaître avant la mise en
   ligne : `apps/admin` (celui qu'on utilise, et qui fonctionne) et la route
   `/admin` du site, protégée par un mot de passe bidon publié en clair ici.
   Leurs listes de statuts divergent. Voir [SETUP.md](SETUP.md).
2. Resend et mise en ligne : voir [SETUP.md](SETUP.md). Le domaine `citari.fr`
   est acheté chez Hostinger ; le site part sur Cloudflare Workers, puis
   basculera sur le VPS Hostinger.

Le crédit Anthropic, longtemps le bloquant n° 1, est rechargé depuis le
06/08/2026 : les six moteurs répondent de nouveau. `ADMIN_PASSWORD`, longtemps
annoncé comme absent, est en fait renseigné dans le `.env` de la racine.
