import React from "react";

interface Props {
  text: string;
  isHighlighted?: boolean;
  onHighlight?: (text: string) => void;
  className?: string;
}

export function SimulatedHighlight({
  text,
  isHighlighted = false,
  onHighlight,
  className = "",
}: Props) {
  const baseClasses = "transition-all cursor-pointer rounded px-1 -mx-1";
  const stateClasses = isHighlighted
    ? "bg-amber-200 text-amber-900"
    : "hover:bg-amber-100 text-gray-800";

  return (
    <span
      role="button"
      onClick={() => onHighlight?.(text)}
      className={`${baseClasses} ${stateClasses} ${className}`}
    >
      {text}
    </span>
  );
}
