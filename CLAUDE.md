# Citari — plateforme d'agence GEO

## Reprendre ce projet à froid

Lisez ce fichier, puis `JOURNAL.md` qui garde les décisions ET leurs raisons,
y compris les pièges déjà payés. Rien d'autre n'est nécessaire pour commencer.

**Où en est le projet, au 06/08/2026.** Le back est terminé et éprouvé en
conditions réelles : les trois modes de scan et les 22 commandes du toolkit
ont tourné contre la vraie base. 135 tests passent.

**Ce qui empêche de vendre n'est pas du code.**

1. **Il y a deux back-offices**, et l'un doit disparaître avant la mise en
   ligne. `apps/admin` (Next, port 3001) est celui qu'on utilise, et il
   fonctionne : `ADMIN_PASSWORD` est renseigné dans le `.env` de la racine, le
   fichier que son `next.config.ts` charge. La route `/admin` du site en est un
   second, qui lit `apps/citari/.env.local` où traîne un mot de passe bidon
   publié en clair dans ce dépôt. Leurs listes de statuts divergent et
   `leads.status` n'a aucune contrainte. Détail dans `SETUP.md`.
2. Resend et mise en ligne : voir `SETUP.md` et `docs/DEPLOIEMENT.md`. Le
   domaine est acheté, chez Hostinger. Le site part sur **Cloudflare Workers**,
   puis basculera sur le **VPS Hostinger** quand tout le reste sera fini.

**Le crédit Anthropic est rechargé** (vérifié le 06/08/2026 par un appel réel :
`claude-sonnet-5` répond). Le diagnostic complet retrouve ses six moteurs. Il
avait été à court, et la panne avait appris une règle qui, elle, reste : une
réponse en erreur ne compte pas au dénominateur du score.

**Deux dettes ouvertes, assumées.** Aucune commande n'efface les données d'une
personne qui invoque son droit RGPD, alors qu'on collecte des emails avec
consentement horodaté. Et les relances J+2 à J+21 sont rédigées à l'avance : au
moment de les envoyer, il faut revérifier ce qui a changé depuis, par exemple un
`robots.txt` corrigé entre-temps.

**Connexions attendues.** Deux MCP : Supabase (projet `ebcuhuhslrrsjouchiga`,
région Paris) et Notion (espace CITARI, où vit toute la documentation
commerciale). Les clés des six moteurs sont dans `apps/citari/.env.local`,
jamais versionnées.

**Un front se construit ailleurs, en parallèle.** Jérémie, l'associé, refait
l'interface à partir de zéro dans un projet Lovable séparé, `citari-ai-audit`,
qui n'embarque aucun moteur et travaille sur des données de démonstration aux
formes exactes des fonctions serveur d'ici. Quand il aura fini, on recopie ses
`src/routes/*` et `src/components/*` et on remplace ses imports de démonstration
par les vrais appels : même pile des deux côtés, le portage est mécanique. Le
contrat détaillé est dans `apps/citari/AGENTS.md`. Conséquence à retenir : ce
dépôt reste la seule source de vérité de la mesure, et le moteur ne dépend
jamais de l'avancement du design.

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
| `apps/citari` | Le site **et son moteur de scan** : landing, scan, teaser, rapport, lead | **npm**, TanStack Start, port 8080 |
| `apps/admin` | Back-office : leads, clients, sprints, relances, citations | pnpm, Next.js, port 3001 |
| `packages/toolkit` | L'usine : 22 commandes de livraison et d'acquisition | pnpm |
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
pnpm -r test        # 135 tests
pnpm -r typecheck   # couvre aussi le site, via l'alias des tests
npm --prefix apps/citari run build
```

**Les tests importent le vrai code du site**, ils n'en recopient plus une
version. L'alias `@/` est résolu par `packages/toolkit/vitest.config.ts` pour
vitest, et par les `paths` de son `tsconfig.json` pour `tsc`. Effet de bord
heureux : `orchestrateur.server.ts` et `score.ts` sont désormais typés, ce qui
n'était jamais arrivé, le site n'ayant pas de script de typecheck à lui.

Les 22 commandes s'appellent par `pnpm toolkit <commande>`.

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

**Commercial**
`relance` prépare les 4 emails d'un prospect · `reponses` prépare les 8 réponses
aux objections · `proposition` génère la proposition · `concurrents` relit et
corrige le classement des concurrents · `sourcer` construit la liste
d'entreprises depuis l'annuaire officiel (API gouv, gratuite : NAF, zone,
effectif, dirigeants) · `enrichir` extrait des sites ce qu'ils publient
(emails, téléphones, responsable de publication, robots bloqués, pixels
publicitaires) · `verifier-base` note la fiabilité d'une base avant tout envoi
(MX des domaines, doublons, zone, cohérence) · `scan-lot` scanne cette liste
entière pour le baromètre.

## Règles métier à ne pas casser

- « Le Chat » est l'étiquette affichée, `mistral` l'identifiant et
  `score_mistral` la colonne : on nomme partout l'assistant que le public
  utilise, mais la base garde le nom de l'éditeur, plus stable.
- Mix de questions : 24 en complet (10 comparatives, 6 problème, 5 locales,
  3 confiance), 20 en aperçu.
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
