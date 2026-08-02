# Livrer un sprint : le manuel complet

Tout ce qu'on fait pour que le client soit plus cité par les IA au re-scan
J+90. Ce que la machine fait toute seule, ce que nous faisons à la main.
Écrit simple : on est encore en train d'apprendre ce métier.

---

## Les 2 règles du jeu

**Règle 1 : on connaît les questions de l'examen.** Le scan a posé 24
questions, elles sont gelées, le re-scan reposera exactement les mêmes.
Chaque question où le client est absent est une cible précise.

**Règle 2 : 3 moteurs bougent vite, 3 bougent lentement.** Perplexity, Grok
et Claude lisent le web au moment de répondre : ils peuvent changer d'avis en
quelques semaines. ChatGPT, Gemini et Le Chat répondent de mémoire : ils
mettent des mois. Le progrès à J+90 viendra surtout des 3 premiers, et on le
dit au client dès le cadrage :

> « Les moteurs qui lisent le web bougeront d'abord. Ceux qui répondent de
> mémoire suivront : c'est le travail qui paye sur douze mois. »

---

## Chantier 1 — Rendre le site lisible (semaine 1)

Beaucoup de sites bloquent les robots des IA sans le savoir. Tant que c'est
bloqué, rien d'autre ne sert.

### La machine (déjà codé)

| Commande | Ce qu'elle fait, en clair |
|---|---|
| `pnpm toolkit audit-technique <site>` | Lit le site comme un robot d'IA et liste ce qui cloche : robots bloqués, llms.txt absent, balisage manquant. |
| `pnpm toolkit generate-fixes <client>` | Écrit les fichiers de correction prêts à poser (robots.txt, llms.txt, schema.org) + un doc d'instructions pour le développeur du client. |
| `pnpm toolkit verify-fixes <client>` | Revérifie le site en ligne : les corrections sont-elles VRAIMENT déployées ? Piège n°1 du sprint. |
| `pnpm toolkit crawler-log <client>` | Compte dans les logs du serveur les visites réelles de GPTBot, ClaudeBot, PerplexityBot. 0 → 40 visites/semaine = preuve que le site est devenu lisible. |

### Nous

- Call de cadrage 1 h : accès, panier moyen, planning
- Déployer les corrections (ou envoyer le doc au développeur du client)
- Verrouiller l'identité : fiche Wikidata, mêmes nom/adresse/téléphone
  partout, liens sameAs. Une demi-journée. Évite que ChatGPT confonde le
  client avec un homonyme.

---

## Chantier 2 — Créer ce que les IA peuvent citer (semaines 2-3)

Une IA ne cite pas une plaquette. Elle cite une page qui répond à une
question précise avec des faits.

### La machine (déjà codé)

| Commande | Ce qu'elle fait, en clair |
|---|---|
| `pnpm toolkit prioriser <client>` | Classe les questions perdues par gagnabilité : lesquelles peut-on vraiment gagner en 90 jours ? Les 5 contenus visent le haut de la liste. Testé (5 tests), zéro clé API. |
| `pnpm toolkit content-brief <client>` | Prépare le plan détaillé de chaque contenu, ciblé sur une question gagnable. |
| `pnpm toolkit draft-content <client> <brief>` | Rédige le contenu complet au format que les IA citent : réponse en 2 phrases en haut, faits ensuite, balisage intégré. Les vrais chiffres restent en [À COMPLÉTER] : la machine n'invente jamais. |
| `pnpm toolkit indexnow <client> <urls>` | Prévient Bing dès qu'une page est publiée. La recherche de ChatGPT tourne sur Bing : la page est indexée en heures au lieu de semaines. Quasi personne ne le fait. |

### Nous

- Valider les 5 sujets avec le client (15 min)
- Remplacer chaque [À COMPLÉTER] par les vrais chiffres
- Faire relire, publier, puis `indexnow` sur chaque URL

Règle d'or des comparatifs : être honnête au point d'être citable. On inclut
les vraies forces des concurrents. Une pub déguisée n'est jamais reprise par
une IA ; une comparaison loyale, si. Celui qui écrit la comparaison contrôle
le cadre.

---

## Chantier 3 — Faire parler du client ailleurs (semaines 2-4)

Les moteurs qui lisent le web se fient à des sources tierces. Si personne ne
parle du client, il n'y a rien à reprendre.

### La machine (déjà codé)

| Commande | Ce qu'elle fait, en clair |
|---|---|
| `pnpm toolkit citation-targets <client>` | Liste où il faut être : d'abord les pages exactes que les moteurs ont consultées pour recommander les concurrents (le scan les a vues), puis la base des 53 annuaires par secteur. Rédige les brouillons de pitchs presse. |

### Nous

