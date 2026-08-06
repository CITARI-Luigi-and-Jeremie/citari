# apps/citari — le site public et le moteur de scan

Une seule application TanStack Start qui porte les deux : la landing qui vend le
Sprint GEO, et la machine qui mesure la visibilité d'une marque dans les six
moteurs d'IA. Elles vivent ensemble parce que le scan *est* l'argument de vente.

Pour le projet dans son ensemble, lisez [CLAUDE.md](../../CLAUDE.md) puis
[JOURNAL.md](../../JOURNAL.md). Les règles de travail sur ce dossier sont dans
[AGENTS.md](AGENTS.md), la direction artistique dans
[DESIGN.md](../../DESIGN.md).

## Lancer

**C'est npm ici, pas pnpm.** Le site est volontairement hors du workspace
(`!apps/citari` dans `pnpm-workspace.yaml`) : il a son propre gestionnaire de
paquets. Un `pnpm --filter tanstack_start_ts …` répond « No projects matched ».
`bun` n'est pas installé sur cette machine, malgré ce que suggère le
`package.json`.

```bash
npm --prefix apps/citari run dev     # http://localhost:8080
npm --prefix apps/citari run build   # sa seule vérification, il n'y a pas de script typecheck
```

Le typage est en fait couvert par `pnpm -r typecheck` à la racine : les tests du
toolkit importent le vrai code d'ici, et l'alias `@/` est résolu par leur
`tsconfig.json`. C'est ainsi que `orchestrateur.server.ts` et `score.ts` sont
typés.

Les clés des six moteurs et l'accès Supabase vivent dans `.env.local`, jamais
versionné. Le modèle est dans [.env.example](../../.env.example).

## Ce qu'il y a dedans

| Fichier | Rôle |
|---|---|
| `src/lib/orchestrateur.server.ts` | **Le** moteur de scan : interroge, score, écrit en base |
| `src/lib/moteurs.server.ts` | Les appels aux six API, la génération des questions, l'estimation des coûts |
| `src/lib/score.ts` | La formule, figée |
| `src/lib/scan.functions.ts` | Les fonctions serveur que le navigateur appelle pour piloter la mesure |
| `src/lib/admin.functions.ts` | Ce que consomme le back-office |
| `src/routes/` | Landing, attente `scan.$id`, rapport `rapport.$jeton`, admin, pages de contenu et pages légales |

`src/routeTree.gen.ts` est régénéré à chaque `npm run dev` et pollue les diffs.

## Ce qu'il ne faut pas casser

- **Un seul moteur de scan existe**, celui d'ici. Il y en a eu un second dans
  `packages/core`, resté sur un schéma périmé ; supprimé le 06/08/2026. N'en
  recréez pas : l'intérêt du J+90 est l'écart avec le J0, et un écart entre deux
  implémentations ne veut rien dire.
- **La formule du score est figée** : présence 50 %, rang 20 %, recommandation
  explicite 20 %, tonalité 10 %.
- **Les six moteurs et la version de chaque modèle sont figés**, et
  `packages/toolkit/tests/modeles.test.ts` le fait respecter. ChatGPT, Claude,
  Gemini, Perplexity, Grok, Le Chat.
- **Le mix de questions** : 24 en complet (10 comparatives, 6 problème,
  5 locales, 3 confiance), 20 en aperçu (8, 5, 4, 3).
- **Le nom de la marque n'est jamais prononcé dans une question de mesure.** On
  mesurerait la mémoire du moteur, pas la découverte spontanée. La question
  miroir fait exception, elle est hors méthodologie et étiquetée comme telle.
- **Un re-scan rejoue strictement les mêmes questions.**
- **Une réponse en erreur ne compte pas au dénominateur du score**, sinon un
  moteur en panne fait baisser la note du client.
- **Le verrou du teaser est côté serveur**, pas en CSS : tant qu'aucun email
  n'est enregistré, le texte du verbatim ne quitte pas le serveur.

## Historique

Le tunnel public a transité par Lovable entre le 01/08 et le 05/08/2026 ; seule
la façade en avait été reprise, le moteur a été écrit ici. Le brief de
construction d'origine est conservé dans [LOVABLE.md](../../LOVABLE.md), marqué
comme document historique. Il ne décrit plus l'état du produit.
