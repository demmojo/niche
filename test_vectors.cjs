const { performance } = require('perf_hooks');

const DIMENSIONS = 1536;
const NUM_VECTORS = 50;

const targetVector = new Float32Array(DIMENSIONS).map(() => Math.random());
const compareVectors = Array.from({ length: NUM_VECTORS }, () => 
  new Float32Array(DIMENSIONS).map(() => Math.random())
);

function cosineSimilarity(vecA, vecB) {
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < DIMENSIONS; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }
  if (normA === 0 || normB === 0) return 0;
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

// Warmup JIT
for (let i=0; i<100; i++) {
  cosineSimilarity(targetVector, compareVectors[0]);
}

const start = performance.now();
for (let i=0; i<NUM_VECTORS; i++) {
  cosineSimilarity(targetVector, compareVectors[i]);
}
const end = performance.now();

console.log(`Time taken for ${NUM_VECTORS} operations of ${DIMENSIONS} dimensions: ${(end - start).toFixed(4)} ms`);
