// Moteurs de recherche générative — appels via API officielles uniquement.
// Aucun scraping des interfaces grand public.
import type { Moteur } from "@/lib/typo";

// Vite ne peuple que import.meta.env ; le code serveur lit process.env. Sans
// ce chargement, aucune clé ne serait visible en développement local. En
// production les variables viennent de l'hébergeur, et l'appel échoue sans
// conséquence.
if (typeof process !== "undefined" && !process.env.OPENAI_API_KEY) {
  try {
    process.loadEnvFile(new URL("../../.env.local", import.meta.url).pathname);
  } catch {
    /* pas de .env.local : variables déjà fournies par l'hébergeur */
  }
}

export type ReponseMoteur = {
  text: string;
  sources: { title?: string; url: string }[];
  latency: number;
  cost: number;
  error?: string;
};

/**
 * Appels directs aux éditeurs, plus aucune passerelle.
 *
 * La passerelle Lovable ne servait qu'OpenAI et Google, ne permettait pas
 * d'activer la recherche web, et consommait les crédits qui servent à faire
 * évoluer le site. Un produit commercial ne doit pas dépendre de l'abonnement
 * à son outil de conception.
 */

/** Petit utilitaire Google Gemini, aussi utilisé pour l'analyse et les actions. */
async function gemini_(model: string, systeme: string, user: string, opts: { recherche?: boolean; maxTokens?: number } = {}) {
  const key = process.env.GOOGLE_AI_API_KEY;
  if (!key) throw new Error("GOOGLE_AI_API_KEY absente");
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`,
    {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: systeme }] },
        contents: [{ role: "user", parts: [{ text: user }] }],
        // 4096 par défaut, et ce n'est pas du confort : les modèles Gemini
        // récents consomment une partie du budget en « réflexion » AVANT
        // d'écrire. À 1024, la réponse était coupée à 150 caractères avec
        // finishReason=MAX_TOKENS et zéro source. À 4096 : 1150 caractères
        // et 5 sources.
        generationConfig: { maxOutputTokens: opts.maxTokens ?? 4096 },
        ...(opts.recherche ? { tools: [{ google_search: {} }] } : {}),
      }),
    },
  );
  if (!res.ok) throw new Error(`Google [${res.status}] ${(await res.text()).slice(0, 200)}`);
  const json = (await res.json()) as {
    candidates?: {
      content?: { parts?: { text?: string }[] };
      groundingMetadata?: { groundingChunks?: { web?: { uri?: string } }[] };
    }[];
  };
  const c = json.candidates?.[0];
  const text = (c?.content?.parts ?? []).map((p) => p.text ?? "").join("");
  const sources = (c?.groundingMetadata?.groundingChunks ?? [])
    .map((g) => g.web?.uri)
    .filter((u): u is string => Boolean(u))
    .map((url) => ({ url }));
  return { text, sources };
}

function prompt(question: string, langue: string) {
  const l = langue === "it" ? "italien" : langue === "en" ? "anglais" : "français";
  return [
    {
      role: "system",
      content: `Tu réponds comme un assistant grand public interrogé par un dirigeant d'entreprise. Réponds en ${l}, de façon concrète, en citant nommément les entreprises ou prestataires que tu recommanderais réellement. 120 à 200 mots.`,
    },
    { role: "user", content: question },
  ];
}

/** ChatGPT — API OpenAI officielle. `recherche` active l'outil web_search. */
async function chatgpt(q: string, langue: string, recherche: boolean): Promise<ReponseMoteur> {
  const t = Date.now();
  const key = process.env.OPENAI_API_KEY;
  if (!key) return manquant("Clé API OpenAI non configurée");
  const res = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: { "content-type": "application/json", authorization: `Bearer ${key}` },
    body: JSON.stringify({
      model: process.env.OPENAI_MODEL || "gpt-5.6-terra",
      instructions: prompt(q, langue)[0]!.content,
      input: q,
      max_output_tokens: 1024,
      ...(recherche ? { tools: [{ type: "web_search" }] } : {}),
    }),
  });
  if (!res.ok) return manquant(`OpenAI [${res.status}] ${(await res.text()).slice(0, 150)}`);
  const json = (await res.json()) as {
    output?: {
      type?: string;
      content?: { type?: string; text?: string; annotations?: { url?: string }[] }[];
    }[];
  };
  let text = "";
  const sources: { url: string }[] = [];
  for (const bloc of json.output ?? []) {
    for (const c of bloc.content ?? []) {
      if (c.text) text += c.text;
      for (const a of c.annotations ?? []) {
        if (a.url && !sources.some((s) => s.url === a.url)) sources.push({ url: a.url });
      }
    }
  }
  return { text, sources, latency: Date.now() - t, cost: recherche ? 0.012 : 0.005 };
}

