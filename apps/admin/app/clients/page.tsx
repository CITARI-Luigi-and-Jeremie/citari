import { getDb, unwrap } from "@geo/core";

export const dynamic = "force-dynamic";

export default async function ClientsPage() {
  const clients = unwrap(await getDb().from("clients").select("*").order("created_at", { ascending: false })) as any[];

  return (
    <div>
      <h1 className="text-2xl font-bold">Clients</h1>
      <table className="mt-4 w-full border-collapse text-sm">
        <thead>
          <tr className="border-b-2 border-rule-strong text-left text-bone-faint">
            <th className="py-2">Marque</th><th>Secteur</th><th>Contact</th><th>Re-scan J+90</th><th>Depuis</th>
          </tr>
        </thead>
        <tbody>
          {clients.map((c) => (
            <tr key={c.id} className="border-b border-rule hover:bg-ink-raised">
              <td className="py-2"><a className="text-signal underline" href={`/clients/${c.id}`}>{c.brand}</a></td>
              <td className="text-bone-faint">{c.sector}</td>
              <td className="text-bone-faint">{c.contact_email ?? "—"}</td>
              <td>{c.rescan_due_at ? new Date(c.rescan_due_at).toLocaleDateString("fr-FR") : <span className="text-bone-faint">non planifié</span>}</td>
              <td className="text-bone-faint">{new Date(c.created_at).toLocaleDateString("fr-FR")}</td>
            </tr>
          ))}
          {clients.length === 0 && (
            <tr><td colSpan={5} className="py-6 text-center text-bone-faint">Aucun client. Convertissez un lead !</td></tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
