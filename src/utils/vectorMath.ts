export function mergeVectors(
  vectors: (number[] | Float32Array)[],
  weights?: number[],
): Float32Array {
  if (!vectors || vectors.length === 0) {
    throw new Error("Must provide at least one vector to merge");
  }

  const dim = vectors[0].length;
  if (dim !== 768) {
    throw new Error(`Vectors must be exactly 768 dimensions, got ${dim}`);
  }

  const w = weights || new Array(vectors.length).fill(1);
  if (w.length !== vectors.length) {
    throw new Error("Weights array must match vectors array length");
  }

  // Pre-allocate Float32Array scratchpad
  const merged = new Float32Array(dim);

  // Compute weighted sum
  for (let i = 0; i < vectors.length; i++) {
    const vec = vectors[i];
    if (vec.length !== dim) {
      throw new Error(
        `All vectors must have the same dimensions. Expected ${dim}, got ${vec.length}`,
      );
    }
    const weight = w[i];
    for (let j = 0; j < dim; j++) {
      merged[j] += vec[j] * weight;
    }
  }

  // Compute L2 norm (magnitude squared)
  let magnitudeSq = 0;
  for (let j = 0; j < dim; j++) {
    magnitudeSq += merged[j] * merged[j];
  }

  // Zero-vector safeguard
  if (magnitudeSq === 0) {
    return new Float32Array(dim); // return origin array
  }

  // L2 normalization
  const magnitude = Math.sqrt(magnitudeSq);
  for (let j = 0; j < dim; j++) {
    merged[j] /= magnitude;
  }

  return merged;
}
