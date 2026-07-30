# Mise en production — checklist

Tout le code est prêt et testé en mode démo. Voici ce qu'il reste à faire, dans l'ordre, pour passer en réel.

## 1. Supabase (~10 min)
- [ ] Créer un projet sur https://supabase.com
- [ ] SQL Editor → coller et exécuter `supabase/migrations/0001_init.sql`
- [ ] Récupérer `SUPABASE_URL` et `SUPABASE_SERVICE_ROLE_KEY` (Settings → API)

## 2. Clés API des 4 moteurs
- [ ] OpenAI : https://platform.openai.com/api-keys → `OPENAI_API_KEY`
- [ ] Anthropic : https://console.anthropic.com → `ANTHROPIC_API_KEY`
- [ ] Google AI Studio : https://aistudio.google.com/apikey → `GOOGLE_AI_API_KEY`
- [ ] Perplexity : https://www.perplexity.ai/settings/api → `PERPLEXITY_API_KEY`

## 3. Emails & réservation
- [ ] Resend : https://resend.com → `RESEND_API_KEY`, vérifier le domaine d'envoi, remplir `RESEND_FROM`
- [ ] Cal.com (ou Calendly) : créer l'événement « Call de restitution 30 min » → `BOOKING_URL`
- [ ] `FOUNDER_EMAIL` (rappels J+90) et `ADMIN_PASSWORD` (fort)

## 4. Basculer hors mode démo
- [ ] Remplir `apps/web/.env.local` et `apps/admin/.env.local` avec les vraies valeurs et **supprimer `GEO_MOCK=1`**
- [ ] PDF : `pnpm --filter web exec playwright install chromium`

## 5. Validation Phase 1 (obligatoire avant tout prospect)
- [ ] 3 scans CLI sur de vraies marques : `pnpm --filter @geo/core scan:cli -- --brand … --url … --sector … --competitors …`
- [ ] Vérifier manuellement la détection de mentions sur 5 scans réels
- [ ] Vérifier le coût loggé (< 1,50 €/scan) dans la table `cost_log`

## 6. Déploiement Vercel
- [ ] 2 projets Vercel (root `apps/web` et `apps/admin`), toutes les env vars, `NEXT_PUBLIC_SITE_URL` = domaine public du site
- [ ] Turnstile (anti-bot) : https://dash.cloudflare.com → `TURNSTILE_SECRET` + `NEXT_PUBLIC_TURNSTILE_SITE_KEY`
- [ ] Le cron du rappel J+90 est déclaré dans `apps/admin/vercel.json` — définir `CRON_SECRET`
- [ ] Après mise en ligne : lancer `pnpm toolkit audit-technique https://votre-domaine.fr` sur votre propre site (il doit être exemplaire)

## Mode démo (référence)
`GEO_MOCK=1` simule les 4 moteurs et la base (fichier partagé dans le dossier temporaire).
Utile pour : démo produit, tests UI, développement sans coût. Un bandeau jaune s'affiche sur toutes les pages.
