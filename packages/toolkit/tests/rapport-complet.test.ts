import { describe, expect, it } from "vitest";
import {
  agregerSources,
  type Matrice,
  choisirQuestionCle,
  construireMatrice,
  construirePlan,
  extrait,
  hoteClient,
  hoteDeSource,
  intentionsDeLaMatrice,
  phrasePortee,
  reponsesRecommandees,
  tonaliteDeLaMarque,
  piecesAConviction,
  questionsGagnables,
  titreMatrice,
  titreSources,
} from "@/lib/rapport-complet";
import type { LigneMention, LigneQuestion, LigneReponse } from "@/lib/rapport-apercu";

/**
 * Le VRAI assemblage du document de mesure, importé du site.
 *
 * Ces tests verrouillent les règles de la maison sur la refonte du
 * 15/08/2026 : l'unité RÉPONSE, l'erreur hors dénominateur, les institutions
 * hors classement, et un plan construit sur des constats mesurés.
 */

const question = (id: string, rank: number, intent = "comparative", text?: string): LigneQuestion => ({
  id,
  rank,
  intent,
  text: text ?? `Question ${rank}`,
});

const reponse = (
  query_id: string,
  engine: string,
  extra: Partial<LigneReponse & { sources: unknown }> = {},
): LigneReponse & { sources?: unknown } => ({
  id: `${query_id}-${engine}`,
  query_id,
  engine,
  raw_text: "Réponse mesurée, conservée mot pour mot pour le rapport.",
  error: null,
  ...extra,
});

let compteur = 0;
const mention = (
  query_id: string,
  engine: string,
  brand: string,
  extra: Partial<LigneMention> = {},
): LigneMention => ({
  id: `m-${(compteur += 1)}`,
  query_id,
  response_id: `${query_id}-${engine}`,
  engine,
  brand,
  is_target: false,
  position: null,
  recommended: false,
  sentiment: null,
  verbatim: null,
  ...extra,
});

