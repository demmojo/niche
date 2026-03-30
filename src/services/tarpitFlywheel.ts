import { fileURLToPath } from "url";
import path from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
import { supabase } from "../utils/hashing";
import streamingSphericalKMeans from "../workers/kmeansWorker";

export async function runTarpitClustering() {
  const K = 5;
  const DIM = 768;

  // 1. Fetch random sample of query vectors from supabase
  const { data, error } = await supabase
    .from("tarpit_queries")
    .select("query_vector")
    .limit(1000);

  if (error || !data || data.length === 0) {
    console.warn("No tarpit queries to cluster", error);
    return;
  }

  const numVectors = data.length;

  // 2. Prepare ArrayBuffer
  // DIM * 4 bytes per float32
  const sharedBuffer = new ArrayBuffer(numVectors * DIM * 4);
  const view = new Float32Array(sharedBuffer);

  for (let i = 0; i < numVectors; i++) {
    // Parse pgvector string "[0.1, 0.2, ...]" to array
    let vecArray: number[];
    try {
      vecArray =
        typeof data[i].query_vector === "string"
          ? JSON.parse(data[i].query_vector as string)
          : data[i].query_vector;
    } catch {
      continue;
    }

    for (let d = 0; d < DIM; d++) {
      view[i * DIM + d] = vecArray[d] || 0;
    }
  }

  // 3. Dispatch directly (Cloud Tasks guarantees CPU allocation)
  const result = await streamingSphericalKMeans({
    buffer: sharedBuffer as SharedArrayBuffer,
    numVectors,
    k: K,
    dim: DIM,
  });

  console.log(
    "Clustering completed. Silhouette Score:",
    result.silhouette_coefficient,
  );
  // Store centroids in DB (tarpit_centroids table)
  return result;
}

export async function storeTarpitQuery(
  userId: string,
  queryText: string,
  vector: number[],
) {
  const { error } = await supabase.from("tarpit_queries").insert({
    user_id: userId,
    query_text: queryText,
    query_vector: vector,
  });
  if (error) {
    console.error("Failed to store tarpit query:", error);
  }
}
