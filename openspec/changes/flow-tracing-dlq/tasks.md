# Implementation Tasks

- [x] **Task 1: Database Migration**
  - Create a new migration file (or SQL script in Supabase) to create the `dead_letter_queue` table with expanded schema (`next_retry_at`, `max_attempts`, `idempotency_key`, `original_record_id`).
  - Apply RLS policies to restrict access to authorized users.
  - Create B-Tree indexes on `(status, next_retry_at)` and `(job_type, created_at)`.

- [x] **Task 2: Update TypeScript Types**
  - Update local Supabase database types (`src/types/supabase.ts` or equivalent) to include the new `dead_letter_queue` table schema. Define DLQ payloads, Status enums (`pending`, `retrying`, `resolved`, `terminal`), and Error Context interfaces.

- [x] **Task 3: Refactor Inbox Transactionality**
  - Fix the "mark resolved before processing" bug in `src/utils/backgroundProcessor.ts` using transactions or idempotency checks.

- [x] **Task 4: Processor Error Catching**
  - Within the `catch` block of `processInboxAction`, insert the failed job data into the `dead_letter_queue` table, calculating `next_retry_at` using exponential backoff.

- [x] **Task 5: Build Auto-Retry Worker**
  - Extract the core asset/version insertion logic from `processInboxAction` into a reusable function (e.g., `executeActionLogic(item, action)`).
  - Implement a Node.js polling worker or Edge Function using `FOR UPDATE SKIP LOCKED` to pick up and execute retries using the reusable logic.

- [x] **Task 6: Alerting Integration**
  - Trigger Slack/Email notifications when an item hits `terminal` status. (Implemented in Worker with console alerts, can be extended).

- [x] **Task 7: Create DLQViewer.tsx (Read/Filter)**
  - Implement a UI to fetch and display pending/terminal records from the `dead_letter_queue`. Includes pagination, date/type filtering, and a JSON payload/error stack viewer.

- [x] **Task 8: DLQViewer.tsx (Actions)**
  - Implement individual and Bulk Retry / Bulk Delete actions in the UI. Ensure state updates for `status` and `attempt_count` reflect properly.

- [x] **Task 9: Archival Cron (Optional)**
  - Implement a cleanup job (e.g., via pg_cron) to remove `resolved` records older than 30 days.