describe("construireMatrice", () => {
  const questions = [question("q1", 1), question("q2", 2)];
  const reponses = [
    reponse("q1", "ChatGPT"),
    reponse("q1", "Gemini"),
    reponse("q2", "ChatGPT"),
    reponse("q2", "Gemini", { error: "panne", raw_text: null }),
  ];

  it("pose l'état de chaque case : cité, absent, erreur", () => {
    const mentions = [
      mention("q1", "ChatGPT", "Moi", { is_target: true, position: 3 }),
      mention("q1", "ChatGPT", "Moi", { is_target: true, position: 1 }),
    ];
    const m = construireMatrice(questions, reponses, mentions);
    // Deux mentions de la cible dans la même réponse : UNE case, meilleure position.
    expect(m.lignes[0]!.cellules.ChatGPT).toEqual({ etat: "cite", position: 1, recommande: false });
    expect(m.lignes[0]!.cellules.Gemini!.etat).toBe("absent");
    expect(m.lignes[1]!.cellules.Gemini!.etat).toBe("erreur");
    expect(m.questionsCitees).toBe(1);
  });

  it("ne compte pas une réponse en erreur dans le dénominateur du moteur", () => {
    const m = construireMatrice(questions, reponses, []);
    expect(m.totaux.Gemini).toEqual({ citees: 0, mesurees: 1 });
    expect(m.totaux.ChatGPT).toEqual({ citees: 0, mesurees: 2 });
  });

  it("choisit un rival comme tenant, jamais une institution, un géant à défaut", () => {
    const mentions = [
      mention("q1", "ChatGPT", "Ordre des experts-comptables"),
      mention("q1", "ChatGPT", "KPMG"),
      mention("q1", "Gemini", "KPMG"),
      mention("q1", "Gemini", "Cabinet Voisin"),
    ];
    const classes = { "Ordre des experts-comptables": "institution", KPMG: "geant", "Cabinet Voisin": "rival" };
    const m = construireMatrice(questions, reponses, mentions, classes);
    // KPMG est plus cité (2 réponses), mais le rival passe devant.
    expect(m.lignes[0]!.tenant).toEqual({ nom: "Cabinet Voisin", classe: "rival", reponses: 1 });

    const sansRival = construireMatrice(questions, reponses, mentions.slice(0, 3), classes);
    expect(sansRival.lignes[0]!.tenant?.nom).toBe("KPMG");
  });

  it("énonce le constat dans le titre, y compris le zéro", () => {
    expect(titreMatrice(0, 24, 24)).toBe("Sur 24 questions posées, votre marque n'apparaît jamais.");
    expect(titreMatrice(1, 24, 24)).toBe("Sur 24 questions posées, votre marque apparaît sur une seule.");
    expect(titreMatrice(3, 24, 24)).toBe("Sur 24 questions posées, votre marque apparaît sur 3.");
  });

  it("annonce une collecte amputée au lieu de compter l'absence de mesure comme une défaite", () => {
    expect(titreMatrice(3, 20, 24)).toBe(
      "Sur 24 questions posées, 20 ont pu être mesurées ; votre marque apparaît sur 3.",
    );
  });

  it("une question dont toutes les réponses sont en erreur n'est pas mesurée, donc jamais « gagnable »", () => {
    const troisQuestions = [
      question("q1", 1, "comparative"),
      question("q2", 2, "comparative"),
      question("q3", 3, "comparative"),
    ];
    const troisReponses = [
      reponse("q1", "ChatGPT"),
      // q2 : la panne totale (plafond de coût, moteur à sec). Pas une défaite.
      reponse("q2", "ChatGPT", { error: "panne", raw_text: null }),
      reponse("q3", "ChatGPT"),
    ];
    const m = construireMatrice(troisQuestions, troisReponses, [mention("q3", "ChatGPT", "Rival A")]);
    expect(m.lignes[1]!.mesuree).toBe(false);
    expect(m.questionsMesurees).toBe(2);

    const g = questionsGagnables(m, [mention("q3", "ChatGPT", "Rival A")], { "Rival A": "rival" });
    // q1 (mesurée, vraiment vide) et q3 (perdue face à un rival) sortent ;
    // q2 (non mesurée) jamais, même si son score de gagnabilité aurait été
    // maximal faute de tenant.
    expect(g.map((x) => x.id)).toEqual(["q1", "q3"]);
  });
});

describe("agregerSources", () => {
  it("agrège tous les moteurs, regroupe par hôte et reconnaît le site du client", () => {
    const reponses = [
      reponse("q1", "ChatGPT", {
        sources: [
          { url: "https://www.wojo.com/landing/?utm_source=openai" },
          { url: "https://exemple.fr/page" },
        ],
      }),
      reponse("q1", "Perplexity", { sources: [{ url: "https://wojo.com/autre" }] }),
      reponse("q2", "Claude", { sources: [{ url: "https://blog.exemple.fr/article" }] }),
    ];
    const s = agregerSources(reponses, "https://www.exemple.fr");
    expect(s.totalLectures).toBe(4);
    expect(s.totalDomaines).toBe(3);
    // wojo.com : « www. » retiré, deux moteurs regroupés.
    const wojo = s.domaines.find((d) => d.hote === "wojo.com");
    expect(wojo).toMatchObject({ lectures: 2, moteurs: ["ChatGPT", "Perplexity"] });
    // Le site du client est reconnu, sous-domaines compris.
    expect(s.lecturesVotreSite).toBe(2);
    expect(s.domaines.find((d) => d.hote === "exemple.fr")?.votreSite).toBe(true);
    expect(s.domaines.find((d) => d.hote === "blog.exemple.fr")?.votreSite).toBe(true);
  });

  it("ignore les réponses en erreur et les URL inanalysables", () => {
    const s = agregerSources(
      [
        reponse("q1", "ChatGPT", { error: "panne", sources: [{ url: "https://a.fr" }] }),
        reponse("q2", "ChatGPT", { sources: [{ url: "pas une url" }, { url: 42 }] }),
      ],
      null,
    );
    expect(s.totalLectures).toBe(0);
    expect(titreSources(s)).toBeNull();
  });

  it("dit « jamais » quand le site du client n'a pas été lu", () => {
    const s = agregerSources([reponse("q1", "ChatGPT", { sources: [{ url: "https://a.fr" }] })], "b.fr");
    expect(titreSources(s)).toBe("Pour répondre, les moteurs ont lu 1 site. Le vôtre : jamais.");
  });

  it("hoteDeSource et hoteClient normalisent pareil", () => {
    expect(hoteDeSource("https://www.Exemple.fr/x?utm_source=openai")).toBe("exemple.fr");
    expect(hoteClient("https://www.exemple.fr/page")).toBe("exemple.fr");
    expect(hoteClient("exemple.fr")).toBe("exemple.fr");
    expect(hoteClient(null)).toBeNull();
  });
});

