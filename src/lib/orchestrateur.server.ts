import { createHash } from "node:crypto";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { interroger, analyser, genererQuestions, questionMiroir } from "@/lib/moteurs.server";
import { calculerScore, partDeVoix, type LigneMention } from "@/lib/score";
import { MOTEURS, MOTEURS_APERCU, MOTEURS_CONTROLE, type ModeScan, type Moteur } from "@/lib/typo";

export type PdvItem = { name: string; count: number; share: number; target: boolean };
export type Action = { chantier: string; titre: string; pourquoi: string; effort: string };

export const PLAFOND_SCANS_PAR_IP = 3;
// Aperçu : gratuit et public, le plafond est un fusible anti-dérive.
// Complet : déclenché uniquement pour un rendez-vous réservé, on paye la qualité.
// Mesurés sur le premier scan réel : 1,06 € pour 24 questions × 6 moteurs.
// Contrôle J+45 = 4 moteurs à recherche ≈ 0,84 €, d'où un plafond à 1,5 €.
export const PLAFONDS_EUR: Record<ModeScan, number> = { apercu: 0.25, complet: 3, controle: 1.5 };
const LOT = 8; // paires (question × moteur) traitées à chaque appel
const CACHE_JOURS = 30;

function moteursDuMode(mode: ModeScan): readonly Moteur[] {
  if (mode === "apercu") return MOTEURS_APERCU;
  if (mode === "controle") return MOTEURS_CONTROLE;
  return MOTEURS;
}

