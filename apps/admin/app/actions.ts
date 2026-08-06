"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getDb, unwrap } from "@geo/core";
import { SPRINT_CHECKLIST } from "@/lib/checklist";

export async function updateLeadStatus(leadId: string, status: string) {
  await getDb().from("leads").update({ status }).eq("id", leadId);
  revalidatePath("/leads");
}

export async function saveLeadNotes(leadId: string, formData: FormData) {
  await getDb().from("leads").update({ notes: String(formData.get("notes") ?? "") }).eq("id", leadId);
  revalidatePath(`/leads/${leadId}`);
}

/** Lead → client : fiche client + sprint + checklist des 90 jours. */
export async function convertLeadToClient(leadId: string) {
  const db = getDb();
  const lead = unwrap(await db.from("leads").select("*").eq("id", leadId).single()) as any;
  const scan = unwrap(await db.from("scans").select("*").eq("id", lead.scan_id).single()) as any;

  const today = new Date();
  const plusDays = (n: number) => new Date(today.getTime() + n * 86400_000).toISOString().slice(0, 10);

  const client = unwrap(
    await db
      .from("clients")
      .insert({
        lead_id: leadId,
        scan_id: scan.id,
        brand_name: scan.brand_name ?? lead.company,
        website_url: scan.website_url,
        sector: scan.sector,
        contact_email: lead.email,
        contact_name: lead.first_name,
      })
      .select("id")
      .single()
  ) as { id: string };

  // Le re-scan J+90 vit sur le sprint, pas sur le client : il est planifié
  // d'office à la création. C'est l'engagement, pas une option.
  const sprint = unwrap(
    await db
      .from("sprints")
      .insert({
        client_id: client.id,
        started_on: plusDays(0),
        ends_on: plusDays(30),
        rescan_due_on: plusDays(90),
        status: "en_cours",
      })
      .select("id")
      .single()
  ) as { id: string };

  unwrap(
    await db
      .from("sprint_tasks")
      .insert(SPRINT_CHECKLIST.map((t, i) => ({ sprint_id: sprint.id, week: t.week, position: i, label: t.label })))
      .select("id")
  );

  await db.from("leads").update({ status: "client", converted: true }).eq("id", leadId);
  redirect(`/clients/${client.id}`);
}

export async function toggleTask(taskId: string, clientId: string, done: boolean) {
  await getDb().from("sprint_tasks").update({ done }).eq("id", taskId);
  revalidatePath(`/clients/${clientId}`);
}

export async function saveTaskNotes(taskId: string, clientId: string, formData: FormData) {
  await getDb().from("sprint_tasks").update({ notes: String(formData.get("notes") ?? "") }).eq("id", taskId);
  revalidatePath(`/clients/${clientId}`);
}

export async function updateClient(clientId: string, formData: FormData) {
  await getDb()
    .from("clients")
    .update({
      contact_name: String(formData.get("contact_name") ?? ""),
      contact_email: String(formData.get("contact_email") ?? ""),
      website_url: String(formData.get("website_url") ?? "") || null,
      notes: String(formData.get("notes") ?? ""),
    })
    .eq("id", clientId);
  revalidatePath(`/clients/${clientId}`);
}

export async function addClientData(clientId: string, formData: FormData) {
  const key = String(formData.get("key") ?? "").trim();
  const value = String(formData.get("value") ?? "").trim();
  if (key && value) await getDb().from("client_data").insert({ client_id: clientId, key, value });
  revalidatePath(`/clients/${clientId}`);
}

