import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { z } from "zod";

const CreerInput = z.object({
  // Un nom réduit à de la ponctuation (« "" », « nutri) ») rendrait la
  // détection impossible et produirait un 0/100 artefactuel présenté comme
  // un diagnostic. On refuse à la porte, avec un message actionnable.
  marque: z
    .string()
    .trim()
    .min(1)
    .max(80)
    .refine(
      (m) =>
        m
          .toLowerCase()
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "")
          .replace(/[^a-z0-9]+/g, "").length >= 2,
      { message: "Le nom de marque doit contenir au moins deux lettres ou chiffres." },
    ),
  url: z.string().trim().max(200).optional().nullable(),
  // L'email est le produit du scan gratuit : sans lui, un visiteur consulte
  // son score et disparaît sans qu'on puisse jamais le rappeler.
  email: z
    .string()
    .trim()
    .toLowerCase()
    .max(160)
    .email({ message: "Cette adresse email ne semble pas valide." }),
  // Facultatif depuis le 14/08/2026 : le formulaire ne le demande plus, il
  // est déduit du site pendant la phase « on lit votre site ». Le toolkit
  // (scan par lot, re-scan) continue de le poser explicitement, et sa valeur
  // n'est alors jamais écrasée.
  secteur: z.string().trim().max(80).default(""),
  ville: z.string().trim().max(80).optional().nullable(),
  concurrents: z.array(z.string().trim().max(80)).max(3).default([]),
  langue: z.enum(["fr", "it", "en"]).default("fr"),
  mode: z.enum(["apercu", "complet"]).default("apercu"),
});

export const lancerScan = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => CreerInput.parse(d))
  .handler(async ({ data }) => {
    const {
      hacherIp,
      quotaAtteint,
      creerScan,
      chercherCache,
      cleDomaine,
      enregistrerLead,
      PLAFOND_SCANS_PAR_IP,
    } = await import("@/lib/orchestrateur.server");
    const req = getRequest();
    const ip =
      req?.headers.get("cf-connecting-ip") ??
      req?.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
      "inconnue";
    const ipHash = hacherIp(ip);

    // Le plafond ne s'applique qu'aux mesures réellement nouvelles. Un scan
    // déjà en cache est resservi tel quel, sans coût et sans compter.
    const enCache = await chercherCache(
      cleDomaine(data.url ?? null, data.marque, data.secteur, data.ville ?? null),
      data.mode
    );
    if (!enCache && (await quotaAtteint(ipHash))) {
      return {
        erreur:
          `Limite de ${PLAFOND_SCANS_PAR_IP} scans par jour atteinte pour cette connexion.` as const,
      };
    }
    const scan = await creerScan({
      marque: data.marque,
      url: data.url ?? null,
      secteur: data.secteur,
      ville: data.ville ?? null,
      concurrents: data.concurrents.filter(Boolean),
      langue: data.langue,
      ipHash,
      mode: data.mode,
    });

    // Y compris sur un scan resservi du cache : c'est une personne de plus qui
    // s'intéresse à cette entreprise, et donc un contact de plus à rappeler.
    // Tolérant : une écriture ratée ne doit pas empêcher le scan de démarrer.
    // Perdre un email est ennuyeux, perdre le prospect sur une page en erreur
    // l'est davantage.
    try {
      await enregistrerLead({ scanId: scan.id, email: data.email });
    } catch {
      /* le scan continue */
    }

    return { id: scan.id, cached: scan.cached ?? false };
  });

export const suivreScan = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data }) => {
    const { avancerScan, etatScan } = await import("@/lib/orchestrateur.server");
    await avancerScan(data.id);
    return await etatScan(data.id);
  });

/**
 * Lecture PURE de l'état, sans faire avancer la machine.
 *
 * `suivreScan` bloque le temps de sa marche — la première (génération des
 * questions) dure vingt secondes, pendant lesquelles l'écran n'avait rien à
 * afficher. L'écran se nourrit donc ici, à cadence rapide et coût minuscule
 * (trois SELECT), pendant que `suivreScan` pilote en parallèle. Lecture
 * seule : appelable depuis n'importe quel navigateur sans autre effet que
 * de lire un scan dont il faut déjà connaître l'identifiant.
 */
export const lireScan = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data }) => {
    const { etatScan } = await import("@/lib/orchestrateur.server");
    return await etatScan(data.id);
  });

export const chargerRapport = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => z.object({ jeton: z.string().min(10).max(80) }).parse(d))
  .handler(async ({ data }) => {
    const { rapportParJeton } = await import("@/lib/orchestrateur.server");
    return await rapportParJeton(data.jeton);
  });

/*
 * `debloquerRapport` et `chargerTeaser` ont été retirés le 09/08/2026 avec
 * l'aguiche qu'ils servaient. Ne pas les réintroduire par réflexe : une
 * fonction serveur exportée reste appelable depuis n'importe quel navigateur,
 * et `debloquerRapport` écrivait dans `leads`. Une porte ouverte que plus
 * personne ne regarde est une porte ouverte.
 *
 * L'email est capturé par `lancerScan`, à la quatrième étape du formulaire.
 */
