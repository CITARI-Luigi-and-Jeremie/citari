import { describe, expect, it } from "vitest";
import { emailImmediat, emailsDeRelance, enHtml, situationDuScan } from "../src/lib/emails.js";
import type { ScanInsights } from "../src/lib/insights.js";

/** Un scan plausible, que chaque test déforme sur le seul point qui l'intéresse. */
const scan = (patch: Partial<ScanInsights> = {}): ScanInsights =>
  ({
    brand: "Cabinet Vaurel",
    url: "https://cabinet-vaurel.fr",
    sector: "Expertise comptable",
    score: 30,
    scoreLabel: "",
    reportUrl: "https://citari.fr/rapport/tok",
    competitors: [],
    topCompetitor: { name: "In Extenso", share: 0.2, count: 30, reponses: 27 },
    brandShare: 0.1,
    citationsCible: 12,
    citationsConcurrents: 108,
    citationsRivaux: 41,
    concurrentsSuivis: [],
    botsBloques: [],
    auditFait: true,
    llmstxtAbsent: false,
    weakestEngine: null,
    bestEngine: null,
    missedQueries: ["Quel cabinet comptable a Lyon ?"],
    missedCount: 8,
    totalQueries: 20,
    competitorSources: [],
    sourcesUnavailable: false,
    killerQuote: null,
    miroir: null,
    intentions: [],
    rangMoyen: null,
    classement: null,
    reponsesTotal: 40,
    reponsesAvecMarque: 11,
    ...patch,
  }) as ScanInsights;

describe("situationDuScan", () => {
  it("place le blocage technique avant tout, même sur un bon score", () => {
    // Un robot bloqué est une CAUSE : la dire d'abord vaut mieux que commenter
    // un score qu'elle explique.
    expect(situationDuScan(scan({ score: 72, botsBloques: ["GPTBot"] }))).toBe("bloque");
  });

  it("ne vend rien au-dessus de 55", () => {
    expect(situationDuScan(scan({ score: 55 }))).toBe("solide");
  });

  it("juge la présence, pas le score : cité 20 fois n'est pas invisible", () => {
    // Le vrai cas qui a motivé la règle : Dougs, 21/100 mais cité 20 fois.
    // Le score composite l'écrasait sous 25, et l'email lui aurait affirmé
    // qu'il n'existait pas, ce que son propre rapport contredisait.
    expect(situationDuScan(scan({ score: 21, citationsCible: 20, brandShare: 0.12 }))).toBe("marginal");
  });

  it("ne déclare plus invisible une marque citée mais noyée", () => {
    // L'ancienne règle basculait en « invisible » sous 5 % de part de voix.
    // Dans un secteur qui compte des centaines de cabinets, une marque citée
    // treize fois pèse encore moins que ça : elle recevait donc l'email écrit
    // pour une absente, au lieu de celui écrit pour une marque présente et
    // mal placée, qui porte notre meilleur argument. La part de voix informe
    // le rapport ; elle ne décide plus du message.
    expect(situationDuScan(scan({ score: 31, citationsCible: 13, brandShare: 0.046 }))).toBe("marginal");
  });

  it("garde « invisible » pour son sens littéral : jamais cité", () => {
    // Même avec une part de voix nulle et un score nul, c'est bien l'absence
    // de citation qui tranche, et elle seule.
    expect(situationDuScan(scan({ score: 4, citationsCible: 0, brandShare: 0 }))).toBe("invisible");
  });

  it("traite en invisible une marque jamais citée", () => {
    expect(situationDuScan(scan({ citationsCible: 0, brandShare: 0 }))).toBe("invisible");
  });
});

describe("concurrents comparables", () => {
  it("annonce l'écart avec les rivaux, jamais avec le total", () => {
    // 108 concurrents dont 41 comparables : c'est 41 qu'il faut écrire.
    // Annoncer 108 à une PME quand les deux tiers sont des Big Four est exact
    // et décourageant, et surtout ça n'indique aucune action possible.
    const e = emailImmediat(scan({ citationsCible: 0, brandShare: 0 }));
    expect(e.body).toContain("41 fois");
    expect(e.body).not.toContain("108");
  });

  it("reste prudent quand rien n'est classé", () => {
    // Sans classement, citationsRivaux vaut le total : on ne retire rien au
    // client, et le message reste celui d'avant.
    const e = emailImmediat(scan({ citationsCible: 0, brandShare: 0, citationsRivaux: 108 }));
    expect(e.body).toContain("108 fois");
  });
});

describe("concurrents nommés par le prospect", () => {
  it("les met en avant avec leurs vrais chiffres", () => {
    const e = emailImmediat(
      scan({
        citationsCible: 12,
        concurrentsSuivis: [
          { saisi: "Fiducial", releve: "Fiducial", citations: 42 },
          { saisi: "Exco", releve: "Exco", citations: 30 },
        ],
      })
    );
    expect(e.body).toContain("Vous nous aviez cité 2 concurrents");
    expect(e.body).toContain("Fiducial : cité 42 fois");
    expect(e.body).toContain("face à vos 12 citations");
  });

  it("dit aussi quand le concurrent redouté n'est pas cité", () => {
    // Cas fréquent et utile : il désamorce l'idée qu'on cherche à faire peur.
    const e = emailImmediat(
      scan({ concurrentsSuivis: [{ saisi: "Cabinet Untel", releve: null, citations: 0 }] })
    );
    expect(e.body).toContain("Cabinet Untel : jamais cité non plus");
  });

  it("n'écrit rien quand le prospect n'en a nommé aucun", () => {
    expect(emailImmediat(scan()).body).not.toContain("Vous nous aviez cité");
  });
});

