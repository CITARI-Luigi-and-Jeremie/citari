// Moteurs de recherche générative — appels via API officielles uniquement.
// Aucun scraping des interfaces grand public.
import type { Moteur } from "@/lib/typo";

export type ReponseMoteur = {
  text: string;
  sources: { title?: string; url: string }[];
  latency: number;
  cost: number;
  error?: string;
};

const GATEWAY = "https://ai.gateway.lovable.dev/v1/chat/completions";

async function gateway(model: string, messages: unknown, key: string) {
  const res = await fetch(GATEWAY, {
    method: "POST",
    headers: { "Content-Type": "application/json", "Lovable-API-Key": key },
    body: JSON.stringify({ model, messages }),
  });
  if (!res.ok) throw new Error(`[${res.status}] ${await res.text()}`);
  return (await res.json()) as { choices: { message: { content: string } }[] };
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

/** ChatGPT — API OpenAI (via la passerelle IA). */
async function chatgpt(q: string, langue: string): Promise<ReponseMoteur> {
  const t = Date.now();
  const key = process.env.LOVABLE_API_KEY;
  if (!key) return manquant("LOVABLE_API_KEY absente");
  const json = await gateway("openai/gpt-5.6-terra", prompt(q, langue), key);
  return { text: json.choices[0]?.message?.content ?? "", sources: [], latency: Date.now() - t, cost: 0.004 };
}

/** Gemini — API Google (via la passerelle IA). */
async function gemini(q: string, langue: string): Promise<ReponseMoteur> {
  const t = Date.now();
  const key = process.env.LOVABLE_API_KEY;
  if (!key) return manquant("LOVABLE_API_KEY absente");
  const json = await gateway("google/gemini-3.6-flash", prompt(q, langue), key);
  return { text: json.choices[0]?.message?.content ?? "", sources: [], latency: Date.now() - t, cost: 0.002 };
}

/** Claude — API Anthropic officielle. */
async function claude(q: string, langue: string): Promise<ReponseMoteur> {
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
      max_tokens: 700,
      system: prompt(q, langue)[0]!.content,
      messages: [{ role: "user", content: q }],
    }),
  });
  if (!res.ok) return manquant(`Anthropic [${res.status}]`);
  const json = (await res.json()) as { content: { text?: string }[] };
  return {
    text: json.content.map((c) => c.text ?? "").join("\n"),
    sources: [],
    latency: Date.now() - t,
    cost: 0.006,
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

function manquant(error: string): ReponseMoteur {
  return { text: "", sources: [], latency: 0, cost: 0, error };
}

export async function interroger(moteur: Moteur, question: string, langue: string): Promise<ReponseMoteur> {
  try {
    if (moteur === "ChatGPT") return await chatgpt(question, langue);
    if (moteur === "Claude") return await claude(question, langue);
    if (moteur === "Gemini") return await gemini(question, langue);
    return await perplexity(question, langue);
  } catch (e) {
    return manquant(e instanceof Error ? e.message : "Erreur inconnue");
  }
}

/** Analyse d'une réponse : marques citées, ordre, recommandation, sentiment. */
export type Analyse = {
  brands: { name: string; position: number; recommended: boolean; sentiment: string; verbatim: string }[];
};

export async function analyser(texte: string, marque: string): Promise<Analyse> {
  const key = process.env.LOVABLE_API_KEY;
  if (!key || !texte.trim()) return { brands: [] };
  try {
    const json = await gateway("google/gemini-3.1-flash-lite", [
      {
        role: "system",
        content:
          "Tu extrais des données d'une réponse d'IA. Renvoie UNIQUEMENT du JSON valide, sans commentaire ni bloc de code, de la forme " +
          '{"brands":[{"name":"","position":1,"recommended":false,"sentiment":"positif|neutre|negatif","verbatim":""}]}. ' +
          "position = ordre d'apparition (1 = première marque citée). verbatim = la phrase exacte où la marque apparaît. " +
          "N'inclus que des noms d'entreprises ou de prestataires, jamais des villes ni des catégories.",
      },
      { role: "user", content: `Marque suivie : « ${marque} ».\n\nRéponse à analyser :\n${texte.slice(0, 4000)}` },
    ], key);
    const raw = json.choices[0]?.message?.content ?? "{}";
    const match = raw.match(/\{[\s\S]*\}/);
    const parsed = JSON.parse(match ? match[0] : "{}") as Analyse;
    return { brands: Array.isArray(parsed.brands) ? parsed.brands.slice(0, 12) : [] };
  } catch {
    return { brands: [] };
  }
}

/** Génération de l'échantillon : 24 questions d'intention d'achat, figées ensuite. */
export async function genererQuestions(input: {
  marque: string;
  secteur: string;
  ville?: string | null;
  langue: string;
}): Promise<{ text: string; intent: string }[]> {
  const key = process.env.LOVABLE_API_KEY;
  if (!key) throw new Error("LOVABLE_API_KEY absente");
  const json = await gateway("google/gemini-3.6-flash", [
    {
      role: "system",
      content:
        "Tu génères un échantillon de questions réellement posées à une IA par un décideur en phase d'achat. " +
        'Renvoie UNIQUEMENT du JSON : {"queries":[{"text":"","intent":"comparative|probleme|locale|confiance"}]}. ' +
        "Exactement 24 questions : 10 comparatives, 6 problème, 5 locales, 3 confiance. " +
        "Jamais le nom de la marque suivie dans la question : on mesure si l'IA la cite spontanément.",
    },
    {
      role: "user",
      content: `Secteur : ${input.secteur}. Zone : ${input.ville ?? "France"}. Langue des questions : ${input.langue}.`,
    },
  ], key);
  const raw = json.choices[0]?.message?.content ?? "";
  const match = raw.match(/\{[\s\S]*\}/);
  const parsed = JSON.parse(match ? match[0] : '{"queries":[]}') as {
    queries: { text: string; intent: string }[];
  };
  return parsed.queries.filter((q) => q?.text).slice(0, 24);
}
