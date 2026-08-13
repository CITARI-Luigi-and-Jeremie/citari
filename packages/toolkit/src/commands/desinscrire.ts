import { getDb, unwrap } from "@geo/core";

/**
 * Désinscription (STOP) et droit à l'effacement (RGPD).
 *
 * Deux gestes distincts, parce qu'ils répondent à deux demandes distinctes :
 *
 * `desinscrire` répond à « ne me contactez plus ». La ligne du lead RESTE en
 * base, avec `unsubscribed_at` posé : elle est la preuve du consentement
 * initial ET celle de la désinscription, et elle empêche définitivement tout
 * renvoi (la suppression pure rendrait l'adresse réinscriptible par un
 * nouveau scan). Les relances en attente sont annulées.
 *
 * `effacer` répond à « supprimez mes données ». Là, tout ce qui est
 * personnel disparaît : le lead, ses relances (cascade), le prénom et le
 * téléphone avec. Le scan reste : il ne contient AUCUNE donnée personnelle
 * (ni email, ni nom de personne), seulement des mesures publiques sur une
 * marque. On répond au demandeur avec la date d'exécution.
 */
export async function desinscrire(email: string): Promise<void> {
  const db = getDb();
  const leads = unwrap(
    await db.from("leads").select("id, email, unsubscribed_at").ilike("email", email.trim()),
  ) as { id: string; email: string; unsubscribed_at: string | null }[];

  if (leads.length === 0) {
    console.log(`Aucun lead pour « ${email} ». Rien à faire, donc rien ne partira.`);
    return;
  }

  for (const lead of leads) {
    if (!lead.unsubscribed_at) {
      unwrap(
        await db
          .from("leads")
          .update({ unsubscribed_at: new Date().toISOString() })
          .eq("id", lead.id)
          .select("id"),
      );
    }
    const { count } = await db
      .from("follow_ups")
      .update({ cancelled: true }, { count: "exact" })
      .eq("lead_id", lead.id)
      .is("sent_at", null)
      .eq("cancelled", false);
    console.log(
      `✓ ${lead.email} — désinscrit${lead.unsubscribed_at ? " (déjà fait)" : ""}, ${count ?? 0} relance(s) annulée(s)`,
    );
  }
  console.log("\nPlus aucun email ne partira vers cette adresse, définitivement.");
}

export async function effacer(email: string, opts: { vraiment?: boolean } = {}): Promise<void> {
  const db = getDb();
  const cible = email.trim();
  const leads = unwrap(
    await db.from("leads").select("id, email, first_name, phone, scan_id, created_at").ilike("email", cible),
  ) as { id: string; email: string; first_name: string | null; phone: string | null; scan_id: string | null }[];

  const clients = unwrap(
    await db.from("clients").select("id, brand_name, contact_email").ilike("contact_email", cible),
  ) as { id: string; brand_name: string; contact_email: string }[];

  if (leads.length === 0 && clients.length === 0) {
    console.log(`Aucune donnée pour « ${cible} ». Répondez-le au demandeur : c'est aussi une réponse RGPD.`);
    return;
  }

  console.log(`Données trouvées pour « ${cible} » :`);
  for (const l of leads) {
    const { count } = await db
      .from("follow_ups")
      .select("id", { count: "exact", head: true })
      .eq("lead_id", l.id);
    console.log(
      `  · lead ${l.id} (${[l.first_name, l.phone].filter(Boolean).join(", ") || "email seul"}) + ${count ?? 0} relance(s)`,
    );
  }
  for (const c of clients) {
    console.log(`  · CLIENT ${c.brand_name} (${c.id}) — contact_email + contact_name seront vidés, la fiche client reste`);
  }

  if (!opts.vraiment) {
    console.log("\nSIMULATION — rien n'est supprimé. Relancez avec --vraiment pour exécuter.");
    return;
  }

  // Les relances partent en cascade avec le lead (FK ON DELETE CASCADE).
  for (const l of leads) {
    unwrap(await db.from("leads").delete().eq("id", l.id).select("id"));
  }
  // Un client sous contrat ne se supprime pas (obligations comptables), mais
  // ses coordonnées personnelles, si.
  for (const c of clients) {
    unwrap(
      await db
        .from("clients")
        .update({ contact_email: null, contact_name: null })
        .eq("id", c.id)
        .select("id"),
    );
  }

  console.log(
    `\n✓ Effacé le ${new Date().toLocaleDateString("fr-FR")} : ${leads.length} lead(s) et leurs relances` +
      (clients.length ? `, coordonnées vidées sur ${clients.length} fiche(s) client` : "") +
      ".",
  );
  console.log("Répondez au demandeur en citant cette date. Les scans ne contiennent aucune donnée personnelle et sont conservés.");
}
