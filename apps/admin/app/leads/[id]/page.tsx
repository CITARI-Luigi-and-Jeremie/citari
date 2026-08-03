import { notFound } from "next/navigation";
import { getDb, unwrap } from "@geo/core";
import { convertLeadToClient, markFollowUpSent, saveLeadNotes, stopFollowUps, updateLeadStatus } from "@/app/actions";

export const dynamic = "force-dynamic";

const STATUSES = ["prospect", "nouveau", "contacte", "rdv_pris", "client", "perdu"];

/** Statut dérivé d'une relance : il n'y a pas de colonne status en base. */
function statutRelance(f: any): "envoyée" | "annulée" | "à envoyer" {
  if (f.sent_at) return "envoyée";
  if (f.cancelled) return "annulée";
  return "à envoyer";
}

export default async function LeadDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const db = getDb();
  const { data: lead } = await db.from("leads").select("*").eq("id", id).maybeSingle();
  if (!lead) notFound();
  const scan = unwrap(await db.from("scans").select("*").eq("id", lead.scan_id).single()) as any;
  const { count: nQueries } = await db.from("queries").select("id", { count: "exact", head: true }).eq("scan_id", scan.id);
  const { count: nResponses } = await db.from("responses").select("id", { count: "exact", head: true }).eq("scan_id", scan.id);
  const couts = unwrap(await db.from("cost_log").select("cost_eur").eq("scan_id", scan.id)) as any[];
  const coutTotal = couts.reduce((a, c) => a + Number(c.cost_eur ?? 0), 0);
  const followUps = unwrap(await db.from("follow_ups").select("*").eq("lead_id", lead.id).order("step")) as any[];

  const competitors = Array.isArray(scan.competitors)
    ? scan.competitors.map((c: any) => (typeof c === "string" ? c : c?.name)).filter(Boolean)
    : [];

  return (
    <div>
      <a href="/leads" className="text-sm text-ink-faint">← Leads</a>
      <div className="mt-2 flex items-center justify-between">
        <h1 className="text-2xl font-bold">{scan.brand_name} <span className="text-base font-normal text-ink-faint">— {lead.email}</span></h1>
        {lead.status !== "client" && (
          <form action={convertLeadToClient.bind(null, lead.id)}>
            <button className="btn-signal">
              Convertir en client
            </button>
          </form>
        )}
      </div>

      <div className="mt-6 grid gap-6 md:grid-cols-2">
        <div className="border border-rule bg-paper-raised p-5">
          <h2 className="font-semibold">Scan</h2>
          <dl className="mt-3 space-y-1 text-sm">
            <div className="flex justify-between"><dt className="text-ink-faint">Score</dt><dd className="font-bold">{scan.score_global != null ? Math.round(scan.score_global) : "—"}/100</dd></div>
            <div className="flex justify-between"><dt className="text-ink-faint">Mode</dt><dd>{scan.mode ?? "complet"}</dd></div>
            <div className="flex justify-between"><dt className="text-ink-faint">Secteur</dt><dd>{scan.sector}</dd></div>
            <div className="flex justify-between"><dt className="text-ink-faint">Site</dt><dd>{scan.website_url ?? "—"}</dd></div>
            <div className="flex justify-between"><dt className="text-ink-faint">Concurrents</dt><dd>{competitors.join(", ") || "—"}</dd></div>
            <div className="flex justify-between"><dt className="text-ink-faint">Requêtes / Réponses</dt><dd>{nQueries} / {nResponses}</dd></div>
            <div className="flex justify-between"><dt className="text-ink-faint">Coût</dt><dd>{coutTotal.toFixed(2)} €</dd></div>
            <div className="flex justify-between"><dt className="text-ink-faint">Rapport</dt><dd>{scan.report_token ? <a className="text-signal underline" href={`${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/rapport/${scan.report_token}`} target="_blank">ouvrir</a> : "—"}</dd></div>
          </dl>
        </div>

        <div className="border border-rule bg-paper-raised p-5">
          <h2 className="font-semibold">Statut & notes</h2>
          <div className="mt-3 flex flex-wrap gap-2">
            {STATUSES.map((s) => (
              <form key={s} action={updateLeadStatus.bind(null, lead.id, s)}>
                <button className={`px-3 py-1 text-xs ${lead.status === s ? "bg-signal text-paper" : "border border-rule bg-transparent hover:border-ink"}`}>
                  {s}
                </button>
              </form>
            ))}
          </div>
          <form action={saveLeadNotes.bind(null, lead.id)} className="mt-4">
            <textarea name="notes" defaultValue={lead.notes ?? ""} rows={5} className="field" placeholder="Notes…" />
            <button className="btn-ghost mt-2">Enregistrer</button>
          </form>
        </div>
      </div>

      <div className="mt-6 border border-rule bg-paper-raised p-5">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold">Séquence de relance</h2>
          {followUps.some((f) => statutRelance(f) === "à envoyer") && (
            <form action={stopFollowUps.bind(null, lead.id, "replied")}>
              <button className="bg-valid px-3 py-2 text-xs font-semibold text-paper">
                Il a répondu / RDV réservé — arrêter la séquence
              </button>
            </form>
          )}
        </div>
        {followUps.length === 0 ? (
          <p className="mt-2 text-sm text-ink-faint">
            Aucune relance générée. Lancez <code className="bg-paper-raised px-1">pnpm toolkit relance &quot;{lead.email}&quot;</code>
          </p>
        ) : (
          <div className="mt-3 space-y-2">
            {followUps.map((f) => {
              const st = statutRelance(f);
              return (
                <details key={f.id} className="border border-rule p-3">
                  <summary className="cursor-pointer text-sm">
                    <strong>Relance {f.step}</strong>
                    <span className="text-ink-faint"> · prévue le {f.due_on ? new Date(f.due_on).toLocaleDateString("fr-FR") : "—"}</span>
                    <span className={`ml-2 px-2 py-1 text-xs ${
                      st === "envoyée" ? "bg-paper-raised text-valid"
                      : st === "annulée" ? "bg-paper-raised text-ink-faint"
                      : "bg-paper-raised text-ink"}`}>
                      {st === "envoyée" ? `envoyée le ${new Date(f.sent_at).toLocaleDateString("fr-FR")}` : st}
                    </span>
                  </summary>
                  <p className="mt-2 text-sm"><strong>Objet :</strong> {f.subject}</p>
                  <pre className="mt-2 whitespace-pre-wrap bg-paper-raised p-3 text-xs text-ink-dim">{f.body}</pre>
                  {st === "à envoyer" && (
                    <form action={markFollowUpSent.bind(null, f.id, lead.id)} className="mt-2">
                      <button className="bg-signal px-3 py-2 text-xs font-semibold text-paper">Marquer comme envoyé</button>
                    </form>
                  )}
                </details>
              );
            })}
          </div>
        )}
      </div>

      <details className="mt-6 border border-rule bg-paper-raised p-5">
        <summary className="cursor-pointer font-semibold">Données brutes (scan)</summary>
        <pre className="mt-3 overflow-x-auto bg-paper-sunken p-4 text-xs text-ink-dim">{JSON.stringify(scan, null, 2)}</pre>
      </details>
    </div>
  );
}
