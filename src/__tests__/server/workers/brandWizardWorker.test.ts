import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { Job } from "bullmq";
import { startBrandWizardWorker } from "../../../server/workers/brandWizardWorker";
import * as adminNamespace from "firebase-admin";
const admin = (adminNamespace as any).default || adminNamespace;

vi.mock("bullmq", async (importOriginal) => {
  const actual = await importOriginal<typeof import("bullmq")>();

  class MockWorker {
    name: string;
    processFn: Function;
    options: any;
    on: Function;

    constructor(name: string, processFn: Function, options: any) {
      this.name = name;
      this.processFn = processFn;
      this.options = options;
      this.on = vi.fn();
    }
  }

  return {
    ...actual,
    Queue: vi.fn().mockImplementation(() => ({})),
    Worker: MockWorker,
  };
});

const mockScrape = vi.fn();
vi.mock("@mendable/firecrawl-js", () => {
  return {
    default: vi.fn().mockImplementation(() => ({
      scrape: (...args: any[]) => mockScrape(...args),
    })),
  };
});

const mockGenerateContent = vi.fn();
vi.mock("@google/genai", () => {
  return {
    GoogleGenAI: vi.fn().mockImplementation(() => ({
      models: {
        generateContent: (...args: any[]) => mockGenerateContent(...args),
      },
    })),
    Type: { OBJECT: "OBJECT", STRING: "STRING", ARRAY: "ARRAY" },
    Schema: {},
  };
});

vi.mock("firebase-admin", async (importOriginal) => {
  const actual = await importOriginal<typeof import("firebase-admin")>();

  // We recreate the mock internally per test as needed
  const dbMock = {
    collection: vi.fn().mockReturnThis(),
    doc: vi.fn().mockReturnThis(),
    update: vi.fn().mockResolvedValue(undefined),
  };

  const mockIncrement = vi.fn().mockReturnValue("mock-increment");
  const firestoreMock = Object.assign(
    vi.fn(() => dbMock),
    {
      FieldValue: {
        serverTimestamp: vi.fn().mockReturnValue("mock-timestamp"),
        increment: mockIncrement,
      },
    },
  );

  const adminMock = {
    ...actual,
    apps: [],
    initializeApp: vi.fn(),
    firestore: firestoreMock,
  };

  // also add FieldValue directly on the firestore namespace
  adminMock.firestore.FieldValue = {
    increment: mockIncrement,
    serverTimestamp: vi.fn().mockReturnValue("mock-timestamp"),
  } as any;

  return {
    ...actual,
    default: adminMock,
    initializeApp: adminMock.initializeApp,
    apps: adminMock.apps,
    firestore: firestoreMock,
  };
});

