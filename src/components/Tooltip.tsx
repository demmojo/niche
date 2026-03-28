import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { LocalizedString } from "../content/dictionary";

interface TooltipProps {
  children: React.ReactNode;
  content: LocalizedString | React.ReactElement;
  position?: "top" | "bottom" | "left" | "right";
  delay?: number;
}

export const Tooltip: React.FC<TooltipProps> = ({
  children,
  content,
  position = "top",
  delay = 300,
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  const handleMouseEnter = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => setIsVisible(true), delay);
  };

  const handleMouseLeave = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setIsVisible(false);
  };

  const handleFocus = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setIsVisible(true);
  };

  const handleBlur = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setIsVisible(false);
  };

  // On touch devices, tooltips can be annoying or get stuck.
  // A common pattern is to show them on touchstart (or tap) and hide on document tap elsewhere.
  // For simplicity and accessibility, we ensure focus and blur work.
  const handleTouchStart = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setIsVisible(true);
  };

  return (
    <div
      className="relative flex items-center justify-center"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onFocus={handleFocus}
      onBlur={handleBlur}
      onTouchStart={handleTouchStart}
      onKeyDown={(e) => {
        if (e.key === "Escape") {
          setIsVisible(false);
          if (timeoutRef.current) clearTimeout(timeoutRef.current);
        }
      }}
    >
      {children}
      <AnimatePresence>
        {isVisible && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            role="tooltip"
            aria-live="polite"
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
