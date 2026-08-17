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
/** Un terme du vocabulaire du marché, PROPOSÉ par le modèle et COMPTÉ par le
 *  code : le modèle n'a pas le droit d'avancer un chiffre. */
export type AnalyseTerme = { terme: string; camp: "vous" | "eux" | "neutre" };
/** Ce qu'un moteur dit de la marque quand on lui donne son nom : la phrase
 *  exacte, vérifiée présente dans le texte source. */
export type AnalyseVerdict = {
  moteur: string;
  phrase: string;
  nature: "doute" | "confiance" | "invention";
};
export type AnalyseIa = {
  version: 3;
  genere_le: string;
  identites: AnalyseIdentite[];
  rival: { nom: string; arguments: AnalyseArgument[] } | null;
  lexique: AnalyseTerme[];
  verdicts: AnalyseVerdict[];
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
 * LE VOCABULAIRE DU MARCHÉ. Le modèle PROPOSE les termes qui structurent le
 * débat (il lit les questions et des réponses) ; il n'avance aucun chiffre.
 * Le comptage est fait par le code, sur les réponses, à l'unité RÉPONSE :
 * une réponse qui emploie trois fois le terme compte pour une.
 */
async function extraireLexique(
  metier: string,
  questions: string[],
  echantillon: string[],
): Promise<AnalyseTerme[]> {
  if (!questions.length) return [];
  const brut = await extraireJson(
    `Tu es un lexicographe. Tu ne comptes RIEN, tu ne juges RIEN : tu relèves des expressions.
Voici les questions posées à des IA sur le marché de « ${metier} », puis des extraits de leurs réponses.
Relève 5 à 8 EXPRESSIONS (2 à 4 mots) qui structurent le choix sur ce marché : les catégories d'offre qui s'opposent, les termes que le client emploierait pour décrire ce qu'il achète. Recopie-les telles qu'elles apparaissent, au singulier, sans article.
Pour chacune, "camp" : "vous" si l'expression désigne la catégorie d'offre moderne/flexible, "eux" si elle désigne l'alternative traditionnelle ou une catégorie voisine, "neutre" sinon.
Réponds en JSON strict : {"termes":[{"terme":"…","camp":"vous|eux|neutre"}]}`,
    `### questions\n${questions.join("\n")}\n\n### extraits de réponses\n${echantillon.join("\n\n").slice(0, 6000)}`,
  );
  const lignes = (brut as { termes?: AnalyseTerme[] })?.termes ?? [];
  return lignes
    .filter((l) => l && typeof l.terme === "string" && l.terme.trim().length >= 4)
    .map((l) => ({
      terme: l.terme.trim().slice(0, 40),
      camp: (["vous", "eux", "neutre"] as const).includes(l.camp) ? l.camp : "neutre",
    }))
    .slice(0, 8);
}

/**
 * LES VERDICTS DU MIROIR. Quand on donne le nom de la marque à un moteur, la
 * phrase où il tranche : doute, confiance, ou fait inventé (un prix, une
 * adresse). Chaque phrase est vérifiée présente dans le texte source.
 */
async function extraireVerdicts(
  marque: string,
  miroir: { moteur?: string; texte?: string }[],
): Promise<AnalyseVerdict[]> {
  const entrees = miroir
    .filter((m): m is { moteur: string; texte: string } =>
      Boolean(m?.moteur && typeof m?.texte === "string" && m.texte.length > 60),
    )
    .map((m) => ({ moteur: m.moteur, texte: m.texte.slice(0, 1800) }));
  if (!entrees.length) return [];

  const brut = await extraireJson(
    `Tu es un extracteur. Tu n'inventes JAMAIS, tu recopies.
Pour chaque moteur, lis ce qu'il répond au sujet de « ${marque} » et relève UNE phrase, recopiée MOT POUR MOT (8 à 30 mots), celle qui tranche le plus :
- "doute" : il se méfie, ne trouve rien, refuse de recommander ;
- "confiance" : il recommande ou confirme l'entreprise ;
- "invention" : il avance un fait chiffré précis (un prix, une adresse, un effectif, un nombre de sites) sans citer d'où il le tient.
Si un moteur avance un fait chiffré précis non sourcé, choisis "invention" en priorité, même s'il recommande par ailleurs.
Une seule phrase par moteur, celle qui compte. Si le moteur ne tranche pas, ne mets pas de ligne pour lui.
Réponds en JSON strict : {"verdicts":[{"moteur":"…","phrase":"…","nature":"doute|confiance|invention"}]}`,
    entrees.map((e) => `### ${e.moteur}\n${e.texte}`).join("\n\n"),
  );

  const lignes = (brut as { verdicts?: AnalyseVerdict[] })?.verdicts ?? [];
  return lignes
    .filter((l) => l && typeof l.moteur === "string" && typeof l.phrase === "string")
    .filter((l) => (["doute", "confiance", "invention"] as const).includes(l.nature))
    .filter((l) => {
      const source = entrees.find((e) => e.moteur === l.moteur)?.texte ?? "";
      return citationProuvee(l.phrase, source);
    })
    .slice(0, 6);
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
  /** Le métier déduit, pour situer le lexique. */
  metier: string;
  /** Les questions posées, texte brut. */
  questions: string[];
  /** Quelques réponses réelles, pour que le lexique vienne du terrain. */
  echantillon: string[];
}): Promise<AnalyseIa | null> {
  const cache = entree.cacheExistant as AnalyseIa | null;
  if (cache && cache.version === 3) return cache;

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

    const miroir = Array.isArray(entree.miroir) ? entree.miroir : [];
    const [identites, argumentsRival, lexique, verdicts] = await Promise.all([
      extraireIdentites(entree.marque, miroir),
      rival ? extraireArgumentsRival(rival.nom, verbatimsRival) : Promise.resolve([]),
      extraireLexique(entree.metier, entree.questions, entree.echantillon),
      extraireVerdicts(entree.marque, miroir),
    ]);

    const analyse: AnalyseIa = {
      version: 3,
      genere_le: new Date().toISOString(),
      identites,
      rival: rival && argumentsRival.length ? { nom: rival.nom, arguments: argumentsRival } : null,
      lexique,
      verdicts,
    };

    await supabaseAdmin.from("scans").update({ analyse_ia: analyse }).eq("id", entree.scanId);
    return analyse;
  } catch {
    // Modèle indisponible : la visio s'affiche sans ces deux écrans, et
    // l'extraction retentera au prochain chargement.
    return null;
  }
}
