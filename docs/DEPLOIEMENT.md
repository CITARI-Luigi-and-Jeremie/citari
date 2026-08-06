# Mettre Citari en ligne

Trois choses à mettre en ligne, dans cet ordre : le site, l'envoi d'emails, le
poste de pilotage. Chacune est indépendante des deux autres.

Tout ce qui suit a été vérifié en local sur le vrai bundle de production, pas
seulement en développement : le worker Cloudflare a lancé un scan réel de bout
en bout (Keobiz, 34/100, 20 questions, 40 réponses, lead créé avec son
consentement).

---

## 1. Le site

### Ce que le build produit

`vite build` passe par nitro et vise **Cloudflare Workers**. La sortie est dans
`.output/`, avec un `wrangler.json` généré. Le drapeau `nodejs_compat` est actif,
ce qui permet au code de lire ses secrets dans `process.env` comme partout
ailleurs, sans traitement particulier.

### Une seule fois : le compte et les secrets

Il faut un compte Cloudflare. Je ne peux pas le créer à ta place, c'est la seule
étape qui te revient obligatoirement.

```bash
npx wrangler login
```

Puis poser les huit secrets. Ils ne transitent jamais par le dépôt ni par un
fichier de configuration : `wrangler secret put` les demande de façon
interactive et les stocke chiffrés chez Cloudflare.

```bash
cd apps/citari
for cle in OPENAI_API_KEY GOOGLE_AI_API_KEY ANTHROPIC_API_KEY \
           PERPLEXITY_API_KEY XAI_API_KEY MISTRAL_API_KEY \
           SUPABASE_URL SUPABASE_SERVICE_ROLE_KEY; do
  npx wrangler secret put "$cle" --name citari
done
```

Il faut aussi poser `NEXT_PUBLIC_SITE_URL` avec le vrai domaine. Tant qu'il vaut
`http://localhost:8080`, les liens de rapport envoyés par email seront
inutilisables.

### Brancher le domaine

Le domaine est chez **Hostinger** (acheté le 06/08/2026), le site tourne chez
Cloudflare. Rattacher un domaine à un worker **exige que la zone DNS soit gérée
par Cloudflare** : un simple CNAME depuis Hostinger ne suffit pas.

1. Ajouter le domaine comme site dans Cloudflare, plan gratuit.
2. Cloudflare donne deux serveurs de noms.
3. Chez Hostinger, remplacer les serveurs de noms du domaine par ceux-là.
   C'est le seul geste à faire côté Hostinger.
4. Attendre la propagation, de quelques minutes à quelques heures.
5. Attacher le domaine au worker `citari` en « Custom Domain ». Cloudflare pose
   le certificat TLS tout seul.
6. Poser `NEXT_PUBLIC_SITE_URL` avec le domaine réel, en `https://`.

L'étape 6 n'est pas cosmétique : tant que la variable vaut
`http://localhost:8080`, les liens de rapport envoyés par email sont
inutilisables, et c'est le lien sur lequel le prospect clique.

### Ensuite, à chaque mise en ligne

```bash
./apps/citari/scripts/deployer.sh
```

Le script construit, renomme le worker en `citari` (sans quoi il s'appellerait
`luigirevelli-sprint-voice-insight-apps-citari`, ce qui deviendrait le
sous-domaine public), puis déploie.

### Ce qui reste à surveiller au premier vrai trafic

Un lot d'aperçu déclenche une vingtaine d'appels d'API dans une seule requête.
Le plan gratuit de Cloudflare limite à **50 sous-requêtes** par requête, le plan
payant à 1000. Un aperçu passe, un diagnostic complet est plus juste. Si des
scans s'arrêtent en cours de route sans erreur claire, c'est la première piste :
réduire la taille des lots dans `lotDuMode()`, ou passer au plan payant.

### Après : la bascule vers le VPS Hostinger

Cloudflare est l'étape, pas la destination. Une fois le front de Jérémie intégré
et le reste terminé, tout passe sur le VPS Hostinger. Ce que ça demande, écrit
ici pour que ce ne soit pas découvert en cours de route :

- changer le preset nitro, `cloudflare-module` → `node-server` ;
- un service qui survit au redémarrage, systemd ou PM2 ;
- un reverse proxy et son certificat, nginx ou Caddy avec Let's Encrypt ;
- reporter les huit secrets de `wrangler secret` vers le `.env` du serveur ;
- repointer les serveurs de noms de Cloudflare vers Hostinger ;
- **relancer un scan réel de bout en bout.** C'est la seule preuve qui vaut, et
  c'est ainsi que le worker Cloudflare avait été validé.

Ce que la bascule fait gagner : la limite des 50 sous-requêtes disparaît, donc
le diagnostic complet à six moteurs cesse d'être le cas juste.

---

## 2. L'envoi d'emails

**Rien ne part aujourd'hui.** Le code d'envoi existe
(`apps/admin/lib/resend.ts`), mais sans `RESEND_API_KEY` il se contente de
journaliser « email non envoyé ». Les adresses sont collectées et stockées, elles
ne sont simplement pas exploitées.

Pour l'activer :

1. Créer un compte sur resend.com et y ajouter le domaine d'envoi.
2. Poser les enregistrements DNS que Resend indique : **SPF et DKIM**. Sans eux,
   les messages partent en indésirables, et une réputation d'expéditeur abîmée
   se répare lentement.
3. Ajouter `RESEND_API_KEY` dans le `.env` de la racine, et en secret Cloudflare
   si le site doit envoyer lui aussi.

N'envoie rien en masse avant d'avoir fait relire les mentions par un juriste. Le
consentement est horodaté en base (`leads.consent_at`) et la mention figure sous
le formulaire, mais la prospection B2B a ses règles.

---

## 3. Le poste de pilotage

`apps/admin` est une application Next distincte, qui n'a pas besoin d'être
publique. Deux options :

- **La garder en local**, lancée à la demande. C'est le plus simple et le plus
  sûr : elle utilise la clé de service Supabase, qui contourne toutes les règles
  d'accès.
- **La déployer** sur un hébergeur Node, protégée par `ADMIN_PASSWORD`. Dans ce
  cas, changer le mot de passe généré à l'installation et ne jamais l'exposer
  sans HTTPS.

Elle lit ses secrets dans le `.env` de la racine, chargé par `next.config.ts`.

---

## Rappel de sécurité

La base est en RLS deny-all : aucune requête n'est possible depuis un
navigateur, tout passe par des fonctions serveur. La clé de service ne doit donc
jamais se retrouver dans un fichier envoyé au client, ni dans Lovable, ni dans
une variable préfixée `VITE_` ou `NEXT_PUBLIC_`, qui sont publiques par
construction.
