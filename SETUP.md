# Ce qu'il reste à mettre en place

Le code est écrit, testé et éprouvé sur des scans réels. Ce qui bloque la vente
n'est pas du code, ce sont des comptes à créer et des valeurs à renseigner.

Le déploiement lui-même est décrit ailleurs, avec les commandes exactes :
[docs/DEPLOIEMENT.md](docs/DEPLOIEMENT.md).

## 1. Bloquant tout de suite

### ~~Recharger la clé Anthropic~~ — fait le 06/08/2026

Le crédit est rechargé, vérifié par un appel réel : `claude-sonnet-5` répond. Le
diagnostic complet retrouve ses six moteurs.

Ce que l'épisode a laissé, et qu'il faut garder : une réponse en erreur ne
compte plus au dénominateur du score. Un moteur muet n'abaisse donc plus la note
du client. Si un jour un moteur retombe, la mesure sera amputée mais juste, et
c'est ce qui compte pour la comparaison J+90.

### ~~Renseigner le mot de passe de l'admin~~ — déjà fait

**Le back-office `apps/admin` fonctionne.** `ADMIN_PASSWORD` est renseigné dans
le `.env` de la racine, qui est le fichier que cette application lit
(`next.config.ts` le charge explicitement). Il suffit de la lancer :

```bash
pnpm --filter admin dev
```

Cette consigne a longtemps dit d'écrire le mot de passe dans
`apps/citari/.env.local`. **C'était le mauvais fichier**, et la commande a été
suivie : le texte littéral `choisissez-un-mot-de-passe-solide` s'y trouve
toujours, sans aucun effet sur `apps/admin`.

Il en a un, en revanche, sur la **route `/admin` du site**, qui est un second
back-office et lit ce fichier-là. Elle s'ouvre donc aujourd'hui avec un mot de
passe publié en clair dans ce dépôt, et donne accès aux emails des prospects.
Voir « Deux back-offices » ci-dessous : c'est à trancher avant la mise en ligne.

### Deux back-offices, et il faut en supprimer un

Découvert le 06/08/2026. Il en existe deux, qui écrivent dans les mêmes tables :

| Où | Quoi | Mot de passe lu dans |
|---|---|---|
| `apps/admin` | Next.js, port 3001, 844 lignes. Leads, clients, relances, checklist de sprint, re-scan J+90. **Celui qu'on utilise.** | `.env` racine, renseigné |
| `apps/citari/src/routes/admin.tsx` | Route `/admin` du site public, 404 lignes. Leads et clients seulement. | `apps/citari/.env.local`, valeur bidon |

**Leurs vocabulaires de statuts divergent**, et `leads.status` est un `text`
sans contrainte, donc la base accepte les deux sans broncher :

- `apps/admin` : `prospect`, `nouveau`, `contacte`, `rdv_pris`, `client`, `perdu`
- route du site : `nouveau`, `contacté`, `call_planifié`, `proposition`, `gagné`, `perdu`

Les trois leads en base sont en `prospect`, un statut que la route du site ne
sait pas afficher. Cliquer dans l'une puis dans l'autre produirait des statuts
que la première ne comprend plus. C'est exactement le problème des deux moteurs
de scan, réglé le 06/08/2026 en n'en gardant qu'un.

S'ajoute le risque de sécurité : une fois le site en ligne, `/admin` serait
accessible publiquement avec un mot de passe écrit en clair dans ce dépôt, et
donnerait les emails des prospects, donc des données personnelles.

**À trancher avant la mise en ligne**, et la réponse est probablement de
supprimer la route du site : `apps/admin` fait tout ce qu'elle fait et
davantage.

## 2. Avant le premier client

### Emails, Resend

Le circuit est entièrement câblé depuis le 10/08/2026 : `pnpm toolkit envoyer`
prépare les brouillons manquants, revérifie, et expédie par Resend. Il ne
manque que trois gestes, qui demandent le compte Resend et l'accès Hostinger :

1. Coller la clé (créée sur https://resend.com/api-keys) dans le `.env` de la
   racine, ligne `RESEND_API_KEY=`. L'emplacement est déjà préparé.
2. Sur Resend, ajouter le domaine `citari.fr`, puis recopier les
   enregistrements DNS qu'il affiche (SPF et DKIM, 3 lignes environ) dans la
   zone DNS de Hostinger. Attendre que Resend affiche « Verified » : sans ça,
   tout part en indésirables.
3. Créer la boîte `luigi@citari.fr` chez Hostinger (incluse dans le pack) :
   c'est elle qui reçoit les réponses (`Reply-To`) et les demandes STOP.

Ensuite, le rituel d'envoi, chaque matin (un cron toutes les 10 minutes le
remplacera sur le VPS) :

