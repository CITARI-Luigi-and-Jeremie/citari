# Prompt Lovable — GEO Sprint

Copie-colle la partie « PROMPT » ci-dessous dans Lovable. Le reste de ce fichier
explique comment l'utiliser et ce qui ne passera pas par Lovable.

---

## Comment l'utiliser

1. **Envoie le prompt complet en premier message.** Lovable construira le socle :
   design system, base de données, landing.
2. **Puis itère page par page** avec des messages courts : « Maintenant la page
   rapport », « Maintenant le back-office », etc. Lovable travaille beaucoup
   mieux en itérations qu'en un seul jet géant.
3. **Connecte Supabase dès le début** (bouton natif dans Lovable), avant de
   demander la moindre fonctionnalité de scan.

## Ce que Lovable ne pourra pas faire

| Brique | Pourquoi | Solution |
|---|---|---|
| Le scan (90 s à 4 min, ~96 appels API) | Les Edge Functions Supabase ont un temps limite ; Lovable ne gère pas les files d'attente | Garder le moteur Node actuel, ou découper en lots via `pg_cron` |
| Les 8 commandes de livraison (audit, contenus, relances, propositions…) | Ce sont des scripts en ligne de commande | Garder `packages/toolkit` en local |
| Le PDF du rapport (Playwright) | Nécessite un navigateur headless | Garder côté Node, ou imprimer depuis le navigateur |

Le reste — landing, formulaire, écran d'attente, rapport, pages de contenu,
back-office — passe très bien.

---

# PROMPT

Tu construis **GEO Sprint**, le site d'une agence française de GEO (Generative
Engine Optimization). Lis tout avant de commencer, puis construis dans l'ordre
indiqué à la fin.

## 1. Le métier, en clair

Quand un dirigeant demande à ChatGPT « quel cabinet comptable choisir à Lyon ? »,
l'IA répond en citant deux ou trois marques. Si la sienne n'y est pas, il perd
une affaire sans jamais le savoir — il n'existe pas de deuxième page de
résultats.

GEO Sprint mesure cette invisibilité, puis la corrige.

