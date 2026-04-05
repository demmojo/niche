import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  startTaxonomyOutboxWorker,
  startDistillationWorker,
  startNetworkIoWorker,
  startVisionMlWorker,
} from "../../server/queues";
import {
  connection,
  networkIoQueue,
  visionMlQueue,
  brandWizardQueue,
  brandReviewQueue,
  marketIntelligenceQueue,
  distillationQueue,
  ConsentRequiredError,
  requestUserConsent,
} from "../../server/queues";
import admin from "firebase-admin";

vi.mock("bullmq", () => ({
  Queue: vi.fn().mockImplementation(() => ({
    add: vi.fn().mockResolvedValue({ id: "job-123" }),
  })),
  Worker: vi.fn().mockImplementation((name, cb) => {
    return {
      on: vi.fn(),
      close: vi.fn(),
    };
  }),
  QueueEvents: vi.fn().mockImplementation(() => ({
    on: vi.fn(),
    close: vi.fn(),
  })),
}));

vi.mock("ioredis", () => ({
  default: vi.fn().mockImplementation(() => ({
    subscribe: vi.fn(),
    on: vi.fn(),
    publish: vi.fn(),
  })),
}));

vi.mock("firebase-admin", () => {
  const setMock = vi.fn().mockResolvedValue({});
  const docMock = vi.fn(() => ({
    set: setMock,
  }));
  const collectionMock = vi.fn(() => ({
    doc: docMock,
  }));

  return {
    default: {
      firestore: Object.assign(
        vi.fn(() => ({
          collection: collectionMock,
        })),
        {
          FieldValue: {
            serverTimestamp: vi.fn().mockReturnValue("SERVER_TIMESTAMP"),
          },
        },
      ),
    },
    firestore: Object.assign(
      vi.fn(() => ({
        collection: collectionMock,
      })),
      {
        FieldValue: {
          serverTimestamp: vi.fn().mockReturnValue("SERVER_TIMESTAMP"),
        },
      },
    ),
  };
});

describe("queues", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("queue exports", () => {
    it("should export initialized queues", () => {
      expect(networkIoQueue).toBeDefined();
      expect(visionMlQueue).toBeDefined();
      expect(brandWizardQueue).toBeDefined();
      expect(brandReviewQueue).toBeDefined();
      expect(marketIntelligenceQueue).toBeDefined();
      expect(distillationQueue).toBeDefined();
    });

    it("should export redis connection", () => {
      expect(connection).toBeDefined();
    });
  });

  describe("ConsentRequiredError", () => {
    it("should be an instance of Error", () => {
      const err = new ConsentRequiredError("test message");
      expect(err).toBeInstanceOf(Error);
      expect(err.name).toBe("ConsentRequiredError");
      expect(err.message).toBe("test message");
    });
  });

  describe("requestUserConsent", () => {
    it("writes to Firestore and throws ConsentRequiredError", async () => {
      const db = admin.firestore();

      await expect(
        requestUserConsent("job-123", { action: "merge" }, { foo: "bar" }),
      ).rejects.toThrow(ConsentRequiredError);

      expect(db.collection("Tasks").doc("job-123").set).toHaveBeenCalledWith(
        expect.objectContaining({
          status: "PENDING_CONSENT",
          proposedAction: { action: "merge" },
          context: { foo: "bar" },
        }),
        { merge: true },
      );
    });
  });

  describe("worker initialization (queues2)", () => {
    it("starts taxonomy outbox worker without crashing", () => {
      expect(() => startTaxonomyOutboxWorker()).not.toThrow();
    });

    it("starts distillation worker without crashing", () => {
      expect(() => startDistillationWorker()).not.toThrow();
    });

    it("starts network io worker without crashing", () => {
      expect(() => startNetworkIoWorker()).not.toThrow();
    });

    it("starts vision ml worker without crashing", () => {
      expect(() => startVisionMlWorker()).not.toThrow();
    });
  });
});
