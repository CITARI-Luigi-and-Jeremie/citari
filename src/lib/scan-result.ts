/**
 * Lecture et dérivation du résultat de scan.
 * Aucune donnée n'est fabriquée ici : tout provient de l'objet scan.
 */

export type EngineKey =
  | "openai"
  | "anthropic"
  | "gemini"
  | "perplexity"
  | "grok"
  | "mistral";

export const ENGINES: { key: EngineKey; label: string }[] = [
  { key: "openai", label: "ChatGPT" },
  { key: "anthropic", label: "Claude" },
  { key: "gemini", label: "Gemini" },
  { key: "perplexity", label: "Perplexity" },
  { key: "grok", label: "Grok" },
  { key: "mistral", label: "Le Chat" },
];

export const ENGINE_LABEL: Record<string, string> = Object.fromEntries(
  ENGINES.map((e) => [e.key, e.label]),
);

export type EngineDetail = { mentionedCount?: number; responses?: number };

export type ScanRecord = {
  id: string;
  brand: string;
  domain: string;
  status: string;
  score: number | null;
  score_detail: {
    global?: {
      mentionRate?: number;
      positionScore?: number;
      recommendationRate?: number;
      sentimentScore?: number;
      mentionedCount?: number;
      responses?: number;
    };
    byEngine?: Partial<Record<EngineKey, EngineDetail>>;
  } | null;
  share_of_voice: { share?: Record<string, number> } | null;
  responses: ScanResponse[];
};

export type ScanResponse = {
  engine?: string;
  text?: string;
  asked_at?: string;
  mentions?: { brand?: string; is_recommended?: boolean }[];
};

export type Verbatim = {
  engine: string;
  engineLabel: string;
  text: string;
  askedAt: string | null;
  competitors: string[];
};

export function verdictLabel(score: number) {
  if (score <= 20) return "Quasi invisible";
  if (score <= 45) return "Distancé";
  if (score <= 70) return "Présent mais dépassé";
  return "En tête";
}

export function isLeading(score: number) {
  return score >= 71;
}

export function pct(value: number | undefined | null) {
  if (typeof value !== "number" || Number.isNaN(value)) return "—";
  return `${Math.round(value * 100)} %`;
}

export function formatDate(iso: string | null) {
  if (!iso) return null;
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleDateString("fr-FR");
}

/**
 * Un verbatim compromettant = une réponse où un concurrent est explicitement
 * recommandé alors que la marque cible n'est pas mentionnée dans la même réponse.
 */
export function selectVerbatims(scan: ScanRecord, max = 5): Verbatim[] {
  const brand = scan.brand.trim().toLowerCase();
  const rows = Array.isArray(scan.responses) ? scan.responses : [];

  return rows
    .filter((response) => {
      if (!response?.text) return false;
      const mentions = response.mentions ?? [];
      const brandMentioned = mentions.some(
        (m) => (m.brand ?? "").trim().toLowerCase() === brand,
      );
      if (brandMentioned) return false;
      return mentions.some(
        (m) => m.is_recommended === true && (m.brand ?? "").trim().toLowerCase() !== brand,
      );
    })
    .slice(0, max)
    .map((response) => ({
      engine: response.engine ?? "",
      engineLabel: ENGINE_LABEL[response.engine ?? ""] ?? (response.engine ?? ""),
      text: response.text as string,
      askedAt: response.asked_at ?? null,
      competitors: (response.mentions ?? [])
        .filter((m) => m.is_recommended === true && m.brand)
        .map((m) => m.brand as string),
    }));
}

export function shareRows(scan: ScanRecord) {
  const share = scan.share_of_voice?.share ?? {};
  return Object.entries(share)
    .filter(([, value]) => typeof value === "number")
    .sort((a, b) => b[1] - a[1])
    .map(([label, value]) => ({
      label,
      value,
      isBrand: label.trim().toLowerCase() === scan.brand.trim().toLowerCase(),
    }));
}
