import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, ChevronRight, ChevronLeft } from "lucide-react";

import { LocalizedString } from "../content/dictionary";

export interface TourStep {
  /** The CSS selector for the DOM element the tour should spotlight (e.g. `[data-tour="header"]`) */
  target: string;

  /** The title of the tour step (must be a `LocalizedString`) */
  title: LocalizedString;

  /** The main content/description of the tour step (must be a `LocalizedString`) */
  content: LocalizedString;

  /**
   * The preferred placement of the tour popover relative to the target element.
   * @default 'bottom'
   */
  placement?: "top" | "bottom" | "left" | "right";
}

interface GuidedTourProps {
  /** The array of steps to display sequentially */
  steps: TourStep[];

  /** Determines if the interactive tour is currently visible */
  isOpen: boolean;

  /** Callback fired when the user dismisses or skips the tour */
  onClose: () => void;

  /** Callback fired when the user successfully completes the final step of the tour */
  onComplete: () => void;
}

/**
 * An interactive, sequential feature tour that spotlights DOM elements.
 *
 * Used in combination with `useOnboarding` to prevent collisions with static modals.
 * Needs `data-tour="name"` selectors present in the DOM.
 * @example
 * ```tsx
 * const { isTourActive, completeTour } = useOnboarding('guideKey', 'tourKey');
 *
 * <GuidedTour
 *   steps={getTourSteps()}
 *   isOpen={isTourActive}
 *   onClose={completeTour}
 *   onComplete={completeTour}
 * />
 * ```
 */
