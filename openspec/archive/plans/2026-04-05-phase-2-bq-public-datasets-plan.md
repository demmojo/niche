# Phase 2: BigQuery Public Datasets and Custom Search API

## Why

As part of the Hyper-Scale SaaS Data Moat Pipeline, we need to extract signals from public datasets (GitHub Archive, Hacker News, CrUX) and Google Search (indexation size, sponsored ads) to build the "Execution Velocity Score" and proxy SEO/GTM presence without relying on expensive enterprise tools. This executes the remaining Phase 2 logic from the data moat pipeline.

## What Changes

1. **BigQuery Queries**: Implement logic to execute native partitioned queries for `githubarchive`, `hacker_news`, and `chrome-ux-report`, enforcing strict `_PARTITIONTIME` bounds.
2. **Custom Search Integration**: Add a proxy adapter using the Google Programmable Search Engine (Custom Search API) to retrieve indexation counts and sponsored ad presence.

## Capabilities

### New Capabilities

- `bq-public-dataset-query`: Run cost-optimized queries against massive public datasets for velocity signals.
- `custom-search-proxy`: Fetch SEO metrics (indexation, ads) via Google Programmable Search API.

## Relationships

- extends: []
- `src/server/services/bigQuerySignals.ts` (new)
- `src/server/services/customSearchProxy.ts` (new)
- `src/server/workers/normalizationAdapterJob.ts` (updates)
