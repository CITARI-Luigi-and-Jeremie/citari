import { describe, expect, it } from "vitest";
import { motSocle, socleGeo } from "@/lib/socle";

/**
 * LE SOCLE : le second axe qui départage les entreprises toutes à 0 de
 * visibilité. Ces tests verrouillent la règle qui compte : ce qui n'est pas
 * mesurable sort du dénominateur, il ne compte jamais comme un échec.
 */
describe("socleGeo", () => {
  const auditOuvert = {
    bots: { GPTBot: "non_mentionne", ClaudeBot: "non_mentionne" },
    llmstxt: false,
  };

  it("en aperçu, la matière lue n'est pas mesurable et sort du dénominateur", () => {
    const s = socleGeo({
      audit: auditOuvert,
      miroir: [],
      lecturesVotreSite: 0,
      sourcesCollectees: false,
    });
    // Trois critères existent, mais seuls l'accès et l'identité sont
    // mesurés : le miroir est absent, la matière n'est pas collectée.
    expect(s.mesures).toBe(2);
    expect(s.points).toBe(1); // accès ouvert, llms.txt absent
    expect(s.rang).toBe(50);
    expect(s.criteres.find((c) => c.cle === "matiere")?.mesure).toBe(false);
  });

  it("départage deux entreprises invisibles : l'une lisible, l'autre non", () => {
    const commune = { miroir: [], sourcesCollectees: false, lecturesVotreSite: 0 };
    const rangee = socleGeo({
      ...commune,
      audit: { bots: { GPTBot: "non_mentionne" }, llmstxt: true },
    });
    const fermee = socleGeo({
      ...commune,
      audit: { bots: { GPTBot: "bloque" }, llmstxt: false },
    });
    expect(rangee.rang).toBe(100);
    expect(fermee.rang).toBe(0);
    // C'est TOUT l'objet du second axe : deux scores de visibilité à 0,
    // deux socles opposés.
    expect(rangee.rang).toBeGreaterThan(fermee.rang!);
  });

  it("reconnaît un moteur qui décrit l'entreprise, ignore celui qui l'ignore", () => {
    const texteQuiDecrit =
      "Snapdesk est une proptech parisienne spécialisée dans la location de bureaux opérés et flexibles pour les PME, avec des contrats sans engagement long et un accompagnement sur mesure des équipes en croissance.";
    const texteQuiIgnore =
      "Je ne trouve rien de solide dans mes connaissances qui me permette de confirmer son existence, son sérieux ou sa réputation, et je préfère ne pas avancer d'informations que je ne peux pas vérifier auprès de sources fiables.";
    const s = socleGeo({
      audit: auditOuvert,
      miroir: [
        { moteur: "Gemini", texte: texteQuiDecrit },
        { moteur: "Claude", texte: texteQuiIgnore },
      ],
      lecturesVotreSite: 0,
      sourcesCollectees: false,
    });
    const rec = s.criteres.find((c) => c.cle === "reconnaissance")!;
    expect(rec.mesure).toBe(true);
    expect(rec.atteint).toBe(true);
    expect(rec.detail).toBe("1 moteur sur 2 vous décrit quand on leur donne votre nom");
  });

  it("un robot explicitement bloqué fait tomber l'accès, « non mentionné » non", () => {
    const bloque = socleGeo({
      audit: { bots: { GPTBot: "bloque", ClaudeBot: "non_mentionne" }, llmstxt: true },
      miroir: [],
      lecturesVotreSite: 0,
      sourcesCollectees: false,
    });
    expect(bloque.criteres.find((c) => c.cle === "acces")?.atteint).toBe(false);
    expect(bloque.criteres.find((c) => c.cle === "acces")?.detail).toContain("GPTBot");
  });

  it("sans aucune donnée mesurable, on ne classe pas : rang null", () => {
    const s = socleGeo({
      audit: null,
      miroir: null,
      lecturesVotreSite: 0,
      sourcesCollectees: false,
    });
    expect(s.mesures).toBe(0);
    expect(s.rang).toBeNull();
    expect(motSocle(s)).toBe("non relevé");
  });

  it("en complet, une lecture du site compte, zéro lecture est un vrai échec", () => {
    const lu = socleGeo({
      audit: auditOuvert,
      miroir: [],
      lecturesVotreSite: 8,
      sourcesCollectees: true,
    });
    const jamaisLu = socleGeo({
      audit: auditOuvert,
      miroir: [],
      lecturesVotreSite: 0,
      sourcesCollectees: true,
    });
    expect(lu.mesures).toBe(3);
    expect(lu.points).toBe(2);
    expect(jamaisLu.points).toBe(1);
  });
});
