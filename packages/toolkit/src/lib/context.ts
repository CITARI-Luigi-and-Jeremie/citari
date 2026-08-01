import { mkdirSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { getDb, unwrap } from "@geo/core";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "../../../..");

/**
 * Frontière de traduction entre le schéma Supabase (partagé avec le front
 * Citari, qui en est propriétaire) et le vocabulaire métier du toolkit.
 *
 * Le schéma appartient au front : c'est lui qui crée les scans, les leads et
 * les clients. Le toolkit est un consommateur. Plutôt que de propager
 * `brand_name` / `website_url` / `local_path` dans les onze commandes, on
 * traduit ici, une fois. Une colonne qui change côté front se répare dans ce
 * fichier et nulle part ailleurs.
 *
 * Correspondances non évidentes :
 *   clients.brand_name    → brand
 *   clients.website_url   → url          (ajouté par 002, absent du front)
 *   clients.scan_id       → initialScanId
 *   scans.competitors     → competitors  (text[] : des noms, jamais d'URL)
 *   deliverables.local_path → path
 */
export interface ClientRow {
  id: string;
  brand: string;
  url: string | null;
  sector: string | null;
  competitors: { name: string }[];
  contact_email: string | null;
  initialScanId: string | null;
}

export function slugify(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

type ClientDb = {
  id: string;
  brand_name: string;
  website_url: string | null;
  sector: string | null;
  contact_email: string | null;
  scan_id: string | null;
};

/**
 * Les concurrents sont saisis au scan, pas sur la fiche client : on les lit
 * donc sur le scan initial. Un client créé à la main (sans scan) n'en a pas,
 * ce qui est légitime — les commandes qui en ont besoin le signalent.
 */
async function loadCompetitors(scanId: string | null): Promise<{ name: string }[]> {
  if (!scanId) return [];
  const { data } = await getDb().from("scans").select("competitors").eq("id", scanId).maybeSingle();
  const raw = (data as { competitors: unknown } | null)?.competitors;
  if (!Array.isArray(raw)) return [];
  return raw
    .map((c) => (typeof c === "string" ? c : ((c as { name?: string })?.name ?? "")))
    .filter((n): n is string => Boolean(n))
    .map((name) => ({ name }));
}

function toDomain(row: ClientDb, competitors: { name: string }[]): ClientRow {
  return {
    id: row.id,
    brand: row.brand_name,
    url: row.website_url,
    sector: row.sector,
    competitors,
    contact_email: row.contact_email,
    initialScanId: row.scan_id,
  };
}

/** Résout un client par nom (insensible à la casse) ou par id. */
export async function resolveClient(nameOrId: string): Promise<ClientRow> {
  const db = getDb();

  // `eq` sur une colonne uuid lève une erreur de type si l'entrée est un nom :
  // on ne tente la recherche par id que si l'entrée en a la forme.
  const looksLikeId = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(nameOrId);
  if (looksLikeId) {
    const { data } = await db.from("clients").select("*").eq("id", nameOrId).maybeSingle();
    if (data) {
      const row = data as ClientDb;
      return toDomain(row, await loadCompetitors(row.scan_id));
    }
  }

  const byName = unwrap(await db.from("clients").select("*").ilike("brand_name", nameOrId)) as ClientDb[];
  if (byName.length === 0) {
    throw new Error(
      `Client introuvable : « ${nameOrId} ». Créez-le d'abord dans l'admin, ou passez son id.`
    );
  }
  if (byName.length > 1) {
    const ids = byName.map((c) => `  ${c.id}  ${c.brand_name}`).join("\n");
    throw new Error(`Plusieurs clients pour « ${nameOrId} » — précisez l'id :\n${ids}`);
  }
  const row = byName[0]!;
  return toDomain(row, await loadCompetitors(row.scan_id));
}

/**
 * Site du client, ou erreur explicite.
 *
 * `clients.website_url` peut être vide : un client créé à la main dans l'admin
 * n'a pas de scan d'où le recopier. Les commandes qui crawlent doivent le dire
 * clairement plutôt que d'aller chercher `null`.
 */
export function requireUrl(client: ClientRow): string {
  if (!client.url) {
    throw new Error(
      `${client.brand} n'a pas de site renseigné.\n` +
        `Ajoutez-le dans l'admin (champ « site ») avant de lancer cette commande.`
    );
  }
  return client.url;
}

/**
 * Sprint en cours d'un client (le plus récent), ou null.
 *
 * Le front rattache livrables et cibles de citation au sprint. Le toolkit
 * raisonne par client, parce qu'un audit peut précéder la vente du sprint.
 */
export async function currentSprintId(clientId: string): Promise<string | null> {
  const { data } = await getDb()
    .from("sprints")
    .select("id")
    .eq("client_id", clientId)
    .order("started_on", { ascending: false })
    .limit(1)
    .maybeSingle();
  return (data as { id: string } | null)?.id ?? null;
}

/** Écrit un fichier dans deliverables/<slug-client>/ et retourne son chemin relatif. */
export function writeDeliverableFile(clientSlug: string, relPath: string, content: string): string {
  const full = join(ROOT, "deliverables", clientSlug, relPath);
  mkdirSync(dirname(full), { recursive: true });
  writeFileSync(full, content, "utf8");
  return join("deliverables", clientSlug, relPath);
}

/**
 * Enregistre un livrable en base (visible dans l'admin) et retourne son id.
 *
 * `sprint_id` est la clé du front, mais un livrable peut précéder la création
 * du sprint (l'audit technique sert à vendre la mission). On rattache donc au
 * client, et au sprint en cours s'il existe.
 */
export async function recordDeliverable(
  clientId: string,
  kind: string,
  title: string,
  path: string | null,
  data?: unknown
): Promise<string> {
  const db = getDb();
  const sprintId = await currentSprintId(clientId);

  const row = unwrap(
    await db
      .from("deliverables")
      .insert({
        client_id: clientId,
        sprint_id: sprintId,
        kind,
        title,
        local_path: path,
        status: "brouillon",
        data,
      })
      .select("id")
      .single()
  ) as { id: string };
  return row.id;
}
