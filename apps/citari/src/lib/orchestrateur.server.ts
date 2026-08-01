import { createHash } from "node:crypto";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { interroger, analyser, genererQuestions } from "@/lib/moteurs.server";
import { calculerScore, partDeVoix, type LigneMention } from "@/lib/score";
import { MOTEURS } from "@/lib/typo";

export type PdvItem = { name: string; count: number; share: number; target: boolean };
export type Action = { chantier: string; titre: string; pourquoi: string; effort: string };

export const PLAFOND_SCANS_PAR_IP = 3;
export const PLAFOND_COUT_EUR = 1.5;
const LOT = 8; // paires (question × moteur) traitées à chaque appel

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
}) {
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
      status: "running",
      phase: "init",
      started_at: new Date().toISOString(),
    })
    .select("id, report_token")
    .single();
  if (error) throw new Error(error.message);
  return data;
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
    });
  }
  if (!lignes.length) throw new Error("Échantillon de questions vide");

  await supabaseAdmin
    .from("queries")
    .insert(lignes.map((q, i) => ({ scan_id: scan.id, rank: i + 1, text: q.text, intent: q.intent })));
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
  const total = (questions?.length ?? 0) * MOTEURS.length;
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

    const deja = new Set((faites ?? []).map((r) => `${r.query_id}|${r.engine}`));
    const restant: { queryId: string; text: string; engine: string }[] = [];
    for (const q of questions ?? []) {
      for (const moteur of MOTEURS) {
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
    if ((coutCumule ?? 0) > PLAFOND_COUT_EUR) {
      await finaliser(id);
      return;
    }

    await Promise.all(
      restant.slice(0, LOT).map(async (item) => {
        const rep = await interroger(item.engine as (typeof MOTEURS)[number], item.text, scan.language);
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
        const cibleNorm = scan.brand_name.toLowerCase();
        if (analyse.brands.length) {
          await supabaseAdmin.from("mentions").insert(
            analyse.brands.map((b) => ({
              scan_id: id,
              response_id: inserted.id,
              query_id: item.queryId,
              engine: item.engine,
              brand: b.name,
              is_target: b.name.toLowerCase().includes(cibleNorm) || cibleNorm.includes(b.name.toLowerCase()),
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
  const key = process.env.LOVABLE_API_KEY;
  if (!key) return [];
  try {
    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Lovable-API-Key": key },
      body: JSON.stringify({
        model: "google/gemini-3.6-flash",
        messages: [
          {
            role: "system",
            content:
              'Renvoie UNIQUEMENT du JSON : {"actions":[{"chantier":"Contenu|Citations|Technique","titre":"","pourquoi":"","effort":"faible|moyen|fort"}]}. Exactement 10 actions, classées de la plus prioritaire à la moins prioritaire, concrètes et exécutables en 30 jours.',
          },
          {
            role: "user",
            content: `Marque : ${marque}. Secteur : ${secteur}. Score de visibilité IA : ${score}/100. Concurrents dominants : ${pdv
              .slice(0, 4)
              .map((p) => p.name)
              .join(", ")}.`,
          },
        ],
      }),
    });
    const json = (await res.json()) as { choices: { message: { content: string } }[] };
    const raw = json.choices[0]?.message?.content ?? "";
    const m = raw.match(/\{[\s\S]*\}/);
    return (JSON.parse(m ? m[0] : '{"actions":[]}') as { actions: Action[] }).actions ?? [];
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
      .select("score_global, completed_at, share_of_voice, score_chatgpt, score_claude, score_gemini, score_perplexity")
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

/** Teaser : le strict nécessaire, avant la capture de l'email. */
export async function teaserScan(id: string) {
  const { data: scan } = await supabaseAdmin
    .from("scans")
    .select(
      "id, brand_name, status, score_global, score_chatgpt, score_claude, score_gemini, score_perplexity, share_of_voice",
    )
    .eq("id", id)
    .maybeSingle();
  if (!scan || scan.status !== "done") return null;

  const { data: mentions } = await supabaseAdmin
    .from("mentions")
    .select("brand, is_target, engine, verbatim, query_id")
    .eq("scan_id", id);

  const cibles = new Set((mentions ?? []).filter((m) => m.is_target).map((m) => m.query_id));
  const preuve =
    (mentions ?? []).find(
      (m) => !m.is_target && m.verbatim && m.verbatim.length > 60 && !cibles.has(m.query_id),
    ) ?? null;

  const { data: question } = preuve
    ? await supabaseAdmin.from("queries").select("text").eq("id", preuve.query_id).maybeSingle()
    : { data: null };

  return {
    id: scan.id,
    marque: scan.brand_name,
    score: Math.round(Number(scan.score_global ?? 0)),
    parMoteur: {
      ChatGPT: scan.score_chatgpt as number | null,
      Claude: scan.score_claude as number | null,
      Gemini: scan.score_gemini as number | null,
      Perplexity: scan.score_perplexity as number | null,
    },
    pdv: (Array.isArray(scan.share_of_voice) ? scan.share_of_voice : []) as unknown as PdvItem[],
    verbatim: preuve
      ? { texte: preuve.verbatim as string, moteur: preuve.engine, marque: preuve.brand, question: question?.text ?? "" }
      : null,
  };
}
