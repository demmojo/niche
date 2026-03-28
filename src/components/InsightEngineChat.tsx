import React, { useState } from "react";
import {
  MessageSquare,
  X,
  Users,
  Sparkles,
  Loader2,
  Send,
  Lightbulb,
} from "lucide-react";
import Markdown from "react-markdown";
import { Tooltip } from "./Tooltip";
import { dictionary, tMessage } from "../content/dictionary";
import { DerivedInsight, Competitor } from "../types";

interface InsightEngineChatProps {
  chatState: "closed" | "hover" | "locked";
  setChatState: (state: "closed" | "hover" | "locked") => void;
  chatHistory: any[];
  setChatHistory: React.Dispatch<React.SetStateAction<any[]>>;
  isTyping: boolean;
  handleSendMessage: (customPrompt?: string) => void;
  chatInput: string;
  setChatInput: React.Dispatch<React.SetStateAction<string>>;
  derivedInsights: DerivedInsight[];
  setDerivedInsights: React.Dispatch<React.SetStateAction<DerivedInsight[]>>;
  competitors: Competitor[];
  addToast: (msg: string, type: "success" | "error") => void;
}

export function InsightEngineChat({
  chatState,
  setChatState,
  chatHistory,
  setChatHistory,
  isTyping,
  handleSendMessage,
  chatInput,
  setChatInput,
  derivedInsights,
  setDerivedInsights,
  competitors,
  addToast,
}: InsightEngineChatProps) {
  const [showMentionDropdown, setShowMentionDropdown] = useState(false);
  const [mentionQuery, setMentionQuery] = useState("");

  React.useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (chatState === "locked") {
        const chatEl = document.getElementById("insight-engine-chat");
        if (chatEl && !chatEl.contains(e.target as Node)) {
          setChatState("closed");
        }
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [chatState, setChatState]);

  return (
    <>
      {/* Floating Chat Hover Zone */}
      {chatState === "closed" && (
        <div
          onMouseEnter={() => setChatState("hover")}
          className="fixed inset-y-0 right-0 w-8 z-40 cursor-pointer group"
        >
          <div className="absolute top-1/2 right-2 -translate-y-1/2 bg-paper-base text-[#2C2C2C] p-2 rounded-l-xl opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center gap-2 shadow-lg backdrop-blur-sm border border-ink-dark/20">
            <MessageSquare size={16} />
            <span
              className="text-[10px] font-bold uppercase"
              style={{ writingMode: "vertical-rl" }}
            >
              Insight Engine
            </span>
          </div>
        </div>
      )}

      {/* --- RIGHT SIDEBAR CHAT --- */}
      <div
        id="insight-engine-chat"
        className={`absolute inset-y-0 right-0 w-full md:w-96 shrink-0 bg-paper-light border-l border-ink-dark/20 flex flex-col z-50 shadow-2xl transition-transform duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] ${
          chatState === "closed" ? "translate-x-full" : "translate-x-0"
        }`}
        onMouseLeave={() => {
          if (chatState === "hover") setChatState("closed");
        }}
        onClick={() => {
          if (chatState === "hover") setChatState("locked");
        }}
      >
        <div
          className="h-16 border-b border-ink-dark/20 flex items-center justify-between px-4 shrink-0 bg-paper-base/80 backdrop-blur-md cursor-pointer"
          onClick={() => {
            if (chatState === "hover") setChatState("locked");
          }}
        >
          <div className="flex items-center gap-2">
            <MessageSquare size={18} className="text-moss" />
            <span className="font-medium text-ink-dark ">Insight Engine</span>
            {chatState === "locked" && (
              <span className="ml-2 px-1.5 py-0.5 bg-paper-base text-[#8A8A8A] text-[10px] uppercase font-bold rounded">
                Locked
              </span>
            )}
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setChatState("closed");
            }}
            className="p-2 text-[#8A8A8A] hover:text-ink-dark rounded-lg hover:bg-paper-base transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        <div className="p-4 border-b border-ink-dark/20 bg-paper-base/30 shrink-0">
          <p className="text-xs text-[#8A8A8A] mb-2">Quick Prompts:</p>
          <div className="flex flex-wrap gap-2">
            <Tooltip
              content={tMessage(dictionary.tooltips.marketAnalysis.askAiData)}
              position="top"
            >
              <button
                onClick={() =>
                  handleSendMessage("Analyze the data on this page.")
                }
                className="text-[10px] bg-paper-card hover:bg-paper-base text-ink-dark px-2 py-1 rounded border border-ink-dark/20 transition-colors"
              >
                Analyze Page
              </button>
            </Tooltip>
            <Tooltip
              content={tMessage(
                dictionary.tooltips.marketAnalysis.generateStories,
              )}
              position="top"
            >
              <button
                onClick={() =>
                  handleSendMessage(
                    "Generate User Stories based on this context.",
                  )
                }
                className="text-[10px] bg-paper-card hover:bg-paper-base text-ink-dark px-2 py-1 rounded border border-ink-dark/20 transition-colors"
              >
                User Stories
              </button>
            </Tooltip>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {chatHistory.map((msg, idx) => (
            <div
              key={msg.id || idx}
              className={`flex gap-3 ${msg.role === "user" ? "flex-row-reverse" : ""}`}
            >
              <div
                className={`w-6 h-6 shrink-0 rounded flex items-center justify-center mt-1 ${msg.role === "user" ? "bg-ink-dark" : "bg-[#2C2C2C]"}`}
              >
                {msg.role === "user" ? (
                  <Users size={12} className="text-paper-light" />
                ) : (
                  <Sparkles size={12} className="text-paper-light" />
                )}
              </div>
              <div
                className={`max-w-[85%] rounded-lg p-3 text-sm ${msg.role === "user" ? "bg-ink-dark text-paper-light prose prose-sm prose-invert prose-p:text-paper-light prose-headings:text-paper-light prose-strong:text-paper-light prose-a:text-paper-light" : "bg-paper-card border border-ink-dark/20 text-ink-dark prose prose-sm prose-p:text-ink-dark prose-headings:text-ink-dark prose-strong:text-ink-dark prose-a:text-ink-dark"}`}
              >
                {msg.role === "user" ? (
                  <div className="whitespace-pre-wrap">
                    {msg.content
                      .split(/(\[\[.*?\]\])/g)
                      .map((part: string, i: number) => {
                        if (part.startsWith("[[") && part.endsWith("]]")) {
                          return (
                            <span
                              key={i}
                              className="px-1.5 py-0.5 bg-paper-base text-ink-dark text-xs rounded-md shadow-sm mx-1"
                            >
                              {part}
                            </span>
                          );
                        }
                        return part;
                      })}
                  </div>
                ) : (
                  <Markdown>{msg.content}</Markdown>
                )}
                {msg.suggestedInsight && (
                  <div className="mt-4 bg-paper-light border border-ink-dark/30 rounded-lg p-3 not-prose">
                    <div className="flex items-center gap-2 mb-2">
                      <Lightbulb size={14} className="text-amber-500" />
                      <span className="text-xs font-bold text-[#8A8A8A] uppercase tracking-wider">
                        Suggested Insight
                      </span>
                    </div>
                    <h4 className="font-medium text-ink-dark text-sm mb-1">
                      {msg.suggestedInsight.title}
                    </h4>
                    <p className="text-xs text-[#8A8A8A] mb-3">
                      {msg.suggestedInsight.description}
                    </p>
                    <Tooltip
                      content={
                        msg.insightAdded
                          ? tMessage(dictionary.tooltips.insight.insightAdded)
                          : tMessage(dictionary.tooltips.insight.saveSuggested)
                      }
                      position="top"
                    >
                      <button
                        onClick={() => {
                          if (msg.insightAdded) return;
                          const newInsight: DerivedInsight = {
                            id: `di-${Date.now()}`,
                            title: msg.suggestedInsight!.title,
                            description: msg.suggestedInsight!.description,
                            category: msg.suggestedInsight!.category,
                            impact: msg.suggestedInsight!.impact,
                            timestamp: new Date().toISOString(),
                            source: "Brainstorm",
                          };
                          setDerivedInsights((prev) => [newInsight, ...prev]);

                          // Mark as added
                          setChatHistory((prev) =>
                            prev.map((m, i) =>
                              i === idx ? { ...m, insightAdded: true } : m,
                            ),
                          );

                          addToast("Insight added successfully!", "success");
                        }}
                        disabled={msg.insightAdded}
                        className={`w-full text-xs font-sans font-medium py-1.5 rounded-full transition-all duration-300 ${
                          msg.insightAdded
                            ? "border border-[#8A8A8A] text-[#8A8A8A] cursor-not-allowed"
                            : "border border-[#2C2C2C] text-[#2C2C2C] hover:bg-[#2C2C2C] hover:text-[#F5F3ED]"
                        }`}
                      >
                        {msg.insightAdded ? "Insight Added" : "Add Insight"}
                      </button>
                    </Tooltip>
                  </div>
                )}
              </div>
            </div>
          ))}
          {isTyping && (
            <div className="flex gap-3">
              <div className="w-6 h-6 shrink-0 rounded bg-[#2C2C2C] flex items-center justify-center mt-1">
                <Loader2 size={12} className="text-paper-light animate-spin" />
              </div>
              <div className="bg-paper-card border border-ink-dark/20 rounded-lg p-3 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 bg-ink-dark rounded-full animate-bounce" />
                <span className="w-1.5 h-1.5 bg-ink-dark rounded-full animate-bounce delay-75" />
                <span className="w-1.5 h-1.5 bg-ink-dark rounded-full animate-bounce delay-150" />
              </div>
            </div>
          )}
        </div>

        <div className="p-4 bg-paper-base border-t border-ink-dark/20 shrink-0">
          {showMentionDropdown && (
            <div className="absolute bottom-full mb-2 left-4 w-64 max-h-48 overflow-y-auto bg-white border border-ink-dark/30 rounded-lg shadow-xl z-50">
              {[
                ...competitors.map((c) => ({
                  type: "Competitor",
                  name: c.name,
                })),
                ...derivedInsights.map((i) => ({
                  type: "Insight",
                  name: i.title,
                })),
              ]
                .filter((item) =>
                  item.name.toLowerCase().includes(mentionQuery),
                )
                .slice(0, 10)
                .map((item, idx) => (
                  <button
                    key={idx}
                    className="w-full text-left px-3 py-2 hover:bg-paper-base text-sm flex flex-col"
                    onClick={() => {
                      const lastAt = chatInput.lastIndexOf("@");
                      setChatInput(
                        chatInput.substring(0, lastAt) + `[[${item.name}]] `,
                      );
                      setShowMentionDropdown(false);
                    }}
                  >
                    <span className="font-medium text-ink-dark">
                      {item.name}
                    </span>
                    <span className="text-xs text-ink-faint">{item.type}</span>
                  </button>
                ))}
            </div>
          )}
          <div className="relative flex items-center">
            <input
              type="text"
              value={chatInput}
              onChange={(e) => {
                const val = e.target.value;
                setChatInput(val);
                const lastAt = val.lastIndexOf("@");
                if (lastAt !== -1 && !val.substring(lastAt).includes(" ")) {
                  setShowMentionDropdown(true);
                  setMentionQuery(val.substring(lastAt + 1).toLowerCase());
                } else {
                  setShowMentionDropdown(false);
                }
              }}
              onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
              onFocus={() => {
                if (chatState === "hover") setChatState("locked");
              }}
              placeholder="Ask about this page..."
              disabled={isTyping}
              className="w-full bg-paper-card border border-ink-dark/20 rounded-lg pl-3 pr-10 py-2.5 text-sm text-ink-dark focus:outline-none focus:border-[#2C2C2C] focus:ring-1 focus:ring-[#2C2C2C] transition-all disabled:opacity-50"
            />
            <button
              onClick={() => handleSendMessage()}
              disabled={isTyping || !chatInput.trim()}
              className="absolute right-1.5 p-1.5 text-[#8A8A8A] hover:text-[#2C2C2C] disabled:opacity-50 transition-colors rounded-md hover:bg-paper-base "
            >
              <Send size={16} />
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