/** Gemini — API Google officielle. `recherche` active le grounding web. */
async function gemini(q: string, langue: string, recherche: boolean): Promise<ReponseMoteur> {
  const t = Date.now();
  if (!process.env.GOOGLE_AI_API_KEY) return manquant("Clé API Google non configurée");
  try {
    const model = process.env.GEMINI_MODEL || "gemini-3.6-flash";
    const { text, sources } = await gemini_(model, prompt(q, langue)[0]!.content, q, { recherche });
    return { text, sources, latency: Date.now() - t, cost: recherche ? 0.006 : 0.002 };
  } catch (e) {
    return manquant(e instanceof Error ? e.message : "Erreur Google");
  }
}

/** Claude — API Anthropic officielle. `recherche` active l'outil web_search. */
async function claude(q: string, langue: string, recherche: boolean): Promise<ReponseMoteur> {
  const t = Date.now();
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) return manquant("Clé API Anthropic non configurée");
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": key,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-5",
      max_tokens: 1024,
      system: prompt(q, langue)[0]!.content,
      messages: [{ role: "user", content: q }],
      ...(recherche
        ? { tools: [{ type: "web_search_20250305", name: "web_search", max_uses: 3 }] }
        : {}),
    }),
  });
  if (!res.ok) return manquant(`Anthropic [${res.status}]`);
  const json = (await res.json()) as {
    content: { type?: string; text?: string; citations?: { url?: string }[] }[];
  };
  const sources: { url: string }[] = [];
  for (const bloc of json.content) {
    for (const c of bloc.citations ?? []) {
      if (c.url && !sources.some((x) => x.url === c.url)) sources.push({ url: c.url });
    }
  }
  return {
    text: json.content.map((c) => c.text ?? "").join("\n"),
    sources,
    latency: Date.now() - t,
    cost: recherche ? 0.012 : 0.006,
  };
}

/** Perplexity — API officielle, renvoie ses sources. */
async function perplexity(q: string, langue: string): Promise<ReponseMoteur> {
  const t = Date.now();
  const key = process.env.PERPLEXITY_API_KEY;
  if (!key) return manquant("Clé API Perplexity non configurée");
  const res = await fetch("https://api.perplexity.ai/chat/completions", {
    method: "POST",
    headers: { "content-type": "application/json", authorization: `Bearer ${key}` },
    body: JSON.stringify({ model: "sonar", messages: prompt(q, langue) }),
  });
  if (!res.ok) return manquant(`Perplexity [${res.status}]`);
  const json = (await res.json()) as {
    choices: { message: { content: string } }[];
    citations?: string[];
  };
  return {
    text: json.choices[0]?.message?.content ?? "",
    sources: (json.citations ?? []).map((url) => ({ url })),
    latency: Date.now() - t,
    cost: 0.005,
  };
}

/**
 * Grok — API xAI officielle (format OpenAI).
 *
 * Sans recherche web : xAI a supprimé `live_search` (HTTP 410) au profit d'une
 * « Agent Tools API » au format différent. Grok répond donc de mémoire, comme
 * Le Chat. À rebrancher si l'on veut ses sources : docs.x.ai/docs/guides/tools
 */
async function grok(q: string, langue: string): Promise<ReponseMoteur> {
  const t = Date.now();
  const key = process.env.XAI_API_KEY;
  if (!key) return manquant("Clé API xAI non configurée");
  const res = await fetch("https://api.x.ai/v1/chat/completions", {
    method: "POST",
    headers: { "content-type": "application/json", authorization: `Bearer ${key}` },
    body: JSON.stringify({ model: process.env.XAI_MODEL || "grok-4", messages: prompt(q, langue) }),
  });
  if (!res.ok) return manquant(`xAI [${res.status}]`);
  const json = (await res.json()) as {
    choices: { message: { content: string } }[];
    citations?: string[];
  };
  return {
    text: json.choices[0]?.message?.content ?? "",
    sources: (json.citations ?? []).map((url) => ({ url })),
    latency: Date.now() - t,
    cost: 0.005,
  };
}

/** Le Chat — API Mistral officielle (format OpenAI). */
async function lechat(q: string, langue: string): Promise<ReponseMoteur> {
  const t = Date.now();
  const key = process.env.MISTRAL_API_KEY;
  if (!key) return manquant("Clé API Mistral non configurée");
  const res = await fetch("https://api.mistral.ai/v1/chat/completions", {
    method: "POST",
    headers: { "content-type": "application/json", authorization: `Bearer ${key}` },
    body: JSON.stringify({ model: "mistral-large-latest", messages: prompt(q, langue) }),
  });
  if (!res.ok) return manquant(`Mistral [${res.status}]`);
  const json = (await res.json()) as { choices: { message: { content: string } }[] };
  return {
    text: json.choices[0]?.message?.content ?? "",
    sources: [],
    latency: Date.now() - t,
    cost: 0.004,
  };
}

