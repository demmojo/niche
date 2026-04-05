# Design

## Context

Phase 2 of the Data Moat Pipeline requires gathering public signals to evaluate a target's execution velocity and GTM presence. Using public BigQuery datasets and Google Custom Search provides a highly scalable, cost-effective alternative to commercial scraping tools.

## Goals

- Safely query BigQuery public datasets without incurring massive costs.
- Retrieve accurate search index counts and sponsored ad presence via an official API.
- Seamlessly integrate with the existing normalization adapter.

## Non-Goals

- Scraping Google Search directly (HTML parsing), which is prone to blocking.
- Analyzing full repository source code.

## Decisions

- **Strict BQ Partitioning**: All queries to `githubarchive`, `hacker_news`, and `chrome-ux-report` MUST include a `_PARTITIONTIME` or `_TABLE_SUFFIX` filter to bound data scanned.
- **Custom Search JSON API**: Use Google Programmable Search Engine API instead of third-party SERP APIs for improved reliability and cost predictability.

## Risks & Trade-offs

- **BigQuery Cost Risk**: Accidental full-table scans can be expensive. Mitigation: Enforce strict byte-limit quotas and mandatory partition filters at the query generation level.
- **Search API Quotas**: Google Custom Search has a hard limit on daily queries. Mitigation: Implement caching and batching where possible.

## Future Potential

- Add Reddit or StackOverflow public datasets.
- Use Search API for deeper competitor SERP overlap analysis.
