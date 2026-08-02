# Citari, en entier

Document destiné à un associé potentiel. Il décrit le projet tel qu'il est
réellement au 2 août 2026, y compris ce qui n'existe pas encore et ce qui peut
échouer. Il n'y a rien à vendre ici : la seule chose utile, c'est que tu
comprennes exactement dans quoi tu mettrais les pieds.

---

## 1. Le problème, en une page

Quand un dirigeant cherchait un prestataire, il tapait sur Google et obtenait
dix liens. Il choisissait lui-même.

Aujourd'hui il demande à ChatGPT « quel cabinet comptable pour une PME de 30
salariés à Lyon ». Et ChatGPT ne donne pas dix liens. Il donne trois noms.
Parfois deux. Il n'y a pas de deuxième page, pas de « voir plus de résultats ».

Tu es dans la réponse, ou tu n'existes pas.

Le déplacement est là : on est passé d'un moteur qui **affiche** à un moteur
qui **recommande**. Le référencement classique optimise un rang dans une liste.
Ce métier-ci consiste à entrer dans une phrase.

Trois conséquences pratiques :

- **Le gagnant prend presque tout.** Trois places au lieu de dix.
- **Les positions sont lentes à bouger.** Les modèles apprennent lentement et
  retiennent longtemps. Qui s'installe maintenant y reste des années. Qui
  attend devra déloger quelqu'un.
- **Personne ne mesure.** Les dirigeants ne savent pas s'ils sont cités. Ils
  n'ont même pas l'idée de vérifier.

C'est ce dernier point qui fait le produit.

---

## 2. Ce que vend Citari

### Le scan gratuit, qui est l'appât

Un dirigeant arrive sur le site, renseigne sa marque, son secteur, sa ville et
jusqu'à trois concurrents. En quatre-vingt-dix secondes il obtient un score de
visibilité sur 100.

Ce qui se passe pendant ces quatre-vingt-dix secondes :

1. On génère **24 questions d'intention d'achat** propres à son secteur et à sa
   ville. Dix comparatives, six sur un problème, cinq locales, trois sur la
   confiance.
2. **Son nom n'apparaît jamais dans la question.** C'est le point
   méthodologique central. Si on demandait à ChatGPT ce qu'il pense de
   l'entreprise, il en dirait du bien, puisqu'on lui aurait soufflé la réponse.
   On pose les questions que posent ses acheteurs, et on regarde si la marque
   sort d'elle-même.
3. Ces 24 questions partent vers **six moteurs** : ChatGPT, Claude, Gemini,
   Perplexity, Grok et Le Chat (Mistral). Soit **144 réponses réelles**,
   collectées en direct par les API officielles des éditeurs. Aucun scraping.
4. Chaque réponse est analysée : quelles marques sont nommées, dans quel ordre,
   laquelle est explicitement recommandée, sur quel ton, et la phrase exacte où
   cela se joue.
5. Un score est calculé selon une formule publiée sur le site : présence 50 %,
   rang dans la réponse 20 %, recommandation explicite 20 %, tonalité 10 %.
6. **Les 24 questions sont scellées.** À J+90 on rejoue exactement les mêmes,
   sur les mêmes moteurs, avec la même formule. C'est ce qui rend le
   avant/après incontestable : on ne peut pas choisir ses questions après coup.

Le score est affiché immédiatement. Le rapport complet demande un email. C'est
là que naît le lead.

### Le Sprint GEO, qui est le produit payant

**2 900 € HT, trente jours, paiement unique** (50 % à la commande, 50 % à la
livraison). Aucun abonnement, aucune reconduction. Option « Domination » à
4 900 €.

Trois chantiers, qui répondent aux trois raisons pour lesquelles une IA ne cite
pas une entreprise :

| Cause | Chantier | Ce qui est livré |
|---|---|---|
| Elle ne peut pas vous lire | Technique | Ouverture des robots d'IA (GPTBot, ClaudeBot, PerplexityBot), fichier `llms.txt`, balisage schema.org, pages réécrites en réponse directe. Rapport d'audit et fichiers prêts à poser. |
| Elle n'a rien à citer de vous | Contenu | 5 contenus rédigés, ciblés sur les questions du scan où la marque est absente. Livrés en Markdown et HTML, balisage intégré. |
| Personne d'autre ne parle de vous | Citations | 8 cibles traitées : annuaires sectoriels, comparateurs, presse. Inscriptions faites, pitchs rédigés et envoyés, relances assurées. |

Puis un **re-scan offert à J+90**, mêmes questions, mêmes moteurs, comparatif
avant/après.

### Deux contraintes volontaires

**Trois sprints par mois maximum.** **Un seul client par secteur et par zone.**

Ce ne sont pas des artifices de rareté. Le second est une nécessité logique :
travailler pour deux cabinets comptables lyonnais concurrents, ce serait
travailler contre soi-même. Le premier protège l'exécution.

Retiens ce point, on y revient en partie 6 : c'est lui qui définit ton rôle.

