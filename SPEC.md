# Cahier des charges — Plateforme Citari (v2, complet)

Il décrit TOUT ce qu'on construit : (A) le scanner gratuit qui génère les leads, (B) la landing qui vend le Sprint GEO, (C) l'usine de livraison interne pour exécuter les missions clients.

## 0. Contexte business

- **Le business** : agence GEO (Generative Engine Optimization) pour PME/ETI francophones. On fait apparaître les marques de nos clients dans les réponses de ChatGPT, Claude, Gemini et Perplexity.
- **Le modèle** :
  1. Scan gratuit (lead magnet) : le prospect mesure sa visibilité IA, découvre qu'il est invisible face à ses concurrents.
  2. Call de restitution gratuit (30 min) : on commente ses résultats.
  3. Sprint GEO — 2 900 € paiement unique : mission de 30 jours où on améliore sa visibilité (3 chantiers, §1). Option Sprint Domination à 4 900 €.
  4. Re-scan offert à J+90 : on mesure la progression → preuve → upsell (2e sprint ou maintenance mensuelle).
- **L'équipe** : 1 fondateur + Claude Code. Maximiser le levier d'une personne seule.
- **Le tunnel public (landing, scan, rapport) est servi par Lovable.** Ce dépôt porte `apps/admin` (back-office de livraison) et `packages/toolkit` (CLI de livraison).

## 1. Les 3 chantiers d'un Sprint

**Chantier 1 — Technique** (~90 % automatisable) : débloquer les crawlers IA dans robots.txt (GPTBot, ClaudeBot, PerplexityBot, Google-Extended…), générer/poser un llms.txt, injecter schema.org (Organization, Product/Service, FAQPage, LocalBusiness, Article), restructurer les pages clés en format « réponse directe » (titre-question, réponse en 2 phrases en tête, Hn propres).

**Chantier 2 — Contenu** (~70 % automatisable) : pages comparatives « Client vs Concurrent », pages « Alternatives à [leader] », FAQ métier balisée, guides d'achat factuels (chiffres, prix, critères). Sujets choisis à partir des requêtes du scan où le client est absent.

**Chantier 3 — Citations externes** (~20 % automatisable) : identifier les sources que les moteurs citent pour les concurrents (données Perplexity du scan), inscriptions annuaires/comparateurs sectoriels, pitchs presse spécialisée, forums/Reddit/fiches (Google Business, Wikipedia si éligible). Le fondateur exécute, l'outil prépare.

## 2. Monorepo & stack

- Turborepo — `apps/admin`, `packages/toolkit`, `packages/core`.
- Next.js 15 (App Router), TypeScript strict, Tailwind + shadcn/ui, Supabase, Resend, Vercel.
- Providers LLM (`packages/core`) : interface `LLMProvider.ask(query, lang) -> { text, citations[] }`, 4 implémentations : OpenAI (gpt-4o), Anthropic (Claude Sonnet), Google Gemini, Perplexity (sonar, retourne les citations — critiques pour le Chantier 3).
- Clés API en env. Coût par scan loggé, plafonné (~30 requêtes × 4 moteurs). Rate limiting IP (3 scans/jour) + Cloudflare Turnstile.

## 3. Le tunnel public — servi par Lovable

> Section historique : ce tunnel était `apps/web` dans ce dépôt. Il est depuis le
> 2026-08-01 servi par le projet Lovable, qui embarque aussi le moteur de scan.
> Ce qui suit décrit toujours le comportement attendu du produit.

### 3.1 Landing
- H1 : « Votre marque est-elle invisible dans ChatGPT ? »
- Sous-titre : « Testez gratuitement votre visibilité dans ChatGPT, Claude, Gemini et Perplexity en 90 secondes. »
- Formulaire au-dessus de la ligne de flottaison. Section offre Sprint GEO : promesse, 3 chantiers vulgarisés, livrables exacts, 2 900 € (Domination 4 900 €), « 3 sprints par mois maximum », paiement 50/50, re-scan J+90 inclus.
- Honnêteté affichée : on garantit les actions livrées, pas un score exact (intégration en 4-12 semaines).
- FAQ balisée, schema.org, llms.txt : le site est sa propre démonstration GEO.

### 3.2 Scanner (flux)
1. Formulaire : marque + URL, secteur (~20 choix + libre), jusqu'à 3 concurrents, langue (FR défaut, IT, EN).
2. Génération de 20-30 requêtes « intention d'achat » via Claude (secteur + fetch home). Mix : 40 % comparatives, 25 % problème, 20 % locales si pertinent, 15 % confiance. JSON strict validé Zod.
3. Exécution asynchrone (job en base + polling, jamais de requête bloquante), progression temps réel, cible < 90 s.
4. Teaser sans email : Score de Visibilité IA (0-100), part de voix vs concurrents, 1 verbatim où un concurrent est cité et pas la marque.
5. Capture email → rapport complet (page à lien signé + PDF Playwright via Resend).
6. CTA : réservation du call (BOOKING_URL).

### 3.3 Scoring (`packages/core`)
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
`scans`, `queries`, `responses`, `mentions`, `leads`, `clients`, `sprints`, `sprint_tasks`, `deliverables`, `citation_targets`, `directories`, `client_data`.

## 8. Non-objectifs (à refuser)
Pas de comptes/login prospects, pas de paiement en ligne (50/50 manuel), pas de scraping des UIs de chatbots (APIs uniquement, limite mentionnée dans le rapport), pas de multi-tenant, pas de dashboard de monitoring continu.

## 9. Plan de build (ordre imposé)
- **Phase 1 (j1-4)** : schéma DB, `packages/core` (4 providers + tests détection), génération de requêtes, scan asynchrone, scoring. Validation CLI sur 3 vraies marques AVANT toute UI.
- **Phase 2 (j5-9)** : scanner public complet + landing.
- **Phase 3 (j10-11)** : admin, rate limiting, Turnstile, logs de coûts.
- **Phase 4 (j12-16)** : les 6 outils du toolkit, testés sur cas réels.
- **Phase 5 (j17)** : simulation bout en bout d'un sprint.

## 10. Variables d'environnement
Voir `.env.example`.

## 11. Définition de « terminé »
- Un prospect inconnu peut : scanner, score < 2 min, email, PDF, call — sans intervention manuelle.
- Le fondateur peut : convertir lead → client, dérouler la checklist, générer chaque livrable, programmer et exécuter le re-scan J+90 avec avant/après.
- Coût par scan loggé < 1,50 €. Détection validée manuellement sur 5 scans réels.
