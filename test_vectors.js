const { performance } = require("perf_hooks");

const DIMENSIONS = 1536;
const NUM_VECTORS = 50;

// Create dummy vectors
const vectors = Array.from({ length: NUM_VECTORS + 1 }, () =>
  Float32Array.from({ length: DIMENSIONS }, () => Math.random()),
);

const targetVector = vectors[0];
const compareVectors = vectors.slice(1);

function cosineSimilarity(vecA, vecB) {
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }
  if (normA === 0 || normB === 0) return 0;
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

const start = performance.now();
const results = compareVectors.map((v) => cosineSimilarity(targetVector, v));
const end = performance.now();

console.log(
  `Time taken for ${NUM_VECTORS} operations: ${(end - start).toFixed(4)} ms`,
);
