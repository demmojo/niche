import { logger } from "./logger";
import admin from "firebase-admin";
import PQueue from "p-queue";

// Ensure app is initialized before calling firestore
if (!admin.apps?.length) {
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
    embeddingModel?: string;
    temperature: number;
    topP: number;
  };
  promptTemplate: any; // CO-STAR template
  mabWeight?: number; // Contextual Queueing Bandits dynamic weight
  validFrom: admin.firestore.Timestamp;
  validTo: admin.firestore.Timestamp | null;
}

export interface TelemetryEvent {
  variantId: string;
  configId: string;
  durationMs: number;
  inputLength: number;
  success: boolean;
  timestamp: admin.firestore.FieldValue;
}

/**
 * Singleton cache for ML configs
 * Ensures we don't hit Firestore on every routing decision and prevents memory leaks
 * via explicit bounding of `onSnapshot` listeners to active 'champion' configs only.
 */
class MLConfigCache {
  private static instance: MLConfigCache;
  private cacheExpiry = 0;
  private readonly CACHE_TTL_MS = 60000; // 60 seconds

  // In-memory CQB routing weights mapping
  // configId -> variantId -> weight
  public mabWeightsCache: Map<string, Map<string, number>> = new Map();

  // Fast path memory cache for routing decisions
  public activeChampions: Map<string, MLConfigVersion[]> = new Map();

  private constructor() {}

  public static getInstance(): MLConfigCache {
    if (!MLConfigCache.instance) {
      MLConfigCache.instance = new MLConfigCache();
    }
    return MLConfigCache.instance;
  }

  /**
   * Refreshes the memory cache by querying the `ml_configs` collection.
   * STRICTLY bounded to `status == 'champion'` to prevent memory bloat (SCD Type 2).
   */
  private async refreshCache() {
    const db = admin.firestore();

    try {
      const snapshot = await db
        .collection("ml_configs")
        .where("status", "==", "champion")
        .get();

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
      this.cacheExpiry = Date.now() + this.CACHE_TTL_MS;

      logger.info(
        `[MLConfigCache] Refreshed: ${snapshot.docs.length} active champions cached.`,
      );
    } catch (error) {
      logger.error("[MLConfigCache] Cache refresh error:", error);
    }
  }

  /**
   * Emit a telemetry event for CQB weight updates.
   * MUST be awaited by callers in serverless environments.
   */
  public async emitTelemetry(event: Omit<TelemetryEvent, "timestamp">) {
    try {
      const db = admin.firestore();
      await db.collection("mab_telemetry_buffer").add({
        ...event,
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
      });
    } catch (err) {
      logger.error("[MLConfigCache] Failed to emit telemetry", err);
    }
  }

  /**
   * Sample the Multi-Armed Bandit using Thompson Sampling weights
   * Uses an async read-through cache with TTL to support scale-to-zero Cloud Run environments.
   */
  public async route(configId: string): Promise<MLConfigVersion | null> {
    if (Date.now() > this.cacheExpiry) {
      await this.refreshCache();
    }

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
