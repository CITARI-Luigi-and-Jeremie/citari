import { Apparition } from "@/components/apparition";
import { Etiquette, Label, Rule } from "@/components/kit";
import {
  Actions,
  PartDeVoix,
  ScoreGeant,
  ScoresMoteurs,
  Sources,
  TableauRequetes,
  Verbatims,
  type Mention,
  type Question,
  type Reponse,
} from "@/components/rapport";
import { MOTEURS } from "@/lib/typo";
import { fr, frTitre } from "@/lib/typo";

/* ------------------------------------------------------------------
   Jeu de données strictement illustratif.
   Marque étudiée et concurrents : entièrement fictifs.
------------------------------------------------------------------ */

const MARQUE = "Cabinet Vaurel & Associés";
const CONCURRENTS = ["Fiduciaire Montbrun", "Chiffres&Cie", "Cabinet Perrin-Lacaze", "Étude Vareille"];

const TEXTES: [string, Question["intent"]][] = [
  ["Quel cabinet comptable choisir à Lyon pour une PME de 30 salariés ?", "comparative"],
  ["Meilleur expert-comptable pour une société de services à Lyon ?", "comparative"],
  ["Quel cabinet comptable pour gérer une croissance rapide ?", "probleme"],
  ["Expert-comptable Lyon 6e : qui recommandez-vous ?", "locale"],
  ["Comment choisir un expert-comptable de confiance ?", "confiance"],
  ["Cabinet comptable spécialisé BTP à Lyon ?", "comparative"],
  ["Mon comptable ne répond plus : par qui le remplacer à Lyon ?", "probleme"],
  ["Quel cabinet comptable pour une SAS en création à Lyon ?", "locale"],
  ["Expert-comptable en ligne ou cabinet local : que choisir ?", "comparative"],
  ["Quel cabinet comptable accompagne une levée de fonds ?", "probleme"],
  ["Combien coûte un expert-comptable pour une PME lyonnaise ?", "comparative"],
  ["Cabinet comptable Lyon avis clients fiables ?", "confiance"],
  ["Quel cabinet comptable pour une holding familiale ?", "probleme"],
  ["Expert-comptable pour restaurateur à Lyon ?", "locale"],
  ["Qui gère la paie pour une PME de 40 salariés à Lyon ?", "probleme"],
  ["Cabinet comptable Rhône-Alpes pour groupe multi-sites ?", "locale"],
  ["Expert-comptable reconnu pour l’optimisation fiscale à Lyon ?", "comparative"],
  ["Un cabinet comptable peut-il aider à céder mon entreprise ?", "probleme"],
  ["Quel cabinet comptable est le plus réactif à Lyon ?", "confiance"],
  ["Cabinet comptable pour profession libérale à Lyon ?", "locale"],
  ["Expert-comptable pour e-commerce français ?", "comparative"],
  ["À qui confier un contrôle fiscal en cours ?", "probleme"],
  ["Cabinet comptable Lyon avec outil de gestion intégré ?", "comparative"],
  ["Comment vérifier le sérieux d’un cabinet comptable ?", "confiance"],
];

const QUESTIONS: Question[] = TEXTES.map(([text, intent], i) => ({
  id: `q${i}`,
  rank: i + 1,
  text,
  intent,
}));

const REPONSES: Reponse[] = [];
const MENTIONS: Mention[] = [];

const SOURCES_HOTES = [
  "lesechos.fr",
  "annuaire-experts-comptables.fr",
  "societe.com",
  "cabinet-montbrun.fr",
  "chiffres-et-cie.fr",
  "lyon-entreprises.com",
  "compta-online.com",
];

