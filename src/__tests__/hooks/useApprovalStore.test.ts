import { describe, it, expect, vi, beforeEach } from "vitest";
import { useApprovalStore } from "../../hooks/useApprovalStore";
import { processInboxAction } from "../../utils/backgroundProcessor";
import { supabase } from "../../utils/hashing";

vi.mock("../../utils/backgroundProcessor", () => ({
  processInboxAction: vi.fn(),
}));

vi.mock("../../utils/hashing", () => {
  const mockSupabase = {
    from: vi.fn().mockReturnThis(),
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
  };
  return { supabase: mockSupabase };
});

describe("useApprovalStore", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset store state
    useApprovalStore.setState({
      items: [],
      loading: true,
      isBannerDismissed: false,
    });

    const chainable = ["from", "select", "eq", "order"];
    chainable.forEach((method) => {
      (supabase as any)[method].mockReturnValue(supabase);
    });
  });

  it("sets banner dismissed state", () => {
    expect(useApprovalStore.getState().isBannerDismissed).toBe(false);
    useApprovalStore.getState().setBannerDismissed(true);
    expect(useApprovalStore.getState().isBannerDismissed).toBe(true);
  });

  describe("fetchInbox", () => {
    it("fetches items from supabase successfully", async () => {
      const mockData = [{ id: "1", status: "pending" }];
      vi.mocked((supabase as any).order).mockResolvedValueOnce({
        data: mockData,
        error: null,
      } as any);

      await useApprovalStore.getState().fetchInbox();

      expect((supabase as any).from).toHaveBeenCalledWith("raw_data_inbox");
      expect(useApprovalStore.getState().loading).toBe(false);
      expect(useApprovalStore.getState().items).toEqual(mockData);
    });

    it("loads mock data when supabase returns an error", async () => {
      vi.mocked((supabase as any).order).mockResolvedValueOnce({
        data: null,
        error: new Error("DB Error"),
      } as any);

      await useApprovalStore.getState().fetchInbox();

      const items = useApprovalStore.getState().items;
      expect(useApprovalStore.getState().loading).toBe(false);
      expect(items.length).toBe(2);
      expect(items[0].id).toBe("inbox-1");
      expect(items[1].id).toBe("inbox-2");
    });

    it("handles unexpected exceptions during fetch", async () => {
      vi.mocked((supabase as any).order).mockRejectedValueOnce(
        new Error("Network error"),
      );

      await useApprovalStore.getState().fetchInbox();

      expect(useApprovalStore.getState().loading).toBe(false);
    });
  });

  describe("resolveItems", () => {
    it("optimistically removes items and calls processInboxAction", async () => {
      const mockItems: any = [
        { id: "1", pending_data_type: "json" },
        { id: "2", pending_data_type: "json" },
      ];
      useApprovalStore.setState({ items: mockItems });

      vi.mocked(processInboxAction).mockResolvedValueOnce();

      await useApprovalStore.getState().resolveItems(["1"], "discard");

      // Assert optimistic update
      expect(useApprovalStore.getState().items.length).toBe(1);
      expect(useApprovalStore.getState().items[0].id).toBe("2");

      // Assert backend call
      expect(processInboxAction).toHaveBeenCalledWith(
        [mockItems[0]],
        "discard",
      );
    });

    it("rolls back optimistic update on error", async () => {
      const mockItems: any = [
        { id: "1", pending_data_type: "json" },
        { id: "2", pending_data_type: "json" },
      ];
      useApprovalStore.setState({ items: mockItems });

      vi.mocked(processInboxAction).mockRejectedValueOnce(
        new Error("Process error"),
      );

      await useApprovalStore.getState().resolveItems(["1"], "keep_both");

      // Assert rollback
      const currentItems = useApprovalStore.getState().items;
      expect(currentItems.length).toBe(2);
      expect(currentItems.map((i) => i.id).sort()).toEqual(["1", "2"]);
    });

    it("prevents stale closures when rolling back an optimistic update", async () => {
      const mockItems: any = [
        { id: "1", pending_data_type: "json" },
        { id: "2", pending_data_type: "json" },
        { id: "3", pending_data_type: "json" },
      ];
      useApprovalStore.setState({ items: mockItems });

      // First call fails after a delay
      vi.mocked(processInboxAction).mockImplementationOnce(
        () =>
          new Promise((_, reject) =>
            setTimeout(() => reject(new Error("Fail 1")), 50),
          ),
      );
      // Second call succeeds immediately
      vi.mocked(processInboxAction).mockImplementationOnce(() =>
        Promise.resolve(),
      );

      const p1 = useApprovalStore.getState().resolveItems(["1"], "keep_both");
      const p2 = useApprovalStore.getState().resolveItems(["2"], "discard");

      await Promise.allSettled([p1, p2]);

      const remainingIds = useApprovalStore
        .getState()
        .items.map((i) => i.id)
        .sort();
      expect(remainingIds).toEqual(["1", "3"]);
    });
  });
});
