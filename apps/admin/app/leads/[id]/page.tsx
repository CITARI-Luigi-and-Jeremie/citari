import { notFound } from "next/navigation";
import { getDb, unwrap } from "@geo/core";
import { convertLeadToClient, saveLeadNotes, updateLeadStatus } from "@/app/actions";

export const dynamic = "force-dynamic";

const STATUSES = ["new", "contacted", "call_booked", "client", "lost"];

export default async function LeadDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const db = getDb();
  const { data: lead } = await db.from("leads").select("*").eq("id", id).maybeSingle();
  if (!lead) notFound();
  const scan = unwrap(await db.from("scans").select("*").eq("id", lead.scan_id).single()) as any;
  const { count: nQueries } = await db.from("queries").select("id", { count: "exact", head: true }).eq("scan_id", scan.id);
  const { count: nResponses } = await db.from("responses").select("id", { count: "exact", head: true }).eq("scan_id", scan.id);

  return (
    <div>
      <a href="/leads" className="text-sm text-slate-500">← Leads</a>
      <div className="mt-2 flex items-center justify-between">
        <h1 className="text-2xl font-bold">{lead.brand} <span className="text-base font-normal text-slate-500">— {lead.email}</span></h1>
        {lead.status !== "client" && (
          <form action={convertLeadToClient.bind(null, lead.id)}>
            <button className="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-white hover:bg-accent-dark">
              Convertir en client
            </button>
          </form>
        )}
      </div>

      <div className="mt-6 grid gap-6 md:grid-cols-2">
        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <h2 className="font-semibold">Scan</h2>
          <dl className="mt-3 space-y-1 text-sm">
            <div className="flex justify-between"><dt className="text-slate-500">Score</dt><dd className="font-bold">{scan.score ?? "—"}/100</dd></div>
            <div className="flex justify-between"><dt className="text-slate-500">Secteur</dt><dd>{scan.sector}</dd></div>
            <div className="flex justify-between"><dt className="text-slate-500">URL</dt><dd>{scan.url}</dd></div>
            <div className="flex justify-between"><dt className="text-slate-500">Concurrents</dt><dd>{(scan.competitors ?? []).map((c: any) => c.name).join(", ") || "—"}</dd></div>
            <div className="flex justify-between"><dt className="text-slate-500">Requêtes / Réponses</dt><dd>{nQueries} / {nResponses}</dd></div>
            <div className="flex justify-between"><dt className="text-slate-500">Coût</dt><dd>{scan.cost_cents} ct</dd></div>
            <div className="flex justify-between"><dt className="text-slate-500">Rapport</dt><dd>{scan.report_token ? <a className="text-accent underline" href={`${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/rapport/${scan.report_token}`} target="_blank">ouvrir</a> : "—"}</dd></div>
          </dl>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <h2 className="font-semibold">Statut & notes</h2>
          <div className="mt-3 flex flex-wrap gap-2">
            {STATUSES.map((s) => (
              <form key={s} action={updateLeadStatus.bind(null, lead.id, s)}>
                <button className={`rounded px-3 py-1 text-xs ${lead.status === s ? "bg-accent text-white" : "bg-slate-100 hover:bg-slate-200"}`}>
                  {s}
                </button>
              </form>
            ))}
          </div>
          <form action={saveLeadNotes.bind(null, lead.id)} className="mt-4">
            <textarea name="notes" defaultValue={lead.notes ?? ""} rows={5} className="w-full rounded-lg border border-slate-300 p-2 text-sm" placeholder="Notes…" />
            <button className="mt-2 rounded bg-slate-800 px-3 py-1.5 text-xs font-semibold text-white">Enregistrer</button>
          </form>
        </div>
      </div>

      <details className="mt-6 rounded-xl border border-slate-200 bg-white p-5">
        <summary className="cursor-pointer font-semibold">Données brutes (scan)</summary>
        <pre className="mt-3 overflow-x-auto rounded bg-slate-900 p-4 text-xs text-slate-100">{JSON.stringify(scan, null, 2)}</pre>
      </details>
    </div>
  );
}
