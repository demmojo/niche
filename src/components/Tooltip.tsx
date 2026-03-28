import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";

import { LocalizedString } from "../content/dictionary";

interface TooltipProps {
  /** The UI element that triggers the tooltip on hover. */
  children: React.ReactNode;

  /**
   * The text or node to display inside the tooltip.
   * If passing a string, it must be a type-safe `LocalizedString` from the dictionary.
   */
  content: LocalizedString | React.ReactElement;

  /**
   * The placement of the tooltip relative to its children.
   * @default 'top'
   */
  position?: "top" | "bottom" | "left" | "right";

  /**
   * The delay in milliseconds before the tooltip appears on hover.
   * @default 300
   */
  delay?: number;
}

/**
 * A highly reusable, animated Tooltip component.
 * It strictly requires a `LocalizedString` for textual content to ensure centralization.
 *
 * @example
 * ```tsx
 * <Tooltip content={tMessage(dictionary.common.exportData)} position="right">
 *   <button>Export</button>
 * </Tooltip>
 * ```
 */
export const Tooltip: React.FC<TooltipProps> = ({
  children,
  content,
  position = "top",
  delay = 300,
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [timeoutId, setTimeoutId] = useState<NodeJS.Timeout | null>(null);

  const handleMouseEnter = () => {
    const id = setTimeout(() => setIsVisible(true), delay);
    setTimeoutId(id);
  };

  const handleMouseLeave = () => {
    if (timeoutId) clearTimeout(timeoutId);
    setIsVisible(false);
  };

  return (
    <div
      className="relative flex items-center justify-center"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {children}
      <AnimatePresence>
        {isVisible && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className={`absolute z-50 px-2.5 py-1.5 text-xs font-medium text-white bg-ink-dark rounded shadow-md whitespace-nowrap pointer-events-none
              ${position === "top" ? "bottom-full mb-2" : ""}
              ${position === "bottom" ? "top-full mt-2" : ""}
              ${position === "left" ? "right-full mr-2" : ""}
              ${position === "right" ? "left-full ml-2" : ""}
            `}
          >
            {content}
            <div
              className={`absolute w-2 h-2 bg-ink-dark transform rotate-45
              ${position === "top" ? "bottom-[-4px] left-1/2 -translate-x-1/2" : ""}
              ${position === "bottom" ? "top-[-4px] left-1/2 -translate-x-1/2" : ""}
              ${position === "left" ? "right-[-4px] top-1/2 -translate-y-1/2" : ""}
              ${position === "right" ? "left-[-4px] top-1/2 -translate-y-1/2" : ""}
            `}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
