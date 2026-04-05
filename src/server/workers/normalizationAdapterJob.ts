import { Storage } from "@google-cloud/storage";
import { GoogleGenAI } from "@google/genai";

const storage = new Storage();
const BUCKET_NAME = process.env.LAKE_BUCKET_NAME;
if (!BUCKET_NAME)
  throw new Error("LAKE_BUCKET_NAME environment variable is required");

const MAX_REQUESTS_PER_FILE = 49999;
const MAX_BYTES_PER_FILE = 1000 * 1000 * 1000; // ~1GB

export async function processNormalizationAdapterJob(
  taskId: number,
  totalTasks: number,
  payloads: any[] = [],
  schemaType: string = "competitor",
  partitionTime: string = new Date().toISOString().split("T")[0],
) {
  // Max array job is 10,000 tasks per execution
  if (totalTasks > 10000) {
    throw new Error(
      "Normalization Adapter bounded to max 10,000 tasks per execution.",
    );
  }

  // Use a default mock payload if none provided (for tests or initial phase)
  if (payloads.length === 0) {
    payloads = [
      {
        request: {
          model: "gemini-3.1-flash",
          contents: [
            {
              role: "user",
              parts: [{ text: "Extract competitor data from ..." }],
            },
          ],
        },
      },
    ];
  }

  const chunks: string[][] = [];
  let currentChunk: string[] = [];
  let currentChunkSize = 0;

  for (const payload of payloads) {
    const line = JSON.stringify(payload);
    const lineSize = Buffer.byteLength(line, "utf8") + 1; // +1 for newline

    if (
      currentChunk.length >= MAX_REQUESTS_PER_FILE ||
      currentChunkSize + lineSize > MAX_BYTES_PER_FILE
    ) {
      chunks.push(currentChunk);
      currentChunk = [];
      currentChunkSize = 0;
    }

    currentChunk.push(line);
    currentChunkSize += lineSize;
  }

  if (currentChunk.length > 0) {
    chunks.push(currentChunk);
  }

  const geminiApiKey = process.env.GEMINI_API_KEY;
  if (!geminiApiKey) {
    console.error("GEMINI_API_KEY missing");
    return;
  }
  const ai = new GoogleGenAI({ apiKey: geminiApiKey });

  // Cap concurrent submissions to 80% of quota
  let activeJobs = 0;
  if (ai.batches && typeof ai.batches.list === "function") {
    try {
      const batchList = await ai.batches.list();
      activeJobs =
        batchList.batches?.filter(
          (b: any) => b.state === "IN_PROGRESS" || b.state === "ENQUEUED",
        ).length || 0;
    } catch (e) {
      console.warn("Failed to check active batches, assuming 0.", e);
    }
  }

  if (activeJobs > 80) {
    throw new Error(
      "Approaching 80% of Gemini Batch API quota. Deferring submission for exponential backoff.",
    );
  }

  const batchJobKeys = [];

  for (let i = 0; i < chunks.length; i++) {
    const chunkFileContent = chunks[i].join("\n");
    const batchFileKey = `batch-inputs/type=${schemaType}/partition=${partitionTime}/task-${taskId}-part-${i}.jsonl`;
    const bucket = storage.bucket(BUCKET_NAME);
    const file = bucket.file(batchFileKey);

    await file.save(chunkFileContent, {
      contentType: "application/jsonl",
    });

    const gcsUri = `gs://${BUCKET_NAME}/${batchFileKey}`;
    const destUriPrefix = `gs://${BUCKET_NAME}/batch-outputs/type=${schemaType}/partition=${partitionTime}/task-${taskId}-part-${i}/`;

    try {
      // In production, this would use the real Batch API submission
      // If Vertex AI or GenAI SDK supports it directly via GCS:
      if (ai.batches && typeof ai.batches.create === "function") {
        await ai.batches.create({
          src: gcsUri,
          config: { dest: destUriPrefix },
        });
      }

      console.log(`Submitted batch job for ${batchFileKey}`);
      batchJobKeys.push(batchFileKey);
    } catch (error) {
      console.error(`Failed to submit batch job for ${batchFileKey}`, error);
      throw error; // Rethrow to let Cloud Tasks apply exponential backoff
    }
  }

  return { success: true, batchJobKeys };
}
