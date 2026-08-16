# Journal des décisions

Ce que sait la conversation mais que le code ne dit pas. À lire au démarrage
d'une nouvelle session, après `CLAUDE.md`.

---

## 2026-08-16 — Le transfert vers l'organisation a tué les déploiements, en silence

Le dépôt a quitté `LuigiRevelli/citari` pour l'organisation
`CITARI-Luigi-and-Jeremie` (créée avec Jérémie ; on y pousse tout,
en permanence). Deux pièges payés, à connaître :

1. **GitHub redirige les pushs vers l'ancienne adresse**, donc tout SEMBLE
   marcher : `git push` réussit, aucun message d'erreur. Mais le déploiement
   automatique Hostinger, lui, était mort — deux mises à jour (le PR
   analytics GA4 et la projection) sont restées sur GitHub sans jamais
   partir en production. Un déploiement qui prenait 2 à 4 minutes qui n'est
   pas passé en 15, c'est un circuit coupé, pas un circuit lent.
2. **La cause exacte, diagnostiquée par l'API GitHub** (`gh api
   /orgs/.../installations`) : l'app Hostinger était bien INSTALLÉE sur
   l'organisation, mais en mode « dépôts sélectionnés » sans `citari` coché.
   Tout semble en place, et le dépôt est invisible pour Hostinger — c'est ce
   qui a rendu la reconnexion « impossible » depuis le panneau. Réglage :
   la page d'installation de l'app dans les réglages de l'organisation →
   Repository access → cocher le dépôt → reconnecter côté Hostinger.

Après la reconnexion par Luigi, le déploiement est reparti et la projection
est en ligne, vérifiée en production.

---

## 2026-08-16 — La projection : le scan complet adopte le seul format que Luigi a validé

Troisième retour identique de Luigi sur le document (« pas lisible, pas
intuitif, pas clair »), assorti d'un « je te laisse vraiment trouver une
solution cette fois ». Trois passes de polissage n'avaient pas réglé le
problème : LE CADRE était faux. On avait construit un document d'expert de
quatorze mille pixels, alors que le seul format que Luigi ait jamais validé
dans ce produit est la SÉQUENCE de l'aperçu — un écran, un message, un
bouton « Suivant : {l'étape qui suit RÉELLEMENT} », testée sur son père. En
partage d'écran, un document défilant met tout le travail de guidage sur le
consultant ; une carte à la fois, c'est le document qui guide, et le
prospect qui a vu l'aperçu retrouve exactement la même grammaire, en
version approfondie. Rappel de l'enjeu par Luigi : ce document est ce qui
convainc, en visio, de payer le Sprint juste après.

**La projection** (`rapport-complet-projection.tsx`) : fond encre quadrillé,
carte claire centrée, flèches du clavier, points de progression, onze
cartes. Elle s'ouvre sur L'ESSENTIEL : le bordereau des neuf constats,
chacun cliquable avec son chiffre clé — on annonce tout, puis on prend les
constats un par un. Les visuels du cadastre (règle graduée, matrice, duel,
faces, frise) vivent DANS les cartes ; l'assemblage est strictement le même
`construireDocument`, pas un comptage ne bouge ; une carte sans donnée sort
de la séquence.

**Le document défilant n'est pas jeté : il est devenu la version
imprimable**, ce pour quoi sa forme est bonne. Il reste MONTÉ en permanence
(`hidden print:block`) : Cmd+P imprime toujours le document, jamais une
carte. Un lien discret bascule d'une vue à l'autre. Écran = projection,
papier = document, une seule source de chiffres — ce n'est pas « la même
pièce à deux endroits » (le piège payé), c'est le même contenu sous deux
médias, comme l'écran et le PDF de DESIGN.md §8.

Piège d'outillage consigné : le panneau de preview, quand il est masqué,
gèle `setTimeout` et `requestAnimationFrame` — une séquence à transitions
paraît alors cassée (carte figée en plein fondu, compteur immobile) alors
qu'elle est saine. Vérifier sur un onglet VISIBLE avant de diagnostiquer.

---

## 2026-08-16 — « On met tout ? » : six mesures dormaient en base, et le score arrive enfin

Question de Luigi : « tu es sûr qu'on met tout ? ». Audit de la base contre le
document : **six données mesurées, payées et jamais affichées**. La plus
gênante était `queries.intent`, que la refonte de la veille avait elle-même
PERDUE en supprimant la colonne « intention » du vieux tableau.

Ce qui entre, et rien d'autre (budget tenu : deux objets neufs, une ligne de
cartouche) :

- **La bande des intentions**, en tête de la carte. Une colonne par type de
  question, dont la LARGEUR est le nombre de questions, et dont le
  remplissage suit la convention de surface en quatre segments : encré ce que
  vous tenez, hachuré ce qu'une autre marque tient, papier nu ce que personne
  ne tient, hachure fine ce qui n'a pas été relevé. Sur Snapdesk : 10
  comparatives, 6 problème, 5 locales, 3 confiance, et zéro citation partout.
  Le mix n'est pas au hasard (la méthode pose 5 locales quand une ville est
  déclarée) : le montrer rend la méthode vérifiable au lieu de l'affirmer.
- **La portée**, sous la bande et dans le cartouche. Quatre phrases possibles,
  dont aucune n'affirme plus que l'échantillon ne montre : une ville déclarée
  SANS question locale le dit, au lieu de laisser croire à une mesure locale.
- **La tonalité dépliée**, sous les composantes du score. « Tonalité 80 % » ne
  disait pas de quoi c'était fait ; sur un document à 13/100, « quand une IA
  parle de vous, c'est positif 7 fois sur 11 » est la seule bonne nouvelle, et
  elle est mesurée. Le positif porte le bleu de l'acquis.
- **La recommandation explicite**, sous chaque barre du duel. Wojo n'est pas
  seulement nommé 86 fois : il est explicitement recommandé dans 50 réponses,
  contre 6 pour Snapdesk. Être cité et être recommandé ne sont pas la même
  défaite.

REFUSÉ, et c'est un refus de code autant que de design : `scans.competitors`,
les concurrents que le prospect nomme au formulaire. Vérifié en base, la
colonne est vide sur les six scans complet/controle existants — et la cause
est dans `equipe.functions.ts`, qui passe `concurrents: []` en dur au
lancement depuis /equipe. Afficher une section vide n'aurait rien réglé ; la
dette est notée, elle est en amont.

**LE MOUVEMENT, enfin, et un seul.** DESIGN.md §6 l'autorise à la révélation
du score et exige la sobriété partout ailleurs. Le chiffre monte de 0 à sa
valeur en 900 ms, décélération cubique, pendant que le trait rouge glisse
jusqu'à sa graduation ; le verdict n'apparaît qu'à l'arrivée. Quatre règles
tiennent la mécanique : l'état initial EST l'état final (le serveur et le
premier rendu client sont identiques, donc aucune erreur d'hydratation) ;
rien n'est simulé, on interpole vers une valeur déjà écrite en base ;
l'instrument (graduations, bandes, légendes) ne bouge jamais ; joué UNE fois,
sans rejeu au défilement, parce qu'un compteur qui se rembobine dans un
document de quatorze mille pixels devient un tic. `prefers-reduced-motion`
coupe tout.

**Sept correctifs, dont trois graves**, trouvés par une relecture critique :

1. **Le document imprimé mentait.** `print-color-adjust: exact` n'était
   déclaré que sur les deux hachures ; tous les autres aplats (les cases
   encrées de la carte, les barres du duel) disparaissaient sur papier, et la
   convention s'inversait : « tenu par vous » devenait du vide. Déclaré
   globalement dans le bloc `@media print`.
2. **Le rang de la part de voix était faux.** `partDeVoix` pousse la ligne du
   client en fin de liste quand elle sort du haut de tableau, et l'affichage
   numérotait par l'ordre : une marque classée 47e s'affichait « 09 ». Le rang
   réel est désormais posé AVANT la troncature.
3. **Le rouge fuyait sur un acquis** : une case où la marque est explicitement
   RECOMMANDÉE portait un liseré `--signal`. La meilleure nouvelle de la carte
   était peinte dans la couleur de la perte. Passée au bleu.
4. `--ink-3` était à 4,39:1 sur le papier, sous le seuil de 4,5 que DESIGN.md
   §11 impose au TEXTE, et il portait 249 éléments dont des labels de 10px.
   Foncé à 4,92:1 (tout le site en profite).
5. Un moteur NON RELEVÉ recevait la même barre minimale qu'un moteur à zéro,
   deux états qui ne disent pas du tout la même chose.
6. La question décisive n'avait ses six colonnes qu'au-delà de 1280px : la
   règle rouge des « absent » alignés, qui EST le chapitre, n'existait pas en
   dessous.
7. Des pistes peintes en `--paper-2` étaient invisibles sur les planches, dont
   le fond EST `--paper-2`.

---

## 2026-08-16 — Le cadastre : une absence est un trou, pas une case rose

« J'ai encore du mal niveau esthétique, lisibilité et pertinence, on est loin
de ce qu'on veut » (Luigi), avec une consigne : aller chercher les skills de
design. `artifact-design` et `dataviz` chargés comme l'impose CLAUDE.md, plus
DESIGN.md qui fait foi. Le diagnostic s'est révélé chiffrable, et sévère :
**16 tailles de texte distinctes dont 530 éléments entassés entre 10 et
15px**, tous en Archivo 600, et Newsreader présente 9 fois sur 673 éléments.
C'est mot pour mot « l'échelle molle où tout se ressemble » que DESIGN.md §3
interdit. Le document échouait aussi au test de sortie du §10 : un 13/100
s'affichait en noir neutre à côté du mot « Invisible » en noir.

Quatre directions produites et jugées par trois lentilles (directeur
artistique, dirigeant de PME, ingénieur). **« Cadastre » l'emporte**, et sa
thèse tient en quatre valeurs de surface déclarées une fois pour tout le
document : encre pleine = tenu par vous, hachure montante = tenu par une
autre marque, papier nu = personne ou vous êtes absent, hachure fine =
non relevé. Le lecteur apprend la légende en dix secondes puis lit le
territoire sans qu'on lui explique.

**La correction la plus importante ne m'appartient pas.** J'avais diagnostiqué
« le signal est sous-employé » ; la direction gagnante a démontré l'inverse :
il était DÉPENSÉ EN DÉCORATION. 124 cases teintées dans la carte, un chevron
rouge sur chacune des 24 lignes, la marque du client en rouge dans chaque
liste. À ce régime le rouge est un motif de fond et plus rien ne peut
alarmer. On ne crée pas la tension en ajoutant du rouge, on la crée en le
rationnant : budget opposable de 2 % de la surface encrée, et le rouge ne dit
plus qu'une chose, la perte. `--verdict` (bleu encre), déclaré depuis
toujours et quasi jamais employé, porte l'acquis. Conséquence assumée : sur
un site au robots.txt ouvert, le chapitre technique est ENTIÈREMENT BLEU. Un
document rouge de bout en bout ne fait plus peur nulle part.

Ce que la refonte a produit, vérifié sur le scan Snapdesk :

- **la carte** : segments jointifs, une absence est du papier nu (plus de
  croix rose), et la colonne du tenant est hachurée sur 24 lignes, ce qui
  produit un mur continu le long du bord droit face à six colonnes presque
  vides. L'œil lit « tout est tenu, sauf par vous » avant un seul chiffre ;
- **le verdict** : le score devient un point sur une règle graduée de 0 à
  100. À 13, le trait rouge tombe à 13 % et 87 % de la règle reste vide. Le
  territoire manquant est dessiné à l'échelle, sans un mot ;
- **les quatre composantes** en grille `50fr 20fr 20fr 10fr` : la largeur de
  chaque colonne EST son poids dans la formule. La mise en page démontre la
  formule au lieu de la réciter ;
- **la question décisive** : six colonnes de journal, et les six lignes
  d'état alignées font que cinq « absent » en rouge tracent une règle
  horizontale à travers la page. Personne ne l'a dessinée, c'est la donnée ;
- **le duel** passe sur un AXE UNIQUE (les réponses lues) : l'ancien axe
  était le maximum des deux barres, ce qui donnait au rival une barre pleine
  largeur quelle que soit sa domination et détruisait l'échelle ;
- **les sources** : six pastilles par ligne disent quels moteurs lisent ce
  site. La donnée existait et était diluée en une liste de noms ;
- **le rail de sommaire** est remplacé par un BORDEREAU en ouverture, neuf
  lignes à points de conduite portant chacune le chiffre clé de son
  chapitre. Il s'imprime, lui, et il sert de résumé exécutif.

Trois familles, trois métiers : le mono COMPTE, Archivo ÉTIQUETTE, Newsreader
ÉNONCE (romain pour les titres, italique pour les paroles prélevées : la
distinction porte du sens). Newsreader passe de 9 à 129 occurrences.

**Deux bugs réels trouvés au passage.** `no-print` et `avoid-break` étaient
utilisés depuis toujours dans le rapport et n'étaient définis NULLE PART : il
n'existait aucun bloc `@media print`, donc le bouton « imprimer » sortait le
sommaire et coupait les tableaux au milieu. Et le titre de la carte comptait
en QUESTIONS pendant que son pied comptait en RÉPONSES, deux nombres justes
dans le même chapitre : le pied a été supprimé, une unité par chapitre,
toujours nommée. C'est la règle payée le 14/08.

Piège de syntaxe repayé : un commentaire `{/* */}` entre deux attributs JSX
casse le parseur, et `tsc` ne le voit pas si on ne le relance pas après
l'édition. Le serveur de dev, lui, l'a vu tout de suite.

---

## 2026-08-16 — Le document de mesure devient l'instrument de la visio

« Le scan complet est beaucoup trop indigeste et impertinent » (Luigi). Le
rapport des modes `complet` et `controle` servait neuf sections de tableaux
bruts, titrées comme un sommaire d'audit (« Part de voix », « Requête par
requête »), et se fermait sur un mur Calendly — c'est-à-dire qu'il demandait
de réserver un rendez-vous PENDANT le rendez-vous. Réécrit en déroulé de
partage d'écran.

**Chaque titre de chapitre énonce le constat, avec les chiffres réels.**
« Sur 24 questions posées, votre marque apparaît sur 10 », « Wojo est nommé
8 fois plus souvent que vous », « Pour répondre, les moteurs ont lu 230
sites. Le vôtre : 8 fois. » Le prospect a compris avant qu'on parle. Un
titre générique laisse le consultant faire tout le travail à l'oral, et ne
survit pas au PDF qu'on relit trois jours plus tard.

Neuf chapitres, dont trois nouveaux et deux fusions :

- **la carte des réponses** : la matrice questions × moteurs, une case par
  réponse (position si cité, croix si absent, tiret si le moteur était en
  panne), pied de tableau « cité sur N/M » par moteur. Cliquer une ligne
  déplie les réponses intégrales : elle absorbe l'ancien tableau ET l'ancienne
  annexe « toutes les réponses », une pièce à un seul endroit ;
- **la question décisive** : les six réponses côte à côte sur la question la
  plus disputée. C'est la pièce qui remplace l'épreuve du direct ;
- **le plan des 90 jours** : trois phases (J1-15 ouvrir les portes, J8-45
  écrire ce qui manque, J30-90 être cité là où les IA lisent). Chaque phase
  s'ouvre sur un CONSTAT relevé plus haut, liste les actions du scan, et se
  ferme sur des cibles calculées : les 5 questions les plus prenables avec
  qui les tient, les 8 domaines où être cité. Le mur Calendly est remplacé
  par le pont honnête : « ce plan est exactement ce que le Sprint exécute ».

**Les sources ne sont plus celles de Perplexity seul.** ChatGPT, Claude et
Gemini en renvoient aussi et elles dormaient en base : 455 lectures au lieu
de 345 sur le scan Snapdesk, avec le site du client reconnu (« le vôtre : 8
fois ») et le nombre de moteurs qui l'ont lu.

Tout l'assemblage vit dans `lib/rapport-complet.ts`, en fonctions pures
testées (19 tests) ; la page n'affiche plus que ce qu'on lui donne.

---

## 2026-08-16 — Six défauts trouvés par la revue adversariale, dont deux sérieux

Refonte relue par quatre agents (comptages, doctrine, React/SSR, cohérence),
chaque défaut attaqué par un sceptique chargé de le RÉFUTER. Six ont survécu,
tous corrigés. Les deux qui comptent :

**Une question sans aucune réponse était comptée comme perdue.** Quand la
collecte est amputée (moteur à sec, plafond de coût qui arrête `finaliser`
en cours de route), les questions de queue n'ont aucune ligne `responses`.
Elles entraient au dénominateur (« 21 questions sur 24 se jouent sans
vous »), et pire : n'ayant aucune mention, elles obtenaient le score de
gagnabilité MAXIMAL et sortaient en tête du plan des 90 jours avec la raison
« Personne ne tient cette question : la place est vide. » Une affirmation
fabriquée à partir d'une panne. La règle du dénominateur était appliquée par
moteur, pas par question. `LigneMatrice.mesuree` la porte désormais partout,
et le titre annonce la coupe (« 20 ont pu être mesurées ») au lieu de la
cacher.

**Le duel et la part de voix comptaient le même concurrent différemment.**
`adversairePrincipal` groupait sur `m.brand` BRUT, sans passer par
`brand_aliases`, alors que `partDeVoix`, affichée juste en dessous dans la
MÊME section, regroupe les variantes. « Exco » et « Exco Lyon » restaient
donc deux adversaires disjoints : le duel annonçait un nombre déflaté, et la
barre juste dessous en affichait un autre pour la même marque. C'est
exactement le bug du 14/08 (« 14 d'un côté, 13 de l'autre », scan Airbnb),
corrigé alors pour la marque CIBLE et pas pour l'adversaire. Corrigé dans
`rapport-apercu.ts`, donc pour l'aperçu aussi.

Les quatre autres : `dateFr` formatait dans le fuseau du runtime (Cloudflare
en UTC contre un navigateur parisien : deux dates différentes pour un scan
achevé après 22 h UTC, donc erreur d'hydratation sur tout l'arbre, invisible
en dev où les deux partagent le Mac) ; les clés React du plan reposaient sur
des titres écrits par un modèle, sans unicité garantie ; un scan `controle`
s'étiquetait « scan complet » en en-tête, contredit par sa propre ligne
« échantillon » ; et plusieurs tris n'avaient aucun départage alors que
`mentions` arrive sans ORDER BY, si bien que deux ex æquo pouvaient nommer un
tenant différent d'une ouverture du rapport à l'autre.

Ce que la revue a coûté et appris : la vérification adversariale a buté deux
fois sur les limites de session, et une partie des défauts non confirmés n'a
jamais pu être attaquée. Les six retenus l'ont été sur pièces, avec le
scénario qui les déclenche.

---

## 2026-08-15 — Calendly ne parle qu'aux pages qui se déclarent

La vraie réservation de test de Luigi n'est jamais apparue sur /equipe, et
la table `reservations` était bel et bien vide : rien n'avait été capté. La
cause n'était ni le filtre d'origine (déjà corrigé), ni l'écouteur : **le
widget Calendly n'émet AUCUN postMessage vers la page hôte si l'URL
embarquée ne porte pas `embed_domain` et `embed_type`**. Prouvé par A/B
dans le navigateur : la même iframe reçoit zéro message en 12 secondes sans
les paramètres, cinq dès le chargement avec (`calendly.event_type_viewed`,
`calendly.page_height`).

Moralité : le journal du même jour notait « la seule pièce restante
qu'aucun test synthétique ne peut couvrir : une VRAIE réservation ». C'est
exactement la pièce qui a cassé. Deux vérifications synthétiques (origine,
écriture en base) encadraient un canal qui n'émettait tout simplement rien.

Corrigé dans `bookingUrl()` (option `embarque`, qui pose
`embed_domain=<hôte>` + `embed_type=Inline`) et `BookingModal` la passe
avec `window.location.hostname` — sûr côté SSR, l'iframe ne rend qu'après
le clic. Les LIENS directs (page /scan-complet, emails) ne la passent pas :
un lien ouvre Calendly plein cadre, il n'y a pas de page hôte à prévenir,
c'est le formulaire d'ajout manuel qui les rattrape. Revérifié dans la
vraie modale : les événements arrivent, et une confirmation simulée
(`calendly.event_scheduled` dispatché avec l'origine Calendly) a écrit la
ligne Agoravox en base, effacée après coup. La réservation de test de Luigi
reste perdue pour le tableau : la recoller via l'ajout manuel, ou refaire
une réservation après déploiement — cette fois elle sera captée.

---

## 2026-08-15 — « Scan complet », troisième et dernier baptême du jour

Décision de Luigi en fin de soirée : « scan premium » devient « scan
complet ». C'est le meilleur des trois noms : il coïncide avec le mode
`complet` en base, et il dit ce que le produit est. 49 occurrences
renommées d'un balayage scripté (site, fiche produit, page /equipe, emails
et réponses aux objections du toolkit), plus trois césures de ligne que le
balayage ne pouvait pas voir (« scan\n premium ») et l'en-tête de colonne
du comparatif (PREMIUM → COMPLET). La route `/scan-premium` devient
`/scan-complet`, sans redirection : la page avait deux heures d'existence,
noindex nulle part mais jamais indexée ni liée hors du site. Les colonnes
`reservations.premium_scan_id` / `premium_launched_at` restent : ce sont
des identifiants internes, la règle de toujours.

---

## 2026-08-15 — La capture Calendly aurait rejeté toutes les vraies réservations

« Reverifie tout » de Luigi avant la mise en service, et la re-vérification
a payé : le filtre d'origine des postMessage exigeait un domaine finissant
par « .calendly.com » — or le widget émet depuis `https://calendly.com`,
SANS sous-domaine. Le point de trop rejetait l'origine principale : la page
/equipe aurait affiché « aucune réservation » pour toujours, avec une
capture parfaitement silencieuse. Le test de bout en bout ne pouvait pas le
voir : il simulait la ligne en base, pas l'événement Calendly.

