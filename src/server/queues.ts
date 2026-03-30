import { enqueueTask, QUEUE_NAMES } from "./cloudTasks";
import * as adminNamespace from "firebase-admin";

const admin: typeof adminNamespace =
  (adminNamespace as any).default || adminNamespace;

export class ConsentRequiredError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ConsentRequiredError";
  }
}

export const requestUserConsent = async (
  jobId: string,
  proposedAction: any,
  context: any,
) => {
  const db = admin.firestore();
  await db.collection("Tasks").doc(jobId).set(
    {
      status: "PENDING_CONSENT",
      proposedAction,
      context,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    },
    { merge: true },
  );
  throw new ConsentRequiredError(
    "Task paused pending user consent in the Action Audit Log.",
  );
};

// Queue Mock wrappers to minimize blast radius
class QueueMock {
  constructor(
    public queueName: string,
    public endpoint: string,
  ) {}

  async add(name: string, data: any, opts?: any) {
    // Write heavy payloads to Firestore instead of passing in HTTP
    const db = admin.firestore();
    // BullMQ sometimes passed jobId in opts
    const jobId = data.jobId || opts?.jobId || require("crypto").randomUUID();

    // Check for heavy payloads (e.g. base64 image or large text)
    if (JSON.stringify(data).length > 90000) {
      // Cloud Tasks limit is 100KB
      await db
        .collection("cloud_tasks_payloads")
        .doc(jobId)
        .set({
          ...data,
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
        });
      // Pass only the reference ID
      await enqueueTask(this.queueName, this.endpoint, {
        jobId,
        action: name,
        isHeavyPayload: true,
      });
    } else {
      // Pass the whole data if it's small
      await enqueueTask(this.queueName, this.endpoint, {
        ...data,
        jobId,
        action: name,
      });
    }

    return { id: jobId };
  }
}

export const networkIoQueue = new QueueMock(
  QUEUE_NAMES.networkIo,
  "/api/internal/worker/network-io",
);
export const visionMlQueue = new QueueMock(
  QUEUE_NAMES.visionMl,
  "/api/internal/worker/vision-ml",
);
export const brandWizardQueue = new QueueMock(
  QUEUE_NAMES.brandWizard,
  "/api/internal/worker/brand-wizard",
);
export const brandReviewQueue = new QueueMock(
  QUEUE_NAMES.brandReview,
  "/api/internal/worker/brand-review",
);
export const marketIntelligenceQueue = new QueueMock(
  QUEUE_NAMES.marketIntelligence,
  "/api/internal/worker/market-intelligence",
);
export const distillationQueue = new QueueMock(
  QUEUE_NAMES.distillation,
  "/api/internal/worker/distillation",
);

// Exporting dummy initialization functions that no longer spawn threads/workers.
// They are now just HTTP endpoints.
export const startTaxonomyOutboxWorker = () => {
  /* Now triggered via Cloud Scheduler pointing to /api/internal/cron/taxonomy-merge */
};
export const startDistillationWorker = () => {
  /* Handled via HTTP /api/internal/worker/distillation */
};
export const startNetworkIoWorker = () => {
  /* Handled via HTTP /api/internal/worker/network-io */
};
export const startVisionMlWorker = () => {
  /* Handled via HTTP /api/internal/worker/vision-ml */
};
export const startMarketIntelligenceWorker = () => {
  /* Handled via HTTP */
};
export const startBrandWizardWorker = () => {
  /* Handled via HTTP */
};
export const startBrandTokenReviewWorker = () => {
  /* Handled via HTTP */
};
export const startPairwiseArenaWorker = () => {
  /* Handled via HTTP */
};
export const startFlywheelWorker = () => {
  /* Handled via HTTP */
};
export const startMabAggregationWorker = () => {
  /* Handled via HTTP */
};

// Dummy connection export for files still trying to import it
export const connection = {} as any;
