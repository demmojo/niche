export interface VarianceResult {
  mean: number;
  stdDev: number;
  ci95: number; // 95% Confidence Interval margin
  scores: number[];
}

function mean(arr: number[]): number {
  if (arr.length === 0) return 0;
  return arr.reduce((a, b) => a + b, 0) / arr.length;
}

function standardDeviation(arr: number[]): number {
  if (arr.length <= 1) return 0;
  const mu = mean(arr);
  const variance =
    arr.reduce((a, b) => a + Math.pow(b - mu, 2), 0) / (arr.length - 1);
  return Math.sqrt(variance);
}

export async function measureVariance<T>(
  executionFn: () => Promise<T>,
  scoringFn: (output: T) => number | Promise<number>,
  iterations: number = 10,
): Promise<VarianceResult> {
  const scores: number[] = [];

  for (let i = 0; i < iterations; i++) {
    const result = await executionFn();
    const score = await scoringFn(result);
    scores.push(score);
  }

  const mu = mean(scores);
  const sigma = standardDeviation(scores);

  // 95% CI Margin of Error = 1.96 * (sigma / sqrt(n))
  const ci95 = 1.96 * (sigma / Math.sqrt(iterations));

  return { mean: mu, stdDev: sigma, ci95, scores };
}
