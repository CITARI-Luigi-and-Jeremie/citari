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

Références mentales (ne pas copier, s'en inspirer) : les thèmes d'IDE sombres à fort contraste, la presse économique imprimée, la data-visualisation du Financial Times, les interfaces de terminal.

## 3. Typographie

- **Titres** : une serif éditoriale à fort caractère OU une grotesque suisse dense.
- **Corps** : une sans-serif lisible mais non générique.
- **Données / chiffres / requêtes / code** : une monospace assumée. Tous les scores, pourcentages et noms de requêtes sont en monospace — c'est la signature visuelle du produit.
- **Échelle** : contraste fort entre les niveaux. Un H1 à 64-80px face à un corps à 16px. Pas d'échelle molle où tout se ressemble.
- Chargement via `next/font` uniquement, jamais de `<link>` Google Fonts brut.

### Choix engagés pour ce projet

| Rôle | Police | Usage |
|---|---|---|
| Titres | **Instrument Serif** | H1/H2 éditoriaux, chiffres héros |
| Corps | **Public Sans** | texte courant, UI |
| Données | **JetBrains Mono** | scores, pourcentages, requêtes, moteurs, labels techniques |

## 4. Couleur

- Base sombre : fond quasi-noir légèrement teinté (jamais #000 pur, jamais gris neutre plat).
- Une couleur dominante qui porte l'identité + un accent unique et tranchant utilisé avec parcimonie pour l'alerte et l'action. Pas de palette arc-en-ciel.
- Sémantique des scores (cohérente partout) : un score bas utilise l'accent d'alerte de façon franche, un score haut une couleur de validation sobre.
- Tout en variables CSS définies une seule fois dans `globals.css`. **Aucune couleur en dur dans un composant, jamais.**

### Palette engagée (validée CVD — voir §11)

| Token | Valeur | Rôle |
|---|---|---|
| `--ink` | `#07090B` | fond, encre quasi-noire bleutée |
| `--ink-raised` | `#0E1216` | surfaces surélevées |
| `--ink-sunken` | `#050708` | creux, fonds de tableau |
| `--rule` | `#242A31` | filets 1px |
| `--rule-strong` | `#39424C` | filets accentués |
| `--bone` | `#EDE7DA` | texte principal (papier éditorial) |
| `--bone-dim` | `#9BA3AC` | texte secondaire |
| `--bone-faint` | `#646C75` | texte tertiaire, labels |
| `--signal` | `#F0501F` | accent unique : alerte + action |
| `--valid` | `#2CAB74` | score élevé, validation sobre |

Le `--signal` est la seule couleur « chaude vive » du système. Il sert à l'action (CTA) **et** à l'alerte (score bas). Cette double fonction est volontaire : chez nous, la mauvaise nouvelle *est* l'appel à l'action.

**Il n'y a délibérément que deux couleurs sémantiques, pas trois.** Un score intermédiaire s'affiche en `--bone` (neutre). Deux raisons : une étape ambre entrait en collision avec l'orange en vision deutan (ΔE 0,1 — indistinguable), et un score moyen ne mérite ni alarme ni félicitation. Le neutre est le bon signal.

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
- Le PDF a sa propre feuille de style print : fond clair, typographie éditoriale, pensé pour être imprimé.

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

Les couleurs sémantiques (`--signal` / `--valid`) sont validées contre le fond `#07090B` — **tous les tests passent** : bande de luminosité dark (L 0,48-0,67), plancher de chroma, séparation deutan ΔE 9,5, vision normale ΔE 30,2, contraste ≥ 3:1.

Revalider après toute modification :

```bash
node scripts/validate_palette.js "#F0501F,#2CAB74" --mode dark --surface "#07090B"
```

Encodage secondaire systématique : une couleur de score n'apparaît jamais seule, le chiffre en monospace l'accompagne toujours.

Encodage des séries dans les graphiques : **focus + contexte**. La marque du client porte `--signal`, les concurrents restent en neutres (`--bone-faint` / `--rule-strong`). Jamais de série colorée par son rang.
