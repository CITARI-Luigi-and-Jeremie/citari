# Mise en production — checklist

Tout le code est prêt et testé en mode démo. Voici ce qu'il reste à faire, dans l'ordre, pour passer en réel.

## 1. Supabase (~10 min)
- [ ] Créer un projet sur https://supabase.com
- [ ] SQL Editor → exécuter **dans l'ordre** `supabase/migrations/0001_init.sql`, `0002_seed_directories.sql`, `0003_follow_ups.sql`
- [ ] Récupérer `SUPABASE_URL` et `SUPABASE_SERVICE_ROLE_KEY` (Settings → API)

## 2. Clés API des 4 moteurs
- [ ] OpenAI : https://platform.openai.com/api-keys → `OPENAI_API_KEY`
- [ ] Anthropic : https://console.anthropic.com → `ANTHROPIC_API_KEY`
- [ ] Google AI Studio : https://aistudio.google.com/apikey → `GOOGLE_AI_API_KEY`
- [ ] Perplexity : https://www.perplexity.ai/settings/api → `PERPLEXITY_API_KEY`
- [ ] xAI (Grok) : https://console.x.ai → `XAI_API_KEY`
- [ ] Mistral (Le Chat) : https://console.mistral.ai → `MISTRAL_API_KEY`

## 3. Emails & réservation
- [ ] Resend : https://resend.com → `RESEND_API_KEY`, vérifier le domaine d'envoi, remplir `RESEND_FROM`
- [ ] Cal.com (ou Calendly) : créer l'événement « Call de restitution 30 min » → `BOOKING_URL`
- [ ] `FOUNDER_EMAIL` (rappels J+90) et `ADMIN_PASSWORD` (fort)

## 4. Basculer hors mode démo
- [ ] Remplir `apps/admin/.env.local` avec les vraies valeurs et **supprimer `GEO_MOCK=1`**

## 4 bis. Obligations légales (bloquant pour la mise en ligne)

Le site public est servi par **Lovable** — ces pages y vivent, pas dans ce dépôt :

- [ ] `src/routes/mentions-legales.tsx` : dénomination, SIRET, RCS, TVA, hébergeur — obligatoire, art. 6 III LCEN
- [ ] `src/routes/confidentialite.tsx` : responsable de traitement, email de contact
- [ ] Souscrire à un médiateur de la consommation agréé si vous vendez à des non-professionnels
- [ ] Vérifier que le lien de désinscription est bien présent dans les emails Resend

## 5. Validation Phase 1 (obligatoire avant tout prospect)
- [ ] 3 scans CLI sur de vraies marques : `pnpm --filter @geo/core scan:cli -- --brand … --url … --sector … --competitors …`
- [ ] Vérifier manuellement la détection de mentions sur 5 scans réels
- [ ] Vérifier le coût loggé (< 1,50 €/scan) dans la table `cost_log`

## ⚠ Durée réelle d'un scan et hébergement

Un scan réel = ~96 appels moteurs (24 requêtes × 4) + ~20 appels de classification, soit **1,5 à 4 minutes**
selon la latence des APIs (la classification est parallélisée, mais la cible < 90 s dépend des moteurs).
Le scan tourne en tâche de fond après la réponse HTTP (`after()`), donc l'utilisateur voit la progression
sans bloquer — mais la fonction serverless doit vivre assez longtemps :

Le scan est exécuté par Lovable, pas ici : son orchestrateur traite **8 paires
(question × moteur) par appel**, la page appelant en boucle jusqu'à la fin. C'est
précisément ce qui le rend insensible aux limites de durée du serverless — il n'y
a donc rien à configurer côté timeout.

- Premier scan réel : surveiller la table `cost_log` et le champ `scans.status` pour vérifier
  qu'aucun scan ne reste bloqué en `running`.

## 6. Déploiement Vercel
- [ ] 1 projet Vercel (root `apps/admin`), toutes les env vars, `NEXT_PUBLIC_SITE_URL` = domaine public du site Lovable
- [ ] Turnstile (anti-bot) : https://dash.cloudflare.com → `TURNSTILE_SECRET` + `NEXT_PUBLIC_TURNSTILE_SITE_KEY`
- [ ] Le cron du rappel J+90 est déclaré dans `apps/admin/vercel.json` — définir `CRON_SECRET`
- [ ] Après mise en ligne : lancer `pnpm toolkit audit-technique https://votre-domaine.fr` sur votre propre site (il doit être exemplaire)

## Mode démo (référence)
`GEO_MOCK=1` simule les 5 moteurs et la base (fichier partagé dans le dossier temporaire).
Utile pour : démo produit, tests UI, développement sans coût. Un bandeau jaune s'affiche sur toutes les pages.
