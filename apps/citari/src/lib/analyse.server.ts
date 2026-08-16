import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { adversairePrincipal, type LigneMention } from "@/lib/rapport-apercu";

/**
 * L'ANALYSE COMPLÉMENTAIRE du scan complet (16/08/2026).
 *
 * Deux extractions sur les réponses DÉJÀ stockées, par le modèle d'analyse
 * (gemini flash-lite, celui des mentions) : l'IDENTITÉ PERÇUE (le métier
 * que chaque moteur attribue à l'entreprise dans sa réponse miroir) et LES
 * ARGUMENTS DU RIVAL (ce que les moteurs répètent pour recommander le
 * concurrent principal). Zéro nouvel appel aux six moteurs : le score et la
 * mesure restent figés, on relit ce qui a été payé.
 *
 * LE GARDE-FOU CONTRE L'INVENTION est dans le code, pas dans le prompt :
 * chaque ligne extraite doit porter une CITATION, et une citation qui ne se
 * retrouve pas mot pour mot dans le texte source est jetée. Ce qui
 * s'affiche a donc toujours une preuve.
 *
 * Calculée une fois, mise en cache dans `scans.analyse_ia`. ~1 centime.
 */

export type AnalyseIdentite = { moteur: string; metier: string; citation: string };
export type AnalyseArgument = { resume: string; citation: string; moteur: string };
export type AnalyseIa = {
  version: 1;
  genere_le: string;
  identites: AnalyseIdentite[];
  rival: { nom: string; arguments: AnalyseArgument[] } | null;
};

/** Normalisation tolérante pour vérifier qu'une citation vient bien du texte. */
function normaliser(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[«»"'’*_`]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function citationProuvee(citation: string, source: string): boolean {
  const c = normaliser(citation);
  return c.length >= 12 && normaliser(source).includes(c);
}

async function extraireJson(systeme: string, user: string): Promise<unknown> {
  const key = process.env.GOOGLE_AI_API_KEY;
  if (!key) throw new Error("GOOGLE_AI_API_KEY absente");
  const model = process.env.GEMINI_ANALYSE_MODEL || "gemini-3.1-flash-lite";
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
    {
      method: "POST",
      headers: { "content-type": "application/json", "x-goog-api-key": key },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: systeme }] },
        contents: [{ role: "user", parts: [{ text: user }] }],
        generationConfig: { maxOutputTokens: 4096, responseMimeType: "application/json" },
      }),
    },
  );
  if (!res.ok) throw new Error(`Google [${res.status}] ${(await res.text()).slice(0, 200)}`);
  const json = (await res.json()) as { candidates?: { content?: { parts?: { text?: string }[] } }[] };
  const texte = (json.candidates?.[0]?.content?.parts ?? []).map((p) => p.text ?? "").join("");
  return JSON.parse(texte);
}

/**
 * L'identité perçue : pour chaque réponse miroir, le MÉTIER que le moteur
 * attribue à l'entreprise, en quelques mots, avec la phrase qui le prouve.
 * On n'affirme jamais qui a raison : les six lignes côte à côte suffisent,
 * la divergence se juge d'elle-même.
 */
async function extraireIdentites(
  marque: string,
  miroir: { moteur?: string; texte?: string }[],
): Promise<AnalyseIdentite[]> {
  const entrees = miroir
    .filter((m): m is { moteur: string; texte: string } =>
      Boolean(m?.moteur && typeof m?.texte === "string" && m.texte.length > 60),
    )
    .map((m) => ({ moteur: m.moteur, texte: m.texte.slice(0, 1600) }));
  if (!entrees.length) return [];

  const brut = await extraireJson(
    `Tu es un extracteur. Tu n'inventes JAMAIS, tu ne déduis pas, tu recopies.
Pour chaque moteur, lis sa réponse au sujet de l'entreprise « ${marque} » et extrais :
- "metier" : le métier ou l'activité que CE TEXTE attribue à l'entreprise, en 3 à 9 mots, dans la langue du texte. Si le texte ne dit pas ce que fait l'entreprise, écris "non précisé".
- "citation" : un passage EXACT du texte (12 à 25 mots, recopié mot pour mot) qui montre ce métier supposé, ou une chaîne vide si "non précisé".
Réponds en JSON strict : {"identites":[{"moteur":"…","metier":"…","citation":"…"}]}`,
    entrees.map((e) => `### ${e.moteur}\n${e.texte}`).join("\n\n"),
  );

  const lignes = (brut as { identites?: AnalyseIdentite[] })?.identites ?? [];
  return lignes
    .filter((l) => l && typeof l.moteur === "string" && typeof l.metier === "string")
    .map((l) => ({ moteur: l.moteur, metier: l.metier.slice(0, 90), citation: l.citation ?? "" }))
    .filter((l) => {
      if (l.metier.toLowerCase().includes("non précisé")) return true;
      const source = entrees.find((e) => e.moteur === l.moteur)?.texte ?? "";
      return citationProuvee(l.citation, source);
    })
    .slice(0, 6);
}

