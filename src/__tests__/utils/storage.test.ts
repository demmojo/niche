// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { setOnboardingState, subscribeToStorage } from "../../utils/storage";

describe("storage utility", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  describe("setOnboardingState", () => {
    it("sets an item in localStorage", () => {
      setOnboardingState("testKey", "testValue");
      expect(localStorage.getItem("testKey")).toBe("testValue");
    });

    it("dispatches storage and custom events", () => {
      const dispatchEventSpy = vi.spyOn(window, "dispatchEvent");

      setOnboardingState("eventKey", "eventValue");

      expect(dispatchEventSpy).toHaveBeenCalledTimes(2);

      // We can't easily check Event instance equality without accessing private properties sometimes,
      // but we can check the types/details
      const calls = dispatchEventSpy.mock.calls;
      expect((calls[0][0] as Event).type).toBe("storage");
      expect((calls[1][0] as CustomEvent).type).toBe("local-storage-update");
      expect((calls[1][0] as CustomEvent).detail).toEqual({
        key: "eventKey",
        value: "eventValue",
      });

      dispatchEventSpy.mockRestore();
    });
  });

  describe("subscribeToStorage", () => {
    it("adds and removes event listeners", () => {
      const addEventListenerSpy = vi.spyOn(window, "addEventListener");
      const removeEventListenerSpy = vi.spyOn(window, "removeEventListener");
      const listener = vi.fn();

      const unsubscribe = subscribeToStorage(listener);

      expect(addEventListenerSpy).toHaveBeenCalledWith("storage", listener);
      expect(addEventListenerSpy).toHaveBeenCalledWith(
        "local-storage-update",
        listener,
      );
      expect(addEventListenerSpy).toHaveBeenCalledTimes(2);

      unsubscribe();

      expect(removeEventListenerSpy).toHaveBeenCalledWith("storage", listener);
      expect(removeEventListenerSpy).toHaveBeenCalledWith(
        "local-storage-update",
        listener,
      );
      expect(removeEventListenerSpy).toHaveBeenCalledTimes(2);

      addEventListenerSpy.mockRestore();
      removeEventListenerSpy.mockRestore();
    });

    it("calls listener when events are dispatched", () => {
      const listener = vi.fn();
      const unsubscribe = subscribeToStorage(listener);

      window.dispatchEvent(new Event("storage"));
      expect(listener).toHaveBeenCalledTimes(1);

      window.dispatchEvent(new CustomEvent("local-storage-update"));
      expect(listener).toHaveBeenCalledTimes(2);

      unsubscribe();
    });
  });
});
