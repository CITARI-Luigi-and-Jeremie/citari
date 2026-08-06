# Cahier des charges — Plateforme Citari (v2)

> **Ce document dit CE QU'ON VEUT, pas comment c'est fait aujourd'hui.**
>
> Il a été écrit avant la construction et reste la référence sur le produit :
> l'offre, les 3 chantiers, la checklist du sprint, les non-objectifs. Ces
> parties sont toujours vraies.
>
> Pour l'état RÉEL du code, ne vous fiez pas à ce fichier : lisez
> [CLAUDE.md](CLAUDE.md) et [JOURNAL.md](JOURNAL.md). Les sections techniques
> ci-dessous ont été corrigées le 06/08/2026 là où elles étaient devenues
> fausses, mais un cahier des charges vieillit toujours plus vite que le code.

Il décrit TOUT ce qu'on construit : (A) le scanner gratuit qui génère les leads, (B) la landing qui vend le Sprint GEO, (C) l'usine de livraison interne pour exécuter les missions clients.

## 0. Contexte business

- **Le business** : agence GEO (Generative Engine Optimization) pour PME/ETI francophones. On fait apparaître les marques de nos clients dans les réponses de ChatGPT, Claude, Gemini et Perplexity.
- **Le modèle** :
  1. Scan gratuit (lead magnet) : le prospect mesure sa visibilité IA, découvre qu'il est invisible face à ses concurrents.
  2. Call de restitution gratuit (30 min) : on commente ses résultats.
  3. Sprint GEO — 2 900 € paiement unique : mission de 30 jours où on améliore sa visibilité (3 chantiers, §1). Option Sprint Domination à 4 900 €.
  4. Re-scan offert à J+90 : on mesure la progression → preuve → upsell (2e sprint ou maintenance mensuelle).
- **L'équipe** : 1 fondateur + Claude Code. Maximiser le levier d'une personne seule.
- **Tout vit dans ce dépôt** : `apps/citari` (site public ET moteur de scan), `apps/admin` (back-office), `packages/toolkit` (CLI de livraison). Le tunnel public a transité par Lovable entre le 01/08 et le 05/08/2026 ; seule la façade en avait été reprise, le moteur est ici.

## 1. Les 3 chantiers d'un Sprint

**Chantier 1 — Technique** (~90 % automatisable) : débloquer les crawlers IA dans robots.txt (GPTBot, ClaudeBot, PerplexityBot, Google-Extended…), générer/poser un llms.txt, injecter schema.org (Organization, Product/Service, FAQPage, LocalBusiness, Article), restructurer les pages clés en format « réponse directe » (titre-question, réponse en 2 phrases en tête, Hn propres).

**Chantier 2 — Contenu** (~70 % automatisable) : pages comparatives « Client vs Concurrent », pages « Alternatives à [leader] », FAQ métier balisée, guides d'achat factuels (chiffres, prix, critères). Sujets choisis à partir des requêtes du scan où le client est absent.

**Chantier 3 — Citations externes** (~20 % automatisable) : identifier les sources que les moteurs citent pour les concurrents (données Perplexity du scan), inscriptions annuaires/comparateurs sectoriels, pitchs presse spécialisée, forums/Reddit/fiches (Google Business, Wikipedia si éligible). Le fondateur exécute, l'outil prépare.

## 2. Monorepo & stack

- Turborepo — `apps/citari`, `apps/admin`, `packages/toolkit`, `packages/core`.
- `apps/citari` : TanStack Start, build vers Cloudflare Workers. `apps/admin` : Next.js. TypeScript strict, Tailwind, Supabase, Resend.
- **6 moteurs**, appelés directement depuis `apps/citari/src/lib/moteurs.server.ts` : ChatGPT, Claude, Gemini, Perplexity, Grok, Le Chat. Perplexity et Gemini rendent leurs sources, ce qui alimente le Chantier 3. Les versions de modèles sont FIGÉES et un test l'impose : voir `.env.example`.
- Clés API en env. Coût par scan journalisé et plafonné par mode (0,25 € aperçu, 3 € complet, 1,50 € contrôle). **2 scans par jour et par IP**, résultat mis en cache 3 jours.

## 3. Le tunnel public (`apps/citari`)

> Section historique : ce tunnel a été `apps/web`, puis un projet Lovable. Il
> est depuis le 05/08/2026 servi par `apps/citari`, dans ce dépôt, moteur de
> scan compris. Ce qui suit décrit le comportement attendu du produit.

### 3.1 Landing
- H1 : « Votre marque est-elle invisible dans ChatGPT ? »
- Sous-titre : « Testez gratuitement votre visibilité dans ChatGPT, Claude, Gemini et Perplexity en 90 secondes. »
- Formulaire au-dessus de la ligne de flottaison. Section offre Sprint GEO : promesse, 3 chantiers vulgarisés, livrables exacts, 2 900 € (Domination 4 900 €), « 3 sprints par mois maximum », paiement 50/50, re-scan J+90 inclus.
- Honnêteté affichée : on garantit les actions livrées, pas un score exact (intégration en 4-12 semaines).
- FAQ balisée, schema.org, llms.txt : le site est sa propre démonstration GEO.

### 3.2 Scanner (flux)
1. Formulaire : marque + URL, secteur (~20 choix + libre), jusqu'à 3 concurrents, langue (FR défaut, IT, EN).
2. Génération des questions « intention d'achat » **via Gemini** : 20 en aperçu, 24 en complet. Le nom de la marque n'est JAMAIS prononcé dans la question, sinon on mesurerait la mémoire du moteur et non la découverte spontanée.
3. Exécution asynchrone (job en base + polling, jamais de requête bloquante), progression temps réel, cible < 90 s.
4. Teaser : score (0-100), part de voix, écart de comptage avec les concurrents comparables. Le verbatim reste VERROUILLÉ côté serveur tant qu'aucun email n'est saisi ; un floutage CSS ne protégerait rien.
5. L'email est demandé dès le formulaire, c'est la contrepartie du scan gratuit. Rapport complet accessible par jeton signé, sans compte.
6. CTA : réservation du call (BOOKING_URL).