function manquant(error: string): ReponseMoteur {
  return { text: "", sources: [], latency: 0, cost: 0, error };
}

export async function interroger(
  moteur: Moteur,
  question: string,
  langue: string,
  opts: { recherche?: boolean } = {},
): Promise<ReponseMoteur> {
  const recherche = opts.recherche ?? false;
  try {
    if (moteur === "ChatGPT") return await chatgpt(question, langue, recherche);
    if (moteur === "Claude") return await claude(question, langue, recherche);
    if (moteur === "Gemini") return await gemini(question, langue, recherche);
    if (moteur === "Grok") return await grok(question, langue);
    if (moteur === "Le Chat") return await lechat(question, langue);
    return await perplexity(question, langue);
  } catch (e) {
    return manquant(e instanceof Error ? e.message : "Erreur inconnue");
  }
}

/**
 * Question miroir — volontairement HORS méthodologie de score.
 *
 * Pour le score, on ne prononce jamais le nom de la marque. Ici on fait
 * l'inverse, une seule fois, pour montrer au prospect ce que l'IA raconte
 * quand on la force : infos périmées, confusion avec un homonyme,
 * hallucinations. C'est un artefact de démonstration, jamais un critère.
 */
export async function questionMiroir(
  marque: string,
  secteur: string,
  ville: string | null,
  moteur: Moteur,
): Promise<{ moteur: Moteur; texte: string; erreur?: string }> {
  const q = `Que peux-tu me dire de « ${marque} » (${secteur}${ville ? `, ${ville}` : ""}) ? Est-ce une entreprise que tu recommanderais ?`;
  const rep = await interroger(moteur, q, "fr");
  return { moteur, texte: rep.text, ...(rep.error ? { erreur: rep.error } : {}) };
}

/** Analyse d'une réponse : marques citées, ordre, recommandation, sentiment. */
export type Analyse = {
  brands: { name: string; position: number; recommended: boolean; sentiment: string; verbatim: string }[];
};

export async function analyser(texte: string, marque: string): Promise<Analyse> {
  if (!process.env.GOOGLE_AI_API_KEY || !texte.trim()) return { brands: [] };
  try {
    const { text: raw } = await gemini_(
      process.env.GEMINI_ANALYSE_MODEL || "gemini-3.1-flash-lite",
      "Tu extrais des données d'une réponse d'IA. Renvoie UNIQUEMENT du JSON valide, sans commentaire ni bloc de code, de la forme " +
        '{"brands":[{"name":"","position":1,"recommended":false,"sentiment":"positif|neutre|negatif","verbatim":""}]}. ' +
        "position = ordre d'apparition (1 = première marque citée). verbatim = la phrase exacte où la marque apparaît. " +
        "N'inclus que des noms d'entreprises ou de prestataires, jamais des villes ni des catégories.",
      `Marque suivie : « ${marque} ».\n\nRéponse à analyser :\n${texte.slice(0, 4000)}`,
      { maxTokens: 2048 },
    );
    const match = raw.match(/\{[\s\S]*\}/);
    const parsed = JSON.parse(match ? match[0] : "{}") as Analyse;
    return { brands: Array.isArray(parsed.brands) ? parsed.brands.slice(0, 12) : [] };
  } catch {
    return { brands: [] };
  }
}

/**
 * Classe les concurrents relevés selon qu'ils sont atteignables ou non.
 *
 * Une PME lyonnaise de quinze personnes ne prendra jamais la place de Deloitte.
 * Annoncer « vos concurrents sont cités 707 fois » sans distinguer est exact et
 * inutile : le chiffre écrase, il n'indique aucune action. Séparer rend le
 * rapport actionnable, et surtout permet à la priorisation des contenus de voir
 * qu'une question occupée par les seuls grands groupes est PLUS gagnable
 * localement qu'une question disputée par cinq cabinets de la même taille.
 *
 * Le classement est **relatif au client**, jamais absolu : Pennylane est un
 * rival direct pour un cabinet en ligne et un simple outil pour un cabinet
 * traditionnel. D'où le contexte passé au modèle.
 *
 * ⚠ Ceci ne touche PAS au score. La formule est publiée et le J+90 n'a de sens
 * que si elle ne bouge jamais. On change ce qu'on montre et ce qu'on priorise.
 */
export type ClasseConcurrent = "rival" | "geant" | "outil";

