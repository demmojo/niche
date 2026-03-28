# Design: Retry & Dead-Letter Queue (DLQ)

## Architecture Overview

1. **Database Schema (`dead_letter_queue`)**:
   - `id`: UUID (Primary Key)
   - `original_record_id`: UUID (FK to `raw_data_inbox`)
   - `job_type`: Text (e.g., `inbox_action`)
   - `payload`: JSONB (Contains the `item` object and the intended `action`)
   - `error_details`: JSONB (Contains the error message and stack trace)
   - `status`: Text/Enum (`pending`, `retrying`, `resolved`, `terminal`)
   - `attempt_count`: Integer (Default 0)
   - `max_attempts`: Integer (Default 3 or 5)
   - `next_retry_at`: Timestamptz (Used for exponential backoff)
   - `idempotency_key`: Text/UUID (To prevent duplicate processing)
   - `created_at`: Timestamptz
   - `updated_at`: Timestamptz

2. **Processor Integration (`src/utils/backgroundProcessor.ts`)**:
   - The processor will no longer "commit before processing". Items will be processed, and only marked resolved upon success.
   - Inside the `catch (err)` block, the processor will asynchronously insert a record into the `dead_letter_queue` table with status `pending`.

3. **Concurrency & Polling**:
   - For auto-retries, workers polling the queue must use Postgres's `SELECT ... FOR UPDATE SKIP LOCKED` query mechanism. This is the industry gold standard to prevent multiple Node.js instances from picking up the same DLQ item simultaneously.

4. **Idempotency Constraints**:
   - Because processors will be retried (At-Least-Once delivery), the data pipeline operations must be idempotent. The processor should check the `idempotency_key` or use upsert patterns before creating downstream records to prevent duplicate processing.

5. **DLQ Management UI**:
   - A new administrative UI component (`DLQViewer`) that reads from `dead_letter_queue` where `status = 'pending'` or `terminal`.
   - **Pagination**: To handle large DLQ volumes.
   - **Filtering**: By date, `status`, and `job_type`.
   - **Bulk Actions**: Bulk Retry and Bulk Discard capabilities.
   - **JSON Viewer**: For inspecting the `payload` and stack traces.
   - Provides a "Retry" button that extracts the `payload`, increments the `attempt_count`, and re-invokes the underlying processing logic. On success, updates the DLQ status to `resolved`. On persistent failure (reaching `max_attempts`), status becomes `terminal`.