QUESTIONS.forEach((q, qi) => {
  MOTEURS.forEach((moteur, mi) => {
    const graine = qi * 7 + mi * 3;
    const indisponible = graine % 29 === 0;
    REPONSES.push({
      id: `r-${q.id}-${moteur}`,
      query_id: q.id,
      engine: moteur,
      raw_text: null,
      sources:
        moteur === "Perplexity"
          ? [
              { url: `https://${SOURCES_HOTES[graine % SOURCES_HOTES.length]}/page` },
              { url: `https://${SOURCES_HOTES[(graine + 3) % SOURCES_HOTES.length]}/article` },
            ]
          : [],
      error: indisponible ? "timeout" : null,
    });
    if (indisponible) return;

    // La marque étudiée n’apparaît que dans une minorité de réponses.
    const cible = graine % 5 === 1;
    if (cible) {
      MENTIONS.push({
        id: `m-${q.id}-${moteur}-t`,
        query_id: q.id,
        response_id: `r-${q.id}-${moteur}`,
        engine: moteur,
        brand: MARQUE,
        is_target: true,
        position: (graine % 3) + 2,
        recommended: graine % 11 === 1,
        sentiment: "neutre",
        verbatim: null,
      });
    }
    const nb = 2 + (graine % 2);
    for (let k = 0; k < nb; k++) {
      const brand = CONCURRENTS[(graine + k) % CONCURRENTS.length];
      MENTIONS.push({
        id: `m-${q.id}-${moteur}-${k}`,
        query_id: q.id,
        response_id: `r-${q.id}-${moteur}`,
        engine: moteur,
        brand,
        is_target: false,
        position: k + 1,
        recommended: k === 0,
        sentiment: "positif",
        verbatim: null,
      });
    }
  });
});

/* Quelques verbatims illustratifs, injectés dans les mentions existantes. */
const VERBATIMS: [string, string][] = [
  [
    "Fiduciaire Montbrun",
    "Pour une PME de trente salariés à Lyon, Fiduciaire Montbrun est le nom qui revient le plus souvent, notamment pour la gestion de la paie et la réactivité du suivi.",
  ],
  [
    "Chiffres&Cie",
    "Chiffres&Cie est fréquemment recommandé aux sociétés de services en croissance, avec un accompagnement structuré sur les prévisionnels.",
  ],
  [
    MARQUE,
    "Cabinet Vaurel & Associés est également cité, plus rarement, comme une option locale pour les structures familiales.",
  ],
  [
    "Cabinet Perrin-Lacaze",
    "Je recommanderais de contacter en premier Cabinet Perrin-Lacaze, qui traite régulièrement des dossiers de cession d’entreprise sur la région lyonnaise.",
  ],
];

VERBATIMS.forEach(([brand, texte], i) => {
  const cible = MENTIONS.find((m) => m.brand === brand && !m.verbatim && i * 0 === 0);
  if (cible) cible.verbatim = texte;
});

const SCORES_MOTEURS: Record<string, number | null> = {
  ChatGPT: 24,
  Claude: 31,
  Gemini: 18,
  Perplexity: 27,
  Grok: 12,
  "Le Chat": 21,
};

const SCORE = 22;

const PART_DE_VOIX = (() => {
  const compte = new Map<string, number>();
  for (const m of MENTIONS) compte.set(m.brand, (compte.get(m.brand) ?? 0) + 1);
  const total = [...compte.values()].reduce((a, b) => a + b, 0);
  return [...compte.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([name, count]) => ({ name, count, share: count / total, target: name === MARQUE }));
})();

