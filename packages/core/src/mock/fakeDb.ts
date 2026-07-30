/**
 * Base de données en mémoire imitant le client supabase-js (sous-ensemble utilisé
 * par le projet). Activée par GEO_MOCK=1 : permet de dérouler tout le pipeline
 * sans Supabase (démo locale + tests). Les données vivent sur globalThis pour
 * survivre aux bundles multiples de Next en dev.
 */
import { randomUUID } from "node:crypto";
import { readFileSync, writeFileSync, existsSync, unlinkSync, statSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

type Row = Record<string, any>;

// Fichier partagé entre les process web (:3000) et admin (:3001) en mode démo.
const STORE_FILE = join(tmpdir(), "geo-sprint-mock-db.json");

const TABLE_DEFAULTS: Record<string, Row> = {
  scans: { status: "pending", progress: 0, cost_cents: 0, competitors: [], lang: "fr", email: null, error: null, score: null, score_detail: null, share_of_voice: null, actions: null, report_token: null, previous_scan_id: null, client_id: null },
  leads: { status: "new", notes: null },
  clients: { competitors: [], rescan_reminder_sent: false, rescan_due_at: null, contact_name: null, contact_email: null, site_access: null, initial_scan_id: null, lead_id: null },
  sprints: { status: "active", kind: "sprint" },
  sprint_tasks: { done: false, notes: null, deliverable_id: null },
  citation_targets: { status: "todo" },
  responses: { citations: [], cost_cents: 0 },
  mentions: { method: "deterministic", is_recommended: false, position: null, sentiment: null },
  cost_log: { input_tokens: 0, output_tokens: 0, cost_cents: 0 },
  deliverables: { path: null, data: null },
  directories: { type: "annuaire", notes: null },
  queries: { position: 0 },
  client_data: {},
};

function getStore(): Map<string, Row[]> {
  const g = globalThis as any;
  g.__geoMockStore ??= new Map<string, Row[]>();
  // Recharge depuis le fichier si un autre process l'a modifié
  try {
    if (existsSync(STORE_FILE)) {
      const mtime = statSync(STORE_FILE).mtimeMs;
      if (mtime !== g.__geoMockMtime) {
        const parsed = JSON.parse(readFileSync(STORE_FILE, "utf8")) as Record<string, Row[]>;
        g.__geoMockStore = new Map(Object.entries(parsed));
        g.__geoMockMtime = mtime;
      }
    }
  } catch { /* fichier en cours d'écriture par l'autre process — on garde la copie mémoire */ }
  return g.__geoMockStore;
}

function persistStore(): void {
  const g = globalThis as any;
  try {
    writeFileSync(STORE_FILE, JSON.stringify(Object.fromEntries(g.__geoMockStore ?? new Map())), "utf8");
    g.__geoMockMtime = statSync(STORE_FILE).mtimeMs;
  } catch { /* démo uniquement */ }
}

export function resetMockDb(): void {
  (globalThis as any).__geoMockStore = new Map<string, Row[]>();
  (globalThis as any).__geoMockMtime = undefined;
  try { unlinkSync(STORE_FILE); } catch { /* absent */ }
}

type Filter = (row: Row) => boolean;

class FakeQuery implements PromiseLike<{ data: any; error: any; count: number | null }> {
  private filters: Filter[] = [];
  private orderBy: { col: string; ascending: boolean } | null = null;
  private limitN: number | null = null;
  private mode: "select" | "insert" | "update" = "select";
  private insertPayload: Row[] = [];
  private updatePatch: Row = {};
  private wantRows = false; // .select() après insert/update
  private single_: "single" | "maybe" | null = null;
  private countMode: { head: boolean } | null = null;

  constructor(private table: string) {}

  select(_cols?: string, opts?: { count?: string; head?: boolean }) {
    if (this.mode === "select" && opts?.count) this.countMode = { head: opts.head ?? false };
    if (this.mode !== "select") this.wantRows = true;
    return this;
  }
  insert(payload: Row | Row[]) {
    this.mode = "insert";
    this.insertPayload = Array.isArray(payload) ? payload : [payload];
    return this;
  }
  update(patch: Row) {
    this.mode = "update";
    this.updatePatch = patch;
    return this;
  }
  eq(col: string, val: any) { this.filters.push((r) => r[col] === val); return this; }
  neq(col: string, val: any) { this.filters.push((r) => r[col] !== val); return this; }
  gte(col: string, val: any) { this.filters.push((r) => r[col] != null && r[col] >= val); return this; }
  lte(col: string, val: any) { this.filters.push((r) => r[col] != null && r[col] <= val); return this; }
  ilike(col: string, pattern: string) {
    const re = new RegExp(`^${pattern.replace(/[.*+?^${}()|[\]\\]/g, "\\$&").replace(/%/g, ".*")}$`, "i");
    this.filters.push((r) => typeof r[col] === "string" && re.test(r[col]));
    return this;
  }
  not(col: string, op: string, val: any) {
    if (op === "is" && val === null) this.filters.push((r) => r[col] != null);
    return this;
  }
  order(col: string, opts?: { ascending?: boolean }) {
    this.orderBy = { col, ascending: opts?.ascending ?? true };
    return this;
  }
  limit(n: number) { this.limitN = n; return this; }
  single() { this.single_ = "single"; return this; }
  maybeSingle() { this.single_ = "maybe"; return this; }

  private exec(): { data: any; error: any; count: number | null } {
    const store = getStore();
    const rows = store.get(this.table) ?? [];

    if (this.mode === "insert") {
      const defaults = TABLE_DEFAULTS[this.table] ?? {};
      const inserted = this.insertPayload.map((p) => ({
        id: randomUUID(),
        created_at: new Date().toISOString(),
        ...defaults,
        ...p,
      }));
      store.set(this.table, [...rows, ...inserted]);
      persistStore();
      const data = this.single_ ? inserted[0] ?? null : inserted;
      return { data: this.wantRows || this.single_ ? data : null, error: null, count: null };
    }

    let matched = rows.filter((r) => this.filters.every((f) => f(r)));

    if (this.mode === "update") {
      for (const r of matched) Object.assign(r, this.updatePatch);
      persistStore();
      return { data: this.wantRows ? matched : null, error: null, count: null };
    }

    if (this.orderBy) {
      const { col, ascending } = this.orderBy;
      matched = [...matched].sort((a, b) => (a[col] < b[col] ? -1 : a[col] > b[col] ? 1 : 0) * (ascending ? 1 : -1));
    }
    if (this.limitN != null) matched = matched.slice(0, this.limitN);
    if (this.countMode) return { data: this.countMode.head ? null : matched, error: null, count: matched.length };

    if (this.single_ === "single") {
      if (matched.length !== 1) return { data: null, error: { message: `single(): ${matched.length} lignes dans ${this.table}` }, count: null };
      return { data: matched[0], error: null, count: null };
    }
    if (this.single_ === "maybe") return { data: matched[0] ?? null, error: null, count: null };
    return { data: matched, error: null, count: null };
  }

  then<R1 = any, R2 = never>(
    onfulfilled?: ((value: { data: any; error: any; count: number | null }) => R1 | PromiseLike<R1>) | null,
    onrejected?: ((reason: any) => R2 | PromiseLike<R2>) | null
  ): PromiseLike<R1 | R2> {
    return Promise.resolve(this.exec()).then(onfulfilled, onrejected);
  }
}

export function createFakeDb(): any {
  return { from: (table: string) => new FakeQuery(table) };
}
