import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

const redisMock = {
  subscribe: vi.fn(),
  on: vi.fn(),
  publish: vi.fn(),
  xadd: vi.fn(),
  xread: vi.fn(),
};

vi.mock("ioredis", () => {
  return {
    default: vi.fn().mockImplementation(() => redisMock),
  };
});

describe("sse", () => {
  let publishSseEvent: any;
  let sseEndpoint: any;
  let messageHandler: any;

  beforeEach(async () => {
    vi.resetModules();
    vi.clearAllMocks();
    vi.useFakeTimers();

    // Capture the pubSub.on("message") handler
    redisMock.on.mockImplementation((event: string, handler: any) => {
      if (event === "message") {
        messageHandler = handler;
      }
    });

    const sse = await import("../../server/sse");
    publishSseEvent = sse.publishSseEvent;
    sseEndpoint = sse.sseEndpoint;
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe("publishSseEvent", () => {
    it("should add to redis stream and publish to pubsub", async () => {
      await publishSseEvent("job123", "progress", { percentage: 50 });

      expect(redisMock.xadd).toHaveBeenCalledWith(
        "job_stream",
        "MAXLEN",
        "~",
        1000,
        "*",
        "event",
        "progress",
        "data",
        JSON.stringify({ jobId: "job123", percentage: 50 }),
      );

      expect(redisMock.publish).toHaveBeenCalledWith(
        "sse_events",
        JSON.stringify({
          eventName: "progress",
          data: { jobId: "job123", percentage: 50 },
        }),
      );
    });
  });

  describe("sseEndpoint", () => {
    it("should set correct headers and handle heartbeats", async () => {
      const writeMock = vi.fn();
      const setHeaderMock = vi.fn();
      const reqMock = { headers: {}, on: vi.fn() };
      const resMock = { setHeader: setHeaderMock, write: writeMock };

      await sseEndpoint(reqMock, resMock);

      expect(setHeaderMock).toHaveBeenCalledWith(
        "Content-Type",
        "text/event-stream",
      );
      expect(setHeaderMock).toHaveBeenCalledWith("Cache-Control", "no-cache");
      expect(setHeaderMock).toHaveBeenCalledWith("Connection", "keep-alive");

      // Fast-forward 15 seconds to trigger heartbeat
      vi.advanceTimersByTime(15000);
      expect(writeMock).toHaveBeenCalledWith(":\n\n");

      // Verify connection close cleanup
      expect(reqMock.on).toHaveBeenCalledWith("close", expect.any(Function));

      const closeHandler = reqMock.on.mock.calls[0][1];
      closeHandler(); // Manually close to trigger cleanup

      writeMock.mockClear();
      vi.advanceTimersByTime(15000);
      expect(writeMock).not.toHaveBeenCalled(); // heartbeat should be stopped
    });

    it("should replay events if last-event-id is provided", async () => {
      const writeMock = vi.fn();
      const setHeaderMock = vi.fn();
      const reqMock = { headers: { "last-event-id": "12345-0" }, on: vi.fn() };
      const resMock = { setHeader: setHeaderMock, write: writeMock };

      redisMock.xread.mockResolvedValue([
        [
          "job_stream",
          [["12345-1", ["event", "progress", "data", '{"status":"done"}']]],
        ],
      ]);

      await sseEndpoint(reqMock, resMock);

      expect(redisMock.xread).toHaveBeenCalledWith(
        "STREAMS",
        "job_stream",
        "12345-0",
      );
      expect(writeMock).toHaveBeenCalledWith(
        'id: 12345-1\nevent: progress\ndata: {"status":"done"}\n\n',
      );
    });

    it("should broadcast messages to active clients when pubSub receives a message", async () => {
      const writeMock1 = vi.fn();
      const writeMock2 = vi.fn();

      await sseEndpoint(
        { headers: {}, on: vi.fn() },
        { setHeader: vi.fn(), write: writeMock1 },
      );
      await sseEndpoint(
        { headers: {}, on: vi.fn() },
        { setHeader: vi.fn(), write: writeMock2 },
      );

      // Trigger pubsub message
      messageHandler(
        "sse_events",
        JSON.stringify({ eventName: "test_event", data: { foo: "bar" } }),
      );

      const expectedMessage = `event: test_event\ndata: {"foo":"bar"}\n\n`;
      expect(writeMock1).toHaveBeenCalledWith(expectedMessage);
      expect(writeMock2).toHaveBeenCalledWith(expectedMessage);
    });

    it("should handle xread errors gracefully", async () => {
      const writeMock = vi.fn();
      const reqMock = { headers: { "last-event-id": "bad-id" }, on: vi.fn() };
      const resMock = { setHeader: vi.fn(), write: writeMock };

      const consoleErrorSpy = vi
        .spyOn(console, "error")
        .mockImplementation(() => {});
      redisMock.xread.mockRejectedValue(new Error("Redis error"));

      await sseEndpoint(reqMock, resMock);

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        "Error resuming from stream",
        expect.any(Error),
      );
      consoleErrorSpy.mockRestore();
    });
  });
});
