# Journal des décisions

Ce que sait la conversation mais que le code ne dit pas. À lire au démarrage
d'une nouvelle session, après `CLAUDE.md`.

---

## 2026-08-07 — 100 lignes complètes, et le classement qui s'est trompé

La base 100 atteint **100/100 sur les trois axes** : un email dont le domaine
reçoit du courrier, un téléphone français valide, un dirigeant nommé, pour
chacune des cent lignes. Huit lignes irréparables ont été remplacées, pas
rafistolées.

Nouvelle commande `classer-leads`, la vingt-troisième : elle ordonne les
prospects du plus chaud au plus froid, avec la raison en clair et le détail
des points. Elle sait aussi que le score GEO, quand il existe, doit primer sur
tous les indices — un prospect mesuré à 8/100 passe devant n'importe quelle
fiche bien remplie, et un prospect à 78/100 est pénalisé, conformément à la
promesse publique de ne rien vendre à qui n'en a pas besoin.

**Le classement s'est trompé au premier essai, et c'est instructif.** Vingt des
trente premiers étaient des sociétés informatiques. Non parce qu'elles étaient
les meilleurs prospects, mais parce qu'Apollo couvre beaucoup mieux la tech que
l'expertise comptable, et que les éditeurs de logiciel posent plus de pixels
publicitaires que les cabinets. **La note mesurait la richesse de nos données,
pas la chaleur du prospect.** La joignabilité est redescendue de 35 à 25 points,
les signaux d'achat sont montés de 25 à 35, et la commande affiche désormais un
avertissement quand une verticale rafle plus de dix-huit des trente premières
places. La colonne `rang_verticale` permet de travailler les trois de front.

**Quatre pièges de collecte, tous payés sur des données réelles :**

- **Le drapeau `i` d'une expression régulière annulait une classe de
  majuscules.** `[A-ZÀ-Ý]` devenait « n'importe quelle lettre », si bien que
  « est une personne », « et accompagnement » ou « du conseil syndical » sont
  entrés en base comme noms de dirigeants. Dix-huit faux noms. Le nom se
  capture désormais sans ce drapeau, avec une liste de mots grammaticaux
  interdits et un contrôle de casse mot à mot.
- **Un SIRET découpé en paires ressemble à un téléphone.** « 01 20 04 86 22 »
  et « 01 03 10 38 07 » sont entrés ainsi : deux préfixes qui n'existent pas.
  Contrôle ARCEP ajouté sur les blocs réellement attribués.
- **Mais un contrôle trop strict est pire.** Le premier jeu de bornes a écarté
  vingt-trois numéros parfaitement valides, parce qu'il ne normalisait pas
  `+33` avant de mesurer la longueur, et que ses bornes niaient les `0980` et
  les `0413`. Restaurés. Règle : sur une donnée de contact, se tromper en
  jetant coûte plus cher que se tromper en gardant, car le faux se voit au
  premier appel et le manquant ne se voit jamais.
- **Le téléphone trahit l'homonyme.** En cherchant des remplaçants par
  devinette de domaine, un fixe `01` ou `04 67` a révélé à chaque fois qu'on
  avait trouvé le site d'une société homonyme ailleurs en France. Le contrôle
  géographique du numéro sert donc à valider une identité, pas seulement un
  contact — mais uniquement sur les fiches à identité incertaine : sur une
  fiche confirmée par SIREN, un indicatif inhabituel est le plus souvent un
  numéro VoIP, et le jeter perdrait un vrai prospect.

## 2026-08-06 (nuit) — La base 100 est fiabilisée, et trois pièges de plus

La première base de prospection (100 entreprises, Lyon, 3 verticales) a subi
une passe qualité complète avant tout envoi. Résultat final : 98 lignes notées
A (prêtes à contacter), 2 en B, zéro à écarter. 98 lignes sur 100 ont au moins
un email dont le domaine reçoit réellement du courrier (vérifié en DNS), 93 ont
un téléphone, 63 portent l'email nominatif vérifié du dirigeant.

Nouvelle commande `verifier-base`, la vingt-deuxième : MX de chaque domaine
d'email, doublons par SIREN et par domaine, zone géographique, cohérence
email/site. Elle note de A à D et n'efface rien : écarter est une décision
commerciale, pas technique.

Trois pièges payés pendant cette passe :

- **La localisation Apollo ment par extension.** « Lyon, France » chez Apollo
  matche des sociétés qui ont un BUREAU à Lyon avec un siège à Carcassonne,
  Paris ou Fréjus : 14 lignes sur 102, soit une sur sept, étaient hors zone.
  Pour une agence qui vend l'exclusivité locale et un baromètre lyonnais,
  c'était du poison silencieux. Le contrôle se fait sur le code postal du
  SIÈGE, celui du registre officiel, jamais sur la localisation Apollo.
- **Un même prospect peut sortir de deux verticales.** SDRA est apparu en
  expertise comptable ET en gestion de patrimoine : deux NAF, deux recherches,
  deux lignes. Recevoir deux fois le même email disqualifie. Dédoublonnage par
  SIREN d'abord, par domaine ensuite.
- **Un CSV ne se découpe jamais sur les retours à la ligne.** Les dirigeants
  du RNE contiennent des retours à la ligne dans leurs champs : le premier
  parseur transformait 102 lignes en 204 et le rapport était silencieusement
  faux. Parseur réécrit en flux, avec le cas dans les tests.

Et une règle de sélection : les remplaçants d'une ligne écartée se filtrent
par **NAF réel**, pas par mot-clé. Sans ce filtre, « Baguette Academy » (une
école) entrait en services informatiques et trois agences immobilières pures
entraient en gestion de patrimoine, ce qui aurait pollué le baromètre ET le
test A/B des trois verticales.

## 2026-08-06 (soir) — La prospection s'outille, la stratégie reste ouverte

Nouvelle commande `sourcer`, la vingtième : elle interroge l'annuaire officiel
des entreprises (API Recherche d'entreprises, données INSEE et RNE, gratuite et
sans clé) et produit la liste « Nom, site » que `scan-lot` attend, plus un CSV
de travail avec SIREN, commune, effectif et dirigeants. Prouvée en réel :
279 cabinets d'expertise comptable côté API pour le Rhône, 190 retenus.

