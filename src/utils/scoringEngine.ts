import { z } from "zod";

export const LLMExtractionSchema = z.object({
  jtbd: z.object({
    job_statement: z
      .string()
      .describe("The core functional job the user is trying to get done."),
    importance: z
      .number()
      .min(1)
      .max(10)
      .describe("How important the job is to the customer (1-10)"),
    satisfaction: z
      .number()
      .min(1)
      .max(10)
      .describe("How satisfied the customer is with current solutions (1-10)"),
  }),
  market_gaps: z.array(
    z.object({
      feature: z.string(),
      competitor_deficit: z.string(),
    }),
  ),
  _reasoning: z.string().optional(),
  exact_quote: z.string().optional(),
  exa_url: z.string().optional(),
  suggestedNiches: z.array(z.string()).optional(),
  wedge_metric: z
    .number()
    .min(0)
    .max(1)
    .optional()
    .describe("0 to 1, where 1 is highly saturated, 0 is highly unique"),
});

export const MarketRadarSchema = z.object({
  market_velocity: z
    .enum(["hyper_growth", "stable", "declining", "nascent"])
    .describe("The current momentum of this market"),
  dominant_players: z
    .array(z.string())
    .max(3)
    .describe("The 1-3 established incumbents"),
  emerging_threats: z
    .array(z.string())
    .max(3)
    .describe("The 1-3 fastest growing new entrants"),
  key_feature_table_stakes: z
    .array(z.string())
    .max(5)
    .describe("Features that every competitor must have"),
  differentiation_vectors: z
    .array(z.string())
    .max(3)
    .describe(
      "The main axes competitors are using to stand out (e.g., 'Developer Experience', 'Enterprise Security')",
    ),
  _reasoning: z.string().optional(),
  exact_quote: z.string().optional(),
  exa_url: z.string().optional(),
});

export function calculateOpportunityScore(
  importance: number,
  satisfaction: number,
): number {
  return importance + Math.max(importance - satisfaction, 0);
}

/**
 * Hybrid Scoring Engine
 * Calculates a mathematically sound Niche Viability / Tarpit Score.
 */

export interface TarpitScoreInput {
  vectorUniqueness: number;
  apolloCount: number | null | undefined;
  opportunityScore?: number;
}

export interface TarpitScoreResult {
  status: "success" | "partial_data" | "error";
  score: number;
  isTarpit: boolean;
  error?: string;
  message?: string;
  saturationFactor?: number;
  uniqueness?: number;
}

export const TAXONOMY_THRESHOLDS: Record<
  string,
  { objective: number; subjective: number; orthogonalBypass: number }
> = {
  "gemini-embedding-001": {
    objective: 0.85,
    subjective: 0.6,
    orthogonalBypass: 0.65,
  },
  "text-embedding-3-small": {
    objective: 0.82,
    subjective: 0.58,
    orthogonalBypass: 0.65,
  },
  default: { objective: 0.85, subjective: 0.6, orthogonalBypass: 0.65 },
};

export function getTaxonomyThresholds(modelName: string) {
  return TAXONOMY_THRESHOLDS[modelName] || TAXONOMY_THRESHOLDS["default"];
}

export function calculateTarpitScore(
  input: TarpitScoreInput,
): TarpitScoreResult {
  if (input.apolloCount === null || input.apolloCount === undefined) {
    return {
      status: "partial_data",
      score: 0,
      isTarpit: false,
      error: "Apollo API unavailable",
    };
  }

  // 0. Input Validation & Clamping (Security & Math Bounds)
  const clampedUniqueness = Math.max(0, Math.min(1, input.vectorUniqueness));
  const safeCount = Math.max(0, input.apolloCount);

  // 1. Lack of Differentiation (1.0 = exact clone, 0.0 = highly unique)
  const cloneFactor = 1.0 - clampedUniqueness;

  // 2. Saturation Penalty (Logarithmic decay up to a ceiling of 500 competitors)
  const MAX_COMPETITORS = 500;
  const saturationFactor =
    Math.log(safeCount + 1) / Math.log(MAX_COMPETITORS + 1);
  const cappedSaturation = Math.min(saturationFactor, 1.0);

  // 3. Apply Weights
  let tarpitScore = (cloneFactor * 0.6 + cappedSaturation * 0.4) * 100;

  // 4. Adjust based on JTBD Opportunity Score
  if (input.opportunityScore !== undefined) {
    const oppFactor = (input.opportunityScore - 10) / 10;
    tarpitScore -= oppFactor * 20;
    tarpitScore = Math.max(0, Math.min(100, tarpitScore));
  }

  return {
    status: "success",
    score: tarpitScore,
    isTarpit: tarpitScore >= 80,
    saturationFactor: cappedSaturation,
    uniqueness: clampedUniqueness,
  };
}

export function fastL2NormalizeInPlace(vec: Float32Array): void {
  let magSq = 0;
  for (let i = 0; i < vec.length; i++) {
    magSq += vec[i] * vec[i];
  }
  if (magSq > 0) {
    const mag = Math.sqrt(magSq);
    for (let i = 0; i < vec.length; i++) {
      vec[i] /= mag;
    }
  }
}

/**
 * Calculates cosine similarity using manual loop unrolling
 * for V8 performance optimization on 768D Float32Arrays.
 */
export function calculateCosineSimilarity(
  vecA: Float32Array,
  vecB: Float32Array,
): number {
  if (vecA.length !== vecB.length) {
    throw new Error(
      `Vector mismatch: vecA(${vecA.length}) != vecB(${vecB.length})`,
    );
  }
  let dotProduct = 0;
  const len = vecA.length;
  let i = 0;

  // Unroll by 4 to reduce branch prediction overhead
  for (; i <= len - 4; i += 4) {
    dotProduct +=
      vecA[i] * vecB[i] +
      vecA[i + 1] * vecB[i + 1] +
      vecA[i + 2] * vecB[i + 2] +
      vecA[i + 3] * vecB[i + 3];
  }
  // Handle remaining elements
  for (; i < len; i++) {
    dotProduct += vecA[i] * vecB[i];
  }

  return Math.max(-1, Math.min(1, dotProduct));
}

// Check squared distance to avoid Math.sqrt in hot paths
export function calculateSquaredOrthogonalDistance(
  vecA: Float32Array,
  vecB: Float32Array,
): number {
  const cosSim = calculateCosineSimilarity(vecA, vecB);
  return 1 - cosSim * cosSim;
}

export function mergeVectors(vectors: Float32Array[]): Float32Array {
  if (vectors.length === 0) return new Float32Array(768);
  const dim = vectors[0].length;
  if (dim !== 768) {
    throw new Error("Vectors must be 768D");
  }

  const merged = new Float32Array(dim);
  for (const v of vectors) {
    for (let i = 0; i < dim; i++) {
      merged[i] += v[i];
    }
  }

  fastL2NormalizeInPlace(merged);
  return merged;
}

export function validateExaUrl(url: string): boolean {
  if (!url) return false;
  if (url.startsWith("javascript:") || url.startsWith("data:")) {
    return false;
  }
  return url.startsWith("http://") || url.startsWith("https://");
}
