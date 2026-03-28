const { performance } = require('perf_hooks');
const { similarity } = require('ml-distance');

const DIMENSIONS = 1536;
const NUM_VECTORS = 50;

const targetVector = Array.from({ length: DIMENSIONS }, () => Math.random());
const compareVectors = Array.from({ length: NUM_VECTORS }, () => 
  Array.from({ length: DIMENSIONS }, () => Math.random())
);

const start = performance.now();
for (let i=0; i<NUM_VECTORS; i++) {
  similarity.cosine(targetVector, compareVectors[i]);
}
const end = performance.now();

console.log(`ml-distance Time taken: ${(end - start).toFixed(4)} ms`);
