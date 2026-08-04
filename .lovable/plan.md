# Frontière moteur / pages — et conception sur données factices

Le principe de votre ami est le bon, et il correspond exactement à ce qui manquait ici :
son dépôt possède la mesure, ce projet possède les écrans. J'ai vérifié son moteur
(il est lisible depuis votre projet **CITARI** : `orchestrateur.server.ts`, `moteurs.server.ts`,
`score.ts`, `typo.ts`, plus la migration du schéma). Je ne le reconstruirai pas, et je ne le
simulerai pas.

## Précision sur « connecter GitHub »

Ce que je peux lire aujourd'hui, c'est le **projet Lovable** de Luigi, [CITARI](/projects/150f9fa5-b533-49e7-a797-19c52f94db36),
parce qu'il est dans le même espace de travail : j'y vois bien `src/lib/orchestrateur.server.ts`
(avec `etatScan`, `rapportParJeton`, `enregistrerLead`, `teaserScan`) et `src/lib/scan.functions.ts`.
Ce n'est pas la même chose qu'une connexion GitHub : ce projet-ci n'est relié à aucun dépôt,
donc rien de ce que je fais ne se pousse chez Luigi, et rien de ce qu'il pousse n'arrive ici.

Deux choses distinctes, donc :

- **Pour concevoir maintenant** : pas besoin de GitHub. Je peux copier le moteur de CITARI
  dans ce projet tel quel, sans le modifier, et construire les écrans autour.
- **Pour la boucle de travail que décrit son IA** (il récupère vos pages, il vérifie, il déploie) :
  là oui, il faut connecter ce projet à un dépôt GitHub et lui donner l'URL — sinon il n'a
  aucun moyen de recevoir vos pages. C'est le seul but de l'étape. Menu **+** → **GitHub** → **Connect project**.

Dans les deux cas : aucune clé API n'entre ici, je n'en demanderai pas.


## Ce que je fais de mon côté

### 1. Écrire la frontière noir sur blanc

Une section « Propriété du code » dans `AGENTS.md` : liste des fichiers moteur interdits
en écriture (orchestrateur, moteurs, score, migrations, clés), liste des fichiers pages
qui m'appartiennent, et la règle « une personne à la fois sur un fichier ». Si son
`AGENTS.md` arrive ensuite, le sien fait foi et je fusionne sans écraser.

### 2. Un seul point de contact avec le moteur

Aujourd'hui mes écrans lisent des noms de colonnes que j'ai inventés
(`brand`, `domain`, `queries.position`, `responses.text`). Le moteur, lui, écrit
`brand_name`, `website_url`, `mode`, `phase`, `queries.rank/intent`, `responses.raw_text`,
et expose `etatScan(id)` / `rapportParJeton(jeton)`.

Je fais converger le nommage vers **celui du moteur** — c'est lui qui a raison — via un
adaptateur unique : les composants continuent de recevoir la forme qu'ils affichent déjà,
et cet adaptateur est le seul fichier à toucher le jour du branchement. Une seule ligne
change alors : la source passe du jeu d'exemple à `etatScan`.

### 3. Conception sur jeu d'exemple, sans base et sans clés

Un module de données d'exemple (scan aperçu en cours de collecte, scan aperçu terminé,
scan complet terminé, scan en erreur) branché sur des identifiants réservés,
par exemple `/scan/demo-chargement` et `/scan/demo-resultat`.

- Affichage instantané : aucun appel réseau, aucune écriture en base, itération à la seconde.
- Les trois actes de l'écran de chargement, la vue résultat et la capture d'email restent
  pilotables à la main pour être stylés.
- Ces identifiants factices n'existent que pour la conception ; un vrai UUID passe
  toujours par le vrai chemin serveur. Rien de simulé ne s'affiche jamais pour un vrai scan.

Quand son jeu d'exemple arrivera dans le dépôt, je remplace le mien par le sien.

### 4. Ce que je ne touche pas

Ni moteur, ni migrations, ni clés, ni back-office. Les tables actuelles de cette base
restent en place mais cessent d'être la référence : le schéma du moteur devient la vérité
dès son premier push.

## Détails techniques

- `AGENTS.md` : section « Propriété du code » (moteur / pages / règle d'édition).
- `src/lib/scan-contract.ts` : types du contrat moteur (`EtatScan`, `Rapport`) + adaptateurs
  vers les types d'affichage existants (`ScanRecord`, `ScanLive`). Fichier pivot unique.
- `src/lib/scan-demo.ts` : jeu d'exemple, cohérent (24 questions, latences plausibles,
  score dérivé, verbatims), et les identifiants de démonstration.
- `src/routes/scan.$id.tsx` : si l'identifiant est de démonstration, l'état vient du jeu
  d'exemple ; sinon, sondage serveur inchangé. Les `noindex` sont conservés.
- `src/lib/scan-live.server.ts`, `scan-result.functions.ts` : conservés, mais réécrits pour
  déléguer au contrat plutôt qu'aux noms de colonnes actuels, prêts à appeler `etatScan`.
- Aucune migration, aucun secret, aucun appel de moteur dans cette passe.