Deux pièges de cette API, payés en la sondant avant d'écrire le code :

- Ses filtres géographiques matchent les **établissements**, pas les sièges.
  Chercher « Rhône » renvoie des sièges à Montluçon ou Paris qui y ont une
  antenne : 89 sur 279 dans notre premier tirage réel. Le filtre par siège se
  fait donc côté commande, `--etablissements` le désactive.
- La tranche d'effectif existe au niveau entreprise ET au niveau siège, et les
  deux divergent (le siège d'un groupe peut être « NN »). On lit toujours
  celle de l'entreprise.

La liste produite se **relit à la main** avant de dépenser un centime de scan.
Le premier tirage l'a justifié tout seul : un office notarial déclaré en NAF
6920Z (expertise comptable) sortait en tête de liste.

**La stratégie de prospection n'est PAS arrêtée.** La formule proposée (univers
officiel → sites web → scan-lot comme qualificateur → contact vérifié →
relances aux vrais chiffres) est en discussion, Luigi n'est pas sûr. La
commande, elle, sert quelle que soit la verticale choisie. Ne pas la considérer
comme un engagement sur la méthode.

**Piège découvert au passage : le MCP Apollo branché sur cette machine est
connecté au compte d'un tiers** (« Thomas Motti », tmotti@snapdesk.co, société
snapdesk.co). L'utiliser dépenserait les crédits de quelqu'un d'autre et
verserait nos prospects dans son CRM. À déconnecter ou reconnecter sur un
compte Citari avant tout usage. Vérifié par l'appel de profil, sans rien
consommer.

## 2026-08-06 (soir) — Audit global avant mise en ligne

Relecture complète du moteur, du toolkit et de l'admin, à tête reposée, avant
de brancher le domaine. Sept corrections, aucune ne touche à ce qui est figé.
La base était saine : zéro scan bloqué, zéro scan en erreur, et les 76 réponses
en panne sont l'épisode du crédit Anthropic, clos le jour même.

**Le bouton « Reprendre » ne pouvait pas reprendre.** Quand une exception
mettait un scan en statut `error`, le message public promettait « relancez-la :
les réponses déjà collectées sont conservées », et le bouton rechargeait la
page. Mais `avancerScan` ignorait tout scan qui n'était pas `running` : la
relance promise était impossible, et le prospect repartait sur un scan neuf,
payé une seconde fois. Désormais un scan en erreur sondé à nouveau repasse en
`running` et continue où il s'était arrêté, dans la limite de la fenêtre de
cache.

**Le verrou d'analyse ne se reprenait jamais.** Celui des questions se libère
au bout de deux minutes, précisément pour survivre à un processus tué net.
Celui de `finaliser` n'avait pas d'échappatoire : un worker arrêté pendant
l'analyse laissait le scan `running`/`analyse` pour toujours, chaque sondage
suivant se heurtait au verrou, et le cache resservait ce scan mort pendant
trois jours. Même remède, cinq minutes, avec `updated_at` comme battement de
cœur. Sur Cloudflare, où un worker peut être arrêté à tout moment, ce n'était
pas un cas d'école.

**Le rapport public livrait nos coûts.** Le jeton se partage, c'est fait pour,
et la charge utile embarquait les lignes `responses` entières : `cost_eur` et
`latency_ms` par réponse, plus `ip_hash`, `domain_key` et le message d'erreur
technique du scan. Rien de tout ça n'était affiché, tout était lisible dans
l'onglet réseau. Colonnes explicites désormais, et l'erreur d'une réponse est
réduite à un marqueur neutre, comme sur l'écran d'attente.

**Un échantillon incomplet passait en silence.** « 24 questions » est un
engagement écrit sur le site, et le J+90 rejoue ces questions-là pour toute la
relation client. Si le générateur n'en rendait que 18, ou du JSON malformé, le
scan tournait quand même, figé sur un échantillon réduit. Un tirage raté a
droit à une seconde chance, puis on échoue franchement, et la reprise fait le
reste.

**Une panne totale sur une question passait pour une absence.** Dans
`insights.ts`, une question dont toutes les réponses étaient des erreurs
comptait comme « manquée », et l'email affirmait au prospect une absence que
personne n'avait constatée. Même règle que le dénominateur du score : pas de
mesure, pas d'affirmation.

**Deux détails.** `ilike` interprète `%` et `_`, légaux dans un email :
échappés, sinon « a_b@x.fr » retrouvait le lead de « acb@x.fr » et la vraie
adresse n'était jamais enregistrée. Et un lead `prospect` (né d'un scan-lot)
passe maintenant à `contacte` quand on marque sa relance envoyée, comme un
lead `nouveau`.

**Le llms.txt du site contredisait le site.** La vitrine GEO de Citari
annonçait quatre moteurs en tête et six plus bas, attribuait au scan gratuit
les 24 questions × 6 moteurs du diagnostic offert en rendez-vous, publiait
l'ancien mix de questions, et disait « fondateur unique » alors que Jérémie
est associé. C'est le premier fichier qu'un moteur lit : il est maintenant
aligné sur les règles figées, mode par mode.

## 2026-08-04 — Un seul dépôt

Décision de Luigi : « JE VEUX TOUT ICI et nulle part ailleurs ». Le site était
un sous-module pointant sur `sprint-voice-insight`, héritage de la
synchronisation Lovable d'origine. Il est désormais dans ce dépôt.

Ce que cette configuration coûtait vraiment : deux `git push` par session, un
`main` figé 81 commits derrière la branche de travail côté site, donc une page
GitHub qui montrait une version périmée à qui l'ouvrait, et un clone
inutilisable sans `--recurse-submodules`.

Absorbé par `git subtree` et non par une copie, pour garder l'historique :
`git log` et `git blame` continuent de fonctionner sur `apps/citari`.
`sprint-voice-insight` devient une archive.

Vérifié après l'opération, parce qu'une manipulation d'historique se contrôle :
les quatre paquets compilent, 54 tests passent, le pilote retrouve le moteur, et
le moteur répond sur la vraie base. Les clés d'API ont été sorties du dossier
avant la suppression du sous-module, puis remises, et elles restent ignorées par
git à leur nouvel emplacement.

