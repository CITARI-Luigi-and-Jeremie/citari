# Citari Insights Hub

CONTRAINTES PERMANENTES DU PROJET CITARI — non négociables, elles priment sur tout le reste :

IDENTITÉ. Citari est un instrument de mesure, pas un SaaS. L'esthétique de référence est

le rapport d'expertise / le procès-verbal : sobre, dense en preuves, zéro décoration.

Si un élément pourrait apparaître sur une landing SaaS générique, il est faux.

INTERDITS ABSOLUS : dégradés (tous), violet (toutes nuances), glassmorphism, ombres

portées douces, emojis, icônes décoratives, illustrations stock ou 3D, grilles de

3 cartes arrondies avec icône + titre + texte, badges "AI-powered", animations

décoratives, compteurs animés, la police Inter, coins arrondis > 4px.

PALETTE (exhaustive — aucune autre couleur autorisée) :

- --paper : #FBFAF7 (fond de page)

- --paper-2 : #F2F0EA (fonds de blocs, encadrés)

- --ink : #17160F (texte, CTA pleins)

- --ink-2 : #5C5A52 (texte secondaire)

- --signal : #C0371D (RÉSERVÉ aux points de douleur : score faible, concurrent

  surligné dans un verbatim, chiffre négatif. JAMAIS sur un CTA, un lien ou un titre.)

- --signal-tint : #F6DFD8 (fond de surlignage derrière un nom de concurrent)

TYPOGRAPHIE — trois voix, trois familles (Google Fonts) :

- Citari parle en "Archivo" : titres 600 avec letter-spacing -0.02em, corps 400.

- Les IA parlent en "Newsreader" italique : UNIQUEMENT pour les verbatims cités.

  Aucun titre, aucun paragraphe de Citari en serif.

- Les données parlent en "IBM Plex Mono" : scores, dates, prix, labels techniques,

  noms de moteurs, lignes de réassurance, eyebrows de sections.

Corps 16–17px, interligne 1.6, colonnes de texte max 70ch.

COMPOSANTS : bordures 1px pleines couleur --ink à 15–20 % d'opacité, coins 0 à 4px,

CTA = fond --ink plein, texte --paper, padding généreux, coins 2px.

Hiérarchie par la taille et l'espace blanc, jamais par la couleur.

COPY : chaque affirmation porte un chiffre ou une date. Adjectifs marketing interdits

("puissant", "innovant", "révolutionnaire", "seamless"). Le copy fourni entre

guillemets français « » est VERROUILLÉ : le reproduire mot pour mot, ne pas le

reformuler, ne pas l'"améliorer", ne pas le traduire.

TECHNIQUE — NE JAMAIS TOUCHER : la logique de soumission du scan, les appels API,

l'orchestrateur, le polling par lots, les routes /scan/*, le schéma de données,

les variables d'environnement. Sauf mention explicite, tout changement demandé

est visuel ou textuel. En cas de doute sur un choix non spécifié : prendre

l'option la plus sobre.

ACCESSIBILITÉ : contrastes AA minimum, focus visibles au clavier,

prefers-reduced-motion respecté, responsive propre jusqu'à 375px.

CONTEXTE. Citari est une agence GEO (visibilité dans les réponses de ChatGPT, Claude,

Gemini, Perplexity, Grok et Le Chat) pour PME francophones. Le site a un seul objectif

de conversion : faire lancer le scan gratuit, qui mène ensuite à la réservation d'un

diagnostic en visio. La landing actuelle doit être entièrement redessinée selon les

contraintes permanentes ci-dessus et la structure ci-dessous. On ne vend pas le sprint

sur la landing : on vend le scan, puis le diagnostic.

TÂCHE. Refondre la page d'accueil en une passe, dans cet ordre exact de sections.

Créer d'abord un fichier central de tokens (variables CSS ou config Tailwind) avec

la palette et les trois familles typographiques du bloc de contraintes, et ne dériver

toutes les couleurs et typos que de ces tokens.

────────────────────────────────────────

HEADER (minimal, non sticky)

- Gauche : "Citari" en Archivo 600, taille modérée. C'est du texte, pas un logo image.

- Droite : un seul lien texte "Méthode" pointant vers /methode (la page n'existe pas

  encore : créer une route vide avec juste un titre "Méthode — en cours de rédaction").