describe("questionsGagnables", () => {
  it("ne retient que les questions perdues, l'achat d'abord, le champ faible d'abord", () => {
    const questions = [
      question("q1", 1, "comparative"),
      question("q2", 2, "comparative"),
      question("q3", 3, "probleme"),
    ];
    const reponses = ["q1", "q2", "q3"].flatMap((q) => [reponse(q, "ChatGPT"), reponse(q, "Gemini")]);
    const mentions = [
      // q1 : gagnée par la marque, elle ne doit pas sortir.
      mention("q1", "ChatGPT", "Moi", { is_target: true }),
      // q2 : tenue par un rival isolé.
      mention("q2", "ChatGPT", "Rival A"),
      // q3 : tenue par deux géants.
      mention("q3", "ChatGPT", "KPMG"),
      mention("q3", "Gemini", "Deloitte"),
    ];
    const classes = { "Rival A": "rival", KPMG: "geant", Deloitte: "geant" };
    const matrice = construireMatrice(questions, reponses, mentions, classes);
    const g = questionsGagnables(matrice, mentions, classes);
    expect(g.map((x) => x.id)).toEqual(["q2", "q3"]);
    expect(g[0]!.raison).toContain("Rival A (1 réponse)");
    expect(g[0]!.raison).toContain("aucun géant");
  });

  it("écarte plateformes et institutions du champ mesuré", () => {
    const questions = [question("q1", 1)];
    const reponses = [reponse("q1", "ChatGPT")];
    const mentions = [mention("q1", "ChatGPT", "Annuaire"), mention("q1", "ChatGPT", "Ordre")];
    const classes = { Annuaire: "outil", Ordre: "institution" };
    const matrice = construireMatrice(questions, reponses, mentions, classes);
    const g = questionsGagnables(matrice, mentions, classes);
    expect(g[0]!.tenants).toEqual([]);
    expect(g[0]!.raison).toBe("Personne ne tient cette question : la place est vide.");
  });
});

describe("choisirQuestionCle", () => {
  it("préfère la comparative disputée où la marque est absente, et donne les six faces", () => {
    const questions = [question("q1", 1, "probleme"), question("q2", 2, "comparative")];
    const moteurs = ["ChatGPT", "Claude", "Gemini"];
    const reponses = ["q1", "q2"].flatMap((q) => moteurs.map((m) => reponse(q, m)));
    const mentions = [
      mention("q1", "ChatGPT", "Moi", { is_target: true, position: 2 }),
      mention("q2", "ChatGPT", "Rival A", { position: 1 }),
      mention("q2", "Claude", "Rival B"),
      mention("q2", "Gemini", "Rival A"),
    ];
    const cle = choisirQuestionCle(questions, reponses, mentions, "Moi", { "Rival A": "rival", "Rival B": "rival" });
    expect(cle?.id).toBe("q2");
    expect(cle?.enjeu).toBe("2 marques se partagent cette réponse. La vôtre n'y est pas.");
    expect(cle?.faces).toHaveLength(3);
    expect(cle?.faces[0]!.statut).toBe("Moi : absent");
    expect(cle?.faces[0]!.marques).toContain("Rival A");
  });

  it("marque « hors mesure » une face en erreur, sans l'inventer", () => {
    const questions = [question("q1", 1)];
    const reponses = [reponse("q1", "ChatGPT"), reponse("q1", "Gemini", { error: "panne", raw_text: null })];
    const mentions = [mention("q1", "ChatGPT", "Rival A")];
    const cle = choisirQuestionCle(questions, reponses, mentions, "Moi");
    const gemini = cle?.faces.find((f) => f.moteur === "Gemini");
    expect(gemini).toMatchObject({ erreur: true, extrait: null });
  });
});