Une exception subsiste, temporaire : `citari-ai-audit`, où Jérémie reconstruit
le front. Lovable exige un dépôt à lui pour se synchroniser, il n'y a pas de
contournement. Ce projet ne contient aucun moteur et son code sera rapatrié dans
`apps/citari` une fois terminé. Le contrat qui rend ce portage mécanique est
écrit des deux côtés : `apps/citari/AGENTS.md` ici, et les instructions
permanentes du projet là-bas.

---

## 2026-08-03 (soir) — Toute la chaîne de livraison exécutée en réel

Les quatre commandes pilotées par un modèle n'avaient jamais tourné contre la
vraie API. Elles l'ont fait, sur un client de test rattaché au scan Dougs, et
elles ont révélé des défauts qu'aucune relecture n'aurait trouvés.

### Deux bugs qui auraient fait mentir un chiffre vendu

**Le contrôle J+45 comparait 4 moteurs à 6.** Le diagnostic complet en
interroge six, le contrôle seulement les quatre qui lisent le web, et on
opposait les deux notes globales. Mesuré sur Dougs : la référence vaut 24/100
sur six moteurs mais **28/100 sur les quatre du contrôle**. L'écart annoncé
passait donc d'un faux **+2** à un vrai **-2** — l'inverse de la réalité, sur
le chiffre qui décide si on réoriente l'effort à mi-parcours. La référence est
maintenant re-notée via `scoreSurMoteurs`, sur les moteurs réellement
interrogés, lus depuis les réponses du scan lui-même plutôt que recopiés dans
une constante qui aurait divergé un jour.

**Le re-scan J+90 acceptait un aperçu comme point de départ.** Le delta vendu
au client aurait été un artefact de méthode. La commande refuse désormais de
partir si la référence n'est pas un diagnostic complet.

Conséquence opérationnelle, à ne pas oublier : **lancer le diagnostic complet
au moment de la vente**. C'est lui le point de départ, jamais l'aperçu gratuit.

### draft-content ne pouvait pas aboutir

Trois causes empilées, chacune masquant la suivante. Le délai d'appel était
fixé à 75 s pour tous les appels, valeur calibrée pour un moteur pendant un
scan : une rédaction de 1500 mots n'y tient pas. Le prompt demandait ensuite
l'article deux fois, en markdown puis en HTML, doublant la sortie pour zéro
valeur et laissant les deux versions diverger ; le HTML est maintenant dérivé
du markdown par `marked`. Enfin la réponse était coupée par la limite de
tokens, avec un message d'erreur (« Unterminated string ») qui envoyait
chercher un défaut de prompt là où il fallait simplement plus de tokens.

### Autres corrections

- **Cibles de citation orphelines** : `citation_targets` ne pointait que vers
un sprint, or on en produit avant la vente. `verify-citations` refusait de
tourner et `sprint-report` annonçait 0 citation alors que le travail était
fait. Ajout de `client_id`.
- **Enums stricts sur la sortie du modèle** : douze briefs bien rédigés
partaient à la poubelle parce que Claude répondait « Client vs Concurrent » au
lieu de `comparatif`. `enumSouple` rattache au plus proche ; le prompt reste
strict.
- **Reprise sur incident trop mince** : un essai à 2 s ne survit pas à une
surcharge Anthropic. Trois reprises, doublement exponentiel, `retry-after`
respecté.
- **Gagnabilité saturée** : chaque question portait 7 à 18 marques
concurrentes et le malus plafonnait dès 10, donc les meilleures questions
ressortaient à 9, 5, 3 sur 100. L'encombrement se juge maintenant par rapport
à la médiane du scan.
- **`controle-45` et `rescan` attendaient un navigateur** : ils déroulent
maintenant la collecte eux-mêmes via le pilote extrait dans `lib/pilote.ts`.
- **L'admin tournait en mode démonstration**, mot de passe « demo » et données
simulées, depuis des semaines. Les secrets sont lus depuis le `.env` racine.

### Cache et quota, sur décision de Luigi

Cache **3 jours** au lieu de 30 : le GEO bouge, surtout quand une entreprise
vient de découvrir son score et commence à agir. Resservir un mois plus tard
une mesure périmée ferait mentir le chiffre. Plafond à **2 scans neufs** par
jour et par connexion, et il ne s'applique plus aux résultats déjà en cache,
qui ne coûtent aucun appel.

### L'email devient un champ du scan

Décision produit : on récolte les adresses pour faire de l'emailing. Le lead
est créé au lancement, consentement horodaté. Deux effets à connaître : le
verrou sur le verbatim ne sert plus à rien puisqu'un lead existe toujours (le
seul palier restant est le diagnostic complet derrière un rendez-vous), et la
priorité commerciale doit être posée par `finaliser()` et non à la saisie,
sinon tout le pipeline arrive en « chaud » faute de score.

### Chemins enfin exercés

Le rapport a été affiché pour la première fois. L'échec montrait au visiteur
le message technique brut (« api.anthropic.com → HTTP 529 ») : il lit
désormais un message neutre, le détail restant en base. Le plafond de dépense
n'avait jamais déclenché ; testé en le forçant à 0,02 €, il arrête bien la
collecte après un lot, et il est devenu réglable par variable
d'environnement.

**Coût de la journée : 5,35 €.** 12 scans, zéro erreur.

Reste non prouvable sans un vrai client : les trois `verify-*`, qui vérifient
qu'un travail est réellement publié en ligne.

---

## 2026-08-03 — Premier scan réel : la machine tient debout

Scan complet sur Citari, 6 moteurs, 24 questions : **144/144 réponses, zéro
erreur**, 1,06 € (contre 1,70 € estimé), 9 min 15. Toute la chaîne validée en
conditions réelles : génération des questions, interrogation, analyse,
scoring, part de voix, actions, question miroir, journal des coûts.

**739 sources collectées** (Perplexity 453, Gemini 125, Claude 90, ChatGPT 71).
C'était le risque principal — sans sources, le chantier citations est vide.
Levé.

