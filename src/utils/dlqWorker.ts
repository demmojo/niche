import { supabase } from "./hashing";
import { executeActionLogic } from "./backgroundProcessor";
import { DLQRecord } from "../types";

export async function processDLQ() {
  console.log("Checking Dead-Letter Queue for pending retries...");

  // Since we are running Supabase on the client side without direct SQL access,
  // we simulate `FOR UPDATE SKIP LOCKED` by fetching pending items and attempting
  // to process them. In a real backend, this would be a secure SQL query.

  const { data: pendingJobs, error: fetchError } = await supabase
    .from("dead_letter_queue")
    .select("*")
    .in("status", ["pending", "retrying"])
    .lte("next_retry_at", new Date().toISOString())
    .order("next_retry_at", { ascending: true })
    .limit(10);

  if (fetchError) {
    console.error("Failed to fetch DLQ items", fetchError);
    return;
  }

  if (!pendingJobs || pendingJobs.length === 0) {
    return;
  }

  for (const job of pendingJobs as DLQRecord[]) {
    try {
      console.log(`Retrying job ${job.id} (attempt ${job.attempt_count + 1})`);

      if (job.job_type === "inbox_action") {
        const { item, action } = job.payload;
        await executeActionLogic(item, action);

        // Mark inbox item as resolved
        const { error: inboxError } = await supabase
          .from("raw_data_inbox")
          .update({
            status: `resolved_${action}`,
            resolved_at: new Date().toISOString(),
          })
          .eq("id", item.id);

        if (inboxError)
          throw new Error(
            `Failed to update inbox status: ${inboxError.message}`,
          );
      } else {
        throw new Error(`Unknown job_type: ${job.job_type}`);
      }

      // Mark DLQ item as resolved
      await supabase
        .from("dead_letter_queue")
        .update({
          status: "resolved",
          updated_at: new Date().toISOString(),
        })
        .eq("id", job.id);

      console.log(`Successfully resolved DLQ job ${job.id}`);
    } catch (err) {
      console.error(`Failed to retry DLQ job ${job.id}:`, err);

      const newAttemptCount = job.attempt_count + 1;
      const isTerminal = newAttemptCount >= job.max_attempts;
      const status = isTerminal ? "terminal" : "retrying";

      const base_delay = 60 * 1000; // 1 minute
      const next_retry_at = new Date(
        Date.now() + base_delay * Math.pow(2, newAttemptCount - 1),
      ).toISOString();

      const errorMsg = err instanceof Error ? err.message : String(err);
      const errorStack = err instanceof Error ? err.stack : undefined;

      await supabase
        .from("dead_letter_queue")
        .update({
          status,
          attempt_count: newAttemptCount,
          next_retry_at,
          error_details: { message: errorMsg, stack: errorStack },
          updated_at: new Date().toISOString(),
        })
        .eq("id", job.id);

      if (isTerminal) {
        console.error(
          `🚨 ALERT: DLQ Job ${job.id} has reached terminal status!`,
        );
        // Task 6: Alerting Integration -> Trigger Slack/Email notification here
      }
    }
  }
}