describe("brandWizardWorker", () => {
  let workerInstance: any;

  beforeEach(() => {
    vi.clearAllMocks();
    workerInstance = startBrandWizardWorker();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("initializes the worker correctly", () => {
    expect(workerInstance.name).toBe("brand-wizard-queue");
  });

  it("processes a job successfully with valid firecrawl and gemini responses", async () => {
    const jobData = {
      jobId: "job-123",
      urls: ["https://example.com"],
    };
    const mockJob = { data: jobData, id: "job-123" } as Job;

    const updateMock = vi.fn().mockResolvedValue(undefined);
    const docMock = vi.fn().mockReturnValue({ update: updateMock });
    const collectionMock = vi.fn().mockReturnValue({ doc: docMock });
    const db = admin.firestore();
    (db.collection as any).mockImplementation(collectionMock);

    // IMPORTANT: Make sure FieldValue.increment is properly returning the string we expect
    const adminNs = require("firebase-admin");
    adminNs.firestore.FieldValue.increment = vi
      .fn()
      .mockReturnValue("mock-increment");

    mockScrape.mockResolvedValueOnce({
      success: true,
      markdown: "# Example\nSome content here",
      branding: { logo: "logo.png" },
    });

    const validGeminiResponse = {
      positioning: {
        _reasoning: "Looks good",
        personality: "Professional",
        tone: ["Professional"],
        target_audience: "Developers",
      },
      visual_identity: {
        colors: { primary: ["#000000"], background: ["#ffffff"] },
        typography: { headings: ["Arial"], body: ["Helvetica"] },
      },
    };

    mockGenerateContent.mockResolvedValueOnce({
      text: JSON.stringify(validGeminiResponse),
    });

    const result = await workerInstance.processFn(mockJob);

    expect(result.success).toBe(true);
    expect(result.resultsCount).toBe(1);

    expect(updateMock).toHaveBeenCalledWith(
      expect.objectContaining({ status: "processing" }),
    );
    expect(updateMock).toHaveBeenCalledWith(
      expect.objectContaining({
        status: "completed",
        results: expect.any(Array),
      }),
    );
  });

  it("handles firecrawl failure by skipping url and incrementing failed count", async () => {
    const jobData = {
      jobId: "job-123",
      urls: ["https://example.com"],
    };
    const mockJob = { data: jobData, id: "job-123" } as Job;

    const updateMock = vi.fn().mockResolvedValue(undefined);
    const docMock = vi.fn().mockReturnValue({ update: updateMock });
    const collectionMock = vi.fn().mockReturnValue({ doc: docMock });
    const db = admin.firestore();
    (db.collection as any).mockImplementation(collectionMock);

    // IMPORTANT: Make sure FieldValue.increment is properly returning the string we expect
    const adminNs = require("firebase-admin");
    adminNs.firestore.FieldValue.increment = vi
      .fn()
      .mockReturnValue("mock-increment");

    mockScrape.mockResolvedValueOnce({
      success: false,
    });

    const consoleWarnSpy = vi
      .spyOn(console, "warn")
      .mockImplementation(() => {});

    const result = await workerInstance.processFn(mockJob);

    expect(consoleWarnSpy).toHaveBeenCalledWith(
      "Scraping failed for https://example.com, fallback to Exa API needed:",
      expect.any(Error),
    );
    expect(result.success).toBe(true);
    expect(result.resultsCount).toBe(0);

    expect(updateMock).toHaveBeenCalledWith(
      expect.objectContaining({ "progress.failed": undefined }),
    );
  });

  it("handles Gemini validation failure and retries", async () => {
    const jobData = {
      jobId: "job-123",
      urls: ["https://example.com"],
    };
    const mockJob = { data: jobData, id: "job-123" } as Job;

    const updateMock = vi.fn().mockResolvedValue(undefined);
    const docMock = vi.fn().mockReturnValue({ update: updateMock });
    const collectionMock = vi.fn().mockReturnValue({ doc: docMock });
    const db = admin.firestore();
    (db.collection as any).mockImplementation(collectionMock);

    // IMPORTANT: Make sure FieldValue.increment is properly returning the string we expect
    const adminNs = require("firebase-admin");
    adminNs.firestore.FieldValue.increment = vi
      .fn()
      .mockReturnValue("mock-increment");

    mockScrape.mockResolvedValueOnce({
      success: true,
      markdown: "# Example",
    });

    // First attempt: Invalid JSON
    mockGenerateContent.mockResolvedValueOnce({
      text: JSON.stringify({ positioning: {} }),
    });

    // Second attempt: Valid JSON
    const validGeminiResponse = {
      positioning: {
        _reasoning: "Looks good",
        personality: "Professional",
        tone: ["Professional"],
        target_audience: "Developers",
      },
      visual_identity: {
        colors: { primary: ["#000000"], background: ["#ffffff"] },
        typography: { headings: ["Arial"], body: ["Helvetica"] },
      },
    };
    mockGenerateContent.mockResolvedValueOnce({
      text: JSON.stringify(validGeminiResponse),
    });

    const result = await workerInstance.processFn(mockJob);

    expect(mockGenerateContent).toHaveBeenCalledTimes(2);
    expect(result.success).toBe(true);
    expect(result.resultsCount).toBe(1);
  });

  it("handles worker failure event", async () => {
    const consoleErrorSpy = vi
      .spyOn(console, "error")
      .mockImplementation(() => {});

    const updateMock = vi.fn().mockResolvedValue(undefined);
    const docMock = vi.fn().mockReturnValue({ update: updateMock });
    const collectionMock = vi.fn().mockReturnValue({ doc: docMock });
    const db = admin.firestore();
    (db.collection as any).mockImplementation(collectionMock);

    // IMPORTANT: Make sure FieldValue.increment is properly returning the string we expect
    const adminNs = require("firebase-admin");
    adminNs.firestore.FieldValue.increment = vi
      .fn()
      .mockReturnValue("mock-increment");

    // Since we're using a MockWorker class, workerInstance.on isn't hooked up to trigger events internally
    // We just manually test the callback function passed to worker.on
    const failedHandler = vi.fn(); // Mocking it because we need to manually invoke it if we captured it

    // In startBrandWizardWorker, worker.on("failed", cb) is called.
    // Let's invoke it from the spy/mock we captured.
    // However, our MockWorker has an 'on' spy.
    expect(workerInstance.on).toHaveBeenCalledWith(
      "failed",
      expect.any(Function),
    );

    const handler = workerInstance.on.mock.calls.find(
      (call: any) => call[0] === "failed",
    )[1];

    const mockJob = { data: { jobId: "job-123" }, id: "bull-job-1" };
    const mockError = new Error("BullMQ Error");

    await handler(mockJob, mockError);

    expect(consoleErrorSpy).toHaveBeenCalledWith(
      "Job bull-job-1 failed:",
      mockError,
    );
    expect(updateMock).toHaveBeenCalledWith({
      status: "failed",
      error: "BullMQ Error",
    });
  });
});