export async function scheduleRescan(clientId: string, formData: FormData) {
  const date = String(formData.get("rescan_due_on") ?? "");
  if (!date) return;
  const db = getDb();
  const { data: sprint } = await db
    .from("sprints")
    .select("id")
    .eq("client_id", clientId)
    .order("started_on", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (sprint) {
    await db.from("sprints").update({ rescan_due_on: date, rescan_reminder_sent: false }).eq("id", sprint.id);
  } else {
    await db.from("sprints").insert({ client_id: clientId, rescan_due_on: date, status: "en_cours" });
  }
  revalidatePath(`/clients/${clientId}`);
}

/**
 * Ouvre le re-scan J+90 : mêmes questions que le scan initial.
 *
 * On n'exécute RIEN ici : le seul moteur de mesure est celui du front
 * (orchestrateur Lovable). On insère la ligne avec previous_scan_id, et la
 * collecte se pilote depuis la page /scan/<id> du site.
 */
export async function launchRescan(clientId: string) {
  const db = getDb();
  const client = unwrap(await db.from("clients").select("*").eq("id", clientId).single()) as any;
  if (!client.scan_id) throw new Error("Pas de scan initial rattaché à ce client");

  // Un seul J+90 par scan initial. Les contrôles J+45 (mode 'controle')
  // ne comptent pas comme re-scan.
  const { data: existant } = await db
    .from("scans")
    .select("id")
    .eq("previous_scan_id", client.scan_id)
    .neq("mode", "controle")
    .limit(1)
    .maybeSingle();
  if (existant) {
    revalidatePath(`/clients/${clientId}`);
    return;
  }

  const initial = unwrap(await db.from("scans").select("*").eq("id", client.scan_id).single()) as any;
  const rescan = unwrap(
    await db
      .from("scans")
      .insert({
        brand_name: initial.brand_name,
        website_url: initial.website_url,
        sector: initial.sector,
        city: initial.city,
        language: initial.language ?? "fr",
        competitors: initial.competitors ?? [],
        previous_scan_id: initial.id,
        mode: "complet",
        status: "running",
        phase: "init",
        started_at: new Date().toISOString(),
      })
      .select("id")
      .single()
  ) as { id: string };

  const { data: sprint } = await db
    .from("sprints")
    .select("id")
    .eq("client_id", clientId)
    .order("started_on", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (sprint) await db.from("sprints").update({ rescan_scan_id: rescan.id, status: "rescan_fait" }).eq("id", sprint.id);

  revalidatePath(`/clients/${clientId}`);
}

/** Marque une relance comme envoyée (il n'y a pas de colonne status : sent_at fait foi). */
export async function markFollowUpSent(followUpId: string, leadId: string) {
  const db = getDb();
  await db.from("follow_ups").update({ sent_at: new Date().toISOString() }).eq("id", followUpId);
  const { data: lead } = await db.from("leads").select("status").eq("id", leadId).maybeSingle();
  // « prospect » aussi : les leads nés d'un scan-lot portent ce statut, et un
  // email envoyé est un contact, quel que soit le chemin d'entrée.
  const avantContact = !lead?.status || lead.status === "nouveau" || lead.status === "prospect";
  if (avantContact) await db.from("leads").update({ status: "contacte" }).eq("id", leadId);
  revalidatePath("/leads");
  revalidatePath(`/leads/${leadId}`);
}

/** Le prospect a répondu / réservé : on annule les relances restantes. */
export async function stopFollowUps(leadId: string, reason: "replied" | "skipped") {
  const db = getDb();
  await db.from("follow_ups").update({ cancelled: true }).eq("lead_id", leadId).is("sent_at", null);
  if (reason === "replied") {
    await db.from("leads").update({ status: "rdv_pris" }).eq("id", leadId);
  }
  revalidatePath("/leads");
  revalidatePath(`/leads/${leadId}`);
}

export async function updateCitationStatus(targetId: string, clientId: string, status: string) {
  const patch: Record<string, unknown> = { status };
  if (status === "obtenue") patch.obtained_on = new Date().toISOString().slice(0, 10);
  if (status === "envoyee") patch.contacted_on = new Date().toISOString().slice(0, 10);
  await getDb().from("citation_targets").update(patch).eq("id", targetId);
  revalidatePath(`/clients/${clientId}`);
}
