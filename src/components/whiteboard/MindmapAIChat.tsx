import React, { useState, useRef, useEffect } from "react";
import { useVisualKnowledgeStore } from "../../store/visualKnowledgeStore";
import { Send, X, Bot, User, Pin, AtSign } from "lucide-react";
import { withKeyRotation } from "../../utils/geminiClient";
import { getErrorMessage } from "../../utils/errorHandler";
import ReactMarkdown from "react-markdown";

interface MindmapAIChatProps {
  activeWhiteboardId: string;
  onClose: () => void;
}

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  contextUsed?: { type: "tag" | "card"; value: string }[];
}

export function MindmapAIChat({
  activeWhiteboardId,
  onClose,
}: MindmapAIChatProps) {
  const { cards, addCard, placeCardOnWhiteboard } = useVisualKnowledgeStore();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [showMentions, setShowMentions] = useState(false);
  const [mentionFilter, setMentionFilter] = useState("");

  const inputRef = useRef<HTMLTextAreaElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll
  useEffect(() => {
    if (
      messagesEndRef.current &&
      typeof messagesEndRef.current.scrollIntoView === "function"
    ) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  // Mentions logic
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setInput(val);

    const cursorPosition = e.target.selectionStart || 0;
    const textBeforeCursor = val.substring(0, cursorPosition);
    const words = textBeforeCursor.split(/\s+/);
    const lastWord = words[words.length - 1];

    if (lastWord.startsWith("@")) {
      setShowMentions(true);
      setMentionFilter(lastWord.substring(1).toLowerCase());
    } else {
      setShowMentions(false);
    }
  };

  const allTags = Array.from(
    new Set(Object.values(cards).flatMap((c) => c.tags)),
  );
  const allCardTitles = Object.values(cards).map((c) => c.title);

  const filteredMentions = [
    ...allTags
      .filter((t) => t.toLowerCase().includes(mentionFilter))
      .map((t) => ({ type: "tag", value: t })),
    ...allCardTitles
      .filter((t) => t.toLowerCase().includes(mentionFilter))
      .map((t) => ({ type: "card", value: t })),
  ].slice(0, 10);

  const insertMention = (mention: { type: string; value: string }) => {
    const cursorPosition = inputRef.current?.selectionStart || 0;
    const textBeforeCursor = input.substring(0, cursorPosition);
    const words = textBeforeCursor.split(/\s+/);
    words.pop(); // Remove the incomplete @mention

    const newTextBefore = words.length > 0 ? words.join(" ") + " " : "";
    const mentionText =
      mention.type === "tag" ? mention.value : `[[${mention.value}]]`;
    const newText =
      newTextBefore + mentionText + " " + input.substring(cursorPosition);

    setInput(newText);
    setShowMentions(false);
    inputRef.current?.focus();
  };

  const handleSend = async () => {
    if (!input.trim() || isTyping) return;

    const userMsg = input.trim();
    setInput("");
    setShowMentions(false);

    // Parse context from the message
    const usedTags = allTags.filter((t) => userMsg.includes(t));
    const usedCards = allCardTitles.filter((c) => userMsg.includes(`[[${c}]]`));

    const contextUsed = [
      ...usedTags.map((t) => ({ type: "tag" as const, value: t })),
      ...usedCards.map((c) => ({ type: "card" as const, value: c })),
    ];

    const newMsg: Message = {
      id: `msg-${Date.now()}`,
      role: "user",
      content: userMsg,
      timestamp: new Date(),
      contextUsed: contextUsed.length > 0 ? contextUsed : undefined,
    };

    setMessages((prev) => [...prev, newMsg]);
    setIsTyping(true);

    try {
      // Build Context String for Gemini
      let contextString = "";
      if (contextUsed.length > 0) {
        const matchingCards = Object.values(cards).filter(
          (card) =>
            usedTags.some((t) => card.tags.includes(t)) ||
            usedCards.includes(card.title),
        );

        if (matchingCards.length > 0) {
          contextString = `Here is the relevant context from the user's visual knowledge base:\n\n`;
          matchingCards.forEach((c) => {
            contextString += `--- CARD: ${c.title} ---\nType: ${c.type}\nTags: ${c.tags.join(", ")}\nContent:\n${c.content}\n\n`;
          });
          contextString += `Please use the context above to answer the user's question or brainstorm ideas.\n\n`;
        }
      }

      const response = await withKeyRotation(async (ai, model) => {
        const history = messages.map((m) => ({
          role: m.role === "user" ? "user" : "model",
          parts: [{ text: m.content }],
        }));

        const chat = ai.chats.create({ model, history: history as any });
        return await chat.sendMessage({
          message: `${contextString}User Query: ${userMsg}`,
        });
      });

      setMessages((prev) => [
        ...prev,
        {
          id: `msg-${Date.now()}`,
          role: "assistant",
          content:
            response.text ||
            "I apologize, but I was unable to generate a response.",
          timestamp: new Date(),
        },
      ]);
    } catch (error) {
      console.error("Chat error:", error);
      setMessages((prev) => [
        ...prev,
        {
          id: `msg-${Date.now()}`,
          role: "assistant",
          content: `Error: ${getErrorMessage(error)}`,
          timestamp: new Date(),
        },
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  const handlePinInsight = (content: string) => {
    // Generate a title summarizing the content (in prod, maybe ask Gemini to title it)
    const title = "AI Insight: " + content.substring(0, 20) + "...";

    // Add to global store
    const newCardId = addCard({
      title,
      content,
      type: "insight",
      tags: ["#ai-insight"],
    });

    // Place in center of active whiteboard
    placeCardOnWhiteboard(activeWhiteboardId, newCardId, { x: 300, y: 300 });
  };

  return (
    <div className="w-96 bg-white border-l border-[#8A9A8E]/20 shadow-xl flex flex-col z-20 shrink-0 h-full">
      {/* Header */}
      <div className="p-4 border-b border-[#8A9A8E]/20 flex justify-between items-center bg-[#F9F9F9]">
        <div className="flex items-center gap-2 text-[#2C2C2C]">
          <Bot size={20} className="text-[#4A7C59]" />
          <h2 className="font-bold">Knowledge Chat</h2>
        </div>
        <button
          data-testid="close-chat-btn"
          onClick={onClose}
          className="text-[#8A9A8E] hover:text-[#2C2C2C]"
        >
          <X size={20} />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-[#F5F3ED]/30">
        {messages.length === 0 && (
          <div className="text-center text-[#8A9A8E] text-sm mt-10">
            <Bot size={48} className="mx-auto mb-4 opacity-20" />
            <p className="mb-2">I'm your visual knowledge assistant.</p>
            <p>
              Use{" "}
              <span className="font-mono bg-black/5 px-1 rounded text-[#4A7C59]">
                @
              </span>{" "}
              to mention tags or cards and pull them into our conversation as
              context.
            </p>
          </div>
        )}

        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex flex-col ${msg.role === "user" ? "items-end" : "items-start"}`}
          >
            {msg.contextUsed && msg.contextUsed.length > 0 && (
              <div className="flex gap-1 mb-1 flex-wrap justify-end">
                {msg.contextUsed.map((ctx, i) => (
                  <span
                    key={i}
                    className="text-[10px] px-1.5 py-0.5 bg-[#4A7C59]/10 text-[#4A7C59] rounded-sm flex items-center gap-1"
                  >
                    <AtSign size={8} /> {ctx.value}
                  </span>
                ))}
              </div>
            )}

            <div
              className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm ${
                msg.role === "user"
                  ? "bg-[#4A7C59] text-white rounded-tr-sm"
                  : "bg-white border border-[#8A9A8E]/20 text-[#2C2C2C] shadow-sm rounded-tl-sm"
              }`}
            >
              {msg.role === "user" ? (
                <div className="whitespace-pre-wrap">{msg.content}</div>
              ) : (
                <div className="prose prose-sm prose-p:leading-relaxed max-w-none">
                  <ReactMarkdown>{msg.content}</ReactMarkdown>

                  {/* Pin Action for AI Responses */}
                  <div className="mt-3 pt-3 border-t border-[#8A9A8E]/10 flex justify-end">
                    <button
                      data-tour="pin-to-board-btn"
                      onClick={() => handlePinInsight(msg.content)}
                      className="flex items-center gap-1.5 text-xs text-[#8B5A2B] bg-[#FFF9E6] hover:bg-[#FFE0B2] px-2 py-1 rounded transition-colors"
                    >
                      <Pin size={12} /> Pin to Board
                    </button>
                  </div>
                </div>
              )}
            </div>
            <div className="text-[10px] text-[#8A9A8E] mt-1 px-1">
              {msg.timestamp.toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </div>
          </div>
        ))}
        {isTyping && (
          <div className="flex items-start">
            <div className="bg-white border border-[#8A9A8E]/20 shadow-sm rounded-2xl rounded-tl-sm px-4 py-3">
              <div className="flex gap-1">
                <div
                  className="w-1.5 h-1.5 bg-[#8A9A8E]/50 rounded-full animate-bounce"
                  style={{ animationDelay: "0ms" }}
                />
                <div
                  className="w-1.5 h-1.5 bg-[#8A9A8E]/50 rounded-full animate-bounce"
                  style={{ animationDelay: "150ms" }}
                />
                <div
                  className="w-1.5 h-1.5 bg-[#8A9A8E]/50 rounded-full animate-bounce"
                  style={{ animationDelay: "300ms" }}
                />
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div
        className="p-4 bg-white border-t border-[#8A9A8E]/20 relative"
        data-tour="ai-chat-input"
      >
        {/* Mentions Dropdown */}
        {showMentions && filteredMentions.length > 0 && (
          <div className="absolute bottom-full left-4 right-4 mb-2 bg-white border border-[#8A9A8E]/20 shadow-xl rounded-xl overflow-hidden z-30">
            <div className="bg-[#F9F9F9] px-3 py-1 text-xs font-bold text-[#8A9A8E] border-b border-[#8A9A8E]/10">
              Mention Context
            </div>
            <div className="max-h-48 overflow-y-auto">
              {filteredMentions.map((mention, i) => (
                <button
                  key={i}
                  onClick={() => insertMention(mention)}
                  className="w-full text-left px-3 py-2 text-sm hover:bg-[#F5F3ED] flex flex-col items-start border-b border-[#8A9A8E]/5 last:border-0"
                >
                  <span className="font-medium text-[#2C2C2C]">
                    {mention.value}
                  </span>
                  <span className="text-[10px] text-[#8A9A8E] uppercase">
                    {mention.type}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="relative flex items-end">
          <textarea
            ref={inputRef}
            value={input}
            onChange={handleInputChange}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder="Ask AI or type @ to mention tags..."
            className="w-full bg-[#F5F3ED] border border-[#8A9A8E]/30 rounded-xl py-3 pl-4 pr-12 text-sm focus:outline-none focus:border-[#4A7C59] focus:ring-1 focus:ring-[#4A7C59] resize-none min-h-[44px] max-h-32"
            rows={1}
            style={{
              height: input
                ? `${Math.min(inputRef.current?.scrollHeight || 44, 128)}px`
                : "44px",
            }}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || isTyping}
            className="absolute right-2 bottom-2 p-1.5 bg-[#4A7C59] text-white rounded-lg hover:bg-[#3B6647] disabled:opacity-50 disabled:hover:bg-[#4A7C59] transition-colors"
          >
            <Send size={16} />
          </button>
        </div>
        <div className="text-center mt-2">
          <span className="text-[10px] text-[#8A9A8E]">
            Press Enter to send, Shift+Enter for new line
          </span>
        </div>
      </div>
    </div>
  );
}
