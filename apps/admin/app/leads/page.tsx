import { getDb, unwrap } from "@geo/core";
import { markFollowUpSent } from "@/app/actions";

export const dynamic = "force-dynamic";

// Vocabulaire de la base : leads.status a pour défaut « nouveau ».
const STATUS_LABELS: Record<string, string> = {
  nouveau: "Nouveau",
  contacte: "Contacté",
  rdv_pris: "RDV réservé",
  client: "Client",
  perdu: "Perdu",
};

/**
 * Priorité commerciale : un score bas = prospect à fort besoin, à rappeler en
 * premier. Un lead récent prime sur un ancien.
 */
function priority(lead: any, scan: any): { level: "chaud" | "tiède" | "froid" | "traité"; reason: string } {
  if (["client", "rdv_pris", "perdu"].includes(lead.status)) {
    return { level: "traité", reason: STATUS_LABELS[lead.status] ?? lead.status };
  }
  const ageDays = (Date.now() - new Date(lead.created_at).getTime()) / 86400_000;
  const score = scan?.score_global != null ? Math.round(scan.score_global) : 100;
  // share_of_voice est un tableau [{name, share, target}] : la part du client
  // est l'entrée marquée target.
  const pdv = Array.isArray(scan?.share_of_voice) ? scan.share_of_voice : [];
  const sov = pdv.find((p: any) => p.target)?.share ?? 0;

  if (score < 40 && ageDays <= 7) return { level: "chaud", reason: `score ${score}, scan récent` };
  if (score < 40 || sov < 0.2) return { level: "tiède", reason: score < 40 ? `score ${score}` : "part de voix faible" };
  return { level: "froid", reason: `score ${score}` };
}

const PRIORITY_STYLES: Record<string, string> = {
  chaud: "bg-paper-raised text-signal",
  tiède: "bg-paper-raised text-ink",
  froid: "bg-paper-raised text-ink-faint",
  traité: "bg-paper-raised text-valid",
};

export default async function LeadsPage() {
  const db = getDb();
  const leads = unwrap(await db.from("leads").select("*").order("created_at", { ascending: false })) as any[];
  const scans = unwrap(
    await db
      .from("scans")
      .select("id,brand_name,sector,score_global,mode,status,created_at,share_of_voice")
      .order("created_at", { ascending: false })
      .limit(80)
  ) as any[];
  const scanById = new Map(scans.map((s) => [s.id, s]));

  // Relances dues aujourd'hui ou en retard : ni envoyées, ni annulées.
  const today = new Date().toISOString().slice(0, 10);
  const dueFollowUps = unwrap(
    await db.from("follow_ups").select("*").is("sent_at", null).eq("cancelled", false).lte("due_on", today).order("due_on")
  ) as any[];
  const leadById = new Map(leads.map((l) => [l.id, l]));

  return (
    <div>
      {dueFollowUps.length > 0 && (
        <section className="mb-8 border-2 border-signal bg-paper-raised p-5">
          <h2 className="font-bold">
            À envoyer aujourd'hui <span className="ml-2 bg-signal px-2 py-1 text-xs text-paper">{dueFollowUps.length}</span>
          </h2>
          <p className="mt-1 text-sm text-ink-faint">
            Relances générées par <code>pnpm toolkit relance</code>. Copiez le texte, envoyez depuis votre boîte, puis marquez comme envoyé.
          </p>
          <div className="mt-4 space-y-3">
            {dueFollowUps.map((f) => {
              const lead = leadById.get(f.lead_id);
              return (
                <details key={f.id} className="border border-rule p-3">
                  <summary className="cursor-pointer text-sm">
                    <span className="font-semibold">{lead?.company ?? "?"}</span>
                    <span className="text-ink-faint"> · {lead?.email ?? ""} · relance {f.step}</span>
                    {f.due_on < today && <span className="ml-2 bg-paper-raised px-2 py-1 text-xs text-signal">en retard</span>}
                  </summary>
                  <p className="mt-2 text-sm"><strong>Objet :</strong> {f.subject}</p>
                  <pre className="mt-2 whitespace-pre-wrap bg-paper-raised p-3 text-xs text-ink-dim">{f.body}</pre>
                  <form action={markFollowUpSent.bind(null, f.id, f.lead_id)} className="mt-2">
                    <button className="bg-signal px-3 py-2 text-xs font-semibold text-paper hover:opacity-80">
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
          <tr className="border-b-2 border-rule-strong text-left text-ink-faint">
            <th className="py-2">Priorité</th><th>Email</th><th>Entreprise</th><th>Secteur</th><th>Score</th><th>Date</th><th>Statut</th>
          </tr>
        </thead>
        <tbody>
          {leads.map((l) => {
            const scan = scanById.get(l.scan_id);
            const p = priority(l, scan);
            return (
              <tr key={l.id} className="border-b border-rule hover:bg-paper-raised">
                <td className="py-2">
                  <span className={`px-2 py-1 text-xs font-semibold ${PRIORITY_STYLES[p.level]}`} title={p.reason}>
                    {p.level}
                  </span>
                </td>
                <td><a className="text-signal underline" href={`/leads/${l.id}`}>{l.email}</a></td>
                <td>{scan?.brand_name ?? l.company ?? "—"}</td>
                <td className="text-ink-faint">{scan?.sector ?? "—"}</td>
                <td className="font-semibold">{scan?.score_global != null ? Math.round(scan.score_global) : "—"}</td>
                <td className="text-ink-faint">{new Date(l.created_at).toLocaleDateString("fr-FR")}</td>
                <td><span className="bg-paper-raised px-2 py-1 text-xs">{STATUS_LABELS[l.status] ?? l.status ?? "nouveau"}</span></td>
              </tr>
            );
          })}
          {leads.length === 0 && (
            <tr><td colSpan={7} className="py-6 text-center text-ink-faint">Aucun lead pour l'instant.</td></tr>
          )}
        </tbody>
      </table>

      <h2 className="mt-12 text-lg font-bold">Derniers scans (avec ou sans email)</h2>
      <table className="mt-3 w-full border-collapse text-sm">
        <thead>
          <tr className="border-b-2 border-rule-strong text-left text-ink-faint">
            <th className="py-2">Marque</th><th>Secteur</th><th>Score</th><th>Mode</th><th>Statut</th><th>Date</th>
          </tr>
        </thead>
        <tbody>
          {scans.map((s) => (
            <tr key={s.id} className="border-b border-rule">
              <td className="py-2">{s.brand_name}</td>
              <td className="text-ink-faint">{s.sector}</td>
              <td className="font-semibold">{s.score_global != null ? Math.round(s.score_global) : "—"}</td>
              <td className="text-xs text-ink-faint">{s.mode ?? "complet"}</td>
              <td className="text-xs text-ink-faint">{s.status}</td>
              <td className="text-ink-faint">{new Date(s.created_at).toLocaleDateString("fr-FR")}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