/**
 * Les arguments du rival : ce que les moteurs mettent en avant quand ils le
 * recommandent, chaque argument prouvé par un verbatim réel. C'est la liste
 * de ce que le client devra publier pour exister sur les mêmes terrains.
 */
async function extraireArgumentsRival(
  rival: string,
  verbatims: { moteur: string; texte: string }[],
): Promise<AnalyseArgument[]> {
  if (!verbatims.length) return [];
  const brut = await extraireJson(
    `Tu es un extracteur. Tu n'inventes JAMAIS.
Voici des phrases où des moteurs d'IA recommandent « ${rival} ». Dégage 3 ou 4 ARGUMENTS distincts que ces phrases utilisent en sa faveur (exemples de forme : « sans engagement », « tarifs lisibles », « présent partout en France »).
Pour chacun : "resume" (2 à 6 mots), "citation" (un passage EXACT d'UNE des phrases, 8 à 20 mots recopiés mot pour mot), "moteur" (celui de la phrase citée).
Réponds en JSON strict : {"arguments":[{"resume":"…","citation":"…","moteur":"…"}]}`,
    verbatims.map((v) => `### ${v.moteur}\n${v.texte}`).join("\n\n"),
  );

  const lignes = (brut as { arguments?: AnalyseArgument[] })?.arguments ?? [];
  return lignes
    .filter((l) => l && typeof l.resume === "string" && typeof l.citation === "string")
    .map((l) => ({ resume: l.resume.slice(0, 60), citation: l.citation, moteur: l.moteur ?? "" }))
    .filter((l) => verbatims.some((v) => citationProuvee(l.citation, v.texte)))
    .slice(0, 4);
}

/**
 * Calcule (ou relit) l'analyse complémentaire d'un scan. Idempotente : le
 * résultat est mis en cache dans `scans.analyse_ia`, l'extraction ne tourne
 * qu'une fois par scan. En cas d'échec du modèle, on renvoie null et on
 * réessaiera à la prochaine ouverture : jamais de cache d'échec.
 */
export async function analyseComplementaire(entree: {
  scanId: string;
  marque: string;
  miroir: unknown;
  mentions: LigneMention[];
  reponsesRetenues: number;
  classes: Record<string, string>;
  alias: Record<string, string>;
  cacheExistant: unknown;
}): Promise<AnalyseIa | null> {
  const cache = entree.cacheExistant as AnalyseIa | null;
  if (cache && cache.version === 1) return cache;

  try {
    const rival = adversairePrincipal(
      entree.mentions,
      entree.reponsesRetenues,
      entree.classes,
      entree.alias,
    );
    const verbatimsRival = rival
      ? entree.mentions
          .filter(
            (m) =>
              !m.is_target &&
              (entree.alias[m.brand] ?? m.brand) === rival.nom &&
              m.verbatim &&
              m.verbatim.length > 60,
          )
          .sort((a, b) => Number(b.recommended) - Number(a.recommended))
          .slice(0, 8)
          .map((m) => ({ moteur: m.engine, texte: m.verbatim as string }))
      : [];

    const [identites, argumentsRival] = await Promise.all([
      extraireIdentites(entree.marque, Array.isArray(entree.miroir) ? entree.miroir : []),
      rival ? extraireArgumentsRival(rival.nom, verbatimsRival) : Promise.resolve([]),
    ]);

    const analyse: AnalyseIa = {
      version: 1,
      genere_le: new Date().toISOString(),
      identites,
      rival: rival && argumentsRival.length ? { nom: rival.nom, arguments: argumentsRival } : null,
    };

    await supabaseAdmin.from("scans").update({ analyse_ia: analyse }).eq("id", entree.scanId);
    return analyse;
  } catch {
    // Modèle indisponible : la visio s'affiche sans ces deux écrans, et
    // l'extraction retentera au prochain chargement.
    return null;
  }
}
