import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { logger } from "../../server/logger";

const { mockCreateTask, mockQueuePath } = vi.hoisted(() => ({
  mockCreateTask: vi.fn(),
  mockQueuePath: vi.fn(),
}));

vi.mock("@google-cloud/tasks", () => {
  return {
    CloudTasksClient: vi.fn(() => ({
      createTask: mockCreateTask,
      queuePath: mockQueuePath,
    })),
  };
});

import { enqueueTask, QUEUE_NAMES } from "../../server/cloudTasks";

describe("cloudTasks", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.resetModules();
    process.env = { ...originalEnv };
    vi.clearAllMocks();
    vi.useFakeTimers();

    global.fetch = vi.fn().mockImplementation(() =>
      Promise.resolve({
        ok: true,
        clone: function () {
          return this;
        },
      } as any),
    );
  });

  afterEach(() => {
    process.env = originalEnv;
    vi.runOnlyPendingTimers();
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  describe("Mock Execution (Test Env / SIMULATE_CLOUD_TASKS)", () => {
    it("should enqueue mock task using fetch in test env", async () => {
      process.env.NODE_ENV = "test";
      process.env.PORT = "4000";

      const consoleLogSpy = vi
        .spyOn(logger, "info")
        .mockImplementation(() => {});

      const result = await enqueueTask(
        QUEUE_NAMES.networkIo,
        "/api/test",
        { data: 1 },
        0,
      );
      expect(result).toBeUndefined();

      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining(
          "[Cloud Tasks Mock] Enqueuing network-io-queue -> /api/test",
        ),
      );

      vi.runAllTimers();

      expect(global.fetch).toHaveBeenCalledTimes(1);
      expect(global.fetch).toHaveBeenCalledWith(
        "http://127.0.0.1:4000/api/test",
        expect.objectContaining({
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: "Bearer MOCK_INTERNAL_TOKEN",
          },
          body: JSON.stringify({ data: 1 }),
        }),
      );
    });

    it("should enqueue mock task when SIMULATE_CLOUD_TASKS is true", async () => {
      process.env.NODE_ENV = "development";
      process.env.SIMULATE_CLOUD_TASKS = "true";
      delete process.env.PORT; // Test fallback PORT

      await enqueueTask(QUEUE_NAMES.networkIo, "/api/test", { data: 2 }, 5);

      vi.advanceTimersByTime(5000 + 100);

      expect(global.fetch).toHaveBeenCalledTimes(1);
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining("http://127.0.0.1:3000/api/test"),
        expect.objectContaining({
          body: JSON.stringify({ data: 2 }),
        }),
      );
    });

    it("should catch and log fetch error in mock execution", async () => {
      process.env.NODE_ENV = "test";

      const consoleErrorSpy = vi
        .spyOn(logger, "error")
        .mockImplementation(() => {});
      global.fetch = vi
        .fn()
        .mockImplementation(() => Promise.reject(new Error("Fetch failed")));

      await enqueueTask(QUEUE_NAMES.networkIo, "/api/test", { data: 3 });

      vi.runAllTimers();

      await Promise.resolve();
      await Promise.resolve();
      await Promise.resolve();

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        "Mock Task execution failed:",
        expect.any(Error),
      );
    });
  });

  describe("Real Execution (Production Env)", () => {
    beforeEach(() => {
      process.env.NODE_ENV = "production";
      process.env.SIMULATE_CLOUD_TASKS = "false";
      process.env.CLOUD_RUN_URL = "https://test-run-url.app";
      process.env.CLOUD_RUN_SA_EMAIL =
        "test-sa@test-project.iam.gserviceaccount.com";
    });

    it("should throw if payload exceeds 100KB limit", async () => {
      const largeData = "x".repeat(105 * 1024);
      await expect(
        enqueueTask(QUEUE_NAMES.networkIo, "/api/test", { data: largeData }),
      ).rejects.toThrow("Payload size exceeds Cloud Tasks limit of 100KB.");
    });

    it("should enqueue a real Cloud Task", async () => {
      mockQueuePath.mockReturnValue(
        "projects/demo-nicheai/locations/us-central1/queues/network-io-queue",
      );
      mockCreateTask.mockResolvedValue([{ name: "test-task-name" }]);
      const consoleLogSpy = vi
        .spyOn(logger, "info")
        .mockImplementation(() => {});

      const result = await enqueueTask(QUEUE_NAMES.networkIo, "/api/test", {
        data: 4,
      });

      expect(mockQueuePath).toHaveBeenCalledWith(
        "demo-nicheai",
        "us-central1",
        "network-io-queue",
      );

      expect(mockCreateTask).toHaveBeenCalledWith({
        parent:
          "projects/demo-nicheai/locations/us-central1/queues/network-io-queue",
        task: {
          httpRequest: {
            httpMethod: "POST",
            url: "https://test-run-url.app/api/test",
            headers: {
              "Content-Type": "application/json",
            },
            oidcToken: {
              serviceAccountEmail:
                "test-sa@test-project.iam.gserviceaccount.com",
            },
            body: Buffer.from(JSON.stringify({ data: 4 })).toString("base64"),
          },
        },
      });

      expect(consoleLogSpy).toHaveBeenCalledWith(
        "Created task test-task-name in queue network-io-queue",
      );
      expect(result).toEqual({ name: "test-task-name" });
    });
  });
});
