import { v4 as uuidv4 } from "uuid";
import { TelemetryEventV1 } from "../types/telemetry";

export class TelemetryBatcher {
  private queue: TelemetryEventV1[] = [];
  private isDisposed = false;
  private flushTimeout: ReturnType<typeof setTimeout> | null = null;
  private endpoint = "/api/v1/ui-sync";

  constructor() {
    this.setupListeners();
  }

  private setupListeners() {
    if (typeof window !== "undefined") {
      window.addEventListener("visibilitychange", this.handleVisibilityChange);
    }
  }

  private handleVisibilityChange = () => {
    if (document.visibilityState === "hidden") {
      this.flushSync();
    }
  };

  /**
   * Pushes an event into the queue. Flushes asynchronously via requestIdleCallback.
   */
  public push(
    event: Omit<
      TelemetryEventV1,
      "eventId" | "schemaVersion" | "clientTimestamp"
    >,
  ) {
    if (this.isDisposed) return;

    // Safety: Sanitize __AGENT_SESSION__ logic
    const isAgent =
      typeof window !== "undefined" &&
      (window as any).__AGENT_SESSION__ === true;

    this.queue.push({
      ...event,
      eventId: uuidv4(),
      schemaVersion: "v1",
      actorType: event.actorType || (isAgent ? "agent" : "human"),
      clientTimestamp: Date.now(),
    });

    this.scheduleFlush();
  }

  private scheduleFlush() {
    if (this.flushTimeout) return;

    if (typeof window !== "undefined" && "requestIdleCallback" in window) {
      window.requestIdleCallback(() => {
        this.flush();
      });
    } else {
      this.flushTimeout = setTimeout(() => {
        this.flush();
        this.flushTimeout = null;
      }, 1000);
    }
  }

  private async flush() {
    if (this.queue.length === 0) return;

    const eventsToFlush = [...this.queue];
    this.queue = [];

    try {
      const response = await fetch(this.endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ events: eventsToFlush }),
        keepalive: true,
      });

      if (!response.ok && response.status !== 400) {
        // Silently drop 400s (invalid payload) but retry on 500s or network issues by putting them back
        // In a strict MVP, dropping errors is fine, but we can log locally.
        console.warn(`Telemetry flush failed with status: ${response.status}`);
      }
    } catch (error) {
      console.warn("Network error during telemetry flush", error);
      // Re-queue if we want, but MVP says keep it simple and drop them if too complex.
    }
  }

  private flushSync() {
    if (this.queue.length === 0) return;
    const eventsToFlush = [...this.queue];
    this.queue = [];

    if (
      typeof window !== "undefined" &&
      "navigator" in window &&
      navigator.sendBeacon
    ) {
      navigator.sendBeacon(
        this.endpoint,
        new Blob([JSON.stringify({ events: eventsToFlush })], {
          type: "application/json",
        }),
      );
    } else {
      fetch(this.endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ events: eventsToFlush }),
        keepalive: true,
      }).catch(() => {});
    }
  }

  public dispose() {
    this.isDisposed = true;
    if (typeof window !== "undefined") {
      window.removeEventListener(
        "visibilitychange",
        this.handleVisibilityChange,
      );
    }
    if (this.flushTimeout) {
      clearTimeout(this.flushTimeout);
      this.flushTimeout = null;
    }
    this.flushSync();
  }
}

// Global instance for simple imports across the app
export const telemetry = new TelemetryBatcher();
