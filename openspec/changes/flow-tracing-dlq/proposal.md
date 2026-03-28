# Proposal: Flow Tracing Retry & Dead-Letter Queue (DLQ)

## Context

Currently, our inbox action processing (`src/utils/backgroundProcessor.ts`) iterates over inbox items, marks them as resolved in the `raw_data_inbox` table, and then performs data pipeline operations (e.g., `keep_both`, `update`). This constitutes a "commit-before-processing" anti-pattern: if an operation fails, the error is caught and logged, but the item has already been marked resolved. This results in silent data loss, as the data is neither persisted in the asset tables nor eligible for automatic reprocessing.

## Proposal

Implement a PostgreSQL-backed Retry & Dead-Letter Queue (DLQ) within our Supabase database. We will fix the transactionality flaw (ensuring items are only marked resolved upon actual success) and route transient or persistent failures to a `dead_letter_queue` table. The system will support automated exponential backoff for transient errors, and manual UI intervention for terminal (dead) errors.

## Rationale

Using our existing Postgres/Supabase infrastructure for the DLQ provides several advantages over external message brokers:

1. **Instant Visibility**: We can use standard SQL queries to filter failed jobs by date, error type, or action.
2. **Reduced Complexity**: No additional infrastructure to maintain.
3. **Auditability & Replayability**: A simple React UI can fetch from this table, allowing developers or admins to review the `error_details` and manually trigger a retry.

## Observability & Alerting

To ensure errors do not go unnoticed, we will integrate with our alerting stack (e.g., Slack, email). The engineering team will be notified when items reach terminal DLQ status or when the queue depth exceeds a healthy threshold.