export async function classerConcurrents(
  contexte: { marque: string; secteur: string; ville?: string | null },
  noms: string[],
): Promise<Record<string, ClasseConcurrent>> {
  // Sans clé ou sans concurrent, tout reste « rival » : c'est le classement le
  // plus prudent, celui qui ne retire rien au client.
  if (!process.env.GOOGLE_AI_API_KEY || noms.length === 0) return {};
  try {
    const { text: raw } = await gemini_(
      process.env.GEMINI_ANALYSE_MODEL || "gemini-3.1-flash-lite",
      "Tu classes des entreprises citées par une IA, du point de vue d'une entreprise précise. " +
        'Renvoie UNIQUEMENT du JSON valide de la forme {"classes":[{"nom":"","classe":"rival|geant|outil"}]}. ' +
        "rival = concurrent de taille et de nature comparables, que l'entreprise suivie peut réellement " +
        "dépasser dans les réponses d'IA. " +
        "geant = groupe national ou international, réseau majeur, acteur dont la notoriété est hors " +
        "de portée d'une PME. " +
        "outil = logiciel, plateforme, place de marché, annuaire : occupe la réponse mais n'est pas un " +
        "prestataire de même nature. " +
        "En cas de doute, réponds rival : mieux vaut sur-estimer un concurrent que rassurer à tort.",
      `Entreprise suivie : « ${contexte.marque} », secteur « ${contexte.secteur} »${
        contexte.ville ? `, à ${contexte.ville}` : ""
      }.\n\nEntreprises à classer :\n${noms.slice(0, 60).join("\n")}`,
      { maxTokens: 2048 },
    );
    const match = raw.match(/\{[\s\S]*\}/);
    const parsed = JSON.parse(match ? match[0] : "{}") as {
      classes?: { nom: string; classe: string }[];
    };
    const out: Record<string, ClasseConcurrent> = {};
    for (const c of parsed.classes ?? []) {
      if (!c?.nom) continue;
      out[c.nom] = c.classe === "geant" || c.classe === "outil" ? c.classe : "rival";
    }
    return out;
  } catch {
    // Un classement raté ne doit jamais faire échouer un scan : sans lui, tout
    // reste « rival » et le rapport ressemble à ce qu'il était avant.
    return {};
  }
}

/** Génération de l'échantillon : 24 questions d'intention d'achat, figées ensuite. */
export async function genererQuestions(input: {
  marque: string;
  secteur: string;
  ville?: string | null;
  langue: string;
  nombre?: 20 | 24;
}): Promise<{ text: string; intent: string }[]> {
  if (!process.env.GOOGLE_AI_API_KEY) throw new Error("GOOGLE_AI_API_KEY absente");
  const nombre = input.nombre ?? 24;
  const mix =
    nombre === 20
      ? "Exactement 20 questions : 8 comparatives, 5 problème, 4 locales, 3 confiance."
      : "Exactement 24 questions : 10 comparatives, 6 problème, 5 locales, 3 confiance.";
  const { text: raw } = await gemini_(
    process.env.GEMINI_MODEL || "gemini-3.6-flash",
    "Tu génères un échantillon de questions réellement posées à une IA par un décideur en phase d'achat. " +
      'Renvoie UNIQUEMENT du JSON : {"queries":[{"text":"","intent":"comparative|probleme|locale|confiance"}]}. ' +
      mix +
      " Jamais le nom de la marque suivie dans la question : on mesure si l'IA la cite spontanément.",
    `Secteur : ${input.secteur}. Zone : ${input.ville ?? "France"}. Langue des questions : ${input.langue}.`,
    { maxTokens: 4096 },
  );
  const match = raw.match(/\{[\s\S]*\}/);
  const parsed = JSON.parse(match ? match[0] : '{"queries":[]}') as {
    queries: { text: string; intent: string }[];
  };
  return parsed.queries.filter((q) => q?.text).slice(0, nombre);
}

/** Les 10 actions prioritaires du rapport. Clé Google directe. */
export async function genererActionsIA(
  marque: string,
  secteur: string,
  score: number,
  pdv: { name: string; share: number }[],
): Promise<{ chantier: string; titre: string; pourquoi: string; effort: string }[]> {
  const { text: raw } = await gemini_(
    process.env.GEMINI_MODEL || "gemini-3.6-flash",
    'Renvoie UNIQUEMENT du JSON : {"actions":[{"chantier":"Contenu|Citations|Technique","titre":"","pourquoi":"","effort":"faible|moyen|fort"}]}. Exactement 10 actions, classées de la plus prioritaire à la moins prioritaire, concrètes et exécutables en 30 jours.',
    `Marque : ${marque}. Secteur : ${secteur}. Score de visibilité IA : ${score}/100. Concurrents dominants : ${pdv.slice(0, 4).map((p) => p.name).join(", ")}.`,
    { maxTokens: 4096 },
  );
  const m = raw.match(/\{[\s\S]*\}/);
  return (JSON.parse(m ? m[0] : '{"actions":[]}') as { actions: any[] }).actions ?? [];
}