**Le tunnel commercial :**
1. **Scan gratuit** (l'aimant à prospects) : le visiteur mesure sa visibilité
   dans ChatGPT, Claude, Gemini et Perplexity. Sans inscription.
2. **Call de restitution** gratuit, 30 minutes.
3. **Sprint GEO — 2 900 €**, paiement unique, mission de 30 jours.
   Option **Sprint Domination — 4 900 €**.
4. **Re-scan offert à J+90** : mêmes questions, preuve de progression, revente.

**Cible :** dirigeants de PME et ETI francophones — experts-comptables, avocats,
menuisiers, agences immobilières, agences marketing, éditeurs de logiciels.
Ce ne sont **pas** des utilisateurs techniques.

**L'équipe :** un fondateur seul. Tout doit maximiser le levier d'une personne.

## 2. Les règles métier à ne jamais casser

**Score de Visibilité IA (0-100)**, calculé ainsi :
- taux de mention : **50 %**
- position moyenne dans la réponse : **20 %**
- recommandation explicite : **20 %**
- sentiment : **10 %**

**Part de voix** = mentions de la marque / mentions totales (marque + concurrents).

**Échantillon de requêtes** : 20 à 30 questions d'intention d'achat, réparties en
40 % comparatives, 25 % problème, 20 % locales, 15 % confiance. Elles sont
**générées une fois puis figées** : le re-scan à J+90 rejoue exactement les mêmes,
sinon la comparaison ne vaut rien.

**Quatre moteurs**, toujours nommés dans cet ordre : ChatGPT, Claude, Gemini,
Perplexity. La mesure passe par leurs API officielles — jamais par du scraping
des interfaces grand public.

**Garde-fous** : 3 scans maximum par jour et par IP, Cloudflare Turnstile sur le
formulaire, coût par scan plafonné et journalisé.

## 3. Doctrine d'honnêteté — non négociable

Ces règles sont la marque de fabrique du produit. Elles ne sont pas décoratives.

- **Aucun faux résultat client, aucun témoignage, aucun logo.** Il n'y a pas
  encore de client : la crédibilité doit venir de la clarté, pas d'une preuve
  sociale fabriquée.
- **Toute réponse d'IA montrée en exemple est étiquetée « exemple »**, et les
  noms de concurrents qui y figurent sont **fictifs et signalés comme tels**.
- **On garantit les actions livrées, jamais un score.** Les moteurs intègrent les
  changements en 4 à 12 semaines. Le site doit le dire explicitement, c'est un
  argument de vente et non un aveu de faiblesse.
- **Aucun compteur simulé** sur l'écran d'attente : il n'affiche que des données
  réellement enregistrées.

## 4. Direction artistique

### Le concept

**Papier et encre.** Le livrable qui justifie une facture de 2 900 € est un
rapport qu'un dirigeant imprime et pose sur son bureau. L'écran et le PDF
partagent donc le même traitement : fond papier clair, encre profonde, filets
fins. Autorité d'un instrument de mesure, pas douceur d'une application grand
public.

Références : la presse économique imprimée, la data-visualisation du Financial
Times, le rapport d'expertise relié, le document administratif français.

### Le geste signature : le vide à remplir

Le produit mesure une **absence**. Rends-la physique : une ligne de formulaire
restée vide, là où le nom de la marque aurait dû être écrit, avec la mention
« RIEN » au bout. C'est le seul ornement que s'autorise le système, et il doit
apparaître dès le premier écran.

### Palette — à conserver telle quelle

Ces valeurs ont été validées pour le daltonisme (deutéranopie ΔE 9,5) et pour le
contraste WCAG. **Ne les « améliore » pas** : deux tentatives précédentes ont
échoué aux tests.

| Rôle | Valeur | Contraste sur le papier |
|---|---|---|
| Fond papier | `#E9E8E3` | — |
| Fond surélevé | `#F2F1ED` | — |
| Fond creusé (lignes alternées) | `#E1E0DA` | — |
| Filet fin | `#C9C7C0` | — |
| Filet accentué | `#A8A59C` | — |
| Piste de jauge | `#D6D4CD` | — |
| Encre principale | `#17191C` | 14,4:1 |
| Encre secondaire | `#4E5257` | 6,4:1 |
| Encre tertiaire, labels | `#5F6368` | 4,9:1 |
| **Bordeaux — accent unique** (alerte + action) | `#A33449` | 5,4:1 |
| **Bleu encre** (score élevé) | `#175FB4` | 5,1:1 |

Deux couleurs sémantiques seulement, pas trois : un score intermédiaire s'affiche
en encre neutre. Un vert aurait été indistinguable du bordeaux en deutéranopie.

Toutes les couleurs en variables CSS, définies une seule fois. Aucune valeur
chromatique en dur dans un composant.

### Typographie

| Rôle | Police | Usage |
|---|---|---|
| Titres | **Instrument Serif** | titres éditoriaux, chiffres héros |
| Corps | **Public Sans** | texte courant, interface |
| Données | **IBM Plex Mono** | scores, pourcentages, requêtes, noms de moteurs, labels |

**Toute valeur mesurée est en monospace** — c'est la signature visuelle du
produit. Échelle à fort contraste : un titre de 60-100 px face à un corps de
16 px, jamais d'échelle molle où tout se ressemble.

### Typographie française

Espace fine insécable avant `? ! ; :` et à l'intérieur des guillemets `« »`.
Apostrophes courbes (`’`, jamais `'`). Espaces insécables dans `2 900 €` et
`46 %`. Chiffres tabulaires partout où des valeurs s'alignent en colonne.

*Attention : Instrument Serif ne possède pas le glyphe de l'espace fine — dans
les titres, utiliser l'espace insécable classique.*

### Interdits absolus

- Police Inter, Roboto, Arial, Helvetica ou police système
- Dégradés violet/indigo sur blanc
- Fond quasi-noir avec un unique accent orange ou vert acide
- Grilles de trois cartes arrondies à ombre portée avec petite icône
- Hero centré titre + sous-titre + deux boutons côte à côte
- Emoji en guise d'icônes
- Ombres portées molles partout — **on sépare par des filets 1 px, pas par des ombres**
- Angles arrondis mous : le rayon par défaut est **0**
- Numérotation 01/02/03 décorative — elle n'est légitime que si le contenu est
  réellement une séquence

### Composition

Asymétrie assumée, jamais tout centré. Grille éditoriale à colonnes inégales.
**Varie le rythme d'une section à l'autre** : répéter la même grille quatre fois
d'affilée est la signature d'un site généré. Espacement sur une échelle stricte
(4/8/12/16/24/32/48/64/96 px), jamais de valeur arbitraire.

Les écrans de données (rapport, tableau de requêtes) doivent être **denses**.
Les écrans marketing peuvent respirer.

### Mouvement

Micro-interactions rapides et sèches (120-200 ms), jamais flottantes ni
rebondissantes. Deux moments chorégraphiés autorisés, et deux seulement :
l'écran de progression du scan, et la révélation du score. Un grain de papier
très fin (3 % d'opacité) sur toute la page. `prefers-reduced-motion` respecté
sans exception.

## 5. Les écrans à construire

### A. Landing — `/`

Premier écran, visible sans défiler : le titre, le formulaire de scan **et** le
bloc de preuve.

- **H1** : « Votre marque est-elle *invisible* dans ChatGPT ? » (un seul mot en
  bordeaux)
- **Formulaire de scan**, à droite : marque, URL, secteur (liste d'environ 20 +
  « autre »), jusqu'à 3 concurrents, langue (français par défaut, italien,
  anglais)
- **Bloc de preuve interactif** — le plus important de la page. Une phrase à
  compléter : « Je suis **[métier ▾]** à **[ville ▾]** ». Le visiteur choisit, et
  la question posée, la réponse de l'IA et les concurrents cités s'adaptent.
  Prévois 8 métiers et 8 villes. En dessous : la ligne vide et « RIEN ».
  Étiquette « Exemple » et « noms de concurrents fictifs » bien visibles.
- **Une statistique en exergue éditorial** (pas un bandeau de trois chiffres,
  c'est un cliché) : « 46 % des utilisateurs d'IA démarrent leur recherche
  d'achat directement sur une IA », en grande serif. Sources citées en petit :
  Alchemer 2026, G2 Research 2026, Reuters.
- **La mesure** : 24 questions / 4 moteurs / 1 score.
- **L'offre** : inventaire précis des livrables avant le prix — audit technique,
  cinq contenus rédigés, huit cibles de citation, rapport de fin de sprint,
  re-scan à J+90. Puis 2 900 €, paiement 50/50, sans abonnement.
- **L'engagement d'honnêteté** en colonne étroite : « Nous garantissons les
  actions livrées, pas un score. »
- **FAQ** balisée schema.org FAQPage.
- Le site doit être sa propre démonstration GEO : `llms.txt`, `robots.txt`
  autorisant explicitement GPTBot, ClaudeBot, PerplexityBot, Google-Extended,
  balisage schema.org Organization et FAQPage.

### B. Écran d'attente — `/scan/[id]`

Quatre-vingt-dix secondes d'attention captive : c'est un moment de théâtre, pas
une barre de chargement.

Grand pourcentage en monospace, filet de progression pleine largeur, les quatre
phases qui s'allument (initialisation, génération des questions, interrogation
des moteurs, analyse), le compteur réel de réponses collectées, et **la liste des
vraies questions générées qui apparaissent au fur et à mesure**.

Le client interroge l'API toutes les 1,5 s. Il doit tolérer plusieurs erreurs
réseau consécutives avant d'abandonner.

### C. Teaser — même page, à la fin du scan

Sans email : le score en très grand avec un verdict en toutes lettres (« Quasi
invisible »), le score par moteur, la part de voix en barres horizontales, et
**un verbatim où un concurrent est cité et pas la marque**.

Puis capture de l'email pour débloquer le rapport complet, avec mention RGPD et
lien vers la politique de confidentialité.

### D. Rapport complet — `/rapport/[jeton]`

**C'est l'écran de référence : construis-le en premier et fais-en découler les
autres.** Accessible par lien signé, sans compte.

En-tête éditorial calé à gauche : nom de la marque en très grand, puis secteur,
site, date, taille de l'échantillon en monospace.

Rail de navigation en colonne étroite, puis six sections :
1. Score global et par moteur
2. Part de voix (la marque en bordeaux, les concurrents en neutre — encodage
   « focus + contexte », jamais une couleur par rang)
3. Tableau requête par requête, dense, indiquant qui est cité et dans quel ordre,
   avec la mention « absent » en bordeaux là où la marque manque
4. Trois à cinq verbatims bruts, marques surlignées
5. Sources citées par Perplexity pour les concurrents — *c'est l'argument de
   vente numéro un : « voilà où il faut être »*
6. Dix actions prioritaires, classées par chantier

**Mode comparaison** : si un scan précédent existe pour la même marque, afficher
l'avant/après sur tous les indicateurs (c'est le rapport J+90).

