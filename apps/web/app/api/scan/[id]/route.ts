import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@geo/core";
import { getScan, findVerbatims } from "@/lib/scan-data";

export async function GET(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const scan = await getScan(id);
  if (!scan) return NextResponse.json({ error: "Scan introuvable" }, { status: 404 });

  if (scan.status !== "done") {
    // Données réelles : l'écran de progression n'affiche jamais rien d'inventé.
    // On renvoie les questions effectivement générées pour les faire défiler.
    const db = getDb();
    const [{ data: queryRows }, { count: responses }] = await Promise.all([
      db.from("queries").select("text").eq("scan_id", id).order("position"),
      db.from("responses").select("id", { count: "exact", head: true }).eq("scan_id", id),
    ]);
    const texts = ((queryRows as { text: string }[] | null) ?? []).map((q) => q.text);
    return NextResponse.json({
      status: scan.status,
      progress: scan.progress,
      error: scan.error,
      queries: texts.length,
      queryTexts: texts,
      responses: responses ?? 0,
      expected: texts.length * 4,
    });
  }

  // Teaser : score + part de voix + UN verbatim où un concurrent est cité et pas la marque.
  // Le rapport complet reste derrière la capture email.
  const verbatims = await findVerbatims(scan, 1);
  return NextResponse.json({
    status: "done",
    progress: 100,
    teaser: {
      brand: scan.brand,
      score: scan.score,
      byEngine: Object.fromEntries(
        Object.entries(scan.score_detail?.byEngine ?? {}).map(([e, s]) => [e, (s as { score: number }).score])
      ),
      shareOfVoice: scan.share_of_voice?.share ?? {},
      verbatim: verbatims[0] ?? null,
      emailCaptured: Boolean(scan.email),
    },
  });
}
