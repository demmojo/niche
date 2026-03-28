/**
 * Math utilities for Machine Learning Validations
 */

// Factorial logic with caching for performance (up to reasonable N)
const factorialCache: number[] = [1, 1];
const getFactorial = (n: number): number => {
  if (n < 0) return 0;
  if (factorialCache[n]) return factorialCache[n];
  let res = factorialCache[factorialCache.length - 1];
  for (let i = factorialCache.length; i <= n; i++) {
    res *= i;
    factorialCache[i] = res;
  }
  return res;
};

// nCr combination
const combinations = (n: number, k: number): number => {
  if (k < 0 || k > n) return 0;
  // Use gamma/log-gamma for large numbers if this blows up,
  // but for N ~ 100 max, simple loops can suffice to prevent Infinity.
  let res = 1;
  for (let i = 1; i <= k; i++) {
    res = (res * (n - i + 1)) / i;
  }
  return res;
};

/**
 * Calculates the 1-tailed p-value for a Binomial distribution.
 * P(X >= k) for n trials with probability p.
 * Used for the Pairwise Sign Test to prove if a Challenger wins > 50%
 * of the time with statistical significance.
 */
export const calculateBinomialPValue = (
  n: number,
  k: number,
  p: number = 0.5,
): number => {
  if (n <= 0 || k < 0 || k > n) return 1;
  let pValue = 0;
  for (let i = k; i <= n; i++) {
    const prob = combinations(n, i) * Math.pow(p, i) * Math.pow(1 - p, n - i);
    pValue += prob;
  }
  return pValue;
};

/**
 * Float32Array Object Pool for Semantic Embedded Math.
 * Protects V8 GC and Thread execution by reusing scratchpads instead of
 * creating new typed arrays for every cosine similarity calculation.
 */
export class Float32ArrayPool {
  private pool: Float32Array[] = [];
  private size: number;

  constructor(size: number) {
    this.size = size;
  }

  /**
   * Get an array from the pool, or create a new one if empty.
   */
  public acquire(): Float32Array {
    if (this.pool.length > 0) {
      const arr = this.pool.pop()!;
      arr.fill(0); // Clean the scratchpad
      return arr;
    }
    return new Float32Array(this.size);
  }

  /**
   * Return the array to the pool for reuse.
   */
  public release(arr: Float32Array) {
    if (arr.length === this.size) {
      this.pool.push(arr);
    }
  }
}
