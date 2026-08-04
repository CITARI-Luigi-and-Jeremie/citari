<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

# Citari — règles de travail

Ce projet contient **le site ET le moteur de mesure** dans la même application
(TanStack Start). Le design est libre. Le moteur ne se touche pas.

Jérémie travaille le front et l'expérience. Luigi travaille le moteur. Ce
fichier est le contrat entre les deux : le respecter permet de travailler en
parallèle sans jamais se marcher dessus.

## Interdits absolus

Ne jamais modifier, réécrire ni « améliorer » ces fichiers :

| Fichier | Pourquoi |
| --- | --- |
| `src/lib/orchestrateur.server.ts` | Le moteur de mesure. Il n'en existe qu'un exemplaire, et c'est ce qui rend comparable le score de départ et celui du re-scan à J+90. Deux implémentations qui dérivent rendraient le produit invendable. |
| `src/lib/moteurs.server.ts` | Les appels aux six IA. Contient la logique de recherche web et les modèles exacts. |
| `src/lib/score.ts` | La formule du score, figée et publiée : présence 50 %, rang 20 %, recommandation 20 %, tonalité 10 %. |
| `src/lib/typo.ts` | La liste des moteurs par mode de scan. |
| `src/integrations/supabase/*` | Accès base avec la clé de service. |
| `src/lib/scan.functions.ts` | Le pont entre le front et le moteur. Voir le contrat ci-dessous. |

Trois autres règles, sans exception :

1. **Aucune clé d'API dans ce projet.** Les six clés des moteurs et les clés
   Supabase vivent dans `.env.local` en local et dans les secrets de
   l'hébergeur en production. Elles ne doivent apparaître ni dans le code, ni
   dans une variable préfixée `VITE_`, qui est publique par construction.
2. **Ne jamais interroger Supabase depuis le navigateur.** La base est en RLS
   deny-all : une requête directe ne renverra rien, ce n'est pas un bug de
   configuration. Tout passe par les fonctions serveur listées plus bas.
3. **Aucun faux contenu.** Pas de témoignage, de logo client, de résultat ou de
   compteur inventé. Les exemples de réponses d'IA sont toujours étiquetés
   comme illustratifs, avec des noms de concurrents fictifs. C'est la doctrine
   du produit : nous vendons une mesure honnête, la page doit l'être aussi.

## Ce qui est entièrement libre

Tout le reste : `src/routes/*.tsx`, `src/components/**`, `src/styles.css`,
`src/data/contenu.ts`, la mise en page, la typographie, les couleurs,
les animations, l'ordre des sections, les textes marketing.

## Le contrat : les cinq fonctions serveur

Elles s'importent depuis `@/lib/scan.functions` et s'appellent avec
`useServerFn`. Le front n'a besoin de rien d'autre.

### `lancerScan` — démarre une mesure

```ts
lancerScan({ data: {
  marque: string,        // obligatoire, au moins 2 caractères alphanumériques
  email: string,         // OBLIGATOIRE, email valide
  url?: string | null,
  secteur: string,       // obligatoire
  ville?: string | null,
  concurrents: string[], // 3 maximum
  langue: "fr" | "it" | "en",
  mode?: "apercu" | "complet",   // défaut : apercu
}})
// → { id: string, cached: boolean }   ou   { erreur: string }
```

> [!IMPORTANT]
> **Le champ `email` est obligatoire.** Un formulaire qui ne l'envoie pas verra
> son scan rejeté à la validation. C'est la contrepartie du scan gratuit : sans
> lui, un visiteur consulte son score et disparaît sans qu'on puisse le
> rappeler. Le formulaire doit donc porter une mention RGPD (usage de l'adresse
> et désinscription) juste sous le bouton d'envoi.

### `suivreScan` — fait avancer la collecte

```ts
suivreScan({ data: { id: string } })
// → { status, phase, progression, collectees, total, questions, error, reportToken, cout }
```

**C'est le sondage du navigateur qui fait avancer le scan.** Appelée en boucle
(toutes les 2 à 3 secondes) tant que `status === "running"`. Si la page se
ferme, la mesure s'arrête là où elle en est et reprend au rechargement, sans
repayer les réponses déjà collectées.

Comptez environ 75 secondes pour un aperçu.

Le champ `error` contient déjà un message écrit pour le visiteur : l'afficher
tel quel. Ne jamais chercher le détail technique, il reste côté serveur exprès.

### `chargerTeaser` — le résultat de l'aperçu

```ts
chargerTeaser({ data: { id: string } })
// → { marque, mode, score, parMoteur, comptage: { questions, reponses,
//     citationsCible, citationsConcurrents, questionsPerdues },
//     pdv, aguiches, verbatim, emailCapture }  ou  null si le scan n'est pas fini
```

`comptage.questions` donne le **vrai** nombre de questions posées : 20 en
aperçu, 24 en diagnostic complet. Ne jamais écrire ce nombre en dur.

### `chargerRapport` — le rapport complet

```ts
chargerRapport({ data: { jeton: string } })
```

Le rapport se lit avec `reportToken`, jamais avec l'identifiant du scan.

### `debloquerRapport` — complète un contact

```ts
debloquerRapport({ data: { scanId, email, prenom?, telephone? } })
```

Sert à enrichir un lead existant (prénom, téléphone), plus à déverrouiller quoi
que ce soit : l'email étant demandé au lancement, le verbatim n'est plus caché.

## Les trois pages du tunnel

| Page | Rôle |
| --- | --- |
| `src/routes/index.tsx` | Accueil et formulaire. |
| `src/routes/scan.$id.tsx` | Progression, puis résultat de l'aperçu. C'est cette page qui pilote la collecte. |
| `src/routes/rapport.$jeton.tsx` | Le rapport complet. |

## L'amélioration qui vaut le plus

Incruster le Calendly dans la page de résultat, juste sous la part de voix,
pré-rempli avec l'email déjà saisi. Le prospect vient de découvrir son score et
il est encore devant l'écran : c'est là que la conversion se joue, bien plus que
dans les emails de relance. Le lien vit dans `BOOKING_URL`.

## Avant de pousser

```bash
npx tsc --noEmit   # doit passer sans erreur
```

Garder la branche dans un état qui fonctionne : elle se synchronise avec
Lovable, et un état cassé se propage à l'éditeur.
