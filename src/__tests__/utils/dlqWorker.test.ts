import { describe, it, expect, vi, beforeEach } from "vitest";
import { processDLQ } from "../../utils/dlqWorker";
import { supabase } from "../../utils/hashing";
import { executeActionLogic } from "../../utils/backgroundProcessor";

// Hoist mocks
const {
  mockLimit,
  mockOrder,
  mockLte,
  mockIn,
  mockSelect,
  mockUpdate,
  mockEq,
  mockFrom,
} = vi.hoisted(() => {
  const mockLimit = vi.fn();
  const mockOrder = vi.fn(() => ({ limit: mockLimit }));
  const mockLte = vi.fn(() => ({ order: mockOrder }));
  const mockIn = vi.fn(() => ({ lte: mockLte }));
  const mockSelect = vi.fn(() => ({ in: mockIn }));

  const mockEq = vi.fn();
  const mockUpdate = vi.fn(() => ({ eq: mockEq }));

  const mockFrom = vi.fn((table) => {
    if (table === "dead_letter_queue") {
      return { select: mockSelect, update: mockUpdate };
    }
    if (table === "raw_data_inbox") {
      return { update: mockUpdate };
    }
    return {};
  });

  return {
    mockLimit,
    mockOrder,
    mockLte,
    mockIn,
    mockSelect,
    mockUpdate,
    mockEq,
    mockFrom,
  };
});

vi.mock("../../utils/hashing", () => ({
  supabase: {
    from: mockFrom,
  },
}));

vi.mock("../../utils/backgroundProcessor", () => ({
  executeActionLogic: vi.fn(),
}));

describe("dlqWorker", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, "log").mockImplementation(() => {});
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  it("should do nothing if fetch fails", async () => {
    mockLimit.mockResolvedValueOnce({ error: new Error("DB Error") });
    await processDLQ();
    expect(mockFrom).toHaveBeenCalledWith("dead_letter_queue");
    expect(console.error).toHaveBeenCalledWith(
      "Failed to fetch DLQ items",
      expect.any(Error),
    );
    expect(executeActionLogic).not.toHaveBeenCalled();
  });

  it("should do nothing if no pending jobs", async () => {
    mockLimit.mockResolvedValueOnce({ data: [] });
    await processDLQ();
    expect(executeActionLogic).not.toHaveBeenCalled();
  });

  it("should process a valid job and mark as resolved", async () => {
    const job = {
      id: "job-1",
      job_type: "inbox_action",
      attempt_count: 0,
      payload: { item: { id: "item-1" }, action: "keep_both" },
    };

    mockLimit.mockResolvedValueOnce({ data: [job] });
    vi.mocked(executeActionLogic).mockResolvedValueOnce();

    // First update for raw_data_inbox
    mockEq.mockResolvedValueOnce({ error: null });
    // Second update for dead_letter_queue
    mockEq.mockResolvedValueOnce({ error: null });

    await processDLQ();

    expect(executeActionLogic).toHaveBeenCalledWith(
      { id: "item-1" },
      "keep_both",
    );
    expect(mockFrom).toHaveBeenCalledWith("raw_data_inbox");
    expect(mockUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ status: "resolved_keep_both" }),
    );

    expect(mockFrom).toHaveBeenCalledWith("dead_letter_queue");
    expect(mockUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ status: "resolved" }),
    );
  });

  it("should increment attempt and set status to retrying on failure", async () => {
    const job = {
      id: "job-2",
      job_type: "inbox_action",
      attempt_count: 0,
      max_attempts: 3,
      payload: { item: { id: "item-2" }, action: "keep_both" },
    };

    mockLimit.mockResolvedValueOnce({ data: [job] });
    vi.mocked(executeActionLogic).mockRejectedValueOnce(
      new Error("Action failed"),
    );

    mockEq.mockResolvedValueOnce({ error: null });

    await processDLQ();

    expect(mockFrom).toHaveBeenCalledWith("dead_letter_queue");
    expect(mockUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        status: "retrying",
        attempt_count: 1,
      }),
    );
  });

  it("should set status to terminal when max_attempts reached", async () => {
    const job = {
      id: "job-3",
      job_type: "inbox_action",
      attempt_count: 2,
      max_attempts: 3,
      payload: { item: { id: "item-3" }, action: "keep_both" },
    };

    mockLimit.mockResolvedValueOnce({ data: [job] });
    vi.mocked(executeActionLogic).mockRejectedValueOnce(
      new Error("Action failed again"),
    );

    mockEq.mockResolvedValueOnce({ error: null });

    await processDLQ();

    expect(mockUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        status: "terminal",
        attempt_count: 3,
      }),
    );
    expect(console.error).toHaveBeenCalledWith(
      expect.stringContaining(
        "🚨 ALERT: DLQ Job job-3 has reached terminal status!",
      ),
    );
  });

  it("should handle unknown job_type", async () => {
    const job = {
      id: "job-4",
      job_type: "unknown_action",
      attempt_count: 0,
      max_attempts: 3,
      payload: {},
    };

    mockLimit.mockResolvedValueOnce({ data: [job] });
    mockEq.mockResolvedValueOnce({ error: null });

    await processDLQ();

    expect(executeActionLogic).not.toHaveBeenCalled();
    expect(mockUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        status: "retrying",
      }),
    );
    expect(console.error).toHaveBeenCalledWith(
      "Failed to retry DLQ job job-4:",
      expect.any(Error),
    );
  });
});