**Score de Citari : 0/100, et c'est réel, pas un artefact.** Vérifié : 532
marques distinctes extraites (HubSpot, Comète, 1min30, Publicis Lyon…), aucune
ressemblant à « Citari », et citari.fr ne résout même pas en DNS. C'est
exactement la distinction que le bug `is_target` empêchait de faire avant.

### Base migrée sur un projet Supabase propre

`ebcuhuhslrrsjouchiga`, région Paris (eu-west-3), possédée par Luigi. 15
tables, 53 annuaires, RLS actif partout sans policy. Lovable garde sa propre
base et devient un bac à sable de design. Deux colonnes rendues nullables au
passage (`deliverables.sprint_id`, `citation_targets.sprint_id`) : en NOT NULL
comme chez Lovable, le toolkit aurait planté au premier audit précédant la
vente d'un sprint.

### Passerelle Lovable supprimée

Les six moteurs sont appelés directement. Motif principal : la passerelle
interdisait la recherche web, donc ChatGPT et Gemini répondaient de mémoire
alors que les vrais produits cherchent et citent leurs sources.

Trois pièges rencontrés, tous résolus :
- **Gemini** renvoyait 150 caractères et zéro source : `finishReason=MAX_TOKENS`.
  Les modèles récents consomment le budget en « réflexion » avant d'écrire.
  Porté à 4096 tokens → 1150 caractères et 125 sources sur le scan.
- **Grok** a perdu la recherche web : xAI a supprimé `live_search` (HTTP 410).
  Il répond de mémoire comme Le Chat. Les moteurs à recherche sont donc
  ChatGPT, Gemini, Claude, Perplexity — quatre au lieu de trois.
- **`gemini-2.5-flash`** est refusé aux nouveaux comptes. Modèles retenus :
  `gpt-5.6-terra`, `gemini-3.6-flash`, `gemini-3.1-flash-lite`.

### Statuts alignés sur la base

`nouveau`/`contacte`/`rdv_pris`/`client`/`perdu`, `a_contacter` pour les
citations, `en_cours`/`rescan_fait` pour les sprints. Ce sont des textes
libres : rien n'aurait planté, les filtres de l'admin n'auraient simplement
rien trouvé. Panne silencieuse, la pire espèce.

### Ce qui reste avant un prospect

L'interface du tunnel (verrous + Calendly) par Jérémie, le juridique, et le
Calendly lui-même. Le produit, lui, fonctionne.

## 2026-08-02 (soir) — La machine des 90 jours est complète

Tout ce qui était « à construire » dans LIVRAISON.md est codé, testé et poussé :
admin reconstruit sur le schéma réel (avec la checklist des 90 jours créée à
chaque conversion, semaines 1-4 + J+45/J+90), verify-citations,
verify-contents, controle-45 (mode « controle » côté moteur, protégé du J+90),
crawler-log persiste dans crawler_hits, sprint-report intègre les preuves.
36 tests, typecheck 3/3.

L'audit a aussi corrigé des colonnes obsolètes que le typecheck ne voyait pas
(client Supabase non typé) : scans.score→score_global, follow_ups.scheduled_for
→due_on (et statut dérivé de sent_at/cancelled), citation_targets par sprint_id
et non client_id, sprints.started_on/ends_on/rescan_due_on, deliverables.path→
local_path. Statuts canoniques des citations : a_faire/envoyee/relancee/
obtenue/refusee.

L'admin n'exécute JAMAIS de scan : launchRescan insère la ligne avec
previous_scan_id et la collecte se pilote depuis la page /scan/<id> du front.
Reste avant le premier client : clés API, première exécution réelle des 4
commandes LLM, et l'UI du tunnel par Jérémie.

## 2026-08-02 — Pivot du tunnel : aperçu pas cher, diagnostic en rendez-vous

Décision de Luigi, implémentée le jour même dans le moteur (commit a9ec33a du
dépôt front). Le tunnel devient : **aperçu gratuit (~0,15 €) → rendez-vous
Calendly en visio avec Luigi ou Jérémie → diagnostic complet offert pendant le
call (~1,70 €) → Sprint GEO 2 900 €**.

La vraie raison n'est pas le coût (un sprint vendu finance 4 400 scans) : un
service à 2 900 € se vend par un humain, et le rendez-vous a maintenant une
valeur propre — on vient y chercher son diagnostic complet, pas se faire
vendre quelque chose.

**Aperçu** : 20 questions × ChatGPT + Gemini, comptages en avant (« vos
concurrents cités 17 fois, vous 2 »), score conservé, un verbatim, un audit
flash (robots.txt + llms.txt), une question miroir ChatGPT. Tout le reste est
verrouillé à l'écran avec le CTA Calendly.

**Diagnostic complet** (uniquement sur RDV réservé) : 24 × 6 avec recherche
web sur Claude et Grok (les sources réelles, ce qui ranime le chantier
citations), question miroir sur les six moteurs, audit technique complet du
toolkit préparé avant le call, seuil de remboursement calculé en direct avec
le panier moyen du prospect. Plafond porté à 3 €.

**Cache 30 jours par domaine normalisé** : même site rescanné = même score.
Résout la variance (un prospect qui rescanne et voit un autre chiffre ne croit
plus la mesure), l'abus, et le coût des curieux. Le J+90 court-circuite le
cache.

**Les deux bugs bloquants sont corrigés au passage** : `is_target` compare des
formes normalisées (accents/ponctuation retirés), et le nom de marque est
validé à la saisie (≥ 2 alphanumériques).

**Limites connues, à ne pas oublier :**
- La recherche web n'est PAS active sur ChatGPT et Gemini : ils passent par la
  passerelle Lovable qui n'expose pas d'outil de recherche. Pour l'activer il
  faudrait des clés OpenAI et Google directes. Claude, Grok (et Perplexity
  nativement) couvrent le besoin de sources en attendant.
- La question miroir est étiquetée HORS méthodologie de score, et doit le
  rester : c'est un artefact de démonstration.
- **Rien n'a encore tourné en réel** — l'UI des verrous et de la landing à
  deux étages reste à faire côté Lovable, par Jérémie (prompt prêt dans le
  Notion, page « Prompt Lovable — nouveau tunnel »).
