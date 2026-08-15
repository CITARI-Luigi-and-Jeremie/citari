# Citari — plateforme d'agence GEO

## Reprendre ce projet à froid

Lisez ce fichier, puis `JOURNAL.md` qui garde les décisions ET leurs raisons,
y compris les pièges déjà payés. Rien d'autre n'est nécessaire pour commencer.

**Où en est le projet, au 06/08/2026.** Le back est terminé et éprouvé en
conditions réelles : les trois modes de scan et les 27 commandes du toolkit
ont tourné contre la vraie base. 180 tests passent.

**Ce qui empêche de vendre n'est pas du code.**

1. **RÉGLÉ le 14/08/2026 : il n'y a plus qu'un back-office.** La route
   `/admin` du site (et `admin.functions.ts`) a été supprimée avant la mise en
   ligne : elle servait les emails de `leads` derrière un second
   `ADMIN_PASSWORD` jamais configuré, avec une liste de statuts divergente.
   Le seul back-office est `apps/admin` (Next, port 3001), dont le mot de
   passe vit dans le `.env` de la racine. Note historique : ce fichier a
   longtemps affirmé que le second mot de passe avait fuité dans le dépôt ;
   c'était faux (vérifié le 09/08 dans l'historique git), le problème était
   la duplication, pas une fuite.
2. Resend et mise en ligne : voir `SETUP.md` et `docs/DEPLOIEMENT.md`. Le
   domaine est acheté, chez Hostinger. Le site part sur **Cloudflare Workers**,
   puis basculera sur le **VPS Hostinger** quand tout le reste sera fini.

**Le crédit Anthropic est rechargé** (vérifié le 06/08/2026 par un appel réel :
`claude-sonnet-5` répond). Le diagnostic complet retrouve ses six moteurs. Il
avait été à court, et la panne avait appris une règle qui, elle, reste : une
réponse en erreur ne compte pas au dénominateur du score.

**Les crédits moteurs meurent en cascade les jours de test.** Le 14/08 :
Google à sec l'après-midi (rechargé par Luigi à 18 h), puis OPENAI à sec dès
18 h 10 (`429 — You have no credits remaining`, les 20 réponses ChatGPT d'un
scan en erreur). La règle du dénominateur protège le score, mais un aperçu
sans ChatGPT tourne de fait sur UN moteur. Avant tout test sérieux et avant
le lancement : vérifier les soldes OpenAI ET Google, et provisionner d'avance
pour le baromètre à 100 scans.

**Les deux dettes historiques sont soldées** (10/08/2026). `pnpm toolkit
effacer` répond au droit à l'effacement (simulation par défaut, `--vraiment`
pour exécuter, les scans ne portent aucune donnée personnelle et restent). Et
`pnpm toolkit envoyer` revérifie AVANT chaque relance « bloqué » : le
robots.txt du prospect est relu en direct, un brouillon devenu faux est
réécrit, jamais expédié. La désinscription existe aussi (`desinscrire`,
colonne `leads.unsubscribed_at`) : la ligne du lead reste, elle est la preuve
du consentement ET de la désinscription.

**L'envoi est câblé et la clé est en place** (13/08/2026, testée par un envoi
réel via le code de production). `envoyer` est une simulation par défaut ;
`--vraiment` expédie par l'API Resend en texte brut. Il refuse seul les
désinscrits, convertis, mails 0 périmés (> 3 j), relances trop tardives
(> 10 j), gabarits troués et liens localhost. La boîte `contact@citari.fr`
(Google Workspace) reçoit réponses et STOP. Reste UN geste manuel : poser les
3 enregistrements DNS de Resend chez Hostinger (valeurs dans `SETUP.md`) et
attendre « Verified » — sans quoi seul le mode test fonctionne, et rien ne
peut partir depuis `contact@citari.fr`.

**Connexions attendues.** Deux MCP : Supabase (projet `ebcuhuhslrrsjouchiga`,
région Paris) et Notion (espace CITARI, où vit toute la documentation
commerciale). Les clés des six moteurs sont dans `apps/citari/.env.local`,
jamais versionnées.

**Le front de Jérémie est porté en entier** (08/08/2026, refonte v3 reportée
le 14/08/2026). Landing, page `/methode`, écran de scan et rapport viennent de
son projet Lovable `citari-ai-audit` ; ses composants vivent dans
`src/components/jeremie/`. Il n'y a plus qu'une seule charte sur le site.