describe("piecesAConviction", () => {
  const verbatim = "Pour ce besoin précis, je recommande vivement Rival A, dont l'offre est la plus complète du marché.";

  it("retient l'absence d'abord, et écarte un inconnu hors question d'achat", () => {
    const questions = [question("q1", 1, "probleme"), question("q2", 2, "comparative")];
    const mentions = [
      // Inconnu sur une question de dépannage : le garde-fou anti-GeoComply.
      mention("q1", "ChatGPT", "GeoComply", { verbatim }),
      mention("q2", "ChatGPT", "Rival A", { verbatim, recommended: true }),
    ];
    const pieces = piecesAConviction(questions, mentions, "Moi", { "Rival A": "rival" });
    expect(pieces).toHaveLength(1);
    expect(pieces[0]!.concurrent).toBe("Rival A");
    expect(pieces[0]!.statut).toBe("Moi : absent de cette réponse");
    expect(pieces[0]!.texte).toContain("*Rival A*");
  });

  it("n'utilise jamais deux fois la même question, ni celle déjà montrée en face à face", () => {
    const questions = [question("q1", 1, "comparative"), question("q2", 2, "comparative")];
    const mentions = [
      mention("q1", "ChatGPT", "Rival A", { verbatim }),
      mention("q1", "Gemini", "Rival B", { verbatim: verbatim.replace("Rival A", "Rival B") }),
      mention("q2", "ChatGPT", "Rival A", { verbatim }),
    ];
    const classes = { "Rival A": "rival", "Rival B": "rival" };
    const pieces = piecesAConviction(questions, mentions, "Moi", classes, {}, "q1");
    expect(pieces).toHaveLength(1);
    expect(pieces[0]!.rang).toBe(2);
  });
});

describe("construirePlan", () => {
  const sourcesVides = { domaines: [], totalLectures: 0, totalDomaines: 0, lecturesVotreSite: 0, moteursAvecSources: [] };
  const matriceDe = (citees: number, total: number): Matrice =>
    ({
      moteurs: ["ChatGPT"],
      lignes: Array.from({ length: total }, (_, i) => ({
        id: `q${i}`,
        rang: i + 1,
        texte: `Q${i}`,
        intent: "comparative",
        citee: i < citees,
        mesuree: true,
        tenant: null,
        cellules: {},
      })),
      totaux: {},
      questionsCitees: citees,
      questionsMesurees: total,
    });

  it("répartit les actions par chantier et ouvre chaque phase sur un constat mesuré", () => {
    const actions = [
      { chantier: "Technique", titre: "Débloquer robots.txt", pourquoi: "…", effort: "faible" },
      { chantier: "Contenu", titre: "Page comparative", pourquoi: "…", effort: "moyen" },
      { chantier: "Citations", titre: "Fiches d'autorité", pourquoi: "…", effort: "faible" },
    ];
    const technique = { bloques: ["GPTBot"], autorises: [], llmstxt: false };
    const sources = {
      domaines: [
        { hote: "moncabinet.fr", lectures: 9, moteurs: ["ChatGPT"], votreSite: true },
        { hote: "classement.fr", lectures: 7, moteurs: ["Perplexity"], votreSite: false },
      ],
      totalLectures: 16,
      totalDomaines: 2,
      lecturesVotreSite: 9,
      moteursAvecSources: ["ChatGPT", "Perplexity"],
    };
    const plan = construirePlan({
      actions,
      gagnables: [
        { id: "q1", rang: 1, texte: "Quel cabinet choisir ?", intent: "comparative", raison: "…", tenants: [] },
      ],
      sources,
      technique,
      matrice: matriceDe(3, 24),
      site: "moncabinet.fr",
    });
    expect(plan).toHaveLength(3);
    expect(plan[0]!.constat).toContain("GPTBot est refusé");
    expect(plan[0]!.constat).toContain("llms.txt est absent");
    expect(plan[0]!.actions.map((a) => a.titre)).toEqual(["Débloquer robots.txt"]);
    expect(plan[1]!.constat).toContain("21 questions sur 24 mesurées");
    expect(plan[1]!.cibles[0]!.titre).toBe("« Quel cabinet choisir ? »");
    // Le site du client ne figure jamais dans ses propres cibles de citation.
    expect(plan[2]!.cibles.map((c) => c.titre)).toEqual(["classement.fr"]);
  });

  it("reste honnête quand l'audit a échoué et que les sources manquent", () => {
    const plan = construirePlan({
      actions: [],
      gagnables: [],
      sources: sourcesVides,
      technique: null,
      matrice: matriceDe(24, 24),
      site: null,
    });
    expect(plan[0]!.constat).toContain("n'a pas pu être lu");
    expect(plan[1]!.constat).toContain("toutes les questions mesurées");
    expect(plan[2]!.constat).toContain("n'ont pas exposé leurs sources");
    expect(plan[2]!.cibles).toEqual([]);
  });
});

