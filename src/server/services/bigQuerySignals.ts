import { logger } from "../logger";
import { BigQuery } from "@google-cloud/bigquery";

export interface VelocitySignals {
  github_stars_30d: number;
  hn_mentions_30d: number;
  crux_p75_fcp: number | null;
}

export async function fetchPublicDatasetSignals(
  domain: string,
): Promise<VelocitySignals> {
  const bq = new BigQuery();

  // Use parameters to prevent SQL injection
  // Enforce _PARTITIONTIME to strictly bound query costs on massive public datasets
  const query = `
    WITH GitHubActivity AS (
      SELECT COUNT(*) as stars
      FROM \`githubarchive.day.events\`
      WHERE _PARTITIONTIME >= TIMESTAMP_SUB(CURRENT_TIMESTAMP(), INTERVAL 30 DAY)
        AND type = 'WatchEvent'
        AND repo.name LIKE CONCAT('%', @domain, '%')
    ),
    HackerNewsMentions AS (
      SELECT COUNT(*) as mentions
      FROM \`bigquery-public-data.hacker_news.full\`
      WHERE timestamp >= TIMESTAMP_SUB(CURRENT_TIMESTAMP(), INTERVAL 30 DAY)
        AND text LIKE CONCAT('%', @domain, '%')
    ),
    CrUXMetrics AS (
      SELECT experimental.time_to_first_byte.percentiles.p75 as fcp
      FROM \`chrome-ux-report.all.202312\` -- Using a specific recent partition or materialized view
      WHERE origin = CONCAT('https://', @domain)
      LIMIT 1
    )
    SELECT 
      (SELECT stars FROM GitHubActivity) as github_stars_30d,
      (SELECT mentions FROM HackerNewsMentions) as hn_mentions_30d,
      (SELECT fcp FROM CrUXMetrics) as crux_p75_fcp
  `;

  const options = {
    query: query,
    params: { domain: domain.replace(/^https?:\/\/(www\.)?/, "") }, // Clean domain
    location: "US",
  };

  try {
    const [job] = await bq.createQueryJob(options);
    const [rows] = await job.getQueryResults();

    if (rows && rows.length > 0) {
      const row = rows[0];
      return {
        github_stars_30d: row.github_stars_30d || 0,
        hn_mentions_30d: row.hn_mentions_30d || 0,
        crux_p75_fcp: row.crux_p75_fcp || null,
      };
    }
  } catch (error) {
    logger.error(`BigQuery execution failed for domain ${domain}:`, error);
  }

  // Fallback
  return {
    github_stars_30d: 0,
    hn_mentions_30d: 0,
    crux_p75_fcp: null,
  };
}
