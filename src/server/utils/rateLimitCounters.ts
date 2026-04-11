import * as admin from "firebase-admin";
import * as crypto from "crypto";

// Use 10 shards to distribute counter increments
const SHARD_COUNT = 10;

export const getHashedIp = (ipAddress: string): string => {
  // Simple bucketing for IPv6 (/64). If it contains ':', we take the first 4 blocks.
  let bucketedIp = ipAddress;
  if (ipAddress.includes(":")) {
    const blocks = ipAddress.split(":");
    if (blocks.length >= 4) {
      bucketedIp = blocks.slice(0, 4).join(":") + "::/64";
    }
  }

  // Hash the IP with a pepper/salt
  const pepper = process.env.RATE_LIMIT_PEPPER || "default-pepper-nicheai";
  return crypto.createHmac("sha256", pepper).update(bucketedIp).digest("hex");
};

/**
 * Increments the distributed counter for a specific tenant's rate limit.
 * Utilizes a write batch to perform the increment atomically on a random shard.
 */
export const incrementRateLimitCounter = async (
  tenantId: string,
): Promise<void> => {
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
    { merge: true },
  );

  await batch.commit();
};

/**
 * Checks if the sum of all shards exceeds the provided rate limit.
 */
export const checkRateLimit = async (
  tenantId: string,
  limit: number,
): Promise<boolean> => {
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

/**
 * Checks and increments the rate limit atomically using a distributed counter approach.
 * Uses a transaction to prevent TOCTOU race conditions.
 */
export const atomicRateLimitCheck = async (
  tenantId: string,
  limit: number,
  ipAddress?: string,
): Promise<boolean> => {
  const db = admin.firestore();

  const getShardsRef = (col: string, id: string) =>
    db.collection(col).doc(id).collection("shards");
  const tenantShardsRef = getShardsRef("rate_limits", tenantId);
  const ipShardsRef = ipAddress
    ? getShardsRef("rate_limits_ip", getHashedIp(ipAddress))
    : null;

  try {
    return await db.runTransaction(async (transaction) => {
      // 1. Read all shards for tenant
      const tenantSnapshot = await transaction.get(tenantShardsRef);
      let tenantCount = 0;
      if (tenantSnapshot && !tenantSnapshot.empty) {
        tenantSnapshot.docs.forEach((doc) => {
          tenantCount += doc.data()?.count || 0;
        });
      }

      // 2. Evaluate tenant limit
      if (tenantCount >= limit) {
        return false;
      }

      // 3. Read and evaluate IP shards if provided
      if (ipShardsRef) {
        const ipSnapshot = await transaction.get(ipShardsRef);
        let ipCount = 0;
        if (ipSnapshot && !ipSnapshot.empty) {
          ipSnapshot.docs.forEach((doc) => {
            ipCount += doc.data()?.count || 0;
          });
        }
        if (ipCount >= limit) {
          return false;
        }
      }

      // 4. Increment a random shard for tenant
      const tenantShardId = Math.floor(Math.random() * SHARD_COUNT);
      transaction.set(
        tenantShardsRef.doc(tenantShardId.toString()),
        { count: admin.firestore.FieldValue.increment(1) },
        { merge: true },
      );

      // 5. Increment a random shard for IP
      if (ipShardsRef) {
        const ipShardId = Math.floor(Math.random() * SHARD_COUNT);
        transaction.set(
          ipShardsRef.doc(ipShardId.toString()),
          { count: admin.firestore.FieldValue.increment(1) },
          { merge: true },
        );
      }

      return true;
    });
  } catch (error) {
    console.error("atomicRateLimitCheck transaction failed:", error);
    return false; // Fail secure
  }
};