- Le direct en call : pré-calculer le pack, et garder « l'épreuve du direct »
  (rejouer UNE question devant le prospect) comme contre-argument au soupçon
  de précuit. Ne jamais faire tourner la machine entière en visio.

La métrique qui juge ce pivot : **le taux de réservation Calendly après
aperçu**. Sous ~5 % au bout d'un mois, enrichir l'étage gratuit.

---

## 2026-08-01 et 02 — Le front rapatrié, six moteurs, la base assainie

### Architecture arrêtée

Le projet Lovable n'est pas un simple front : son
`src/lib/orchestrateur.server.ts` interroge les moteurs, calcule le score et
écrit en base. C'est **le seul moteur de mesure**, et il doit le rester. Deux
implémentations du score rendraient l'écart J+90 arbitraire, donc invendable.

Le front est désormais connecté à GitHub
(`LuigiRevelli/sprint-voice-insight`) et cloné dans `apps/citari` comme dépôt
autonome, gitignoré et exclu du workspace pnpm. Synchronisation dans les deux
sens. **Une seule personne à la fois sur le front**, et toujours `pull` avant
de modifier.

`apps/web` a été supprimé : il refaisait le tunnel public déjà servi par
Lovable. `apps/admin` est conservé, l'admin Lovable ne faisant que lister et
modifier un statut.

### Six moteurs, décision irréversible

ChatGPT, Claude, Gemini, Perplexity, Grok, Le Chat (Mistral).

**Cette liste ne doit plus jamais bouger.** La promesse « mêmes questions,
mêmes moteurs à J+90 » interdit d'y toucher dès qu'un scan a été vendu : un
scan antérieur à un changement de liste ne serait plus comparable à son
re-scan. La décision a été prise avant le premier client, c'était la dernière
fenêtre possible.

Le Chat est le seul moteur français de l'échantillon, et c'est un argument
commercial que la concurrence n'a pas.

### Trois bugs trouvés en production

**Réparé — doublons de réponses.** `avancerScan` était appelé à chaque sondage
du navigateur et n'avait ni verrou ni contrainte d'unicité : deux sondages qui
se chevauchaient traitaient le même lot. Résultat mesuré sur le scan de test :
66 réponses en double sur 258, soit 32 % d'appels API payés pour rien. Le vrai
dégât était le score, `calculerScore` divisant par le nombre de réponses de
chaque moteur : ChatGPT et Gemini avaient 73 réponses au dénominateur contre 54
pour les autres, donc des scores mécaniquement sous-évalués.
Correction : doublons supprimés, index unique
`responses_scan_query_engine_uidx` sur `(scan_id, query_id, engine)`, et
`avancerScan` passé en upsert idempotent qui sort avant tout coût et toute
analyse en cas de conflit.

**Ouvert — sources Perplexity vides.** Aucune réponse en base ne porte de
source. La fonction `perplexity()` lit `json.citations`, or l'API ne renvoie
plus ses sources à cet emplacement. Conséquence commerciale : l'argument « voici
les sources sur lesquelles l'IA s'appuie pour recommander vos concurrents »,
cœur du chantier citations, est structurellement vide. `citation-targets` le
signale désormais au lieu de produire une liste silencieusement appauvrie.
**À réparer avant le premier client.**

**Ouvert — nom de marque non validé.** Le formulaire accepte un nom vide ou
contenant de la ponctuation. `is_target` compare avec
`b.name.includes(cible) || cible.includes(b.name)` : avec `nutri)smar`, aucune
marque extraite ne peut correspondre, et le scan rend un 0/100 qui n'est pas
une mesure mais un artefact. C'est arrivé sur les deux scans de test.
Correctif prévu : refuser les noms vides ou réduits à de la ponctuation, et
remplacer la comparaison par une normalisation (minuscules, accents et
ponctuation retirés, comparaison sur les mots).
**À réparer avant d'exposer le formulaire à des prospects.**

### Sécurité vérifiée

Le `.env` du front est versionné sur GitHub (dépôt privé) mais ne contient que
l'URL Supabase et la clé `sb_publishable_`, publique par conception puisqu'elle
part dans le bundle du navigateur. Aucune clé de service. RLS actif sur les
16 tables avec zéro policy, donc « tout refuser » pour cette clé : tout passe
par le service role côté serveur. Si une policy est ajoutée un jour,
revérifier que `leads` (emails, RGPD) reste inaccessible.

---

## Refonte de la page d'accueil — état et raisonnement

Trois passes successives, pilotées par des prompts envoyés à Lovable par Luigi.

**Ce qui a été diagnostiqué et corrigé :**

- La page répétait quatre fois la même idée (« vos concurrents sont cités, vous
  non ») dans quatre habillages différents. Blocs redondants supprimés.
- Une seule mise en page répétée dix fois sur 8 586 px : filet, petite
  capitale, titre serif à gauche, texte gris à droite. Le premier écran était
  le seul à y échapper, d'où le fait qu'il soit le seul apprécié. Quatre
  structures de bloc distinctes imposées.
- **La page décrivait un produit qu'elle ne montrait jamais.** Les sept
  composants du rapport (`ScoreGeant`, `PartDeVoix`, `Verbatims`,
  `TableauRequetes`, `Actions`…) existaient dans `components/rapport.tsx` et
  n'apparaissaient nulle part sur la landing. C'était la cause principale du
  « notre boîte n'est pas assez impressionnante ». Une section montre désormais
  le vrai rapport avec des données d'exemple étiquetées.