Corrigé dans `lib/calendly.ts` (`estOrigineCalendly` : https, hôte
calendly.com ou sous-domaine — jamais un suffixe de chaîne, sinon
`evil-calendly.com` passerait), avec quatre tests qui verrouillent les deux
sens : accepter Calendly, n'accepter que lui.

Ajouté dans la foulée, pour le « je dois pouvoir tout contrôler » : le
formulaire d'ajout MANUEL sur /equipe. Une réservation prise hors du site
(lien direct, email) arrive par la notification Calendly : on colle le lien
du rapport du prospect, la ligne rejoint le tableau, le bouton Lancer fait
le reste.

Vérifié en PRODUCTION : porte (le mot de passe Hostinger est pris), liste,
lancement réel (scan complet créé en prod, phase init, 0 réponse donc 0 €,
secteur hérité de l'aperçu), puis nettoyage complet. La seule pièce
restante qu'aucun test synthétique ne peut couvrir : une VRAIE réservation
Calendly de bout en bout — à faire une fois, gratuite et annulable.

---

## 2026-08-15 — /equipe : les réservations Calendly, et le bouton qui lance le premium

Luigi voulait « un endroit où on voit tous ceux qui ont réservé, et un
bouton pour lancer le scan » — sans serveur ni domaine de plus. La page vit
donc SUR le site : `citari.fr/equipe`, noindex, protégée par LE mot de passe
admin (celui du back-office, une seule vérité ; le `.env.local` du site en
portait un placeholder, aligné sur la racine). Le journal du 14/08 avait
supprimé l'ancien /admin du site pour cause de duplication : ici pas de
doublon, les réservations n'existent nulle part ailleurs, et apps/admin
garde leads et clients.

**La capture** : le widget Calendly embarqué émet `calendly.event_scheduled`
à la confirmation ; le BookingModal appelle alors `enregistrerReservation`
(jeton du rapport + email de session), qui écrit dans la nouvelle table
`reservations` (RLS actif, zéro politique, comme les 16 autres). Anti-rejeu
24 h par scan. Limite ASSUMÉE : une réservation prise hors du site (lien
direct, email) n'est pas captée — elle arrive par l'email de notification
Calendly. Le jour où ça compte, un jeton API Calendly comblera le trou.

**Le lancement** : `lancerPremium` vérifie le mot de passe, crée le scan
`complet` via creerScan (secteur/ville hérités de l'aperçu, jamais
re-déduits), lie la réservation, et la page OUVRE `/scan/<id>` : l'écran de
mesure existant pilote la mesure comme le ferait le navigateur d'un
prospect. Un seul moteur, aucun pilote nouveau. Le bouton est idempotent
(re-cliquer renvoie le scan existant), et un scan créé ne coûte RIEN tant
que l'écran n'est pas ouvert.

**Verrouillé au passage** : `lancerScan` public n'accepte plus que le mode
`apercu` (z.literal). Le mode complet était accepté depuis n'importe quel
navigateur — le formulaire ne l'envoyait jamais, mais un curieux lisant le
JS pouvait déclencher des scans à 1,06 €. Le pilote du toolkit n'est pas
concerné : il appelle l'orchestrateur en sous-processus, pas la fonction
publique.

Testé de bout en bout en local contre la vraie base : porte (vrai mot de
passe requis), liste, lancement (scan complet créé en phase init, 0 réponse
donc 0 €, secteur hérité vérifié), puis nettoyage complet du test. Piège
d'outillage renoté : un input contrôlé React ignore `form_input`, passer
par le setter natif + event input.

**Pour la prod, UNE variable à ajouter sur Hostinger : `ADMIN_PASSWORD`**
(la valeur de la racine). Sans elle, la page est fermée par défaut.

---

## 2026-08-15 — Apple à 123/100 : la formule comptait des mentions, pas des réponses

Luigi scanne Apple : score global 123, ChatGPT 133. Un score borné à 100 qui
dépasse 100 n'est pas une valeur aberrante, c'est une unité fausse :
`calculerScore` divisait un compte de LIGNES DE MENTION par un compte de
RÉPONSES. Une marque de la taille d'Apple est citée plusieurs fois par
réponse (54 mentions pour 39 réponses) : présence 138 %, recommandation
126 %. Le bug dormait depuis l'origine parce que les PME testées jusqu'ici
étaient mono-citées ; il a suffi d'une grande marque pour le réveiller.

La règle d'unité du parcours (« on compte en réponses distinctes ») vaut
désormais aussi dans la formule : les mentions de la cible sont regroupées
par réponse avant tout ratio. Par réponse : la MEILLEURE position (celle que
lit l'acheteur en premier), recommandé si au moins une citation l'est,
tonalité moyenne de ses citations. Un garde-fou ignore en plus toute mention
orpheline d'une réponse non mesurée : chaque ratio est borné à 1 PAR
CONSTRUCTION. Pas d'écrêtage à 100 : un « min » aurait masqué ce bug au
lieu de le corriger, et le prochain du même genre avec lui.

La ligne d'Apple a été recalculée en base avec la règle corrigée (95/100,
présence 100 %, position moyenne 1,97) : le scan était en cache trois jours,
et quiconque rescannait apple.com se voyait servir le 123. Neuf autres
scans de test portent un léger gonflement (1 à 4 mentions d'écart, scores
restés sous 100) : aucun n'est contractuel, le cache les expire sous trois
jours, ils sont laissés tels quels.

Trois tests de régression gardent la porte : trois citations dans une
réponse valent une présence (et la meilleure position), une inondation de
mentions ne dépasse jamais 100, une mention orpheline est ignorée.

---

## 2026-08-15 — Les animations rejouent, et la fiche premium retrouve son logo

**Les animations d'entrée se réarment.** Reveal, StrokeText et les
compteurs/jauges des statistiques coupaient leur observateur au premier
passage : jouées une fois, plus jamais. Elles rejouent désormais à chaque
retour, en montant comme en descendant. Le mécanisme, dans
`lib/use-apparition.ts` : visible à l'entrée (au seuil du composant), remise
à zéro UNIQUEMENT quand l'élément est complètement hors écran, pour que le
réarmement ne soit jamais visible. Piège d'implémentation : avec le seul
seuil d'entrée, la sortie totale ne déclenche aucun rappel d'observateur et
l'état ne se réarme jamais ; il faut observer les seuils [0, seuil].
ScrollFloat (GSAP scrub) rejouait déjà par construction ; le titre du héros
garde son animation de chargement. Conséquence assumée sur Reveal : un bloc
au-dessus de la fenêtre est masqué (avant, montré d'office), c'est ce qui
permet de le voir rejouer en remontant. Vérifié au navigateur sur trois
allers-retours : compteur 0 → 56,6 → 0 → 56,6, pont et reveals réarmés.

**La fiche /scan-premium n'avait ni logo ni retour accueil** : le
`sansChrome` de la racine masquait le chrome sur tout préfixe « /scan », règle
écrite pour l'écran de mesure `/scan/$id` avant que `/scan-premium` existe.
Corrigé en « /scan/ » avec la barre. Le rapport et l'écran de mesure restent
sans chrome, vérifié sur les trois HTML servis. Sur /methode et /sprint, le
logo était déjà cliquable : le défaut réel ne touchait que la fiche.

---

## 2026-08-15 — Le tiret cadratin dégagé de tout ce qui s'affiche

La doctrine l'interdisait depuis le début (« pas de tiret cadratin dans les
textes français publiés », il signe le texte généré) et la journée en avait
semé partout. Balayage complet : plus UN SEUL « — » rendu sur les quatre
pages (vérifié sur le HTML servi, méta et titres compris). Les séparateurs
de titres passent au point médian, déjà la ponctuation maison (« Le scan
premium, déplié · Citari ») ; la prose est réécrite avec deux-points,
virgules ou parenthèses. Restent les commentaires de code et les prompts
serveur, qui ne s'affichent nulle part.

La fiche /scan-premium a été musclée dans le même geste : le héros pose
l'enjeu (« Celui qui tient cette liste sait exactement où son marché se
décide »), la section 00 montre la machine au travail pendant l'attente du
créneau (« chaque réponse obtenue par les API officielles, horodatée,
conservée mot pour mot »), et le CTA ferme la boucle (« vous ouvrez vos 144
réponses à l'heure dite »). Toujours zéro promesse de score.

---

## 2026-08-15 — Le parcours vend enfin, et chaque notice a son rôle

Retour de Luigi sur la passe précédente : les descriptions « ne donnent pas
envie », le scan de 90 s « est beaucoup plus impressionnant que ça ». La
première réécriture listait les mécanismes ; celle-ci raconte ce que le
CLIENT vit : « vous regardez ChatGPT et Gemini répondre en direct », « vous
lisez la phrase qu'un acheteur a reçue à votre place », « la fiche que
chaque IA récite sur vous — souvent périmée, parfois confondue avec un
homonyme », « on compte les robots entrer dans vos logs ». Chaque phrase
reste couverte par ce que l'orchestrateur fait réellement : le spectaculaire
vient du réel, pas de l'emphase.

**Le scan premium a sa page** (`/scan-premium`), troisième notice du site,
née d'un défaut relevé par Luigi : les cartes 01 et 02 renvoyaient toutes
deux vers /methode. Et sa question suivante — « les deux documents se
ressemblent, non ? » — a fixé la doctrine des notices, désormais écrite sur
les deux pages : **/methode est la règle du jeu** (comment on mesure,
commune aux deux scans), **/scan-premium et /sprint sont les fiches
produit** (ce que chaque offre livre). Le CTA de /scan-premium est le
Calendly directement : c'est une page de conversion, pas de méthodologie.

**Une seule offre publique.** « On fait que celui à 2 900 € » : le Sprint
Domination disparaît de /sprint ET du JSON-LD de la racine — annoncer aux
moteurs une offre que le site ne présente plus serait l'incohérence qu'on
fait payer aux autres. `proposition.ts` sait toujours le générer.

**L'image de l'étape 2, réglée à la racine.** Le « trop zoomé » persistait
parce que le MOTIF remplissait son canevas plus que ceux des étapes 1 et 3 :
aucun recadrage CSS ne pouvait l'égaliser. Le fichier a été élargi à
1900×1036 (PIL : le grain du fichier lui-même, tuilé en miroir autour de
l'original intact — aucun raccord visible). Le dézoom est DANS le fichier ;
sauvegarde de l'original hors de public/, qui est déployé tel quel.

---

## 2026-08-15 — « Scan premium », et chaque étape porte sa notice

Deux décisions de Luigi dans le même souffle.

**Le diagnostic s'appelle « scan premium », partout.** Renommé dans les
douze textes visibles du site (cartes du rapport, FAQ, écran d'attente,
spécimen du héros, boutons de réservation) ET dans ce qui part chez les
prospects par le toolkit : les gabarits d'emails et les huit réponses aux
objections. Vérifié : plus une occurrence visible de « diagnostic » sur la
landing ni sur le rapport. Ce qui ne bouge pas : les modes en base
(`apercu`/`complet`/`controle`), les noms de composants, l'URL Calendly, le
vocabulaire opérateur du CLI. Nuance de langue : la carte 02 affiche
« Offert » plutôt que « Gratuit » — un scan premium gratuit se contredit,
un scan premium offert se comprend.

**La section « Vérifiabilité » est morte le jour de sa naissance**, et
c'était la bonne critique : créée le matin même, elle redisait juste après
les trois étapes ce que les cartes venaient de dire, et le Sprint n'y
figurait pas. À la place, **chaque carte du parcours porte SA notice
technique en bouton** au pied : 01 → /methode, 02 → /methode#protocole
(saut profond vers le protocole), 03 → /sprint. La piste « dépliant smooth
sous la carte » a été écartée : le contenu replié n'est pas lu — piège payé
deux fois (l'annexe des questions, la FAQ paginée) — et les deux pages de
détail existent déjà ; les dupliquer dans un accordéon recréerait le
problème des deux comparatifs.

Les descriptions des trois cartes nomment désormais leurs MÉCANISMES : API
officielles, extraction et positionnement des marques, GPTBot/ClaudeBot/
PerplexityBot, les URL réellement ouvertes par les moteurs, robots.txt,
llms.txt, schema.org, Wikidata, IndexNow, le contrôle J+45. C'est le
« exagère » de Luigi appliqué comme la veille : par la précision technique,
jamais par la promesse.

---

## 2026-08-15 — La page /sprint : vendre par le détail plutôt que par la promesse

Demande de Luigi : une page dédiée au Sprint, sur le modèle de /methode,
« qui montre qu'on crée une grosse valeur ajoutée, technique et pertinente,
très vendeur, qui donne l'émotion qu'ils ont absolument besoin de nous », et
l'autorisation d'« exagérer sur les explications ».

Ce qui a été exagéré : le DÉTAIL. Pas les faits. Tout vient de
`docs/LIVRAISON.md` — trois chantiers, huit phases, 47 étapes, les
vérifications en ligne, les 739 sources mesurées, les délais réels de
validation des annuaires. Le site n'a toujours ni client, ni témoignage, ni
score promis, et la page se termine par « ce que nous ne promettons pas ».
La démonstration de maîtrise vend mieux qu'une promesse, et elle ne se
retourne jamais contre nous en rendez-vous.

L'argument central est vrai et vérifiable : **les jours 31 à 90**. Une
agence livre au jour 30, quand rien n'a encore bougé dans les moteurs — les
pitchs sont sans réponse, les annuaires pas validés, les contenus à peine
indexés. Les quatre phases de maturation portent le signal rouge dans la
frise, les trois de production restent en encre.

**Divergence trouvée et tranchée.** La page annonçait 16 cibles de citation
pour Domination, d'après `CLAUDE.md` ; `proposition.ts` en produit **15**, et
c'est ce fichier qui génère le document remis au client. Le site s'aligne sur
le code, et CLAUDE.md a été corrigé : un site qui promet plus que la
proposition signée fabrique un litige.

Trois entrées : la barre latérale (« Sprint ↗ »), la chute de l'étape 03 sur
la landing, et le pied de page. La page renvoie elle-même vers /methode pour
la formule.

---

## 2026-08-15 — La méthode était cannibalisée par son propre nom

Luigi a « retrouvé tout en bas » la page `/methode` et l'a trouvée
fantastique. Elle publie la formule, le barème, un calcul complet refaisable
à la main, le rejeu à J+90, les limites assumées et ce que nous ne
garantissons PAS. C'est la pièce qui rend crédible tout le reste du site, et
elle n'était liée que depuis le pied de page.

La cause n'était pas un lien manquant, mais **un conflit de nom**. La section
des trois étapes portait `id="methode"`, le kicker « NOTRE MÉTHODE » et le
repère « Méthode » de la barre latérale. Un visiteur qui cherchait la méthode
cliquait dessus, atterrissait sur le parcours commercial, et n'apprenait
jamais que le protocole existait. La section s'appelle désormais
« Parcours » (`#parcours`) et rend le mot à la page qui le mérite.

Quatre points d'entrée, placés là où la question se pose vraiment :

- la **barre latérale**, avec un repère plein et une flèche ↗ (il mène hors
  de la page, ça doit se voir avant le survol) ;
- une **section « Vérifiabilité »** sur la landing, juste après le prix —
  l'instant précis où le lecteur se demande si tout ceci est sérieux ;
- la **FAQ**, dans la réponse « comment calculez-vous le score » ;
- le **rapport**, sous le score : c'est là que le prospect découvre son
  chiffre et veut savoir d'où il sort. Lien en nouvel onglet, pour ne pas le
  sortir de sa séquence.

La section de la landing n'annonce que ce que la page contient réellement
(sections `formule`, `exemple`, `rejeu`, `garanties`) : promettre ici une
pièce absente là-bas serait la faute que cette page existe pour éviter.

**Piège d'outillage, enfin identifié.** Les captures « gelées » qui m'ont
gêné toute la journée venaient d'un viewport du panneau d'aperçu tombé à
0×0 : rien n'était peint, et les mesures prises dans cet état étaient
fausses (une carte annoncée à 2565px de débordement alors qu'elle tient).
Vérifier `window.innerHeight` avant de conclure quoi que ce soit d'un
rendu. Sur la landing, la capture reste blanche même viewport réparé — le
décor animé du héros bloque le compositeur ; `/methode`, sans décor, se
capture normalement.

---

## 2026-08-15 — La FAQ cachait son meilleur contenu, le pied de page publiait un gabarit

Cinquième passe. Trois défauts, dont deux qui ne relèvent pas du goût.

**La FAQ s'affichait cinq questions à la fois**, derrière un bouton « voir
plus ». Deux conséquences, aucune voulue : le groupe « L'offre » n'apparaissait
qu'au DEUXIÈME clic, donc un visiteur qui cherchait le prix ne le trouvait
pas ; et les quinze questions masquées n'étaient pas dans la page — sur un
site dont le métier est de se faire lire par des moteurs, cacher au robot
son contenu le plus citable est un contresens. Les vingt sont désormais
rendues, groupées, chacune repliée sur une ligne : 20 questions, 20 réponses
et 20 ancres dans le DOM, vérifié.

**Le pied de page publiait « Citari · [forme juridique à compléter] »**, en
ligne, depuis la mise en production. La mention ne s'affiche maintenant que
si elle est renseignée. À rétablir dès que la structure existe (SETUP.md) :
c'est une obligation légale, pas une coquette.

**Le dernier appel promettait « Six moteurs interrogés »** juste au-dessus du
bouton du scan gratuit, qui en interroge deux. Même mensonge que les six
logos du héros, corrigé le matin, et au même endroit du parcours : juste
avant le clic. Il annonce désormais ChatGPT et Gemini.

---

## 2026-08-15 — Les trois étapes : le prix passe devant, les blocs deviennent des listes

Quatrième passe, même critique. Deux défauts, dont un franchement gênant.

**La mise en page contredisait le titre.** La section s'appelle « Trois
étapes. Vous savez d'avance ce que chacune coûte » — et le coût était en bas
de carte, en 13px, APRÈS 120 à 190 mots de texte. Le prix est remonté en
tête, en gros, avec la durée : « 01 · LE SCAN · Gratuit · 90 secondes ». Les
deux étapes offertes l'affichent en signal, celle qui se paie en encre : la
nature de chaque étape se lit avant son contenu.

**457 mots dans une section qui se parcourt.** L'étape 02 en pesait 192 à
elle seule, en blocs de paragraphes. Tout est passé en listes à puces, une
idée par ligne : 373 mots, et surtout des cartes enfin comparables (503,
550, 531px de haut, contre 509, 666 et 526). Aucun fait n'a été retiré ;
seules les redites l'ont été, et la phrase « nous n'avons rien à vendre à
une entreprise déjà bien citée » n'a plus qu'un seul emplacement sur la
landing.

Effet de bord heureux, sur le défaut d'image signalé le matin : la carte 02
raccourcie ramène le vide sous son illustration de 154px à 38. Les trois
images montrent maintenant 41 à 42 % de leur surface, avec des cartes de
hauteur voisine — c'était la cause racine, et elle est traitée.

---

## 2026-08-15 — Le simulateur répond enfin à sa propre question

Troisième passe de Luigi, même critique. Le défaut de fond était logique
avant d'être visuel : le titre demande « **combien de vos clients** passent
par une IA avant de vous appeler ? » et la carte répondait par un montant en
euros. Le chiffre demandé n'était affiché nulle part.

La réponse vient donc d'abord en clients, et elle est MONTRÉE : une
silhouette par nouveau client du mois, celles qui passent par une IA en
signal. Le montant suit, comme conséquence, avec sa ligne de calcul intacte.

Deux replis, tous deux pour ne pas mentir avec un dessin :

- **au-delà de 24 clients**, les silhouettes deviendraient une bouillie : une
  barre proportionnelle prend le relais ;
- **en dessous de trois clients**, le décompte entier est faux. Un
  `Math.max(1, …)` affichait « environ 1 de vos 1 », soit 100 % là où la
  mesure dit 38 %. Sous ce seuil, on énonce la proportion (« près de 38 % de
  vos nouveaux clients ») et la barre la montre exactement.

Le décompte affiché est arrondi, le MONTANT reste calculé sur la valeur
exacte (8 × 0,38 = 3,04) : arrondir avant de multiplier ferait diverger le
chiffre annoncé de sa propre ligne de calcul, affichée juste en dessous.
D'où le mot « environ », qui est la vérité et pas une précaution de style.

Vérifié sur toute la plage du curseur (1, 2, 3, 8, 31, 60), accord du verbe
compris (« passe » à un client concerné, « passent » au-delà).

---

## 2026-08-15 — Les deux premiers écrans : comparer devient possible, et six logos arrêtent de promettre six moteurs

Même critique de Luigi sur les deux premières sections : « bien, mais pas
assez intuitives, visuelles, claires, distinctes et pertinentes ». Deux
passes, et une trouvaille de doctrine dans la seconde.

**Les deux chiffres publics (section « ce qui a changé »).** Ils portaient
DEUX langages visuels pour deux pourcentages : barrettes segmentées pour les
38 % de McKinsey, barre pleine pour les 56,6 % de l'Arcom. Aucune comparaison
possible d'un coup d'œil. Une seule jauge désormais, même échelle et même
repère de mi-course — en fusion `difference`, sans quoi le repère disparaît
dans le remplissage sombre (noir sur noir). Les deux cartes sont devenues
strictement parallèles : ce que le chiffre MESURE, le chiffre, la jauge, ce
que ça change pour le lecteur. Avant, l'une répétait en toutes lettres le
pourcentage déjà géant au-dessus, l'autre s'y accrochait grammaticalement
(« des Français utilisent… ») avant d'enchaîner une interprétation.

Le récit qui les précédait disait quatre fois la même chose, dont un bloc de
26px qui concurrençait le titre de 52. Une phrase suffit.

Et un défaut que seule une vérification en petite largeur pouvait révéler :
sous 1100px, les deux cartes étaient un carrousel horizontal SANS
indicateur. La seconde était hors écran, et rien ne disait qu'elle existait.

**Le héros.** Le spécimen de rapport faisait 661px contre 433 au bloc de
gauche : il démarrait 114px plus haut que le titre et l'écrasait,
l'accessoire dominant le message. Compacté (582px, écart ramené à 41), avec
ses deux moitiés enfin distinctes — la mesure d'un côté, ce que le
diagnostic vérifie de l'autre. L'écart de citations, qui est SON message et
qu'il fallait déduire en comparant trois barres à l'œil, est maintenant dit
en toutes lettres, et **dérivé des données** : l'écrire en dur aurait
divergé au premier changement de spécimen. Titre à 62px au-delà de 1280.

**La trouvaille, et c'est une correction de doctrine.** Les six logos de
moteurs s'alignaient à l'identique sous le bouton « Lancer le scan
gratuit ». Un visiteur en déduit que son scan offert interroge les six —
alors qu'il en interroge DEUX, et que le rapport le lui dit ensuite noir sur
blanc (« Claude, Perplexity, Grok, Le Chat : non »). Promettre six moteurs à
la porte d'entrée pour en livrer deux est exactement ce que la maison
s'interdit. ChatGPT et Gemini sont désormais pleins et NOMMÉS, les quatre
autres atténués, sous une légende qui dit la vérité : « Interrogés par votre
scan gratuit. Les quatre autres au diagnostic. » Effet de bord heureux : ça
vend le diagnostic à l'endroit le plus lu du site.

---

## 2026-08-15 — Le test du père : chaque carte tient en un écran, et « Suivant » redevient un mot

Le père de Luigi a essayé le scan et n'a pas compris comment avancer. C'est
le retour le plus précieux reçu à ce jour : les libellés inventifs des
boutons (« Voir qui prend ma place ») se lisaient comme des actions
optionnelles, pas comme LE chemin. Le bouton principal dit désormais
**« Suivant : {titre de l'étape suivante} → »** — le mot que tout le monde
connaît d'abord, la destination ensuite. Seule la première lettre du titre
passe en minuscule : `toLowerCase()` entier écrasait le sigle IA.

**Trois règles posées par Luigi, appliquées aux neuf cartes :**

1. **Chaque carte tient en un écran**, la page ne défile jamais (vérifié en
   mesurant `scrollHeight` sur les neuf étapes du rapport Agoravox). Deux
   causes structurelles corrigées : le conteneur réservait 70px pour une
   barre haute qui en fait 79 (la page défilait de 9px partout) → `flex: 1`
   à la place du calc ; et l'en-tête sticky de la carte gonflait le
   scrollHeight de 8px → l'en-tête est redevenu statique, le sticky ne
   servait plus à rien une fois la règle de l'écran unique en place. Les
   longs contenus sont des EXTRAITS, coupe toujours annoncée à l'écran :
   verbatim recentré sur le concurrent marqué (`extraitVerbatim`, testé),
   miroir coupé à 480 avec un pied qui dit « début de la réponse » au lieu
   de « mot pour mot » quand il y a coupe. Sur mobile, les deux volets
   empilés défilent DANS la carte : c'est assumé.

2. **Copywriting : simple, concret, une idée par phrase.** Référence : la
   carte technique (« C'est une ligne de texte à changer sur votre
   serveur »). Réécrits : le verbatim (« Une IA recommande Mediapart. Vous
   n'êtes pas dans la réponse. »), le miroir (« On a demandé à une IA qui
   vous êtes. Voilà sa réponse. » — l'ancien paragraphe était l'exemple
   type cité par Luigi), le diagnostic (« Il reste 104 réponses à lire, et
   la cause de chaque absence », tableau ramené à six lignes courtes, la
   ligne miroir retirée car la carte 5 vient de MONTRER le miroir).

3. **Le faux « bug » de la part de voix était une phrase, pas un calcul.**
   « Sur 20 questions, 18 réponses donnent un nom sans donner le vôtre »
   mélangeait deux unités ; vérifié en SQL sur Agoravox : 39 réponses lues,
   18 avec la marque, 18 avec un concurrent seul, 3 sans marque — les deux
   chiffres étaient justes, la phrase les rendait contradictoires. Titre
   corrigé : « Sur 39 réponses lues, 18 citent un concurrent. Pas vous. »
   `voixMeta.reponsesLues` expose le dénominateur, test à l'appui.

**La carte des questions est devenue équipée pour être crue ET comprise** :
chaque question est une rangée-bouton (bordure, chevron qui pivote, fond au
survol), une consigne rouge dit « CLIQUEZ SUR UNE QUESTION POUR LIRE LES
RÉPONSES », un voile en bas signale la suite de la liste, et **les cases de
la grille ouvrent la question correspondante** (saut instantané : le
`behavior: "smooth"` se faisait annuler par le reflow de l'ouverture).

Aussi : la fausse affirmation « les réponses vous attendent en bas de cette
page » (carte verbatim) est morte avec l'annexe qu'elle décrivait ; on nomme
l'étape de destination, jamais sa distance (elle bouge quand une carte sort).

**L'image de l'étape 2 des trois étapes de la landing**, en deux passes.
Elle était déclarée 900×1400 portrait ; les trois fichiers sont en réalité
des paysages de 1408×768. Le cadre mobile 9/14 n'en montrait qu'une tranche.

Premier essai raté, et instructif : `object-contain` sur fond assorti. Luigi
a immédiatement vu les deux défauts que ça crée — l'image devient minuscule
(383×209 au milieu d'une colonne de 664) et son crème tranche avec celui de
la carte.

La mesure a donné la vraie cause : **les trois cartes n'ont pas la même
hauteur** (507, 664, 524px) parce qu'elles n'ont pas la même quantité de
texte. En `object-cover` pleine hauteur, la carte 02 ne montrait donc que
31 % de son illustration contre 41 % pour les deux autres. Correction : un
plafond commun (`sm:max-h-[510px]`) rend le cadre identique partout, donc le
recadrage aussi — 41 % sur les trois, vérifié.

Deux détails qui vont avec, et qu'il ne faut pas défaire : la bordure et le
fond vivent sur un CONTENEUR, plus sur l'image (plafonnée, elle laissait le
filet vertical s'arrêter en route) ; et le fond de chaque colonne est le
blanc des bords de SON illustration, moyenné au canvas — les trois fichiers
ont des blancs différents, avec du grain, et aucun n'est celui de la carte.
Écart résiduel : 1,3/255 au pire, invisible.

Reste, assumé : la carte 02 garde 154px de colonne au-dessus et au-dessous
de son illustration, centrée. C'est le prix de son texte plus long. La seule
façon de l'éviter serait de remplir toute la hauteur, ce qui ramènerait
exactement le sur-zoom de départ.

Piège d'outillage à retenir : la capture d'écran du panneau d'aperçu s'est
gelée en cours de session (compositeur), alors que le DOM, la géométrie et
les mesures restaient justes. Vérifier au `getBoundingClientRect` quand les
pixels mentent, et méfiance : mes clics scriptés pendant les HMR ont produit
un faux « bug » de navigation qui n'existait pas.

---

## 2026-08-14 — L'échantillon devient une étape, et deux cartes sont réécrites

Luigi, sur les 20 questions posées en annexe sous la séquence : « c'est trop
facile de les skip alors que c'est très intéressant ». Elles avaient déjà été
dépliées par défaut le matin, et deux liens menaient vers elles. Rien n'y
faisait, et pour une raison structurelle : **un écran plein les précédait**.
Personne ne soupçonne qu'il y a du contenu sous une page qui ne dit pas
qu'elle défile.

Elles sont donc devenues **l'étape 7 sur 9**, entre l'accès des robots et
l'offre. On ne peut plus les manquer, et l'annexe a été supprimée avec ses
deux liens : la page d'aperçu ne se scrolle plus du tout. Ne pas la
rétablir — la même pièce à deux endroits est exactement le piège payé le
matin même avec les deux comparatifs.

**La colonne preuve de cette carte est la donnée elle-même** : une case par
question, noire si la marque est citée, rouge signal sinon. Sur Agoravox,
« 11 / 20 » et huit cases rouges d'affilée disent l'ampleur du trou sans
qu'on ait à l'écrire. Rien n'est dramatisé : une marque citée partout donne
une grille entièrement noire.

**Effet de bord réparé au passage.** Le libellé du bouton de chaque carte
était écrit en dur (« Voir la part de voix »), donc il promettait une étape
qui pouvait être absente : pas de miroir, pas d'audit, et le bouton mentait.
Chaque étape porte désormais son `annonce`, et le bouton reprend celle de
l'étape qui la suit RÉELLEMENT.

**Deux cartes réécrites**, sur la même critique de Luigi : « c'est très mal
dit, pas clair ».

- *Le diagnostic complet* expliquait que l'aperçu venait « de deux moteurs
  qui ont répondu de mémoire ». Exact, et illisible pour un dirigeant. Il dit
  maintenant la limite en français ordinaire (« deux IA sans les laisser
  consulter Internet »), puis ce que le diagnostic RAPPORTE plutôt que ce qui
  manque : les pages que les IA ouvrent avant de citer un nom, « la liste
  exacte des endroits où il faut apparaître ». Vérifié avant de l'écrire :
  Gemini, ChatGPT, Perplexity et Grok remontent bien leurs URL quand la
  recherche web est active.
- *Réserver* portait un titre de trois lignes en 30px et un bloc gris de deux
  paragraphes : « trop gros et compact ». Titre ramené à une phrase, et
  « l'épreuve du direct » (rejouer une question en visio) retirée sur
  demande. Elle est vraie, mais c'est un détail de déroulé sur l'écran où le
  prospect doit décider.

---

## 2026-08-14 — Le formulaire tombe à deux champs : on lit au lieu de demander

Luigi, sur le secteur et la ville : « si ça change rien de le demander, autant
le supprimer quand l'user lance le scan ». C'était vrai depuis le matin même :
la génération lit la page d'accueil EN PRIORITÉ, le secteur n'était plus qu'un
troisième filet. Mais il reste utile en aval — désambiguïsation de la question
miroir, classement des concurrents, corrections humaines par secteur,
vocabulaire du rapport. Donc on ne le supprime pas : **on le déduit**.

`deduireMetier(marque, matiereSite)` lit l'extrait du site et renvoie le
métier en trois mots et la ville. Deux règles dedans, chacune tirée d'un
piège déjà payé : la ville n'est renvoyée QUE pour une clientèle locale (une
marque nationale ne doit pas hériter d'une adresse de siège, sinon un quart
de l'échantillon repart en questions de quartier), et le modèle doit renvoyer
vide plutôt qu'inventer. Le résultat est ÉCRIT en base (`scans.sector`,
`scans.city`) pour que tout l'aval en profite, et jamais écrasé s'il existe
déjà — le toolkit continue de poser les siens sur les scans par lot.

**Le formulaire tombe donc à deux étapes** : le site et la marque, puis
l'email. Ce qui reste demandé est ce qu'aucune lecture ne peut donner.

**Et le prospect voit ce qu'on a compris.** Sous le nom de la marque, sur
l'écran de mesure : « Compris : boulangerie pâtisserie · Paris ». C'est la
preuve visible que « on lit votre site » n'est pas une formule. L'étape 01 ne
pouvait pas la porter — elle n'est plus l'étape active quand la déduction
arrive.

Vérifié sur deux profils : boulangerie-utopie.com donne « boulangerie
pâtisserie · Paris » et des questions de client parisien qui cherche du pain ;
leboncoin.fr, qui répond 403 aux robots, ne donne aucune matière — la
déduction se rabat alors sur la marque connue, et l'échantillon parle de
petites annonces, de portails immobiliers et de jobboards. Un site illisible
ne prive plus l'aval de contexte.

---

## 2026-08-14 — La dernière carte vendait le cas où il ne se passe rien

Luigi, sur la carte de réservation : « ça vend mal et pas la vérité de ce
qu'on va lui montrer ». Elle titrait « Si votre score est bon, on vous le dit
et on ne vous vend rien » — la plus belle phrase du site, et la pire en TITRE
de l'écran où le prospect doit cliquer : elle met en avant le cas où il ne se
passe RIEN.

La carte dit maintenant ce qui se passe vraiment : « Réservez, et la mesure
complète part aussitôt. Nous la lisons ensemble. » Puis le fait qui change
tout : ce n'est pas un appel de découverte, les 144 réponses sont déjà
collectées quand on se parle. Le panneau de preuve, jusque-là presque vide,
porte le déroulé en trois temps — AVANT (la mesure tourne : 24 questions, six
moteurs, recherche web), PENDANT (on ouvre le rapport : note par moteur,
sites où les concurrents sont trouvés, cause de chaque absence), À LA FIN
(les actions classées, et celles qu'il peut faire seul). Chaque ligne
correspond à une section réelle du rapport complet. Le renoncement reste,
à sa place : en réassurance, en bas.

**Et l'annexe des questions cesse d'être un secret.** Ouverte par défaut ne
suffisait pas : elle vit en bas d'une page dont le contenu principal tient
dans un écran, personne ne descend. Deux accès permanents : un lien dans la
barre haute (« Les 20 questions ↓ », visible dès la première carte) et un
bouton juste sous la séquence, sur le fond sombre. Une ancre les relie.

---

## 2026-08-14 — L'audit des huit agents : ce qui dormait, ce qui mentait

Luigi voulait deux choses : mieux vendre le diagnostic sur ses trois surfaces,
et sortir du gratuit ce qu'on avait déjà payé. Un workflow de huit agents a
inventorié la machine (aperçu, complet, sprint), relevé les trois surfaces
mot pour mot, écrit le copy, et un dernier agent a contrôlé chaque promesse
contre le code. 36 verdicts : 25 vrais, 11 à corriger, 1 faux.

**Ce que le contrôle a sauvé.** Les deux inventaires classaient en tête un
argument imparable — « Fiducial, que vous nous avez cité, apparaît 42 fois,
vous 25 » — adossé à `scans.concurrents_suivis`. Or le formulaire envoie
`concurrents: []` depuis le passage à trois étapes le matin même : la colonne
est vide pour tout nouveau scan. Un site entier de promesses aurait été bâti
sur une donnée morte. Deuxième prise : « 739 sources » est un relevé UNIQUE
et non une moyenne, à ne jamais afficher comme constante.

**Une violation de doctrine, coupée.** « Nous en tenons 3 par semaine »
(carte réservation) : aucun compteur n'enregistre cette rareté. C'était la
seule affirmation invérifiable du parcours.

**Une promesse rompue par mon propre commit, réparée.** Depuis que le rapport
GRATUIT affiche le miroir et l'audit des robots, le rapport COMPLET — qui les
promet dans son tableau — ne les rendait NULLE PART. Un rapport payant qui
tient moins que l'aperçu qu'il prolonge : sections `miroir` et `technique`
ajoutées au document de mesure.

**Ce qui sort du sommeil dans le gratuit.** Les quatre composantes du score
(présence 50 %, rang 20 %, recommandation 20 %, tonalité 10 %) étaient
calculées et enregistrées à chaque scan sans jamais être montrées : elles
transforment un chiffre opaque en diagnostic lisible sans rien livrer du
rendez-vous. Avec le dénominateur réel, pannes exclues — la règle la plus
chèrement apprise du projet devient un argument de vente.

**La ligne gratuit/premium, telle que le contrôle la trace.** Deux murs sont
posés par le code et ne bougeront pas : l'aperçu ne peut pas produire de
sources (recherche web coupée) ni servir de point zéro au J+90 (`rescan`
refuse un aperçu). Tout le reste est un choix d'affichage. Ce qui reste
DEHORS, volontairement : les dix actions en clair — les afficher viderait le
rendez-vous, c'est le contenu le plus proche de la livraison.

**Et la vente, sur les trois surfaces.** Sept lignes au comparatif dont « une
mesure de départ rejouable à l'identique dans 90 jours », le seul argument
verrouillé par le code lui-même. Le récit requalifie ce que le prospect vient
de lire : deux moteurs qui ont répondu DE MÉMOIRE. Le spécimen du héros
annonce « LE DIAGNOSTIC OFFERT VÉRIFIE » (il est à 0 €, la landing ne le
disait qu'en bas de page) et ses cinq lignes deviennent des questions de
dirigeant. Corrections de justesse au passage : « 3 corrections » devient
« 10 actions classées » (c'est ce que le générateur produit), « 6 moteurs »
devient « une par moteur » (un moteur en panne sort du miroir), et
« facturé plusieurs centaines d'euros ailleurs » est supprimé — une
affirmation sur le marché qu'on ne peut pas prouver.

---

## 2026-08-14 — Les 144 réponses étaient déjà dans la page, invisibles

Luigi : « on vend 144 réponses et on n'en montre que quelques-unes ». Vérifié :
le rapport complet servait une grille questions × moteurs (position,
recommandation, trois concurrents) et cinq verbatims. Le TEXTE des réponses,
lui, n'était affiché nulle part — alors que `rapportParJeton` envoyait déjà
`raw_text` au navigateur depuis toujours. La pièce la plus convaincante du
produit voyageait dans la page et personne ne la voyait.

`ToutesLesReponses` : une question par ligne dépliable (`<details>` natif,
zéro JavaScript, imprimable), et sous chacune, chaque moteur avec son statut
(position, recommandé, concurrents cités) puis sa réponse intégrale. Les
moteurs répondent en markdown léger : `TexteMoteur` rend les gras et retire
les marqueurs, sans réécrire un mot.

**Elle sert les DEUX rapports, et c'est un choix de doctrine.** Au complet,
c'est la section 05, la démonstration de ce qui est facturé. À l'aperçu,
c'est une annexe repliée sous la séquence : nous avons posé ces 20 questions,
les cacher à un prospect qui veut vérifier contredirait tout ce que le site
promet. Le tunnel de conversion reste intact (elle est fermée par défaut,
après les six cartes), et ce qui reste au diagnostic est ailleurs — quatre
moteurs de plus, la recherche web, les sources, la cause de chaque absence,
le plan. On ne vend pas l'accès à nos données : on vend leur lecture.

---

## 2026-08-14 — La ville n'est plus imposée : le mix suit la portée de l'entreprise

Luigi, en testant Netflix : « est-ce vraiment nécessaire de mettre secteur et
ville ? » La question portait plus loin qu'un champ de formulaire.

**La ville était obligatoire de fait, et elle faussait la mesure.** Le mix
imposait 4 questions locales sur 20 quelle que soit l'entreprise : pour une
marque nationale, un cinquième de l'échantillon partait en « meilleur service
de streaming à Paris ? ». Ces questions ne mesurent rien — personne ne
cherche un abonnement SVOD par quartier — et leur absence de citation faisait
BAISSER le score d'une marque qui n'a pas de clientèle locale.

Le mix est désormais adaptatif : avec ville, inchangé ; sans ville, aucune
question locale, redistribuées sur les comparatives et les problèmes (20 =
11/6/3). Le prompt reçoit explicitement « clientèle NATIONALE, aucune
question ne doit nommer une ville ». Le champ devient facultatif ET porteur
de sens — le remplir déclare une clientèle locale — avec une aide qui dit
laquelle des deux mesures va tourner.

Vérifié en réel : netflix.com, secteur « Streaming vidéo par abonnement »,
sans ville → 11 comparatives, 6 problème, 3 confiance, zéro locale, et des
questions sur les catalogues et les abonnements sans engagement.

**Quant au secteur introuvable** : il était déjà libre depuis la refonte de
l'heure précédente, mais son placeholder ne montrait que des métiers de PME
locales (« expertise comptable, agence immobilière, poker en ligne »), ce qui
laissait croire à une liste fermée. Il montre maintenant « streaming vidéo »
en premier exemple.

---

## 2026-08-14 — Le formulaire perd une étape, le secteur devient libre

Deux décisions de Luigi sur le formulaire, appliquées ensemble.

**L'étape « concurrents » est retirée** (4 étapes → 3 : site → secteur et
ville → email). La mesure découvre les concurrents elle-même — les noms tapés
n'étaient JAMAIS soufflés aux moteurs, ils n'alimentaient que l'accroche
d'email « Vous nous avez cité X. Les IA aussi. » et le bloc du rapport
complet. Ces deux consommateurs sont conditionnels et se taisent sans
donnée ; la colonne `scans.competitors` reste, les scans historiques gardent
la leur. Ce qu'on perd, en conscience : la meilleure accroche de la série
d'emails pour les futurs leads du site (les prospects du toolkit n'en ont de
toute façon jamais eu).

**Le secteur se tape librement**, nos verticales en suggestions filtrées.
« Poker en ligne » vaut mieux que le « Autre » de l'ancien menu : le texte
libre nourrit la génération (troisième filet derrière le site et la marque),
la question miroir et le classement des concurrents. Le serveur acceptait
déjà n'importe quel texte — seul le composant l'interdisait. La liste
`SECTORS` reste la taxonomie de NOS segments (baromètre, corrections par
secteur, gabarits) : les scans par lot la posent programmatiquement, le
texte libre des prospects ne la fragmente pas.

---

## 2026-08-14 — Booking classé « géant »… pour Airbnb : la relativité du classement était un vœu

Luigi : « pourquoi ça parle d'Abritel alors que Booking est bien plus sérieux
comme concurrent ? » La carte privilégie les rivaux — c'est la règle voulue —
mais Booking.com était classé GÉANT pour Airbnb, donc écarté. La définition
de « géant » dans le prompt de classement était ABSOLUE (« hors de portée
d'une PME ») : Booking coche « groupe international » quel que soit le
client. La relativité annoncée par CLAUDE.md n'existait que dans
l'intention.

Le prompt classe désormais STRICTEMENT du point de vue de l'entreprise
suivie, avec le test opérant : « un client qui hésite entre les deux
existe-t-il ? Si oui, c'est un rival » — et la précision explicite : si
l'entreprise suivie est elle-même un acteur mondial, ses pairs immenses sont
des rivaux. Le scan Airbnb existant a été corrigé à la main (Booking.com →
rival, l'équivalent d'un `concurrents --corriger`) : la carte lit « Vous
menez. Booking.com reste dans la conversation », 14 contre 6.

---

## 2026-08-14 — « Trop d'erreurs » : la couche de présentation gagne ses invariants

Scan Airbnb de Luigi : « Abritel est nommé plus souvent que vous » au-dessus
de barres qui montraient 5 contre 14, et la carte 02 comptait 14 là où la
carte 04 comptait 13. Son constat, juste : « à chaque nouvelle recherche je
découvre une erreur, on doit faire quelque chose ».

Le diagnostic de fond : le MOTEUR a ses 216 tests, mais la couche qui
PRÉSENTE la mesure (titres, sélections, comptages du rapport) n'en avait
AUCUN. Chaque profil de scan nouveau — absent, derrière, à égalité, leader,
mono-moteur — trouvait donc son trou, et c'était Luigi qui le trouvait.

**Les correctifs** : `carteConcurrent` devient une fonction pure à trois
régimes (derrière / à égalité / devant) — le leader lit « Vous menez.
Abritel reste dans la conversation », le kicker passe à « qui vise votre
place », les barres se réordonnent, le récit parle d'érosion et non d'une
absence fictive. Et `partDeVoix` (couche d'affichage) regroupe toutes les
graphies de la marque cible sous un seul nom : 14 = 14 partout. Attention :
il existe DEUX `partDeVoix` à dessein — celui de `score.ts` est l'artefact
de mesure figé (citations, `share_of_voice`), ne jamais le « corriger ».

**La réponse systémique** : `tests/rapport-sequence.test.ts`, 14 invariants
de cohérence qui rejouent chaque bug du jour et chaque profil : le titre ne
contredit jamais ses propres chiffres, la pièce du verbatim est crédible ou
n'existe pas (le cas GeoComply est un test nommé), jamais un outil ou une
institution en adversaire, les cartes 02 et 04 comptent la même chose, la
ligne « Vous » est unique. 230 tests. La règle léguée : **quand un écran du
rapport ment ou se contredit, on écrit l'invariant AVANT le correctif** —
c'est la machine qui doit trouver ces erreurs, pas Luigi.

---

## 2026-08-14 — Le rapport apprend la pertinence : verbatim à deux étages, un seul comparatif

Luigi, trois captures à l'appui : la « phrase exacte » montrait GeoComply (un
éditeur B2B de géolocalisation) sur une question de dépannage ; le comparatif
de la carte diagnostic était maigre ; et la modale « ce que vous apprenez »
répétait un second comparatif par-dessus le premier.

**Le verbatim se choisit désormais en deux étages.** L'ancienne règle — « le
concurrent le mieux placé sur une question sans la marque » — était exacte et
creuse : aucune douleur commerciale. Nouvelle sélection :

- étage 1, L'ABSENCE : un concurrent CRÉDIBLE (classé rival ou géant ; un
  non-classé n'est accepté que sur une question d'ACHAT — le garde-fou
  anti-GeoComply, qui n'était pas classé et passait par le défaut « rival »)
  cité là où la marque n'apparaît pas, questions comparatives et locales
  d'abord, l'adversaire de la carte 02 favorisé pour que les cartes racontent
  une seule histoire ;
- étage 2, LE DÉPASSEMENT, pour les marques bien citées qui n'ont presque
  aucune question d'absence : la phrase où un rival est cité DEVANT la marque
  dans la même réponse (« Betclic cité en premier · Winamax : cité en
  position 2 »). La vraie brèche d'un 85/100 ;
- aucun étage ne fournit → la carte sort de la séquence. Jamais de pièce
  tiède présentée comme une douleur.

Vérifié sur les deux profils réels : Fiducial (31) montre une absence sur
« quels critères pour choisir entre un grand cabinet national et un cabinet
indépendant » ; Winamax (85) montre Betclic devant sur la réglementation des
bookmakers.

**Un seul comparatif, le plus vendeur.** La modale est supprimée ; son
tableau « ce que vous apprenez » (96 réponses des quatre moteurs fermés,
recherche web, sites exacts, miroir sur 6 moteurs, corrections vous/dev)
devient LA preuve de la carte 05, et sa réassurance (« si votre score est
bon, on ne vous vend rien ») rejoint le récit. Le CTA avance simplement vers
la réservation. Et le titre de la carte s'adapte au score : dire « vous
n'êtes pas cité » à un 85/100 était faux — au-dessus de 50, il devient
« vous savez maintenant OÙ vous êtes cité, pas encore comment tenir la
place ».

**Et la génération interdit le SAV.** Les questions « problème » sont
désormais cadrées comme des douleurs d'AVANT-achat (se méfier, comparer,
éviter un piège) : une IA qui répond à une question de dépannage ne fait
perdre de client à personne, elle n'a rien à faire dans un échantillon qui
mesure la découverte.

---

## 2026-08-14 — Winamax : la redirection qui boucle, et OpenAI à sec à son tour

Le scan Winamax de Luigi, POSTÉRIEUR au correctif Unibet, sortait encore des
questions ERP/CRM et un 0/100. Deux couches de plus sous l'oignon.

**La lecture du site échouait silencieusement** : winamax.fr accueille un
client sans cookies par une 302 « switch_language » qui boucle à l'infini —
`redirect: "follow"` explosait (« redirect count exceeded »), la matière
revenait vide, et le générateur retombait sur « Secteur : Autre » et brodait.
`matiereDuSite` suit désormais les redirections À LA MAIN (5 sauts max), en
conservant les cookies entre les sauts, avec `Accept-Language: fr` (qui
suffit à éviter la plupart des aiguillages de langue) et un en-tête
navigateur. Vérifié : winamax.fr répond 200 au premier saut.

**Et le prompt refuse maintenant d'inventer.** La marque est passée en
CONTEXTE (« jamais dans les questions », la règle tient) pour ancrer le
métier quand le site reste illisible ; l'ordre de vérité est site → marque
connue → secteur précis ; si aucun ne suffit, le modèle doit renvoyer zéro
question et la génération échoue franchement : un échec honnête vaut mieux
qu'un faux score sous nos couleurs.

Rejoué en réel : winamax.fr, secteur « Autre » — questions paris
sportifs/poker ANJ/cotes, **85/100, cité dans 19 réponses sur 20 valides**.
Le chiffre que le réel commande.

**Mais la même mesure a révélé la panne suivante : OpenAI est à sec.**
`OpenAI [429] « You have no credits remaining »` — les 20 réponses ChatGPT
du scan en erreur. La règle du dénominateur a tenu (le 85 est calculé sur
les 20 réponses Gemini valides), mais l'aperçu tourne de fait sur UN moteur.
Google rechargé à 18 h, OpenAI mort vers 18 h 10 : les crédits moteurs
partent en cascade le jour où on teste fort. À recharger par Luigi sur
platform.openai.com avant tout scan sérieux — et le baromètre à 100 scans
exigera des soldes provisionnés d'avance.

---

## 2026-08-14 — La génération lit enfin le site : l'affaire Unibet

Luigi, crédit Google rechargé, relance un scan : « résultat en 2 secondes,
complètement faux ». Les deux moitiés s'expliquent, et la seconde est le bug
le plus grave attrapé avant lancement.

**Le « résultat en 2 s »** était le cache de 3 jours : son scan Unibet de
17 h 05 (réel, 87 s, 40 réponses, zéro erreur — passé quelques minutes avant
la mort du crédit Google) était resservi tel quel au re-scan du même domaine.
Comportement voulu et documenté, mais désorientant en phase de test.

**Le « complètement faux »** était vrai : Unibet, secteur « Autre », ville
Paris — et les vingt questions générées parlaient de LOGICIELS SIRH ET DE
PAIE. Le générateur ne recevait que `Secteur : Autre. Zone : Paris.` et le
modèle a brodé un métier. Le 0/100 qui en sortait était un artefact présenté
comme une mesure — l'exact contraire du produit.

La correction : `matiereDuSite(url)` lit la page d'accueil (titre,
description, texte, 1 200 caractères, 6 s de délai, tolérante) AVANT la
génération, et le prompt reçoit l'extrait comme « source de vérité du
métier », avec l'interdiction explicite d'inventer au-delà. Le domaine étant
obligatoire au formulaire, la matière existe pour tous les scans. L'étape
« On lit votre site » de l'écran d'attente devient enfin vraie.

Vérifié en réel sur le même cas : re-scan d'unibet.fr/poker, secteur
« Autre » — les questions parlent d'applications de poker agréées, de
Winamax, de rakeback ; score 50/100, plausible pour cet acteur. Les deux
scans empoisonnés (Unibet-SIRH, Exco-429) sont supprimés de la base, leurs
leads passés `converti`.

Leçon de doctrine : un scan dont l'échantillon rate le métier ne mesure
rien, et il coûte plus qu'un échec — il fabrique un chiffre faux sous nos
couleurs. La matière du site n'est pas un raffinement, elle est la condition
de validité de l'échantillon.

---

## 2026-08-14 — Vingt secondes de vide, un piège de refs, et Gemini à sec

Luigi, à juste titre furieux : l'écran « Analyse Citari » n'apparaissait que
20 secondes après le lancement. Trois causes emboîtées, découvertes dans
l'ordre inverse de leur gravité.

**1. L'écran ne se nourrissait qu'à la boucle de pilotage.** `suivreScan`
fait avancer la machine PUIS renvoie l'état ; sa première marche est la
génération des questions, ~20 s d'IA, pendant lesquelles la page n'avait
rien. Corrigé par une séparation lecture/pilotage : `lireScan` (lecture pure,
trois SELECT) nourrit l'écran à la seconde ; `suivreScan` pilote en
parallèle, inchangé. L'écran apparaît en coquille AVANT même le premier
battement (jamais de page vide), et mesuré à 1,5 s après le clic au lieu de
20. En prime, la fin est scellée À L'ÉCRAN : 100 %, cinq étapes faites,
« Mesure scellée · ouverture de votre rapport… », puis la redirection.

**2. Le piège `useServerFn`, déjà documenté, retendu par moi.** Cette
fonction rend une identité NOUVELLE à chaque rendu — c'est écrit noir sur
blanc dans le commentaire de la boucle, qui avait coûté une facturation
double. Ma boucle de lecture provoquant un rendu par seconde, l'effet de
pilotage (qui dépendait de l'identité) se démontait et se relançait chaque
seconde : un `avancerScan` de plus en vol à chaque battement, conflits de
verrou, huit échecs, « MESURE INTERROMPUE ». Règle apprise : **tout effet de
boucle ancre ses fonctions serveur dans des refs et ne dépend que de
l'identifiant.** Un garde de monotonie protège aussi contre deux réponses
revenues dans le désordre.

**3. Et sous tout ça : le crédit Google est épuisé.** `Google [429] « Your
prepayment credits are depleted »` sur la génération. La panne exacte
d'Anthropic du 06/08, côté Google : gemini-3.1-flash-lite (génération et
analyse) ET le moteur Gemini de l'aperçu sont morts tant que le compte
AI Studio n'est pas rechargé. Les scans du matin passaient encore ; les deux
« × » Gemini sur compta-clementine étaient sans doute l'agonie du solde. Le
prospect voit le message neutre, le 429 reste en base : ce garde-fou-là a
fonctionné. À recharger par Luigi sur AI Studio avant tout scan.

---

## 2026-08-14 — L'écran de scan que Luigi attendait était l'autre

Luigi, capture à l'appui : « tu as carrément pas mis ça sur le screen ».
Jérémie a DEUX écrans de scan dans son projet, et le port avait pris le
mauvais des deux. La carte perforée (`scan-loading/LoadingScreen`) est celle
que SA route réelle utilise ; mais le split-screen « Analyse Citari / Flux de
données » (`CitariScanScreen`), écarté parce que sa version tourne sur une
horloge simulée, est celui que Luigi voyait sur le Lovable et voulait. La
leçon : **bannir une simulation n'oblige pas à bannir son design** — son
composant acceptait d'ailleurs une progression réelle en prop.

Porté en le branchant sur `etatScan`, avec les gardes d'honnêteté :

- les 5 étapes affichées suivent la phase réelle (lecture du site, écriture
  des questions, interrogation, lecture, score) — libellés réécrits pour
  correspondre à NOTRE pipeline, pas au sien ;
- « TEMPS ÉCOULÉ » réel remplace son « TEMPS RESTANT » deviné ;
- le ticker montre la latence mesurée de la dernière réponse (« Gemini ·
  18 515 MS ») ou « indisponible », jamais ses verdicts tirés d'un modulo ;
- une étape sans mesure interne montre un reflet qui balaie, pas une fausse
  fraction ; l'interrogation, elle, a sa vraie fraction (réponses/total) ;
- compteurs par moteur comptés sur les lignes de `responses`, verrouillés
  affichés seulement en aperçu.

Vérifié par un scan réel (cerfrance.fr) : le plafond de 2 scans/IP a d'abord
refusé — il a fallu le passer à 3 LOCALEMENT le temps du test, remis à 2
aussitôt. Les deux leads de test (contact@citari.fr) sont passés `converti`.

**Et les cartes du rapport retrouvent les teintes exactes de sa maquette.**
Le port faisait passer les neutres par nos jetons hérités : carte en blanc
PUR (--surface) au lieu de son blanc chaud #FFFDF9, libellés plus pâles,
filets translucides plus froids. Multiplié par six cartes, c'est ce que Luigi
voyait comme « moins beau, des erreurs d'esthétique ». Les neutres reprennent
ses valeurs en dur (documenté dans `rapport/theme.ts`) ; encre, papier et
signal restent NOTRE charte.

---

## 2026-08-14 — La revue de lancement : tout le parcours, route par route

Dernier balayage avant mise en ligne, demandé par Luigi (« revérifie tout,
répare sans mon accord »). Les onze routes ont été servies et lues, les
fonctionnalités pilotées une à une dans le navigateur.

**Ce qui a été réparé :**

- **La route `/admin` du site est supprimée** (avec `admin.functions.ts`).
  C'était le second back-office documenté depuis des semaines comme « à faire
  disparaître avant la mise en ligne » : il lisait les emails de `leads`
  derrière son propre mot de passe, jamais configuré. Le seul back-office est
  `apps/admin`. La route répond désormais 404 comme n'importe quelle adresse.
- **Le badge CITARI flottant rognait le titre du héros sur mobile** : la
  maquette posait `pt-12` sous une marque en `fixed top-5`. Passé à `pt-24`
  en mobile, inchangé en desktop.

**Ce qui a été vérifié fonctionnel, en pilotant réellement :**

- les 7 pages publiques rendent en 200 avec leurs titres ; `/admin` et une
  adresse au hasard rendent le 404 français ;
- le calculateur : ses curseurs sont des `role="slider"` custom (pas des
  `input range`, ne pas s'y tromper en le testant) ; pilotés au clavier, la
  formule recalcule (8 clients × 38 % × 3 050 € = 9 272 €) ;
- la FAQ : 5 questions affichées puis « voir plus » (+5), c'est le design v3
  voulu — les 20 questions et leurs ancres sont toutes dans le DOM après
  déroulé, et le JSON-LD `FAQPage` sert les 20 aux machines dès le premier
  rendu. Ne pas « corriger » ce décalage : il est le produit ;
- les liens du pied (7 pages + mailto), les 6 ancres de la barre latérale,
  le favicon, la pulsation du champ, le 404, les groupes COMPRENDRE/L'OFFRE ;
- séquence de rapport vérifiée en mobile (preuve d'abord, récit ensuite).

Console : trois erreurs, toutes des artefacts de la vérification elle-même
(WebSocket HMR d'un serveur tué, deux sondes 404 volontaires). Rien du site.

**Et le logo a perdu son cartouche** (même jour, décision Luigi) : la pastille
papier autour de la marque lisait comme « un fond blanc » — le PNG est
transparent, il se pose maintenant nu sur la page. Et il passe de `fixed` à
`absolute` : il appartient au haut de la page et défile avec elle, toujours
encre sur clair, jamais au-dessus d'une section sombre. Au passage, un vrai
bug attrapé PUIS devenu sans objet pour le logo mais corrigé pour la barre
latérale : la détection de fond sombre remontait les ancêtres en lisant
`backgroundColor`, or les sections sombres sont peintes par un ENFANT absolu
(`.quad-sombre`, en `pointer-events: none`, invisible d'`elementFromPoint`).
`lib/fond-sombre.ts` inspecte désormais aussi les quadrillages directs de
chaque ancêtre ; la barre latérale s'en sert.

---

## 2026-08-14 — Le second passage v3 : l'écran de scan et Calendly

Luigi a revu le site et a eu raison de renvoyer au travail : « il manque plein
de choses, par exemple quand je lance le scan ». Le premier passage v3 avait
couvert la landing et le rapport, pas l'écran d'attente ni la réservation. Un
balayage systématique de TOUS ses fichiers actuels a fermé l'écart.

**L'écran de scan remis au niveau v3** (le sien avait été retravaillé) :

- chronomètre rafraîchi à 100 ms, fluide au lieu de sautiller à la seconde ;
- un moteur qui a répondu dans les 4 dernières secondes porte une pastille
  signal qui respire, dans l'en-tête de sa colonne — il a fallu ajouter
  l'instant d'écriture (`creeA`) aux cellules d'`etatScan`, l'état ne portait
  que le fait, pas le moment ;
- le ticker devient une liste de trois lignes animées (pastille + moteur +
  latence réelle) ; une panne garde sa ligne, pastille éteinte,
  « INDISPONIBLE » — elle ne fait pas semblant d'être une réponse ;
- l'analyse compte **quatre** étapes (parts de voix et assemblage du score
  manquaient), allumées une à une, chacune avec sa mini-barre ;
- cases arrondies qui tombent en cascade (délai par colonne), en-têtes
  verticaux sur mobile, espacements v3.

Gardé contre sa maquette : les « × » d'erreur dans la grille (chez lui une
panne est invisible), nos libellés (« DIAGNOSTIC COMPLET »), notre rotation
des en-têtes verticaux (la sienne colle le nom sur la colonne voisine).

**La réservation est réelle et préremplie.** Jérémie a créé l'événement
Calendly collectif (Round Robin, lui + Luigi) : l'URL vivait déjà dans notre
`site.ts`, mais sa v3 préremplit l'email du lead. Porté : le formulaire garde
l'email en `sessionStorage` à la soumission (jamais dans l'URL du rapport), la
page de rapport le relit, la modale Calendly arrive remplie — email, marque,
nos couleurs. Un rapport rouvert sur une autre machine s'en passe, simplement.

**Vérifié par un scan réel payé** (~0,14 €) : compta-clementine.fr, lancé au
formulaire, écran v3 observé en direct (cascade, pastilles, ticker avec
14 404 MS de vraie latence Gemini, deux pannes marquées ×), redirection vers
la séquence, Calendly préremplie contrôlée dans l'iframe. Le lead de test
(contact@citari.fr) est passé `converti` sitôt le test fini : ce statut est
refusé par `envoyer`, notre propre boîte ne recevra jamais une relance.

Le reste du balayage n'a rien trouvé d'autre à porter : formulaire, Reveal,
vague, étincelles, fond de page, barre de lecture, focus pulsé du champ,
`brandFromDomain` — tous déjà au niveau. Ses `RotatingText`/`ScrollFloat`
restent inutilisés chez lui aussi ; son `SELF_SCORE = 61` reste refusé (aucun
scan enregistré ne le soutient).

---

## 2026-08-14 — Front v3 : la séquence remplace la page longue

Jérémie a retravaillé son Lovable en profondeur et Luigi a demandé le report
intégral, avec une insistance : « il y a des animations 3D magnifiques, ne les
oublie pas ». Ces animations sont `StrokeText` (texte SVG en contour rempli
par balayage de masque, trait de tête couleur signal) et le `Quadrillage`
dérivant : elles ne s'affichaient pas dans SON aperçu Lovable, d'où sa crainte.
Tout le port passe par nos fonctions serveur ; rien de sa couche données.

**Ce qui a changé de structure.**

- La navigation n'est plus un bandeau : marque flottante, contact flottant,
  et une barre latérale de sections qui détecte la luminosité sous elle
  (`elementFromPoint`) pour rester lisible sur les sections sombres.
- Le pont problème/solution en StrokeText s'insère entre le héros et le
  calculateur, refait en deux cartes de preuve (McKinsey 38, Arcom 56,6).
- Procédure, FAQ (20 questions, 2 groupes, ancres et JSON-LD), CTA final et
  pied de page passent en sombre.
- **Le rapport d'aperçu n'est plus une page longue mais une séquence de six
  pop-ups** : score → qui prend votre place → la phrase exacte → part de voix
  → diagnostic → réservation. Une carte à la fois, dont l'utilisateur ne peut
  pas rater le verbatim. `RapportApercu.tsx` supprimé ; `rapport-apercu.ts`
  réduit aux dérivations que la séquence consomme ; l'assemblage vit dans
  `rapport-sequence.ts`. Les étapes sans donnée (pas d'adversaire, pas de
  verbatim) sortent de la séquence : jamais de carte vide. Le document de
  mesure des modes `complet`/`controle` n'a pas bougé.

**Ses suppressions ne sont pas symétriques des nôtres.** Il a effacé sa page
`/methode` et son écran de scan démo. Le scan démo reste banni comme avant,
mais `/methode` est CONSERVÉE : c'est notre engagement de vérifiabilité, pas
un choix de maquette. Elle garde le pied de page sombre du v3.

**Corrections de doctrine faites pendant le port**, parce que sa maquette
vendait plus large que ce qu'on mesure : la FAQ disait le scan gratuit sur
4 moteurs (c'est 2) ; « la plupart de nos prospects » supposait des prospects
qu'on n'a pas ; son score auto-affiché 61 n'existe dans aucun scan enregistré
(le nôtre reste absent tant qu'il n'est pas mesuré) ; « Ledgio est nommé deux
fois plus souvent » était codé en dur, la carte le calcule ; le coût affiché
de l'appel passe de 2 € à « environ 1 € », notre coût réel ; la modale disait
« robots non vérifiés en aperçu » alors que l'audit flash tourne pendant le
scan gratuit — la ligne vendable et vraie, ce sont les sources, activées
seulement au diagnostic. Un résidu de sa numérotation commerciale
(« ÉTAPE 02 ») lisait comme un compteur cassé à côté du « 05 / 06 » de la
carte : retiré.

**Le piège du port : l'id aléatoire en SSR.** Son `StrokeText` tirait l'id du
masque SVG avec `Math.random()`. Le site étant rendu côté serveur, l'id du
serveur et celui du client divergeaient à chaque hydratation et React marquait
l'arbre entier « won't be patched up » : quatre erreurs console sur la landing.
`useId()` règle le cas. Règle à retenir pour tout composant porté de Lovable
(qui rend côté client uniquement) : **aucun aléa dans le rendu**.

Vérifié : séquence complète cliquée sur le vrai aperçu Fiducial (score 31,
In Extenso 30 contre 13 réponses sur 40, verbatim Gemini avec Dougs marquée),
document Dougs complet intact, 216 tests, typecheck, build de production.

---

## 2026-08-14 — Les emails apprennent à lire tout le scan

Luigi a jugé les emails trop génériques : « ça vend pas assez notre
technologie, c'est pas assez personnalisé ». Le diagnostic était juste, et la
réponse n'était pas d'ajouter des adjectifs : la personnalisation qui
convainc, ce sont les données du prospect, et les gabarits n'exploitaient
qu'un dixième du scan. Trois plumes concurrentes, un contrôle de doctrine et
un jury (un dirigeant de cabinet fictif, sévère) ont produit les nouveaux
blocs ; le composite du jury est intégré tel quel, avec ses corrections.

**Trois blocs nouveaux dans le mail 0**, chacun nourri de données qui
existaient en base sans servir :

- **Le miroir** : ce que ChatGPT répond quand on lui demande QUI est le
  prospect. Sa fiche d'identité dans les IA, datée ou inventée, « qui se
  répète à chaque personne qui pose la question ». La pièce la plus
  personnelle du scan, et elle dormait dans `scans.miroir`.
- **L'analyste** : « voici ce que votre score ne montre pas » — ventilation
  comparatives/locales, position moyenne quand cité, rang parmi les N marques,
  moteur faible et moteur d'appui. Chaque phrase ne sort que si sa donnée
  existe.
- **Le protocole** : la technologie vendue en trois faits vérifiables (nom
  jamais prononcé dans les questions de mesure, scellement rejoué à J+90,
  panne exclue du calcul). Placé juste avant l'offre : c'est lui qui la rend
  crédible.

**Le piège d'unité, attrapé par le jury.** Le premier jet comptait la
ventilation en questions ; le rapport compte en réponses. L'email et la page
qu'il ouvre auraient affiché deux nombres justes qui se contredisent,
exactement le défaut corrigé sur le rapport le 09/08. Tout le bloc analyste et
l'accroche « écart » comptent désormais en réponses (`reponsesTotal`,
`reponsesAvecMarque`, `topCompetitor.reponses`).

**La cohérence interne comme argument.** Le protocole jure « jamais votre
nom », le miroir le prononce : le bloc miroir s'annonce donc lui-même comme
« la seule question qui prononce votre nom ». Un dirigeant qui repère une
contradiction dans l'email doute de toute la mesure ; l'exception explicitée
renforce la doctrine au lieu de l'écorner. Un test le verrouille.

**Les objets réécrits par le jury.** « Vous nous avez cité In Extenso. Les IA
aussi. » (son mot, retourné avec une information) · « La phrase où une IA
recommande votre concurrent » (l'article défini promet une pièce) · « Les IA
répondent à vos clients sans vous citer ». Le mail « solide » gagne sa seule
demande : inviter à transférer l'email à un confrère, le scan étant gratuit.

**Et la coupe des verbatims finit sur une phrase.** « et accompagnemen... »
en plein milieu d'un « mot pour mot » ruinait ce qu'il prétendait prouver.
`coupePhrase` cherche la fin de phrase, à défaut la frontière de mot, et
l'ouverture d'accroche passait encore par l'ancienne coupe : corrigé aux deux
endroits. 216 tests, envoi réel du nouveau mail 0 Fiducial vérifié en boîte.

---

## 2026-08-10 — L'emailing envoie enfin, et il sait surtout refuser

Les 13 gabarits existaient, testés, remplis avec les vrais chiffres ; rien ne
partait, faute de tuyau. Le tuyau existe : `pnpm toolkit envoyer`, appel HTTP
direct à Resend, sans SDK, texte brut uniquement (décision documentée dans
Notion : un domaine neuf qui envoie du HTML part en indésirables, et en B2B de
dirigeant à dirigeant le texte convertit mieux).

**Le module est écrit à l'envers : d'abord les refus.** Un email raté ne se
rattrape pas, il n'y a pas de bouton « dépublier » dans la boîte d'un prospect.
`decisionEnvoi` est une fonction pure, testée, qui refuse : désinscrit,
converti, statut inconnu (dans le doute on s'abstient), mail 0 périmé au-delà
de 3 jours (« votre scan est terminé » dix jours après est absurde), relance en
retard de plus de 10 jours (J+7 envoyé à J+40 ressemble à un système cassé),
corps contenant un lien localhost (configuration incomplète) ou le gabarit
`[LIEN DE RÉSERVATION]` non rempli. La simulation est le mode PAR DÉFAUT :
`envoyer` montre ce qui partirait et pourquoi le reste non ; seul `--vraiment`
expédie. Vérifié sur la vraie base : le mail 0 de Nutri Smart, scan vieux de
six jours, a été refusé « périmé » exactement comme prévu.

**La dette « revérifier avant d'envoyer » est soldée.** Avant toute relance
dont le corps parle de robots.txt, la commande RELIT le fichier du prospect en
direct. S'il a corrigé entre-temps, le brouillon est régénéré depuis la
situation actuelle ; si la situation est devenue « solide », la relance est
annulée : on ne relance pas quelqu'un à qui on a promis de ne rien vendre.

**Ce test a trouvé un bug en production.** Le parseur de robots.txt de
`auditFlash` inversait son drapeau de regroupement : sur « User-agent: GPTBot /
User-agent: ClaudeBot / Disallow: / » — la forme la plus courante du blocage —
seul le dernier agent recevait les règles, et GPTBot ressortait « autorisé »
sur un site qui le bloque. L'audit passait donc à côté de l'argument le plus
vérifiable du diagnostic. Corrigé aux deux endroits (site et toolkit), avec la
règle habituelle : les deux lectures doivent rester identiques, et ce sont les
tests du toolkit qui les couvrent. Les audits déjà en base ont pu sous-compter
des blocages ; ceux à venir sont justes.

**La dette RGPD est soldée, en deux gestes distincts parce que deux demandes
distinctes.** `desinscrire` répond à « ne me contactez plus » : la ligne du
lead RESTE, `unsubscribed_at` posé (migration du jour), car elle est la preuve
du consentement ET de la désinscription — la supprimer rendrait l'adresse
réinscriptible par un nouveau scan. `effacer` répond à « supprimez mes
données » : lead supprimé, relances en cascade, coordonnées vidées sur une
éventuelle fiche client (la fiche reste, obligations comptables), et la
commande donne la date à citer dans la réponse au demandeur. Les scans ne
contiennent aucune donnée personnelle et sont conservés. Cycle complet vérifié
sur une ligne jetable.

**Deux détails d'expéditeur qui comptent.** `RESEND_FROM` disait encore
« GEO Sprint », l'ancien nom : corrigé en « Luigi de Citari » — un prénom en
expéditeur est ouvert, une marque seule est filtrée. Et chaque envoi porte
`Reply-To: luigi@citari.fr` plus l'en-tête `List-Unsubscribe` : le bouton
« se désabonner » de la boîte vaut toujours mieux qu'un signalement spam.

**Ce qui reste manuel, et pourquoi.** Coller la clé Resend dans le `.env`,
poser SPF et DKIM chez Hostinger, créer la boîte : trois gestes qui demandent
les comptes du fondateur. Et le mail 0 part au prochain passage d'`envoyer`,
pas à la seconde où le scan finit : les gabarits vivent dans le toolkit, le
site ne peut pas les importer (hors du workspace pnpm), et dupliquer la
rédaction ferait diverger les deux copies. Un cron toutes les 10 minutes sur
le VPS ramènera ce délai à presque rien ; la fenêtre de 3 jours du mail 0
protège en attendant.

---

## 2026-08-09 — L'aguiche n'avait plus de raison d'être, on l'a supprimée

Le parcours comptait quatre écrans : landing, attente, aguiche, rapport.
L'aguiche montrait le score, les moteurs, la part de voix et le verbatim, puis
un bouton ouvrait un rapport qui rouvrait sur… le score, la part de voix et le
verbatim. Le prospect payait un clic pour relire ce qu'il venait de lire.

**Le vrai défaut n'était pas la répétition, c'était l'obsolescence.** Cet écran
avait été construit comme péage à l'email. Depuis que l'adresse est demandée à
la quatrième étape du formulaire, avant le lancement, le péage ne perçoit plus
rien : il ne restait qu'une page qui dépense deux fois le choc du chiffre.
Leçon générale : quand on déplace une capture en amont, il faut aller voir ce
qui la réclamait en aval, sinon la coquille survit et coûte un clic.

**Pire que redondant, contradictoire.** L'aguiche annonçait « 13 citations sur
40 réponses », le rapport « In Extenso, 33 fois sur 280 ». Les deux nombres
étaient justes — 280 est le total des citations, 40 celui des réponses — mais
juxtaposés à trente secondes d'intervalle, ils donnaient l'impression que la
page se contredit. La page de rapport ne compte plus qu'en RÉPONSES, du grand
titre aux barres de part de voix : « In Extenso, cité dans 30 réponses sur 40 »
contre « votre marque apparaît dans 13 ».

Conséquence : la part de voix est recalculée depuis `mentions` plutôt que lue
dans `share_of_voice`, qui compte en citations et tronque aux dix premiers. Les
variantes d'écriture sont regroupées avec `brand_aliases`, faute de quoi
« Exco » et « Exco Lyon » feraient deux barres.

**« Qui prend votre place » choisit maintenant un rival.** Prendre le plus cité
dans l'absolu revient souvent à désigner un géant : c'est exact, et c'est
décourageant. La règle des `concurrent_classes` existait déjà dans le toolkit,
elle s'applique désormais aussi à l'écran. Vide = tout est rival, le parti pris
prudent ; les institutions sont exclues, elles ne prennent la place de personne.

**Ce qui a été supprimé avec l'aguiche** : `teaserScan` (146 lignes),
`chargerTeaser` et `debloquerRapport`. Ce dernier écrivait dans `leads` et
restait une fonction serveur exportée, donc appelable depuis n'importe quel
navigateur, pour un écran que plus personne n'affichait.

**Détail qui compte** : la redirection utilise `replace`. Sans cela, le bouton
« retour » ramène sur un scan terminé, qui redirige aussitôt : le prospect est
prisonnier de sa propre page de résultat.

**Et une erreur de notre propre documentation, corrigée.** `CLAUDE.md`
affirmait depuis des jours que la route `/admin` du site était protégée par un
« mot de passe bidon publié en clair dans ce dépôt ». Vérification faite :
aucun `ADMIN_PASSWORD` dans l'historique git, le seul `.env` jamais versionné ne
contenait qu'une clé Supabase publiable d'un projet Lovable étranger, et les
deux mots de passe actuels diffèrent et ne sont pas des placeholders. Le
problème des deux back-offices reste entier ; le qualifier de fuite envoyait au
mauvais endroit.

---

## 2026-08-08 (suite) — Le rapport d'aperçu devient une page de vente

Son projet contenait DEUX branches de scan, et je n'avais vu que la seconde.

Celle qui est réellement branchée à son formulaire — `/scan?domaine=` puis
`/rapport/$scanId` — tourne sur des données inventées : une horloge simulée
(`useSimulatedProgress`), des verdicts tirés d'un modulo, « Ledgio, 9 fois sur
36 », et un bouton « SKIP → RÉSULTAT (temporaire) ». Elle ne sera jamais
portée : c'est exactement ce que la doctrine interdit.

Mais son `CitariReportScreen` contenait du vrai travail de conversion, indépendant
de ces fausses données : le bloc « qui prend votre place », la bande de questions
cliquables, et surtout **les cartes de moteur verrouillées**. Cette maquette-là
est portée, alimentée par `rapportParJeton`.

**Une adresse, deux artefacts.** `/rapport/$jeton` sert aussi bien l'aperçu
(20 × 2) que le diagnostic complet (24 × 6). C'est le **mode du scan** qui
choisit l'affichage : maquette de conversion en aperçu, document de mesure
ensuite. Verrouiller un moteur qu'on vient d'interroger et de facturer serait
un mensonge ; l'aiguillage n'est donc pas une préférence d'affichage, c'est une
règle.

**Une carte verrouillée ne contient aucun texte.** La sienne floutait la vraie
réponse du moteur — un floutage CSS, que n'importe qui lève en deux clics. Chez
nous il n'y a rien à flouter : le moteur n'a pas été interrogé. La carte le dit
(« non interrogé dans l'aperçu ») et rien n'est fabriqué pour la remplir. C'est
plus honnête ET plus vendeur : l'absence est le produit.

**Les extraits viennent de `mentions.verbatim`, pas de `responses.raw_text`.**
Une réponse réelle fait 1 200 à 1 350 caractères, illisible dans une carte ; le
verbatim fait 74 à 213 caractères et contient exactement la phrase où la marque
se joue. Le `raw_text` ne sert que de repli quand aucune marque n'est relevée.

**Les comptages se font sur `mentions`, jamais sur `share_of_voice`,** qui est
tronqué aux dix premiers plus la ligne du client. C'est le piège déjà écrit dans
CLAUDE.md ; « In Extenso, 33 fois sur 280 » vient bien du comptage complet.

Enfin, la maquette est repeinte avec nos jetons. La sienne codait sa palette en
dur, dont un orange `#E8601F` absent de la charte : garder deux palettes était
précisément le défaut corrigé le matin même.

---

## 2026-08-08 — Le portage du front était à moitié fait, et ça se voyait

Le portage de la veille avait pris la landing et s'était arrêté là. Trois
écrans manquaient, et surtout le site s'était mis à **mélanger deux chartes**
sans que rien ne signale l'erreur : ni le build, ni `tsc`, ni les tests.

**Une classe Tailwind morte ne casse rien, elle éteint.** En fusionnant les
feuilles de style, `bordeaux` et `font-display` ne sont pas passés dans
`@theme`. Tailwind ne génère alors aucune règle pour `text-bordeaux` ou
`font-display` — pas d'avertissement, pas d'erreur : les 63 usages répartis sur
dix fichiers ont simplement perdu leur accent et leur police de titrage. Le
rapport, le back-office et les pages de contenu s'affichaient en noir sur
blanc, en police par défaut. C'est le genre de régression qu'aucun contrôle
automatique n'attrape : il faut ouvrir la page.

Les jetons ont été traduits plutôt que rétablis — `bordeaux` → `signal`,
`font-display` → Archivo pour les titres et Newsreader pour les citations —
parce que rétablir l'ancienne palette aurait figé deux chartes côte à côte.

**Le logo était mort deux fois.** `components/logo.tsx` peignait le signe par
masque alpha depuis `--marque-src`, mais la règle CSS du masque n'avait pas
survécu à la fusion ; et l'image venait de `src/assets/*.asset.json`, une URL de
CDN Lovable (`/__l5e/assets-v1/…`) qui n'existe pas sur notre serveur. Il ne
restait qu'un bloc vide sur le rapport et les pages de contenu. Réécrit en
`<img>` sur `/img/citari-logo.png`, la même image que l'en-tête.

**Deux en-têtes l'un sous l'autre.** `Chrome` portait son propre logo et sa
propre navigation ; depuis que la racine en affiche un, les pages de contenu en
avaient deux. `Chrome` n'habille plus que le contenu, et sert le pied du site.

**Le héros ne montrait pas la bonne maquette.** On avait porté
`HeroFloatingCards`, un composant que son projet garde mais n'utilise plus. Sa
page d'accueil est en deux colonnes, avec `HeroSpecimen` — un spécimen de
rapport étiqueté, chiffres et concurrents fictifs — à droite. Leçon : dans un
projet Lovable, la présence d'un composant ne prouve pas qu'il soit branché ;
c'est la route qui fait foi.

**L'écran d'attente est devenu une carte perforée.** Une ligne par question,
une colonne par moteur, une case noircie par réponse réellement écrite en base.
`etatScan` renvoie désormais les paires (question, moteur) et leur latence, pas
seulement un compteur : la grille est une lecture directe de `responses`, pas
une animation. Les moteurs non couverts par l'aperçu s'affichent verrouillés —
c'est le mécanisme de conversion, et c'est honnête puisqu'ils sont réellement
absents. Une réponse en erreur est marquée d'une croix plutôt que noircie :
elle ne compte pas au dénominateur du score, l'écran ne doit pas la faire
passer pour une réponse obtenue.

**Le péage à l'email de sa maquette a été retiré.** Son écran de résultat
floute le verbatim et demande l'adresse. Chez nous elle est déjà demandée à la
quatrième étape du formulaire, avant le lancement : garder son verrou aurait
fait payer deux fois le même prix. La phrase s'affiche donc en clair, et le
verrou ne subsiste qu'en repli pour un scan créé sans lead.

**Deux bugs de données trouvés en regardant l'écran.** Le rapport ne
construisait `parMoteur` que sur quatre moteurs : Grok et Le Chat affichaient
« — » alors qu'ils étaient interrogés et notés. Et l'en-tête annonçait
« × 6 moteurs » quel que soit le mode, donc aussi sur un aperçu qui en
interroge deux.

**L'en-tête vertical de la grille mentait d'une colonne.** En `writing-mode:
vertical-rl`, une ligne unique se colle au bord droit de sa case : sur mobile,
« CHATGPT » se lisait à l'aplomb de Gemini. Une rotation de 180° ramène la
ligne à gauche, dans l'axe de ses propres cases.

---

## 2026-08-07 — Le front de Jérémie est porté, sa couche données jetée

La landing dessinée par Jérémie tourne désormais sur ce dépôt, branchée sur
notre orchestrateur et notre base. **Aucune ligne de sa couche serveur n'a été
reprise.**

**Le contrat d'`AGENTS.md` ne décrivait pas la réalité.** Il annonçait un
projet « qui ne contient aucun moteur, affiche des données de démonstration aux
formes exactes de nos fonctions serveur », donc un portage mécanique. En
ouvrant le projet, on a trouvé une application complète : ses propres fonctions
serveur (`scan-live.server.ts`, `rapport.server.ts`), ses propres migrations
SQL, et surtout **une autre base Supabase** — `vbxgwqutyzmnasjyladg`, quand la
nôtre est `ebcuhuhslrrsjouchiga`. Son schéma diverge partout : `scans_public`
contre `scans`, `brand` contre `brand_name`, `queries.position` contre
`queries.rank`, `responses_meta` contre `responses`, `scan_leads` contre
`leads`, et des statuts supplémentaires (`generating_queries`, `scoring`).

Le danger n'était pas qu'une recopie plante : c'est qu'elle **ne plante pas**.
Le site aurait affiché des scans absents de notre base et écrit des leads dans
une base étrangère, sans erreur visible. C'est le piège nettoyé le 06/08, en
plus gros.

**Ce qui a été porté** : les tokens de design (palette, Archivo / Newsreader /
IBM Plex Mono), la landing entière — hero à cartes flottantes, simulateur du
coût de l'absence avec ses trois sources datées, les trois étapes empilées, la
FAQ balisée FAQPage, l'appel final et le pied —, l'en-tête, le fond de page, la
barre de lecture. Les quatorze images ont été **téléchargées dans
`public/img/`** : un site en production ne doit dépendre d'aucun CDN d'outil de
conception.

**Ce qui a été jeté** : toute sa couche données, ses migrations, son client
Supabase, et son fichier de démonstration.

**Trois corrections faites au passage**, chacune sur une règle du dépôt :

- son pied de page annonçait « Nous travaillons avec » sous les logos d'OpenAI
  et d'Anthropic, ce qui suggère un partenariat inexistant. Remplacé par
  « Moteurs interrogés » ;
- un bouton « SKIP → RÉSULTAT (temporaire) » vivait en dur dans sa route de
  scan. Non porté ;
- sa liste de moteurs contenait « Copilot », qui n'est pas dans les six figés.

**La fusion des styles est un merge, pas un écrasement.** Ses utilitaires et
les nôtres cohabitent : aucun nom ne collide, vérification faite avant. Les
pages non redessinées (guide-geo, geo-vs-seo, alternatives, mentions, rapport,
admin) continuent donc de s'afficher normalement.

**Ce qui reste à porter** : l'écran de scan `/scan/$id` et le rapport
`/rapport/$jeton` gardent l'ancienne maquette. Ils fonctionnent, mais le
contraste avec la nouvelle landing se voit. C'est le prochain chantier, et il
demandera les mêmes adaptateurs de formes.

`gsap` est entré comme dépendance, pour le seul effet de titre au défilement.
Il est importé dynamiquement, donc découpé du bundle principal.

## 2026-08-07 — « A publié puis s'est arrêté » : le meilleur signal d'achat

Nouvelle commande `signaux-geo`, la vingt-quatrième. Elle lit sur le site de
chaque prospect ce dont un sprint disposerait chez lui, dans des formats qu'il
publie volontairement : plan du site, flux RSS, API de son CMS, balisage
schema.org. Sortie dans un **fichier séparé**, jamais fusionné avec la
température : l'un dit qui rappeler, l'autre dit quoi lui dire.

**Le segment qui vaut le plus n'est pas celui qui publie.** C'est celui qui a
publié PUIS s'est arrêté : 26 sur 100. Ils ont déjà payé pour croire au
contenu, l'outillage est en place, ils ont échoué faute de méthode — et c'est
exactement ce que le sprint vend. Celui qui n'a jamais rien publié doit
d'abord être convaincu que le contenu sert à quelque chose, ce qui est un autre
métier et un cycle plus long. Répartition mesurée : 21 publient régulièrement,
19 peu, 26 se sont arrêtés, 34 n'ont jamais publié.

**Les deux classements sont orthogonaux, et il faut les deux.** Le croisement
le prouve sans ambiguïté : Qwarks est **centième** au classement de température
avec **200 contenus publiés** et 70/100 de matériau ; Archers Notaires est
**huitième** avec 15/100 de matériau, donc rien à exploiter. La température
mesure l'accès et la solvabilité, le matériau mesure la vitesse à laquelle le
sprint produira un effet. Aucun ne remplace l'autre, et les fusionner en une
note unique détruirait l'information.

**Un des deux signaux espérés a échoué.** Les avis clients ne sont balisés en
schema.org que par **3 sites sur 100**. L'intuition était bonne — « ses clients
se renseignent en ligne » est le signal qualifiant de la doctrine — mais la
donnée n'est pas récupérable gratuitement à l'échelle : Google Places est
payant, et interroger Google directement serait du scraping d'un tiers. À
laisser tomber plutôt qu'à bricoler.

Détail technique qui compte : le `lastmod` du plan de site ne vaut que sur les
URL d'articles. Celui d'une page « mentions légales » ne dit rien d'une
politique de publication, et le prendre en compte ferait passer un site figé
pour un site vivant.

## 2026-08-07 (fin) — Le crawl qui double les mobiles : arrêter de deviner les URLs

**53 mobiles directs sur 100**, contre 27, et sans un crédit dépensé. Le gain
ne vient pas d'un effort supplémentaire mais d'un changement de méthode.

Les deux premiers passages **devinaient** les URLs : une liste de vingt-huit
chemins probables, puis un suivi de liens filtré par mots-clés. Rendement,
quatre mobiles sur cent sites. Le troisième **demande au site son propre
plan** :

- `sitemap.xml`, `sitemap_index.xml`, `wp-sitemap.xml`, en descendant d'un
  niveau quand c'est un index de sitemaps ;
- l'**API publique de WordPress** (`/wp-json/wp/v2/pages`), qui liste des pages
  jamais présentes dans le menu. La majorité des sites de PME françaises sont
  sous WordPress, et c'est là que vivent les fiches individuelles d'associés ;
- les URLs sont ensuite triées : celles qui portent un mot de personne
  (équipe, associé, conseiller, profil) d'abord, puis les plus profondes.

Trois façons de lire un numéro que les passages précédents rataient :

- **les numéros coupés par des balises.** `<span>06</span><span>12</span>` doit
  se lire « 0612 », donc les balises se retirent SANS espace de remplacement —
  puis on relit une seconde fois AVEC espace, pour ne pas coller deux nombres
  voisins. Les deux lectures sont nécessaires ;
- **JSON-LD et attributs `data-*`** : `"telephone": "…"`, `data-phone="…"` ;
- **les entités HTML** décodées avant toute recherche.

**Et un piège qui aurait coûté un appel :** `06 07 08 09 10`, publié sur le
site d'un cabinet retenu. Format valide, indicatif valide, mais c'est le numéro
d'exemple du thème que personne n'a remplacé. Même famille : `06 12 34 56 78`,
`06 00 00 00 00`. Seule leur régularité les trahit, d'où `numeroFactice()` et
ses tests. Cinq autres numéros à faible diversité de chiffres ont été gardés :
un vrai mobile français peut répéter des chiffres, et la règle du 07/08 tient —
jeter à tort coûte plus cher que garder à tort.

## 2026-08-07 (suite) — Le plafond de l'enrichissement, et un piège Apollo qui coûte cher

Enrichissement poussé au maximum de ce qui est atteignable : emails nominatifs
de dirigeants 61 → 70, mobiles directs 19 → 27, sur cent lignes qui gardent
100/100 en email, téléphone et dirigeant nommé.

Trois sources, par rendement décroissant :

- **La recherche de personnes Apollo est gratuite**, seule la récupération des
  emails coûte un crédit par personne. Interroger les organisations sans
  contact nommé a donné dix-neuf dirigeants de plus, tous vérifiés, et tous
  recoupés avec le registre ou le site.
- **Les fiches d'organisation Apollo portaient déjà dix mobiles**, dans leur
  champ de téléphone principal, que nous n'avions jamais lu. Dans une structure
  de dix personnes, ce numéro EST celui du dirigeant. Donnée déjà payée,
  jamais exploitée.
- **Le crawl rend peu de mobiles** : quatre sur cent sites, même en suivant les
  liens internes vers les fiches individuelles d'associés, sur vingt-huit pages
  par site. Les PME françaises publient un standard, pas un portable.

**Le piège, et il a coûté 608 crédits.** Les mobiles Apollo passent
exclusivement par `reveal_phone_number`, qui est **asynchrone** : l'appel rend
un ticket, et seul `webhook_result_show` l'échange contre les numéros. Cet
outil refuse l'authentification alors que tout le reste du connecteur répond —
un connecteur peut donc être à moitié autorisé. Les révélations lancées avant
de le découvrir ont été facturées et leurs résultats sont perdus.

Règle à retenir : **avant toute opération asynchrone et payante, vérifier que
l'outil de récupération répond**, pas seulement que la connexion est vivante.
Un appel de profil qui réussit ne prouve rien sur le reste.

Piste testée et abandonnée : l'enrichissement d'organisation Apollo ne rend que
des fixes déjà connus. Rendement nul en mobiles, arrêté après un lot de dix.

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
