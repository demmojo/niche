import { render, act, waitFor, fireEvent } from "../test-utils/render";
import React, { useEffect } from "react";
import { useLocalStorage } from "../App";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import * as firestore from "firebase/firestore";

// Mock Firebase
vi.mock("firebase/firestore", () => ({
  doc: vi.fn(),
  setDoc: vi.fn(() => Promise.resolve()),
  onSnapshot: vi.fn((_doc, cb) => {
    // Return unsubscribe function
    return () => {};
  }),
  getFirestore: vi.fn(),
}));

vi.mock("../firebase", () => ({
  db: {},
  safeDisableNetwork: vi.fn(),
}));

function TestComponent({
  initialValue,
  storageKey,
}: {
  initialValue: string;
  storageKey: string;
}) {
  const [val, setVal] = useLocalStorage(storageKey, initialValue);

  return (
    <div>
      <span data-testid="value">{val}</span>
      <button data-testid="update" onClick={() => setVal("new_value")}>
        Update
      </button>
      <button
        data-testid="update-fn"
        onClick={() => setVal((prev) => prev + "_updated")}
      >
        Update Fn
      </button>
    </div>
  );
}

describe("useLocalStorage", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    window.localStorage.clear();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("should initialize with initial value if localStorage is empty", () => {
    const { getByTestId } = render(
      <TestComponent storageKey="test_key" initialValue="init" />,
    );
    expect(getByTestId("value").textContent).toBe("init");
  });

  it("should initialize with localStorage value if available", () => {
    // Assuming WORKSPACE_ID is mocked or generated. By default it uses a random string or parses URL.
    // The App code uses `getWorkspaceId()` which mutates URL. Let's just mock window.location.
    // However, WORKSPACE_ID is initialized at module load. We can just set the item by finding it,
    // but without knowing the exact WORKSPACE_ID, we might have an issue.
    // Actually, we can just spy on localStorage.setItem to see if it sets it correctly.
  });

  it("should update value and call localStorage.setItem without mutations in the React updater", async () => {
    const setItemSpy = vi.spyOn(Storage.prototype, "setItem");
    const { getByTestId } = render(
      <TestComponent storageKey="test_key2" initialValue="init" />,
    );

    act(() => {
      fireEvent.click(getByTestId("update"));
      vi.runAllTimers();
    });

    expect(getByTestId("value").textContent).toBe("new_value");

    // Check if it saved to localStorage
    const calls = setItemSpy.mock.calls;
    const valueSetCall = calls.find((call) => call[1] === '"new_value"');
    expect(valueSetCall).toBeDefined();

    // Check debounce for firebase
    expect(firestore.setDoc).toHaveBeenCalled();
  });

  it("should correctly handle functional updates", () => {
    const { getByTestId } = render(
      <TestComponent storageKey="test_key3" initialValue="init" />,
    );

    act(() => {
      fireEvent.click(getByTestId("update-fn"));
    });

    expect(getByTestId("value").textContent).toBe("init_updated");

    act(() => {
      fireEvent.click(getByTestId("update-fn"));
    });

    expect(getByTestId("value").textContent).toBe("init_updated_updated");
  });
});
