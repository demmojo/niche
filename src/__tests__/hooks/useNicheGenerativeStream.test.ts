import { renderHook, act, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { useNicheGenerativeStream } from "../../../src/hooks/useNicheGenerativeStream";

// Mock the AI SDK so we don't actually do SSE calls
vi.mock("@ai-sdk/react", () => ({
  useChat: vi.fn(() => ({
    messages: [],
    input: "",
    handleInputChange: vi.fn(),
    handleSubmit: vi.fn(),
    isLoading: false,
    stop: vi.fn(),
    error: null,
    data: [],
    setMessages: vi.fn(),
    append: vi.fn(),
  })),
}));

import { useChat } from "@ai-sdk/react";

describe("useNicheGenerativeStream", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should initialize with empty or initial messages", () => {
    const { result } = renderHook(() =>
      useNicheGenerativeStream({ api: "/api/chat", initialData: "Hello" }),
    );

    // Should configure useChat with initialMessages mapping
    expect(useChat).toHaveBeenCalledWith(
      expect.objectContaining({
        initialMessages: [{ id: "init", role: "assistant", content: "Hello" }],
      }),
    );

    expect(result.current.messages).toEqual([]);
    expect(result.current.isInterrupted).toBe(false);
  });

  it("should stop the stream and fetch final state on visibility change", async () => {
    const mockStop = vi.fn();
    const mockSetMessages = vi.fn();

    (useChat as any).mockReturnValue({
      messages: [],
      input: "",
      handleInputChange: vi.fn(),
      handleSubmit: vi.fn(),
      isLoading: true,
      stop: mockStop,
      error: null,
      data: [],
      setMessages: mockSetMessages,
      append: vi.fn(),
    });

    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () =>
          Promise.resolve({ status: "completed", finalText: "Final answer" }),
      } as any),
    );

    let onResponseCallback: any;
    // Capture the onResponse callback to manually trigger "active" state
    (useChat as any).mockImplementation((opts: any) => {
      onResponseCallback = opts.onResponse;
      return {
        messages: [],
        input: "",
        handleInputChange: vi.fn(),
        handleSubmit: vi.fn(),
        isLoading: true,
        stop: mockStop,
        error: null,
        data: [],
        setMessages: mockSetMessages,
        append: vi.fn(),
      };
    });

    const { result } = renderHook(() =>
      useNicheGenerativeStream({ api: "/api/chat", jobId: "job1" }),
    );

    // Transition state to active
    act(() => {
      onResponseCallback();
    });

    // Simulate tab coming back to foreground
    act(() => {
      Object.defineProperty(document, "visibilityState", {
        value: "visible",
        writable: true,
      });
      document.dispatchEvent(new Event("visibilitychange"));
    });

    // Should stop the zombie stream immediately
    expect(mockStop).toHaveBeenCalled();

    // Should make the REST fetch
    expect(global.fetch).toHaveBeenCalledWith("/api/generation/job1/status");

    // Wait for the state reconciliation and ensure it overwrote local messages
    await waitFor(() => {
      expect(mockSetMessages).toHaveBeenCalledWith([
        { id: "final", role: "assistant", content: "Final answer" },
      ]);
    });
  });

  it("should parse valid stream data safely without throwing on malformed packets", () => {
    const validData = [{ type: "test", payload: "value" }];
    const invalidData = [{ malformed: true }];

    // Test the safe Parse swallowing error behavior
    const consoleSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

    (useChat as any).mockReturnValue({
      messages: [],
      data: [...validData, ...invalidData],
      stop: vi.fn(),
      setMessages: vi.fn(),
      append: vi.fn(),
    });

    renderHook(() =>
      useNicheGenerativeStream({ api: "/api/chat", jobId: "job2" }),
    );

    expect(consoleSpy).toHaveBeenCalledWith("Dropped malformed data packet", {
      malformed: true,
    });

    consoleSpy.mockRestore();
  });
});
