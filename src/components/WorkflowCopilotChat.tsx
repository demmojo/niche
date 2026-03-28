import React, { useState } from "react";
import { MessageSquare, Users, Sparkles, Loader2, Send } from "lucide-react";
import Markdown from "react-markdown";

export interface CopilotMessage {
  id: string;
  role: "user" | "ai";
  content: string;
  artifactToMount?: string;
}

interface WorkflowCopilotChatProps {
  chatHistory: CopilotMessage[];
  isTyping: boolean;
  onSendMessage: (msg: string) => void;
}

/**
 *
 */
export function WorkflowCopilotChat({
  chatHistory,
  isTyping,
  onSendMessage,
}: WorkflowCopilotChatProps) {
  const [chatInput, setChatInput] = useState("");

  /**
   *
   */
  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!chatInput.trim() || isTyping) return;
    onSendMessage(chatInput);
    setChatInput("");
  };

  return (
    <div className="flex flex-col h-full bg-[#0F172A] text-white font-sans">
      <div className="h-16 border-b-4 border-slate-700 flex items-center px-4 shrink-0 bg-slate-900">
        <MessageSquare
          size={18}
          className="text-[var(--color-brutal-cyan)] mr-2"
        />
        <span className="font-mono font-bold uppercase tracking-widest text-[var(--color-brutal-cyan)]">
          Niche Copilot
        </span>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {chatHistory.map((msg) => (
          <div
            key={msg.id}
            className={`flex gap-3 ${msg.role === "user" ? "flex-row-reverse" : ""}`}
          >
            <div
              className={`w-8 h-8 shrink-0 rounded-none flex items-center justify-center border-2 border-black shadow-[2px_2px_0px_0px_#000] ${
                msg.role === "user"
                  ? "bg-[var(--color-brutal-chartreuse)] text-black"
                  : "bg-[var(--color-brutal-cyan)] text-black"
              }`}
            >
              {msg.role === "user" ? (
                <Users size={14} />
              ) : (
                <Sparkles size={14} />
              )}
            </div>
            <div
              className={`max-w-[85%] border-2 border-black p-3 text-sm font-mono shadow-[4px_4px_0px_0px_#000] ${
                msg.role === "user"
                  ? "bg-slate-800 text-white"
                  : "bg-white text-black"
              }`}
            >
              <Markdown>{msg.content}</Markdown>
            </div>
          </div>
        ))}
        {isTyping && (
          <div className="flex gap-3">
            <div className="w-8 h-8 shrink-0 border-2 border-black bg-[var(--color-brutal-cyan)] flex items-center justify-center text-black shadow-[2px_2px_0px_0px_#000]">
              <Loader2 size={14} className="animate-spin" />
            </div>
            <div className="bg-white border-2 border-black shadow-[4px_4px_0px_0px_#000] p-3 flex items-center gap-1.5">
              <span className="w-2 h-2 bg-black rounded-none animate-bounce" />
              <span className="w-2 h-2 bg-black rounded-none animate-bounce delay-75" />
              <span className="w-2 h-2 bg-black rounded-none animate-bounce delay-150" />
            </div>
          </div>
        )}
      </div>

      <div className="p-4 border-t-4 border-slate-700 bg-slate-900 shrink-0">
        <form onSubmit={handleSubmit} className="relative flex items-center">
          <input
            type="text"
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            placeholder="Type a product idea (e.g. 'A CRM for plumbers')..."
            disabled={isTyping}
            className="w-full bg-slate-800 border-2 border-black p-3 pr-12 text-sm text-white focus:outline-none focus:border-[var(--color-brutal-cyan)] font-mono disabled:opacity-50 shadow-[4px_4px_0px_0px_#000]"
          />
          <button
            type="submit"
            disabled={isTyping || !chatInput.trim()}
            className="absolute right-2 p-2 bg-[var(--color-brutal-chartreuse)] text-black border-2 border-black hover:bg-white disabled:opacity-50 transition-colors shadow-[2px_2px_0px_0px_#000]"
          >
            <Send size={16} />
          </button>
        </form>
      </div>
    </div>
  );
}
