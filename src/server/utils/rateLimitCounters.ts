import * as admin from "firebase-admin";

// Use 10 shards to distribute counter increments
const SHARD_COUNT = 10;

/**
 * Increments the distributed counter for a specific tenant's rate limit.
 * Utilizes a write batch to perform the increment atomically on a random shard.
 */
export const incrementRateLimitCounter = async (tenantId: string): Promise<void> => {
  const db = admin.firestore();
  const shardId = Math.floor(Math.random() * SHARD_COUNT);
  
  // path: rate_limits/{tenantId}/shards/{shardId}
  const shardRef = db
    .collection("rate_limits")
    .doc(tenantId)
    .collection("shards")
    .doc(shardId.toString());
  
  const batch = db.batch();
  batch.set(
    shardRef, 
    { count: admin.firestore.FieldValue.increment(1) }, 
    { merge: true }
  );
  
  await batch.commit();
};

/**
 * Checks if the sum of all shards exceeds the provided rate limit.
 */
export const checkRateLimit = async (tenantId: string, limit: number): Promise<boolean> => {
  const db = admin.firestore();
  const shardsRef = db
    .collection("rate_limits")
    .doc(tenantId)
    .collection("shards");
    
  const snapshot = await shardsRef.get();
  
  let totalCount = 0;
  if (snapshot && snapshot.docs) {
    snapshot.docs.forEach((doc) => {
      const data = doc.data();
      totalCount += data.count || 0;
    });
  }
  
  // If the total count is less than the limit, the action is allowed
  return totalCount < limit;
};
