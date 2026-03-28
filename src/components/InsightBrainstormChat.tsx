import { dictionary, tMessage } from "../content/dictionary";
import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Sparkles,
  ArrowRight,
  X,
  Loader2,
  MessageSquare,
  Send,
  Save,
} from "lucide-react";
import { GoogleGenAI, Type, FunctionDeclaration } from "@google/genai";
import { withKeyRotation } from "../utils/geminiClient";
import { getErrorMessage } from "../utils/errorHandler";
import { supabase } from "../utils/hashing";
import Markdown from "react-markdown";
import { Tooltip } from "./Tooltip";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Mention from "@tiptap/extension-mention";
import Placeholder from "@tiptap/extension-placeholder";
import { createMentionSuggestion } from "./Mentions/mentionSuggestion";

/**
 * Props for the InsightBrainstormChat component.
 */
interface InsightBrainstormChatProps {
  /** Array of active competitors in the current product view */
  competitors: any[];
  /** Array of existing strategic insights already in the library */
  insights: any[];
  /** Array of raw scraped data points (Apollo/News) used as context */
  rawData: any[];
  /** Callback fired when the AI generates a concrete insight that the user wants to save */
  onSaveInsight: (insight: any) => void;
}

interface ChatMessage {
  id: string;
  role: "assistant" | "user";
  content: string;
  isTyping?: boolean;
}

/**
 * A specialized chat interface dedicated to refining and validating strategic insights.
 * @description
 * Instead of generating random data, this UI forces the AI into a strict "Strategist"
 * persona, prompting it to validate user ideas against the provided `competitors`
 * and `rawData`. It also utilizes function calling (Tools) to allow the AI to
 * programmatically call `onSaveInsight` when it feels the brainstorm has reached
 * a concrete conclusion.
 * @example
 * ```tsx
 * <InsightBrainstormChat
 *   competitors={competitors}
 *   insights={insights}
 *   rawData={rawData}
 *   onSaveInsight={saveNewInsight}
 * />
 * ```
 */