La v3 a remplacé le bandeau d'en-tête par une navigation flottante (marque,
contact, barre latérale de sections qui détecte la luminosité sous elle),
ajouté le pont problème/solution en `StrokeText` (texte SVG rempli par
balayage : les « animations 3D » de Jérémie) et passé procédure, FAQ, CTA
final et pied de page en sombre. Il a supprimé sa `/methode` ; la nôtre est
CONSERVÉE, c'est l'engagement de vérifiabilité — et elle a **quatre points
d'entrée** depuis le 15/08/2026 (barre latérale, section « Vérifiabilité » de
la landing, FAQ sur le calcul du score, ligne sous le score du rapport). Elle
n'était liée que du pied de page et personne ne la trouvait : la section des
trois étapes s'appelait « Méthode » et occupait le mot. Elle s'appelle
« Parcours » (`#parcours`), un nom pour une chose. Piège appris : ses composants
Lovable rendent côté client, chez nous ils s'hydratent après un rendu
serveur — **aucun aléa dans le rendu** (`useId`, jamais `Math.random()` pour
un id), sinon React marque l'arbre entier en erreur d'hydratation.

Ce que le premier passage avait manqué, et qui a été rattrapé :

- la page `/methode` n'existait pas du tout ;
- le héros montrait ses vieilles cartes flottantes, plus le spécimen de rapport
  à deux colonnes qu'il utilise réellement (`HeroSpecimen`) ;
- l'écran d'attente gardait l'ancienne maquette, au lieu de sa carte perforée ;
- `bordeaux` et `font-display` avaient disparu de la feuille de style sans que
  les pages qui s'en servaient soient reprises : le rapport, l'admin et les
  pages de contenu s'affichaient sans accent et sans police de titrage. Les
  jetons pointent désormais sur `signal` et sur Archivo / Newsreader ;
- `components/logo.tsx` peignait le signe par masque alpha depuis une URL de
  CDN Lovable : deux fois mort, il ne s'affichait plus nulle part ;
- les pages de contenu avaient **deux** en-têtes, le leur et celui de la racine.