describe("cohérence de la séquence", () => {
  it("n'envoie aucune relance quand on a dit qu'on ne vendait rien", () => {
    // Le premier message dit « rien ne presse ». Trois relances qui poussent
    // le diagnostic le contrediraient et détruiraient la confiance construite.
    expect(emailsDeRelance(scan({ score: 72 }))).toHaveLength(0);
  });

  it("relance normalement dans les autres situations", () => {
    expect(emailsDeRelance(scan({ score: 30 }))).toHaveLength(3);
    expect(emailsDeRelance(scan({ botsBloques: ["GPTBot"] }))).toHaveLength(3);
  });

  it("adapte la question de J+2 au blocage technique", () => {
    const [j2] = emailsDeRelance(scan({ botsBloques: ["GPTBot"] }));
    expect(j2!.body).toContain("interdisait l'accès à GPTBot");
  });
});

describe("enHtml", () => {
  it("échappe le contenu, sans quoi une marque avec un chevron casserait la page", () => {
    const s = scan({ brand: "Dupont & <Fils>" });
    const html = enHtml(emailImmediat(s), s);
    expect(html).toContain("Dupont &amp; &lt;Fils&gt;");
    expect(html).not.toContain("<Fils>");
  });

  it("n'affiche le bloc de score que sur le premier message", () => {
    const s = scan();
    expect(enHtml(emailImmediat(s), s)).toContain("Votre score de visibilité IA");
    expect(enHtml(emailsDeRelance(s)[0]!, s)).not.toContain("Votre score de visibilité IA");
  });

  it("n'embarque ni image ni feuille de style externe", () => {
    // Tout ce qui est externe déclenche les filtres et casse chez la moitié
    // des clients mail.
    const s = scan();
    const html = enHtml(emailImmediat(s), s);
    expect(html).not.toMatch(/<img|<link|<style|background-image/);
  });
});

describe("emailImmediat", () => {
  it("n'affiche jamais le markdown brut des moteurs", () => {
    const e = emailImmediat(
      scan({
        killerQuote: {
          query: "Quel cabinet ?",
          engine: "ChatGPT",
          excerpt: "**In Extenso** et *Fiducial* sont les plus cites.",
          competitor: "In Extenso",
        },
      })
    );
    expect(e.body).toContain("In Extenso et Fiducial sont les plus cites.");
    expect(e.body).not.toContain("**");
  });

  it("porte toujours une mention de désinscription", () => {
    for (const s of [
      scan(),
      scan({ score: 72 }),
      scan({ botsBloques: ["GPTBot"] }),
      scan({ citationsCible: 0, brandShare: 0 }),
    ]) {
      expect(emailImmediat(s).body).toMatch(/STOP/);
    }
  });

  it("ne promet pas de rendez-vous quand le score est bon", () => {
    const e = emailImmediat(scan({ score: 72 }));
    expect(e.subject).toContain("rien à vous vendre");
    expect(e.body).toContain("rien ne presse");
  });

  it("écrit « sans exception » quand toutes les questions sont manquées", () => {
    const e = emailImmediat(scan({ citationsCible: 0, brandShare: 0, missedCount: 20, totalQueries: 20 }));
    expect(e.body).toContain("sans exception");
    expect(e.body).not.toContain("Sur 20 de ces 20");
  });
});

