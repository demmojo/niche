import React from "react";
import * as RadixTooltip from "@radix-ui/react-tooltip";
import { LocalizedString } from "../content/dictionary";

interface TooltipProps {
  children: React.ReactNode;
  content: LocalizedString | React.ReactElement;
  position?: "top" | "bottom" | "left" | "right";
  delay?: number;
}

/**
 * A portal-based tooltip using Radix UI to avoid overflow and z-index clipping.
 */
export const Tooltip: React.FC<TooltipProps> = ({
  children,
  content,
  position = "top",
  delay = 300,
}) => {
  return (
    <RadixTooltip.Provider delayDuration={delay}>
      <RadixTooltip.Root>
        <RadixTooltip.Trigger asChild>
          {/* We wrap children in a span in case children is text or a component that doesn't forwardRef */}
          <span className="inline-flex items-center justify-center">
            {children}
          </span>
        </RadixTooltip.Trigger>
        <RadixTooltip.Portal>
          <RadixTooltip.Content
            side={position}
            sideOffset={6}
            className="z-[9999] px-2.5 py-1.5 text-xs font-medium text-white bg-ink-dark rounded shadow-md whitespace-nowrap animate-in fade-in zoom-in-95 duration-150 data-[state=closed]:animate-out data-[state=closed]:fade-out data-[state=closed]:zoom-out-95"
            aria-live="polite"
          >
            {content}
            <RadixTooltip.Arrow
              className="fill-ink-dark"
              width={10}
              height={5}
            />
          </RadixTooltip.Content>
        </RadixTooltip.Portal>
      </RadixTooltip.Root>
    </RadixTooltip.Provider>
  );
};
