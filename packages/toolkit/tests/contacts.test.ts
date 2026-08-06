import { describe, expect, it } from "vitest";
import {
  botsIaBloques,
  detecterRegiesPub,
  extraireEmails,
  extraireResponsable,
  extraireTelephones,
  formaterTelephone,
  telephoneFrancaisPlausible,
  texteVisible,
} from "../src/lib/contacts.js";

/**
 * Ces extracteurs décident de qui on contacte et à quel numéro. Un faux
 * positif part dans un email de prospection ; c'est le genre d'erreur qui se
 * voit et qui coûte la crédibilité de toute la base.
 */

describe("extraireEmails", () => {
  it("trouve les adresses et classe le domaine du site avant gmail", () => {
    const html = `contact perso : jean.durand@gmail.com — écrire à contact@cabinet-vaurel.fr`;
    const emails = extraireEmails(html, "cabinet-vaurel.fr");
    expect(emails[0]).toBe("contact@cabinet-vaurel.fr");
    expect(emails).toContain("jean.durand@gmail.com");
  });

  it("jette les images, les gabarits et les adresses de prestataires", () => {
    const html = `<img src="logo@2x.png"> nom@domain.com support@wixpress.com noreply@x.fr dpo@y.fr`;
    expect(extraireEmails(html)).toEqual([]);
  });

  it("décode les mailto encodés", () => {
    const html = `<a href="mailto:direction%40cabinet.fr">écrire</a>`;
    expect(extraireEmails(html, "cabinet.fr")).toEqual(["direction@cabinet.fr"]);
  });

  it("met une adresse nominative avant une adresse info@ hors site", () => {
    const emails = extraireEmails(`info@autre.fr et p.martin@autre.fr`, "cabinet.fr");
    expect(emails[0]).toBe("p.martin@autre.fr");
  });
});

describe("extraireTelephones", () => {
  it("sépare mobiles et fixes, et normalise +33", () => {
    const { mobiles, fixes } = extraireTelephones(
      "Standard : 04 78 12 34 56 · Direct : +33 6 12 34 56 78",
    );
    expect(fixes).toEqual(["0478123456"]);
    expect(mobiles).toEqual(["0612345678"]);
  });

  it("ne prend ni SIRET ni code postal collé à un nombre", () => {
    const { mobiles, fixes } = extraireTelephones("SIRET 377 793 401 00086, CP 69003, en 2026");
    expect([...mobiles, ...fixes]).toEqual([]);
  });

  it("formate en paires lisibles", () => {
    expect(formaterTelephone("0478123456")).toBe("04 78 12 34 56");
  });
});

describe("extraireResponsable", () => {
  it("lit le responsable de publication des mentions légales", () => {
    const texte = "SAS au capital de 10 000 €. Responsable de la publication : Madame Claire Fontaine. Hébergeur : OVH.";
    expect(extraireResponsable(texte)).toBe("Claire Fontaine");
  });

  it("rend null plutôt qu'un fragment douteux", () => {
    expect(extraireResponsable("responsable de publication : X")).toBeNull();
  });
});

describe("signaux", () => {
  it("détecte un pixel Google Ads et un pixel Meta", () => {
    const html = `<script src="https://www.googletagmanager.com/gtag/js?id=AW-123"></script>
      <script>fbq('init','999')</script>`;
    const r = detecterRegiesPub(html);
    expect(r).toContain("Google Ads");
    expect(r).toContain("Meta");
  });

  it("lit un robots.txt qui bloque GPTBot mais pas les autres", () => {
    const robots = "User-agent: GPTBot\nDisallow: /\n\nUser-agent: *\nAllow: /";
    expect(botsIaBloques(robots)).toEqual(["GPTBot"]);
  });

  it("applique la section * quand le bot n'est pas nommé", () => {
    const robots = "User-agent: *\nDisallow: /";
    expect(botsIaBloques(robots)).toEqual([
      "GPTBot", "ClaudeBot", "PerplexityBot", "Google-Extended", "OAI-SearchBot",
    ]);
  });
});

