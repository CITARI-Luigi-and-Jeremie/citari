# Mettre Citari en ligne

Trois choses à mettre en ligne, dans cet ordre : le site, l'envoi d'emails, le
poste de pilotage. Chacune est indépendante des deux autres.

Tout ce qui suit a été vérifié sur le vrai bundle de production, pas seulement
en développement : un scan réel a été lancé de bout en bout (Keobiz, 34/100,
20 questions, 40 réponses, lead créé avec son consentement).

---

## 1. Le site

### Où il tourne réellement

**Chez Hostinger.** La bascule annoncée plus bas dans les anciennes versions de
ce document a eu lieu ; ce qui suit a été vérifié le 16/08/2026 depuis
l'extérieur, sans accès au panneau :

| Ce qu'on observe | Valeur |
| --- | --- |
| En-tête `server` de `citari.fr` | `hcdn` — le CDN Hostinger |
| Serveurs de noms | `nova.dns-parking.com`, `cosmos.dns-parking.com` (Hostinger) |
| Adresses A | `147.79.116.197`, `193.58.105.164` |
| En-tête Cloudflare (`cf-ray`) | **absent** |

Toutes les routes répondent en 200, `/sprint` et `/equipe` comprises.

### La mise en ligne est automatique

Le déploiement se déclenche **tout seul depuis GitHub** : il n'y a aucune
commande à lancer, ni par Jérémie ni par Luigi.

> [!IMPORTANT]
> **Le dépôt a changé d'adresse le 16/08/2026** (compte personnel →
> organisation `CITARI-Luigi-and-Jeremie`), et l'intégration Hostinger est
> restée branchée sur l'ancienne. Tant qu'elle n'est pas repointée, `main`
> avance sans que le site bouge — et rien ne le signale, puisque GitHub
> redirige encore les pushs. Symptôme observé le 16/08 : la balise GA fusionnée
> dans `main` était toujours absente de `citari.fr` une heure après.
> Voir `CLAUDE.md`, section dépôt.

### À compléter par Luigi

Ces points demandent le panneau Hostinger, et personne ne devrait avoir à les
redécouvrir en urgence un jour de mise en ligne :

- la branche surveillée et la commande de build utilisée côté Hostinger ;
- **où vivent les huit secrets** (`OPENAI_API_KEY`, `GOOGLE_AI_API_KEY`,
  `ANTHROPIC_API_KEY`, `PERPLEXITY_API_KEY`, `XAI_API_KEY`, `MISTRAL_API_KEY`,
  `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`) depuis qu'ils ne sont plus dans
  `wrangler secret` ;
- comment lire les journaux quand un déploiement échoue.

`NEXT_PUBLIC_SITE_URL` doit valoir le domaine réel en `https://`. Ce n'est pas
cosmétique : tant qu'il vaut `http://localhost:8080`, les liens de rapport
envoyés par email sont inutilisables, et c'est le lien sur lequel le prospect
clique.

### Après une mise en ligne : la seule preuve qui vaut

**Relancer un scan réel de bout en bout.** C'est ainsi que la production a été
validée la première fois, et aucun autre test ne remplace celui-là.

### L'ancien chemin Cloudflare (historique)

Le site est passé par **Cloudflare Workers** avant Hostinger. Il en reste des
traces dans le dépôt, à ne pas prendre pour la procédure courante :

- `apps/citari/scripts/deployer.sh` déploie sur Cloudflare — **obsolète**, il ne
  met plus le site en ligne ;
- le script `build:cloudflare` (preset nitro `cloudflare-module`) existe
  toujours à côté de `build` (`node-server`) ;
- la limite des **50 sous-requêtes** du plan gratuit Cloudflare, qui rendait le
  diagnostic complet à six moteurs juste à la limite, ne s'applique plus.

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

## 4. La mesure d'audience

Google Analytics 4, propriété `G-6XD5KYMRE0`. Le code est posé dans
`src/routes/__root.tsx` et `src/lib/analytics.ts` ; rien à installer, rien à
configurer au déploiement.

**Elle ne tourne qu'en production.** Un `bun dev` local enverrait des scans de
test dans les mêmes rapports que le vrai trafic, et c'est le taux de conversion
qui se juge sur ces chiffres. En local, GA reste donc vide : c'est voulu, ce
n'est pas une panne. Pour vérifier une pose d'événement, il faut le site
déployé et le DebugView de GA.

**Aucun bandeau de consentement**, décision de Jérémie du 16/08/2026. À savoir :
GA4 sans consentement est contraire à l'article 82 de la loi Informatique et
Libertés, et GA4 ne figure pas sur la liste des exemptions de la CNIL. Le risque
croît avec le trafic.

### Les sept événements

| Événement | Moment |
| --- | --- |
| `scan_formulaire_ouvert` | un domaine est saisi et le visiteur clique |
| `scan_etape_email` | il atteint l'écran qui demande l'email |
| `scan_lance` | le scan part |
| `scan_refuse` | refus serveur (quota d'IP, marque invalide), avec le motif |
| `scan_echec` | panne au lancement |
| `reservation_ouverte` | le calendrier Calendly s'affiche |
| `reservation_call` | le créneau est confirmé |

`scan_lance` vaut aussi « email donné » : `lancerScan` exige l'adresse, donc les
deux marches prévues à l'origine n'en font plus qu'une.

Ni la marque ni l'email ne sont envoyés à Google. Supabase sait déjà QUI a
scanné, GA n'a besoin que du COMBIEN — et transmettre l'adresse d'un prospect
serait contraire aux conditions d'utilisation de GA.

### Les trois réglages à faire UNE fois dans la console GA

Ils demandent le compte Google et ne peuvent pas être faits depuis le dépôt.
Tant qu'ils ne sont pas posés, la mesure tourne mais les rapports sont muets ou
faussés.

1. **Marquer `scan_lance` et `reservation_call` comme événements clés.** Sans
   ça, aucune conversion n'apparaît. Admin → Événements clés → Créer, en tapant
   le nom exact (inutile d'attendre le premier trafic).
2. **Porter la conservation des données de 2 à 14 mois.** Admin → Conservation
   des données. Le défaut de GA4 est 2 mois, et ce qui est perdu ne revient
   jamais — un batch de prospection se juge sur plus long que ça.
3. **Filtrer le trafic interne.** Nos propres visites, sinon, gonflent des
   chiffres qu'on lit à quelques dizaines de sessions près.

---

## Rappel de sécurité

La base est en RLS deny-all : aucune requête n'est possible depuis un
navigateur, tout passe par des fonctions serveur. La clé de service ne doit donc
jamais se retrouver dans un fichier envoyé au client, ni dans Lovable, ni dans
une variable préfixée `VITE_` ou `NEXT_PUBLIC_`, qui sont publiques par
construction.