describe("les blocs de personnalisation du 14/08", () => {
  it("le miroir n'apparaît que s'il existe, et cite le bon moteur", () => {
    const sans = emailImmediat(scan({ miroir: null }));
    expect(sans.body).not.toContain("fiche d'identité");

    const avec = emailImmediat(
      scan({ miroir: { moteur: "Gemini", extrait: "Cabinet Vaurel est un cabinet lyonnais." } }),
    );
    expect(avec.body).toContain("qui est Cabinet Vaurel, selon Gemini");
    expect(avec.body).toContain("votre fiche d'identité dans Gemini");
    // Jamais « ChatGPT » en dur : l'aperçu peut tirer son miroir de Gemini.
    expect(avec.body).not.toContain("fiche d'identité dans ChatGPT");
  });

  it("le miroir annonce qu'il est la seule question qui prononce le nom", () => {
    // Sans cette phrase, le bloc contredirait le protocole deux paragraphes
    // plus loin, et un dirigeant qui repère l'incohérence doute de tout.
    const e = emailImmediat(scan({ miroir: { moteur: "ChatGPT", extrait: "Un cabinet." } }));
    expect(e.body).toContain("la seule qui prononce votre nom");
    expect(e.body).toContain("ne prononcent jamais le nom");
  });

  it("l'analyste compte en réponses et ne montre que ce qui existe", () => {
    const e = emailImmediat(
      scan({
        intentions: [
          { intent: "comparative", total: 16, presentes: 5 },
          { intent: "locale", total: 8, presentes: 0 },
        ],
        rangMoyen: 5.1,
        classement: { rang: 5, nbMarques: 80 },
      }),
    );
    expect(e.body).toContain("Sur les 16 réponses aux questions où un acheteur compare avant de choisir, vous apparaissez dans 5");
    expect(e.body).toContain("80 marques se partagent vos questions ; vous y êtes au rang 5");
    expect(e.body).toContain("position moyenne est 5,1");
  });

  it("l'analyste se tait plutôt que d'écrire un trou", () => {
    const e = emailImmediat(scan({ intentions: [], rangMoyen: null, classement: null }));
    expect(e.body).not.toContain("ce que votre score ne montre pas");
  });

  it("pas de position moyenne pour une marque jamais citée", () => {
    const e = emailImmediat(scan({ citationsCible: 0, rangMoyen: 3, classement: null }));
    expect(e.body).not.toContain("position moyenne");
  });

  it("le protocole vend la mesure sur chaque mail 0 non solide", () => {
    const e = emailImmediat(scan());
    expect(e.body).toContain("le moteur l'a choisie seul");
    expect(e.body).toContain("un incident chez eux ne fait pas une mauvaise note chez vous");
  });

  it("le mail solide invite au transfert, sans rien vendre", () => {
    const e = emailImmediat(scan({ score: 68 }));
    expect(e.body).toContain("cet email vaut d'être transféré");
    expect(e.body).toContain("rien à vous vendre");
  });

  it("l'objet de l'écart et le rapport comptent dans la même unité", async () => {
    const { accrochesClassees } = await import("../src/lib/accroches.js");
    const a = accrochesClassees(scan({ citationsCible: 4, citationsRivaux: 90 })).find(
      (x) => x.type === "ecart",
    )!;
    expect(a.sujet).toBe("In Extenso cité dans 27 réponses. Vous, 11.");
    expect(a.ouverture).toContain("Sur les 40 réponses obtenues, Cabinet Vaurel apparaît dans 11. In Extenso, dans 27.");
  });
});

describe("le verbatim doit contenir le nom qu'il affirme", () => {
  /** Les moteurs posent le contexte d'abord et ne nomment qu'ensuite. */
  const longuePreface = (marque: string) =>
    "Pour régulariser rapidement, il faut d'abord faire un diagnostic flash avec un expert-comptable, puis traiter les exercices du plus ancien au plus récent en récupérant toutes les pièces et relevés bancaires, avant de déposer les liasses et déclarations manquantes. Concrètement, demandez au cabinet un calendrier écrit et un devis ferme. " +
    `Sur ce type de dossier, ${marque} est souvent cité pour sa réactivité.`;

  it("ouvre la fenêtre à l'endroit du concurrent quand il arrive après la coupe", () => {
    const e = emailImmediat(
      scan({
        killerQuote: { query: "Comment régulariser un retard ?", engine: "Perplexity", excerpt: longuePreface("Dougs"), competitor: "Dougs" },
      }),
    );
    // Le nom doit figurer DANS la citation, pas seulement dans l'affirmation.
    const citation = e.body.split("«")[2]?.split("»")[0] ?? "";
    expect(citation).toContain("Dougs");
    expect(e.body).toContain("Dougs est nommé.");
  });

  it("n'affirme pas qu'un concurrent est nommé quand l'extrait ne le contient pas", () => {
    const e = emailImmediat(
      scan({
        killerQuote: { query: "Quel cabinet ?", engine: "Claude", excerpt: "Une réponse entièrement générique, sans le moindre nom propre dedans.", competitor: "Numbr" },
      }),
    );
    expect(e.body).not.toContain("Numbr est nommé.");
    expect(e.body).toContain("n'y apparaît pas.");
  });

  it("garde la tête de réponse quand le nom y figure déjà", () => {
    const e = emailImmediat(
      scan({
        killerQuote: { query: "Quel cabinet ?", engine: "Claude", excerpt: "Numbr Lyon est très bien noté sur ce segment.", competitor: "Numbr" },
      }),
    );
    expect(e.body).not.toContain("…Numbr");
  });
});

describe("la salutation", () => {
  it("nomme le dirigeant quand son prénom est connu", () => {
    expect(emailImmediat(scan(), { prenom: "Mickael" }).body.startsWith("Bonjour Mickael,")).toBe(true);
    for (const e of emailsDeRelance(scan(), { prenom: "Mickael" })) {
      expect(e.body).toContain("Bonjour Mickael,");
    }
  });

  it("reste neutre sans prénom, et ne laisse jamais d'espace en trop", () => {
    for (const contact of [undefined, { prenom: null }, { prenom: "  " }]) {
      expect(emailImmediat(scan(), contact).body.startsWith("Bonjour,")).toBe(true);
    }
  });
});
