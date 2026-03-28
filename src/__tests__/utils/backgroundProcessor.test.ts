import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  processInboxAction,
  executeActionLogic,
} from "../../utils/backgroundProcessor";
import { supabase } from "../../utils/hashing";

vi.mock("../../utils/hashing", () => {
  const mockSupabase = {
    from: vi.fn(),
    update: vi.fn(),
    insert: vi.fn(),
    select: vi.fn(),
    single: vi.fn(),
    eq: vi.fn(),
  };
  return { supabase: mockSupabase };
});

describe("backgroundProcessor", () => {
  let mockSupabase: any;

  beforeEach(() => {
    vi.resetAllMocks();

    mockSupabase = supabase as any;
    const chainable = ["from", "update", "insert", "select", "single", "eq"];
    chainable.forEach((method) => {
      mockSupabase[method].mockReturnValue(mockSupabase);
    });
  });

  it("does nothing if items array is empty", async () => {
    await processInboxAction([], "discard");
    expect(mockSupabase.from).not.toHaveBeenCalled();
  });

  it("handles discard action", async () => {
    mockSupabase.eq.mockResolvedValueOnce({ error: null });

    const items: any = [{ id: "1", pending_data_type: "json" }];
    await processInboxAction(items, "discard");

    expect(mockSupabase.from).toHaveBeenCalledWith("raw_data_inbox");
    expect(mockSupabase.update).toHaveBeenCalledWith(
      expect.objectContaining({ status: "resolved_discard" }),
    );
  });

  it("handles keep_both action", async () => {
    mockSupabase.single
      .mockResolvedValueOnce({
        data: { id: "asset1", logical_asset_id: "la1" },
        error: null,
      }) // insert asset
      .mockResolvedValueOnce({ data: { id: "version1" }, error: null }); // insert version

    mockSupabase.eq
      .mockResolvedValueOnce({ error: null }) // update asset
      .mockResolvedValueOnce({ error: null }); // update inbox

    const items: any = [
      {
        id: "1",
        pending_data_type: "json",
        pending_blob_uri: "uri1",
        matched_logical_asset_id: "old_la1",
      },
    ];
    await processInboxAction(items, "keep_both");

    expect(mockSupabase.from).toHaveBeenCalledWith("raw_data_assets");
    expect(mockSupabase.from).toHaveBeenCalledWith("raw_data_versions");
    expect(mockSupabase.from).toHaveBeenCalledWith("raw_data_inbox");
  });

  it("handles update action", async () => {
    mockSupabase.single
      .mockResolvedValueOnce({ data: { id: "asset1" }, error: null }) // select asset
      .mockResolvedValueOnce({ data: { id: "version1" }, error: null }); // insert version

    mockSupabase.eq
      .mockReturnValueOnce(mockSupabase) // eq() for select asset
      .mockResolvedValueOnce({ error: null }) // eq() for update asset
      .mockResolvedValueOnce({ error: null }); // eq() for update inbox

    const items: any = [
      {
        id: "1",
        pending_data_type: "json",
        pending_blob_uri: "uri1",
        matched_logical_asset_id: "la1",
      },
    ];
    await processInboxAction(items, "update");

    expect(mockSupabase.from).toHaveBeenCalledWith("raw_data_assets");
    expect(mockSupabase.from).toHaveBeenCalledWith("raw_data_versions");
    expect(mockSupabase.from).toHaveBeenCalledWith("raw_data_inbox");
  });

  it("inserts into dead_letter_queue on failure", async () => {
    // Make keep_both fail at the first insert
    mockSupabase.single.mockResolvedValueOnce({
      data: null,
      error: new Error("Insert Error"),
    });

    // Mock dlq insert success
    mockSupabase.insert.mockReturnValueOnce(mockSupabase);
    mockSupabase.insert.mockResolvedValueOnce({ error: null }); // DLQ insert

    const items: any = [{ id: "1", pending_data_type: "json" }];
    await processInboxAction(items, "keep_both");

    expect(mockSupabase.from).toHaveBeenCalledWith("dead_letter_queue");
    expect(mockSupabase.insert).toHaveBeenCalledWith(
      expect.objectContaining({
        job_type: "inbox_action",
        original_record_id: "1",
        status: "pending",
        attempt_count: 1,
      }),
    );
  });

  it("logs critical error if DLQ insert fails", async () => {
    // Action fails
    mockSupabase.eq.mockResolvedValueOnce({ error: new Error("DB Error") });

    // DLQ insert fails
    mockSupabase.insert.mockResolvedValueOnce({
      error: new Error("DLQ Write Error"),
    });

    const items: any = [{ id: "1", pending_data_type: "json" }];
    await processInboxAction(items, "discard"); // use discard to just hit the inbox update failure
  });
});
