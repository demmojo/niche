-- Migration: Flow Tracing DLQ
-- Description: Creates the dead_letter_queue table and associated policies

CREATE TABLE dead_letter_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  original_record_id UUID, -- Optional foreign key context depending on job_type
  job_type TEXT NOT NULL,
  payload JSONB NOT NULL,
  error_details JSONB,
  status TEXT NOT NULL CHECK (status IN ('pending', 'retrying', 'resolved', 'terminal')) DEFAULT 'pending',
  attempt_count INTEGER NOT NULL DEFAULT 0,
  max_attempts INTEGER NOT NULL DEFAULT 5,
  next_retry_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  idempotency_key TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes for performance
CREATE INDEX idx_dlq_status_next_retry_at ON dead_letter_queue USING btree(status, next_retry_at);
CREATE INDEX idx_dlq_job_type_created_at ON dead_letter_queue USING btree(job_type, created_at);
CREATE UNIQUE INDEX idx_dlq_idempotency_key ON dead_letter_queue (idempotency_key) WHERE idempotency_key IS NOT NULL AND status IN ('pending', 'retrying');

-- Row Level Security
ALTER TABLE dead_letter_queue ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to read and update
-- Note: In a real multi-tenant system, we would filter by tenant_id. 
-- Since this is an admin/internal queue, we allow authenticated users for now.
CREATE POLICY "Allow authenticated users to read DLQ"
  ON dead_letter_queue FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated users to insert to DLQ"
  ON dead_letter_queue FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Allow authenticated users to update DLQ"
  ON dead_letter_queue FOR UPDATE
  TO authenticated
  USING (true);

-- Updated_at trigger
CREATE OR REPLACE FUNCTION update_dead_letter_queue_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_dead_letter_queue_updated_at_trigger
BEFORE UPDATE ON dead_letter_queue
FOR EACH ROW
EXECUTE FUNCTION update_dead_letter_queue_updated_at();

-- Archival Cron (Optional task 9 equivalent via pg_cron if enabled, but we just leave a comment here)
-- SELECT cron.schedule('dlq_cleanup', '0 0 * * 0', $$ DELETE FROM dead_letter_queue WHERE status = 'resolved' AND updated_at < now() - interval '30 days' $$);
