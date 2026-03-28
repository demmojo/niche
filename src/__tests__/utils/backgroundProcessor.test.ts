import { describe, it, expect, vi, beforeEach } from "vitest";
import { processInboxAction } from "../../utils/backgroundProcessor";
import { supabase } from "../../utils/hashing";

vi.mock("../../utils/hashing", () => {
  const mockSupabase = {
    from: vi.fn(),
    update: vi.fn(),
    in: vi.fn(),
    insert: vi.fn(),
    select: vi.fn(),
    single: vi.fn(),
    eq: vi.fn(),
  };
  return { supabase: mockSupabase };
});

describe("backgroundProcessor", () => {
  beforeEach(() => {
    vi.resetAllMocks();

    const chainable = [
      "from",
      "update",
      "in",
      "insert",
      "select",
      "single",
      "eq",
    ];
    chainable.forEach((method) => {
      (supabase as any)[method].mockReturnValue(supabase);
    });
  });

  it("does nothing if items array is empty", async () => {
    await processInboxAction([], "discard");
    expect((supabase as any).from).not.toHaveBeenCalled();
  });

  it("handles discard action", async () => {
    vi.mocked((supabase as any).in).mockResolvedValueOnce({
      error: null,
    } as any);

    const items: any = [{ id: "1", pending_data_type: "json" }];
    await processInboxAction(items, "discard");

    expect((supabase as any).from).toHaveBeenCalledWith("raw_data_inbox");
    expect((supabase as any).update).toHaveBeenCalledWith(
      expect.objectContaining({ status: "resolved_discard" }),
    );
  });

  it("handles keep_both action", async () => {
    vi.mocked((supabase as any).in).mockResolvedValueOnce({
      error: null,
    } as any);
    vi.mocked((supabase as any).single)
      .mockResolvedValueOnce({
        data: { id: "asset1", logical_asset_id: "la1" },
        error: null,
      } as any) // insert asset
      .mockResolvedValueOnce({ data: { id: "version1" }, error: null } as any); // insert version
    vi.mocked((supabase as any).eq).mockResolvedValueOnce({
      error: null,
    } as any); // update asset

    const items: any = [
      {
        id: "1",
        pending_data_type: "json",
        pending_blob_uri: "uri1",
        matched_logical_asset_id: "old_la1",
      },
    ];
    await processInboxAction(items, "keep_both");

    expect((supabase as any).from).toHaveBeenCalledWith("raw_data_inbox");
    expect((supabase as any).from).toHaveBeenCalledWith("raw_data_assets");
    expect((supabase as any).from).toHaveBeenCalledWith("raw_data_versions");
  });

  it("handles update action", async () => {
    vi.mocked((supabase as any).in).mockResolvedValueOnce({
      error: null,
    } as any);

    vi.mocked((supabase as any).eq)
      .mockReturnValueOnce(supabase as any) // First eq() continues the chain to .single()
      .mockResolvedValueOnce({ error: null } as any); // Second eq() is awaited directly

    vi.mocked((supabase as any).single)
      .mockResolvedValueOnce({ data: { id: "asset1" }, error: null } as any) // select asset
      .mockResolvedValueOnce({ data: { id: "version1" }, error: null } as any); // insert version

    const items: any = [
      {
        id: "1",
        pending_data_type: "json",
        pending_blob_uri: "uri1",
        matched_logical_asset_id: "la1",
      },
    ];
    await processInboxAction(items, "update");

    expect((supabase as any).from).toHaveBeenCalledWith("raw_data_inbox");
    expect((supabase as any).from).toHaveBeenCalledWith("raw_data_assets");
    expect((supabase as any).from).toHaveBeenCalledWith("raw_data_versions");
  });

  it("returns early if inbox update fails", async () => {
    vi.mocked((supabase as any).in).mockResolvedValueOnce({
      error: new Error("DB Error"),
    } as any);

    const items: any = [{ id: "1", pending_data_type: "json" }];
    await processInboxAction(items, "discard");

    expect((supabase as any).from).toHaveBeenCalledTimes(1);
    expect((supabase as any).from).toHaveBeenCalledWith("raw_data_inbox");
  });

  it("catches and logs errors during processing", async () => {
    const consoleErrorSpy = vi
      .spyOn(console, "error")
      .mockImplementation(() => {});
    vi.mocked((supabase as any).in).mockResolvedValueOnce({
      error: null,
    } as any);

    // Make keep_both fail at the first insert
    vi.mocked((supabase as any).single).mockResolvedValueOnce({
      data: null,
      error: new Error("Insert Error"),
    } as any);

    const items: any = [{ id: "1", pending_data_type: "json" }];
    await processInboxAction(items, "keep_both");

    expect(consoleErrorSpy).toHaveBeenCalledWith(
      expect.stringContaining(
        "Failed to process item 1 with action keep_both:",
      ),
      expect.any(Error),
    );
    consoleErrorSpy.mockRestore();
  });
});
