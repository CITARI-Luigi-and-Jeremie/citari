import type { EngineId, MentionResult, ScanScoreDetail, ScoreComponents, ShareOfVoice } from "../types";

export interface MentionForScoring extends MentionResult {
  engine: EngineId;
}

const SENTIMENT_VALUE = { positive: 1, neutral: 0.5, negative: 0 } as const;

/**
 * Score 0-100 pour UNE marque à partir d'une mention par réponse :
 * taux de mention 50 %, position moyenne 20 %, recommandation explicite 20 %, sentiment 10 %.
 */
export function computeScore(mentions: MentionResult[]): ScoreComponents {
  const total = mentions.length;
  if (total === 0) {
    return { mentionRate: 0, positionScore: 0, recommendationRate: 0, sentimentScore: 0, score: 0, responses: 0, mentionedCount: 0 };
  }
  const mentioned = mentions.filter((m) => m.mentioned);
  const mentionRate = mentioned.length / total;

  const positions = mentioned.filter((m) => m.position != null).map((m) => 1 / (m.position as number));
  const positionScore = positions.length > 0 ? positions.reduce((a, b) => a + b, 0) / positions.length : 0;

  const recommendationRate = mentions.filter((m) => m.is_recommended).length / total;

  const sentiments: number[] = mentioned
    .filter((m) => m.sentiment != null)
    .map((m) => SENTIMENT_VALUE[m.sentiment as keyof typeof SENTIMENT_VALUE]);
  const sentimentScore = sentiments.length > 0 ? sentiments.reduce((a, b) => a + b, 0) / sentiments.length : 0;

  const score = Math.round(100 * (0.5 * mentionRate + 0.2 * positionScore + 0.2 * recommendationRate + 0.1 * sentimentScore));
  return { mentionRate, positionScore, recommendationRate, sentimentScore, score, responses: total, mentionedCount: mentioned.length };
}

/** Détail global + par moteur pour la marque cible. */
export function computeScoreDetail(mentions: MentionForScoring[]): ScanScoreDetail {
  const byEngine: ScanScoreDetail["byEngine"] = {};
  for (const engine of new Set(mentions.map((m) => m.engine))) {
    byEngine[engine] = computeScore(mentions.filter((m) => m.engine === engine));
  }
  return { global: computeScore(mentions), byEngine };
}

/** Part de voix = réponses mentionnant la marque / total des mentions (marque + concurrents). */
export function computeShareOfVoice(brand: string, allMentions: MentionResult[]): ShareOfVoice {
  const counts: Record<string, number> = {};
  for (const m of allMentions) {
    if (!(m.brand in counts)) counts[m.brand] = 0;
    if (m.mentioned) counts[m.brand] = (counts[m.brand] ?? 0) + 1;
  }
  const total = Object.values(counts).reduce((a, b) => a + b, 0);
  const share: Record<string, number> = {};
  for (const [b, c] of Object.entries(counts)) share[b] = total > 0 ? c / total : 0;
  return { brand, counts, share };
}
