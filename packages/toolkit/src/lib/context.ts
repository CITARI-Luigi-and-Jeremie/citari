import { mkdirSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { getDb, unwrap } from "@geo/core";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "../../../..");

export interface ClientRow {
  id: string;
  brand: string;
  url: string;
  sector: string | null;
  competitors: { name: string; url?: string }[];
  contact_email: string | null;
  initial_scan_id: string | null;
}

export function slugify(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

/** Résout un client par nom (insensible à la casse) ou par id. */
export async function resolveClient(nameOrId: string): Promise<ClientRow> {
  const db = getDb();
  const byId = await db.from("clients").select("*").eq("id", nameOrId).maybeSingle();
  if (byId.data) return byId.data as ClientRow;
  const byName = unwrap(await db.from("clients").select("*").ilike("brand", nameOrId)) as ClientRow[];
  if (byName.length === 0) throw new Error(`Client introuvable : "${nameOrId}". Créez-le d'abord dans l'admin.`);
  if (byName.length > 1) throw new Error(`Plusieurs clients pour "${nameOrId}" — utilisez l'id.`);
  return byName[0] as ClientRow;
}

/** Écrit un fichier dans deliverables/<slug-client>/ et retourne son chemin relatif. */
export function writeDeliverableFile(clientSlug: string, relPath: string, content: string): string {
  const full = join(ROOT, "deliverables", clientSlug, relPath);
  mkdirSync(dirname(full), { recursive: true });
  writeFileSync(full, content, "utf8");
  return join("deliverables", clientSlug, relPath);
}

/** Enregistre un livrable en base (visible dans l'admin) et retourne son id. */
export async function recordDeliverable(
  clientId: string,
  kind: string,
  title: string,
  path: string | null,
  data?: unknown
): Promise<string> {
  const row = unwrap(
    await getDb().from("deliverables").insert({ client_id: clientId, kind, title, path, data }).select("id").single()
  ) as { id: string };
  return row.id;
}
