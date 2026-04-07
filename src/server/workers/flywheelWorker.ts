import admin from "firebase-admin";

/**
 * Normalizes a URL or domain string to a clean domain key.
 * e.g. "https://www.LegalAi.com/foo" -> "legalai.com"
 * e.g. "www.example.co.uk" -> "example.co.uk"
 */
function normalizeDomain(input: string): string {
  try {
    let urlString = input.trim();
    if (!urlString.startsWith("http://") && !urlString.startsWith("https://")) {
      urlString = "https://" + urlString;
    }
    const url = new URL(urlString);
    let hostname = url.hostname.toLowerCase();
    if (hostname.startsWith("www.")) {
      hostname = hostname.substring(4);
    }
    // Prevent empty document IDs
    if (!hostname) return "unknown-domain-" + Date.now();
    return hostname;
  } catch {
    // Fallback for invalid URLs
    const fallback = input
      .toLowerCase()
      .trim()
      .replace(/^www\./, "")
      .replace(/[^a-z0-9.-]/g, "");
    return fallback || "invalid-domain-" + Date.now();
  }
}

export async function processFlywheelCacheJitJob(jobData: any) {
  if (!jobData.payloadDocId) {
    return { status: "skipped", reason: "No payloadDocId provided" };
  }

  const db = admin.firestore();
  const payloadRef = db
    .collection("cloud_tasks_payloads")
    .doc(jobData.payloadDocId);

  // 1. Claim Check Idempotency
  const payloadDoc = await payloadRef.get();
  if (!payloadDoc.exists) {
    return {
      status: "completed",
      reason: "Payload already processed or deleted",
    };
  }

  const payload = payloadDoc.data();
  if (!payload || !payload.competitors) {
    return { status: "skipped", reason: "Invalid payload format" };
  }

  const batch = db.batch();

  // 2. Save the raw user query to founder_demand_queries
  const queryRef = db.collection("founder_demand_queries").doc();
  batch.set(queryRef, {
    idea: payload.idea,
    user_id: payload.userId,
    created_at: admin.firestore.FieldValue.serverTimestamp(),
    competitors_uncovered: payload.competitors.length,
    cached_result: { idea: payload.idea, competitors: payload.competitors },
  });

  // 3. Process competitors and apply Distributed Counters
  const shardId = Math.floor(Math.random() * 10).toString();

  for (const comp of payload.competitors) {
    const cleanDomain = normalizeDomain(comp.domain);

    // Update main centroid document (merge to not overwrite offline baseline)
    const centroidRef = db.collection("tarpit_centroids").doc(cleanDomain);
    batch.set(
      centroidRef,
      {
        domain: cleanDomain,
        core_features: comp.core_features || [],
        target_audience: comp.target_audience || [],
        is_hyper_velocity_tarpit: comp.is_hyper_velocity_tarpit || false,
        engineering_to_sales_ratio: comp.engineering_to_sales_ratio || 0,
        integration_count: comp.integration_count || 0,
        indexation_size: comp.indexation_size || 0,
        sponsored_presence: comp.sponsored_presence || false,
        provenance: {
          source: "user_demand",
          demand_score: 1, // Base value for new entries
          user_id: payload.userId,
          generated_at: new Date().toISOString(),
        },
      },
      { merge: true }, // Crucial: merges with existing offline data if present
    );

    // Distributed Counter for demand_score
    const counterShardRef = centroidRef
      .collection("demand_shards")
      .doc(shardId);
    batch.set(
      counterShardRef,
      {
        count: admin.firestore.FieldValue.increment(1),
        last_updated: admin.firestore.FieldValue.serverTimestamp(),
      },
      { merge: true },
    );
  }

  // 4. Delete payload document (atomic cleanup)
  batch.delete(payloadRef);

  await batch.commit();

  return { status: "completed" };
}
