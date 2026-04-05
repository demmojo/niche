import * as admin from "firebase-admin";

const FAILURE_THRESHOLD = 3;
const WINDOW_MS = 5 * 60 * 1000; // 5 minutes

export async function recordExaFailure() {
  const db = admin.firestore();
  const ref = db.collection("system_config").doc("exa_circuit");

  try {
    await db.runTransaction(async (transaction) => {
      const doc = await transaction.get(ref);
      const now = Date.now();

      if (!doc.exists) {
        transaction.set(ref, { failureCount: 1, lastFailureTimestamp: now });
        return;
      }

      const data = doc.data()!;
      if (now - data.lastFailureTimestamp > WINDOW_MS) {
        // Reset window
        transaction.set(ref, { failureCount: 1, lastFailureTimestamp: now });
      } else {
        // Increment counter
        transaction.update(ref, {
          failureCount: data.failureCount + 1,
          lastFailureTimestamp: now,
        });
      }
    });
  } catch (error) {
    console.error("Failed to record Exa failure in circuit breaker", error);
  }
}

export async function isExaTripped(): Promise<boolean> {
  const db = admin.firestore();
  const ref = db.collection("system_config").doc("exa_circuit");

  try {
    const doc = await ref.get();

    if (!doc.exists) return false;

    const data = doc.data()!;
    if (data.failureCount >= FAILURE_THRESHOLD) {
      const now = Date.now();
      if (now - data.lastFailureTimestamp < WINDOW_MS) {
        return true; // Tripped
      } else {
        // Window expired, reset safely (can be async without blocking read)
        ref.update({ failureCount: 0 }).catch(console.error);
        return false;
      }
    }
  } catch (error) {
    console.error("Failed to read Exa circuit breaker state", error);
    // Fail open (allow requests) if Firestore is down, relying on external API limits
    return false;
  }

  return false;
}
