import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

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

    // Mock fetch for the mock execution block
    global.fetch = vi.fn(() => Promise.resolve({ ok: true } as Response));
  });

  afterEach(() => {
    process.env = originalEnv;
    vi.restoreAllMocks();
  });

  describe("Mock Execution (Test Env / SIMULATE_CLOUD_TASKS)", () => {
    it("should enqueue mock task using fetch in test env", async () => {
      process.env.NODE_ENV = "test";
      process.env.PORT = "4000";

      vi.useFakeTimers();

      const consoleLogSpy = vi
        .spyOn(console, "log")
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

      // Fast-forward setTimeout
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

      vi.useRealTimers();
    });

    it("should enqueue mock task when SIMULATE_CLOUD_TASKS is true", async () => {
      process.env.NODE_ENV = "development";
      process.env.SIMULATE_CLOUD_TASKS = "true";
      delete process.env.PORT; // Test fallback PORT

      vi.useFakeTimers();

      await enqueueTask(QUEUE_NAMES.networkIo, "/api/test", { data: 2 }, 5);

      vi.advanceTimersByTime(5000 + 100);

      expect(global.fetch).toHaveBeenCalledTimes(1);
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining("http://127.0.0.1:3000/api/test"),
        expect.objectContaining({
          body: JSON.stringify({ data: 2 }),
        }),
      );

      vi.useRealTimers();
    });

    it("should catch and log fetch error in mock execution", async () => {
      process.env.NODE_ENV = "test";

      vi.useFakeTimers();

      const consoleErrorSpy = vi
        .spyOn(console, "error")
        .mockImplementation(() => {});
      global.fetch = vi.fn(() => Promise.reject(new Error("Fetch failed")));

      await enqueueTask(QUEUE_NAMES.networkIo, "/api/test", { data: 3 });

      vi.runAllTimers();

      // Wait a tick for the unhandled promise rejection to process
      await Promise.resolve();
      await Promise.resolve();

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        "Mock Task execution failed:",
        expect.any(Error),
      );

      vi.useRealTimers();
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

    it("should enqueue a real Cloud Task", async () => {
      mockQueuePath.mockReturnValue(
        "projects/demo-nicheai/locations/us-central1/queues/network-io-queue",
      );
      mockCreateTask.mockResolvedValue([{ name: "test-task-name" }]);
      const consoleLogSpy = vi
        .spyOn(console, "log")
        .mockImplementation(() => {});

      const result = await enqueueTask(QUEUE_NAMES.networkIo, "/api/test", {
        data: 4,
      });

      // Based on how the module is imported, it uses fallback values "demo-nicheai" and "us-central1"
      // because GOOGLE_CLOUD_PROJECT / REGION are set at module load time.
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

    it("should enqueue a real Cloud Task without CLOUD_RUN_URL", async () => {
      delete process.env.CLOUD_RUN_URL;
      mockQueuePath.mockReturnValue(
        "projects/demo-nicheai/locations/us-central1/queues/network-io-queue",
      );
      mockCreateTask.mockResolvedValue([
        { name: "test-task-name-default-url" },
      ]);

      await enqueueTask(QUEUE_NAMES.networkIo, "/api/test", { data: 5 });

      expect(mockCreateTask).toHaveBeenCalledWith({
        parent:
          "projects/demo-nicheai/locations/us-central1/queues/network-io-queue",
        task: expect.objectContaining({
          httpRequest: expect.objectContaining({
            url: "https://demo-nicheai.run.app/api/test", // Fallback behavior
          }),
        }),
      });
    });

    it("should enqueue a real Cloud Task with delaySeconds", async () => {
      mockQueuePath.mockReturnValue(
        "projects/demo-nicheai/locations/us-central1/queues/network-io-queue",
      );
      mockCreateTask.mockResolvedValue([{ name: "test-task-name-delay" }]);
      const now = Date.now();
      vi.spyOn(Date, "now").mockReturnValue(now);

      await enqueueTask(QUEUE_NAMES.networkIo, "/api/test", { data: 6 }, 10);

      expect(mockCreateTask).toHaveBeenCalledWith({
        parent:
          "projects/demo-nicheai/locations/us-central1/queues/network-io-queue",
        task: expect.objectContaining({
          scheduleTime: {
            seconds: 10 + now / 1000,
          },
        }),
      });

      vi.restoreAllMocks();
    });

    it("should log and throw error if createTask fails", async () => {
      mockQueuePath.mockReturnValue(
        "projects/demo-nicheai/locations/us-central1/queues/network-io-queue",
      );
      const error = new Error("Task creation failed");
      mockCreateTask.mockRejectedValue(error);
      const consoleErrorSpy = vi
        .spyOn(console, "error")
        .mockImplementation(() => {});

      await expect(
        enqueueTask(QUEUE_NAMES.networkIo, "/api/test", { data: 7 }),
      ).rejects.toThrow("Task creation failed");

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        "Error creating task in queue network-io-queue:",
        error,
      );
    });
  });
});
