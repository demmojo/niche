import React, { useRef, useEffect, useState } from "react";
import Markdown from "react-markdown";
import { LensChatMessage, LensSuggestion } from "../../types";
import { LensSuggestionCard } from "./LensSuggestionCard";

interface LensChatFeedProps {
  messages: LensChatMessage[];
  isTyping: boolean;
  onApprove: (suggestion: LensSuggestion) => void;
  onDismiss: (suggestion: LensSuggestion, reason: string) => void;
}

export function LensChatFeed({
  messages,
  isTyping,
  onApprove,
  onDismiss,
}: LensChatFeedProps) {
  const feedRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (feedRef.current) {
      feedRef.current.scrollTop = feedRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  return (
    <div
      ref={feedRef}
      className="flex-1 overflow-y-auto overflow-x-hidden border border-ink-dark/20 bg-paper-base rounded-2xl shadow-storybook-inner p-6 space-y-6"
    >
      {messages.length === 0 && !isTyping && (
        <div className="flex flex-col items-center justify-center h-full text-[#8A8A8A] font-mono text-sm uppercase tracking-widest gap-2">
          <span>Initializing Lens Strategy Console...</span>
        </div>
      )}

      {messages.map((msg, idx) => (
        <div
          key={msg.id}
          className={`flex w-full ${msg.role === "user" ? "justify-end" : "justify-start"}`}
        >
          <div
            className={`max-w-[90%] md:max-w-[75%] space-y-4 flex flex-col ${
              msg.role === "user" ? "items-end" : "items-start"
            }`}
          >
            {/* Message Bubble */}
            <div
              className={`p-4 rounded-xl shadow-sm border font-sans text-sm md:text-base leading-relaxed break-words whitespace-pre-wrap ${
                msg.role === "user"
                  ? "bg-[#2C2C2C] text-white border-[#2C2C2C]"
                  : "bg-paper-light text-ink-dark border-ink-dark/20 border-l-4 border-electric-cyan rounded-tl-sm"
              }`}
            >
              {msg.role === "user" ? (
                msg.text
              ) : (
                <div className="prose prose-sm md:prose-base max-w-none text-ink-dark">
                  <Markdown>{msg.text}</Markdown>
                </div>
              )}
            </div>

            {/* Render Suggestion Cards */}
            {msg.role === "lens" &&
              msg.suggestions &&
              msg.suggestions.length > 0 && (
                <div className="w-full flex flex-col gap-4 mt-2">
                  {msg.suggestions.map((suggestion) => (
                    <LensSuggestionCard
                      key={suggestion.id}
                      suggestion={suggestion}
                      onApprove={onApprove}
                      onDismiss={onDismiss}
                    />
                  ))}
                </div>
              )}
          </div>
        </div>
      ))}

      {isTyping && (
        <div className="flex justify-start w-full">
          <div className="bg-paper-light border border-ink-dark/20 border-l-4 border-electric-cyan p-4 rounded-xl rounded-tl-sm shadow-sm flex items-center gap-2">
            <div className="w-1.5 h-1.5 bg-electric-cyan rounded-full animate-bounce" />
            <div className="w-1.5 h-1.5 bg-electric-cyan rounded-full animate-bounce [animation-delay:0.2s]" />
            <div className="w-1.5 h-1.5 bg-electric-cyan rounded-full animate-bounce [animation-delay:0.4s]" />
          </div>
        </div>
      )}
    </div>
  );
}
