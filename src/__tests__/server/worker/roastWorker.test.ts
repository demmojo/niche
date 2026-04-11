import { describe, it, expect, vi, beforeEach } from "vitest";
import request from "supertest";
import express from "express";

vi.mock("../../../server/internalAuthMiddleware", () => ({
  requireInternalOidc: vi.fn((req, res, next) => next()),
}));

// We'll mock the express app since the worker route might not be built yet
// In reality, this will import the real workerRoutes
import { workerRouter } from "../../../server/routes/workerRoutes";

const {
  mockTransactionGet,
  mockTransactionUpdate,
  mockRedisPublish,
  mockLLMGenerate,
} = vi.hoisted(() => ({
  mockTransactionGet: vi.fn(),
  mockTransactionUpdate: vi.fn(),
  mockRedisPublish: vi.fn(),
  mockLLMGenerate: vi.fn(),
}));

vi.mock("firebase-admin", () => {
  const getMock = vi.fn().mockResolvedValue({
    exists: true,
    data: () => ({ status: "pending" }),
  });
  const updateMock = vi.fn().mockResolvedValue(true);

  const docMock = vi.fn().mockReturnValue({
    get: getMock,
    update: updateMock,
  });

  const firestoreInstanceMock = {
    runTransaction: vi.fn().mockImplementation(async (callback) => {
      const transactionMock = {
        get: mockTransactionGet,
        update: mockTransactionUpdate,
        set: vi.fn(),
      };
      return callback(transactionMock);
    }),
    collection: vi.fn().mockReturnValue({
      doc: docMock,
    }),
  };

  const firestoreMock = vi.fn(() => firestoreInstanceMock) as any;
  firestoreMock.FieldValue = {
    serverTimestamp: vi.fn().mockReturnValue("mocked-timestamp"),
  };
  firestoreMock.Timestamp = {
    fromMillis: vi
      .fn()
      .mockImplementation((ms) => ({ toMillis: () => ms, _mocked: true })),
    now: vi.fn().mockReturnValue({ toMillis: () => Date.now(), _mocked: true }),
  };

  return {
    default: {
      firestore: firestoreMock,
      apps: [{ name: "test" }],
    },
    firestore: firestoreMock,
  };
});

vi.mock("redis", () => {
  return {
    createClient: vi.fn().mockReturnValue({
      connect: vi.fn().mockResolvedValue(true),
      publish: mockRedisPublish,
      quit: vi.fn().mockResolvedValue(true),
      on: vi.fn(),
      isOpen: true,
    }),
  };
});

// Mock LLM
vi.mock("@google/genai", () => {
  return {
    Type: { OBJECT: "OBJECT", STRING: "STRING", ARRAY: "ARRAY" },
    GoogleGenAI: vi.fn().mockImplementation(() => {
      return {
        models: {
          generateContentStream: mockLLMGenerate,
        },
      };
    }),
  };
});

const app = express();
app.use(express.json());
// We will mount the worker route. It's likely we need to create it later.
// For now, if workerRoutes does not exist, this will throw an error and fail the test, which is fine for RED phase.
app.use("/api/internal/worker", workerRouter);

describe("Phase 2: POST /api/internal/worker/roast (RED Tests)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should claim the job via runTransaction, execute the LLM, and stream to a Redis Pub/Sub mock", async () => {
    // 1. Mock runTransaction to simulate the job is available
    mockTransactionGet.mockResolvedValue({
      exists: true,
      data: () => ({ status: "pending", leased_until: null }),
    });

    // 2. Mock LLM to return a stream of chunks
    async function* asyncGenerator() {
      yield { text: "Hello " };
      yield { text: "World" };
    }
    mockLLMGenerate.mockReturnValue(asyncGenerator());

    const response = await request(app)
      .post("/api/internal/worker/roast")
      .send({ jobId: "test-job-123" });

    // Ensure it returns 200 OK
    expect(response.status).toBe(200);

    // Ensure it claimed the job via transaction
    expect(mockTransactionGet).toHaveBeenCalled();
    expect(mockTransactionUpdate).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        status: "processing",
        leased_until: expect.anything(), // leased_until timestamp
      }),
    );

    // Ensure LLM was called
    expect(mockLLMGenerate).toHaveBeenCalled();

    // Ensure it streamed chunks to Redis
    // Channel name is likely 'job:test-job-123'
    expect(mockRedisPublish).toHaveBeenCalledWith(
      "job:test-job-123",
      expect.stringContaining("Hello"),
    );
    expect(mockRedisPublish).toHaveBeenCalledWith(
      "job:test-job-123",
      expect.stringContaining("World"),
    );
  });

  it("should return 200 OK immediately if the job is already completed (idempotency)", async () => {
    // 1. Mock runTransaction to simulate the job is already done
    mockTransactionGet.mockResolvedValue({
      exists: true,
      data: () => ({ status: "completed" }),
    });

    const response = await request(app)
      .post("/api/internal/worker/roast")
      .send({ jobId: "test-job-already-done" });

    // Must return 200 to prevent Cloud Tasks from retrying
    expect(response.status).toBe(200);

    // Must NOT execute LLM or Redis publish
    expect(mockLLMGenerate).not.toHaveBeenCalled();
    expect(mockRedisPublish).not.toHaveBeenCalled();
  });
});
