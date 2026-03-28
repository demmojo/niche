import { v4 as uuidv4 } from "uuid";

export interface TelemetryEvent {
  eventId: string;
  schemaVersion: "v1";
  projectId?: string;
  actorType: "human" | "agent" | "system";
  eventName: string;
  [key: string]: any;
}

export class TelemetryBatcher {
  private queue: TelemetryEvent[] = [];
  private batchSize = 20;
  private intervalId: ReturnType<typeof setInterval> | null = null;
  private releaseFns: Array<() => void> = [];

  constructor() {
    if (typeof window === "undefined") return;

    this.intervalId = setInterval(() => this.flush(), 5000);

    const handleVisibility = () => {
      if (document.visibilityState === "hidden") this.flush(true);
    };

    window.addEventListener("visibilitychange", handleVisibility);

    this.releaseFns.push(() => {
      window.removeEventListener("visibilitychange", handleVisibility);
    });
  }

  private getActorType(): "human" | "agent" | "system" {
    // Check global flag injected by agent browsers
    if (typeof window !== "undefined" && (window as any).__AGENT_SESSION__) {
      return "agent";
    }
    return "human";
  }

  public track(eventName: string, payload: Record<string, any>) {
    // State updates must be synchronous
    this.queue.push({
      eventId: uuidv4(),
      schemaVersion: "v1",
      actorType: this.getActorType(),
      eventName,
      ...payload,
    });

    if (this.queue.length >= this.batchSize) {
      if (typeof window !== "undefined" && "requestIdleCallback" in window) {
        window.requestIdleCallback(() => this.flush(), { timeout: 500 });
      } else {
        setTimeout(() => this.flush(), 0);
      }
    }
  }

  public flush(isUnloading = false) {
    if (this.queue.length === 0) return;

    // Synchronously extract and clear to prevent concurrent flush races
    const payloadData = this.queue;
    this.queue = [];

    const payloadString = JSON.stringify(payloadData);

    // Fetch keepalive has a strict 64KB limit. Disable if payload is too large.
    let useKeepAlive = isUnloading;
    if (isUnloading) {
      const isUnderQuota = new Blob([payloadString]).size < 60000;
      useKeepAlive = isUnderQuota;
    }

    import("../firebase").then(({ auth }) => {
      auth.currentUser
        ?.getIdToken()
        .then((idToken) => {
          fetch("/api/v1/ui-sync", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${idToken}`,
            },
            body: payloadString,
            keepalive: useKeepAlive,
          }).catch((error) => {
            console.debug("Telemetry flush dropped:", error);
          });
        })
        .catch((error) => {
          console.debug("Telemetry flush dropped (auth error):", error);
        });
    });
  }

  public dispose() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    for (const release of this.releaseFns) {
      release();
    }
    this.releaseFns.length = 0;

    this.flush(true);
  }
}

// Module-level singleton is often safer than Context for pure telemetry
export const telemetry = new TelemetryBatcher();
