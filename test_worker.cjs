const { Worker, isMainThread, parentPort, workerData } = require('worker_threads');
const { performance } = require('perf_hooks');

if (isMainThread) {
  const DIMENSIONS = 1536;
  const NUM_VECTORS = 50;

  const targetVector = new Float32Array(DIMENSIONS).map(() => Math.random());
  const compareVectors = Array.from({ length: NUM_VECTORS }, () => 
    new Float32Array(DIMENSIONS).map(() => Math.random())
  );

  const start = performance.now();
  const worker = new Worker(__filename, {
    workerData: { targetVector, compareVectors }
  });
  worker.on('message', (result) => {
    const end = performance.now();
    console.log(`Worker Time taken: ${(end - start).toFixed(4)} ms`);
    process.exit(0);
  });
} else {
  const { targetVector, compareVectors } = workerData;
  const DIMENSIONS = 1536;
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
  for (let i=0; i<compareVectors.length; i++) {
    cosineSimilarity(targetVector, compareVectors[i]);
  }
  parentPort.postMessage('done');
}
