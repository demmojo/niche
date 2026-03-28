import React, { useState, useEffect, useCallback, useRef } from "react";
import DOMPurify from "dompurify";
import { useVirtualizer } from "@tanstack/react-virtual";
import {
  B_H2,
  B_H3,
  B_TextBody,
  B_Card,
  B_Input,
  B_Textarea,
  B_Button,
  B_Badge,
} from "../BrutalistUI";

interface StrategyWorkspaceProps {
  templateId: string;
}

// Simulated background sync function
const debouncedSync = (data: any, callback: () => void) => {
  return setTimeout(() => {
    console.log("Syncing data to backend...", data);
    callback();
  }, 1000);
};

export default function StrategyWorkspace({
  templateId,
}: StrategyWorkspaceProps) {
  // Sync Status
  const [syncStatus, setSyncStatus] = useState<"idle" | "saving" | "saved">(
    "idle",
  );
  const syncTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Strategy Canvas State
  const [swotData, setSwotData] = useState({
    strengths: "",
    weaknesses: "",
    opportunities: "",
    threats: "",
  });

  // AI Chat State
  const [chatMessages, setChatMessages] = useState<
    Array<{ role: "ai" | "user"; content: string; id: string }>
  >([]);
  const [inputValue, setInputValue] = useState("");
  const parentRef = useRef<HTMLDivElement>(null);

  // Simulate Generative Pre-fill
  useEffect(() => {
    if (templateId === "swot") {
      const prefill = {
        strengths: "Strong brand recognition\nHigh market share in EMEA",
        weaknesses: "Legacy tech debt\nHigh pricing tier limits SMB adoption",
        opportunities: "",
        threats: "",
      };
      // Sanitize before setting
      const safePrefill = {
        strengths: DOMPurify.sanitize(prefill.strengths),
        weaknesses: DOMPurify.sanitize(prefill.weaknesses),
        opportunities: "",
        threats: "",
      };
      setSwotData(safePrefill);

      setChatMessages([
        {
          role: "ai",
          content:
            "I have pre-filled the SWOT canvas with known market data. What else would you like to explore?",
          id: "msg-1",
        },
      ]);
    }
  }, [templateId]);

  // Handle Canvas Input Change with Debounced Sync
  const handleCanvasChange = (key: keyof typeof swotData, value: string) => {
    const safeValue = DOMPurify.sanitize(value);
    setSwotData((prev) => ({ ...prev, [key]: safeValue }));

    setSyncStatus("saving");
    if (syncTimerRef.current) clearTimeout(syncTimerRef.current);

    syncTimerRef.current = debouncedSync(
      { ...swotData, [key]: safeValue },
      () => {
        setSyncStatus("saved");
        setTimeout(() => setSyncStatus("idle"), 2000);
      },
    );
  };

  // Handle AI Chat Submission
  const handleChatSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim()) return;

    const safeInput = DOMPurify.sanitize(inputValue);
    const newMessage = {
      role: "user" as const,
      content: safeInput,
      id: Date.now().toString(),
    };

    setChatMessages((prev) => [...prev, newMessage]);
    setInputValue("");

    // Simulate AI response
    setTimeout(() => {
      const aiResponse = {
        role: "ai" as const,
        content:
          "Based on recent data, Competitor X is expanding into the mid-market. I recommend adding this to Threats.",
        id: (Date.now() + 1).toString(),
      };
      setChatMessages((prev) => [...prev, aiResponse]);
    }, 1000);
  };

  // AI Chat Virtualization
  const rowVirtualizer = useVirtualizer({
    count: chatMessages.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 100, // estimated height of a message
    overscan: 5,
  });

  return (
    <div className="flex flex-col md:flex-row h-[calc(100vh-120px)] w-full">
      {/* LEFT PANE: AI Chat & Reference Data */}
      <div className="w-full md:w-1/3 border-r-2 border-slate-700 bg-slate-900 flex flex-col h-full overflow-hidden shrink-0">
        <div className="p-4 border-b-2 border-slate-700 bg-slate-800 shrink-0 z-10">
          <B_H3 className="mb-1">AI STRATEGY COPILOT</B_H3>
          <B_TextBody className="text-xs">
            Chat is isolated from the canvas to prevent global re-renders.
          </B_TextBody>
        </div>

        {/* Virtualized Chat List */}
        <div
          ref={parentRef}
          className="flex-1 overflow-auto p-4 bg-slate-900 relative"
        >
          <div
            style={{
              height: `${rowVirtualizer.getTotalSize()}px`,
              width: "100%",
              position: "relative",
            }}
          >
            {rowVirtualizer.getVirtualItems().map((virtualItem) => {
              const msg = chatMessages[virtualItem.index];
              return (
                <div
                  key={msg.id}
                  style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    width: "100%",
                    transform: `translateY(${virtualItem.start}px)`,
                  }}
                  className={`mb-4 ${msg.role === "user" ? "pr-4 pl-12" : "pl-4 pr-12"}`}
                >
                  <B_Card
                    glow={msg.role === "ai"}
                    className={`p-4 ${msg.role === "user" ? "bg-slate-800 border-slate-700" : "bg-[var(--color-brutal-surface)] border-[var(--color-brutal-cyan)]"}`}
                  >
                    <div className="font-mono text-xs font-bold mb-2 uppercase tracking-widest text-[var(--color-brutal-cyan)]">
                      {msg.role === "ai" ? "NicheAI" : "You"}
                    </div>
                    <div className="text-sm font-sans text-white break-words">
                      {msg.content}
                    </div>
                  </B_Card>
                </div>
              );
            })}
          </div>
        </div>

        {/* Chat Input */}
        <div className="p-4 border-t-2 border-slate-700 bg-slate-800 shrink-0">
          <form onSubmit={handleChatSubmit} className="flex gap-2">
            <B_Input
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Ask for strategic insights..."
              className="flex-1"
            />
            <B_Button type="submit" variant="primary">
              SEND
            </B_Button>
          </form>
        </div>
      </div>

      {/* RIGHT PANE: Structured Canvas (CSS Grid) */}
      <div className="w-full md:w-2/3 bg-[#0F172A] flex flex-col h-full overflow-hidden">
        <div className="p-6 border-b-2 border-slate-700 flex justify-between items-center shrink-0">
          <div>
            <B_H2 className="mb-1 uppercase">
              {templateId.replace("-", " ")} CANVAS
            </B_H2>
            <B_TextBody className="text-sm">
              Native CSS Grid. No heavy node-graph libraries used.
            </B_TextBody>
          </div>
          <div>
            {syncStatus === "saving" && (
              <B_Badge variant="warning">SAVING...</B_Badge>
            )}
            {syncStatus === "saved" && (
              <B_Badge variant="success">SAVED</B_Badge>
            )}
            {syncStatus === "idle" && <B_Badge variant="info">SYNCED</B_Badge>}
          </div>
        </div>

        <div className="flex-1 p-6 overflow-auto">
          {/* 2x2 SWOT Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 h-full min-h-[500px]">
            {/* Strengths */}
            <B_Card className="flex flex-col h-full border-t-4 border-t-[var(--color-brutal-chartreuse)]">
              <div className="flex justify-between items-start mb-4">
                <B_H3>STRENGTHS</B_H3>
                <span className="text-4xl opacity-20">S</span>
              </div>
              <B_Textarea
                className="flex-1 h-full font-mono text-sm"
                value={swotData.strengths}
                onChange={(e) =>
                  handleCanvasChange("strengths", e.target.value)
                }
                placeholder="What advantages does the product have?"
              />
            </B_Card>

            {/* Weaknesses */}
            <B_Card className="flex flex-col h-full border-t-4 border-t-[var(--color-brutal-red)]">
              <div className="flex justify-between items-start mb-4">
                <B_H3>WEAKNESSES</B_H3>
                <span className="text-4xl opacity-20">W</span>
              </div>
              <B_Textarea
                className="flex-1 h-full font-mono text-sm"
                value={swotData.weaknesses}
                onChange={(e) =>
                  handleCanvasChange("weaknesses", e.target.value)
                }
                placeholder="What could be improved?"
              />
            </B_Card>

            {/* Opportunities */}
            <B_Card className="flex flex-col h-full border-t-4 border-t-[var(--color-brutal-cyan)]">
              <div className="flex justify-between items-start mb-4">
                <B_H3>OPPORTUNITIES</B_H3>
                <span className="text-4xl opacity-20">O</span>
              </div>
              <B_Textarea
                className="flex-1 h-full font-mono text-sm"
                value={swotData.opportunities}
                onChange={(e) =>
                  handleCanvasChange("opportunities", e.target.value)
                }
                placeholder="What trends could be exploited?"
              />
            </B_Card>

            {/* Threats */}
            <B_Card className="flex flex-col h-full border-t-4 border-t-yellow-400">
              <div className="flex justify-between items-start mb-4">
                <B_H3>THREATS</B_H3>
                <span className="text-4xl opacity-20">T</span>
              </div>
              <B_Textarea
                className="flex-1 h-full font-mono text-sm"
                value={swotData.threats}
                onChange={(e) => handleCanvasChange("threats", e.target.value)}
                placeholder="What obstacles exist?"
              />
            </B_Card>
          </div>
        </div>
      </div>
    </div>
  );
}