- Pas de bouton login, pas de "Get a demo", pas de menu burger. Sur mobile : logo + lien.

────────────────────────────────────────

SECTION 1 — HERO

- H1 en Archivo 600, deux lignes :

  « L'IA recommande déjà quelqu'un à vos clients. Vérifiez que c'est vous. »

- Sous-titre (corps, --ink-2) :

  « Le scan interroge ChatGPT, Claude, Gemini, Perplexity, Grok et Le Chat avec les

  vraies questions de vos acheteurs. Votre score et les phrases exactes, en 90 secondes. »

- Formulaire en DEUX ÉTAPES visuelles :

  Étape 1 (seule visible au chargement) : un champ unique placeholder "votre-site.fr"

  + bouton plein « Lancer le scan gratuit ».

  Au clic, l'étape 2 se déplie sous le champ, sans navigation : nom de la marque

  (pré-rempli à partir du domaine saisi, éditable), le sélecteur de secteur existant,

  jusqu'à 3 concurrents (optionnels), bouton « Démarrer le scan ».

  IMPORTANT : réutiliser À L'IDENTIQUE la soumission existante — même payload, même

  endpoint, mêmes validations. Ce découpage en deux étapes est purement visuel.

- Sous le formulaire, ligne en IBM Plex Mono 13px, --ink-2 :

  « 90 secondes · Aucune réponse simulée · Aucune carte bancaire »

- En dessous, la liste des moteurs en IBM Plex Mono 13px, texte simple, pas de logos :

  « ChatGPT · Claude · Gemini · Perplexity · Grok · Le Chat »

────────────────────────────────────────

SECTION 2 — LA PIÈCE À CONVICTION (signature visuelle du site)

Un bloc sur fond --paper-2, bordure 1px, largeur de lecture confortable.

- Eyebrow en mono, petites majuscules : « Extrait d'un scan — question 7/24 »

- La citation en Newsreader italique, grande (24–28px) :

  « Pour un cabinet fiable à Lyon, je recommande plutôt Concurrent A ou Concurrent B. »

  Les mots "Concurrent A" et "Concurrent B" sont surlignés : fond --signal-tint,

  texte --signal, non italique.

- Attribution en mono, --ink-2 : « — ChatGPT, interrogé le 02/08/2026 »

- Une ligne de corps sous le bloc :

  « C'est ce genre de phrase que le scan retrouve, pour votre marché et votre ville. »

────────────────────────────────────────

SECTION 3 — COMMENT C'EST MESURÉ

Liste éditoriale numérotée (01 / 02 / 03 en mono), sans cartes, sans icônes :

- 01 « Les questions de vos acheteurs. Générées pour votre secteur et votre ville.

  Votre nom n'apparaît jamais dans la question : on regarde si votre marque sort

  d'elle-même. »

- 02 « Six moteurs interrogés en direct. Par leurs API officielles, au moment du scan.

  Aucune réponse simulée, aucun scraping. »

- 03 « Un score sur 100, formule publiée. Présence 50 %, rang 20 %, recommandation

  explicite 20 %, tonalité 10 %. Vous pouvez le recalculer. »

- Lien texte discret en fin de section : « Lire la méthode complète → » vers /methode.

────────────────────────────────────────

SECTION 4 — LE DIAGNOSTIC (bloc de conversion principal après le hero)

Bloc encadré bordure 1px --ink, padding généreux, sur fond --paper.

- Titre Archivo 600 : « Le scan gratuit s'arrête ici. Le diagnostic complet se fait

  en direct. »

- Corps :

  « 30 minutes en visio : les 24 questions une par une, les sources sur lesquelles

  les IA s'appuient pour recommander vos concurrents, et les trois corrections

  prioritaires pour votre cas. Ce n'est pas un rendez-vous commercial : vous repartez

  avec votre diagnostic, que vous travailliez avec nous ou non. Et si votre score est

  bon, on vous le dit et on ne vous vend rien. »

