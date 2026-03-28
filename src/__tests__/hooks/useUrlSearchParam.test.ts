import { renderHook, act } from "@testing-library/react";
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { useUrlSearchParam } from "../../hooks/useUrlSearchParam";

describe("useUrlSearchParam", () => {
  const originalLocation = window.location;

  beforeEach(() => {
    // Mock window.location
    delete (window as any).location;
    window.location = {
      ...originalLocation,
      search: "",
      href: "http://localhost/",
    } as any;

    // Mock window.history.pushState
    vi.spyOn(window.history, "pushState").mockImplementation(
      (data, title, url) => {
        const parsedUrl = new URL(url as string, "http://localhost");
        window.location.search = parsedUrl.search;
        window.location.href = parsedUrl.href;
      },
    );
  });

  afterEach(() => {
    window.location = originalLocation as any;
    vi.restoreAllMocks();
  });

  it("initializes with default value if param is not present", () => {
    const { result } = renderHook(() =>
      useUrlSearchParam("testParam", "defaultValue"),
    );
    expect(result.current[0]).toBe("defaultValue");
  });

  it("initializes with URL param value if present", () => {
    window.location.search = "?testParam=urlValue";
    const { result } = renderHook(() =>
      useUrlSearchParam("testParam", "defaultValue"),
    );
    expect(result.current[0]).toBe("urlValue");
  });

  it("updates the state and URL when a new value is set", () => {
    const { result } = renderHook(() =>
      useUrlSearchParam("testParam", "defaultValue"),
    );

    act(() => {
      result.current[1]("newValue");
    });

    expect(result.current[0]).toBe("newValue");
    expect(window.history.pushState).toHaveBeenCalled();
    expect(window.location.search).toContain("testParam=newValue");
  });

  it("removes the param from URL when value is set to default", () => {
    window.location.search = "?testParam=newValue";
    const { result } = renderHook(() =>
      useUrlSearchParam("testParam", "defaultValue"),
    );

    act(() => {
      result.current[1]("defaultValue");
    });

    expect(result.current[0]).toBe("defaultValue");
    expect(window.history.pushState).toHaveBeenCalled();
    expect(window.location.search).not.toContain("testParam=");
  });

  it("updates state on popstate event", () => {
    const { result } = renderHook(() =>
      useUrlSearchParam("testParam", "defaultValue"),
    );

    act(() => {
      window.location.search = "?testParam=popValue";
      window.dispatchEvent(new Event("popstate"));
    });

    expect(result.current[0]).toBe("popValue");
  });
});
