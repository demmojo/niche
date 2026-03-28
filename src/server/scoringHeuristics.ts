import { Competitor } from "../types";

// Leeroopedia Scoring Framework
// 1. Per-sample scoring
// 2. Aggregation strategy
// 3. Directionality metadata (higher is better)

export interface ScoringResult {
  trustScore: number;
  competitorScore: number;
  confidenceThreshold: number;
}

const FEATURE_WEIGHTS: Record<string, number> = {
  SSO: 15,
  API: 10,
  Webhooks: 8,
  "Custom Domains": 12,
  "Audit Logs": 20,
};

export const calculateHeuristicScores = (
  competitorData: Partial<Competitor> & { has_free_tier?: boolean },
): ScoringResult => {
  // Pre-allocated Float32Array for deterministic V8 performance
  // [trustScore, competitorScore, featureAccumulator]
  const scratchpad = new Float32Array(3);

  // Baseline scores
  scratchpad[0] = 50;
  scratchpad[1] = 50;

  // 1. Per-sample scoring (Heuristics)
  if (competitorData.has_free_tier || competitorData.freeTier) {
    scratchpad[1] += 10;
  }

  if (
    competitorData.spamProtection &&
    competitorData.spamProtection.toLowerCase() !== "no"
  ) {
    scratchpad[0] += 20;
  } else {
    scratchpad[0] -= 15;
  }

  // Feature scoring
  if (
    competitorData.coreFeatures &&
    Array.isArray(competitorData.coreFeatures)
  ) {
    for (const feature of competitorData.coreFeatures) {
      const weight = FEATURE_WEIGHTS[feature] || 5;
      scratchpad[2] += weight;
    }
  }

  // 2. Aggregation strategy with cmov V8 optimization (Math.min, Math.log1p)
  // Combine base score with feature accumulator using log scaling to prevent unbounded inflation
  scratchpad[1] = scratchpad[1] + Math.log1p(scratchpad[2]) * 5;

  // Directionality metadata constraint
  // Ensure scores remain between 0 and 100
  scratchpad[0] = Math.max(0, Math.min(100, scratchpad[0]));
  scratchpad[1] = Math.max(0, Math.min(100, scratchpad[1]));

  // Confidence Calibration via softmax approximation
  const expTrust = Math.exp(scratchpad[0] / 100);
  const expComp = Math.exp(scratchpad[1] / 100);
  const confidence = expTrust / (expTrust + Math.exp(1 - scratchpad[0] / 100));

  return {
    trustScore: Math.round(scratchpad[0]),
    competitorScore: Math.round(scratchpad[1]),
    confidenceThreshold: confidence,
  };
};