export function GuidedTour({
  steps,
  isOpen,
  onClose,
  onComplete,
}: GuidedTourProps) {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);

  const currentStep = steps[currentStepIndex];

  const updateTargetRect = useCallback(() => {
    if (!isOpen || !currentStep) return;

    const el = document.querySelector(currentStep.target);
    if (el) {
      setTargetRect(el.getBoundingClientRect());
    } else {
      // If element not found, we might want to skip or just center the popover.
      // For now, we'll set it to null and center the popover.
      setTargetRect(null);
      console.warn(`Tour target not found: ${currentStep.target}`);
    }
  }, [currentStep, isOpen]);

  useEffect(() => {
    if (isOpen) {
      // Small delay to allow components to render/animate into place
      const timer = setTimeout(updateTargetRect, 100);

      // Also observe window resize and scroll
      window.addEventListener("resize", updateTargetRect);
      window.addEventListener("scroll", updateTargetRect, true);

      return () => {
        clearTimeout(timer);
        window.removeEventListener("resize", updateTargetRect);
        window.removeEventListener("scroll", updateTargetRect, true);
      };
    } else {
      setCurrentStepIndex(0);
      setTargetRect(null);
    }
  }, [isOpen, currentStepIndex, updateTargetRect]);

  // Polling fallback in case element renders late
  useEffect(() => {
    if (isOpen && !targetRect && currentStep) {
      const interval = setInterval(updateTargetRect, 250);
      return () => clearInterval(interval);
    }
  }, [isOpen, targetRect, currentStep, updateTargetRect]);

  if (!isOpen || !currentStep) return null;

  /**
   *
   */
  const handleNext = () => {
    if (currentStepIndex < steps.length - 1) {
      setCurrentStepIndex((prev) => prev + 1);
    } else {
      onComplete();
    }
  };

  /**
   *
   */
  const handleBack = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex((prev) => prev - 1);
    }
  };

  // Calculate Popover Position
  /**
   *
   */
  const getPopoverStyle = () => {
    if (!targetRect) {
      // Center if no target
      return { top: "50%", left: "50%", transform: "translate(-50%, -50%)" };
    }

    const margin = 16;
    let top = 0;
    let left = 0;

    // We don't know the exact width/height of the popover yet, so we use CSS transforms
    // combined with absolute positioning relative to the spotlight.
    // Framer Motion layout will handle the transition smoothly.

    // A simpler approach is to calculate fixed pixel values based on the viewport,
    // assuming a standard popover width of ~320px.
    const popoverWidth = 320;
    const popoverHeight = 150; // estimate

    const placement = currentStep.placement || "bottom";

    switch (placement) {
      case "top":
        top = targetRect.top - margin - popoverHeight;
        left = targetRect.left + targetRect.width / 2 - popoverWidth / 2;
        break;
      case "bottom":
        top = targetRect.bottom + margin;
        left = targetRect.left + targetRect.width / 2 - popoverWidth / 2;
        break;
      case "left":
        top = targetRect.top + targetRect.height / 2 - popoverHeight / 2;
        left = targetRect.left - margin - popoverWidth;
        break;
      case "right":
        top = targetRect.top + targetRect.height / 2 - popoverHeight / 2;
        left = targetRect.right + margin;
        break;
    }

    // Keep within viewport bounds
    left = Math.max(
      margin,
      Math.min(left, window.innerWidth - popoverWidth - margin),
    );
    top = Math.max(
      margin,
      Math.min(top, window.innerHeight - popoverHeight - margin),
    );

    return { top, left, width: popoverWidth };
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[9999] pointer-events-none">
        {/* The Spotlight Overlay */}
        {targetRect ? (
          <motion.div
            initial={false}
            animate={{
              top: targetRect.top - 8,
              left: targetRect.left - 8,
              width: targetRect.width + 16,
              height: targetRect.height + 16,
            }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="absolute rounded-xl pointer-events-auto"
            style={{
              boxShadow: "0 0 0 9999px rgba(0,0,0,0.6)",
              // We use a completely transparent background so the target shows through.
              // The massive box-shadow dims everything else.
            }}
          >
            {/* Optional: An inner pulsing ring for emphasis */}
            <div className="absolute inset-0 rounded-xl border-2 border-[#4A7C59] animate-pulse" />
          </motion.div>
        ) : (
          // Full screen dim if target not found
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute inset-0 bg-black/60 pointer-events-auto"
          />
        )}

        {/* The Popover */}
        <motion.div
          initial={{ opacity: 0, y: 10, scale: 0.95 }}
          animate={{
            opacity: 1,
            y: 0,
            scale: 1,
            ...getPopoverStyle(),
          }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className="absolute bg-white rounded-xl shadow-2xl border border-[#8A9A8E]/20 p-5 pointer-events-auto flex flex-col gap-3"
        >
          {/* Header */}
          <div className="flex justify-between items-start">
            <h3 className="font-bold text-[#2C2C2C] text-lg leading-tight">
              {currentStep.title}
            </h3>
            <button
              onClick={onClose}
              className="text-[#8A9A8E] hover:text-[#2C2C2C] -mt-1 -mr-1 p-1"
            >
              <X size={16} />
            </button>
          </div>

          {/* Content */}
          <p className="text-sm text-[#8A9A8E] leading-relaxed">
            {currentStep.content}
          </p>

          {/* Footer Navigation */}
          <div className="flex items-center justify-between mt-2 pt-3 border-t border-[#8A9A8E]/10">
            <div className="flex gap-1">
              {steps.map((_, i) => (
                <div
                  key={i}
                  className={`w-2 h-2 rounded-full transition-colors ${i === currentStepIndex ? "bg-[#4A7C59]" : "bg-[#8A9A8E]/30"}`}
                />
              ))}
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleBack}
                disabled={currentStepIndex === 0}
                className="p-1.5 text-[#8A9A8E] hover:text-[#2C2C2C] disabled:opacity-30 disabled:hover:text-[#8A9A8E] transition-colors"
              >
                <ChevronLeft size={18} />
              </button>

              <button
                onClick={handleNext}
                className="flex items-center gap-1 px-4 py-1.5 bg-[#4A7C59] text-white rounded-lg hover:bg-[#3B6647] text-sm font-medium transition-colors"
              >
                {currentStepIndex === steps.length - 1 ? "Finish" : "Next"}
                {currentStepIndex !== steps.length - 1 && (
                  <ChevronRight size={16} />
                )}
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
