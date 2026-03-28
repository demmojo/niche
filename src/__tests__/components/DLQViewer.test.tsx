import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { DLQViewer } from "../../components/DLQViewer";
import { supabase } from "../../utils/hashing";
import { executeActionLogic } from "../../utils/backgroundProcessor";

vi.mock("../../utils/hashing", () => {
  const mockSupabase = {
    from: vi.fn(),
    select: vi.fn(),
    order: vi.fn(),
    in: vi.fn(),
    eq: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  };
  return { supabase: mockSupabase };
});

vi.mock("../../utils/backgroundProcessor", () => ({
  executeActionLogic: vi.fn(),
}));

describe("DLQViewer Component", () => {
  let mockSupabase: any;

  beforeEach(() => {
    vi.resetAllMocks();
    mockSupabase = supabase as any;

    const chainable = [
      "from",
      "select",
      "order",
      "in",
      "eq",
      "update",
      "delete",
    ];
    chainable.forEach((method) => {
      mockSupabase[method].mockReturnValue(mockSupabase);
    });

    // Default mock for window.alert and window.confirm
    vi.spyOn(window, "alert").mockImplementation(() => {});
    vi.spyOn(window, "confirm").mockImplementation(() => true);
  });

  it("renders and fetches DLQ items", async () => {
    mockSupabase.in.mockResolvedValueOnce({
      data: [
        {
          id: "dlq-123",
          job_type: "inbox_action",
          status: "pending",
          attempt_count: 0,
          max_attempts: 3,
          created_at: new Date().toISOString(),
          error_details: { message: "Test error" },
          payload: { item: { id: "item-1" }, action: "keep_both" },
        },
      ],
      error: null,
    });

    render(<DLQViewer />);

    expect(screen.getByText("Loading DLQ...")).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText("dlq-123")).toBeInTheDocument();
      expect(screen.getByText("Test error")).toBeInTheDocument();
      expect(screen.getByText("pending")).toBeInTheDocument();
    });
  });

  it("handles empty queue", async () => {
    mockSupabase.in.mockResolvedValueOnce({ data: [], error: null });

    render(<DLQViewer />);

    await waitFor(() => {
      expect(
        screen.getByText("Queue is empty! Great job."),
      ).toBeInTheDocument();
    });
  });

  it("handles retry action successfully", async () => {
    mockSupabase.in.mockResolvedValueOnce({
      data: [
        {
          id: "dlq-123",
          job_type: "inbox_action",
          status: "pending",
          attempt_count: 0,
          max_attempts: 3,
          created_at: new Date().toISOString(),
          error_details: { message: "Test error" },
          payload: { item: { id: "item-1" }, action: "keep_both" },
        },
      ],
      error: null,
    });

    render(<DLQViewer />);

    await waitFor(() => {
      expect(screen.getByText("Retry")).toBeInTheDocument();
    });

    // setup mocks for retry
    vi.mocked(executeActionLogic).mockResolvedValueOnce();
    mockSupabase.eq.mockResolvedValueOnce({ error: null }); // inbox update
    mockSupabase.eq.mockResolvedValueOnce({ error: null }); // dlq update

    // fetch after retry
    mockSupabase.in.mockResolvedValueOnce({ data: [], error: null });

    fireEvent.click(screen.getByText("Retry"));

    await waitFor(() => {
      expect(executeActionLogic).toHaveBeenCalledWith(
        { id: "item-1" },
        "keep_both",
      );
      expect(window.alert).toHaveBeenCalledWith(
        "Job dlq-123 resolved successfully!",
      );
    });
  });

  it("handles retry action failure", async () => {
    mockSupabase.in.mockResolvedValueOnce({
      data: [
        {
          id: "dlq-123",
          job_type: "inbox_action",
          status: "pending",
          attempt_count: 0,
          max_attempts: 3,
          created_at: new Date().toISOString(),
          error_details: { message: "Test error" },
          payload: { item: { id: "item-1" }, action: "keep_both" },
        },
      ],
      error: null,
    });

    render(<DLQViewer />);

    await waitFor(() => {
      expect(screen.getByText("Retry")).toBeInTheDocument();
    });

    // setup mocks for retry failure
    vi.mocked(executeActionLogic).mockRejectedValueOnce(
      new Error("Logic Failed"),
    );
    mockSupabase.eq.mockResolvedValueOnce({ error: null }); // dlq update failure

    // fetch after retry
    mockSupabase.in.mockResolvedValueOnce({ data: [], error: null });

    fireEvent.click(screen.getByText("Retry"));

    await waitFor(() => {
      expect(executeActionLogic).toHaveBeenCalledWith(
        { id: "item-1" },
        "keep_both",
      );
      expect(window.alert).toHaveBeenCalledWith("Retry failed: Logic Failed");
    });
  });

  it("handles bulk retry", async () => {
    mockSupabase.in.mockResolvedValueOnce({
      data: [
        {
          id: "dlq-1",
          job_type: "inbox_action",
          status: "pending",
          attempt_count: 0,
          max_attempts: 3,
          created_at: new Date().toISOString(),
          error_details: { message: "Test error 1" },
          payload: { item: { id: "item-1" }, action: "keep_both" },
        },
        {
          id: "dlq-2",
          job_type: "inbox_action",
          status: "pending",
          attempt_count: 0,
          max_attempts: 3,
          created_at: new Date().toISOString(),
          error_details: { message: "Test error 2" },
          payload: { item: { id: "item-2" }, action: "discard" },
        },
      ],
      error: null,
    });

    render(<DLQViewer />);

    await waitFor(() => {
      expect(screen.getByText("Bulk Retry All")).toBeInTheDocument();
    });

    // Both succeed
    vi.mocked(executeActionLogic)
      .mockResolvedValueOnce()
      .mockResolvedValueOnce();
    mockSupabase.eq.mockResolvedValue({ error: null }); // multiple updates
    mockSupabase.in.mockResolvedValueOnce({ data: [], error: null }); // final fetch

    fireEvent.click(screen.getByText("Bulk Retry All"));

    await waitFor(() => {
      expect(executeActionLogic).toHaveBeenCalledTimes(2);
      expect(window.alert).toHaveBeenCalledTimes(2);
    });
  });

  it("handles delete action", async () => {
    mockSupabase.in.mockResolvedValueOnce({
      data: [
        {
          id: "dlq-123",
          job_type: "inbox_action",
          status: "terminal",
          attempt_count: 3,
          max_attempts: 3,
          created_at: new Date().toISOString(),
          error_details: { message: "Test error" },
          payload: { item: { id: "item-1" }, action: "keep_both" },
        },
      ],
      error: null,
    });

    render(<DLQViewer />);

    await waitFor(() => {
      expect(screen.getByText("Delete")).toBeInTheDocument();
    });

    mockSupabase.eq.mockResolvedValueOnce({ error: null }); // delete
    mockSupabase.in.mockResolvedValueOnce({ data: [], error: null }); // fetch

    fireEvent.click(screen.getByText("Delete"));

    await waitFor(() => {
      expect(window.confirm).toHaveBeenCalledWith(
        "Are you sure you want to permanently discard this job?",
      );
      expect(mockSupabase.delete).toHaveBeenCalled();
    });
  });

  it("filters items correctly", async () => {
    mockSupabase.in.mockResolvedValueOnce({ data: [], error: null }); // initial fetch

    render(<DLQViewer />);

    await waitFor(() => {
      expect(screen.getByRole("combobox")).toBeInTheDocument();
    });

    mockSupabase.eq.mockResolvedValueOnce({ data: [], error: null }); // filtered fetch
    fireEvent.change(screen.getByRole("combobox"), {
      target: { value: "resolved" },
    });

    await waitFor(() => {
      expect(mockSupabase.eq).toHaveBeenCalledWith("status", "resolved");
    });
  });
});
