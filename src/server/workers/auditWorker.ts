import { GoogleGenAI } from "@google/genai";
import { BigQuery } from "@google-cloud/bigquery";

export async function processAuditWorker(batchExtractions: any[]) {
  const PROJECT_ID = process.env.GCP_PROJECT_ID || "mock-project-id";

  const bq = new BigQuery();

  console.log("Running BigQuery statistical anomaly detection...");
  // Identify anomalies using z-score on recent extractions
  const anomalyQuery = `
    WITH stats AS (
      SELECT 
        domain,
        confidence_score,
        AVG(confidence_score) OVER() as mean_score,
        STDDEV(confidence_score) OVER() as stddev_score
      FROM \`${PROJECT_ID}.saas_oracle.global_market_facts\`
      WHERE DATE(valid_from) = CURRENT_DATE()
    )
    SELECT domain, confidence_score
    FROM stats
    WHERE ABS(confidence_score - mean_score) > (2 * stddev_score)
  `;

  try {
    const [anomalies] = await bq.query({ query: anomalyQuery });
    console.log(
      `Detected ${anomalies.length} statistical anomalies in BigQuery.`,
    );

    // Tag anomalies in the batch if they match
    const anomalyDomains = new Set(anomalies.map((a: any) => a.domain));
    for (const record of batchExtractions) {
      if (anomalyDomains.has(record.domain)) {
        record.isStatisticalAnomaly = true;
      }
    }
  } catch (error) {
    console.error("BigQuery anomaly detection failed:", error);
  }

  // Stratified Sampling
  // 1. Target statistical anomalies
  // 2. Target low confidence scores (<0.7)
  // 3. Baseline of passed checks (high confidence)

  const anomaliesList = batchExtractions.filter((e) => e.isStatisticalAnomaly);
  const lowConfidence = batchExtractions.filter(
    (e) => !e.isStatisticalAnomaly && e.confidenceScore < 0.7,
  );
  const highConfidence = batchExtractions.filter(
    (e) => !e.isStatisticalAnomaly && e.confidenceScore >= 0.9,
  );

  // Sample 1% overall
  const sampleSize = Math.max(2, Math.floor(batchExtractions.length * 0.01)); // ensure at least 2 for tests

  const auditSample = [
    ...anomaliesList.slice(0, Math.max(1, Math.floor(sampleSize * 0.4))), // 40% anomalies
    ...lowConfidence.slice(0, Math.max(1, Math.floor(sampleSize * 0.4))), // 40% low confidence
    ...highConfidence.slice(0, Math.max(1, Math.floor(sampleSize * 0.2))), // 20% baseline to prevent bias
  ];

  // deduplicate the audit sample to avoid testing the same element and over-representing
  const uniqueAuditSample = Array.from(new Set(auditSample)).slice(
    0,
    sampleSize,
  );

  const geminiApiKey = process.env.GEMINI_API_KEY;
  if (!geminiApiKey) throw new Error("GEMINI_API_KEY missing");
  const ai = new GoogleGenAI({ apiKey: geminiApiKey });

  for (const record of uniqueAuditSample) {
    const prompt = `
You are an expert AI Auditor enforcing the Negative Feature Penalty.
Evaluate this structured competitor data against its raw source HTML.

Rules:
1. Missing Required Fields: Penalize heavily if fields like 'name', 'coreFeatures' are empty but present in HTML.
2. Hallucinated Nested Objects: Verify 'verbatimQuotes' actually exist in the source HTML. If hallucinated, fail the record.
3. Semantic Inconsistency: E.g., 'targetAudience: enterprise' but 'freeTier: unlimited usage'.

Data:
${JSON.stringify(record, null, 2)}

Provide a boolean 'passedAudit' and a 'penaltyScore' (0 to 100).
    `;

    try {
      const callOptions = {
        model: "gemini-3.1-pro-preview", // Enforced gemini-3.1-pro-preview for audits
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          systemInstruction: "You are an audit agent.",
        },
      };

      const geminiRes = await ai.models.generateContent(callOptions);

      // Clean up markdown fences if present
      let rawText = geminiRes.text || "{}";
      if (rawText.startsWith("```json")) {
        rawText = rawText
          .replace(/```json/g, "")
          .replace(/```/g, "")
          .trim();
      } else if (rawText.startsWith("```")) {
        rawText = rawText.replace(/```/g, "").trim();
      }

      const auditResult = JSON.parse(rawText);

      // Handle {} case properly, defaulting to strict audit failure if missing
      const passed = auditResult.passedAudit === true;
      const penalty = auditResult.penaltyScore || 100;

      if (!passed || penalty > 50) {
        // Quarantine logic
        console.warn(
          `Audit failed for record ${record.name || record.domain}. Penalty: ${auditResult.penaltyScore}`,
        );
        record.quarantined = true;

        try {
          const query = `UPDATE \`${PROJECT_ID}.saas_oracle.global_market_facts\` SET is_active = FALSE WHERE domain = @domain`;
          await bq.query({ query, params: { domain: record.domain } });
          console.log(`Quarantined ${record.domain} in BigQuery.`);
        } catch (dbErr) {
          console.error(`Failed to quarantine ${record.domain} in BQ:`, dbErr);
        }
      }
    } catch (e) {
      console.error("Audit LLM evaluation failed", e);
    }
  }

  return uniqueAuditSample;
}
