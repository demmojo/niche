import { BigQuery } from "@google-cloud/bigquery";
import admin from "firebase-admin";
import { FieldValue } from "firebase-admin/firestore";

const bq = new BigQuery();

export async function processVectorSync() {
  const PROJECT_ID = process.env.GCP_PROJECT_ID || "mock-project-id";

  const query = `
    SELECT 
      f.domain,
      f.core_features,
      f.target_audience,
      f.valid_from,
      f.engineering_to_sales_ratio,
      f.integration_count,
      f.indexation_size,
      f.sponsored_presence,
      v.is_hyper_velocity_tarpit
    FROM \`${PROJECT_ID}.saas_oracle.global_market_facts\` f
    LEFT JOIN \`${PROJECT_ID}.saas_oracle.execution_velocity_metrics\` v
      ON f.domain = v.domain
    WHERE f.is_active = TRUE
      -- Only sync records that were updated today
      AND DATE(f.valid_from) = CURRENT_DATE()
  `;

  const [activeRecords] = await bq.query({ query });

  // Upsert to Firestore Vector Search
  console.log(`Syncing ${activeRecords.length} active records to Vector DB...`);

  const db = admin.firestore();

  // We chunk into batches of 500 max to respect Firestore limits
  const chunkSize = 400;
  for (let i = 0; i < activeRecords.length; i += chunkSize) {
    const chunk = activeRecords.slice(i, i + chunkSize);
    const batch = db.batch();

    for (const record of chunk) {
      const ref = db.collection("tarpit_centroids").doc(record.domain);

      const validFromValue =
        record.valid_from && typeof record.valid_from.value !== "undefined"
          ? record.valid_from.value
          : String(record.valid_from);

      const updateData: any = {
        domain: record.domain,
        core_features: record.core_features,
        target_audience: record.target_audience,
        is_hyper_velocity_tarpit: record.is_hyper_velocity_tarpit === true,
        valid_from: validFromValue,
        engineering_to_sales_ratio: record.engineering_to_sales_ratio || 0,
        integration_count: record.integration_count || 0,
        indexation_size: record.indexation_size || 0,
        sponsored_presence: record.sponsored_presence === true,
        provenance: { source: "batch_baseline" },
        last_batch_sync_at: FieldValue.serverTimestamp(),
      };

      // In production, we don't recalculate embeddings in the sync job,
      // so we should not overwrite them with a placeholder if the doc exists.
      // We will only do this dynamically or wait for the flywheel.
      batch.set(ref, updateData, { merge: true });
    }

    await batch.commit();
  }

  // 2. Tombstone (Delete) inactive entities
  const deletedQuery = `
    SELECT domain 
    FROM \`${PROJECT_ID}.saas_oracle.global_market_facts\`
    WHERE is_active = FALSE
      AND DATE(valid_to) = CURRENT_DATE()
  `;

  const [deletedRecords] = await bq.query({ query: deletedQuery });

  if (deletedRecords.length > 0) {
    console.log(`Tombstoning ${deletedRecords.length} ghost companies...`);

    for (let i = 0; i < deletedRecords.length; i += chunkSize) {
      const chunk = deletedRecords.slice(i, i + chunkSize);
      const batch = db.batch();

      for (const record of chunk) {
        const ref = db.collection("tarpit_centroids").doc(record.domain);
        batch.delete(ref);
      }

      await batch.commit();
    }
  }

  return { upserted: activeRecords.length, deleted: deletedRecords.length };
}
