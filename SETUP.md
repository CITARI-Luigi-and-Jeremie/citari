# Ce qu'il reste à mettre en place

Le code est écrit, testé et éprouvé sur des scans réels. Ce qui bloque la vente
n'est pas du code, ce sont des comptes à créer et des valeurs à renseigner.

Le déploiement lui-même est décrit ailleurs, avec les commandes exactes :
[docs/DEPLOIEMENT.md](docs/DEPLOIEMENT.md).

## 1. Bloquant tout de suite

### Recharger la clé Anthropic

Vérifié le 06/08/2026 : l'API répond `credit balance is too low`. **Claude ne
répond plus du tout**, donc le diagnostic complet tourne à cinq moteurs sur six.

Un moteur muet ne fausse plus le score, ses réponses manquantes sont exclues du
calcul depuis le 06/08/2026, mais la mesure est amputée d'un sixième et le
client paye pour six moteurs.

→ https://console.anthropic.com, Plans & Billing.

### Renseigner le mot de passe de l'admin

Sans lui, le back-office affiche « ADMIN_PASSWORD n'est pas configuré » et reste
inutilisable. C'est pourtant là que les emails se relisent avant envoi.

```bash
echo 'ADMIN_PASSWORD=choisissez-un-mot-de-passe-solide' >> apps/citari/.env.local
```

## 2. Avant le premier client

### Emails, Resend

- Créer le compte sur https://resend.com, récupérer `RESEND_API_KEY`
- Vérifier le domaine d'envoi et poser les enregistrements SPF et DKIM
- Renseigner `RESEND_FROM`, `FOUNDER_EMAIL`, `FOUNDER_SIGNATURE`

Sans domaine vérifié, les emails partent en indésirables. C'est la seule étape
qui demande d'attendre une propagation DNS, donc à lancer en premier.

### Réservation

Créer l'événement « diagnostic complet, 30 min » puis renseigner `BOOKING_URL`.
Ce lien apparaît dans tous les emails et toutes les réponses aux objections.

### Nom de domaine et hébergement

Décidé : `citari.fr`. Cloudflare Registrar ne vend pas de `.fr`, il faut passer
par un bureau d'enregistrement français. Pour l'hébergement, comparaison et
choix dans [docs/DEPLOIEMENT.md](docs/DEPLOIEMENT.md).

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