**`/rapport/$jeton` sert deux artefacts, et c'est le mode du scan qui tranche.**
En `apercu`, c'est la séquence de conversion de Jérémie (v3, 14/08/2026) :
jusqu'à neuf pop-ups, une carte à la fois — score, « qui prend votre place »,
la phrase exacte, part de voix, ce qu'une IA dit de vous, accès des robots,
**les 20 questions**, diagnostic, réservation. L'assemblage des données vit
dans `lib/rapport-sequence.ts`, les cartes dans `components/jeremie/rapport/`.
Une étape sans donnée (pas d'adversaire, pas de verbatim) sort de la
séquence : jamais de carte vide, jamais de texte inventé. Le bouton principal
dit « Suivant : {titre de l'étape qui suit RÉELLEMENT} » — un libellé
inventif se lisait comme une action optionnelle (le père de Luigi n'a pas su
avancer, 15/08/2026), et un libellé en dur promettait une carte absente dès
qu'une donnée manquait. **Chaque carte tient en un écran** : les longs
contenus sont des extraits, coupe toujours annoncée, texte intégral à
l'étape « questions ».

**L'échantillon est une étape, plus une annexe** (14/08/2026). Les 20
questions et leurs réponses vivaient sous la séquence, derrière deux liens et
un écran plein : personne ne soupçonnait qu'il y avait quelque chose en
dessous. C'est pourtant la pièce qui prouve toute la mesure. La page d'aperçu
ne se scrolle donc plus du tout. Ne pas rétablir l'annexe : la même pièce à
deux endroits est le piège déjà payé avec les deux comparatifs. En `complet` ou
`controle`, c'est le document de mesure. Présenter comme « verrouillé » un
moteur qu'on vient d'interroger et de facturer serait un mensonge : ne jamais
rendre cet aiguillage configurable.

**Le parcours a trois écrans, pas quatre.** Landing → `/scan/$id` (l'attente,
carte perforée) → `/rapport/$jeton`. L'aguiche qui vivait sur l'écran de scan a
été retirée le 09/08/2026 : elle servait de péage à l'email, or l'adresse est
demandée à la dernière étape du formulaire, AVANT le lancement. Elle rejouait
donc le score, la part de voix et le verbatim que le rapport rouvrait aussitôt,
avec des dénominateurs différents. La mesure finie, on redirige (en `replace`,
sinon le bouton « retour » enferme le prospect) vers le rapport, seule adresse
partageable. `teaserScan`, `chargerTeaser` et `debloquerRapport` ont été
supprimés avec elle : une fonction serveur exportée que plus personne
n'appelle reste appelable depuis n'importe quel navigateur.

**Une seule unité sur la page de rapport : la réponse.** « In Extenso, cité dans
30 réponses sur 40 » et « votre marque apparaît dans 13 » se comparent d'un coup
d'œil. Compter en citations à côté de comptages en réponses donnait deux
nombres justes qui se contredisaient à l'écran. La part de voix est donc
recalculée depuis `mentions` (avec `brand_aliases` pour regrouper les
variantes), pas lue dans `share_of_voice` qui compte en citations et tronque.

**« Qui prend votre place » privilégie un rival, pas le plus cité.** Un géant en
tête de comptage est exact et décourageant : annoncer KPMG à un cabinet de
quinze personnes écrase au lieu d'indiquer une action. `concurrent_classes` vide
signifie « tout est rival », et les institutions sont exclues du classement.

**Le DESIGN de son écran de scan est porté, sa SIMULATION reste bannie**
(14/08/2026). Le split-screen « Analyse Citari / Flux de données » de
`CitariScanScreen` est devenu notre `EcranAttente`, branché sur `etatScan` :
étapes pilotées par la phase réelle, compteurs par moteur comptés sur
`responses`, latences mesurées dans le ticker, temps ÉCOULÉ (jamais un
« temps restant » deviné), reflet qui balaie quand une étape n'a pas de
mesure interne. Ce qui reste interdit : l'horloge simulée, les verdicts au
modulo, le bouton « SKIP », et sa route démo `/scan?domaine=`.

**Sa couche données a été intégralement jetée, et ne doit jamais revenir.** Son
projet visait une AUTRE base Supabase (`vbxgwqutyzmnasjyladg`) avec un autre
schéma : `scans_public`, `brand`, `queries.position`, `responses_meta`,
`scan_leads`. Recopier ses fonctions serveur ne planterait pas — le site
afficherait simplement des scans absents de notre base et écrirait des leads
ailleurs. Tout ce qui vient de lui doit passer par `scan.functions.ts`. Le
contrat d'origine est dans `apps/citari/AGENTS.md` ; il décrivait un projet sans
moteur, ce qui s'est révélé faux.

**Citari** est une agence GEO pour PME et ETI francophones : on fait apparaître
les marques clientes dans les réponses de ChatGPT, Claude, Gemini, Perplexity,
Grok et Le Chat.

> Le produit vendu s'appelle **Sprint GEO** (2 900 € HT), avec une option
> **Sprint Domination** (4 900 € HT) : dix contenus au lieu de cinq, seize
> cibles de citation, deux langues. Le site l'affiche et `pnpm toolkit
> proposition --offer domination` la génère. Ne pas confondre avec le nom de la
> société. « GEO Sprint » était l'ancien nom, il ne doit plus apparaître nulle
> part.

## Architecture

| Dossier | Quoi | Outillage |
|---|---|---|
| `apps/citari` | Le site **et son moteur de scan** : landing, méthode, attente, rapport, lead | **npm**, TanStack Start, port 8080 |
| `apps/admin` | Back-office : leads, clients, sprints, relances, citations | pnpm, Next.js, port 3001 |
| `packages/toolkit` | L'usine : 27 commandes de livraison et d'acquisition | pnpm |
| `packages/core` | Socle partagé : accès Supabase, appel JSON au modèle, crawl | pnpm |

Tout vit dans `LuigiRevelli/citari`. `apps/citari` a été absorbé par
`git subtree` le 04/08/2026 : ce n'est **plus** un sous-module, `git log` et
`git blame` y fonctionnent normalement, et il n'y a qu'un seul `git push`.

**Le site est hors du workspace pnpm** (`!apps/citari`), parce qu'il a son
propre gestionnaire de paquets. Conséquence pratique à retenir :

```bash
npm --prefix apps/citari run dev     # ✅ le site
npm --prefix apps/citari run build   # ✅ sa vérification (pas de script typecheck)
pnpm --filter tanstack_start_ts dev  # ❌ « No projects matched »
```

`bun` n'est pas installé sur cette machine, malgré ce que suggère le
`package.json` du site : les dépendances y sont posées avec npm.

### Un seul moteur de scan

`apps/citari/src/lib/orchestrateur.server.ts` interroge les moteurs, calcule le
score et écrit en base. C'est **le seul**, et il ne doit jamais y en avoir un
second : l'intérêt du J+90 est l'écart avec le J0, et un écart entre deux
implémentations ne veut rien dire.

`packages/core` en a hébergé un jusqu'au 06/08/2026. Il parlait le schéma
d'avant Lovable et n'aurait jamais tourné contre la vraie base, mais restait
exporté et lançable, et ses tests passaient sur une base simulée. Supprimé.

Le code mort qui l'accompagnait (`providers/`, `scoring/`, `report/`, `mock/`,
`util/`) a été retiré le 06/08/2026 : 22 fichiers source ramenés à 8, et
`packages/core` est enfin ce qu'il prétend être, un socle de quatre outils.
Le toolkit n'en utilise que `getDb`, `unwrap`, `askClaudeJson` et
`fetchHomeText`.

### Il n'y a plus de mode démo

`GEO_MOCK=1` faisait renvoyer une **base simulée** par `getDb()`, la fonction
dont se sert le toolkit pour rédiger les relances. Une variable oubliée
suffisait donc à préparer des emails pleins de chiffres inventés, prêts à partir
à de vrais prospects. Le piège a mordu : l'admin a tourné des semaines dessus
avec le mot de passe « demo ». Retiré le 06/08/2026, ne pas le réintroduire.

### Sécurité

RLS est actif sur les 16 tables avec **zéro politique**, donc « tout refuser » :
chaque accès passe par la clé de service, côté serveur uniquement. Si une
politique est ajoutée un jour, revérifier que `leads` (emails, RGPD) reste
inaccessible.

Les résidus Lovable qui pointaient vers une base étrangère (`apps/citari/.env`
versionné, `client.ts`, `auth-attacher.ts`, `auth-middleware.ts`) ont été
supprimés le 06/08/2026.

## Ce qui est FIGÉ, et pourquoi

Trois choses ne doivent plus bouger, parce que la promesse vendue est une
comparaison : « voici votre score, voici celui de J+90 ».

1. **La formule du score** : présence 50 %, rang 20 %, recommandation explicite
   20 %, tonalité 10 %.
2. **La liste des six moteurs.** Un scan antérieur à un changement de liste
   n'est plus comparable à son re-scan.
3. **La version de chaque modèle interrogé.** Une version différente ne répond
   pas pareil. Le code demandait `grok-4` et xAI servait déjà `grok-4.3` : la
   règle graduée se déplaçait toute seule. `packages/toolkit/tests/modeles.test.ts`
   refuse désormais tout alias en `-latest`, tout nom sans numéro de version, et
   toute divergence avec `.env.example`.

Retenus : ChatGPT `gpt-5.6-terra`, Claude `claude-sonnet-5`, Gemini
`gemini-3.6-flash`, Grok `grok-4.5`, Le Chat `mistral-large-2512`, analyse
`gemini-3.1-flash-lite`. Perplexity `sonar` est le seul non figeable, l'éditeur
ne publiant aucune version datée.

## Le scan

| Mode | Questions × moteurs | Recherche web | Coût réel | Plafond |
|---|---|---|---|---|
| `apercu` | 20 × 2 (ChatGPT, Gemini) | non | ~0,14 € | 0,25 € |
| `complet` | 24 × 6 | oui | ~1,06 € | 3 € |
| `controle` | 24 × 4 | oui | ~0,84 € | 1,50 € |

**2 scans par jour et par IP**, résultat mis en cache **3 jours**. Le navigateur
pilote la mesure en sondant le serveur ; chaque réponse est écrite
individuellement, donc une requête coupée ne perd rien.

Deux règles apprises à la dure, toutes deux dans `JOURNAL.md` :

- Une réponse **en erreur** ne compte pas au dénominateur du score. Sinon un
  moteur en panne fait baisser la note du client, ce qui est arrivé : Dougs
  affiché 26 au lieu de 35 parce que Claude n'avait plus de crédit.
- La génération des questions et l'interrogation des moteurs ne se font **pas
  dans le même appel**. Ensemble, la requête dépassait vingt secondes, le
  navigateur la coupait et relançait pendant que le serveur continuait :
  chaque scan coûtait le double.

## Pièges du schéma, vérifiés sur la vraie base

- `responses.engine` et `mentions.engine` stockent les **libellés** (`ChatGPT`,
  `Claude`, `Gemini`, `Perplexity`, `Grok`, `Le Chat`), pas des identifiants.
- **`mentions` n'a pas de colonne `mentioned`** : une ligne *est* une mention.
  La marque suivie s'identifie par `is_target`, jamais par comparaison de noms.
- `share_of_voice` est un **tableau** `[{name,count,share,target}]`, pas un
  dictionnaire. Il est tronqué aux 10 premiers **plus la ligne du client**, qui
  y est garantie : sans elle, un client classé onzième était compté à zéro et
  l'email le déclarait « invisible ». Ne comptez jamais les citations dessus,
  comptez sur `mentions`.
- `directories.kind` et `authority_note`, pas `type` ni `notes`.
- `leads` n'a ni `brand`, ni `sector`, ni `score` : passer par le scan lié.
- `follow_ups` n'a pas de `status` : `sent_at` et `cancelled` le dérivent.
- Le rappel de re-scan J+90 porte sur `sprints.rescan_due_on`, pas sur `clients`.
- `scans` n'a ni `email` ni `cost_cents` : les coûts vivent dans `cost_log`.
- Trois triggers `touch_updated_at` (scans, leads, clients) entretiennent
  `updated_at` à chaque UPDATE. Le verrou de génération des questions s'en sert
  comme battement de cœur.

Le schéma fidèle est `supabase/schema.sql`. La traduction entre le vocabulaire
du toolkit et les colonnes réelles vit dans
`packages/toolkit/src/lib/context.ts` et `lib/insights.ts`, nulle part ailleurs.

## Commandes

```bash
pnpm install
pnpm -r test                        # 235 tests
pnpm -r typecheck                   # paquets + fichiers du site importés par les tests
npm --prefix apps/citari run typecheck   # TOUT le site (ajouté le 14/08/2026)
npm --prefix apps/citari run build
```

Les deux typecheck sont nécessaires : `pnpm -r typecheck` ne voit du site que
les fichiers que les tests importent. Un composant jamais importé pouvait
utiliser une constante non importée et ne planter qu'à l'exécution, dans le
navigateur du prospect (cas réel : `MONO` dans `CarteVerbatim`, 14/08/2026).

**Les tests importent le vrai code du site**, ils n'en recopient plus une
version. L'alias `@/` est résolu par `packages/toolkit/vitest.config.ts` pour
vitest, et par les `paths` de son `tsconfig.json` pour `tsc`. Effet de bord
heureux : `orchestrateur.server.ts` et `score.ts` sont désormais typés, ce qui
n'était jamais arrivé, le site n'ayant pas de script de typecheck à lui.

Les 27 commandes s'appellent par `pnpm toolkit <commande>`.

**Chantier 1, la lisibilité du site**
`audit-technique` crawle le site comme un robot d'IA · `generate-fixes` écrit
les correctifs prêts à poser · `verify-fixes` contrôle qu'ils sont en ligne ·
`crawler-log` compte les passages réels des robots dans les logs du client.

**Chantier 2, les contenus**
`prioriser` classe les questions perdues par gagnabilité · `content-brief`
prépare les plans · `draft-content` rédige · `verify-contents` contrôle ·
`indexnow` prévient Bing, donc ChatGPT, en quelques heures au lieu de semaines.

**Chantier 3, les citations**
`citation-targets` liste où il faut être · `verify-citations` vérifie que la
marque y figure vraiment.

**Mesure et suivi**
`controle-45` prend la température à mi-parcours, en interne · `rescan` rejoue
les mêmes questions à J+90 · `sprint-report` assemble les preuves.

**Emailing**
`relance` prépare les 4 emails d'un prospect (13 gabarits, la situation décide :
bloqué, invisible, marginal, ou solide qui n'en reçoit qu'un) · `envoyer`
expédie par Resend ce qui est dû, simulation par défaut, revérification du
robots.txt avant toute relance « bloqué » · `desinscrire` honore un STOP,
définitivement · `effacer` exécute le droit à l'effacement RGPD.

**Commercial**
`reponses` prépare les 8 réponses
aux objections · `proposition` génère la proposition · `concurrents` relit et
corrige le classement des concurrents · `sourcer` construit la liste
d'entreprises depuis l'annuaire officiel (API gouv, gratuite : NAF, zone,
effectif, dirigeants) · `enrichir` extrait des sites ce qu'ils publient
(emails, téléphones, responsable de publication, robots bloqués, pixels
publicitaires) · `verifier-base` note la fiabilité d'une base avant tout envoi
(MX des domaines, doublons, zone, cohérence) · `classer-leads` ordonne les
prospects du plus chaud au plus froid, avec la raison · `signaux-geo` lit sur
chaque site son matériau (rythme de publication, taille, avis balisés, FAQ) et
l'angle commercial que ça autorise · `scan-lot` scanne cette liste
entière pour le baromètre.

## Règles métier à ne pas casser

- « Le Chat » est l'étiquette affichée, `mistral` l'identifiant et
  `score_mistral` la colonne : on nomme partout l'assistant que le public
  utilise, mais la base garde le nom de l'éditeur, plus stable.
- **Le formulaire ne demande que le site, la marque et l'email** (deux
  étapes, 14/08/2026). Le métier et la ville sont DÉDUITS de la page
  d'accueil par `deduireMetier`, écrits dans `scans.sector` / `scans.city`
  pendant la phase « questions », et affichés au prospect sur l'écran de
  mesure (« Compris : … »). Une valeur déjà posée n'est jamais écrasée : les
  scans par lot du toolkit gardent la leur. Le secteur reste nécessaire en
  aval (question miroir, classement des concurrents, `brand_overrides` par
  secteur, vocabulaire du rapport) : on ne l'a pas supprimé, on a supprimé
  l'effort de le taper.
- Mix de questions, **adaptatif selon la portée** (14/08/2026). Avec ville :
  24 en complet (10 comparatives, 6 problème, 5 locales, 3 confiance), 20 en
  aperçu (8/5/4/3). Sans ville — clientèle nationale : **aucune question
  locale**, redistribuées sur comparatives et problème (24 = 14/7/3, 20 =
  11/6/3). La ville était imposée à tous : un quart de l'échantillon de
  Netflix partait en « meilleur service de streaming à Paris ? », ce qui ne
  mesure rien et fait baisser le score d'une marque sans clientèle de
  quartier. Le champ ville est donc facultatif ET porteur de sens : le
  remplir déclare une clientèle locale.
- Le nom de la marque n'est **jamais** prononcé dans une question de mesure :
  on mesurerait la mémoire du moteur, pas la découverte spontanée. La « question
  miroir » fait exception, elle est explicitement hors méthodologie.
- Un re-scan rejoue **strictement les mêmes questions**.
- Les concurrents sont classés relativement au client (`rival`, `geant`,
  `outil`, `institution`) : une PME ne se compare pas à Deloitte. Les
  corrections humaines (`brand_overrides`) écrasent toujours le modèle.
- Non-objectifs : comptes prospects, paiement en ligne, scraping des interfaces
  de chatbots, multi-tenant, dashboard de monitoring continu.

## Doctrine d'honnêteté (elle est le produit)

- Aucun faux résultat client, aucun témoignage, aucun logo : il n'y a pas encore
  de client.
- Toute réponse d'IA montrée en exemple est étiquetée comme telle, avec des noms
  de concurrents fictifs.
- On garantit les actions livrées, jamais un score.
- Aucun compteur simulé à l'écran : on n'affiche que des données réellement
  enregistrées.
- Les emails commerciaux sont des gabarits déterministes remplis avec les vrais
  chiffres du scan, jamais de génération libre sur un email de prospection.
- Pas de tiret cadratin dans les textes français publiés.

## Pièges connus

- Ne jamais lancer un build pendant que les serveurs de développement tournent :
  ils partagent `.next` et le cache se corrompt.
- Le projet est sur le Bureau, synchronisé iCloud : des doublons
  « fichier 2.ts » peuvent apparaître.
- `src/routeTree.gen.ts` est régénéré à chaque `npm run dev` et pollue les
  diffs.
- La table des prix `packages/core/src/cost.ts` est typée `Record<EngineId, …>` :
  ajouter un moteur sans son tarif ne compile pas. Volontaire, mais ce fichier
  fait partie du code mort ; les coûts réels sont estimés dans
  `moteurs.server.ts`.

## Direction artistique

`DESIGN.md` fait foi : porcelaine, graphite, bronze ; Cormorant Garamond,
Manrope, IBM Plex Mono. Charger le skill `artifact-design` avant toute décision
visuelle, et `dataviz` pour valider une palette.
