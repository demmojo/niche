# Specification: Flow Tracing DLQ

## 1. Database Migrations

Create a new table `dead_letter_queue` in Supabase.

- Fields: `id`, `original_record_id`, `job_type`, `payload`, `error_details`, `status`, `attempt_count`, `max_attempts`, `next_retry_at`, `idempotency_key`, `created_at`, `updated_at`.
- Enable Row Level Security (RLS) on the table.
- Create policies allowing authenticated internal users/admins to `SELECT`, `INSERT`, and `UPDATE`.
- **Database Indexes**:
  - B-Tree index on `(status, next_retry_at)` to ensure the retry polling query is highly performant.
  - Index on `job_type` and `created_at` to support UI filtering.

## 2. Background Processor Updates

Update `processInboxAction` in `src/utils/backgroundProcessor.ts` to implement a proper transaction or idempotency check instead of the "commit-before-processing" anti-pattern.
On failure, log the error and insert it into the DLQ, calculating an exponential backoff time:

```typescript
catch (err) {
  console.error(`Failed to process item ${item.id} with action ${action}:`, err);

  const attempt_count = 1; // First failure
  const base_delay = 60 * 1000; // 1 minute
  const next_retry_at = new Date(Date.now() + (base_delay * Math.pow(2, attempt_count - 1))).toISOString();

  // Insert into DLQ
  await supabase.from("dead_letter_queue").insert({
    job_type: "inbox_action",
    original_record_id: item.id,
    idempotency_key: `${item.id}-${action}`,
    payload: { item, action },
    error_details: { message: err instanceof Error ? err.message : String(err), stack: err instanceof Error ? err.stack : undefined },
    status: "pending",
    attempt_count,
    max_attempts: 5,
    next_retry_at
  });
}
```

## 3. Auto-Retry Worker

Define a background job, daemon, or scheduled Edge Function that polls the queue.

- Query: `SELECT * FROM dead_letter_queue WHERE status IN ('pending', 'retrying') AND next_retry_at <= NOW() FOR UPDATE SKIP LOCKED`
- Action: Process the payload. If successful, update status to `resolved`. If failed, increment `attempt_count` and recalculate `next_retry_at`.
- Max Retries: If `attempt_count >= max_attempts`, the status transitions to `terminal` and an alert is fired.

## 4. DLQ Viewer Component

Create a new React component at `src/components/DLQViewer.tsx`.

- **Fetch**: Query `supabase.from('dead_letter_queue').select('*').in('status', ['pending', 'terminal']).order('created_at', { ascending: false })`.
- **Render**: A paginated table/list showing the failure time, job type, error message, and attempt count. Include a JSON payload and stack trace viewer.
- **Action**: Provide "Retry" and "Bulk Retry" buttons that extract the payload and retry the function. Handle state updates accordingly. Include filters by date, status, and job type.

## 5. Data Retention / Cleanup

Implement a strategy (e.g., a weekly pg_cron job) to archive or delete `resolved` DLQ items older than 30 days to prevent table bloat.
