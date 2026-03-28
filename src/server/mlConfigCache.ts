import * as adminNamespace from "firebase-admin";
const admin: typeof adminNamespace =
  (adminNamespace as any).default || adminNamespace;
import PQueue from "p-queue";

// Ensure app is initialized before calling firestore
if (!admin.apps.length) {
  admin.initializeApp();
}

/**
 * SCD Type 2 ML Config Data Model
 */
export interface MLConfigVersion {
  configId: string;
  version: number;
  status: "draft" | "evaluating" | "champion" | "archived";
  tier: "Lite" | "Fast" | "Pro";
  modelParams: {
    model:
      | "gemini-3.1-flash-lite-preview"
      | "gemini-3.1-flash"
      | "gemini-3.1-pro-preview";
    temperature: number;
    topP: number;
  };
  promptTemplate: any; // CO-STAR template
  mabWeight?: number; // Contextual Queueing Bandits dynamic weight
  validFrom: adminNamespace.firestore.Timestamp;
  validTo: adminNamespace.firestore.Timestamp | null;
}

export interface TelemetryEvent {
  variantId: string;
  configId: string;
  durationMs: number;
  inputLength: number;
  success: boolean;
  timestamp: adminNamespace.firestore.FieldValue;
}

/**
 * Singleton cache for ML configs
 * Ensures we don't hit Firestore on every routing decision and prevents memory leaks
 * via explicit bounding of `onSnapshot` listeners to active 'champion' configs only.
 */
class MLConfigCache {
  private static instance: MLConfigCache;
  private unsubscribe: (() => void) | null = null;
  private isInitialized = false;

  // In-memory CQB routing weights mapping
  // configId -> variantId -> weight
  public mabWeightsCache: Map<string, Map<string, number>> = new Map();

  // Fast path memory cache for routing decisions
  public activeChampions: Map<string, MLConfigVersion[]> = new Map();

  // Async Buffer for telemetry events, protecting V8
  public telemetryQueue = new PQueue({ concurrency: 10, timeout: 5000 });

  private constructor() {}

  public static getInstance(): MLConfigCache {
    if (!MLConfigCache.instance) {
      MLConfigCache.instance = new MLConfigCache();
    }
    return MLConfigCache.instance;
  }

  /**
   * Initializes the memory cache by subscribing to the `ml_configs` collection.
   * STRICTLY bounded to `status == 'champion'` to prevent memory bloat (SCD Type 2).
   */
  public initialize() {
    if (this.isInitialized) return;

    const db = admin.firestore();

    // The Bounded Query: only pulling active champions
    const query = db.collection("ml_configs").where("status", "==", "champion");

    this.unsubscribe = query.onSnapshot(
      (snapshot) => {
        // Rebuild the Maps immutably
        const newChampions = new Map<string, MLConfigVersion[]>();
        const newWeights = new Map<string, Map<string, number>>();

        snapshot.forEach((doc) => {
          const data = doc.data() as MLConfigVersion;
          const id = doc.id; // We use doc.id as the variantId

          if (!newChampions.has(data.configId)) {
            newChampions.set(data.configId, []);
          }
          newChampions.get(data.configId)?.push({ ...data, configId: id });

          if (!newWeights.has(data.configId)) {
            newWeights.set(data.configId, new Map());
          }

          // Setup initial MAB weight (fallback to uniform distribution if missing)
          newWeights.get(data.configId)?.set(id, data.mabWeight ?? 1.0);
        });

        this.activeChampions = newChampions;
        this.mabWeightsCache = newWeights;
        console.log(
          `[MLConfigCache] Refreshed: ${snapshot.docs.length} active champions cached.`,
        );
      },
      (error) => {
        console.error("[MLConfigCache] Snapshot listener error:", error);
      },
    );

    this.isInitialized = true;

    // Explicit SIGTERM hook to kill the listener and avoid zombie connections
    process.on("SIGTERM", () => this.shutdown());
    process.on("SIGINT", () => this.shutdown());
  }

  /**
   * Shuts down the singleton and unbinds listeners
   */
  public shutdown() {
    console.log("[MLConfigCache] Shutting down listeners...");
    if (this.unsubscribe) {
      this.unsubscribe();
      this.unsubscribe = null;
    }
    this.telemetryQueue.pause();
    this.telemetryQueue.clear();
    this.isInitialized = false;
  }

  /**
   * Emit an async telemetry event for CQB weight updates.
   * Completely non-blocking (Fire-and-forget).
   */
  public emitTelemetry(event: Omit<TelemetryEvent, "timestamp">) {
    this.telemetryQueue.add(async () => {
      try {
        const db = admin.firestore();
        await db.collection("mab_telemetry_buffer").add({
          ...event,
          timestamp: admin.firestore.FieldValue.serverTimestamp(),
        });
      } catch (err) {
        console.error("[MLConfigCache] Failed to emit telemetry", err);
      }
    });
  }

  /**
   * Sample the Multi-Armed Bandit using Thompson Sampling weights
   * Provides O(1) synchronous model routing using the fast path memory cache.
   */
  public route(configId: string): MLConfigVersion | null {
    const variants = this.activeChampions.get(configId);
    if (!variants || variants.length === 0) return null;

    const weights = this.mabWeightsCache.get(configId);
    if (!weights) return variants[0];

    // Thompson Sampling implementation (Simplified weighted random for selection)
    let totalWeight = 0;
    variants.forEach((v) => {
      totalWeight += weights.get(v.configId) || 1.0;
    });

    let random = Math.random() * totalWeight;
    for (const variant of variants) {
      const w = weights.get(variant.configId) || 1.0;
      if (random < w) return variant;
      random -= w;
    }

    return variants[0];
  }
}

export const mlConfigCache = MLConfigCache.getInstance();
