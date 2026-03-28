import { Request, Response } from "express";
import Redis from "ioredis";

const redis = new Redis(process.env.REDIS_URL || "redis://127.0.0.1:6379");

// Pub/Sub for local broadcasting across processes
const pubSub = new Redis(process.env.REDIS_URL || "redis://127.0.0.1:6379");
pubSub.subscribe("sse_events");

// Maintain active connections
const clients: Set<Response> = new Set();

pubSub.on("message", (channel, message) => {
  if (channel === "sse_events") {
    const { eventName, data } = JSON.parse(message);
    const sseMessage = `event: ${eventName}\ndata: ${JSON.stringify(data)}\n\n`;
    for (const client of clients) {
      client.write(sseMessage);
    }
  }
});

// Function to publish events to Redis Streams AND PubSub
/**
 *
 */
export const publishSseEvent = async (
  jobId: string,
  eventName: string,
  payload: any,
) => {
  const data = { jobId, ...payload };

  // 1. Add to Redis Stream for State Resumption
  // XADD with MAXLEN to prevent OOM
  await redis.xadd(
    "job_stream",
    "MAXLEN",
    "~",
    1000,
    "*",
    "event",
    eventName,
    "data",
    JSON.stringify(data),
  );

  // 2. Publish to active clients
  pubSub.publish("sse_events", JSON.stringify({ eventName, data }));
};

/**
 *
 */
export const sseEndpoint = async (req: Request, res: Response) => {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  // Load Balancer connection drop prevention - Heartbeat every 15s
  const heartbeatInterval = setInterval(() => {
    res.write(":\n\n"); // SSE Comment (ignored by clients but keeps connection alive)
  }, 15000);

  // Replay from Last-Event-ID if provided
  const lastEventId = req.headers["last-event-id"];
  if (lastEventId) {
    try {
      // Fetch missed events from the Redis stream
      const events = await redis.xread(
        "STREAMS",
        "job_stream",
        lastEventId as string,
      );
      if (events) {
        const [, entries] = events[0];
        for (const [id, fields] of entries) {
          const eventMap = new Map();
          for (let i = 0; i < fields.length; i += 2) {
            eventMap.set(fields[i], fields[i + 1]);
          }
          const eventName = eventMap.get("event");
          const data = eventMap.get("data");

          res.write(`id: ${id}\nevent: ${eventName}\ndata: ${data}\n\n`);
        }
      }
    } catch (e) {
      console.error("Error resuming from stream", e);
    }
  }

  clients.add(res);

  req.on("close", () => {
    clearInterval(heartbeatInterval);
    clients.delete(res);
  });
};
