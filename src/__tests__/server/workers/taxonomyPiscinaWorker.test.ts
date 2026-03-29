import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import recalculateMarketScores from "../../../server/workers/taxonomyPiscinaWorker";
import * as adminNamespace from "firebase-admin";
const admin = (adminNamespace as any).default || adminNamespace;

vi.mock("firebase-admin", async (importOriginal) => {
  const actual = await importOriginal<typeof import("firebase-admin")>();
  const dbMock = {
    collection: vi.fn().mockReturnThis(),
    doc: vi.fn().mockReturnThis(),
    get: vi.fn().mockReturnThis(),
    update: vi.fn().mockResolvedValue(undefined),
    add: vi.fn().mockResolvedValue(undefined),
  };
  const firestoreMock = Object.assign(
    vi.fn(() => dbMock),
    {
      FieldValue: {
        serverTimestamp: vi.fn().mockReturnValue("mock-timestamp"),
      },
    },
  );

  const adminMock = {
    ...actual,
    apps: [],
    initializeApp: vi.fn(),
    firestore: firestoreMock,
  };

  // Add FieldValue directly on the firestore namespace to ensure admin.firestore.FieldValue works
  adminMock.firestore.FieldValue = {
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

describe("taxonomyPiscinaWorker", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("initializes firebase admin if no apps exist", async () => {
    const db = admin.firestore();
    (
      db.collection("taxonomy_merge_events").doc().get as any
    ).mockResolvedValueOnce({
      exists: true,
    });

    await recalculateMarketScores({ eventId: "event-1", proposalId: "prop-1" });

    expect(admin.initializeApp).toHaveBeenCalled();
  });

  it("returns early if event does not exist", async () => {
    const db = admin.firestore();
    const docMock = vi.fn().mockReturnValue({
      get: vi.fn().mockResolvedValue({ exists: false }),
      update: vi.fn(),
    });
    (db.collection as any).mockReturnValue({ doc: docMock });

    const result = await recalculateMarketScores({
      eventId: "event-2",
      proposalId: "prop-2",
    });

    expect(result).toBeUndefined();
    expect(docMock("event-2").update).not.toHaveBeenCalled();
  });

  it("processes event and sends notification successfully", async () => {
    const db = admin.firestore();
    const updateMock = vi.fn().mockResolvedValue(undefined);
    const docMock = vi.fn().mockReturnValue({
      get: vi.fn().mockResolvedValue({ exists: true }),
      update: updateMock,
    });
    (db.collection as any).mockReturnValue({
      doc: docMock,
      add: vi.fn().mockResolvedValue(undefined),
    });

    // Monkey patch FieldValue for this test to ensure serverTimestamp is caught
    (admin as any).firestore.FieldValue = {
      serverTimestamp: vi.fn().mockReturnValue("mock-timestamp"),
    };

    const result = await recalculateMarketScores({
      eventId: "event-3",
      proposalId: "prop-3",
    });

    expect(result).toEqual({ success: true });

    expect(updateMock).toHaveBeenCalledWith({
      status: "processed",
      processedAt: "mock-timestamp",
    });
  });

  it("throws error and logs to console if operation fails", async () => {
    const consoleErrorSpy = vi
      .spyOn(console, "error")
      .mockImplementation(() => {});
    const db = admin.firestore();
    const mockError = new Error("DB Failure");

    const docMock = vi.fn().mockReturnValue({
      get: vi.fn().mockRejectedValue(mockError),
    });
    (db.collection as any).mockReturnValue({ doc: docMock });

    await expect(
      recalculateMarketScores({ eventId: "event-4", proposalId: "prop-4" }),
    ).rejects.toThrow("DB Failure");

    expect(consoleErrorSpy).toHaveBeenCalledWith("Worker error:", mockError);
  });
});
