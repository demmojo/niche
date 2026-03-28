const { performance } = require('perf_hooks');
const { similarity } = require('ml-distance');

const DIMENSIONS = 1536;
const NUM_VECTORS = 50;

const targetVector = new Float32Array(DIMENSIONS).map(() => Math.random());
const compareVectors = Array.from({ length: NUM_VECTORS }, () => 
  new Float32Array(DIMENSIONS).map(() => Math.random())
);

const start = performance.now();
for (let i=0; i<NUM_VECTORS; i++) {
  similarity.cosine(targetVector, compareVectors[i]);
}
const end = performance.now();

console.log(`ml-distance with Float32Array Time taken: ${(end - start).toFixed(4)} ms`);
