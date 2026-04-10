import { logger } from "./logger";
import { CloudTasksClient } from "@google-cloud/tasks";
import * as dotenv from "dotenv";

dotenv.config();

const client = new CloudTasksClient();

const projectId = process.env.GOOGLE_CLOUD_PROJECT || "demo-nicheai";
const location = process.env.GOOGLE_CLOUD_REGION || "us-central1";

// Mapping queue names to Cloud Tasks queue IDs
// In GCP, you will need to provision these queues via Terraform
export const QUEUE_NAMES = {
  networkIo: "network-io-queue",
  visionMl: "vision-ml-queue",
  brandWizard: "brand-wizard-queue",
  brandReview: "brand-review-queue",
  marketIntelligence: "market-intelligence-queue",
  distillation: "distillation-queue",
  flywheel: "flywheel-queue",
  mabAggregation: "mab-aggregation-queue",
  pairwiseArena: "pairwise-arena-queue",
};

export const enqueueTask = async (
  queueName: string,
  targetUrlPath: string,
  payload: any,
  delaySeconds: number = 0,
) => {
  // If we are in local development or testing, we might want to skip actual Cloud Tasks
  // or simulate it. For local tests, we could just execute the task synchronously,
  // but to match the async nature, we can just make an HTTP request directly.
  if (
    process.env.NODE_ENV === "test" ||
    process.env.SIMULATE_CLOUD_TASKS === "true"
  ) {
    logger.info(
      `[Cloud Tasks Mock] Enqueuing ${queueName} -> ${targetUrlPath}`,
    );
    // Simulate async execution
    setTimeout(
      () => {
        fetch(`http://127.0.0.1:${process.env.PORT || 3000}${targetUrlPath}`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer MOCK_INTERNAL_TOKEN`,
          },
          body: JSON.stringify(payload),
        }).catch((err) => logger.error("Mock Task execution failed:", err));
      },
      delaySeconds * 1000 + 100,
    );
    return;
  }

  // Construct the fully qualified queue name
  const parent = client.queuePath(projectId, location, queueName);

  // The base URL of your Cloud Run service
  const baseUrl = process.env.CLOUD_RUN_URL || `https://${projectId}.run.app`;

  const task: any = {
    httpRequest: {
      httpMethod: "POST",
      url: `${baseUrl}${targetUrlPath}`,
      headers: {
        "Content-Type": "application/json",
      },
      oidcToken: {
        serviceAccountEmail: process.env.CLOUD_RUN_SA_EMAIL, // Managed via Terraform
      },
      body: Buffer.from(JSON.stringify(payload)).toString("base64"),
    },
  };

  if (delaySeconds > 0) {
    task.scheduleTime = {
      seconds: delaySeconds + Date.now() / 1000,
    };
  }

  try {
    const [response] = await client.createTask({ parent, task });
    logger.info(`Created task ${response.name} in queue ${queueName}`);
    return response;
  } catch (error) {
    logger.error(`Error creating task in queue ${queueName}:`, error);
    throw error;
  }
};