const ACTIONS = [
  {
    chantier: "Technique",
    titre: "Autoriser GPTBot, ClaudeBot et PerplexityBot",
    pourquoi: "Trois des six moteurs ne peuvent pas lire le site : le robots.txt les bloque.",
    effort: "1 h",
  },
  {
    chantier: "Technique",
    titre: "Publier un fichier llms.txt",
    pourquoi: "Il résume l’offre et les zones desservies dans un format que les moteurs lisent en priorité.",
    effort: "2 h",
  },
  {
    chantier: "Technique",
    titre: "Baliser les pages en schema.org ProfessionalService",
    pourquoi: "Sans balisage, la spécialisation et la zone ne sont pas extraites de façon fiable.",
    effort: "4 h",
  },
  {
    chantier: "Technique",
    titre: "Restructurer les pages en réponse directe",
    pourquoi: "Les moteurs citent les paragraphes qui répondent à une question en moins de quarante mots.",
    effort: "1 j",
  },
  {
    chantier: "Contenu",
    titre: "Page « Expert-comptable PME 30 à 60 salariés »",
    pourquoi: "Six questions du scan portent sur cette taille d’entreprise ; aucune page n’y répond.",
    effort: "1 j",
  },
  {
    chantier: "Contenu",
    titre: "Comparatif honoraires et périmètre de mission",
    pourquoi: "La question du coût revient sur quatre moteurs, et la réponse cite deux concurrents.",
    effort: "1 j",
  },
  {
    chantier: "Contenu",
    titre: "Page cession et transmission d’entreprise",
    pourquoi: "Intention à forte valeur, où la marque n’apparaît sur aucun des six moteurs.",
    effort: "1 j",
  },
  {
    chantier: "Citations",
    titre: "Fiche complète sur les deux annuaires cités par Perplexity",
    pourquoi: "Ces deux domaines alimentent un tiers des réponses sourcées du secteur.",
    effort: "3 h",
  },
  {
    chantier: "Citations",
    titre: "Présence sur les comparateurs régionaux",
    pourquoi: "Les réponses locales s’appuient sur des pages de recensement lyonnaises.",
    effort: "5 h",
  },
  {
    chantier: "Citations",
    titre: "Deux prises de parole en presse spécialisée",
    pourquoi: "Une source de presse pèse davantage qu’un annuaire dans la sélection des noms cités.",
    effort: "3 sem.",
  },
];

/* ---------------- Section ---------------- */

function Bloc({
  accroche,
  children,
}: {
  accroche: string;
  children: React.ReactNode;
}) {
  return (
    <div className="border-t border-rule pt-8">
      <p className="max-w-[36ch] font-display text-[26px] font-light leading-[1.15] sm:text-[32px]">
        {frTitre(accroche)}
      </p>
      <div className="mt-8">{children}</div>
    </div>
  );
}

export function RapportExemple() {
  return (
    <Apparition
      as="section"
      className="mt-40 border-y border-rule bg-paper-2/70 sm:mt-52"
    >
      <div className="mx-auto max-w-[1240px] px-6 py-20 sm:py-28 lg:px-10">
        <Label className="pb-6">ce que vous recevez</Label>
        <h2 className="max-w-[16ch] text-balance text-[38px] leading-[1.02] sm:text-[62px]">
          {frTitre("Le rapport, avant de le demander.")}
        </h2>
        <p className="mt-8 max-w-[62ch] text-[17px] leading-[1.6] text-ink-2">
          {fr(
            "Voici exactement les pages que vous recevez à la fin du scan — mêmes composants, mêmes calculs. Seules les données changent : ce sont les vôtres.",
          )}
        </p>
        <div className="mt-8">
          <Etiquette>rapport d’exemple — données illustratives, marques fictives</Etiquette>
        </div>

        <div className="mt-16 grid gap-20">
          <Bloc accroche="Votre score, et sa décomposition par moteur.">
            <ScoreGeant score={SCORE} verdict="Marginal" />
            <div className="mt-10">
              <ScoresMoteurs scores={SCORES_MOTEURS} />
            </div>
          </Bloc>

          <Bloc accroche="Qui occupe le terrain à votre place.">
            <PartDeVoix items={PART_DE_VOIX} />
          </Bloc>

          <Bloc accroche="Les phrases exactes, mot pour mot.">
            <Verbatims mentions={MENTIONS} marque={MARQUE} />
          </Bloc>

          <Bloc accroche="Les 24 questions, une par une, avec votre rang sur chaque moteur.">
            <TableauRequetes
              questions={QUESTIONS}
              reponses={REPONSES}
              mentions={MENTIONS}
              marque="Vaurel"
            />
          </Bloc>

          <Bloc accroche="Les sources sur lesquelles les moteurs s’appuient.">
            <Sources reponses={REPONSES} />
          </Bloc>

          <Bloc accroche="Dix actions classées par priorité.">
            <Actions actions={ACTIONS} />
          </Bloc>
        </div>

        <Rule className="mt-20" />
        <p className="mt-6 max-w-[62ch] text-[15px] leading-[1.6] text-ink-3">
          {fr(
            "Aucun chiffre de cette page ne provient d’un client réel. Le cabinet et ses concurrents sont inventés ; la structure du rapport, elle, est celle que vous recevrez.",
          )}
        </p>
      </div>
    </Apparition>
  );
}
