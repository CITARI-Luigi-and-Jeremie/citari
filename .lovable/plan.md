# Faire tourner le scan pour de vrai + chargement vivant

## Ce qui se passe aujourd'hui

Vérifié en base : les 4 derniers scans lancés sont tous restés à `generating_queries` avec 0 question et 0 réponse. Seul le scan de démonstration (`1111…`) contient des données, insérées à la main.

Donc oui : **rien ne tourne**. Le formulaire crée bien une ligne en base, puis personne ne fait le travail. L'écran de chargement affiche fidèlement cet état vide — d'où l'écran figé de votre capture (pas de questions, pas de grille, pas de chrono).

Il n'y a aucun moteur relié, aucune clé d'API, aucun code d'orchestration.

## Ce que je construis

### 1. Le moteur du scan (le vrai travail)

Un pipeline en trois temps, exécuté côté serveur, qui écrit en base au fur et à mesure :

1. **Génération des questions** — l'IA intégrée rédige 12 questions d'acheteur à partir du secteur, de la marque et du domaine. Écrites dans `queries`, statut → `running`.
2. **Interrogation des moteurs** — chaque question est posée à chaque moteur disponible ; chaque réponse est enregistrée dans `responses` (texte + latence réelle) dès qu'elle arrive.
3. **Analyse** — détection des marques citées, rang, recommandation, tonalité → `mentions`, puis calcul du score, de la ventilation et de la part de voix. Statut → `done`.

**Registre de moteurs extensible** : je démarre avec les modèles réellement disponibles via l'IA intégrée. Un moteur sans clé n'est jamais affiché ni simulé — il apparaît automatiquement dès que sa clé est ajoutée (Perplexity, etc.). La grille de chargement s'adapte au nombre réel de moteurs actifs (plus de « 6 » codé en dur).

Durée cible : environ 3 minutes, calibrée par le nombre de questions × moteurs.

### 2. Le chargement devient vivant

L'écran ne fait plus que lire : il **fait avancer** le scan. À chaque battement (~1,5 s) il demande au serveur d'accomplir le lot de travail suivant, puis affiche le résultat réel de ce lot. Conséquence directe : chaque case qui se remplit correspond à une réponse qui vient d'arriver. Rien n'est scripté.

Ce que le visiteur voit se succéder :

- **Étape 1** — les questions apparaissent une à une, en cascade, à mesure que l'IA les rédige. Les **trois premières en clair** (échantillon), les suivantes **floutées** jusqu'à la capture de l'email.
- **Étape 2** — la grille type carte perforée se remplit case par case, avec compteur réel (`18/48`), chrono réel, ligne d'étape courante (« PERPLEXITY · Q07 · 2 340 MS ») et barre de progression fine.
- **Étape 3** — grille figée, filet balayeur, labels d'analyse qui s'allument, puis bascule sur le résultat.
- Au-delà de 2 min, rotation des trois points de méthode. En cas d'échec d'un moteur, le scan continue avec les autres ; seul un échec total passe en `error`.

Les animations sont renforcées : apparition en fondu/glissement des lignes, remplissage de case animé, transitions douces entre les trois actes, barre de progression fluide. Optimisé mobile (la grille passe en colonnes compactes sous 400 px, comme sur votre capture).

## Détails techniques

- Un endpoint de travail `src/routes/api/public/scan-tick.ts` : chaque appel exécute une tranche courte de pipeline (une génération, ou N réponses) et rend la main. Idempotent, verrouillé par `scan_id` pour éviter le double travail si deux onglets sont ouverts. Ça évite les délais d'exécution du runtime serverless sur un scan de 3 minutes.
- Le pipeline lui-même dans `src/lib/scan-engine.server.ts` (registre de moteurs, prompts, analyse) + `src/lib/scan-score.server.ts` (formule publiée : présence 50 %, rang 20 %, recommandation 20 %, tonalité 10 %).
- Migration nécessaire : le texte des questions doit rester lisible en anonyme pour les 3 premières seulement → j'ajoute une vue `queries_public` qui n'expose le texte que pour `position <= 3`, le reste en `null`. La table `queries` perd son SELECT anonyme direct.
- Le texte des réponses reste inaccessible en anonyme (inchangé) : seules les métadonnées via `responses_meta`.
- Aucune donnée inventée : si un moteur ne répond pas, la case reste vide et le total baisse.
- Le scan de démonstration est conservé pour les tests.

## Hors périmètre

Landing et vue résultat inchangées. Pas de tableau des 24 questions, pas de sources détaillées, pas de plan d'action.
