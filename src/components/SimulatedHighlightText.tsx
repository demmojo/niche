import React, { useState } from "react";

export function SimulatedHighlightText({
  text,
  onHighlight,
}: {
  text: string;
  onHighlight: (sentence: string) => void;
}) {
  const [highlightedIndices, setHighlightedIndices] = useState<Set<number>>(
    new Set(),
  );

  // Split text into sentences (naively by period, exclamation, question mark)
  const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];

  const toggleHighlight = (idx: number, sentence: string) => {
    const newSet = new Set(highlightedIndices);
    if (newSet.has(idx)) {
      newSet.delete(idx);
    } else {
      newSet.add(idx);
      onHighlight(sentence.trim());
    }
    setHighlightedIndices(newSet);
  };

  return (
    <p className="leading-relaxed">
      {sentences.map((sentence, idx) => (
        <span
          key={idx}
          role="button"
          tabIndex={0}
          onClick={() => toggleHighlight(idx, sentence)}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              toggleHighlight(idx, sentence);
            }
          }}
          className={`transition-all duration-200 px-1 mx-0.5 rounded cursor-pointer ${
            highlightedIndices.has(idx)
              ? "bg-amber-200 text-amber-900"
              : "hover:bg-amber-100"
          }`}
        >
          {sentence}
        </span>
      ))}
    </p>
  );
}