describe("texteVisible", () => {
  it("retire scripts et balises, garde le texte", () => {
    const html = `<script>var tel="0400000000"</script><p>Appelez le 04 78 12 34 56</p>`;
    const visible = texteVisible(html);
    expect(visible).toContain("04 78 12 34 56");
    expect(visible).not.toContain("0400000000");
  });
});

describe("extraireResponsable — les faux noms observés en réel", () => {
  it("refuse le texte ordinaire qui suit le mot-clé", () => {
    // Tous ces « noms » ont réellement atterri dans la base du 06/08/2026,
    // parce que le drapeau insensible à la casse acceptait n'importe quel mot.
    for (const faux of [
      "Le gérant est une personne physique",
      "Notre directeur et accompagnement des dirigeants",
      "Le président du conseil syndical",
      "Gérant : de votre structure",
      "Le dirigeant partant en retraite",
      "Président : SAS Pourquoi travailler avec nous",
    ]) {
      expect(extraireResponsable(faux)).toBeNull();
    }
  });

  it("garde les vrais noms, quelle que soit la tournure", () => {
    expect(extraireResponsable("Responsable de la publication : Marie Durand")).toBe("Marie Durand");
    expect(extraireResponsable("Directeur de la publication : M. Jean-Pierre Martin")).toBe("Jean-Pierre Martin");
    expect(extraireResponsable("Gérant : Sylvain Badina")).toBe("Sylvain Badina");
    expect(extraireResponsable("Fabien Gautheron — Président")).toBe("Fabien Gautheron");
  });

  it("refuse un mot seul : un nom de famille sans prénom n'est pas exploitable", () => {
    expect(extraireResponsable("Gérant : Durand")).toBeNull();
  });
});

describe("telephoneFrancaisPlausible — les faux numéros de la base", () => {
  it("refuse les préfixes non attribués issus de SIRET ou de dates", () => {
    // Trois de ces formes sont entrées dans la base du 06/08/2026.
    expect(telephoneFrancaisPlausible("0120048622")).toBe(false);
    expect(telephoneFrancaisPlausible("0103103807")).toBe(false);
    expect(telephoneFrancaisPlausible("0100000000")).toBe(false);
  });

  it("accepte les vrais numéros lyonnais, mobiles et non géographiques", () => {
    expect(telephoneFrancaisPlausible("0478123456")).toBe(true);
    expect(telephoneFrancaisPlausible("04 72 56 08 87")).toBe(true);
    expect(telephoneFrancaisPlausible("0612345678")).toBe(true);
    expect(telephoneFrancaisPlausible("0972592012")).toBe(true);
    expect(telephoneFrancaisPlausible("0130123456")).toBe(true);
    // Formes internationales : normalisées avant contrôle, jamais rejetées
    // pour leur seule écriture. Vingt-trois vrais numéros l'ont été une fois.
    expect(telephoneFrancaisPlausible("+33 4 72 68 22 88")).toBe(true);
    expect(telephoneFrancaisPlausible("0033472682288")).toBe(true);
    // Bornes réelles : 0980 et 0413 existent, un premier jeu trop serré les niait.
    expect(telephoneFrancaisPlausible("0980809094")).toBe(true);
    expect(telephoneFrancaisPlausible("0413419890")).toBe(true);
  });

  it("refuse un indicatif étranger", () => {
    expect(telephoneFrancaisPlausible("+86 21 3152 0261")).toBe(false);
  });

  it("refuse les surtaxés et les formes qui ne sont pas des numéros", () => {
    expect(telephoneFrancaisPlausible("0899123456")).toBe(false);
    expect(telephoneFrancaisPlausible("12345")).toBe(false);
    expect(telephoneFrancaisPlausible("40123456789")).toBe(false);
  });

  it("filtre à la source : un SIRET dans le texte ne devient pas un téléphone", () => {
    const t = extraireTelephones("SIRET 01200486 22 000 15 — tel 04 78 12 34 56");
    expect(t.fixes).toEqual(["0478123456"]);
  });
});