describe("extrait", () => {
  it("coupe au mot et l'annonce, ne coupe pas un texte court", () => {
    expect(extrait("court", 320)).toEqual({ texte: "court", coupe: false });
    const long = "mot ".repeat(200).trim();
    const e = extrait(long, 100);
    expect(e.coupe).toBe(true);
    expect(e.texte.endsWith("…")).toBe(true);
    expect(e.texte.length).toBeLessThanOrEqual(102);
  });
});

describe("les bornes des phases, pour la frise à l'échelle", () => {
  it("porte des jours en nombres, et les phases se chevauchent", () => {
    const plan = construirePlan({
      actions: [],
      gagnables: [],
      sources: { domaines: [], totalLectures: 0, totalDomaines: 0, lecturesVotreSite: 0, moteursAvecSources: [] },
      technique: null,
      matrice: {
        moteurs: [],
        lignes: [],
        totaux: {},
        questionsCitees: 0,
        questionsMesurees: 0,
      },
      site: null,
    });
    expect(plan.map((p) => [p.debut, p.fin])).toEqual([
      [1, 15],
      [8, 45],
      [30, 90],
    ]);
    // Le chevauchement EST l'argument commercial : les chantiers sont
    // concurrents, pas séquentiels, et trois blocs empilés le dissimulaient.
    expect(plan[1]!.debut).toBeLessThan(plan[0]!.fin);
    expect(plan[2]!.debut).toBeLessThan(plan[1]!.fin);
    // La frise couvre J1 à J90 : aucune phase ne sort du cadre dessiné.
    expect(Math.min(...plan.map((p) => p.debut))).toBe(1);
    expect(Math.max(...plan.map((p) => p.fin))).toBe(90);
  });
});

