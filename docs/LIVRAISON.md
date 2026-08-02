# Livrer un sprint : comment on fait monter le score

Le mode d'emploi de la machine de livraison. Ce qui est automatisé, ce qui
reste humain, et pourquoi chaque action bouge le score au re-scan J+90.

---

## 1. La physique du score, d'abord

Le re-scan J+90 rejoue les 24 mêmes questions sur les 6 mêmes moteurs. Deux
faits commandent toute la stratégie de livraison.

**Fait 1 : on optimise pour un examen dont on connaît les questions.** Les 24
questions sont scellées et visibles dans le rapport. Chaque question où le
client est absent est une cible nommée : on sait exactement quelle page créer,
quelle source obtenir. Aucune agence SEO ne travaille avec une cible aussi
nette.

**Fait 2 : les six moteurs ne bougent pas à la même vitesse.**

| Moteurs | Comment ils répondent | Ce qui les fait bouger | Délai |
|---|---|---|---|
| Perplexity, Grok, Claude (recherche web active) | Ils **consultent le web en direct** au moment de répondre | Citations sur des sources tierces + pages qui répondent à la question | **Semaines** |
| ChatGPT, Gemini, Le Chat (sans recherche) | Ils répondent **de mémoire** (entraînement) | Présence durable et répétée sur le web | Mois, voire au-delà du J+90 |

Conséquence stratégique : **le gain du J+90 viendra surtout des trois moteurs
« fondés sur la recherche »**. C'est là qu'on concentre l'effort, et c'est ce
qu'on dit honnêtement au client dès le cadrage : « les moteurs à recherche
bougeront d'abord, les moteurs à mémoire suivront après la fenêtre des 90
jours ». Cette phrase protège le re-scan et crédibilise la mesure.

Le chantier technique n'a de score direct nulle part, mais il conditionne tout :
un site illisible par les robots ne peut être ni consulté en direct, ni appris.

---

## 2. Les trois chantiers, action par action

### Chantier 1 — Technique : rendre le site lisible (J1 → J7)

