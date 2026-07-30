"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { after } from "next/server";
import { getDb, unwrap, createRescan, runScan } from "@geo/core";
import { SPRINT_CHECKLIST } from "@/lib/checklist";

export async function updateLeadStatus(leadId: string, status: string) {
  await getDb().from("leads").update({ status }).eq("id", leadId);
  revalidatePath("/leads");
}

export async function saveLeadNotes(leadId: string, formData: FormData) {
  await getDb().from("leads").update({ notes: String(formData.get("notes") ?? "") }).eq("id", leadId);
  revalidatePath(`/leads/${leadId}`);
}

/** Lead → client : fiche client + sprint + checklist des 30 jours. */
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
        brand: lead.brand,
        url: scan.url,
        sector: lead.sector,
        competitors: scan.competitors,
        contact_email: lead.email,
        initial_scan_id: scan.id,
        rescan_due_at: plusDays(90), // re-scan offert à J+90, planifié d'office
      })
      .select("id")
      .single()
  ) as { id: string };

  const sprint = unwrap(
    await db
      .from("sprints")
      .insert({ client_id: client.id, starts_at: plusDays(0), ends_at: plusDays(30) })
      .select("id")
      .single()
  ) as { id: string };

  unwrap(
    await db
      .from("sprint_tasks")
      .insert(SPRINT_CHECKLIST.map((t, i) => ({ sprint_id: sprint.id, week: t.week, position: i, label: t.label })))
      .select("id")
  );

  await db.from("leads").update({ status: "client" }).eq("id", leadId);
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
      site_access: String(formData.get("site_access") ?? ""),
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
  const date = String(formData.get("rescan_due_at") ?? "");
  if (date) {
    await getDb().from("clients").update({ rescan_due_at: date, rescan_reminder_sent: false }).eq("id", clientId);
  }
  revalidatePath(`/clients/${clientId}`);
}

/** Lance le re-scan J+90 : mêmes requêtes que le scan initial, exécution en arrière-plan. */
export async function launchRescan(clientId: string) {
  const db = getDb();
  const client = unwrap(await db.from("clients").select("*").eq("id", clientId).single()) as any;
  if (!client.initial_scan_id) throw new Error("Pas de scan initial rattaché à ce client");
  const rescanId = await createRescan(client.initial_scan_id, clientId);
  after(async () => {
    await runScan(rescanId).catch((e) => console.error(`[rescan ${rescanId}]`, e));
  });
  revalidatePath(`/clients/${clientId}`);
}

/** Marque une relance comme envoyée (et met à jour la date de dernier contact du lead). */
export async function markFollowUpSent(followUpId: string, leadId: string) {
  const db = getDb();
  const now = new Date().toISOString();
  await db.from("follow_ups").update({ status: "sent", sent_at: now }).eq("id", followUpId);
  await db.from("leads").update({ last_contacted_at: now }).eq("id", leadId);
  const { data: lead } = await db.from("leads").select("status").eq("id", leadId).maybeSingle();
  if (lead?.status === "new") await db.from("leads").update({ status: "contacted" }).eq("id", leadId);
  revalidatePath("/leads");
  revalidatePath(`/leads/${leadId}`);
}

/** Le prospect a répondu / réservé : on arrête la séquence. */
export async function stopFollowUps(leadId: string, reason: "replied" | "skipped") {
  const db = getDb();
  await db.from("follow_ups").update({ status: reason }).eq("lead_id", leadId).eq("status", "draft");
  if (reason === "replied") {
    await db.from("leads").update({ status: "call_booked", call_booked_at: new Date().toISOString() }).eq("id", leadId);
  }
  revalidatePath("/leads");
  revalidatePath(`/leads/${leadId}`);
}

export async function updateCitationStatus(targetId: string, clientId: string, status: string) {
  await getDb().from("citation_targets").update({ status }).eq("id", targetId);
  revalidatePath(`/clients/${clientId}`);
}
