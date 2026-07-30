import { NextRequest, NextResponse } from "next/server";
import { getScan, findVerbatims } from "@/lib/scan-data";

export async function GET(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const scan = await getScan(id);
  if (!scan) return NextResponse.json({ error: "Scan introuvable" }, { status: 404 });

  if (scan.status !== "done") {
    return NextResponse.json({ status: scan.status, progress: scan.progress, error: scan.error });
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
