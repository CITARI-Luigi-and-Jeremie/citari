# DESIGN.md — Direction artistique du projet

Claude Code : lis ce fichier avant toute création ou modification d'interface. Il est la source de vérité visuelle du projet. Aucun écran ne doit être produit sans s'y conformer.

## 0. Règle zéro

Tu as tendance à converger vers des outputs génériques « dans la distribution ». En design frontend, ça produit ce que les utilisateurs appellent l'esthétique « AI slop ». C'est interdit ici. Ce produit est vendu à des dirigeants d'entreprise à 2 900 € la mission : l'interface est notre première preuve de crédibilité. Elle doit avoir l'air conçue par un humain qui a du goût, pas générée.

## 1. Interdictions absolues

Ne jamais utiliser, sous aucun prétexte :

- La police Inter (ni Arial, ni Helvetica, ni Roboto, ni les polices système par défaut)
- Les dégradés violet/indigo sur blanc (le tell n°1 de l'IA)
- Les grilles de trois cartes grises à coins arrondis avec drop-shadow et petite icône en haut
- Le hero centré avec titre + sous-titre + deux boutons côte à côte
- Les emoji en guise d'icônes
- Les palettes « timides » où toutes les couleurs ont le même poids
- Les illustrations vectorielles génériques type undraw.co
- Les ombres portées molles partout (`shadow-lg` sur tout)

## 2. Direction esthétique retenue

**Éditorial technique.** Pensé comme un rapport d'investigation financier ou un terminal Bloomberg réinterprété par un studio de design suisse. Le produit mesure et révèle des données ; l'interface doit avoir l'autorité d'un instrument de mesure, pas la douceur d'une app grand public.

Ton : sérieux, précis, un peu austère, avec des moments de tension visuelle forts quand la donnée est mauvaise (un score de 12/100 doit se voir, pas être joliment arrondi).

Références mentales (ne pas copier, s'en inspirer) : la presse économique imprimée, la data-visualisation du Financial Times, le rapport d'expertise relié, le document administratif français.

⚠ **Ne pas confondre posture et look.** « Terminal Bloomberg » décrit une *rigueur*, pas une palette. Traduire cette référence en noir + orange revient à produire exactement le cliché que le §0 interdit.

## 3. Typographie

- **Titres** : une serif éditoriale à fort caractère OU une grotesque suisse dense.
- **Corps** : une sans-serif lisible mais non générique.
- **Données / chiffres / requêtes / code** : une monospace assumée. Tous les scores, pourcentages et noms de requêtes sont en monospace — c'est la signature visuelle du produit.
- **Échelle** : contraste fort entre les niveaux. Un H1 à 64-80px face à un corps à 16px. Pas d'échelle molle où tout se ressemble.
- Chargement via `next/font` uniquement, jamais de `<link>` Google Fonts brut.

### Choix engagés pour ce projet

Mis à jour le 16/08/2026 contre `apps/citari/src/styles.css`, qui fait foi :
ce tableau annonçait encore Instrument Serif et Public Sans, abandonnées au
portage du front v3. Un document de référence qui contredit le code fait
perdre une heure à chaque relecture.

| Rôle | Police | Usage |
|---|---|---|
| Nom, étiquettes, UI | **Archivo** (400/500/600/700/800) | le nom de marque en 800, les labels, le texte courant |
| Titres et parole | **Newsreader** (400 romain et italique) | titres de chapitre en ROMAIN, verbatims en ITALIQUE |
| Données | **IBM Plex Mono** (400/500) | scores, pourcentages, requêtes, moteurs, labels techniques |

**Trois familles, trois métiers, et le métier fait le contraste** (refonte du
document de mesure, 16/08/2026) : le mono COMPTE, Archivo ÉTIQUETTE,
Newsreader ÉNONCE. La règle opposable : entre deux niveaux voisins, jamais
moins d'un facteur 1,5 en taille ou un changement de famille. Le document de
mesure avait 16 tailles distinctes dont 530 éléments entassés entre 10 et
15px, tous en Archivo 600 : c'est cette bouillie que la règle interdit.

La distinction romain/italique de Newsreader PORTE DU SENS et ne se choisit
pas au goût : l'italique est une phrase prélevée comme pièce, le romain est
un texte rendu tel quel ou un titre de notre main.

## 4. Couleur

> **Révision du 30/07/2026 — direction « papier & encre ».** La première version
> (fond quasi-noir + accent vermillon) a été abandonnée : c'est un cluster
> explicitement identifié comme signature d'IA (« near-black with a lone
> acid-green or vermilion pop »). Trois raisons de la bascule :
> 1. le livrable qui justifie la facture est un **document imprimable** — l'écran
>    et le PDF doivent partager le même traitement, et le papier est clair ;
> 2. l'audience (dirigeants de PME françaises) lit le noir + orange comme
>    « outil dev », pas comme « conseil premium » ;
> 3. bordeaux et bleu encre sur papier ancrent la marque dans le vocabulaire du
>    document professionnel français sans jamais être littéraux.
>
> Le §2 (« terminal Bloomberg ») reste valable comme **posture** — autorité d'un
> instrument de mesure, densité, rigueur — mais pas comme référence chromatique.

- Base papier : fond clair légèrement teinté (jamais blanc pur, jamais gris neutre plat). L écran et le PDF partagent le même traitement.
- Une couleur dominante qui porte l'identité + un accent unique et tranchant utilisé avec parcimonie pour l'alerte et l'action. Pas de palette arc-en-ciel.
- Sémantique des scores (cohérente partout) : un score bas utilise l'accent d'alerte de façon franche, un score haut une couleur de validation sobre.
- Tout en variables CSS définies une seule fois dans `globals.css`. **Aucune couleur en dur dans un composant, jamais.**

### Palette engagée (validée CVD — voir §11)

Mise à jour le 16/08/2026 contre `styles.css` : les valeurs ci-dessous sont
celles du code, et les noms `--paper-raised`, `--paper-sunken`, `--track`,
`--ink-dim`, `--ink-faint`, `--valid` n'existent plus depuis le portage v3.

| Token | Valeur | Rôle |
|---|---|---|
| `--paper` | `#fbfaf7` | fond, papier chaud (jamais blanc pur) |
| `--paper-2` | `#f2f0ea` | planches, dépliés, pistes de jauge |
| `--ink` | `#17160f` | texte principal, ET la possession dans le document de mesure |
| `--ink-2` | `#5c5a52` | texte secondaire |
| `--ink-3` | `#726d64` | labels, texte tertiaire (4,92:1 — voir §11) |
| `--signal` | `#c0371d` | accent unique : la PERTE, et l'action |
| `--signal-tint` | `#f6dfd8` | surlignage d'un concurrent, ligne d'un robot refusé |
| `--verdict` | `#1f3a5c` | bleu encre : l'ACQUIS mesuré (porte ouverte, score ≥ 70) |
| `--rule` / `--rule-strong` | encre à 15 % / 20 % | filets |

**Le rouge se rationne, il ne s'ajoute pas** (refonte du 16/08/2026). Le
document de mesure avait 124 cases teintées et 24 chevrons rouges : à ce
régime, le rouge est un motif de fond et plus rien n'alarme. Budget
opposable en revue : `--signal` ne couvre jamais plus de 2 % de la surface
encrée d'un écran, et ne dit qu'une seule chose, la perte. `--verdict` porte
l'acquis, et c'est lui qui rend les chapitres rouges crédibles : un document
rouge de bout en bout ne fait plus peur nulle part.

### La convention de surface du document de mesure

Quatre valeurs, déclarées une fois en tête du rapport et tenues sur tous les
chapitres. Elles disent QUI TIENT QUOI, et le lecteur les apprend en dix
secondes :

| Surface | Sens |
|---|---|
| encre pleine | tenu par vous |
| hachure montante 45° (`tenue`) | tenu par une autre marque |
| papier nu | personne, ou vous êtes absent |
| hachure fine descendante (`non-relevee`) | non relevé, hors mesure |

Les deux hachures ont des pentes opposées et des densités différentes :
elles restent distinctes en niveaux de gris, en vision daltonienne et sur
papier (avec `print-color-adjust: exact`, sans quoi toute la convention
disparaît à l'impression). Conséquence directe : **une absence est un trou,
jamais une case décorée**. Sur un scan à 13/100, les 124 absences de la
carte cessent de remplir l'écran et se mettent à manquer.

Le `--signal` est la seule couleur saturée du système. Il sert à l'action (CTA) **et** à l'alerte (score bas). Cette double fonction est volontaire : chez nous, la mauvaise nouvelle *est* l'appel à l'action.

**Il n'y a délibérément que deux couleurs sémantiques, pas trois.** Un score intermédiaire s'affiche en `--ink` (neutre) : un score moyen ne mérite ni alarme ni félicitation, et toute troisième teinte se serait heurtée aux deux autres en vision daltonienne.

## 5. Layout

- **Asymétrie assumée.** Pas de tout-centré. Grille éditoriale avec des colonnes de largeurs inégales, du contenu qui déborde volontairement, des ancrages à gauche.
- **Densité maîtrisée** : les écrans de données (rapport, tableau de requêtes) doivent être denses et informatifs. Les écrans marketing peuvent respirer.
- **Filets et bordures plutôt qu'ombres portées** pour séparer les blocs. Bordures fines, 1px, contrastées.
- Espacement sur une échelle stricte (4/8/12/16/24/32/48/64/96). Jamais de valeurs arbitraires.

## 6. Motion

- Micro-interactions systématiques mais rapides et sèches (120-200 ms, easing prononcé). Rien de flottant ou de rebondissant.
- Moments chorégraphiés autorisés et souhaités à deux endroits précis :
  1. L'écran de progression du scan (le compteur qui égrène les requêtes moteur par moteur)
  2. La révélation du score (compteur qui monte, barres de part de voix qui se déploient)
- Partout ailleurs : sobriété.
- Respecter `prefers-reduced-motion` sans exception.

## 7. Composants

- shadcn/ui autorisé comme base structurelle uniquement. Tout composant importé doit être re-stylé. Un shadcn par défaut non modifié est un bug.
- Data-viz : pas de librairie de charts par défaut avec son style d'usine. Barres de part de voix et vues par moteur en **SVG custom**.

## 8. Responsive

- Mobile-first sur la landing et le formulaire de scan.
- Le rapport complet peut être optimisé desktop, avec une version mobile lisible mais simplifiée.
- Le PDF **partage le système de l'écran** : seule différence, le fond passe au blanc pur pour économiser l'encre et les URL des liens sont imprimées. C'est le même document, pas deux traitements à maintenir.

## 9. Méthode de travail imposée

1. Avant de coder un écran, annoncer en une phrase : objectif, ton, choix typographique, choix chromatique, parti-pris de layout.
2. Construire en couches : types → logique → UI → polish. Jamais tout en un seul jet.
3. Un écran de référence d'abord (**la page rapport**), qui fixe le langage visuel. Les autres écrans en découlent.
4. Après chaque passe, proposer une seule dimension à améliorer pour la passe suivante.

## 10. Test de sortie

Avant de considérer un écran comme terminé :

- Est-ce qu'un designer verrait immédiatement que c'est une IA qui l'a fait ? Si oui, recommencer.
- Est-ce que la typographie porte une intention, ou est-ce le défaut ?
- Est-ce qu'un score catastrophique produit une réaction émotionnelle à l'écran ?
- Est-ce que je pourrais montrer cet écran à un dirigeant pour justifier une facture de 2 900 € ?

## 11. Validation de la palette (data-viz)

Les couleurs sémantiques (`--signal` / `--valid`) sont validées contre le papier `#E9E8E3` — **tous les tests passent**.

Deux enseignements payés par l'erreur, à ne pas refaire :
- **Rouge contre vert est la pire paire en deutéranopie.** Un bordeaux et un vert forêt donnaient ΔE 5,4 : indistinguables. Le pôle positif est donc un **bleu encre**, pas un vert — contre-intuitif, mais le chiffre et le verdict textuel accompagnent toujours la couleur.
- **Un contraste de 3:1 ne suffit pas au texte.** Les marques graphiques exigent 3:1, le texte 4,5:1. Les labels 11px imposaient de foncer `--ink-faint` jusqu'à 4,9:1.

Revalider après toute modification :

```bash
node scripts/validate_palette.js "#A33449,#175FB4" --mode light --surface "#E9E8E3"
```

Encodage secondaire systématique : une couleur de score n'apparaît jamais seule, le chiffre en monospace l'accompagne toujours.

Encodage des séries dans les graphiques : **focus + contexte**. La marque du client porte `--signal`, les concurrents restent en neutres (`--bone-faint` / `--rule-strong`). Jamais de série colorée par son rang.