describe("les données mesurées et jamais montrées (passe 3)", () => {
  const q = (id: string, rang: number, intent: string) => question(id, rang, intent);

  it("ventile les questions en quatre états qui somment au total posé", () => {
    const questions = [q("q1", 1, "comparative"), q("q2", 2, "comparative"), q("q3", 3, "locale")];
    const reponses = [
      reponse("q1", "ChatGPT"),
      reponse("q2", "ChatGPT"),
      reponse("q3", "ChatGPT", { error: "panne", raw_text: null }),
    ];
    const mentions = [
      mention("q1", "ChatGPT", "Moi", { is_target: true }),
      mention("q2", "ChatGPT", "Rival A"),
    ];
    const m = construireMatrice(questions, reponses, mentions, { "Rival A": "rival" });
    const g = intentionsDeLaMatrice(m);
    const comparative = g.find((x) => x.intent === "comparative")!;
    expect(comparative).toMatchObject({ posees: 2, citees: 1, tenues: 1, vides: 0, nonMesurees: 0 });
    const locale = g.find((x) => x.intent === "locale")!;
    expect(locale).toMatchObject({ posees: 1, nonMesurees: 1, citees: 0 });
    // La somme des quatre états vaut le total posé, par construction.
    for (const x of g) {
      expect(x.citees + x.tenues + x.vides + x.nonMesurees).toBe(x.posees);
    }
    // L'ordre suit la méthode : comparative, problème, locale, confiance.
    expect(g.map((x) => x.intent)).toEqual(["comparative", "locale"]);
  });

  it("une seule intention ne fait pas une bande", () => {
    const questions = [q("q1", 1, "comparative"), q("q2", 2, "comparative")];
    const reponses = [reponse("q1", "ChatGPT"), reponse("q2", "ChatGPT")];
    expect(intentionsDeLaMatrice(construireMatrice(questions, reponses, []))).toEqual([]);
  });

  it("la portée n'affirme jamais plus que l'échantillon ne montre", () => {
    expect(phrasePortee({ ville: "Paris", locales: 5, posees: 24 })).toBe(
      "Portée locale : 5 des 24 questions nomment Paris.",
    );
    // Une ville déclarée mais aucune question locale : on le dit, on ne fait
    // pas semblant d'avoir mesuré une portée locale.
    expect(phrasePortee({ ville: "Paris", locales: 0, posees: 24 })).toContain("aucune question");
    expect(phrasePortee({ ville: null, locales: 0, posees: 20 })).toBe(
      "Portée nationale : aucune question ne nomme de ville.",
    );
  });

  it("la tonalité compte des RÉPONSES, et le négatif prime sur le positif", () => {
    const mentions = [
      // Même réponse, deux sentiments : elle ne compte qu'une fois, au pire.
      mention("q1", "ChatGPT", "Moi", { is_target: true, sentiment: "positif" }),
      { ...mention("q1", "ChatGPT", "Moi", { is_target: true, sentiment: "negatif" }) },
      mention("q2", "Gemini", "Moi", { is_target: true, sentiment: "positif" }),
      // Le sentiment d'un concurrent ne nous concerne pas.
      mention("q3", "Gemini", "Rival A", { sentiment: "positif" }),
    ];
    expect(tonaliteDeLaMarque(mentions)).toEqual({
      positives: 1,
      neutres: 0,
      negatives: 1,
      total: 2,
    });
    expect(tonaliteDeLaMarque([])).toBeNull();
  });

  it("compte les réponses où une marque est EXPLICITEMENT recommandée", () => {
    const mentions = [
      mention("q1", "ChatGPT", "Wojo", { recommended: true }),
      // Deux mentions recommandées dans la même réponse : une seule réponse.
      mention("q1", "ChatGPT", "Wojo", { recommended: true }),
      mention("q2", "Gemini", "wojo.com", { recommended: true }),
      mention("q3", "Gemini", "Wojo", { recommended: false }),
      mention("q4", "Gemini", "Moi", { is_target: true, recommended: true }),
    ];
    // Les variantes d'écriture sont regroupées, comme partout ailleurs.
    expect(reponsesRecommandees(mentions, "Wojo", { "wojo.com": "Wojo" })).toBe(2);
    expect(reponsesRecommandees(mentions, null, {}, true)).toBe(1);
  });
});

