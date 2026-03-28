import { describe, it, expect, vi, beforeEach } from "vitest";
import { processDLQ } from "../../utils/dlqWorker";
import { executeActionLogic } from "../../utils/backgroundProcessor";
import { supabase } from "../../utils/hashing";

vi.mock("../../utils/hashing", () => {
  const mockSupabase = {
    from: vi.fn(),
    select: vi.fn(),
    in: vi.fn(),
    lte: vi.fn(),
    order: vi.fn(),
    limit: vi.fn(),
    update: vi.fn(),
    eq: vi.fn(),
  };
  return { supabase: mockSupabase };
});

vi.mock("../../utils/backgroundProcessor", () => ({
  executeActionLogic: vi.fn(),
}));

describe("dlqWorker", () => {
  let mockSupabase: any;

  beforeEach(() => {
    vi.resetAllMocks();

    mockSupabase = supabase as any;
    const chainable = [
      "from",
      "select",
      "in",
      "lte",
      "order",
      "limit",
      "update",
      "eq",
    ];
    chainable.forEach((method) => {
      mockSupabase[method].mockReturnValue(mockSupabase);
    });
  });

  it("returns early if fetching DLQ fails", async () => {
    mockSupabase.limit.mockResolvedValueOnce({
      data: null,
      error: new Error("Fetch Error"),
    });

    await processDLQ();

    expect(executeActionLogic).not.toHaveBeenCalled();
  });

  it("returns early if no pending jobs", async () => {
    mockSupabase.limit.mockResolvedValueOnce({ data: [], error: null });

    await processDLQ();

    expect(executeActionLogic).not.toHaveBeenCalled();
  });

  it("retries a pending inbox_action successfully", async () => {
    const consoleLogSpy = vi.spyOn(console, "log").mockImplementation(() => {});

    mockSupabase.limit.mockResolvedValueOnce({
      data: [
        {
          id: "dlq-1",
          job_type: "inbox_action",
          attempt_count: 1,
          payload: { item: { id: "item-1" }, action: "keep_both" },
        },
      ],
      error: null,
    });

    // inbox item update success
    mockSupabase.eq.mockResolvedValueOnce({ error: null });
    // dlq item update success
    mockSupabase.eq.mockResolvedValueOnce({ error: null });

    await processDLQ();

    expect(executeActionLogic).toHaveBeenCalledWith(
      { id: "item-1" },
      "keep_both",
    );
    expect(mockSupabase.from).toHaveBeenCalledWith("raw_data_inbox");
    expect(mockSupabase.from).toHaveBeenCalledWith("dead_letter_queue");
    expect(mockSupabase.update).toHaveBeenCalledWith(
      expect.objectContaining({ status: "resolved" }),
    );

    consoleLogSpy.mockRestore();
  });

  it("throws error for unknown job_type", async () => {
    mockSupabase.limit.mockResolvedValueOnce({
      data: [
        {
          id: "dlq-1",
          job_type: "unknown_type",
          attempt_count: 1,
          max_attempts: 3,
        },
      ],
      error: null,
    });

    // dlq item update success
    mockSupabase.eq.mockResolvedValueOnce({ error: null });

    await processDLQ();

    expect(mockSupabase.update).toHaveBeenCalledWith(
      expect.objectContaining({
        status: "retrying",
        attempt_count: 2,
      }),
    );
  });

  it("marks as terminal if max_attempts reached", async () => {
    mockSupabase.limit.mockResolvedValueOnce({
      data: [
        {
          id: "dlq-1",
          job_type: "inbox_action",
          attempt_count: 2,
          max_attempts: 3,
          payload: { item: { id: "item-1" }, action: "keep_both" },
        },
      ],
      error: null,
    });

    // Mock executeActionLogic to throw
    vi.mocked(executeActionLogic).mockRejectedValueOnce(
      new Error("Logic Failed"),
    );

    // dlq item update success
    mockSupabase.eq.mockResolvedValueOnce({ error: null });

    await processDLQ();

    expect(mockSupabase.update).toHaveBeenCalledWith(
      expect.objectContaining({
        status: "terminal",
        attempt_count: 3,
      }),
    );
  });
});