- Les inscriptions : annuaires, Google Business, comparateurs (comptes, SIRET)
- Le placement ciblé : contacter les classements que les IA citent déjà pour
  y faire ajouter le client. ⚠ Certains sont payants (100-300 €, à la charge
  du client, annoncé dans la proposition, jamais découvert en cours de sprint)
- Envoyer les pitchs presse, relancer
- Remettre le kit « 10 avis en 30 jours » : gabarits d'email pour les clients
  du client + QR code. Vrais avis de vrais clients. Pèse près d'un tiers du
  score (sentiment 10 % + recommandation 20 %).

Optionnel, strictement dans la doctrine : le programme porte-parole. La
machine repère chaque mois deux vraies questions publiques (forums) alignées
sur les 24 thèmes ; le dirigeant y répond en son nom, avec transparence.
Jamais de faux avis, jamais d'astroturfing.

---

## Le calendrier complet

| Quand | La machine | Nous |
|---|---|---|
| S1 | audit-technique, generate-fixes, prioriser | call cadrage, déploiement, Wikidata, validation sujets |
| S2 | content-brief, draft-content, citation-targets | compléter, publier 2 contenus, inscriptions, kit avis |
| S3 | verify-fixes, crawler-log, indexnow | publier le reste, pitchs presse, placement ciblé |
| S4 | sprint-report | relances, call de clôture, rapport |
| J+45 | contrôle interne (3 moteurs rapides, ~0,40 €) | réorienter les citations si rien ne bouge |
| J+90 | rescan : mêmes 24 questions, mêmes 6 moteurs | call de restitution avant/après |

**Chaque vendredi : l'email de preuve.** Ce qui a été fait dans la semaine,
liens et captures, gabarit fixe, dix minutes. C'est ce qui rend les 2 900 €
indiscutables pendant le sprint, pas seulement à la fin.

---

## Tout est codé (2026-08-02)

| Brique | État |
|---|---|
| **Le back-office** | ✅ Reconstruit sur le schéma réel : leads priorisés, conversion en client (crée le sprint + la checklist des 90 jours), fiche client, relances, livrables, citations avec statuts, ouverture du re-scan J+90. Il n'exécute jamais de mesure lui-même : le seul moteur est celui du front. |
| **verify-citations** | ✅ Crawle chaque cible, cherche la marque (entités HTML décodées, comparaison normalisée), met à jour les statuts. Une cible « obtenue » où la marque a disparu est reclassée : le rapport n'affirme jamais une citation invérifiable. |
| **verify-contents** | ✅ Chaque contenu publié : la page répond, porte du JSON-LD, figure dans llms.txt. |
| **controle-45** | ✅ Mode « controle » côté moteur : mêmes questions que le scan initial, Claude + Perplexity + Grok seulement, plafond 1 €, ni audit ni miroir. Le re-scan J+90 ne le confond jamais avec lui. |
| **sprint-report à preuves** | ✅ Le rapport intègre les passages réels des robots (table crawler_hits, alimentée par crawler-log) et les vérifications en ligne. |
| **La checklist des 90 jours** | ✅ Encodée dans l'admin (créée à chaque conversion) : S1 technique, S2 contenu, S3 placement, S4 preuves, puis J+45 et J+90. C'est l'exécutable de ce document. |

⚠ Les commandes qui écrivent du contenu (generate-fixes, content-brief,
draft-content, citation-targets) n'ont jamais tourné avec une vraie clé API.
Première exécution réelle avant le premier client. Et l'interface du nouveau
tunnel (verrous + Calendly) reste à faire par Jérémie via le prompt Lovable.

---

## L'après-sprint : la Vigie (décision à prendre avec Jérémie)

Le sprint reste sans abonnement, c'est un argument de vente. Après le J+90 :
la Vigie, ~190 €/mois résiliable à tout moment. Mesure mensuelle sur les
trois moteurs à recherche (~0,40 € de coût), alerte si le score chute ou si
un concurrent double le client, un contenu de rafraîchissement par trimestre.
Dix clients en Vigie = 1 900 €/mois récurrents, et le client reste dans la
base. C'est ce qui transforme une agence à missions en machine qui se compose.

## Les promesses, calibrées sur ce qu'on contrôle

- On garantit : la livraison intégrale des actions, documentée chaque
  vendredi ; la vérification que tout est en ligne ; la mesure identique à J+90.
- On ne garantit pas : un score. On explique pourquoi avec les 2 règles du
  jeu, ce qui est plus crédible qu'un « ça dépend ».
- Plus tard, après 3 sprints mesurés : la garantie de mouvement (remboursé si
  rien ne bouge à J+90). Pas avant d'avoir la preuve que le mouvement est
  systématique. Voir STRATEGIE.md.