```bash
pnpm toolkit envoyer              # simulation : montre ce qui partirait, et pourquoi le reste non
pnpm toolkit envoyer --vraiment   # envoie pour de vrai
```

La commande refuse d'elle-même : les désinscrits, les convertis, les mails 0
périmés (plus de 3 jours), les relances trop en retard (plus de 10 jours), les
gabarits troués (`BOOKING_URL` absente) et les liens localhost
(`NEXT_PUBLIC_SITE_URL` non passée en production). Avant une relance
« bloqué », elle relit le robots.txt du prospect EN DIRECT : s'il a corrigé
entre-temps, le brouillon est réécrit au lieu d'envoyer un fait périmé.

Quand une réponse « STOP » (ou équivalent) arrive dans la boîte :

```bash
pnpm toolkit desinscrire son@email.fr   # plus jamais d'envoi, relances annulées
```

Quand quelqu'un invoque son droit à l'effacement (RGPD) :

```bash
pnpm toolkit effacer son@email.fr             # montre ce qui serait supprimé
pnpm toolkit effacer son@email.fr --vraiment  # supprime, et donne la date à citer en réponse
```

### Réservation

Créer l'événement « diagnostic complet, 30 min » puis renseigner `BOOKING_URL`.
Ce lien apparaît dans tous les emails et toutes les réponses aux objections.

### Nom de domaine et hébergement

**`citari.fr` est acheté, chez Hostinger** (06/08/2026). Cloudflare Registrar ne
vend pas de `.fr`, il fallait donc un bureau d'enregistrement tiers.

**Décidé le 06/08/2026, et c'est une décision en deux temps.**

**Maintenant, pour mettre en ligne : Cloudflare Workers**, Hostinger ne servant
que de bureau d'enregistrement. Le code n'a pas à bouger, `vite build` vise déjà
Cloudflare et un scan réel a tourné de bout en bout sur ce bundle. C'est le
chemin le plus court vers un site en ligne, et il est déjà éprouvé.

**Plus tard, une fois le front de Jérémie intégré et le reste terminé : tout
passe sur le VPS Hostinger.** Un seul fournisseur, et surtout la fin de la
limite des 50 sous-requêtes qui pèse aujourd'hui sur le diagnostic complet.

Ce que coûtera cette bascule, à savoir avant de s'y engager plutôt qu'au milieu :
changer le preset nitro (`cloudflare-module` → `node-server`), écrire le service
et le reverse proxy avec son certificat, reporter les huit secrets de
`wrangler secret` vers le `.env` du serveur, puis **retester un scan réel de bout
en bout** — c'est la seule preuve qui vaut. Rien d'insurmontable, mais rien de
gratuit non plus : à faire quand plus rien d'autre ne bouge.

Le branchement du domaine sur le worker est décrit dans
[docs/DEPLOIEMENT.md](docs/DEPLOIEMENT.md). Point à connaître avant de
commencer : rattacher un domaine à un worker **exige que la zone DNS soit gérée
par Cloudflare**, donc les serveurs de noms devront être changés chez Hostinger.
Au moment de la bascule vers le VPS, ils repointeront vers Hostinger.

## 3. Obligations légales, bloquant la mise en ligne

Les pages existent dans ce dépôt, `apps/citari/src/routes/`, mais leur contenu
doit être complété une fois la structure juridique créée :

- `mentions-legales.tsx` : dénomination, SIRET, RCS, TVA, hébergeur. Obligatoire,
  article 6 III de la LCEN.
- `confidentialite.tsx` : responsable de traitement, adresse de contact.
- Le lien de désinscription doit être présent dans chaque email.

## 4. Vérifier que tout tient, sans dépenser

```bash
pnpm -r typecheck
pnpm -r test
pnpm --filter tanstack_start_ts build
```

Puis un scan aperçu réel sur une marque jamais scannée, environ 0,14 €. À
surveiller pendant qu'il tourne :

- `scans.status` doit finir à `done`, jamais rester bloqué sur `running`
- `cost_log` doit compter **autant de lignes que de réponses**. Plus de lignes
  que de réponses signifie que des appels sont payés deux fois, ce qui est
  arrivé et a été corrigé le 06/08/2026.

## Ce qui n'existe pas, et n'est pas prévu

Pas de comptes prospects, pas de paiement en ligne, le 50/50 est manuel. Pas de
scraping des interfaces de chatbots, uniquement les API officielles. Pas de
mode démo : il a existé, il faisait tourner l'admin sur des données simulées
sans que personne ne s'en aperçoive, il a été retiré.