Feuille de style d'impression : fond blanc, URL des liens imprimées, pas de
coupure au milieu d'une section.

Data-visualisation : **SVG ou CSS sur mesure, aucune librairie de graphiques avec
son style d'usine**. Le chiffre accompagne toujours la couleur — l'identité ne
repose jamais sur la couleur seule.

### E. Pages de contenu

Trois articles de fond, écrits au format « réponse directe » (les deux premières
phrases répondent littéralement au titre), balisés Article + FAQPage :
- `/guide-geo` — qu'est-ce que le GEO, comment les moteurs choisissent, les 3
  chantiers, la méthode de mesure, les erreurs fréquentes
- `/geo-vs-seo` — comparatif point par point
- `/alternatives-agence-seo` — comparatif honnête des cinq options, y compris
  « faites-le vous-même »

### F. Pages légales

`/mentions-legales` (obligatoire, art. 6 III LCEN) et `/confidentialite` (RGPD :
finalités, bases légales, sous-traitants — OpenAI, Anthropic, Google, Perplexity,
Supabase, Resend —, durées de conservation, droits). Laisse des champs
`[À COMPLÉTER]` explicites pour le SIRET, le RCS, l'hébergeur.

### G. Back-office — protégé par mot de passe

Pas de comptes utilisateurs : un simple mot de passe en variable d'environnement.

