import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { z } from "zod";

const CreerInput = z.object({
  marque: z.string().trim().min(1).max(80),
  url: z.string().trim().max(200).optional().nullable(),
  secteur: z.string().trim().min(1).max(80),
  ville: z.string().trim().max(80).optional().nullable(),
  concurrents: z.array(z.string().trim().max(80)).max(3).default([]),
  langue: z.enum(["fr", "it", "en"]).default("fr"),
});

export const lancerScan = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => CreerInput.parse(d))
  .handler(async ({ data }) => {
    const { hacherIp, quotaAtteint, creerScan } = await import("@/lib/orchestrateur.server");
    const req = getRequest();
    const ip =
      req?.headers.get("cf-connecting-ip") ??
      req?.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
      "inconnue";
    const ipHash = hacherIp(ip);
    if (await quotaAtteint(ipHash)) {
      return { erreur: "Limite de 3 scans par jour atteinte pour cette connexion." as const };
    }
    const scan = await creerScan({
      marque: data.marque,
      url: data.url ?? null,
      secteur: data.secteur,
      ville: data.ville ?? null,
      concurrents: data.concurrents.filter(Boolean),
      langue: data.langue,
      ipHash,
    });
    return { id: scan.id };
  });

export const suivreScan = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data }) => {
    const { avancerScan, etatScan } = await import("@/lib/orchestrateur.server");
    await avancerScan(data.id);
    return await etatScan(data.id);
  });

export const chargerRapport = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => z.object({ jeton: z.string().min(10).max(80) }).parse(d))
  .handler(async ({ data }) => {
    const { rapportParJeton } = await import("@/lib/orchestrateur.server");
    return await rapportParJeton(data.jeton);
  });

export const debloquerRapport = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) =>
    z
      .object({
        scanId: z.string().uuid(),
        email: z.string().trim().email().max(200),
        prenom: z.string().trim().max(80).optional(),
        telephone: z.string().trim().max(40).optional(),
      })
      .parse(d),
  )
  .handler(async ({ data }) => {
    const { enregistrerLead } = await import("@/lib/orchestrateur.server");
    return await enregistrerLead({
      scanId: data.scanId,
      email: data.email,
      prenom: data.prenom ?? null,
      telephone: data.telephone ?? null,
    });
  });

export const chargerTeaser = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data }) => {
    const { teaserScan } = await import("@/lib/orchestrateur.server");
    return await teaserScan(data.id);
  });
