import admin from "firebase-admin";

export async function checkAndIncrementGlobalAnonymousLimit(
  limit: number = 30,
): Promise<boolean> {
  const db = admin.firestore();
  const date = new Date().toISOString().split("T")[0];
  const numShards = 10;
  const shardId = Math.floor(Math.random() * numShards);

  // Use a transaction to safely read all shards to get the total, then increment one shard
  try {
    const result = await db.runTransaction(async (transaction) => {
      // Read all shards
      const shardRefs = Array.from({ length: numShards }).map((_, i) =>
        db
          .collection("system_limits")
          .doc(`anonymous_daily_${date}_shard_${i}`),
      );

      const shardSnaps = await transaction.getAll(...shardRefs);

      let totalCount = 0;
      shardSnaps.forEach((snap) => {
        if (snap.exists) {
          totalCount += snap.data()?.count || 0;
        }
      });

      if (totalCount >= limit) {
        return false; // Limit reached
      }

      // Increment the randomly selected shard
      const targetShardRef = shardRefs[shardId];
      const targetShardSnap = shardSnaps[shardId];
      const currentShardCount = targetShardSnap.exists
        ? targetShardSnap.data()?.count || 0
        : 0;

      transaction.set(
        targetShardRef,
        {
          count: currentShardCount + 1,
          lastUpdatedAt: admin.firestore.FieldValue.serverTimestamp(),
        },
        { merge: true },
      );

      return true; // OK
    });

    return result;
  } catch (error) {
    console.error(
      "Error in checkAndIncrementGlobalAnonymousLimit transaction:",
      error,
    );
    // Let's fail closed for security.
    return false;
  }
}

export async function checkAndIncrementAnonymousLimit(
  fingerprintHash: string,
  limit: number = 3,
): Promise<boolean> {
  const db = admin.firestore();
  const docRef = db.collection("anonymous_usage_limits").doc(fingerprintHash);

  try {
    const result = await db.runTransaction(async (transaction) => {
      const docSnap = await transaction.get(docRef);

      let count = 0;
      if (docSnap.exists) {
        count = docSnap.data()?.count || 0;
      }

      if (count >= limit) {
        return false; // Limit reached
      }

      // Increment count
      transaction.set(
        docRef,
        {
          count: count + 1,
          lastUsedAt: admin.firestore.FieldValue.serverTimestamp(),
        },
        { merge: true },
      );

      return true; // OK
    });

    return result;
  } catch (error) {
    console.error(
      "Error in checkAndIncrementAnonymousLimit transaction:",
      error,
    );
    // If the transaction fails, we might want to fail closed to prevent abuse,
    // but failing open might be better UX. Let's fail closed for security.
    return false;
  }
}
