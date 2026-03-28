import { Piscina } from 'piscina';
import * as path from 'path';

export const taxonomyWorkerPool = new Piscina({
  filename: path.resolve(__dirname, 'taxonomyMergeWorker.js'),
  minThreads: 1,
  maxThreads: 4,
});
