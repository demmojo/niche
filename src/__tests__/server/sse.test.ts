import { describe, it, expect, vi, beforeEach } from "vitest";
import admin from "firebase-admin";

vi.mock("firebase-admin", () => {
  const addMock = vi.fn().mockResolvedValue({ id: "123" });
  const dbMock = {
    collection: vi.fn(() => ({
      add: addMock,
    })),
  };
  return {
    default: {
      firestore: Object.assign(() => dbMock, {
        FieldValue: {
          serverTimestamp: vi.fn().mockReturnValue("SERVER_TIMESTAMP"),
        },
      }),
    },
  };
});

describe("sse", () => {
  let publishSseEvent: any;
  let sseEndpoint: any;

  beforeEach(async () => {
    vi.clearAllMocks();
    const sse = await import("../../server/sse");
    publishSseEvent = sse.publishSseEvent;
    sseEndpoint = sse.sseEndpoint;
  });

  describe("publishSseEvent", () => {
    it("should write to Firestore", async () => {
      await publishSseEvent("job123", "progress", { percentage: 50 });

      expect(admin.firestore().collection).toHaveBeenCalledWith("sse_events");
      const collectionMock = admin.firestore().collection("sse_events");
      expect(collectionMock.add).toHaveBeenCalledWith({
        jobId: "job123",
        eventName: "progress",
        data: { percentage: 50 },
        timestamp: "SERVER_TIMESTAMP",
      });
    });

    it("should handle errors gracefully", async () => {
      const consoleErrorSpy = vi
        .spyOn(console, "error")
        .mockImplementation(() => {});
      const collectionMock = admin.firestore().collection("sse_events");
      (collectionMock.add as any).mockRejectedValueOnce(
        new Error("Firestore error"),
      );

      await publishSseEvent("job123", "progress", { percentage: 50 });

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        "Failed to publish SSE event to Firestore",
        expect.any(Error),
      );
      consoleErrorSpy.mockRestore();
    });
  });

  describe("sseEndpoint", () => {
    it("should return 410 Gone", async () => {
      const jsonMock = vi.fn();
      const statusMock = vi.fn().mockReturnValue({ json: jsonMock });
      const reqMock = {};
      const resMock = { status: statusMock };

      await sseEndpoint(reqMock, resMock);

      expect(statusMock).toHaveBeenCalledWith(410);
      expect(jsonMock).toHaveBeenCalledWith({
        error:
          "SSE is deprecated in Serverless mode. Use Firestore onSnapshot.",
      });
    });
  });
});