- **Leads** : liste avec une **priorité automatique** (chaud / tiède / froid /
  traité) — un score bas et un scan récent remontent en tête ; un lead converti
  sort de la liste d'appels. Export CSV avec BOM UTF-8 pour Excel.
- **Bloc « à envoyer aujourd'hui »** en haut : les relances dues, texte prêt à
  copier, marquage « envoyé » en un clic.
- **Fiche lead** : détail du scan, statut, notes, séquence de relance visible et
  interruptible dès que le prospect répond, bouton « convertir en client ».
- **Clients** : fiche, données collectées au call, checklist des 30 jours en
  quatre semaines avec cases et notes, livrables, cibles de citation avec statut
  (à contacter / envoyé / relancé / obtenu), planification et lancement du
  re-scan J+90.

## 6. Base de données (Supabase)

`scans` · `queries` · `responses` · `mentions` · `leads` · `clients` · `sprints`
· `sprint_tasks` · `deliverables` · `citation_targets` · `directories` ·
`client_data` · `cost_log` · `follow_ups`

Points structurants :
- `scans.previous_scan_id` pointe vers le scan initial : c'est ce qui permet le
  rapport comparatif J+90.
- `scans.report_token` : jeton d'accès au rapport, sans compte.
- `queries` appartient à un scan et n'est jamais régénérée pour un re-scan : on
  copie les mêmes lignes.
- `directories` est un actif réutilisable : annuaires et comparateurs par
  secteur, enrichi à chaque mission.

## 7. Ce qu'il ne faut PAS construire

- Pas de comptes ni de connexion pour les prospects
- Pas de paiement en ligne (facturation manuelle 50/50)
- Pas de scraping des interfaces de ChatGPT ou Perplexity — API officielles
  uniquement, limite assumée et mentionnée dans chaque rapport
- Pas de multi-tenant ni de marque blanche
- Pas de tableau de bord de suivi permanent pour les clients

## 8. Ordre de construction

1. Le design system : couleurs, polices, primitives (bouton, champ, filet, label)
2. Le schéma Supabase
3. **La page rapport** — écran de référence qui fixe le langage visuel
4. La landing avec le bloc de preuve interactif
5. L'écran d'attente et le teaser
6. Les pages de contenu et les pages légales
7. Le back-office

Après chaque écran, vérifie : *un designer verrait-il immédiatement que c'est une
IA qui l'a fait ?* Si oui, recommence.
