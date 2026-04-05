import * as crypto from "crypto";
import { Storage } from "@google-cloud/storage";
import { CloudTasksClient } from "@google-cloud/tasks";

const storage = new Storage();
const BUCKET_NAME = process.env.LAKE_BUCKET_NAME || "mock-lake-bucket";

interface CrawlResult {
  domain: string;
  botWallDetected: boolean;
  successCount: number;
}

export async function processStaticCrawl(data: {
  domain: string;
}): Promise<CrawlResult> {
  const { domain } = data;

  // Target specific high-signal paths, skipping full domain scan
  const targets = ["/careers", "/changelog", "/integrations"];
  let botWallDetected = false;
  let successCount = 0;

  // Hash prefix for GCS to avoid partition hotspotting
  const cleanDomain = domain.replace(/^https?:\/\//, "").replace(/\/$/, "");
  const hashPrefix = crypto
    .createHash("md5")
    .update(cleanDomain)
    .digest("hex")
    .substring(0, 4);

  const tasksClient = new CloudTasksClient();

  for (const path of targets) {
    const url = `https://${cleanDomain}${path}`;

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000); // 15-second strict timeout

      const response = await fetch(url, { signal: controller.signal });
      clearTimeout(timeoutId);

      if (response.status === 403 || response.status === 429) {
        throw new Error("BotWallDetected");
      }

      if (response.ok) {
        const text = await response.text();

        const gcsPath = `raw-payloads/${hashPrefix}/${cleanDomain}${path}.html`;
        const bucket = storage.bucket(BUCKET_NAME);
        const file = bucket.file(gcsPath);

        await file.save(text, {
          contentType: "text/html",
        });

        successCount++;
      }
    } catch (e: any) {
      if (
        e.name === "AbortError" ||
        e.message === "BotWallDetected" ||
        e.name === "TimeoutError"
      ) {
        // SPA/bot-wall fallback to Firecrawl Spot VMs via Cloud Tasks
        botWallDetected = true;

        const projectId = process.env.GCP_PROJECT_ID;
        const location = process.env.GCP_LOCATION;
        const queue =
          process.env.FIRECRAWL_QUEUE_NAME || "firecrawl-spot-queue";
        const workerUrl = process.env.FIRECRAWL_WORKER_URL;

        if (projectId && location && workerUrl) {
          try {
            const parent = tasksClient.queuePath(projectId, location, queue);
            await tasksClient.createTask({
              parent,
              task: {
                httpRequest: {
                  httpMethod: "POST",
                  url: workerUrl,
                  body: Buffer.from(
                    JSON.stringify({ domain: cleanDomain, path }),
                  ).toString("base64"),
                  headers: { "Content-Type": "application/json" },
                },
              },
            });
            console.log(
              `Dispatched ${url} to Firecrawl fallback queue due to ${e.message || e.name}.`,
            );
          } catch (taskErr) {
            console.error(
              `Failed to dispatch Firecrawl task for ${url}`,
              taskErr,
            );
          }
        } else {
          console.warn(
            "Firecrawl fallback skipped: Missing GCP_PROJECT_ID, GCP_LOCATION, or FIRECRAWL_WORKER_URL.",
          );
        }
      } else {
        console.error(`Failed to fetch ${url}`, e);
      }
    }
  }

  return {
    domain,
    botWallDetected,
    successCount,
  };
}
