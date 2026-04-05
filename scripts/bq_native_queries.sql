-- BigQuery Native Partitioned Queries for Synthetic Signals
-- Enforcing strict _PARTITIONTIME filters to prevent runaway costs

-- 1. GitHub Archive: Repository Star Velocity
-- Tracks developer momentum for a specific domain/repo over the last 30 days
SELECT 
    repo.name,
    COUNT(*) as star_velocity
FROM \`githubarchive.day.events_*\`
WHERE 
    _TABLE_SUFFIX BETWEEN FORMAT_DATE('%Y%m%d', DATE_SUB(CURRENT_DATE(), INTERVAL 30 DAY)) 
                      AND FORMAT_DATE('%Y%m%d', CURRENT_DATE())
    AND type = 'WatchEvent'
    -- Replace with actual repo names derived from domains
    AND repo.name IN ('example/repo')
GROUP BY repo.name;

-- 2. Hacker News: Mention Velocity and Sentiment
-- Tracks how often a domain is mentioned in HN comments over the last 30 days
SELECT 
    EXTRACT(DATE FROM time_ts) as mention_date,
    COUNT(*) as daily_mentions
FROM \`bigquery-public-data.hacker_news.comments\`
WHERE 
    time_ts >= TIMESTAMP_SUB(CURRENT_TIMESTAMP(), INTERVAL 30 DAY)
    AND text LIKE '%example.com%'
GROUP BY mention_date
ORDER BY mention_date DESC;

-- 3. Chrome UX Report (CrUX): Performance as a proxy for engineering quality
-- Tracks LCP (Largest Contentful Paint) for the domain
SELECT
    origin,
    fast_lcp
FROM \`chrome-ux-report.all.202603\` -- Explicitly querying the current or previous month's partition
WHERE origin = 'https://example.com';
