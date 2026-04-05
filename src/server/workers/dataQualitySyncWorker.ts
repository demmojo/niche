import { BigQuery } from "@google-cloud/bigquery";
import admin from "firebase-admin";

const bq = new BigQuery();

export async function processDataQualitySync() {
  const PROJECT_ID = process.env.GCP_PROJECT_ID || "mock-project-id";

  // Aggregate BigQuery metrics
  // 1. Active vs Quarantine
  const statusCountsQuery = `
    SELECT 
      is_active, 
      COUNT(*) as count
    FROM \`${PROJECT_ID}.saas_oracle.global_market_facts\`
    GROUP BY is_active
  `;

  // 2. Daily processed volume
  const dailyVolumeQuery = `
    SELECT 
      COUNT(*) as daily_processed
    FROM \`${PROJECT_ID}.saas_oracle.global_market_facts\`
    WHERE DATE(ingestion_timestamp) = CURRENT_DATE()
  `;

  // 3. Top 50 recent quarantined domains
  // Assuming a domain is quarantined if is_active is FALSE.
  // Ordering by ingestion_timestamp or valid_from to get the most recent ones.
  const recentQuarantinedQuery = `
    SELECT 
      domain,
      ingestion_timestamp,
      valid_from
    FROM \`${PROJECT_ID}.saas_oracle.global_market_facts\`
    WHERE is_active = FALSE
    ORDER BY valid_from DESC
    LIMIT 50
  `;

  const [[statusRows], [volumeRows], [quarantinedRows]] = await Promise.all([
    bq.query({ query: statusCountsQuery }),
    bq.query({ query: dailyVolumeQuery }),
    bq.query({ query: recentQuarantinedQuery }),
  ]);

  let activeCount = 0;
  let quarantineCount = 0;

  for (const row of statusRows) {
    if (row.is_active === true) {
      activeCount = row.count;
    } else {
      quarantineCount = row.count;
    }
  }

  const dailyProcessed = volumeRows[0]?.daily_processed || 0;

  const recentQuarantined = quarantinedRows.map((r: any) => {
    // Attempt to resolve timestamps properly for Firestore serialization
    const timestamp = r.ingestion_timestamp?.value
      ? r.ingestion_timestamp.value
      : r.valid_from?.value
        ? r.valid_from.value
        : String(r.valid_from);

    return {
      domain: r.domain,
      timestamp,
      // We will leave room for penalty reasoning if added to schema later
      reasoning: "Failed Audit",
    };
  });

  const payload = {
    metrics: {
      active_count: activeCount,
      quarantine_count: quarantineCount,
      daily_processed: dailyProcessed,
      quarantine_rate:
        activeCount + quarantineCount > 0
          ? quarantineCount / (activeCount + quarantineCount)
          : 0,
    },
    recent_quarantined: recentQuarantined,
    updated_at: admin.firestore.FieldValue.serverTimestamp(),
  };

  const db = admin.firestore();
  await db
    .collection("admin_dashboards")
    .doc("data_quality")
    .set(payload, { merge: true });

  console.log("Data quality metrics synced to Firestore successfully.", {
    activeCount,
    quarantineCount,
    dailyProcessed,
  });

  return payload;
}
