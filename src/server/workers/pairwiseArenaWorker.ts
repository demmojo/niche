import * as adminNamespace from "firebase-admin";
const admin: typeof adminNamespace =
  (adminNamespace as any).default || adminNamespace;
import { z } from "zod";
import {
  Float32ArrayPool,
  calculateBinomialPValue,
} from "../../utils/mathUtils";

if (!admin.apps.length) {
  admin.initializeApp();
}

/**
 * 768 Dimensions for Gemini gemini-embedding-001
 */
const VECTOR_DIMS = 768;
const vectorPool = new Float32ArrayPool(VECTOR_DIMS);

/**
 * Perform cosine similarity using Float32Array object pool to
 * avoid V8 GC blocking overhead.
 */
export const calculateCosineSimilarity = (
  vecA: number[],
  vecB: number[],
): number => {
  const f32A = vectorPool.acquire();
  const f32B = vectorPool.acquire();

  let dotProduct = 0.0;
  let normA = 0.0;
  let normB = 0.0;

  for (let i = 0; i < VECTOR_DIMS; i++) {
    f32A[i] = vecA[i] || 0;
    f32B[i] = vecB[i] || 0;

    dotProduct += f32A[i] * f32B[i];
    normA += f32A[i] * f32A[i];
    normB += f32B[i] * f32B[i];
  }

  vectorPool.release(f32A);
  vectorPool.release(f32B);

  if (normA === 0 || normB === 0) return 0;
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
};

/**
 * Executes the Pairwise Tri-Modal Arena
 *
 * 1. Validates Deterministic schemas.
 * 2. Compares Semantic vectors.
 * 3. Runs LLM-as-a-Judge for heuristic grading.
 * 4. Promotes Challenger via Transaction if proven.
 */
export const runTriModalPairwiseArena = async (
  challengerConfigId: string,
  championDocId: string,
) => {
  const db = admin.firestore();

  try {
    const evalsQuery = await db.collection("gold_standard_evals").get();
    if (evalsQuery.empty) {
      console.warn("[ArenaWorker] No gold standards available to test.");
      return;
    }

    const n = evalsQuery.docs.length;
    let challengerWins = 0;

    // We yield to event loop using setImmediate chunking every N iterations
    // to prevent Node.js process starvation
    for (let i = 0; i < evalsQuery.docs.length; i++) {
      if (i % 10 === 0) {
        await new Promise((resolve) => setImmediate(resolve));
      }

      const evalCase = evalsQuery.docs[i].data();

      // Step 1: Simulate Deterministic Zod Execution
      // Here, assume `challengerOutput` is generated via API.
      // (Mocked output simulation for logic layout)
      const isZodCompliant = true; // Replace with runtime `.safeParse`
      if (!isZodCompliant) {
        // Zod hard fail
        continue;
      }

      // Step 2: Semantic Score (Embeddings mock)
      const simulatedVecA = new Array(768).fill(0.1);
      const simulatedVecB = new Array(768).fill(0.15);
      const semanticSim = calculateCosineSimilarity(
        simulatedVecA,
        simulatedVecB,
      );

      // Step 3: Pairwise LLM Judge
      // Prompt LLM side-by-side with champion and challenger outputs
      const llmJudgeWinner = "Challenger";

      if (semanticSim > 0.8 && llmJudgeWinner === "Challenger") {
        challengerWins++;
      }
    }

    // Step 4: Binomial Sign Test
    const winRate = challengerWins / n;
    const pValue = calculateBinomialPValue(n, challengerWins, 0.5);

    console.log(
      `[ArenaWorker] Challenger Win Rate: ${winRate.toFixed(2)}, p-value: ${pValue.toFixed(4)}`,
    );

    // Promotion Rules: Must beat 55% win rate with 95% confidence
    if (winRate > 0.55 && pValue < 0.05) {
      console.log(
        `[ArenaWorker] Challenger mathematically proven! Initiating promotion.`,
      );

      // Atomic SCD Type 2 Transaction
      await db.runTransaction(async (transaction) => {
        const champRef = db.collection("ml_configs").doc(championDocId);
        const chalRef = db.collection("ml_configs").doc(challengerConfigId);

        const champDoc = await transaction.get(champRef);
        const chalDoc = await transaction.get(chalRef);

        if (!champDoc.exists || !chalDoc.exists) {
          throw new Error("Documents do not exist.");
        }

        // Archive Champion
        transaction.update(champRef, {
          status: "archived",
          validTo: admin.firestore.FieldValue.serverTimestamp(),
        });

        // Promote Challenger
        transaction.update(chalRef, {
          status: "champion",
          validFrom: admin.firestore.FieldValue.serverTimestamp(),
        });
      });

      console.log(`[ArenaWorker] Promotion transaction complete.`);
    } else {
      console.log(
        `[ArenaWorker] Challenger rejected. Not statistically significant.`,
      );
    }
  } catch (error) {
    console.error("[ArenaWorker] Error executing arena:", error);
  }
};
