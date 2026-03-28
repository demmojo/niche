import { supabase } from "./hashing";
import { InboxItem } from "../hooks/useApprovalStore";

/**
 * Simulates a backend worker processing inbox items.
 * In a production environment, this would be a webhook or background job (e.g. pg_cron or edge function).
 */
export async function processInboxAction(
  items: InboxItem[],
  action: "keep_both" | "update" | "discard",
) {
  if (items.length === 0) return;

  // 1. Mark as resolved in the inbox table
  const { error: inboxError } = await supabase
    .from("raw_data_inbox")
    .update({
      status: `resolved_${action}`,
      resolved_at: new Date().toISOString(),
    })
    .in(
      "id",
      items.map((i) => i.id),
    );

  if (inboxError) {
    console.warn(
      "Could not update inbox table (likely no DB connected), simulating success.",
    );
    return; // Early return for mock environments
  }

  // 2. Perform the actual data pipeline operations
  for (const item of items) {
    try {
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
          // The inbox table is already marked as 'resolved_discard'.
          break;
        }
      }
    } catch (err) {
      console.error(
        `Failed to process item ${item.id} with action ${action}:`,
        err,
      );
    }
  }
}
