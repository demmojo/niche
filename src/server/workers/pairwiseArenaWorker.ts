import { logger } from "../logger";
import admin from "firebase-admin";
import { z } from "zod";
import { GoogleGenAI } from "@google/genai";
import ttest from "@stdlib/stats-ttest";
import { Float32ArrayPool } from "../../utils/mathUtils";
import {
  LLMExtractionSchema,
  calculateCosineSimilarity,
} from "../../utils/scoringEngine";

if (!admin.apps?.length) {
  admin.initializeApp();
}

/**
 * 768 Dimensions for Gemini gemini-embedding-001
 */
const VECTOR_DIMS = 768;
const vectorPool = new Float32ArrayPool(VECTOR_DIMS);

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
    const key = process.env.GEMINI_API_KEY;
    if (!key) throw new Error("GEMINI_API_KEY is missing");
    const ai = new GoogleGenAI({ apiKey: key });

    const evalsQuery = await db.collection("gold_standard_evals").get();
    if (evalsQuery.empty) {
      logger.warn("[ArenaWorker] No gold standards available to test.");
      return;
    }

    const champDoc = await db.collection("ml_configs").doc(championDocId).get();
    const chalDoc = await db
      .collection("ml_configs")
      .doc(challengerConfigId)
      .get();

    if (!champDoc.exists || !chalDoc.exists) {
      logger.warn("[ArenaWorker] Champion or Challenger configs not found.");
      return;
    }

    const champConfig = champDoc.data();
    const chalConfig = chalDoc.data();

    const n = evalsQuery.docs.length;
    const championScores: number[] = [];
    const challengerScores: number[] = [];

    // We yield to event loop using setImmediate chunking every N iterations
    // to prevent Node.js process starvation
    for (let i = 0; i < evalsQuery.docs.length; i++) {
      if (i % 5 === 0) {
        await new Promise((resolve) => setImmediate(resolve));
      }

      const evalCase = evalsQuery.docs[i].data();
      const inputPayload = evalCase.inputPayload;
      const expectedOutput = evalCase.expectedOutput;

      // Generate Champion Output
      let champOutput = "{}";
      try {
        const champRes = await ai.models.generateContent({
          model: champConfig?.modelParams?.model || "gemini-3.1-flash",
          contents: `Input: ${inputPayload}\nCriteria: ${evalCase.evaluationCriteria}\nOutput:`,
        });
        champOutput = champRes.text || "{}";
      } catch (e) {
        logger.warn(`Champion failed generating on eval case ${i}`);
      }

      // Generate Challenger Output
      let chalOutput = "{}";
      try {
        const chalRes = await ai.models.generateContent({
          model: chalConfig?.modelParams?.model || "gemini-3.1-flash",
          contents: `Input: ${inputPayload}\nCriteria: ${evalCase.evaluationCriteria}\nOutput:`,
        });
        chalOutput = chalRes.text || "{}";
      } catch (e) {
        logger.warn(`Challenger failed generating on eval case ${i}`);
      }

      // Step 1: Simulate Deterministic Zod Execution
      let champZodScore = 1.0;
      let chalZodScore = 1.0;

      try {
        LLMExtractionSchema.parse(JSON.parse(champOutput));
      } catch (e) {
        champZodScore = 0.0;
      }

      try {
        LLMExtractionSchema.parse(JSON.parse(chalOutput));
      } catch (e) {
        chalZodScore = 0.0;
      }

      let champSemanticScore = 0;
      let chalSemanticScore = 0;
      let chalWonJudge = false;
      let champWonJudge = false;

      // Short circuit if Challenger fails Deterministic pass
      if (chalZodScore === 0.0) {
        const champFinalScore =
          champZodScore * 0.4 +
          champSemanticScore * 0.6 +
          (champWonJudge ? 0.5 : 0);
        const chalFinalScore =
          chalZodScore * 0.4 +
          chalSemanticScore * 0.6 +
          (chalWonJudge ? 0.5 : 0);
        championScores.push(champFinalScore);
        challengerScores.push(chalFinalScore);
        continue;
      }

      // Step 2: Semantic Score (Embeddings)
      const champEmbedRes = await ai.models.embedContent({
        model: "gemini-embedding-001",
        contents: champOutput,
      });
      const chalEmbedRes = await ai.models.embedContent({
        model: "gemini-embedding-001",
        contents: chalOutput,
      });
      const expectedEmbedRes = await ai.models.embedContent({
        model: "gemini-embedding-001",
        contents: expectedOutput,
      });

      const expectedVals =
        expectedEmbedRes.embeddings?.[0]?.values || new Array(768).fill(0.1);
      const expectedVec = new Float32Array(expectedVals);

      const champVals =
        champEmbedRes.embeddings?.[0]?.values || new Array(768).fill(0);
      const chalVals =
        chalEmbedRes.embeddings?.[0]?.values || new Array(768).fill(0);

      const champVec = new Float32Array(champVals);
      const chalVec = new Float32Array(chalVals);

      champSemanticScore = calculateCosineSimilarity(champVec, expectedVec);
      chalSemanticScore = calculateCosineSimilarity(chalVec, expectedVec);

      // Short circuit if Challenger drops below threshold
      // We removed the strict semantic penalty that would reject innovative/divergent solutions.
      // Now semantic score is just part of the overall weighting.
      // But we still bypass the expensive LLM Judge if the challenger is completely irrelevant (e.g. < 0.2).
      if (chalSemanticScore < 0.2) {
        const champFinalScore =
          champZodScore * 0.4 + Math.max(0, champSemanticScore) * 0.6;
        const chalFinalScore =
          chalZodScore * 0.4 + Math.max(0, chalSemanticScore) * 0.6;
        championScores.push(champFinalScore);
        challengerScores.push(chalFinalScore);
        continue;
      }

      // Step 3: Pairwise LLM Judge
      // Randomize A/B presentation order to neutralize position bias
      const isChallengerA = Math.random() > 0.5;
      const modelA = isChallengerA ? chalOutput : champOutput;
      const modelB = isChallengerA ? champOutput : chalOutput;

      const judgePrompt = `
You are an expert evaluator. Compare the following two outputs based on this criteria: ${evalCase.evaluationCriteria}
Expected gold standard output: ${expectedOutput}

Output A:
${modelA}

Output B:
${modelB}

Which output is better? Reply with "A" or "B". Only answer with the letter.
      `;

      let judgeWinner = "A";
      try {
        const judgeRes = await ai.models.generateContent({
          model: "gemini-3.1-pro-preview",
          contents: judgePrompt,
          config: { temperature: 0.1 },
        });
        judgeWinner = judgeRes.text?.trim() || "A";
      } catch (e) {
        logger.warn(`LLM Judge failed on eval case ${i}`);
      }

      chalWonJudge =
        (isChallengerA && judgeWinner === "A") ||
        (!isChallengerA && judgeWinner === "B");
      champWonJudge =
        (!isChallengerA && judgeWinner === "A") ||
        (isChallengerA && judgeWinner === "B");

      let champFinalScore =
        champZodScore * 0.4 + Math.max(0, champSemanticScore) * 0.6;
      let chalFinalScore =
        chalZodScore * 0.4 + Math.max(0, chalSemanticScore) * 0.6;

      if (chalWonJudge) chalFinalScore += 0.5;
      if (champWonJudge) champFinalScore += 0.5;

      championScores.push(champFinalScore);
      challengerScores.push(chalFinalScore);
    }

    // Step 4: Paired Student's t-test
    // One-sided test assuming Challenger is greater
    const ttestResult = ttest(challengerScores, championScores, {
      alternative: "greater",
    });

    // We want to ensure Challenger's mean is higher and pValue < 0.05
    const chalMean = challengerScores.reduce((a, b) => a + b, 0) / n;
    const champMean = championScores.reduce((a, b) => a + b, 0) / n;
    const pValue = isNaN(ttestResult.pValue) ? 1.0 : ttestResult.pValue;

    logger.info(
      `[ArenaWorker] Challenger Mean: ${chalMean.toFixed(2)}, Champion Mean: ${champMean.toFixed(2)}, p-value: ${pValue.toFixed(4)}`,
    );

    // Promotion Rules: Challenger mean must be better with 95% confidence
    if (chalMean > champMean && pValue < 0.05) {
      logger.info(
        `[ArenaWorker] Challenger mathematically proven! Initiating promotion.`,
      );

      // Atomic SCD Type 2 Transaction
      await db.runTransaction(async (transaction) => {
        const champRef = db.collection("ml_configs").doc(championDocId);
        const chalRef = db.collection("ml_configs").doc(challengerConfigId);

        const tChampDoc = await transaction.get(champRef);
        const tChalDoc = await transaction.get(chalRef);

        if (!tChampDoc.exists || !tChalDoc.exists) {
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

      logger.info(`[ArenaWorker] Promotion transaction complete.`);
    } else {
      logger.info(
        `[ArenaWorker] Challenger rejected. Not statistically significant.`,
      );
    }
  } catch (error) {
    logger.error("[ArenaWorker] Error executing arena:", error);
  }
};