| Action | Qui | Outil |
|---|---|---|
| Audit complet du site | machine | `pnpm toolkit audit-technique <site>` |
| Générer robots.txt corrigé, llms.txt, balisage schema.org | machine | `pnpm toolkit generate-fixes` |
| Déployer (ou envoyer le cahier de specs à l'agence du client) | **humain** | |
| Vérifier que tout est réellement en ligne | machine | `pnpm toolkit verify-fixes` |
| Compter les passages réels de GPTBot, ClaudeBot, PerplexityBot | machine | `pnpm toolkit crawler-log` (logs serveur du client) |
| **Verrouiller l'entité** : Wikidata, `schema.org sameAs`, nom-adresse-téléphone identiques partout | **humain** | une demi-journée, standard S1 |

Le verrouillage d'entité est le vaccin contre la confusion d'homonymes que la
question miroir révèle souvent : c'est ce qui fait qu'un moteur relie toutes
les mentions à une seule entreprise au lieu de les diluer.

Le piège mortel du chantier : des correctifs livrés mais jamais déployés.
`verify-fixes` existe précisément pour ça — il distingue les échecs bloquants
(robot encore bloqué = sprint inerte) des avertissements.

### Chantier 2 — Contenu : donner à citer (J7 → J21)

| Action | Qui | Outil |
|---|---|---|
| **Étape zéro : classer les questions perdues par gagnabilité** | machine | `pnpm toolkit prioriser` |
| Briefs ciblés sur les questions gagnables | machine | `pnpm toolkit content-brief` |
| Validation des sujets avec le client | **humain** | call 15 min |
| Rédaction des 5 contenus (réponse directe + schema.org intégré) | machine | `pnpm toolkit draft-content` |
| Combler les `[À COMPLÉTER]` (prix, chiffres, faits clients) | **humain** | jamais inventés par la machine |
| Relecture client, puis publication | **humain** | |
| **Signaler chaque URL publiée à Bing/IndexNow** | machine | `pnpm toolkit indexnow` |

`prioriser` note chaque question perdue (intention, encombrement, présence du
concurrent dominant, forteresses éditoriales dans les sources) : les 5 contenus
visent le haut du classement, ce qui maximise le delta mesuré à J+90.

IndexNow, c'est le raccourci que personne n'utilise : la recherche de ChatGPT
tourne sur Bing, et un ping IndexNow fait indexer une page en heures au lieu de
semaines. Décisif dans une fenêtre de 90 jours. La clé est générée par la
commande et le fichier `<clé>.txt` fait partie des correctifs du chantier 1.

Formats qui marchent : comparatif « X vs Y », page « alternatives à », FAQ
métier balisée, guide d'achat, page locale. Chaque contenu vise une question
scellée précise, pas un mot-clé.

**Le comparatif doit être honnête au point d'être citable** : tableau factuel,
forces réelles des concurrents incluses. Une pub déguisée n'est jamais reprise
par un moteur ; une comparaison loyale l'est. Celui qui écrit la comparaison
contrôle le cadre — être le comparateur, pas seulement le comparé.

### Chantier 3 — Citations : faire parler ailleurs (J7 → J30)

| Action | Qui | Outil |
|---|---|---|
| Cibles priorisées : sources citées par les moteurs pour les concurrents + base des 53 annuaires | machine | `pnpm toolkit citation-targets` |
| Inscriptions annuaires et fiches (Google Business, comparateurs sectoriels) | **humain** | comptes, SIRET, validation |
| Pitchs presse rédigés | machine | inclus dans citation-targets |
| Envoi des pitchs, relances | **humain** | boîte mail réelle |
| Vérifier quelles citations sont réellement en ligne | machine | `verify-citations` — **à construire** |

Depuis l'activation de la recherche web sur le scan complet, les cibles ne
sont plus devinées : ce sont les sources que Claude, Grok et Perplexity ont
réellement consultées pour recommander les concurrents. On s'installe
exactement là où les moteurs regardent.

**Le placement ciblé est la version supérieure de l'inscription.** Sur une
question comparative, les moteurs citent la page tierce qui compare (un
classement, un « les 10 meilleurs »), presque jamais le site d'un prestataire.
L'outreach vise donc d'abord les pages exactes que le scan a vues citées :
beaucoup de classements acceptent des ajouts. Promesse chirurgicale : « l'IA
cite cette page ; vous y serez. » ⚠ Certaines plateformes monétisent
l'inscription (100-300 € selon le secteur) : à annoncer dans la proposition,
à la charge du client, jamais découvert en cours de sprint.

**Le kit « 10 avis en 30 jours ».** Sentiment (10 %) + recommandation (20 %) :
près d'un tiers du score dépend de ce que des tiers disent. On fournit au
client le kit de collecte : gabarits d'email pour ses propres clients, QR code,
séquence de demande. Vrais clients, vrais avis. C'est lui qui l'exécute, c'est
l'action au meilleur ratio effort/score du sprint.

**Le programme porte-parole (optionnel).** La machine repère chaque mois deux
vraies questions publiques (forums, Reddit) alignées sur les thèmes des 24
questions ; le dirigeant y répond en son nom, avec transparence. Lent mais
cumulatif, et strictement dans la doctrine : jamais de faux avis, jamais
d'astroturfing.

---

## 3. Le déroulé, semaine par semaine

| Semaine | Machine | Humain |
|---|---|---|
| **S1** (J1-J7) | audit, correctifs générés, briefs prêts | call de cadrage 1 h, déploiement technique, validation des sujets |
| **S2** (J8-J14) | contenus rédigés, cibles de citation priorisées | compléter et publier les 2 premiers contenus, lancer les inscriptions |
| **S3** (J15-J21) | verify-fixes, suivi crawler-log | publier le reste, envoyer les pitchs presse |
| **S4** (J22-J30) | rapport de fin de sprint (`sprint-report`) | relances presse, call de clôture, remise du rapport |
| **J+45** | contrôle interne (voir § 5) | ajuster le tir sur les citations si rien ne bouge |
| **J+90** | re-scan (`rescan`), mêmes questions | call de restitution avant/après |

**Le vendredi, chaque semaine : l'email de preuve.** Un gabarit déterministe
listant ce qui a été fait dans la semaine, avec liens et captures. Aucune
agence ne le fait ; c'est ce qui rend les 2 900 € indiscutables pendant le
sprint, pas seulement à la fin.

---

## 4. Ce qui reste à construire (Claude Code)

Par ordre de priorité :

1. **`apps/admin` sur le nouveau schéma** — le poste de pilotage du sprint :
   checklist S1→S4 encodée, livrables, statuts des citations, échéances J+90.
   Il parle encore l'ancien vocabulaire et ne fonctionne pas contre la vraie
   base. Sans lui, le premier sprint se pilote de mémoire.
2. **`verify-citations`** — crawle chaque cible de citation et vérifie que la
   marque y figure réellement ; met à jour les statuts ; alimente l'email de
   preuve et le rapport final. Constructible et testable dès maintenant, sans
   clé API.

   ✅ Déjà construits (2026-08-02) : **`prioriser`** (gagnabilité des questions
   perdues, 5 tests) et **`indexnow`** (ping Bing avec gestion de clé par
   client, mode --dry-run).
3. **Contrôle J+45 interne** — mini-mesure sur les trois moteurs à recherche
   uniquement (~0,40 €), jamais montrée comme un score : elle sert à savoir à
   mi-parcours si les citations prennent, et à réorienter l'effort. Le J+90
   reste la seule mesure contractuelle.
4. **Vérification de publication des contenus** — extension de `verify-fixes` :
   les 5 URLs répondent, le balisage y est, le llms.txt les référence.
5. **`sprint-report` enrichi** — assemble automatiquement les preuves :
   correctifs vérifiés, passages de robots comptés, citations obtenues,
   contenus en ligne. Le rapport devient une pièce à conviction.

Les quatre commandes pilotées par un LLM (`generate-fixes`, `content-brief`,
`draft-content`, `citation-targets`) n'ont jamais tourné avec une vraie clé :
première exécution réelle à faire avant le premier client.

---

## 5. Les promesses, calibrées sur ce qu'on contrôle

- **On garantit** : la livraison intégrale des actions, documentée chaque
  vendredi ; la vérification que tout est réellement en ligne ; la mesure
  identique à J+90.
- **On ne garantit pas** : un score. Et on explique pourquoi avec la physique
  des moteurs (§ 1) — ce qui est infiniment plus crédible qu'un « ça dépend ».
- **On annonce dès le cadrage** : « le mouvement visible à J+90 viendra
  d'abord de Perplexity, Grok et Claude. ChatGPT et Gemini apprennent plus
  lentement : c'est le travail qui paye sur douze mois. » Vrai, vérifiable,
  et ça transforme la limite en argument de constance.
- **Plus tard, après 3 sprints mesurés** : la garantie de mouvement
  (remboursé si rien ne bouge à J+90) — voir STRATEGIE.md. Pas avant d'avoir
  la preuve que le mouvement est systématique.

## 6. L'après-sprint : la Vigie (décision à prendre avec Jérémie)

Le sprint reste sans abonnement, c'est un argument de vente. Mais après le
J+90 : la Vigie, ~190 €/mois résiliable à tout moment. Mini-mesure mensuelle
sur les trois moteurs à recherche (~0,40 € de coût), alerte si le score chute
ou si un concurrent double le client, un contenu de rafraîchissement par
trimestre. Dix clients en Vigie = 1 900 €/mois récurrents, et le client reste
dans la base : premier au courant, premier rappelé pour un second sprint.
C'est ce qui transforme une agence à missions en machine qui se compose.