### 3.3 Scoring (`apps/citari/src/lib/score.ts`)
- Détection en 2 étapes : matching déterministe (nom, variantes, domaine) puis classification LLM en batch → `{ brand, mentioned, position, sentiment, is_recommended }`.
- Score 0-100 : mention 50 %, position moyenne 20 %, recommandation explicite 20 %, sentiment 10 %. Détail par moteur et par requête.
- Part de voix = mentions marque / mentions totales (marque + concurrents).

### 3.4 Rapport complet
1. Score global + par moteur. 2. Part de voix. 3. Tableau requête par requête. 4. 3-5 verbatims, marques surlignées. 5. Sources citées par Perplexity pour les concurrents (argument n°1). 6. « 10 actions prioritaires » LLM mappées sur les 3 chantiers. 7. CTA call.
- Mode comparaison : si scan précédent pour la même marque → avant/après sur tous les indicateurs (rapport J+90).

## 4. `apps/admin`
- Auth simple (mot de passe env var en v1).
- Leads : liste des scans (email, marque, secteur, score, date, statut), détail raw, export CSV.
- Clients : lead → client, fiche (accès site, contacts, secteur, concurrents, dates sprint).
- Suivi de sprint : checklist 30 jours (§6), cases à cocher, notes, liens livrables.
- Planification J+90 : re-scan programmable, rappel email fondateur.

## 5. `packages/toolkit` — CLI (`pnpm toolkit <commande>`)
Chaque outil lit/écrit Supabase (rattaché à un client), produit des fichiers dans `deliverables/<client>/`.

- **5.1 `audit-technique <url>`** (C1) : crawle (home + pages principales, sitemap), vérifie robots.txt (crawlers IA bloqués ?), llms.txt, schema.org (extraction + validation), Hn, meta, temps de réponse. Sortie : rapport markdown + score technique + actions.
- **5.2 `generate-fixes <client>`** (C1) : robots.txt corrigé, llms.txt complet, blocs JSON-LD par page. Deux formats : fichiers prêts à poser OU document de specs pour le dev du client.
- **5.3 `content-brief <client>`** (C2) : croise scan (requêtes où absent) et site existant → 4-6 contenus prioritaires : requête cible, format, plan détaillé, données à demander au client.
- **5.4 `draft-content <client> <brief-id>`** (C2) : brouillon complet à partir du brief + données client. Faits précis, chiffres, tableaux, réponse directe en tête, ton non-IA-générique, schema.org intégré. Sortie markdown + HTML. Le fondateur relit TOUJOURS.
- **5.5 `citation-targets <client>`** (C3) : agrège les sources Perplexity des concurrents, enrichit avec la table `directories` (actif réutilisable). Sortie : liste priorisée + brouillons d'emails de pitch. Suivi de statut dans l'admin.
- **5.6 `rescan <client>`** : relance avec les MÊMES requêtes, rapport avant/après.

## 6. Checklist opérationnelle du Sprint (encodée dans l'admin)
- **Semaine 1** : call de cadrage → `audit-technique` → `generate-fixes` → validation + pose des fixes → `content-brief` → validation des sujets client.
- **Semaine 2** : `draft-content` × 2-3 → relecture → livraison → `citation-targets` → premières inscriptions annuaires.
- **Semaine 3** : `draft-content` × 2-3 restants → pitchs presse → suivi inscriptions.
- **Semaine 4** : relances citations → vérification technique finale → rapport de fin de sprint → programmation re-scan J+90.

## 7. Base de données
16 tables, schéma fidèle dans [supabase/schema.sql](supabase/schema.sql) : `scans`, `queries`, `responses`, `mentions`, `cost_log`, `leads`, `follow_ups`, `clients`, `client_data`, `sprints`, `sprint_tasks`, `deliverables`, `citation_targets`, `directories`, `crawler_hits`, `brand_overrides`. RLS activé sans aucune politique : tout passe par la clé de service.

## 8. Non-objectifs (à refuser)
Pas de comptes/login prospects, pas de paiement en ligne (50/50 manuel), pas de scraping des UIs de chatbots (APIs uniquement, limite mentionnée dans le rapport), pas de multi-tenant, pas de dashboard de monitoring continu.

## 9. Plan de build (ordre imposé)
- **Phase 1 (j1-4)** : schéma DB, moteurs, génération de questions, scan asynchrone, scoring. *(Plan d'origine, conservé pour mémoire. Le moteur a depuis été réécrit dans `apps/citari` ; celui de `packages/core` a été supprimé le 06/08/2026.)*
- **Phase 2 (j5-9)** : scanner public complet + landing.
- **Phase 3 (j10-11)** : admin, rate limiting, Turnstile, logs de coûts.
- **Phase 4 (j12-16)** : les 6 outils du toolkit, testés sur cas réels.
- **Phase 5 (j17)** : simulation bout en bout d'un sprint.

## 10. Variables d'environnement
Voir `.env.example`.

## 11. Définition de « terminé »
- Un prospect inconnu peut : scanner, score < 2 min, email, PDF, call — sans intervention manuelle.
- Le fondateur peut : convertir lead → client, dérouler la checklist, générer chaque livrable, programmer et exécuter le re-scan J+90 avec avant/après.
- Coût par scan journalisé et conforme au plafond du mode. Détection validée manuellement sur des scans réels.
