# Journal des décisions

Ce que sait la conversation mais que le code ne dit pas. À lire au démarrage
d'une nouvelle session, après `CLAUDE.md`.

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
