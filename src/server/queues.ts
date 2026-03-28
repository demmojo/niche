import { Queue, Worker, QueueEvents } from "bullmq";
import Redis from "ioredis";
import * as dotenv from "dotenv";
import { publishSseEvent } from "./sse";

dotenv.config();

// Initialize Redis connection
// In production, use the REDIS_URL from env
export const connection = new Redis(
  process.env.REDIS_URL || "redis://127.0.0.1:6379",
  {
    maxRetriesPerRequest: null, // Required by BullMQ
  },
);

// Create Queues
export const networkIoQueue = new Queue("network-io-queue", { connection });
export const visionMlQueue = new Queue("vision-ml-queue", { connection });

// Custom Full Jitter Backoff Strategy
// delay = base * 2^attempt + random(0, 1000)
const fullJitterBackoff = (attemptsMade: number) => {
  const baseDelay = 1000; // 1 second
  const maxDelay = 30000; // 30 seconds
  const exponential = Math.min(baseDelay * Math.pow(2, attemptsMade), maxDelay);
  const jitter = Math.random() * 1000;
  return exponential + jitter;
};

// --- Mock Exa Scraping Logic for Network IO ---
export const startNetworkIoWorker = () => {
  const worker = new Worker(
    "network-io-queue",
    async (job) => {
      publishSseEvent(job.id || "unknown", "progress", {
        status: "Scraping competitor...",
        progress: 20,
      });

      // Simulating a network call that could fail (Circuit breaker logic can be added here)
      // For now, we just simulate a delay
      await new Promise((resolve) => setTimeout(resolve, 2000));

      publishSseEvent(job.id || "unknown", "progress", {
        status: "Processing data...",
        progress: 80,
      });

      return {
        success: true,
        url: job.data.url,
        text: "Simulated scraped content from " + job.data.url,
      };
    },
    {
      connection,
      settings: {
        backoffStrategy: fullJitterBackoff,
      },
    },
  );

  worker.on("completed", (job) => {
    publishSseEvent(job.id || "unknown", "completed", {
      status: "Done",
      result: job.returnvalue,
    });
  });

  worker.on("failed", (job, err) => {
    publishSseEvent(job?.id || "unknown", "failed", { error: err.message });
  });

  return worker;
};

// --- Mock Vision ML Logic ---
export const startVisionMlWorker = () => {
  const worker = new Worker(
    "vision-ml-queue",
    async (job) => {
      publishSseEvent(job.id || "unknown", "progress", {
        status: "Analyzing image...",
        progress: 10,
      });

      await new Promise((resolve) => setTimeout(resolve, 4000));

      publishSseEvent(job.id || "unknown", "progress", {
        status: "Extracting features...",
        progress: 90,
      });

      return { success: true, features: ["Mock Feature 1", "Mock Feature 2"] };
    },
    {
      connection,
      settings: {
        backoffStrategy: fullJitterBackoff,
      },
    },
  );

  worker.on("completed", (job) => {
    publishSseEvent(job.id || "unknown", "completed", {
      status: "Done",
      result: job.returnvalue,
    });
  });

  worker.on("failed", (job, err) => {
    publishSseEvent(job?.id || "unknown", "failed", { error: err.message });
  });

  return worker;
};
