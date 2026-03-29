import React, { useState, useEffect } from "react";
import * as Accordion from "@radix-ui/react-accordion";
import { motion, AnimatePresence } from "framer-motion";

export type TrustBuilderStepId =
  | "scraping-g2"
  | "calculating-tarpit"
  | "finalizing-strategy";

interface AnimatedStepProps {
  stepId: TrustBuilderStepId;
  children: React.ReactNode;
  isActive: boolean;
  onAnimationComplete?: () => void;
}

export function AnimatedStep({
  stepId,
  children,
  isActive,
  onAnimationComplete,
}: AnimatedStepProps) {
  return (
    <Accordion.Item value={stepId} asChild>
      <motion.div layout>
        <AnimatePresence initial={false}>
          {isActive && (
            <Accordion.Content forceMount asChild>
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                onAnimationComplete={onAnimationComplete}
                className="overflow-hidden"
              >
                {children}
              </motion.div>
            </Accordion.Content>
          )}
        </AnimatePresence>
      </motion.div>
    </Accordion.Item>
  );
}

interface TrustBuilderScreenProps {
  currentStep: TrustBuilderStepId;
  isComplete: boolean;
  onDrainComplete: () => void;
}

export function TrustBuilderScreen({
  currentStep,
  isComplete,
  onDrainComplete,
}: TrustBuilderScreenProps) {
  const [activeStep, setActiveStep] = useState<TrustBuilderStepId | null>(null);
  const [queue, setQueue] = useState<TrustBuilderStepId[]>([]);
  const [isAnimating, setIsAnimating] = useState(false);

  // Queue incoming steps to decouple animation from fast network responses
  useEffect(() => {
    if (isComplete) {
      // Queue Drain fast-forward logic for instant generation completions
      setQueue([]);
      setActiveStep(null);
      onDrainComplete();
      return;
    }

    if (!queue.includes(currentStep) && activeStep !== currentStep) {
      setQueue((prev) => [...prev, currentStep]);
    }
  }, [currentStep, isComplete, activeStep, queue, onDrainComplete]);

  // Process queue
  useEffect(() => {
    if (!isAnimating && queue.length > 0) {
      const nextStep = queue[0];
      setQueue((prev) => prev.slice(1));
      setActiveStep(nextStep);
      setIsAnimating(true);
    }
  }, [queue, isAnimating]);

  const handleAnimationComplete = () => {
    setIsAnimating(false);
  };

  return (
    <div
      className="trust-builder-container p-6 bg-slate-900 rounded-lg border border-slate-800"
      aria-live="polite"
      aria-busy={!isComplete}
    >
      <h2 className="text-xl font-semibold text-white mb-6">
        Analyzing Market Feasibility...
      </h2>
      <Accordion.Root
        type="single"
        value={activeStep || undefined}
        collapsible
        className="space-y-4"
      >
        <div className="step-wrapper border-b border-slate-800 pb-2">
          <h3 className="text-sm font-medium text-slate-400">Step 1</h3>
          <AnimatedStep
            stepId="scraping-g2"
            isActive={activeStep === "scraping-g2"}
            onAnimationComplete={handleAnimationComplete}
          >
            <div className="pt-2 text-slate-300">
              Scraping competitor data and G2 reviews to identify market gaps...
            </div>
          </AnimatedStep>
        </div>

        <div className="step-wrapper border-b border-slate-800 pb-2">
          <h3 className="text-sm font-medium text-slate-400">Step 2</h3>
          <AnimatedStep
            stepId="calculating-tarpit"
            isActive={activeStep === "calculating-tarpit"}
            onAnimationComplete={handleAnimationComplete}
          >
            <div className="pt-2 text-slate-300">
              Calculating Tarpit Score and checking for niche viability against
              saturation metrics...
            </div>
          </AnimatedStep>
        </div>

        <div className="step-wrapper border-b border-slate-800 pb-2">
          <h3 className="text-sm font-medium text-slate-400">Step 3</h3>
          <AnimatedStep
            stepId="finalizing-strategy"
            isActive={activeStep === "finalizing-strategy"}
            onAnimationComplete={handleAnimationComplete}
          >
            <div className="pt-2 text-slate-300">
              Finalizing data-inverted sub-niche strategy...
            </div>
          </AnimatedStep>
        </div>
      </Accordion.Root>
    </div>
  );
}
