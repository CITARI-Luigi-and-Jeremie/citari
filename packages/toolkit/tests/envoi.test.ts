import { describe, expect, it } from "vitest";
import {
  botsBloquesDe,
  decisionEnvoi,
  demandeStop,
  type LeadEnvoi,
  type RelanceEnvoi,
} from "../src/lib/envoi.js";

/**
 * Les refus d'envoi sont la partie qui compte : un email raté ne se rattrape
 * pas. Chaque refus testé ici est un incident réel qu'on ne veut jamais vivre.
 */

const leadSain: LeadEnvoi = {
  id: "l1",
  email: "prospect@exemple.fr",
  status: "nouveau",
  unsubscribed_at: null,
  converted: false,
};

function relanceDue(surcharges: Partial<RelanceEnvoi> = {}): RelanceEnvoi {
  return {
    id: "f1",
    step: 1,
    due_on: "2026-08-10",
    subject: "Une question sur Cabinet Vaurel",
    body: "Bonjour,\n\nVous avez mesuré votre visibilité...\nhttps://citari.fr/rapport/abc",
    sent_at: null,
    cancelled: false,
    ...surcharges,
  };
}

const jour = (iso: string) => new Date(`${iso}T09:00:00Z`);

describe("decisionEnvoi", () => {
  it("envoie une relance due à un lead sain", () => {
    expect(decisionEnvoi(relanceDue(), leadSain, jour("2026-08-10"))).toEqual({ ok: true });
  });

  it("refuse un désinscrit, quoi qu'il arrive", () => {
    const d = decisionEnvoi(
      relanceDue(),
      { ...leadSain, unsubscribed_at: "2026-08-09T10:00:00Z" },
      jour("2026-08-10"),
    );
    expect(d.ok).toBe(false);
    if (!d.ok) expect(d.raison).toContain("désinscrit");
  });

  it("refuse un converti : on ne relance pas un client", () => {
    expect(decisionEnvoi(relanceDue(), { ...leadSain, converted: true }, jour("2026-08-10")).ok).toBe(false);
  });

  it("refuse un statut inconnu : dans le doute, on s'abstient", () => {
    expect(decisionEnvoi(relanceDue(), { ...leadSain, status: "perdu" }, jour("2026-08-10")).ok).toBe(false);
  });

  it("refuse ce qui n'est pas encore dû", () => {
    expect(decisionEnvoi(relanceDue({ due_on: "2026-08-12" }), leadSain, jour("2026-08-10")).ok).toBe(false);
  });

  it("refuse un mail 0 périmé : « votre scan est terminé » dix jours après est absurde", () => {
    const d = decisionEnvoi(relanceDue({ step: 0, due_on: "2026-08-01" }), leadSain, jour("2026-08-10"));
    expect(d.ok).toBe(false);
    if (!d.ok) expect(d.raison).toContain("périmé");
  });

  it("tolère un mail 0 en retard de moins de trois jours", () => {
    expect(decisionEnvoi(relanceDue({ step: 0, due_on: "2026-08-08" }), leadSain, jour("2026-08-10")).ok).toBe(true);
  });

  it("refuse une relance très en retard : J+7 envoyé à J+40 ressemble à un système cassé", () => {
    expect(decisionEnvoi(relanceDue({ due_on: "2026-07-01" }), leadSain, jour("2026-08-10")).ok).toBe(false);
  });

  it("refuse un corps avec un lien localhost : la configuration est incomplète", () => {
    const d = decisionEnvoi(
      relanceDue({ body: "Votre rapport : http://localhost:3000/rapport/abc" }),
      leadSain,
      jour("2026-08-10"),
    );
    expect(d.ok).toBe(false);
    if (!d.ok) expect(d.raison).toContain("localhost");
  });

  it("refuse un gabarit non rempli (BOOKING_URL absente)", () => {
    expect(
      decisionEnvoi(relanceDue({ body: "Réservez : [LIEN DE RÉSERVATION]" }), leadSain, jour("2026-08-10")).ok,
    ).toBe(false);
  });

  it("refuse le déjà envoyé et l'annulé", () => {
    expect(decisionEnvoi(relanceDue({ sent_at: "2026-08-09T08:00:00Z" }), leadSain, jour("2026-08-10")).ok).toBe(false);
    expect(decisionEnvoi(relanceDue({ cancelled: true }), leadSain, jour("2026-08-10")).ok).toBe(false);
  });
});

describe("demandeStop", () => {
  it.each([
    "STOP",
    "stop svp",
    "Merci de me désinscrire",
    "je veux me desabonner",
    "ne plus me contacter",
    "plus de mails merci",
    "Supprimez mes données",
  ])("reconnaît « %s »", (texte) => {
    expect(demandeStop(texte)).toBe(true);
  });

  it("ne se déclenche pas sur une vraie réponse", () => {
    expect(demandeStop("Intéressant, on peut se rappeler la semaine prochaine ?")).toBe(false);
    // « stop » à l'intérieur d'un mot ne compte pas.
    expect(demandeStop("nous utilisons Shopstop comme prestataire")).toBe(false);
  });
});

describe("botsBloquesDe", () => {
  it("détecte un blocage global", () => {
    const contenu = "User-agent: *\nDisallow: /";
    expect(botsBloquesDe(contenu, ["GPTBot", "ClaudeBot"])).toEqual(["GPTBot", "ClaudeBot"]);
  });

  it("la section d'un agent nommé prime sur la section générique", () => {
    const contenu = "User-agent: *\nDisallow: /\n\nUser-agent: GPTBot\nDisallow:";
    expect(botsBloquesDe(contenu, ["GPTBot", "ClaudeBot"])).toEqual(["ClaudeBot"]);
  });

  it("un Disallow partiel n'est pas un blocage", () => {
    const contenu = "User-agent: GPTBot\nDisallow: /admin";
    expect(botsBloquesDe(contenu, ["GPTBot"])).toEqual([]);
  });

  it("robots.txt vide : rien n'est bloqué", () => {
    expect(botsBloquesDe("", ["GPTBot"])).toEqual([]);
  });

  it("reproduit la lecture de l'audit du scan : agents groupés", () => {
    const contenu = "User-agent: GPTBot\nUser-agent: ClaudeBot\nDisallow: /";
    expect(botsBloquesDe(contenu, ["GPTBot", "ClaudeBot", "PerplexityBot"])).toEqual(["GPTBot", "ClaudeBot"]);
  });
});