- La page ne vendait jamais le Sprint : ni prix, ni chantiers. Section ajoutée,
  avec les trois chantiers présentés comme les trois causes d'invisibilité
  (« elle ne peut pas vous lire », « elle n'a rien à citer de vous »,
  « personne d'autre ne parle de vous »).
- L'ordre demandait 2 900 € avant d'avoir expliqué comment on mesure. La
  section de mesure est remontée juste après la démonstration.

**Principes de rédaction retenus :**

- Le titre de la section de mesure est « Nous ne prononçons jamais votre nom »,
  parce que c'est contre-intuitif, que ça arrête la lecture et que ça explique
  toute la méthode.
- Le calcul du coût de l'absence ne doit **jamais** annoncer une perte
  chiffrée : multiplier panier moyen par nombre de prospects suppose que 100 %
  seraient devenus clients, ce qu'un dirigeant repère immédiatement. Il doit se
  terminer sur un **seuil** : « à votre panier moyen, un seul client récupéré
  rembourse le sprint. » C'est une division, donc incontestable.
- **Aucun tiret cadratin (« — ») dans les textes affichés.** C'est une
  signature d'écriture générée par IA et cela décrédibilise une agence qui vend
  de la maîtrise éditoriale. Réécrire les phrases, ne pas se contenter de
  supprimer le caractère.
- Interdits permanents : faux client, témoignage, logo, résultat présenté comme
  un cas vécu, compteur animé, fausse urgence.

---

## Répartition du capital avec un associé

Cadre discuté, à valider par un avocat. Rien n'est signé.

**Le pourcentage compte moins que le vesting.** Sans vesting, un associé qui
part au bout de quatre mois garde sa part à vie et bloque la société. Exiger
dans tous les cas : acquisition sur 4 ans, cliff de 1 an. En France cela se
met en place par une **promesse de cession croisée avec clauses good leaver /
bad leaver** dans le pacte d'associés, pas par du reverse vesting à
l'américaine.

**Recommandation retenue : commencer par une commission, pas par du capital.**
Le sprint se vend 2 900 €, une commission de 25 % fait 725 € par vente. Un
seuil de conversion écrit dès le départ (par exemple six sprints vendus en six
mois ouvrent droit à 25 % du capital, vesting courant depuis l'arrivée) protège
les deux parties : Luigi ne cède pas un tiers d'une société construite seul à
quelqu'un dont la capacité à vendre du GEO est inconnue, et l'associé gagne de
l'argent immédiatement.

Fourchettes si capital direct : 25 à 35 % pour un temps plein sans salaire qui
prend toute l'acquisition, 10 à 15 % pour un temps partiel.

**Ne pas partir sur 50/50** « parce que c'est plus simple » : cette répartition
bloque toute décision en cas de désaccord et ne reflète pas ce que chacun
apporte aujourd'hui.

---

## Position concurrentielle

Analyse complète dans [docs/STRATEGIE.md](docs/STRATEGIE.md). En résumé :

Aucun de nos arguments actuels n'est une barrière. La méthode, la formule
publiée, les six moteurs et le scan gratuit se copient en une semaine. Le vrai
désavantage n'est pas technique : c'est la **distribution**. Une agence SEO qui
a déjà quarante clients vendra du GEO sans avoir à convaincre personne.

Le différenciateur retenu est le **baromètre sectoriel** : publier le classement
de visibilité IA d'un secteur entier (200 entreprises pour 106 € d'API), ce qui
transforme l'acquisition en produit, nous rend citables par les IA, et
constitue le seul actif qui se compose. Premier essai prévu sur les cabinets
d'expertise comptable de la région lyonnaise, une cinquantaine d'entreprises
pour environ 27 €.

Second étage, à n'activer qu'après trois sprints mesurés : le remboursement si
le score n'a pas bougé à J+90. Personne d'autre ne peut l'offrir sans questions
gelées permettant d'arbitrer sans litige.

## Ordre de travail recommandé

1. **Structure juridique et capital.** Rien ne peut être facturé avant. Les
   mentions légales du site sont incomplètes, ce qui est une obligation non
   satisfaite (article 6 III LCEN).
2. **Réparer les deux bugs ouverts** (sources Perplexity, validation du nom) et
   faire tourner **un scan complet avec les vraies clés**. Tout a été développé
   en mode simulé ; rien n'a jamais tourné en réel.
3. **`apps/admin`**, qui parle encore l'ancien vocabulaire de schéma et ne
   fonctionnera pas contre la vraie base. C'est le CRM : leads, clients,
   sprints, relances, livrables.
4. **La machine de prospection par le scan.** Une commande de scan par lot, un
   classement du pire au meilleur score, raccordée aux commandes `relance` et
   `proposition` déjà écrites. Scanner un prospect avant de l'appeler coûte
   cinquante centimes et transforme un démarchage en diagnostic offert.
5. **Le GEO de Citari lui-même.** Si l'agence n'est pas citée quand on demande
   à une IA quelle agence GEO choisir en France, aucun argument ne tient. C'est
   la seule preuve sociale fabricable honnêtement sans client.

---

## Pièges rencontrés, à ne pas redécouvrir

- **Il existe DEUX back-offices**, découvert le 06/08/2026 en cherchant
  simplement à quoi servait `ADMIN_PASSWORD`. `apps/admin` (Next, port 3001,
  844 lignes) est celui qu'on utilise ; la route `/admin` du site
  (`apps/citari/src/routes/admin.tsx`, 404 lignes) en est un second, plus
  pauvre, qui écrit dans les mêmes tables. Leurs listes de statuts divergent
  (`prospect`/`rdv_pris`/`client` d'un côté, `call_planifié`/`proposition`/
  `gagné` de l'autre) et `leads.status` est un `text` sans contrainte : la base
  accepte les deux. Les trois leads réels sont en `prospect`, que la route du
  site ne sait pas afficher. C'est le problème des deux moteurs de scan, à
  l'identique : deux implémentations d'une même chose finissent toujours par
  diverger, et ici c'est le suivi commercial qui devient faux.
  S'y ajoute un risque de sécurité, celui qui presse : la route du site lit
  `apps/citari/.env.local`, où traîne le texte littéral
  `choisissez-un-mot-de-passe-solide`. Ce n'est pas un hasard, c'est la commande
  que `SETUP.md` donnait, et elle visait le mauvais fichier : `apps/admin` lit
  le `.env` de la racine, chargé explicitement par son `next.config.ts`. Une
  fois le site en ligne, `/admin` s'ouvrirait donc avec un mot de passe publié
  en clair dans ce dépôt, sur des emails de prospects. À supprimer avant la mise
  en ligne.
- **`ADMIN_PASSWORD` n'a jamais manqué.** Il était annoncé absent dans
  `CLAUDE.md`, `README.md`, `SETUP.md` et Notion, en tête des bloquants, alors
  qu'il était renseigné dans le `.env` de la racine depuis le début. Le
  back-office était utilisable pendant tout ce temps. La leçon n'est pas sur le
  mot de passe : une consigne d'installation qui vise le mauvais fichier crée
  une panne imaginaire, on la recopie de document en document, et personne ne
  vérifie parce que quatre documents ne peuvent pas tous se tromper. Vérifier
  avant d'écrire qu'une chose manque.
- **Un prompt de construction périmé traînait en `apps/citari/README.md`**,
  sans le bandeau d'avertissement qui protège `LOVABLE.md` et `SPEC.md`. À
  l'endroit exact où l'on cherche « c'est quoi cette app », il contredisait
  trois règles figées : « GEO Sprint » (l'ancien nom), quatre moteurs au lieu
  de six, et un mix de questions en 40/25/20/15 % au lieu de 24 questions en
  10/6/5/3. Le danger n'est pas le fichier, c'est qu'un document sans date ni
  statut se lit comme une consigne : les valeurs y étaient assez plausibles
  pour être recopiées. Remplacé le 06/08/2026 par un vrai README du dossier ;
  le brief d'origine reste dans `LOVABLE.md`, qui, lui, s'annonce comme
  historique. Règle : tout document d'intention porte son bandeau, sinon il
  devient une source d'erreur.
- **La documentation dérive entre les trois surfaces** (dépôt, GitHub, Notion),
  et toujours par les chiffres. Trouvé le 06/08/2026 : « 88 tests » alors que
  90 passent, et un « cache 30 jours » dans la page Notion « L'offre » quand la
  page « Le Scan » du même espace dit 3 jours et explique pourquoi pas 30. Une
  contradiction interne à Notion est pire qu'une valeur périmée, on ne sait
  plus laquelle croire. Les chiffres à surveiller sont ceux qui se répètent :
  nombre de tests, coût du scan, durée du cache, nombre de moteurs.
- Lovable pousse sur une branche `citari`, pas sur `main`. Les deux divergent.
- Le front tourne en local sur le port **8080**, imposé par la config Lovable.
- `bun` n'est pas installé sur cette machine : dépendances du front installées
  avec `npm`, et `package-lock.json` exclu localement via
  `.git/info/exclude` pour ne pas polluer Lovable qui reste sur `bun.lock`.
- `src/routeTree.gen.ts` est régénéré à chaque `npm run dev` : mis en
  `skip-worktree` pour ne pas polluer chaque diff.
- La passerelle IA de Lovable ne sert que les modèles OpenAI et Google. Claude,
  Perplexity, Grok et Le Chat passent par des appels directs.
- La table des prix `packages/core/src/cost.ts` est typée `Record<EngineId, …>`
  volontairement : ajouter un moteur sans son tarif ne compile pas.
- **Un moteur en panne faisait baisser la note du client.** Le score divise
  les citations par le nombre de réponses, et les réponses en ERREUR étaient
  comptées au dénominateur. La clé Anthropic étant à court de crédit, les 24
  réponses de Claude d'un scan complet étaient vides et pesaient quand même :
  Dougs affiché 21 au lieu d'environ 26, et les deux contrôles 26 au lieu
  d'environ 35, soit neuf points. Le vrai danger n'est pas le chiffre, c'est
  le J+90 : si un moteur tombe entre la mesure d'avant et celle d'après, le
  score bouge tout seul et la progression qu'on annonce au client devient un
  artefact. Les réponses non obtenues sont désormais exclues du calcul, et le
  comptage affiché au prospect ne les annonce plus non plus.
- **« Invisible » voulait dire deux choses.** La règle basculait en
  « invisible » sous 5 % de part de voix, si bien que Dougs, cité 25 fois dans
  un secteur bondé, y tombait. Aucun email ne mentait, mais le message écrit
  pour une marque absente partait aux prospects les plus mûrs, à la place de
  celui qui porte le meilleur argument. « Invisible » signifie désormais
  jamais cité, rien d'autre ; la part de voix informe le rapport sans décider
  du message.
- **Les six modèles interrogés sont figés** le 06/08/2026, et un test le fait
  désormais respecter. Le modèle fait partie de la mesure : en changer après
  un premier scan client ferait varier la note sans que rien n'ait bougé chez
  lui. Deux dérives réelles ont motivé la règle.
  Le code demandait `grok-4` et **xAI servait déjà `grok-4.3`** : la version
  mesurée avait changé sans que personne ne touche au code. `Le Chat` pointait
  sur `mistral-large-latest`, un alias que l'éditeur peut remplacer du jour au
  lendemain. Et `.env.example` annonçait `gpt-4o` et `gemini-2.0-flash` quand
  le code utilisait `gpt-5.6-terra` et `gemini-3.6-flash`.
  Retenus : ChatGPT `gpt-5.6-terra`, Claude `claude-sonnet-5`, Gemini
  `gemini-3.6-flash`, Grok `grok-4.5`, Le Chat `mistral-large-2512`, analyse
  `gemini-3.1-flash-lite`. Tous vérifiés en appel réel.
  Perplexity `sonar` est le seul non figeable, l'éditeur ne publiant aucune
  version datée : risque subi et assumé.
  `tests/modeles.test.ts` refuse tout alias en `-latest`, tout nom de famille
  sans numéro de version, et toute divergence entre le code et
  `.env.example`. Vérifié : le test échoue bien quand on réintroduit l'alias.
- **Chaque scan coûtait le double, et personne ne pouvait le voir.**
  Mesuré : 80 appels de moteur facturés pour 40 réponses conservées. Deux
  causes empilées. D'abord `scan.$id.tsx` gardait le drapeau « boucle active »
  dans un `useRef` PARTAGÉ entre les exécutions de l'effet : le nettoyage le
  passait à false, l'exécution suivante le remettait à true, et la requête
  encore en vol de l'ancienne boucle se croyait vivante et replanifiait un
  minuteur que plus rien ne pouvait annuler. Ensuite `avancerScan` générait
  l'échantillon ET interrogeait les moteurs dans le même appel, soit plus de
  vingt secondes : le navigateur coupait et relançait pendant que le serveur
  continuait. La dépense réelle n'apparaissait nulle part parce que
  `cost_log` n'était écrit que pour les réponses conservées, jamais pour les
  doublons — alors que l'éditeur, lui, facture l'appel. Corrigé aux trois
  endroits ; vérifié de bout en bout : 80 → 60 → 40 appels pour 40 réponses,
  0,14 € pour un aperçu.
- **La part de voix était tronquée aux 10 premières marques, et `insights.ts`
  y lisait les citations du client.** Un client classé onzième était donc
  compté à zéro, et l'email le déclarait « invisible » avec un objet du type
  « absent sur les 20 questions testées ». Faux, et vérifiable en trente
  secondes par le prospect. Ce n'était pas théorique : sur les données
  réelles, Compta Clementine (1 citation) et Cerfrance (3) étaient dans ce
  cas. `partDeVoix` garde désormais toujours la ligne du client, et
  `insights.ts` compte sur les mentions comme il le faisait déjà pour les
  concurrents.
- **`memeMarque` ne cherche plus une sous-chaîne mais des mots entiers.**
  Elle décide de `is_target`, donc du score, donc du chiffre facturé. Elle
  faisait une simple recherche de sous-chaîne : un client nommé « Ora »
  captait les mentions d'« Orange », « Sage » celles de « Message ». Le score
  montait pour de mauvaises raisons, ce qui est le pire sens de l'erreur, on
  aurait annoncé une visibilité qui se serait évaporée au contrôle J+90.
  Deux souplesses bornées remplacent l'inclusion libre : un nom entier
  contenu dans l'autre aux frontières de mots (« BDO » dans « BDO France »
  reste reconnu, pas dans « EYbens »), et les formes compactes quand elles
  sont à plus de 80 % identiques, ce qui préserve le cas d'origine
  « nutri)smar » → « NutriSmart » sans laisser passer « ora » → « orange ».
  Mesuré avant de pousser : sur **4 601 mentions et 11 scans terminés, zéro
  changement de `is_target`**. La correction ferme un risque futur sans
  toucher à une mesure existante, donc rien à recalculer et aucune
  comparaison J+90 cassée.
- **Le code mort de `packages/core` a été retiré** le 06/08/2026, dans la
  foulée du moteur mort : `providers/` (7 fichiers), `scoring/`, `report/`,
  `mock/`, `util/`. De 22 fichiers source à 8, environ 1 100 lignes en moins.
  Le paquet est enfin ce qu'il prétend être, quatre outils partagés.
  Le vrai gain n'est pas la place gagnée. Les 15 tests de ce paquet portaient
  sur `computeScore` et `detectMentions`, les ANCÊTRES morts de la mesure,
  pendant que `calculerScore` et `memeMarque`, qui décident réellement du
  chiffre facturé au client, n'étaient testés nulle part. Une suite verte
  protégeait donc exactement ce qui ne tournait plus.
  Corrigé : l'alias `@/` est résolu dans `vitest.config.ts` et dans les
  `paths` du `tsconfig.json` du toolkit, si bien que les tests importent
  désormais le VRAI code du site au lieu d'en recopier une version. Une copie
  ne teste qu'elle-même et diverge en silence. 15 nouveaux tests couvrent la
  formule du score, la détection de marque, la clé de cache et la priorité
  commerciale.
  Effet de bord heureux : `tsc` voit enfin les fichiers du site importés par
  les tests, et y a immédiatement trouvé un trou de typage dans
  `orchestrateur.server.ts`. Le site n'a pas de script de typecheck à lui, il
  n'avait donc jamais été vérifié.
- **`packages/core/src/scan/runScan.ts` était un SECOND moteur de scan**, resté
  sur le schéma d'avant Lovable (`brand`, `url`, `lang`, `queries.position`,
  `cost_log.cost_cents`). Il n'aurait jamais tourné contre la vraie base, mais
  il était exporté et lançable par `pnpm --filter @geo/core scan:cli`. Ses
  tests passaient parce qu'ils tournaient sur une base simulée : 2 tests verts
  qui ne prouvaient rien. Supprimé avec son CLI et ses tests.