---

## 3. Le positionnement, qui est le vrai actif

Le marché du GEO se remplit de promesses invérifiables : « première place dans
ChatGPT garantie ». C'est du vent, parce qu'il n'existe pas de classement dans
ChatGPT, seulement une réponse rédigée qui varie d'une fois sur l'autre.

Citari fait l'inverse et en fait son argument :

- **On garantit les actions livrées, jamais un score.** Les moteurs intègrent
  les changements en quatre à douze semaines et personne ne contrôle ce délai.
- **La formule de score est publiée**, pour que le client puisse la recalculer
  et la contester. Personne dans ce métier ne publie sa formule.
- **Aucun faux client, aucun témoignage, aucun logo.** L'agence n'a pas encore
  de client. On ne fabrique pas de preuve sociale.
- **Si le score du prospect est bon, on lui dit et on ne lui vend rien.**

Ce n'est pas de la morale, c'est du positionnement. Dans un marché où tout le
monde surpromet, le seul espace libre est celui de la mesure honnête. Et c'est
défendable : la méthode est publique, donc vérifiable, donc crédible.

---

## 4. L'économie

| | |
|---|---|
| Coût d'un scan (144 appels API) | environ 0,53 € |
| Prix du sprint | 2 900 € HT |
| Plafond volontaire | 3 sprints par mois |
| Chiffre d'affaires maximum au modèle actuel | environ 8 700 € par mois |

Le coût d'acquisition est presque nul en variable : un scan coûte cinquante
centimes et sert à la fois de produit d'appel et d'argument de vente
personnalisé.

**Le modèle est limité par la capacité de livraison, pas par la demande.**
C'est le point structurant de toute discussion entre nous deux.

---

## 5. Où en est le projet, sans enjolivure

### Ce qui existe et fonctionne

- Le site public et son moteur de scan, sur Lovable, synchronisé avec GitHub.
  Landing, formulaire, écran de progression, teaser, rapport complet accessible
  par jeton, capture de lead, séquence de relance générée automatiquement.
- La base de données complète (Supabase) : scans, questions, réponses,
  mentions, leads, clients, sprints, livrables, cibles de citation, journal des
  coûts. Sécurité vérifiée, accès public totalement fermé.
- Une base de **53 annuaires et comparateurs francophones** classés par
  secteur, qui sert de point de départ au chantier citations.
- Un back-office de livraison et **onze commandes en ligne de commande** qui
  automatisent une grande partie du sprint : audit technique, génération des
  correctifs, briefs de contenu, rédaction, cibles de citation, vérification
  que les correctifs sont bien en ligne, analyse des logs de crawlers IA,
  rapport de fin de sprint, relances, propositions commerciales.

### Ce qui n'existe pas

- **Aucun client. Aucun euro de chiffre d'affaires.**
- **Aucune structure juridique.** Pas de société, donc pas de facturation
  possible aujourd'hui. Les mentions légales du site sont incomplètes, ce qui
  est une obligation légale non satisfaite.
- **Le scan n'a jamais tourné avec les vraies clés API.** Tout a été développé
  et testé en mode simulé. Deux scans de test existent en base, tous les deux
  avec des données saisies au hasard.
- **Quatre des onze commandes n'ont jamais été exécutées en réel.**
- **Aucune acquisition.** Personne ne sait que le site existe.

### Deux défauts connus

- **Les sources citées par Perplexity ne sont pas récupérées.** L'API a changé
  d'emplacement pour les citations. Conséquence : l'argument « voici les
  sources sur lesquelles l'IA s'appuie pour recommander vos concurrents », qui
  est le cœur du chantier citations, est actuellement vide. À réparer avant le
  premier client.
- **Le nom de marque n'est pas validé à la saisie.** Un nom mal orthographié ou
  contenant une parenthèse rend la détection impossible et produit un 0/100 qui
  n'est pas une mesure mais un artefact. C'est arrivé sur les deux scans de
  test. À réparer avant d'exposer le formulaire à des prospects.

---

## 6. Pourquoi un associé, et pour quoi faire

Le modèle plafonne à trois sprints par mois parce qu'un sprint demande du
travail réel : cinq contenus rédigés, huit cibles de citation démarchées, un
audit technique, un rapport. L'outillage automatise la matière première, pas le
jugement.

Deux répartitions possibles, et il faut trancher avant de commencer :

**Option A, tu prends l'acquisition.** Luigi livre, tu remplis le carnet. Le
plafond passe de trois à trois sprints réellement vendus chaque mois, ce qui
n'est pas le cas aujourd'hui. C'est le goulot d'étranglement actuel.

**Option B, tu prends la livraison.** Vous doublez la capacité, six sprints par
mois, soit environ 17 400 € mensuels au prix actuel. Mais il faut d'abord qu'il
y ait de la demande, ce qui n'est pas démontré.

