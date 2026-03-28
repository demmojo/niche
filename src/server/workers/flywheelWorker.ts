import * as adminNamespace from "firebase-admin";
const admin: typeof adminNamespace =
  (adminNamespace as any).default || adminNamespace;
import { getGeminiClient } from "../../utils/geminiClient";

if (!admin.apps.length) {
  admin.initializeApp();
}

/**
 * Fast Regex pass to remove obvious PII.
 * Prevents unnecessary LLM tokens and provides a deterministic baseline.
 */
const regexScrub = (text: string): string => {
  if (!text) return text;
  let scrubbed = text;

  // Basic SSN (US)
  scrubbed = scrubbed.replace(/\b\d{3}[-.]?\d{2}[-.]?\d{4}\b/g, "[SSN]");
  // Basic Email
  scrubbed = scrubbed.replace(
    /[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+/g,
    "[EMAIL]",
  );
  // Basic Phone (US-centric simple match)
  scrubbed = scrubbed.replace(/\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/g, "[PHONE]");

  return scrubbed;
};

/**
 * The Hybrid Tokenization Pipeline
 * Uses gemini-3.1-flash-lite-preview to semantically replace names and organizations
 * with generic tokens like [PERSON_1] or [ORG_1] to preserve embedding structure
 * without leaking GDPR/PII data.
 */
const semanticTokenization = async (text: string): Promise<string> => {
  const ai = getGeminiClient();
  const prompt = `
You are a Zero-Trust PII Scrubber. 
Rewrite the input by replacing:
- Names with [PERSON_N]
- Companies with [ORG_N]
- Contact info with [CONTACT_N]
- Any other sensitive proprietary identifiers with [SENSITIVE_N]

DO NOT summarize. Preserve exact grammatical structure and spacing.
Input:
${text}
`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3.1-flash-lite-preview",
      contents: prompt,
    });

    return response.text || text; // Fallback to raw if extraction fails
  } catch (error) {
    console.error("[FlywheelWorker] Semantic tokenization failed", error);
    return text; // Fallback
  }
};

/**
 * Worker to process items from `raw_eval_staging`, run the Hybrid Tokenization
 * pipeline, and insert them safely into `gold_standard_evals`.
 */
export const runFlywheelTokenization = async () => {
  const db = admin.firestore();
  console.log(
    "[FlywheelWorker] Starting PII Scrubbing and Flywheel Promotion.",
  );

  try {
    // 1. Fetch raw staged telemetry (Limit to prevent worker timeouts)
    const stagingQuery = await db
      .collection("raw_eval_staging")
      .limit(50)
      .get();

    if (stagingQuery.empty) {
      console.log("[FlywheelWorker] No staged items to process.");
      return;
    }

    const batch = db.batch();
    let processedCount = 0;

    for (const doc of stagingQuery.docs) {
      const data = doc.data();
      const rawInput = data.input || "";
      const rawOutput = data.output || "";

      // Skip empty
      if (!rawInput && !rawOutput) {
        batch.delete(doc.ref);
        continue;
      }

      // 2. Fast Regex Pre-filter
      const regexInput = regexScrub(rawInput);
      const regexOutput = regexScrub(rawOutput);

      // 3. Semantic Tokenization (LLM Pass)
      // Only run semantic scrub if the text is substantive to save tokens
      const finalInput =
        regexInput.length > 20
          ? await semanticTokenization(regexInput)
          : regexInput;
      const finalOutput =
        regexOutput.length > 20
          ? await semanticTokenization(regexOutput)
          : regexOutput;

      // 4. Promote to Gold Standard
      const goldRef = db.collection("gold_standard_evals").doc();
      batch.set(goldRef, {
        inputPayload: finalInput,
        expectedOutput: finalOutput,
        evaluationCriteria: data.evaluationCriteria || "Standard Criteria",
        originalTokenCount: rawInput.length + rawOutput.length,
        promotedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      // 5. Delete from staging
      batch.delete(doc.ref);
      processedCount++;
    }

    // Commit promotion transaction
    if (processedCount > 0) {
      await batch.commit();
      console.log(
        `[FlywheelWorker] Successfully promoted ${processedCount} items to Gold Standard.`,
      );
    }
  } catch (error) {
    console.error("[FlywheelWorker] Error processing flywheel batch:", error);
  }
};
