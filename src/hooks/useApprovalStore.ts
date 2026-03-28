import { create } from "zustand";
import { persist } from "zustand/middleware";
import { supabase } from "../utils/hashing";
import { processInboxAction } from "../utils/backgroundProcessor";

export interface InboxItem {
  id: string;
  pending_data_type: "json" | "markdown" | "image";
  pending_blob_uri: string;
  similarity_score: number;
  matched_logical_asset_id: string;
  created_at: string;
  status: string;
}

interface ApprovalState {
  isBannerDismissed: boolean;
  setBannerDismissed: (dismissed: boolean) => void;
  items: InboxItem[];
  loading: boolean;
  fetchInbox: () => Promise<void>;
  resolveItems: (
    ids: string[],
    action: "keep_both" | "update" | "discard",
  ) => Promise<void>;
}

export const useApprovalStore = create<ApprovalState>()(
  persist(
    (set, get) => ({
      isBannerDismissed: false,
      /**
       *
       */
      setBannerDismissed: (dismissed) => set({ isBannerDismissed: dismissed }),
      items: [],
      loading: true,
      /**
       *
       */
      fetchInbox: async () => {
        set({ loading: true });
        try {
          const { data, error } = await supabase
            .from("raw_data_inbox")
            .select("*")
            .eq("status", "pending")
            .order("created_at", { ascending: false });

          if (error) {
            // Mock data for UI development if DB isn't ready
            set({
              items: [
                {
                  id: "inbox-1",
                  pending_data_type: "markdown",
                  pending_blob_uri: "s3://bucket/new_scrape.md",
                  similarity_score: 2, // Hamming distance
                  matched_logical_asset_id: "asset-44",
                  status: "pending",
                  created_at: new Date().toISOString(),
                },
                {
                  id: "inbox-2",
                  pending_data_type: "json",
                  pending_blob_uri: "s3://bucket/new_data.json",
                  similarity_score: 0.95, // Cosine similarity
                  matched_logical_asset_id: "asset-45",
                  status: "pending",
                  created_at: new Date(Date.now() - 3600000).toISOString(),
                },
              ],
              loading: false,
            });
          } else {
            set({ items: data || [], loading: false });
          }
        } catch (err) {
          console.error("Failed to fetch inbox:", err);
          set({ loading: false });
        }
      },
      /**
       *
       */
      resolveItems: async (
        ids: string[],
        action: "keep_both" | "update" | "discard",
      ) => {
        // Optimistic update
        const previousItems = get().items;
        const itemsToProcess = previousItems.filter((item) =>
          ids.includes(item.id),
        );
        set({ items: previousItems.filter((item) => !ids.includes(item.id)) });

        try {
          // Trigger simulated background processor to update `raw_data_versions` and `raw_data_assets`
          await processInboxAction(itemsToProcess, action);
        } catch (err) {
          console.error(`Error performing action ${action}:`, err);
          // Rollback optimistic update
          set({ items: previousItems });
        }
      },
    }),
    {
      name: "approval-inbox-storage",
      /**
       *
       */
      partialize: (state) => ({ isBannerDismissed: state.isBannerDismissed }), // Only persist banner state
    },
  ),
);
