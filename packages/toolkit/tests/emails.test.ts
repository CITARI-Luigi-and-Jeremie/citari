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
    topCompetitor: { name: "In Extenso", share: 0.2, count: 30 },
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

  it("traite en invisible une part de voix résiduelle", () => {
    expect(situationDuScan(scan({ score: 31, citationsCible: 13, brandShare: 0.046 }))).toBe("invisible");
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