- **`supabase/schema.sql` omettait les triggers.** Trois `touch_updated_at`
  (scans, leads, clients) entretiennent `updated_at` à chaque UPDATE. Le
  verrou de génération des questions s'en sert comme battement de cœur : sans
  eux dans l'instantané, une base reconstruite depuis le fichier aurait un
  verrou qui ne se libère jamais. Ajoutés.
- **Deux clients Supabase coexistaient**, et un seul est le bon.
  `client.server.ts` lit `SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY` depuis
  `.env.local` : c'est celui du moteur, il pointe sur `ebcuhuhslrrsjouchiga`.
  L'autre, `client.ts` généré par Lovable, lisait `VITE_SUPABASE_URL` depuis un
  `apps/citari/.env` versionné qui désignait **une base étrangère**
  (`absff…`, le projet Supabase de Lovable). Aucun secret n'a fuité, une clé
  `sb_publishable_` étant publique par construction, mais un lecteur pressé
  pouvait travailler sur la mauvaise base. Supprimé le 06/08/2026, avec
  `auth-attacher.ts` et `auth-middleware.ts`.
- Ne pas se fier à `git grep "integrations/supabase/client"` pour juger ce
  fichier mort : le motif capture aussi `client.server`, et `auth-attacher.ts`
  l'importait en relatif (`./client`). Il était bien vivant, branché en
  `functionMiddleware` global dans `start.ts`. La suppression compile mais
  casse le build à l'étape de résolution : **toujours lancer
  `pnpm run build` sur `apps/citari` après avoir retiré un fichier**, le
  `typecheck` du monorepo ne couvre pas cette application.
- L'authentification Supabase ne servait à rien : personne ne se connecte à ce
  projet étranger, donc `getSession()` renvoyait toujours `null` et le
  middleware ajoutait un en-tête vide à chaque appel serveur. Le vrai contrôle
  d'accès de l'admin est `ADMIN_PASSWORD` dans `admin.functions.ts`.
- `ADMIN_PASSWORD` n'est pas renseigné dans `.env.local` : le back-office
  affiche « ADMIN_PASSWORD n'est pas configuré » et reste inutilisable tant que
  la variable est absente. C'est pourtant là que se relisent les emails avant
  envoi.