- CTA plein : « Réserver mes 30 minutes ». Le lien pointe vers une constante

  CALENDAR_URL définie une seule fois dans le code (valeur provisoire "#", à

  remplacer par l'URL Cal.com).

────────────────────────────────────────

SECTION 5 — LE SPRINT (prix affiché)

Bloc éditorial unique. PAS de pricing cards, pas de colonnes comparatives, pas de

liste de features avec des coches.

- Titre Archivo 600 : « Le Sprint GEO — 2 900 € HT, une fois. »

  Le montant "2 900 € HT" est en IBM Plex Mono.

- Corps :

  « 30 jours. Trois chantiers : votre site rendu lisible par les IA, cinq contenus

  qui répondent aux questions où vous êtes absent, huit sources tierces qui parlent

  de vous. Re-scan à J+90, mêmes questions, pour mesurer ce qui a bougé. Pas

  d'abonnement. Pas d'engagement. Une agence GEO classique facture 2 500 à 8 000 €

  par mois, avec contrat. Nous, c'est un sprint, un prix, un résultat mesuré. »

- Ligne mono sous le bloc : « 3 sprints par mois · Un seul client par secteur et

  par zone »

────────────────────────────────────────

SECTION 6 — POURQUOI NOUS CROIRE

Liste sobre de 4 points, tirets ou filets fins, sans cartes :

- « La formule du score est publiée. Vous pouvez la recalculer, et la contester. »

- « Les questions sont scellées : le re-scan à J+90 rejoue exactement les mêmes.

  Impossible de choisir ses questions après coup. »

- « Aucune garantie de classement — personne ne peut en donner, il n'y a pas de

  classement dans ChatGPT. Nous garantissons les actions livrées. »

- « Nous appliquons la méthode sur nous-mêmes, en public. »

  Sous ce dernier point : un bloc score en mono « Score Citari : [SELF_SCORE]/100 —

  mesuré le [SELF_SCORE_DATE] ». Ces deux valeurs viennent d'une constante unique ;

  si SELF_SCORE est null, tout le bloc score est masqué.

────────────────────────────────────────

SECTION 7 — FAQ

Trois questions, présentées en liste OUVERTE (pas d'accordéon), question en

Archivo 500, réponse en corps :

- « Le diagnostic, c'est un rendez-vous commercial ? » / « C'est une restitution.

  Vous repartez avec votre diagnostic complet quoi qu'il arrive. Si votre score est

  bon, on vous le dira, et on ne vous proposera rien. »

- « Pourquoi le scan est gratuit ? » / « Il nous coûte environ cinquante centimes

  d'API et c'est notre meilleure démonstration. On préfère vous montrer la méthode

  que vous la raconter. »

- « Combien de temps pour voir des résultats ? » / « Les moteurs intègrent les

  changements en 4 à 12 semaines. Personne ne contrôle ce délai — c'est pour ça

  qu'on garantit les actions livrées, jamais un score. Ceux qui vous garantissent

  la première place dans ChatGPT vous mentent : il n'y a pas de classement dans

  ChatGPT. »

────────────────────────────────────────

FOOTER

Une ligne : Citari · Méthode · Mentions légales · Contact (mailto).

"Mentions légales" pointe vers une route /mentions-legales créée vide avec un titre

et le texte « En cours de rédaction ». Dessous, en mono 12px --ink-2 :

« Citari — mentions légales en cours de complétion. »

────────────────────────────────────────

MOTION. Une seule micro-interaction autorisée sur toute la page : dans la section 2,

le surlignage des concurrents peut apparaître 300ms après le chargement (transition

de fond simple). Rien d'autre ne bouge. prefers-reduced-motion : aucun mouvement.

AUTO-VÉRIFICATION avant de rendre la main — corriger si un point échoue :

1. Aucune trace de violet, d'un dégradé, d'une ombre douce ou d'un emoji.

2. Aucune serif en dehors des citations d'IA. Aucun titre en Newsreader.

3. Tous les chiffres, dates, prix et labels techniques sont en IBM Plex Mono.

4. --signal n'apparaît que dans la section 2 (surlignage) et nulle part ailleurs.

5. Le formulaire soumet exactement comme avant la refonte (même payload, même endpoint).

6. La page est propre à 375px de large, focus clavier visibles, contrastes AA.

7. Le copy entre « » est reproduit à l'identique, sans reformulation.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/b884a38f-24b7-40f9-b447-f184da6cf740).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
