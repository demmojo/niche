import { renderHook, act, waitFor } from "@testing-library/react";
import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { useOnboarding } from "../../hooks/useOnboarding";
import * as storageUtils from "../../utils/storage";

describe("useOnboarding", () => {
  const modalKey = "testModalKey";
  const tourKey = "testTourKey";

  beforeEach(() => {
    localStorage.clear();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  it("starts with modal active if not seen", () => {
    const { result } = renderHook(() => useOnboarding(modalKey, tourKey));

    expect(result.current.currentStep).toBe("modal");
    expect(result.current.isModalActive).toBe(true);
    expect(result.current.isTourActive).toBe(false);
  });

  it("progresses to tour after modal is completed", () => {
    const { result } = renderHook(() => useOnboarding(modalKey, tourKey));

    act(() => {
      result.current.completeModal();
    });

    // It should wait 300ms before starting the tour
    expect(result.current.isTourActive).toBe(false);

    act(() => {
      vi.advanceTimersByTime(300);
    });

    expect(result.current.currentStep).toBe("tour");
    expect(result.current.isTourActive).toBe(true);
  });

  it("completes the tour", () => {
    localStorage.setItem(modalKey, "true");
    const { result } = renderHook(() => useOnboarding(modalKey, tourKey));

    act(() => {
      vi.advanceTimersByTime(300);
    });

    expect(result.current.isTourActive).toBe(true);

    act(() => {
      result.current.completeTour();
    });

    expect(result.current.currentStep).toBe("completed");
  });

  it("can skip all onboarding", () => {
    const { result } = renderHook(() => useOnboarding(modalKey, tourKey));

    act(() => {
      result.current.skipAll();
    });

    expect(result.current.currentStep).toBe("completed");
  });

  it("can reset onboarding", () => {
    localStorage.setItem(modalKey, "true");
    localStorage.setItem(tourKey, "true");

    const { result } = renderHook(() => useOnboarding(modalKey, tourKey));

    expect(result.current.currentStep).toBe("completed");

    act(() => {
      result.current.resetOnboarding();
    });

    expect(result.current.currentStep).toBe("modal");
  });
});
