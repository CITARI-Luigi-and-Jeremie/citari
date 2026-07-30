import { NextRequest, NextResponse, after } from "next/server";
import { z } from "zod";
import { getDb, unwrap, runScan } from "@geo/core";
import { verifyTurnstile } from "@/lib/turnstile";

export const maxDuration = 300;

const BodySchema = z.object({
  brand: z.string().min(1).max(100),
  url: z.string().min(4).max(300),
  sector: z.string().min(2).max(120),
  competitors: z.array(z.object({ name: z.string().min(1).max(100) })).max(3).default([]),
  lang: z.enum(["fr", "it", "en"]).default("fr"),
  turnstileToken: z.string().optional(),
});

const DAILY_LIMIT_PER_IP = 3;

export async function POST(req: NextRequest) {
  const parsed = BodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Formulaire invalide", detail: parsed.error.flatten() }, { status: 400 });
  }
  const body = parsed.data;
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";

  if (!(await verifyTurnstile(body.turnstileToken, ip))) {
    return NextResponse.json({ error: "Vérification anti-robot échouée" }, { status: 403 });
  }

  const db = getDb();
  const since = new Date(Date.now() - 24 * 3600 * 1000).toISOString();
  const { count } = await db.from("scans").select("id", { count: "exact", head: true }).eq("ip", ip).gte("created_at", since);
  if ((count ?? 0) >= DAILY_LIMIT_PER_IP) {
    return NextResponse.json({ error: "Limite de 3 scans par jour atteinte. Revenez demain !" }, { status: 429 });
  }

  const scan = unwrap(
    await db
      .from("scans")
      .insert({ brand: body.brand, url: body.url, sector: body.sector, competitors: body.competitors, lang: body.lang, ip })
      .select("id")
      .single()
  ) as { id: string };

  // Exécution asynchrone après la réponse HTTP — le client poll GET /api/scan/[id]
  after(async () => {
    await runScan(scan.id).catch((e) => console.error(`[scan ${scan.id}]`, e));
  });

  return NextResponse.json({ id: scan.id });
}
