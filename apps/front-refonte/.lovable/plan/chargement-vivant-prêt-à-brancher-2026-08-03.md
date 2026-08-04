# Chargement vivant — prêt à brancher

## Constat important

Le fichier `src/lib/orchestrateur.server.ts` n'existe pas dans ce projet, et il n'y a
aucune fonction `etatScan`. Le moteur que vous décrivez vit donc dans un autre projet
ou n'a pas encore été importé ici. Rien n'est perdu : je prépare l'écran pour qu'il
consomme exactement le contrat que vous décrivez, et le jour où le moteur arrive,
il n'y a qu'à le déposer — aucun changement d'interface.

Aujourd'hui l'app lit l'état via une fonction serveur équivalente (`readScanLive`)
qui renvoie le scan, les questions et les métadonnées des réponses. Je garde ce
point d'entrée unique et je l'aligne sur votre vocabulaire (`questions`,
`collectees`, `total`, `progression`) pour que le branchement soit une substitution
et pas une réécriture.

## Ce que je construis

### 1. Un seul point d'entrée d'état

Une fonction serveur unique renvoie l'état vivant : identité du scan, statut,
questions réelles, cellules déjà collectées (question × moteur, avec latence),
total attendu, progression. L'écran ne calcule rien d'inventé : il dessine ce qui
est en base à l'instant du sondage. Quand votre moteur est branché, cette fonction
délègue à lui et le reste ne bouge pas.

### 2. Colonnes de moteurs déduites, pas codées

Les colonnes de la grille sont déduites des moteurs réellement présents pour ce
scan. 2, 4 ou 6 colonnes selon le mode, sans toucher au code.

En mode aperçu, les 4 moteurs absents apparaissent en plus, en colonnes verrouillées
avec un cadenas : en-tête grisé, cellules barrées d'un filet, aucune donnée. C'est
un levier de conversion assumé, pas un état d'erreur — le libellé le dit clairement.

### 3. Les trois actes, réellement animés

- **Génération des questions** — libellé mono + curseur clignotant, puis les vraies
  questions tombent une à une en cascade au fur et à mesure qu'elles arrivent en base.
  Une question déjà affichée ne re-anime jamais.
- **Interrogation des moteurs** — la grille type carte perforée se remplit cellule
  par cellule : chaque nouvelle réponse allume sa case avec une brève pulsation.
  Compteur réel (`collectées / total`), chronomètre réel calculé depuis `started_at`,
  ticker de latences qui défile sur les dernières réponses reçues.
- **Analyse** — grille figée, filet balayeur, libellés de phase qui s'enchaînent,
  puis fondu vers la vue résultat.

### 4. Rien ne mouline dans le vide

- Progression toujours ancrée sur une donnée : nombre de cellules réelles / total.
- Si aucune donnée ne bouge pendant un moment, rotation des points de méthode
  (questions scellées, API officielles, formule du score) au lieu d'un écran mort.
- Statut d'erreur : message sec, relancer ou écrire à l'adresse du site.
- Aucun compteur simulé, aucune barre scriptée côté client.

### 5. Vérification

Je pilote le parcours en navigateur sur les trois actes et je capture des vues,
en simulant l'avancée uniquement par écritures en base (jamais côté client) — c'est
la preuve que l'écran est bien une fonction de l'état serveur.

## Détails techniques

- `src/lib/scan-live.server.ts` : état vivant unique ; les moteurs sont dérivés par
  `distinct(engine)` sur les métadonnées, plus la liste verrouillée en mode aperçu.
  Le texte des réponses n'est jamais renvoyé — vues `scans_public` / `responses_meta`
  uniquement, aucun SELECT anonyme sur `responses`.
- `src/lib/scan-loading.ts` : dérivations pures (libellés, format chrono, latences,
  clés de cellule, ensemble des moteurs, total attendu).
- `src/components/scan-loading/LoadingScreen.tsx` : découpé en `QueryCascade`,
  `EngineGrid`, `LatencyTicker`, `ScoringSweep`. Animations CSS uniquement
  (opacité/translation), jamais de `setInterval` qui fabrique de la progression.
- `src/routes/scan.$id.tsx` : sondage de l'état, transition vers le résultat.
- Point ouvert, à trancher quand le moteur arrive : le mode (aperçu / complet /
  contrôle interne) n'est aujourd'hui stocké nulle part sur `scans`. En attendant,
  je le déduis du nombre de moteurs attendus ; si votre moteur écrit un champ de
  mode, l'écran le lira en priorité.
- Aucune modification du moteur, du back-office, de la landing ni de la vue résultat.
