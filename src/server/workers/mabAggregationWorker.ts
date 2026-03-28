import * as adminNamespace from "firebase-admin";
const admin: typeof adminNamespace =
  (adminNamespace as any).default || adminNamespace;

// Ensure app is initialized before calling firestore
if (!admin.apps.length) {
  admin.initializeApp();
}

/**
 * 5-Minute Cron Worker to Aggregate Contextual Queueing Bandits (CQB) Telemetry.
 * Reads the `mab_telemetry_buffer` to calculate success/failure rates
 * and updates the active champion weights in `ml_configs` transactionally.
 * By moving math off the main V8 execution thread, we prevent DB contention.
 */
export const runMABAggregation = async () => {
  const db = admin.firestore();
  console.log("[MABAggregationWorker] Starting MAB Aggregation pass.");

  try {
    const bufferSnapshot = await db
      .collection("mab_telemetry_buffer")
      .limit(500) // Batch limits to prevent transaction timeouts
      .get();

    if (bufferSnapshot.empty) {
      console.log("[MABAggregationWorker] No new telemetry data.");
      return;
    }

    // Accumulate successes and totals per variant
    const variantStats: Record<string, { success: number; total: number }> = {};
    const docsToDelete: FirebaseFirestore.DocumentReference[] = [];

    bufferSnapshot.forEach((doc) => {
      const data = doc.data();
      const variantId = data.variantId;

      if (!variantStats[variantId]) {
        variantStats[variantId] = { success: 0, total: 0 };
      }

      variantStats[variantId].total += 1;
      if (data.success) {
        variantStats[variantId].success += 1;
      }

      docsToDelete.push(doc.ref);
    });

    // We use a transaction to safely update all active champions
    await db.runTransaction(async (transaction) => {
      // 1. Fetch current weights for affected variants
      const activeChampionsQuery = db
        .collection("ml_configs")
        .where("status", "==", "champion");

      const championsSnapshot = await transaction.get(activeChampionsQuery);

      championsSnapshot.forEach((doc) => {
        const id = doc.id;
        const currentStats = variantStats[id];

        if (currentStats) {
          // 2. Bayesian Update (Beta Distribution / Thompson Sampling logic)
          // Simplified: We blend historical weight with recent success rate.
          // Alpha = Success, Beta = Total - Success
          const historicalWeight = doc.data().mabWeight || 1.0;
          const recentSuccessRate = currentStats.success / currentStats.total;

          // Learning Rate (Alpha): How quickly the system shifts traffic
          const learningRate = 0.1;
          const updatedWeight =
            historicalWeight * (1 - learningRate) +
            recentSuccessRate * learningRate;

          // Update the weight in `ml_configs` (Triggers onSnapshot refresh globally)
          transaction.update(doc.ref, {
            mabWeight: Math.max(updatedWeight, 0.01),
          }); // Floor to prevent starvation
        }
      });

      // 3. Clear the processed telemetry buffer (Atomic cleanup)
      // Note: Transaction updates have a 500 max limit.
      const batchDeleteLimit = Math.min(docsToDelete.length, 450);
      for (let i = 0; i < batchDeleteLimit; i++) {
        transaction.delete(docsToDelete[i]);
      }
    });

    console.log(
      `[MABAggregationWorker] Aggregated ${docsToDelete.length} telemetry events.`,
    );
  } catch (error) {
    console.error("[MABAggregationWorker] Aggregation failed:", error);
  }
};