Mon avis, en tant qu'outil qui a construit la chose et qui n'a pas d'intérêt
dans l'affaire : **l'option A est la seule qui se défend aujourd'hui**, parce
que le produit est construit et que rien n'est vendu. Doubler la capacité de
production d'un produit qui n'a aucun client ne sert à rien.

### Le coup d'acquisition qui existe et que personne d'autre ne peut faire

Citari peut scanner un prospect **avant** de le contacter. Au lieu d'un mail
générique, on écrit :

> J'ai mesuré la visibilité de votre cabinet dans ChatGPT, Claude, Gemini,
> Perplexity, Grok et Le Chat. Sur 24 questions que posent vos clients, vous
> êtes cité 2 fois. Vos trois concurrents le sont 41 fois. Voici le rapport
> complet, gratuitement.

Ce n'est plus de la prospection à froid, c'est un diagnostic offert et
vérifiable. Le coût marginal est de cinquante centimes. Les prospects avec les
plus mauvais scores sont les meilleurs : ils ont le plus à gagner et le plus de
mal à nier le problème.

La brique manquante est une commande qui scanne un lot de prospects, les classe
du pire au meilleur score, et sort la liste d'appel. Le reste (relances,
propositions) est déjà écrit.

Sur le cadre légal : la prospection B2B vers une adresse professionnelle
nominative est licite en France sur la base de l'intérêt légitime, à condition
que l'objet soit en rapport avec la fonction de la personne, que l'expéditeur
soit clairement identifié et qu'un lien de désinscription soit présent. Le
démarchage téléphonique B2B n'est pas concerné par Bloctel, qui ne couvre que
les particuliers. À faire valider par un juriste avant de passer à l'échelle.

---

## 7. Les risques, honnêtement

**Le produit dépend d'API que nous ne contrôlons pas.** Les moteurs changent de
modèle, de tarif, de conditions d'utilisation. Un changement majeur peut
modifier les scores sans que le client ait rien fait. C'est précisément pour
cela qu'on ne garantit jamais un score, mais cela reste un risque de
crédibilité.

**Le marché est jeune et le coût d'éducation est élevé.** Beaucoup de
dirigeants n'ont pas encore conscience du problème. Chaque vente commence par
expliquer que le problème existe, ce qui rallonge le cycle.

**Rien n'est prouvé.** Aucun client, donc aucune preuve que le sprint fait
réellement monter un score. La méthode est solide en théorie. Le premier client
sera aussi la première validation, et il peut ne pas fonctionner.

**Le modèle est limité par la capacité**, ce qui plafonne la croissance tant
qu'on n'a pas industrialisé la livraison ou augmenté le prix.

**La concurrence arrive.** Des outils de suivi de visibilité IA existent déjà.
Ils mesurent, ils ne livrent pas. C'est notre différence aujourd'hui, elle
n'est pas éternelle.

---

## 8. L'architecture technique, si tu es technique

Si tu ne l'es pas, cette partie ne te sert pas, saute-la.

**Le site public** vit dans un projet Lovable (React, TanStack Start,
TypeScript), synchronisé avec le dépôt GitHub `sprint-voice-insight`. Ce n'est
pas qu'un front : son orchestrateur côté serveur interroge les six moteurs,
calcule le score et écrit en base. Il traite les questions par lots de huit à
chaque sondage du navigateur, ce qui le rend insensible aux limites de durée
des fonctions serverless.

**La base** est un Postgres Supabase, seize tables, RLS actif partout sans
aucune policy, donc fermé à tout accès public. Tout passe par le service role
côté serveur.

**L'usine de livraison** est un monorepo séparé (Turborepo, pnpm, Next.js pour
le back-office, TypeScript strict, tests Vitest). Elle consomme la base sans
jamais créer de scan : le schéma appartient au site public.

**Règle d'architecture à ne jamais casser** : il n'existe qu'une seule
implémentation du calcul de score, celle du site public. Si l'usine en avait
une seconde, l'écart entre le scan initial et le re-scan J+90 comparerait deux
calculs différents et ne voudrait plus rien dire.

---

## 9. Ce qu'il faut décider ensemble, dans l'ordre

1. **La structure juridique et la répartition du capital.** Rien ne peut être
   facturé avant. C'est le premier domino.
2. **Qui fait quoi** : acquisition ou livraison (voir partie 6).
3. **Réparer les deux défauts connus** (sources Perplexity, validation du nom)
   et faire tourner un scan complet en réel. Avant tout démarchage.
4. **Le premier client**, à prix réduit et assumé comme tel, en échange du
   droit d'en parler. C'est la seule façon de sortir du problème « aucune
   preuve ».
5. **Décider si le plafond de trois sprints reste**, une fois qu'on saura
   combien de temps prend réellement une livraison.

---

*Ce document décrit l'état au 2 août 2026. Les chiffres de coût sont des
estimations calculées à partir des tarifs affichés des API, jamais mesurés sur
un volume réel. Le chiffre d'affaires maximum indiqué est une capacité
théorique, pas une prévision.*
