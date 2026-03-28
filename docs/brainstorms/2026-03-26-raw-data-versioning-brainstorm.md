# Brainstorm: Raw Data Library Versioning & Multi-Source Resolution

**Date:** 2026-03-26

## What We're Building

An enhanced "Raw Data Library" that supports versioning and multi-source data aggregation. The system will extract data from various sources (files, APIs, etc.), store them at the same dimension, and calculate a weighted consolidated value based on trust scores. Users need a transparent UI to view exact sources, historical versions, and resolve conflicting data points.

## Why This Approach

We selected the **"Multi-Source Matrix" with Confidence Ranges** approach. This provides extreme transparency and allows analytical users to immediately spot discrepancies (e.g., seeing a range like "50 - 500" for employee count). It empowers users to manually verify and resolve conflicts by expanding rows inline to see all contributing sources side-by-side, while still presenting a trust-weighted aggregation by default.

## Key Decisions

### Data Aggregation & Storage

- Data from multiple sources (e.g., different APIs, document uploads) is extracted and stored at the same dimension.
- Instead of relying on a single source of truth, the system calculates a weighted value based on a combined trust score.

### Trust Scoring Mechanism

- Trust scores are a combination of two factors:
  1. A static base weight assigned by the source type (e.g., Official API = High, Scraped Website = Medium).
  2. An AI-evaluated extraction confidence score assessed per data point based on context.

### Display & Conflict Resolution

- **Main Table:** When sources disagree significantly on a metric, the table will display a range (e.g., "50 - 500") along with a visual confidence score to prompt user investigation.
- **Inline Matrix Expansion:** Users can click a row to expand it inline, revealing explicit columns/rows for every source that provided a value for that metric. This allows users to see all values at a glance and manually "Pin" a specific source's value as the accepted truth.

### Version History UI (Hybrid Model)

- **Metric Timeline:** A vertical timeline (e.g., right-hand sidebar) showing each ingestion event and how individual data points changed over time (e.g., "v6.0 - Added new values", "v5.0 - Updated from ZoomInfo").
- **Global Snapshot List:** A list of full historical snapshots for the entire entity, with options to "Restore" to a previous state or "Preview" the data exactly as it was at that time.

### User Flow for Conflict Resolution

1. **Identify:** User notices a wide range displayed in the main table for "Revenue".
2. **Expand:** User clicks the row; the inline matrix expands showing Salesforce ($5M) and an uploaded PDF ($4.5M).
3. **Verify:** User reviews the trust scores and timestamps for both sources.
4. **Pin:** User clicks the "Pin" icon next to the Salesforce value.
5. **Version Created:** The system creates a new synthetic "Pinned" version in the timeline. The main table now shows $5M instead of the range.

## Resolved Questions

- **Manual Overrides:** When a user manually "Pins" a value in the matrix, it creates a new synthetic version (e.g., "v7.0 - User Pinned Value") in the timeline, which can be tracked and rolled back.
- **Subsequent Updates:** If a user has pinned a value, and a highly-trusted API subsequently pushes a new, conflicting value, the system will keep the pinned value but show an "Update Available" alert to the user to review the new data.
- **Rollback Cascades:** If a user uses the Global Snapshot "Restore" feature to roll back an entire data source, the system will automatically recalculate all trust-weighted averages and ranges across the entire table immediately.
