import { getDb, unwrap } from "@geo/core";

export const dynamic = "force-dynamic";

export default async function ClientsPage() {
  const db = getDb();
  const clients = unwrap(await db.from("clients").select("*").order("created_at", { ascending: false })) as any[];
  // L'échéance J+90 vit sur le sprint le plus récent de chaque client.
  const sprints = unwrap(await db.from("sprints").select("client_id, rescan_due_on, status, started_on").order("started_on", { ascending: false })) as any[];
  const sprintByClient = new Map<string, any>();
  for (const s of sprints) if (!sprintByClient.has(s.client_id)) sprintByClient.set(s.client_id, s);

  return (
    <div>
      <h1 className="text-2xl font-bold">Clients</h1>
      <table className="mt-4 w-full border-collapse text-sm">
        <thead>
          <tr className="border-b-2 border-rule-strong text-left text-ink-faint">
            <th className="py-2">Marque</th><th>Secteur</th><th>Contact</th><th>Sprint</th><th>Re-scan J+90</th><th>Depuis</th>
          </tr>
        </thead>
        <tbody>
          {clients.map((c) => {
            const sprint = sprintByClient.get(c.id);
            return (
              <tr key={c.id} className="border-b border-rule hover:bg-paper-raised">
                <td className="py-2"><a className="text-signal underline" href={`/clients/${c.id}`}>{c.brand_name}</a></td>
                <td className="text-ink-faint">{c.sector ?? "—"}</td>
                <td className="text-ink-faint">{c.contact_email ?? "—"}</td>
                <td className="text-xs">{sprint?.status ?? <span className="text-ink-faint">aucun</span>}</td>
                <td>{sprint?.rescan_due_on ? new Date(sprint.rescan_due_on).toLocaleDateString("fr-FR") : <span className="text-ink-faint">non planifié</span>}</td>
                <td className="text-ink-faint">{new Date(c.created_at).toLocaleDateString("fr-FR")}</td>
              </tr>
            );
          })}
          {clients.length === 0 && (
            <tr><td colSpan={6} className="py-6 text-center text-ink-faint">Aucun client. Convertissez un lead !</td></tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