describe("la visio : l'assemblage du support de présentation", () => {
  it("écarte les domaines détenus par un rival ou un géant des cibles de citation", async () => {
    const { domainesCitables } = await import("@/lib/visio");
    const domaines = [
      { hote: "ubiq.fr", lectures: 23, votreSite: false },
      { hote: "deskeo.com", lectures: 18, votreSite: false },
      { hote: "wework.com", lectures: 11, votreSite: false },
      { hote: "bureauxlocaux.com", lectures: 8, votreSite: false },
      { hote: "monsite.fr", lectures: 9, votreSite: true },
    ];
    const classes = { Deskeo: "rival", WeWork: "geant", Ubiq: "outil" };
    const citables = domainesCitables(domaines, classes, {});
    // Une place de marché reste citable ; le site d'un rival, jamais ; le
    // sien non plus (on ne se cite pas soi-même comme conquête).
    expect(citables.map((c) => c.hote)).toEqual(["ubiq.fr", "bureauxlocaux.com"]);
  });

  it("n'offre jamais une adresse d'infrastructure comme cible de citation", async () => {
    const { domainesCitables, estInfrastructure } = await import("@/lib/visio");
    expect(estInfrastructure("vertexaisearch.cloud.google.com")).toBe(true);
    expect(estInfrastructure("webcache.googleusercontent.com")).toBe(true);
    expect(estInfrastructure("ubiq.fr")).toBe(false);
    // Un proxy de recherche lu 40 fois ne devient jamais une cible : on ne
    // s'y inscrit pas, et le proposer en visio ruine la liste entière.
    const citables = domainesCitables(
      [
        { hote: "vertexaisearch.cloud.google.com", lectures: 40, votreSite: false },
        { hote: "ubiq.fr", lectures: 3, votreSite: false },
      ],
      {},
      {},
    );
    expect(citables.map((c) => c.hote)).toEqual(["ubiq.fr"]);
  });

  it("la remesure se calcule depuis la date du scan, jamais depuis l'horloge", async () => {
    const { dateRemesure } = await import("@/lib/visio");
    expect(dateRemesure("2026-08-15T21:13:57+00:00")).toBe("13 novembre 2026");
  });

  it("compte le lexique à l'unité réponse, pluriels compris, termes absents écartés", async () => {
    const { compterLexique } = await import("@/lib/visio");
    const r = (id: string, texte: string | null, error: string | null = null) => ({
      id,
      query_id: "q1",
      engine: "ChatGPT",
      raw_text: texte,
      error,
      sources: [],
    });
    const reponses = [
      // Trois emplois dans UNE réponse comptent pour une seule.
      r("a", "Le bureau opéré, le bureau opéré, encore le bureau opéré."),
      // Le pluriel doit être vu : c'est le bug qui sous-comptait d'un cinquième.
      r("b", "Les bureaux opérés sont une alternative au bail 3/6/9."),
      // Une réponse en erreur ne compte dans aucun dénominateur.
      r("c", "bureau opéré partout", "indisponible"),
    ];
    const questions = [
      { id: "q1", rank: 1, text: "Bureau opéré ou bail commercial ?", intent: "comparative" },
    ];
    const compte = compterLexique(
      [
        { terme: "bureau opéré", camp: "vous" },
        { terme: "bail 3/6/9", camp: "eux" },
        { terme: "flex office", camp: "neutre" },
      ],
      reponses,
      questions,
    );
    expect(compte.map((c) => [c.terme, c.reponses, c.questions])).toEqual([
      ["bureau opéré", 2, 1],
      ["bail 3/6/9", 1, 0],
    ]);
  });

  it("choisit la réponse à exposer : la plus riche en concurrents, texte nettoyé, coupe annoncée", async () => {
    const { reponseExposable } = await import("@/lib/visio");
    const questions = [
      { id: "q1", rank: 1, text: "Bureau opéré ou bail ?", intent: "comparative" },
    ];
    const reponses = [
      { id: "r1", query_id: "q1", engine: "Claude", raw_text: "**Wojo** et **Deskeo** dominent.\n\n### Détail\n- point", error: null, sources: [] },
      { id: "r2", query_id: "q1", engine: "Grok", raw_text: "Réponse sans marque.", error: null, sources: [] },
    ];
    const mentions = [
      { id: "m1", response_id: "r1", query_id: "q1", engine: "Claude", brand: "Wojo", is_target: false, position: 1, recommended: true, sentiment: null, verbatim: null },
      { id: "m2", response_id: "r1", query_id: "q1", engine: "Claude", brand: "Deskeo Flex", is_target: false, position: 2, recommended: false, sentiment: null, verbatim: null },
    ] as never[];
    const piece = reponseExposable(questions, reponses, mentions, { "Deskeo Flex": "Deskeo" });
    expect(piece?.moteur).toBe("Claude");
    // Le markdown saute, les paragraphes restent, rien n'est inventé.
    expect(piece?.texte).toBe("Wojo et Deskeo dominent.\n\nDétail\n· point");
    expect(piece?.coupe).toBe(false);
    expect(piece?.marques).toEqual(["Wojo", "Deskeo"]);
    expect(piece?.clientCite).toBe(false);
  });

  it("expose la liste de lecture où le site du client est le mieux placé", async () => {
    const { listeDeLecture } = await import("@/lib/visio");
    const questions = [{ id: "q1", rank: 3, text: "Une question", intent: "comparative" }];
    const reponses = [
      { id: "r1", query_id: "q1", engine: "Perplexity", raw_text: "…", error: null,
        sources: [{ url: "https://www.monsite.fr/article-long" }, { url: "https://wojo.com/blog" }] },
      { id: "r2", query_id: "q1", engine: "Claude", raw_text: "…", error: null,
        sources: [{ url: "https://ubiq.fr/x" }, { url: "https://monsite.fr/y" }] },
    ];
    const lecture = listeDeLecture(questions, reponses, [] as never[], "https://monsite.fr");
    expect(lecture?.moteur).toBe("Perplexity");
    expect(lecture?.rangClient).toBe(1);
    expect(lecture?.clientCite).toBe(false);
    expect(lecture?.sources[0]).toEqual({ rang: 1, hote: "monsite.fr", chemin: "/article-long", votre: true });
    expect(lecture?.sources[1]?.votre).toBe(false);
  });

  it("relève le site du client lu en source sans que la réponse le cite", async () => {
    const { luSansEtreCite } = await import("@/lib/visio");
    const rep = (id: string, urls: string[], error: string | null = null) => ({
      id,
      query_id: "q1",
      engine: "Perplexity",
      raw_text: error ? null : "…",
      error,
      sources: urls.map((url) => ({ url })),
    });
    const reponses = [
      // Le site est PREMIÈRE source, et la marque n'est pas citée.
      rep("r1", ["https://monsite.fr/guide", "https://ubiq.fr/x"]),
      // Lu en 3e position, et cité : ne compte pas comme manque.
      rep("r2", ["https://ubiq.fr/a", "https://wojo.com/b", "https://monsite.fr/c"]),
      // Réponse en erreur : hors comptage.
      rep("r3", ["https://monsite.fr/d"], "indisponible"),
    ];
    const mentions = [
      { response_id: "r2", is_target: true, brand: "Moi", engine: "Perplexity", query_id: "q1" },
    ] as never[];
    const vu = luSansEtreCite(reponses, mentions, "https://www.monsite.fr", [
      { id: "q1", rank: 1, text: "Une question", intent: "comparative" },
    ]);
    expect(vu?.hote).toBe("monsite.fr");
    expect(vu?.reponsesQuiLisent).toBe(2);
    expect(vu?.premiereSource).toBe(1);
    expect(vu?.sansCitation).toEqual([
      { question: "Une question", moteur: "Perplexity", rang: 1, premiere: true },
    ]);
  });

  it("relève les sites lus sur UNE question, réponses en erreur exclues", async () => {
    const { sourcesParQuestion } = await import("@/lib/visio");
    const r = (query_id: string, error: string | null, urls: string[]) => ({
      id: `${query_id}-${urls.length}-${error ?? "ok"}`,
      query_id,
      engine: "ChatGPT",
      raw_text: error ? null : "…",
      error,
      sources: urls.map((url) => ({ url })),
    });
    const reponses = [
      r("q1", null, ["https://ubiq.fr/a?utm_source=openai", "https://ubiq.fr/b", "https://www.bureauxlocaux.com/x"]),
      r("q1", null, ["https://bureauxlocaux.com/y"]),
      // La même adresse sur une AUTRE question ne compte pas ici.
      r("q2", null, ["https://autre.fr/z"]),
      // Une réponse en erreur ne compte dans aucun dénominateur : règle de la maison.
      r("q1", "indisponible", ["https://fantome.fr/"]),
    ];
    expect(sourcesParQuestion(reponses, "q1")).toEqual(["bureauxlocaux.com", "ubiq.fr"]);
    expect(sourcesParQuestion(reponses, "q2")).toEqual(["autre.fr"]);
  });
});
