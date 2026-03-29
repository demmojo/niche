import { z } from "zod";

export const LLMExtractionSchema = z.object({
  _reasoning: z.string().optional(),
  exact_quote: z.string().optional(),
  exa_url: z.string().optional(),
  wedge_metric: z.number().optional(),
  suggestedNiches: z.array(z.string()).optional(),
});

/**
 * Hybrid Scoring Engine
 * Calculates a mathematically sound Niche Viability / Tarpit Score.
 */

export interface TarpitScoreInput {
  vectorUniqueness: number;
  apolloCount: number | null | undefined;
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
  { objective: number; subjective: number }
> = {
  "gemini-embedding-001": { objective: 0.85, subjective: 0.6 },
  "text-embedding-3-small": { objective: 0.82, subjective: 0.58 },
  default: { objective: 0.85, subjective: 0.6 },
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
  const tarpitScore = (cloneFactor * 0.6 + cappedSaturation * 0.4) * 100;

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
