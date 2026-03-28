import { describe, it, expect } from 'vitest';
import { mergeVectors } from './vectorMath';

describe('mergeVectors', () => {
  it('correctly merges and normalizes two 768D vectors', () => {
    const vec1 = new Float32Array(768).fill(0);
    vec1[0] = 1;
    const vec2 = new Float32Array(768).fill(0);
    vec2[1] = 1;

    const result = mergeVectors([vec1, vec2]);
    
    // Length should be 768
    expect(result.length).toBe(768);
    // Values at 0 and 1 should be 1/sqrt(2) approx 0.707
    expect(result[0]).toBeCloseTo(Math.sqrt(0.5));
    expect(result[1]).toBeCloseTo(Math.sqrt(0.5));
    
    // Magnitude should be 1
    let magSq = 0;
    for (let i = 0; i < 768; i++) magSq += result[i] * result[i];
    expect(Math.sqrt(magSq)).toBeCloseTo(1);
  });

  it('safeguards against zero-vector anomalies to prevent NaN', () => {
    const vec1 = new Float32Array(768).fill(0);
    vec1[0] = 1;
    const vec2 = new Float32Array(768).fill(0);
    vec2[0] = -1; // Opposing vector

    const result = mergeVectors([vec1, vec2]);
    
    // Magnitude squared will be 0, so it should return an origin array of 0s
    expect(result[0]).toBe(0);
    let magSq = 0;
    for (let i = 0; i < 768; i++) magSq += result[i] * result[i];
    expect(magSq).toBe(0);
    // Ensure no NaNs
    expect(Number.isNaN(result[0])).toBe(false);
  });

  it('throws error if dimensions are not 768', () => {
    const vec1 = new Float32Array(1536).fill(0.1);
    expect(() => mergeVectors([vec1])).toThrow(/exactly 768 dimensions/);
  });

  it('applies weights correctly', () => {
    const vec1 = new Float32Array(768).fill(0);
    vec1[0] = 1;
    const vec2 = new Float32Array(768).fill(0);
    vec2[1] = 1;

    // Weight vec1 heavily
    const result = mergeVectors([vec1, vec2], [3, 4]);
    
    // Result vector should be proportional to (3, 4) normalized
    // Norm of (3,4) is 5. So result[0] = 3/5 = 0.6, result[1] = 4/5 = 0.8
    expect(result[0]).toBeCloseTo(0.6);
    expect(result[1]).toBeCloseTo(0.8);
  });
});
