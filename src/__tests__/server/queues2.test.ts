import { describe, it, expect, vi } from "vitest";
import {
  startTaxonomyOutboxWorker,
  startDistillationWorker,
  startNetworkIoWorker,
  startVisionMlWorker,
} from "../../server/queues";

vi.mock("bullmq", () => ({
  Queue: vi.fn().mockImplementation(() => ({
    add: vi.fn(),
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
  return {
    default: {
      firestore: Object.assign(
        vi.fn().mockReturnValue({
          collection: vi.fn().mockReturnThis(),
          doc: vi.fn().mockReturnThis(),
          set: vi.fn().mockResolvedValue({}),
        }),
        {
          FieldValue: { serverTimestamp: vi.fn().mockReturnValue("mock-time") },
        },
      ),
    },
  };
});

describe("queues initialization", () => {
  it("starts workers without crashing", () => {
    startTaxonomyOutboxWorker();
    startDistillationWorker();
    startNetworkIoWorker();
    startVisionMlWorker();
    expect(true).toBe(true);
  });
});
