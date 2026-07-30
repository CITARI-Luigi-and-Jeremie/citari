import { getDb, unwrap } from "@geo/core";
import { markFollowUpSent } from "@/app/actions";

export const dynamic = "force-dynamic";

const STATUS_LABELS: Record<string, string> = {
  new: "Nouveau",
  contacted: "Contacté",
  call_booked: "Call réservé",
  client: "Client",
  lost: "Perdu",
};

/**
 * Priorité commerciale : un score bas + des concurrents très cités = prospect
 * à fort besoin, donc à rappeler en premier. Un lead récent prime sur un ancien.
 */
function priority(lead: any, scan: any): { level: "chaud" | "tiède" | "froid" | "traité"; reason: string } {
  // Un lead déjà converti, en call ou perdu ne doit plus remonter dans les rappels.
  if (["client", "call_booked", "lost"].includes(lead.status)) {
    return { level: "traité", reason: STATUS_LABELS[lead.status] ?? lead.status };
  }
  const ageDays = (Date.now() - new Date(lead.created_at).getTime()) / 86400_000;
  const score = lead.score ?? 100;
  const sov = scan?.share_of_voice?.share?.[lead.brand] ?? 1;

  if (score < 40 && ageDays <= 7) return { level: "chaud", reason: `score ${score}, scan récent` };
  if (score < 40 || sov < 0.2) return { level: "tiède", reason: score < 40 ? `score ${score}` : "part de voix faible" };
  return { level: "froid", reason: `score ${score}` };
}

const PRIORITY_STYLES: Record<string, string> = {
  chaud: "bg-red-100 text-red-700",
  tiède: "bg-amber-100 text-amber-700",
  froid: "bg-slate-100 text-slate-500",
  traité: "bg-emerald-100 text-emerald-700",
};

export default async function LeadsPage() {
  const db = getDb();
  const leads = unwrap(await db.from("leads").select("*").order("created_at", { ascending: false })) as any[];
  const scans = unwrap(
    await db.from("scans").select("id,brand,sector,score,status,email,created_at,share_of_voice").order("created_at", { ascending: false }).limit(50)
  ) as any[];
  const scanById = new Map(scans.map((s) => [s.id, s]));

  // Relances dues aujourd'hui ou en retard — la to-do commerciale du jour
  const today = new Date().toISOString().slice(0, 10);
  const dueFollowUps = unwrap(
    await db.from("follow_ups").select("*").eq("status", "draft").lte("scheduled_for", today).order("scheduled_for")
  ) as any[];
  const leadById = new Map(leads.map((l) => [l.id, l]));

  return (
    <div>
      {dueFollowUps.length > 0 && (
        <section className="mb-8 rounded-xl border-2 border-accent bg-white p-5">
          <h2 className="font-bold">
            À envoyer aujourd'hui <span className="ml-2 rounded-full bg-accent px-2 py-0.5 text-xs text-white">{dueFollowUps.length}</span>
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Relances générées par <code>pnpm toolkit relance</code>. Copiez le texte, envoyez depuis votre boîte, puis marquez comme envoyé.
          </p>
          <div className="mt-4 space-y-3">
            {dueFollowUps.map((f) => {
              const lead = leadById.get(f.lead_id);
              return (
                <details key={f.id} className="rounded-lg border border-slate-200 p-3">
                  <summary className="cursor-pointer text-sm">
                    <span className="font-semibold">{lead?.brand ?? "?"}</span>
                    <span className="text-slate-500"> · {lead?.email ?? ""} · relance {f.step}</span>
                    {f.scheduled_for < today && <span className="ml-2 rounded bg-red-100 px-1.5 py-0.5 text-xs text-red-700">en retard</span>}
                  </summary>
                  <p className="mt-2 text-sm"><strong>Objet :</strong> {f.subject}</p>
                  <pre className="mt-2 whitespace-pre-wrap rounded bg-slate-50 p-3 text-xs text-slate-700">{f.body}</pre>
                  <form action={markFollowUpSent.bind(null, f.id, f.lead_id)} className="mt-2">
                    <button className="rounded bg-accent px-3 py-1.5 text-xs font-semibold text-white hover:bg-accent-dark">
                      Marquer comme envoyé
                    </button>
                  </form>
                </details>
              );
            })}
          </div>
        </section>
      )}

      <h1 className="text-2xl font-bold">Leads</h1>
      <table className="mt-4 w-full border-collapse text-sm">
        <thead>
          <tr className="border-b-2 border-slate-300 text-left text-slate-500">
            <th className="py-2">Priorité</th><th>Email</th><th>Marque</th><th>Secteur</th><th>Score</th><th>Date</th><th>Statut</th>
          </tr>
        </thead>
        <tbody>
          {leads.map((l) => {
            const p = priority(l, scanById.get(l.scan_id));
            return (
              <tr key={l.id} className="border-b border-slate-200 hover:bg-white">
                <td className="py-2">
                  <span className={`rounded px-2 py-0.5 text-xs font-semibold ${PRIORITY_STYLES[p.level]}`} title={p.reason}>
                    {p.level}
                  </span>
                </td>
                <td><a className="text-accent underline" href={`/leads/${l.id}`}>{l.email}</a></td>
                <td>{l.brand}</td>
                <td className="text-slate-500">{l.sector}</td>
                <td className="font-semibold">{l.score ?? "—"}</td>
                <td className="text-slate-500">{new Date(l.created_at).toLocaleDateString("fr-FR")}</td>
                <td><span className="rounded bg-slate-100 px-2 py-0.5 text-xs">{STATUS_LABELS[l.status] ?? l.status}</span></td>
              </tr>
            );
          })}
          {leads.length === 0 && (
            <tr><td colSpan={7} className="py-6 text-center text-slate-400">Aucun lead pour l'instant.</td></tr>
          )}
        </tbody>
      </table>

      <h2 className="mt-12 text-lg font-bold">50 derniers scans (avec ou sans email)</h2>
      <table className="mt-3 w-full border-collapse text-sm">
        <thead>
          <tr className="border-b-2 border-slate-300 text-left text-slate-500">
            <th className="py-2">Marque</th><th>Secteur</th><th>Score</th><th>Statut</th><th>Email</th><th>Date</th>
          </tr>
        </thead>
        <tbody>
          {scans.map((s) => (
            <tr key={s.id} className="border-b border-slate-200">
              <td className="py-2">{s.brand}</td>
              <td className="text-slate-500">{s.sector}</td>
              <td className="font-semibold">{s.score ?? "—"}</td>
              <td className="text-xs text-slate-500">{s.status}</td>
              <td className="text-slate-500">{s.email ?? <span className="text-slate-300">non capturé</span>}</td>
              <td className="text-slate-500">{new Date(s.created_at).toLocaleDateString("fr-FR")}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