/** Normalisation pour la détection de marque : minuscules, sans accents ni ponctuation. */
export function normaliserNom(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

/**
 * Même marque ? Comparaison sur les formes normalisées.
 * Règle le 0/100 artefactuel : « nutri)smar » ne matchait jamais « NutriSmart »
 * avec l'ancien `includes` brut, et « L'Oréal » ne matchait pas « loreal ».
 */
export function memeMarque(a: string, b: string): boolean {
  const na = normaliserNom(a);
  const nb = normaliserNom(b);
  if (na.length < 2 || nb.length < 2) return false;
  if (na === nb || na.includes(nb) || nb.includes(na)) return true;
  // Formes compactes, sans espaces : « nutri)smar » → « nutrismar » doit
  // matcher « NutriSmart » → « nutrismart », et « L'Oréal » → « loreal ».
  // C'est le cas exact du bug d'origine, attrapé par le test — la ponctuation
  // devenue espace cassait l'inclusion.
  const ca = na.replace(/ /g, "");
  const cb = nb.replace(/ /g, "");
  return ca.length >= 3 && cb.length >= 3 && (ca.includes(cb) || cb.includes(ca));
}

/** Clé de cache : le domaine du site, sinon marque+secteur+ville normalisés. */
export function cleDomaine(url: string | null, marque: string, secteur: string, ville: string | null): string {
  if (url) {
    try {
      const u = new URL(url.startsWith("http") ? url : `https://${url}`);
      return u.hostname.replace(/^www\./, "").toLowerCase();
    } catch {
      /* URL invalide : on retombe sur la clé nominative */
    }
  }
  return [marque, secteur, ville ?? ""].map(normaliserNom).join("|");
}

export function hacherIp(ip: string) {
  return createHash("sha256").update(`geo-sprint:${ip}`).digest("hex").slice(0, 32);
}

export async function quotaAtteint(ipHash: string) {
  const depuis = new Date(Date.now() - 24 * 3600 * 1000).toISOString();
  const { count } = await supabaseAdmin
    .from("scans")
    .select("id", { count: "exact", head: true })
    .eq("ip_hash", ipHash)
    .gte("created_at", depuis);
  return (count ?? 0) >= PLAFOND_SCANS_PAR_IP;
}

export async function creerScan(input: {
  marque: string;
  url: string | null;
  secteur: string;
  ville: string | null;
  concurrents: string[];
  langue: string;
  ipHash: string;
  previousScanId?: string | null;
  mode?: ModeScan;
}) {
  // L'aperçu est le mode par défaut : c'est le seul exposé au public, et un
  // oubli de paramètre côté front doit coûter 0,15 € et non 1,70 €.
  const mode: ModeScan = input.mode ?? "apercu";
  const domaine = cleDomaine(input.url, input.marque, input.secteur, input.ville);

  // Cache : même domaine, même mode, moins de 30 jours → même résultat.
  // Trois effets voulus : le score ne bouge pas d'un scan à l'autre (la
  // crédibilité de la mesure), les curieux qui rescannent ne coûtent rien,
  // et l'abus est borné. Un re-scan J+90 (previousScanId) court-circuite
  // le cache : c'est une nouvelle mesure par définition.
  if (!input.previousScanId) {
    const depuis = new Date(Date.now() - CACHE_JOURS * 86400000).toISOString();
    const { data: existant } = await supabaseAdmin
      .from("scans")
      .select("id, report_token, status, created_at")
      .eq("domain_key", domaine)
      .eq("mode", mode)
      .gte("created_at", depuis)
      .in("status", ["done", "running"])
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (existant) return { id: existant.id, report_token: existant.report_token, cached: true };
  }

  const { data, error } = await supabaseAdmin
    .from("scans")
    .insert({
      brand_name: input.marque,
      website_url: input.url,
      sector: input.secteur,
      city: input.ville,
      language: input.langue,
      competitors: input.concurrents,
      ip_hash: input.ipHash,
      previous_scan_id: input.previousScanId ?? null,
      mode,
      domain_key: domaine,
      status: "running",
      phase: "init",
      started_at: new Date().toISOString(),
    })
    .select("id, report_token")
    .single();
  if (error) throw new Error(error.message);
  return { ...data, cached: false };
}

/**
 * Audit flash du site : robots.txt et llms.txt, en deux requêtes.
 * La version complète (schema.org, structure) reste l'affaire du toolkit
 * lors de la préparation du diagnostic ; ici on veut UNE trouvaille qui
 * accroche : « votre site bloque GPTBot ».
 */
type AuditFlash = {
  ok: boolean;
  bots: Record<string, "bloque" | "autorise" | "non_mentionne">;
  llmstxt: boolean;
};

export async function auditFlash(siteUrl: string | null): Promise<AuditFlash | null> {
  if (!siteUrl) return null;
  let base: URL;
  try {
    base = new URL(siteUrl.startsWith("http") ? siteUrl : `https://${siteUrl}`);
  } catch {
    return null;
  }
  const BOTS = ["GPTBot", "ClaudeBot", "PerplexityBot", "Google-Extended"];
  const audit: AuditFlash = { ok: false, bots: {}, llmstxt: false };
  try {
    const r = await fetch(new URL("/robots.txt", base), { signal: AbortSignal.timeout(6000) });
    if (r.ok) {
      audit.ok = true;
      const lignes = (await r.text()).split(/\r?\n/);
      // Blocs robots.txt : la section d'un agent nommé prime sur la section « * ».
      const regles: Record<string, string[]> = {};
      let agents: string[] = [];
      let enTete = true;
      for (const brute of lignes) {
        const ligne = brute.replace(/#.*$/, "").trim();
        if (!ligne) continue;
        const [clef, ...reste] = ligne.split(":");
        const valeur = reste.join(":").trim();
        if (clef.trim().toLowerCase() === "user-agent") {
          if (!enTete) agents = [];
          enTete = false;
          agents.push(valeur.toLowerCase());
          for (const a of agents) regles[a] ??= [];
        } else {
          enTete = true;
          if (clef.trim().toLowerCase() === "disallow") {
            for (const a of agents) (regles[a] ??= []).push(valeur);
          }
        }
      }
      for (const bot of BOTS) {
        const propres = regles[bot.toLowerCase()];
        const generiques = regles["*"];
        const applicables = propres ?? generiques;
        if (propres === undefined && generiques === undefined) {
          audit.bots[bot] = "non_mentionne";
        } else {
          audit.bots[bot] = applicables?.some((d) => d === "/") ? "bloque" : "autorise";
        }
      }
    }
  } catch {
    /* site injoignable : audit.ok reste false */
  }
  try {
    const r = await fetch(new URL("/llms.txt", base), { signal: AbortSignal.timeout(6000) });
    audit.llmstxt = r.ok;
  } catch {
    /* pas de llms.txt */
  }
  return audit;
}

/** Étape 2 : génération (ou recopie à l'identique pour un re-scan) de l'échantillon. */
async function preparerQuestions(scan: ScanRow) {
  const { count } = await supabaseAdmin
    .from("queries")
    .select("id", { count: "exact", head: true })
    .eq("scan_id", scan.id);
  if ((count ?? 0) > 0) return;

  await supabaseAdmin.from("scans").update({ phase: "questions" }).eq("id", scan.id);

  let lignes: { text: string; intent: string }[] = [];
  if (scan.previous_scan_id) {
    // Re-scan J+90 : on rejoue exactement les mêmes questions.
    const { data } = await supabaseAdmin
      .from("queries")
      .select("text, intent, rank")
      .eq("scan_id", scan.previous_scan_id)
      .order("rank");
    lignes = (data ?? []).map((q) => ({ text: q.text, intent: q.intent }));
  }
  if (!lignes.length) {
    lignes = await genererQuestions({
      marque: scan.brand_name,
      secteur: scan.sector,
      ville: scan.city,
      langue: scan.language,
      nombre: scan.mode === "apercu" ? 20 : 24,
    });
  }
  if (!lignes.length) throw new Error("Échantillon de questions vide");

  await supabaseAdmin
    .from("queries")
    .insert(lignes.map((q, i) => ({ scan_id: scan.id, rank: i + 1, text: q.text, intent: q.intent })));

  // Audit flash + question miroir, une seule fois, en parallèle de la mise en
  // place. Aperçu : miroir sur ChatGPT seul (une accroche). Complet : les six.
  // Contrôle J+45 : ni audit ni miroir, c'est de la télémétrie interne.
  if (scan.mode === "controle") return;
  const moteursMiroir = scan.mode === "apercu" ? (["ChatGPT"] as const) : MOTEURS;
  const [audit, miroirs] = await Promise.all([
    auditFlash(scan.website_url),
    Promise.all(
      moteursMiroir.map((m) => questionMiroir(scan.brand_name, scan.sector, scan.city, m))
    ),
  ]);
  await supabaseAdmin
    .from("scans")
    .update({ audit, miroir: miroirs.filter((m) => !m.erreur && m.texte) })
    .eq("id", scan.id);
}

type ScanRow = {
  id: string;
  brand_name: string;
  sector: string;
  city: string | null;
  language: string;
  competitors: string[];
  previous_scan_id: string | null;
  status: string;
  mode: ModeScan;
  website_url: string | null;
};

export async function etatScan(id: string) {
  const { data: scan } = await supabaseAdmin
    .from("scans")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (!scan) return null;
  const [{ data: questions }, { count: nbReponses }, { data: cout }] = await Promise.all([
    supabaseAdmin.from("queries").select("rank, text, intent").eq("scan_id", id).order("rank"),
    supabaseAdmin.from("responses").select("id", { count: "exact", head: true }).eq("scan_id", id),
    supabaseAdmin.from("cost_log").select("cost_eur").eq("scan_id", id),
  ]);
  const total = (questions?.length ?? 0) * moteursDuMode((scan.mode as ModeScan) ?? "complet").length;
  const collectees = nbReponses ?? 0;
  return {
    id: scan.id,
    status: scan.status,
    phase: scan.phase,
    error: scan.error_message,
    brand: scan.brand_name,
    reportToken: scan.report_token,
    questions: questions ?? [],
    collectees,
    total,
    progression: total ? Math.min(99, Math.round((collectees / total) * 96) + 2) : 2,
    cout: (cout ?? []).reduce((a, c) => a + Number(c.cost_eur ?? 0), 0),
  };
}

/** Traite un lot de paires (question × moteur). Appelé à chaque interrogation du client. */
export async function avancerScan(id: string) {
  const { data: scan } = await supabaseAdmin.from("scans").select("*").eq("id", id).maybeSingle();
  if (!scan || scan.status !== "running") return;

  try {
    await preparerQuestions(scan as ScanRow);

    const { data: questions } = await supabaseAdmin
      .from("queries")
      .select("id, text")
      .eq("scan_id", id)
      .order("rank");
    const { data: faites } = await supabaseAdmin
      .from("responses")
      .select("query_id, engine")
      .eq("scan_id", id);

    const moteurs = moteursDuMode((scan.mode as ModeScan) ?? "complet");
    const deja = new Set((faites ?? []).map((r) => `${r.query_id}|${r.engine}`));
    const restant: { queryId: string; text: string; engine: string }[] = [];
    for (const q of questions ?? []) {
      for (const moteur of moteurs) {
        if (!deja.has(`${q.id}|${moteur}`)) restant.push({ queryId: q.id, text: q.text, engine: moteur });
      }
    }

    if (!restant.length) {
      await finaliser(id);
      return;
    }

    await supabaseAdmin.from("scans").update({ phase: "interrogation" }).eq("id", id);

    const coutCumule = (
      await supabaseAdmin.from("cost_log").select("cost_eur").eq("scan_id", id)
    ).data?.reduce((a, c) => a + Number(c.cost_eur ?? 0), 0);
    if ((coutCumule ?? 0) > PLAFONDS_EUR[(scan.mode as ModeScan) ?? "complet"]) {
      await finaliser(id);
      return;
    }

    await Promise.all(
      restant.slice(0, LOT).map(async (item) => {
        const rep = await interroger(item.engine as Moteur, item.text, scan.language, {
          recherche: scan.mode !== "apercu",
        });
        const { data: inserted } = await supabaseAdmin
          .from("responses")
          .upsert(
            {
              scan_id: id,
              query_id: item.queryId,
              engine: item.engine,
              raw_text: rep.text,
              sources: rep.sources,
              latency_ms: rep.latency,
              cost_eur: rep.cost,
              error: rep.error ?? null,
            },
            { onConflict: "scan_id,query_id,engine", ignoreDuplicates: true },
          )
          .select("id")
          .maybeSingle();
        // Doublon (paire déjà traitée par un sondage concurrent) : ni coût, ni analyse.
        if (!inserted) return;

        await supabaseAdmin
          .from("cost_log")
          .insert({ scan_id: id, engine: item.engine, cost_eur: rep.cost });
        if (rep.error || !rep.text) return;


        const analyse = await analyser(rep.text, scan.brand_name);
        if (analyse.brands.length) {
          await supabaseAdmin.from("mentions").insert(
            analyse.brands.map((b) => ({
              scan_id: id,
              response_id: inserted.id,
              query_id: item.queryId,
              engine: item.engine,
              brand: b.name,
              is_target: memeMarque(b.name, scan.brand_name),
              position: b.position ?? null,
              recommended: !!b.recommended,
              sentiment: b.sentiment ?? "neutre",
              verbatim: b.verbatim ?? null,
            })),
          );
        }
      }),
    );

    if (restant.length <= LOT) await finaliser(id);
  } catch (e) {
    await supabaseAdmin
      .from("scans")
      .update({ status: "error", error_message: e instanceof Error ? e.message : "Erreur" })
      .eq("id", id);
  }
}

async function finaliser(id: string) {
  await supabaseAdmin.from("scans").update({ phase: "analyse" }).eq("id", id);
  const [{ data: reponses }, { data: mentions }, { data: scan }] = await Promise.all([
    supabaseAdmin.from("responses").select("id, engine").eq("scan_id", id),
    supabaseAdmin.from("mentions").select("*").eq("scan_id", id),
    supabaseAdmin.from("scans").select("brand_name, sector, city").eq("id", id).single(),
  ]);
  const lignes = (mentions ?? []) as unknown as LigneMention[];
  const s = calculerScore(reponses ?? [], lignes);
  const pdv = partDeVoix(lignes);

  const actions = await genererActions(scan?.brand_name ?? "", scan?.sector ?? "", s.global, pdv);

  await supabaseAdmin
    .from("scans")
    .update({
      status: "done",
      phase: "termine",
      completed_at: new Date().toISOString(),
      score_global: s.global,
      score_chatgpt: s.parMoteur["ChatGPT"],
      score_claude: s.parMoteur["Claude"],
      score_gemini: s.parMoteur["Gemini"],
      score_perplexity: s.parMoteur["Perplexity"],
      score_grok: s.parMoteur["Grok"],
      score_mistral: s.parMoteur["Le Chat"],
      mention_rate: s.mentionRate,
      avg_position: s.avgPosition,
      reco_rate: s.recoRate,
      sentiment_score: s.sentiment,
      share_of_voice: pdv,
      actions: actions as unknown as never,
    })
    .eq("id", id);
}

async function genererActions(
  marque: string,
  secteur: string,
  score: number,
  pdv: { name: string; share: number }[],
): Promise<Action[]> {
  if (!process.env.GOOGLE_AI_API_KEY) return [];
  try {
    const { genererActionsIA } = await import("@/lib/moteurs.server");
    return await genererActionsIA(marque, secteur, score, pdv);
  } catch {
    return [];
  }
}

/** Rapport complet, accessible par jeton signé, sans compte. */
export async function rapportParJeton(jeton: string) {
  const { data: scan } = await supabaseAdmin
    .from("scans")
    .select("*")
    .eq("report_token", jeton)
    .maybeSingle();
  if (!scan) return null;

  const [{ data: questions }, { data: reponses }, { data: mentions }] = await Promise.all([
    supabaseAdmin.from("queries").select("*").eq("scan_id", scan.id).order("rank"),
    supabaseAdmin.from("responses").select("*").eq("scan_id", scan.id),
    supabaseAdmin.from("mentions").select("*").eq("scan_id", scan.id),
  ]);

  let precedent: {
    score: number;
    date: string;
    pdv: PdvItem[];
    parMoteur: Record<string, number | null>;
  } | null = null;
  if (scan.previous_scan_id) {
    const { data: prev } = await supabaseAdmin
      .from("scans")
      .select("score_global, completed_at, share_of_voice, score_chatgpt, score_claude, score_gemini, score_perplexity, score_grok, score_mistral")
      .eq("id", scan.previous_scan_id)
      .maybeSingle();
    if (prev)
      precedent = {
        score: Number(prev.score_global ?? 0),
        date: prev.completed_at ?? "",
        pdv: (prev.share_of_voice ?? []) as unknown as PdvItem[],
        parMoteur: {
          ChatGPT: prev.score_chatgpt as number | null,
          Claude: prev.score_claude as number | null,
          Gemini: prev.score_gemini as number | null,
          Perplexity: prev.score_perplexity as number | null,
          Grok: prev.score_grok as number | null,
          "Le Chat": prev.score_mistral as number | null,
        },
      };
  }

  return { scan, questions: questions ?? [], reponses: reponses ?? [], mentions: mentions ?? [], precedent };
}

export async function enregistrerLead(input: {
  scanId: string;
  email: string;
  prenom?: string | null;
  telephone?: string | null;
}) {
  const { data: scan } = await supabaseAdmin
    .from("scans")
    .select("id, brand_name, report_token, score_global")
    .eq("id", input.scanId)
    .maybeSingle();
  if (!scan) throw new Error("Scan introuvable");

  const score = Number(scan.score_global ?? 0);
  const priorite = score < 25 ? "chaud" : score < 55 ? "tiede" : "froid";

  const { data: lead } = await supabaseAdmin
    .from("leads")
    .insert({
      scan_id: scan.id,
      email: input.email,
      first_name: input.prenom ?? null,
      phone: input.telephone ?? null,
      company: scan.brand_name,
      priority: priorite,
    })
    .select("id")
    .single();

  if (lead) {
    const jours = [2, 5, 12];
    await supabaseAdmin.from("follow_ups").insert(
      jours.map((j, i) => ({
        lead_id: lead.id,
        step: i + 1,
        due_on: new Date(Date.now() + j * 86400000).toISOString().slice(0, 10),
        subject: `${scan.brand_name} — votre score de visibilité IA`,
        body:
          i === 0
            ? `Bonjour,\n\nVotre rapport est en ligne : score ${Math.round(score)}/100.\nJe vous propose 30 minutes pour le passer en revue ensemble.\n\n— Citari`
            : i === 1
              ? `Bonjour,\n\nUne question rapide : avez-vous regardé les sources citées par Perplexity pour vos concurrents ? C'est là que tout se joue.\n\n— Citari`
              : `Bonjour,\n\nJe clôture votre dossier sauf contre-ordre. Le rapport reste accessible par votre lien.\n\n— Citari`,
      })),
    );
  }

  return { reportToken: scan.report_token };
}

/**
 * Teaser : ce que voit le prospect après le scan.
 *
 * La hiérarchie est voulue : l'écart de comptage d'abord (« vos concurrents
 * cités 17 fois, vous 2 »), le score ensuite. Le comptage est ce qui fait mal ;
 * le score est ce qui donne un chiffre à retenir. Les aguiches (audit, miroir,
 * question la plus chère) existent pour une seule chose : réserver le
 * diagnostic complet en visio.
 */
export async function teaserScan(id: string) {
  const { data: scan } = await supabaseAdmin
    .from("scans")
    .select(
      "id, brand_name, status, mode, score_global, score_chatgpt, score_claude, score_gemini, score_perplexity, score_grok, score_mistral, share_of_voice, audit, miroir",
    )
    .eq("id", id)
    .maybeSingle();
  if (!scan || scan.status !== "done") return null;

  const [{ data: mentions }, { data: questions }, { count: nbReponses }] = await Promise.all([
    supabaseAdmin.from("mentions").select("brand, is_target, engine, verbatim, query_id").eq("scan_id", id),
    supabaseAdmin.from("queries").select("id, text, intent").eq("scan_id", id).order("rank"),
    supabaseAdmin.from("responses").select("id", { count: "exact", head: true }).eq("scan_id", id),
  ]);

  const lignes = mentions ?? [];
  const nbCible = lignes.filter((m) => m.is_target).length;
  const nbConcurrents = lignes.length - nbCible;

  // Questions où la marque n'apparaît sur aucun moteur : l'argument du manque.
  const citeSur = new Set(lignes.filter((m) => m.is_target).map((m) => m.query_id));
  const questionsPerdues = (questions ?? []).filter((q) => !citeSur.has(q.id));

  const cibles = new Set(lignes.filter((m) => m.is_target).map((m) => m.query_id));
  const preuve =
    lignes.find(
      (m) => !m.is_target && m.verbatim && m.verbatim.length > 60 && !cibles.has(m.query_id),
    ) ?? null;
  const { data: question } = preuve
    ? await supabaseAdmin.from("queries").select("text").eq("id", preuve.query_id).maybeSingle()
    : { data: null };

  // La question la plus chère : une comparative perdue, pour l'aguiche.
  const questionChere =
    questionsPerdues.find((q) => q.intent === "comparative")?.text ?? questionsPerdues[0]?.text ?? null;

  const audit = (scan.audit ?? null) as {
    ok: boolean;
    bots: Record<string, string>;
    llmstxt: boolean;
  } | null;
  const botsBloques = audit ? Object.keys(audit.bots).filter((b) => audit.bots[b] === "bloque") : [];

  const miroirs = (Array.isArray(scan.miroir) ? scan.miroir : []) as { moteur: string; texte: string }[];
  const miroirExtrait = miroirs[0]?.texte ? miroirs[0].texte.slice(0, 220) : null;

  return {
    id: scan.id,
    marque: scan.brand_name,
    mode: (scan.mode as ModeScan) ?? "complet",
    score: Math.round(Number(scan.score_global ?? 0)),
    parMoteur: {
      ChatGPT: scan.score_chatgpt as number | null,
      Claude: scan.score_claude as number | null,
      Gemini: scan.score_gemini as number | null,
      Perplexity: scan.score_perplexity as number | null,
      Grok: scan.score_grok as number | null,
      "Le Chat": scan.score_mistral as number | null,
    },
    comptage: {
      reponses: nbReponses ?? 0,
      questions: (questions ?? []).length,
      citationsCible: nbCible,
      citationsConcurrents: nbConcurrents,
      questionsPerdues: questionsPerdues.length,
    },
    pdv: (Array.isArray(scan.share_of_voice) ? scan.share_of_voice : []) as unknown as PdvItem[],
    verbatim: preuve
      ? { texte: preuve.verbatim as string, moteur: preuve.engine, marque: preuve.brand, question: question?.text ?? "" }
      : null,
    // Les aguiches du diagnostic complet.
    aguiches: {
      auditFait: Boolean(audit?.ok),
      botsBloques,
      llmstxtAbsent: audit ? !audit.llmstxt : null,
      miroirExtrait,
      questionChere,
    },
  };
}
