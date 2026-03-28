import { supabase } from "./hashing";
import { InboxItem } from "../hooks/useApprovalStore";

export async function executeActionLogic(
  item: InboxItem,
  action: "keep_both" | "update" | "discard",
) {
  switch (action) {
    case "keep_both": {
      // Create a brand new logical asset (fork)
      // First insert a new asset
      const { data: newAsset, error: assetError } = await supabase
        .from("raw_data_assets")
        .insert({
          data_type: item.pending_data_type,
        })
        .select()
        .single();

      if (assetError || !newAsset) throw assetError;

      // Then insert the version
      const { data: newVersion, error: versionError } = await supabase
        .from("raw_data_versions")
        .insert({
          asset_id: newAsset.id,
          logical_asset_id: newAsset.logical_asset_id,
          blob_uri: item.pending_blob_uri,
          data_type: item.pending_data_type,
          extracted_metadata: {
            ...item,
            _action: "keep_both",
            _original_conflict_id: item.matched_logical_asset_id,
          },
        })
        .select()
        .single();

      if (versionError || !newVersion) throw versionError;

      // Update the asset with the current version
      await supabase
        .from("raw_data_assets")
        .update({ current_version_id: newVersion.id })
        .eq("id", newAsset.id);

      break;
    }

    case "update": {
      // Archiving: Append a new version to the existing logical asset
      // First, get the parent asset ID (the UUID pk, not logical_asset_id)
      const { data: parentAsset, error: getAssetError } = await supabase
        .from("raw_data_assets")
        .select("id")
        .eq("logical_asset_id", item.matched_logical_asset_id)
        .single();

      if (getAssetError || !parentAsset) throw getAssetError;

      // Insert the new version
      const { data: newVersion, error: versionError } = await supabase
        .from("raw_data_versions")
        .insert({
          asset_id: parentAsset.id,
          logical_asset_id: item.matched_logical_asset_id,
          blob_uri: item.pending_blob_uri,
          data_type: item.pending_data_type,
          extracted_metadata: { ...item, _action: "update" },
        })
        .select()
        .single();

      if (versionError || !newVersion) throw versionError;

      // Update the asset pointer to the newly appended version
      await supabase
        .from("raw_data_assets")
        .update({ current_version_id: newVersion.id })
        .eq("id", parentAsset.id);

      break;
    }

    case "discard": {
      // Do nothing to the assets table, the incoming data is rejected.
      break;
    }
  }
}

/**
 * Simulates a backend worker processing inbox items.
 * In a production environment, this would be a webhook or background job (e.g. pg_cron or edge function).
 */
export async function processInboxAction(
  items: InboxItem[],
  action: "keep_both" | "update" | "discard",
) {
  if (items.length === 0) return;

  for (const item of items) {
    try {
      // 1. Process data pipeline operation FIRST (Idempotency ensures safe retry)
      await executeActionLogic(item, action);

      // 2. Mark as resolved ONLY AFTER successful processing
      const { error: inboxError } = await supabase
        .from("raw_data_inbox")
        .update({
          status: `resolved_${action}`,
          resolved_at: new Date().toISOString(),
        })
        .eq("id", item.id);

      if (inboxError) {
        throw new Error(`Failed to update inbox status: ${inboxError.message}`);
      }
    } catch (err) {
      console.error(
        `Failed to process item ${item.id} with action ${action}:`,
        err,
      );

      // Exponential backoff configuration
      const attempt_count = 1; // First failure
      const base_delay = 60 * 1000; // 1 minute
      const next_retry_at = new Date(
        Date.now() + base_delay * Math.pow(2, attempt_count - 1),
      ).toISOString();

      // Ensure error is properly formatted
      const errorMsg = err instanceof Error ? err.message : String(err);
      const errorStack = err instanceof Error ? err.stack : undefined;

      // Insert into DLQ
      const { error: dlqError } = await supabase
        .from("dead_letter_queue")
        .insert({
          job_type: "inbox_action",
          original_record_id: item.id,
          idempotency_key: `${item.id}-${action}`,
          payload: { item, action },
          error_details: { message: errorMsg, stack: errorStack },
          status: "pending",
          attempt_count,
          max_attempts: 5,
          next_retry_at,
        });

      if (dlqError) {
        console.error("CRITICAL: Failed to write to DLQ!", dlqError);
      }
    }
  }
}
