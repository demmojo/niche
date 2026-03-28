import React, { useState, useEffect, useRef, useCallback } from "react";
import { LensChatFeed } from "./LensChatFeed";
import {
  runLensDeepAnalysis,
  generateLensChatResponse,
  LensStats,
} from "../../services/lensAiService";
import {
  LensChatMessage,
  LensSuggestion,
  RejectedSuggestion,
  Competitor,
  DerivedInsight,
} from "../../types";

interface LensStrategyConsoleProps {
  stats: LensStats;
  competitors: Competitor[];
  insights: DerivedInsight[];
  rawData: any[]; // Changed to any[]
  onAddFeature?: (name: string, description: string) => void;
  onAddInsight?: (title: string, description: string) => void;
}

export default function LensStrategyConsole({
  stats,
  competitors,
  insights,
  rawData,
  onAddFeature,
  onAddInsight,
}: LensStrategyConsoleProps) {
  const [chatHistory, setChatHistory] = useState<LensChatMessage[]>([]);
  const [rejectedSuggestions, setRejectedSuggestions] = useState<
    RejectedSuggestion[]
  >([]);
  const [isTyping, setIsTyping] = useState(false);

  const dataFingerprint = `${competitors.length}-${rawData.length}`;
  const previousFingerprint = useRef(dataFingerprint);
  const hasInitialized = useRef(false);

  // Maintain latest context in a ref to avoid dependency cycles in async callbacks
  const contextRef = useRef({
    stats,
    competitors,
    insights,
    rawData,
    rejectedSuggestions,
    chatHistory,
  });

  useEffect(() => {
    contextRef.current = {
      stats,
      competitors,
      insights,
      rawData,
      rejectedSuggestions,
      chatHistory,
    };
  }, [stats, competitors, insights, rawData, rejectedSuggestions, chatHistory]);

  const triggerDeepAnalysis = useCallback(async () => {
    const currentContext = contextRef.current;
    if (
      currentContext.stats.tracked === 0 &&
      currentContext.rawData.length === 0
    ) {
      setChatHistory([
        {
          id: Date.now().toString(),
          role: "lens",
          text: "Initialization sequence complete. No market data synchronization detected. Please initiate a system sync before analysis can commence.",
          options: ["Acknowledge"],
        },
      ]);
      return;
    }

    setIsTyping(true);
    try {
      const response = await runLensDeepAnalysis(currentContext);

      const lensMessage: LensChatMessage = {
        id: Date.now().toString(),
        role: "lens",
        text: response.message,
        suggestions: response.suggestions.map((s, idx) => ({
          ...s,
          id: `lens-sugg-${Date.now()}-${idx}`,
        })),
        options: response.options,
      };

      setChatHistory((prev) => [...prev, lensMessage]);
    } catch (err) {
      console.error(err);
    } finally {
      setIsTyping(false);
    }
  }, []);

  // Background deep analysis after sync
  useEffect(() => {
    if (
      chatHistory.length > 0 &&
      dataFingerprint !== previousFingerprint.current
    ) {
      triggerDeepAnalysis();
    }
    previousFingerprint.current = dataFingerprint;
  }, [dataFingerprint, chatHistory.length, triggerDeepAnalysis]);

  // Initial greeting
  useEffect(() => {
    if (!hasInitialized.current && chatHistory.length === 0) {
      hasInitialized.current = true;
      triggerDeepAnalysis();
    }
  }, [chatHistory.length, triggerDeepAnalysis]);

  const handleUserAction = useCallback(async (prompt: string) => {
    const userMessage: LensChatMessage = {
      id: Date.now().toString(),
      role: "user",
      text: prompt,
    };

    setChatHistory((prev) => [...prev, userMessage]);
    setIsTyping(true);

    try {
      // Need updated history for context immediately
      const currentContext = {
        ...contextRef.current,
        chatHistory: [...contextRef.current.chatHistory, userMessage],
      };

      const response = await generateLensChatResponse(currentContext, prompt);

      const lensMessage: LensChatMessage = {
        id: Date.now().toString(),
        role: "lens",
        text: response.message,
        suggestions: response.suggestions.map((s, idx) => ({
          ...s,
          id: `lens-sugg-${Date.now()}-${idx}`,
        })),
        options: response.options,
      };

      setChatHistory((prev) => [...prev, lensMessage]);
    } catch (err) {
      console.error(err);
    } finally {
      setIsTyping(false);
    }
  }, []);

  const handleApproveSuggestion = (suggestion: LensSuggestion) => {
    if (suggestion.type === "feature" && onAddFeature) {
      onAddFeature(suggestion.title, suggestion.description);
    } else if (suggestion.type === "insight" && onAddInsight) {
      onAddInsight(suggestion.title, suggestion.description);
    }

    // Remove the suggestion from the UI
    setChatHistory((prev) =>
      prev.map((msg) => {
        if (!msg.suggestions) return msg;
        return {
          ...msg,
          suggestions: msg.suggestions.filter((s) => s.id !== suggestion.id),
        };
      }),
    );
  };

  const handleDismissSuggestion = (
    suggestion: LensSuggestion,
    reason: string,
  ) => {
    // 1. Add to rejected log
    setRejectedSuggestions((prev) => [
      ...prev,
      { itemTitle: suggestion.title, reason, timestamp: Date.now() },
    ]);

    // 2. Remove the suggestion from the UI
    setChatHistory((prev) =>
      prev.map((msg) => {
        if (!msg.suggestions) return msg;
        return {
          ...msg,
          suggestions: msg.suggestions.filter((s) => s.id !== suggestion.id),
        };
      }),
    );
  };

  // The latest options are in the last message if it's from Lens
  const lastMessage = chatHistory[chatHistory.length - 1];
  const currentOptions =
    lastMessage?.role === "lens" ? lastMessage.options || [] : [];

  return (
    <div className="flex flex-col h-full bg-paper-card border border-ink-dark/20 rounded-2xl overflow-hidden shadow-storybook">
      {/* Header */}
      <div className="bg-paper-light border-b border-ink-dark/20 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-obsidian rounded-xl border border-electric-cyan/30 flex items-center justify-center shadow-[0_0_15px_rgba(0,229,255,0.2)]">
            <span className="font-display text-electric-cyan text-lg font-bold">
              L
            </span>
          </div>
          <div>
            <h2 className="font-sans font-bold text-ink-dark text-lg flex items-center gap-2">
              Lens Strategy Console
            </h2>
            <div className="flex items-center gap-2 text-xs font-mono">
              <span className="relative flex h-2 w-2">
                <span
                  className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${isTyping ? "bg-electric-cyan" : "bg-sage"}`}
                ></span>
                <span
                  className={`relative inline-flex rounded-full h-2 w-2 ${isTyping ? "bg-electric-cyan" : "bg-sage"}`}
                ></span>
              </span>
              <span
                className={
                  isTyping
                    ? "text-electric-cyan uppercase tracking-widest"
                    : "text-[#8A8A8A] uppercase tracking-widest"
                }
              >
                {isTyping ? "Analyzing Market Data..." : "System Idle"}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Feed */}
      <div className="flex-1 p-6 overflow-hidden flex flex-col">
        <LensChatFeed
          messages={chatHistory}
          isTyping={isTyping}
          onApprove={handleApproveSuggestion}
          onDismiss={handleDismissSuggestion}
        />
      </div>

      {/* Constrained Input Options (Strategic Decisions) */}
      <div className="p-6 bg-paper-light border-t border-ink-dark/20">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-xs font-mono text-ink-muted uppercase tracking-widest">
            Strategic Decisions Awaiting Input
          </span>
          <div className="h-px flex-1 bg-ink-dark/10"></div>
        </div>

        <div className="flex flex-wrap gap-2">
          {currentOptions.length > 0 && !isTyping ? (
            currentOptions.map((opt, i) => (
              <button
                key={i}
                onClick={() => handleUserAction(opt)}
                className="group relative px-4 py-2 bg-paper-base border border-ink-dark/30 hover:border-electric-cyan text-ink-dark hover:text-electric-cyan rounded-none font-mono text-xs transition-all flex items-center gap-2 shadow-sm"
              >
                <span className="text-electric-cyan opacity-50 group-hover:opacity-100">
                  [{i + 1}]
                </span>
                {opt}
              </button>
            ))
          ) : (
            <div className="px-4 py-2 border border-dashed border-ink-dark/20 text-[#8A8A8A] font-mono text-xs rounded-none w-full text-center">
              {isTyping
                ? "Processing decisions..."
                : "No immediate decisions required."}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
