import { useState, useEffect, useCallback, useSyncExternalStore } from "react";
import { subscribeToStorage, setOnboardingState } from "../utils/storage";

export type OnboardingStep = "initializing" | "modal" | "tour" | "completed";

/**
 *
 */
export function useOnboarding(modalKey: string, tourKey: string) {
  // 1. Safely read from localStorage without hydration mismatches
  const rawModalSeen = useSyncExternalStore(
    subscribeToStorage,
    () => localStorage.getItem(modalKey),
    () => "false",
  );
  const rawTourSeen = useSyncExternalStore(
    subscribeToStorage,
    () => localStorage.getItem(tourKey),
    () => "false",
  );

  const hasSeenModal = rawModalSeen === "true";
  const hasSeenTour = rawTourSeen === "true";

  // 2. Centralized FSM State
  const [currentStep, setCurrentStep] =
    useState<OnboardingStep>("initializing");

  // 3. Orchestrate the sequence
  useEffect(() => {
    if (!hasSeenModal) {
      setCurrentStep("modal");
    } else if (!hasSeenTour) {
      // CRITICAL: Delay starting the tour to allow the Modal's unmount
      // animations to finish and the DOM layout to settle.
      // This prevents Framer Motion from calculating stale bounding boxes.
      const timer = setTimeout(() => {
        setCurrentStep("tour");
      }, 300); // Adjust timing based on your modal's exit animation duration

      return () => clearTimeout(timer);
    } else {
      setCurrentStep("completed");
    }
  }, [hasSeenModal, hasSeenTour]);

  // 4. Action handlers
  const completeModal = useCallback(
    () => setOnboardingState(modalKey, "true"),
    [modalKey],
  );
  const completeTour = useCallback(
    () => setOnboardingState(tourKey, "true"),
    [tourKey],
  );
  const skipAll = useCallback(() => {
    setOnboardingState(modalKey, "true");
    setOnboardingState(tourKey, "true");
  }, [modalKey, tourKey]);

  const resetOnboarding = useCallback(() => {
    localStorage.removeItem(modalKey);
    localStorage.removeItem(tourKey);
    window.dispatchEvent(new Event("storage"));
    window.dispatchEvent(
      new CustomEvent("local-storage-update", {
        detail: { key: modalKey, value: null },
      }),
    );
    window.dispatchEvent(
      new CustomEvent("local-storage-update", {
        detail: { key: tourKey, value: null },
      }),
    );
    setCurrentStep("initializing");
  }, [modalKey, tourKey]);

  return {
    currentStep,
    isModalActive: currentStep === "modal",
    isTourActive: currentStep === "tour",
    completeModal,
    completeTour,
    skipAll,
    resetOnboarding,
    isInitializing: currentStep === "initializing",
  };
}