export function InsightBrainstormChat({
  competitors,
  insights,
  rawData,
  onSaveInsight,
}: InsightBrainstormChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (messages.length === 0) {
      setMessages([
        {
          id: Date.now().toString(),
          role: "assistant",
          content:
            "Hello. I am the Insight Brainstorming Engine. I have access to all your competitors, raw data, and existing insights. What area of the market would you like to explore today?",
        },
      ]);
    }
  }, []);

  useEffect(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop =
        scrollContainerRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  /**
   *
   */
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        // history: false, // Type definition issue with StarterKit options
      }),
      Placeholder.configure({
        placeholder:
          "Discuss market trends, ask about competitors... (Type @ or # to mention)",
      }),
      Mention.configure({
        HTMLAttributes: {
          class:
            "mention bg-ochre/20 text-ochre font-medium px-1.5 py-0.5 rounded-md",
        },
        suggestion: createMentionSuggestion("@"),
      }),
      Mention.extend({
        name: "hashtagMention",
      }).configure({
        HTMLAttributes: {
          class:
            "mention bg-blue-500/20 text-blue-600 font-medium px-1.5 py-0.5 rounded-md",
        },
        suggestion: createMentionSuggestion("#"),
      }),
    ],
    content: "",
    onUpdate: ({ editor }) => {
      setInputValue(editor.getText());
    },
    editorProps: {
      attributes: {
        class:
          "w-full bg-transparent border-none resize-none max-h-32 min-h-[44px] py-2.5 px-3 text-sm text-ink-dark focus:outline-none focus:ring-0 overflow-y-auto",
      },
      handleKeyDown: (view, event) => {
        if (event.key === "Enter" && !event.shiftKey) {
          event.preventDefault();
          handleSendMessage();
          return true;
        }
        return false;
      },
    },
  });

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isTyping) return;

    // Send the raw text (or HTML with mentions) to the AI
    // For now, we'll extract the text with the rendered mention labels.
    // If you need the structured data, use editor.getJSON()
    const userMsg = editor?.getText().trim() || inputValue.trim();

    // Pass the structured json if needed for context
    const jsonContent = editor?.getJSON();

    setInputValue("");
    editor?.commands.clearContent();

    const newUserMsg: ChatMessage = {
      id: Date.now().toString(),
      role: "user",
      content: userMsg,
    };

    setMessages((prev) => [...prev, newUserMsg]);
    setIsTyping(true);

    try {
      const historyText = messages
        .map(
          (msg) =>
            `${msg.role === "assistant" ? "Assistant" : "User"}: ${msg.content}`,
        )
        .join("\n");

      const saveInsightFunctionDeclaration: FunctionDeclaration = {
        name: "save_insight",
        description:
          "Save a valuable insight generated during the discussion to the Insight Library. Call this when you and the user have formulated a strong, actionable insight. The insight must be bidirectionally linked to raw data and other insights.",
        parameters: {
          type: Type.OBJECT,
          properties: {
            title: {
              type: Type.STRING,
              description: "A concise, catchy title for the insight.",
            },
            description: {
              type: Type.STRING,
              description:
                "A detailed explanation of the insight, its implications, and why it matters.",
            },
            category: {
              type: Type.STRING,
              enum: ["opportunity", "threat", "trend"],
              description: "The category of the insight.",
            },
            impact: {
              type: Type.STRING,
              enum: ["low", "medium", "high", "critical"],
              description: "The potential impact on the business.",
            },
            linkedRawDataIds: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description:
                "Array of raw data source IDs that support this insight.",
            },
            linkedInsightIds: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description:
                "Array of other insight IDs that are related to this one.",
            },
          },
          required: ["title", "description", "category", "impact"],
        },
      };

      const getFullEntityDetailsFunctionDeclaration: FunctionDeclaration = {
        name: "get_full_entity_details",
        description:
          "Fetch the complete detailed data payload for a specific entity (competitor, raw_data, insight, etc.) by its ID. Use this ONLY if you need deep analysis beyond the summary provided in the base context.",
        parameters: {
          type: Type.OBJECT,
          properties: {
            id: { type: Type.STRING, description: "The ID of the entity" },
            type: {
              type: Type.STRING,
              description: "The category/type of the entity",
            },
          },
          required: ["id", "type"],
        },
      };

      const prompt = `
        You are an expert Market Intelligence AI brainstorming partner.
        You have access to the following system context:
        
        Competitors: ${JSON.stringify(competitors.map((c) => ({ id: c.id, name: c.name, features: c.coreFeatures, pricing: c.freeTier })))}
        Existing Insights: ${JSON.stringify(insights.map((i) => ({ id: i.id, title: i.title, category: i.category })))}
        Raw Data Signals: ${JSON.stringify(rawData.map((r) => ({ id: r.id, excerpt: r.excerpt, type: r.type, tags: r.tags })))}
        
        Conversation history:
        ${historyText}
        User: ${userMsg}
        ${jsonContent ? `\n(User structured mentions: ${JSON.stringify(jsonContent)})` : ""}
        
        Your goal is to brainstorm with the user, analyze the data, and help them uncover deep, non-obvious insights.
        If you formulate a strong insight together, you MUST use the 'save_insight' tool to save it directly to the library. Make sure to link it to relevant raw data IDs and existing insight IDs to build a knowledge graph.
        If the user mentions specific raw data IDs, you may use the 'get_full_entity_details' tool to fetch more context if needed.
        
        Respond naturally and concisely.
      `;

      const responseStream = await withKeyRotation(async (ai, model) => {
        return await ai.models.generateContentStream({
          model: model,
          contents: prompt,
          config: {
            tools: [
              {
                functionDeclarations: [
                  saveInsightFunctionDeclaration,
                  getFullEntityDetailsFunctionDeclaration,
                ],
              },
            ],
          },
        });
      });

      let fullText = "";
      let hasFunctionCall = false;
      let finalInsightArgs: any = null;
      let getEntityArgs: any = null;
      const messageId = Date.now().toString() + "-text";

      setMessages((prev) => [
        ...prev,
        {
          id: messageId,
          role: "assistant",
          content: "",
        },
      ]);

      for await (const chunk of responseStream) {
        if (chunk.functionCalls && chunk.functionCalls.length > 0) {
          for (const call of chunk.functionCalls) {
            if (call.name === "save_insight") {
              hasFunctionCall = true;
              finalInsightArgs = call.args;
            } else if (call.name === "get_full_entity_details") {
              hasFunctionCall = true;
              getEntityArgs = call.args;
            }
          }
        }

        if (chunk.text) {
          fullText += chunk.text;
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === messageId ? { ...msg, content: fullText } : msg,
            ),
          );
        }
      }

      if (hasFunctionCall && getEntityArgs) {
        // Fetch the details from Supabase using the ID
        try {
          // This is a generic fetch. Realistically it would fetch from specific tables based on type
          const { data, error } = await supabase
            .from("raw_data_versions")
            .select("extracted_metadata")
            .eq("asset_id", getEntityArgs.id)
            .limit(1)
            .single();

          const detailsContent =
            error || !data
              ? `I tried to fetch details for ${getEntityArgs.id} but it was not found.`
              : `I've fetched the details for entity ID: **${getEntityArgs.id}** (${getEntityArgs.type}). Details: ${JSON.stringify(data.extracted_metadata).substring(0, 1000)}...`;

          setMessages((prev) => [
            ...prev,
            {
              id: Date.now().toString() + "-func",
              role: "assistant",
              content: detailsContent,
            },
          ]);
        } catch (e) {
          setMessages((prev) => [
            ...prev,
            {
              id: Date.now().toString() + "-func",
              role: "assistant",
              content: `I tried to fetch details for ${getEntityArgs.id} but an error occurred.`,
            },
          ]);
        }
      } else if (hasFunctionCall && finalInsightArgs) {
        onSaveInsight({
          title: finalInsightArgs.title,
          description: finalInsightArgs.description,
          category: finalInsightArgs.category,
          impact: finalInsightArgs.impact,
          source: "Brainstorm",
          sourceIds: finalInsightArgs.linkedRawDataIds || [],
          linkedInsightIds: finalInsightArgs.linkedInsightIds || [],
        });

        setMessages((prev) => [
          ...prev,
          {
            id: Date.now().toString() + "-func",
            role: "assistant",
            content: `I've saved the insight: **${finalInsightArgs.title}** to the library!`,
          },
        ]);
      }

      if (!fullText && !hasFunctionCall) {
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === messageId
              ? { ...msg, content: "I've processed that." }
              : msg,
          ),
        );
      } else if (!fullText && hasFunctionCall) {
        // Remove the empty text message if only a function call was made
        setMessages((prev) => prev.filter((msg) => msg.id !== messageId));
      }
    } catch (error) {
      console.error("Failed to get response:", error);
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          role: "assistant",
          content:
            "I'm having trouble connecting to the brainstorming engine. Please try again.",
        },
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="flex flex-col h-[650px] bg-paper-light overflow-hidden">
      {/* Header */}
      <div className="relative p-5 border-b border-ink-dark/10 bg-gradient-to-r from-paper-base to-paper-light overflow-hidden shrink-0">
        <div className="absolute top-0 right-0 w-64 h-64 bg-ochre/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none" />
        <div className="relative z-10 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white border border-ink-dark/10 flex items-center justify-center shadow-sm">
            <Sparkles className="text-ochre w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-ink-dark text-lg tracking-tight">
              Insight Brainstorming Engine
            </h3>
            <p className="text-xs text-ink-dark/60">
              AI-powered market analysis and ideation
            </p>
          </div>
        </div>
      </div>

      {/* Chat Area */}
      <div
        ref={scrollContainerRef}
        className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 bg-white"
      >
        {messages.map((msg) => (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            key={msg.id}
            className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
          >
            {msg.role === "assistant" && (
              <div className="w-8 h-8 rounded-full bg-paper-base border border-ink-dark/10 flex items-center justify-center shrink-0 mr-3 mt-1">
                <Sparkles className="w-4 h-4 text-ochre" />
              </div>
            )}
            <div
              className={`max-w-[85%] sm:max-w-[75%] rounded-2xl px-5 py-3.5 shadow-sm ${
                msg.role === "user"
                  ? "bg-ink-dark text-white rounded-tr-sm"
                  : "bg-paper-base border border-ink-dark/10 text-ink-dark rounded-tl-sm"
              }`}
            >
              <div
                className={`prose prose-sm max-w-none prose-p:leading-relaxed ${
                  msg.role === "user"
                    ? "prose-invert text-white/90"
                    : "prose-pre:bg-white/50 prose-pre:text-ink-dark prose-pre:border prose-pre:border-ink-dark/10"
                }`}
              >
                <Markdown>{msg.content}</Markdown>
              </div>
            </div>
          </motion.div>
        ))}
        {isTyping && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex justify-start"
          >
            <div className="w-8 h-8 rounded-full bg-paper-base border border-ink-dark/10 flex items-center justify-center shrink-0 mr-3 mt-1">
              <Sparkles className="w-4 h-4 text-ochre" />
            </div>
            <div className="bg-paper-base border border-ink-dark/10 rounded-2xl rounded-tl-sm px-5 py-4 flex items-center gap-2 shadow-sm">
              <div className="flex gap-1">
                <span
                  className="w-1.5 h-1.5 bg-ink-dark/40 rounded-full animate-bounce"
                  style={{ animationDelay: "0ms" }}
                ></span>
                <span
                  className="w-1.5 h-1.5 bg-ink-dark/40 rounded-full animate-bounce"
                  style={{ animationDelay: "150ms" }}
                ></span>
                <span
                  className="w-1.5 h-1.5 bg-ink-dark/40 rounded-full animate-bounce"
                  style={{ animationDelay: "300ms" }}
                ></span>
              </div>
            </div>
          </motion.div>
        )}
      </div>

      {/* Input Area */}
      <div className="p-4 sm:p-5 border-t border-ink-dark/10 bg-paper-base shrink-0">
        <div className="relative flex items-end gap-2 bg-white border border-ink-dark/20 rounded-2xl p-2 shadow-sm focus-within:border-ink-dark/40 focus-within:ring-1 focus-within:ring-ink-dark/10 transition-all">
          <EditorContent editor={editor} className="flex-1 w-full" />
          <Tooltip
            content={tMessage(dictionary.tooltips.brainstorm.sendMessage)}
            position="top"
          >
            <button
              onClick={handleSendMessage}
              disabled={!inputValue.trim() || isTyping}
              className="p-2.5 bg-ink-dark text-white rounded-xl hover:bg-black disabled:opacity-50 disabled:hover:bg-ink-dark transition-all shrink-0 mb-0.5"
            >
              <Send className="w-4 h-4" />
            </button>
          </Tooltip>
        </div>
        <div className="text-center mt-2">
          <span className="text-[10px] text-ink-dark/40 uppercase tracking-wider font-semibold">
            AI can make mistakes. Verify important insights.
          </span>
        </div>
      </div>
    </div>
  );
}
