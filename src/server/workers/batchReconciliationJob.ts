import { GoogleGenAI } from "@google/genai";
import { Storage } from "@google-cloud/storage";
import { ZodError } from "zod";

const storage = new Storage();

export async function processBatchReconciliation(
  batchResults: any[],
  targetSchema: any,
  jobId: string = "default-job",
  partitionTime: string = new Date().toISOString().split("T")[0],
) {
  const geminiApiKey = process.env.GEMINI_API_KEY;
  if (!geminiApiKey) {
    throw new Error("GEMINI_API_KEY missing");
  }

  const bucketName = process.env.LAKE_BUCKET_NAME;

  const ai = new GoogleGenAI({ apiKey: geminiApiKey });

  const successfulExtractions = [];
  const dlq = [];

  for (const result of batchResults) {
    let parsedData = null;
    let isValid = false;
    let retries = 0;
    const MAX_RETRIES = 2;
    let currentRawOutput = result.llmOutput;

    while (!isValid && retries <= MAX_RETRIES) {
      try {
        parsedData = targetSchema.parse(JSON.parse(currentRawOutput));
        isValid = true;
      } catch (error) {
        if (retries === MAX_RETRIES) {
          // Send to DLQ with exponential backoff routing
          dlq.push({
            result,
            error: error instanceof Error ? error.message : "Parse failed",
            backoffStage: 1, // 1m -> 5m -> 30m
            nextRetryAfterMs: 60 * 1000, // 1 minute
          });
          break;
        }

        retries++;

        // Synchronous Zod Self-Correction Loop with Structured Error Feedback
        let errorMessage = "Unknown parsing error";
        if (error instanceof ZodError) {
          errorMessage = error.issues
            .map((i) => `${i.path.join(".")}: ${i.message}`)
            .join(", ");
        }

        const retryPrompt = `
Your previous response failed schema validation.
Violations:
${errorMessage}

Please correct the JSON output to strictly match the requested schema.
Example valid output format:
{
  "name": "Example Corp",
  "website": "https://example.com",
  ...
}

Previous Output:
${currentRawOutput}
`;

        try {
          const geminiRes = await ai.models.generateContent({
            model: "gemini-3.1-flash",
            contents: retryPrompt,
            config: {
              responseMimeType: "application/json",
            },
          });
          currentRawOutput = geminiRes.text || "{}";
        } catch (llmError) {
          console.error("Self-correction LLM call failed", llmError);
          break; // Stop retrying if LLM call itself fails
        }
      }
    }

    if (isValid) {
      successfulExtractions.push(parsedData);
    }
  }

  // Merge to GCS Silver Lake
  if (bucketName) {
    const bucket = storage.bucket(bucketName);

    if (successfulExtractions.length > 0) {
      const successesKey = `silver-lake/successes/partition=${partitionTime}/batch-${jobId}.jsonl`;
      const file = bucket.file(successesKey);
      await file.save(
        successfulExtractions.map((e) => JSON.stringify(e)).join("\n"),
        {
          contentType: "application/jsonl",
        },
      );
      console.log(`Merged successes to ${successesKey}`);
    }

    if (dlq.length > 0) {
      const dlqKey = `silver-lake/dlq/partition=${partitionTime}/batch-${jobId}.jsonl`;
      const file = bucket.file(dlqKey);
      await file.save(dlq.map((e) => JSON.stringify(e)).join("\n"), {
        contentType: "application/jsonl",
      });
      console.log(`Routed failures to DLQ at ${dlqKey}`);
    }
  }

  return { successfulExtractions, dlqCount: dlq.length };
}
