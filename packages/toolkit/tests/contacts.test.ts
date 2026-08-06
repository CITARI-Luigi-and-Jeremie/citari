import { describe, expect, it } from "vitest";
import {
  botsIaBloques,
  detecterRegiesPub,
  extraireEmails,
  extraireResponsable,
  extraireTelephones,
  formaterTelephone,
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
