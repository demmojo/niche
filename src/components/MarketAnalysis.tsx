import { dictionary, tMessage } from "../content/dictionary";
import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useSyncQueue } from "../hooks/useSyncQueue";
import {
  Mailbox,
  Coffee,
  ArrowRight,
  Sparkles,
  Newspaper,
  ChevronRight,
  Loader2,
  Award,
  Mail,
} from "lucide-react";
import { GoogleGenAI, Type } from "@google/genai";
import { withKeyRotation } from "../utils/geminiClient";
import { getErrorMessage } from "../utils/errorHandler";
import Markdown from "react-markdown";
import { Tooltip } from "./Tooltip";
import MarketDataGrid from "./MarketDataGrid";

interface MarketAnalysisProps {
  stats: any;
  competitors: any[];
  insights: any[];
  rawData: any[];
  onAddFeature?: (name: string, description: string) => void;
  onAddInsight?: (title: string, description: string) => void;
}

interface ChatMessage {
  id: string;
  sender: "burt" | "user";
  text: string;
  suggestedFeatures?: Array<{ name: string; description: string }>;
  suggestedInsights?: Array<{ title: string; description: string }>;
}

export default function MarketAnalysis({
  stats,
  competitors,
  insights,
  rawData,
  onAddFeature,
  onAddInsight,
}: MarketAnalysisProps) {
  const [activeTab, setActiveTab] = useState<"chat" | "data">("chat");
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [currentOptions, setCurrentOptions] = useState<string[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [achievements, setAchievements] = useState<string[]>([]);
  const [mailbox, setMailbox] = useState<any[]>([]);
  const [isMailboxOpen, setIsMailboxOpen] = useState(false);
  const [lastOptionTime, setLastOptionTime] = useState<number>(Date.now());
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const { syncQueue } = useSyncQueue(); // Added to track sync status
  const [hasNewInsights, setHasNewInsights] = useState(false);
  const [latestInsights, setLatestInsights] = useState<any>(null);

  const dataFingerprint = `${competitors.length}-${rawData.length}`;
  const previousFingerprint = useRef(dataFingerprint);

  // Sync state computed from queue and stats
  const isSyncing = syncQueue.length > 0;
  const syncAction = isSyncing
    ? "Background sync in progress..."
    : "No active sync";

  // Scroll to bottom
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop =
        chatContainerRef.current.scrollHeight;
    }
  }, [chatHistory, isTyping]);

  // Initial greeting
  useEffect(() => {
    if (chatHistory.length === 0) {
      startConversation();
    }
  }, []);

  // Background deep analysis after sync
  useEffect(() => {
    if (
      chatHistory.length > 0 &&
      dataFingerprint !== previousFingerprint.current
    ) {
      runDeepAnalysis();
    }
    previousFingerprint.current = dataFingerprint;
  }, [dataFingerprint]);

  const runDeepAnalysis = async () => {
    if (stats.tracked === 0 && rawData.length === 0) return;

    setIsTyping(true);
    setCurrentOptions([]);
    try {
      const prompt = `
        You are Burt, the Head of Market Refinement at Lumon Industries (a mysterious, vaguely dystopian corporate company inspired by the show Severance). You are chatting with a coworker (the user) about the "outside" market.

        While you maintain a corporate, detached, and slightly eerie tone (mentioning "Kier", "Macrodata", or "the Board" occasionally), you MUST be fully rational, highly strategic, grounded, accurate, and deeply analytical.
        
        You have access to this freshly synced market data: 
        - Competitors tracked: ${stats.tracked} (${competitors
          .slice(0, 3)
          .map((c) => c.name)
          .join(", ")}...)
        - Top Integrations: ${stats.topIntegrations}
        - Recent Pricing Changes: ${stats.pricingChanges}
        - Features Indexed: ${stats.featuresIndexed}
        - Recent Insights: ${insights
          .slice(0, 5)
          .map(
            (i) =>
              `${i.title} (Links to: ${i.sourceIds?.join(", ") || "none"})`,
          )
          .join(" | ")}
        - Raw Data Signals: ${rawData
          .slice(0, 5)
          .map((r) => `${r.excerpt} (ID: ${r.id})`)
          .join(" | ")}
        
        You have just completed a deep background analysis of the latest synchronized market data. 
        Identify the 1-3 most compelling, trending, or critical shifts in the market that could directly improve our product's competitive positioning and chances of success.
        
        In your response:
        1. Present your deep analysis findings concisely (2-3 sentences).
        2. Ask the user which specific topic or trend they would like to explore further.
        3. Extract any specific product features you recommend into the \`suggestedFeatures\` array.
        4. Extract any high-level strategic insights into the \`suggestedInsights\` array.
      `;

      const response = await withKeyRotation(async (ai, model) => {
        // Fallback to pro model if not otherwise specified to ensure high-quality reasoning for deep analysis
        const finalModel = model.includes("flash") ? "gemini-1.5-pro" : model;
        return await ai.models.generateContent({
          model: finalModel,
          contents: prompt,
          config: {
            responseMimeType: "application/json",
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                message: {
                  type: Type.STRING,
                  description:
                    "Burt's proactive deep analysis message to the user.",
                },
                options: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                  description:
                    "An array of 1 to 3 possible replies the user can choose from.",
                },
                suggestedFeatures: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      name: { type: Type.STRING },
                      description: { type: Type.STRING },
                    },
                    required: ["name", "description"],
                  },
                },
                suggestedInsights: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      title: { type: Type.STRING },
                      description: { type: Type.STRING },
                    },
                    required: ["title", "description"],
                  },
                },
              },
              required: ["message", "options"],
            },
          },
        });
      });

      const data = JSON.parse(
        response.text ||
          '{"message": "I have completed a review of the latest market data. Shall we discuss?", "options": ["Yes", "No"]}',
      );

      // Store the insights temporarily and show the mixed-initiative chip
      setLatestInsights({
        message: data.message,
        suggestedFeatures: data.suggestedFeatures,
        suggestedInsights: data.suggestedInsights,
        options: data.options,
      });
      setHasNewInsights(true);
    } catch (error) {
      console.error("Failed to run deep analysis:", getErrorMessage(error));
    } finally {
      setIsTyping(false);
    }
  };

  const startConversation = async () => {
    setIsTyping(true);
    try {
      if (stats.tracked === 0 && rawData.length === 0) {
        setChatHistory([
          {
            id: Date.now().toString(),
            sender: "burt",
            text: "Welcome to Market Refinement. Our records indicate no recent market data has been synchronized. Please initiate a sync to populate the database before we begin our analysis. We serve Kier by staying informed.",
          },
        ]);
        setCurrentOptions(["I will sync the data."]);
        setIsTyping(false);
        return;
      }

      const prompt = `
        You are Burt, the Head of Market Refinement at Lumon Industries (a mysterious, vaguely dystopian corporate company inspired by the show Severance). You are chatting with a coworker (the user) about the "outside" market.

        While you maintain a corporate, detached, and slightly eerie tone (mentioning "Kier", "Macrodata", or "the Board" occasionally), you MUST be fully rational, highly strategic, grounded, accurate, and deeply analytical.
        
        You have access to this market data: 
        - Competitors tracked: ${stats.tracked} (${competitors
          .slice(0, 3)
          .map((c) => c.name)
          .join(", ")}...)
        - Top Integrations: ${stats.topIntegrations}
        - Recent Pricing Changes: ${stats.pricingChanges}
        - Features Indexed: ${stats.featuresIndexed}
        - Recent Insights: ${insights
          .slice(0, 5)
          .map(
            (i) =>
              `${i.title} (Links to: ${i.sourceIds?.join(", ") || "none"})`,
          )
          .join(" | ")}
        - Raw Data Signals: ${rawData
          .slice(0, 5)
          .map((r) => `${r.excerpt} (ID: ${r.id})`)
          .join(" | ")}
        
        Your goal is to provide highly accurate, strategic market analysis wrapped in this corporate-cultish persona. Explicitly reference specific data points, competitors, insights, and raw data signals provided in the context.
        
        Start the conversation by greeting the coworker, making a brief, dry observation about the office environment (e.g., the melon bar or the lighting), and then immediately pivoting to a highly strategic question or observation about the market data provided above. Keep it to 2-3 sentences.
        
        In your response:
        1. Present your findings concisely.
        2. Ask the user which specific topic or trend they would like to explore further.
        3. Extract any specific product features you recommend into the \`suggestedFeatures\` array.
        4. Extract any high-level strategic insights into the \`suggestedInsights\` array.
      `;

      const response = await withKeyRotation(async (ai, model) => {
        return await ai.models.generateContent({
          model: model,
          contents: prompt,
          config: {
            responseMimeType: "application/json",
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                message: {
                  type: Type.STRING,
                  description: "Burt's response to the user.",
                },
                options: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                  description:
                    "An array of 1 to 3 possible replies the user can choose from to continue the conversation.",
                },
                suggestedFeatures: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      name: {
                        type: Type.STRING,
                        description: "Name of the feature",
                      },
                      description: {
                        type: Type.STRING,
                        description: "Description of the feature",
                      },
                    },
                    required: ["name", "description"],
                  },
                  description:
                    "Specific product features extracted from the analysis that we should consider adding to our product.",
                },
                suggestedInsights: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      title: {
                        type: Type.STRING,
                        description: "Insight title",
                      },
                      description: {
                        type: Type.STRING,
                        description:
                          "Detailed description of the strategic insight",
                      },
                    },
                    required: ["title", "description"],
                  },
                  description:
                    "High-level strategic insights extracted from the analysis.",
                },
              },
              required: ["message", "options"],
            },
          },
        });
      });

      const data = JSON.parse(
        response.text ||
          '{"message": "Hello. The melon is exquisite today. Shall we discuss the market?", "options": ["Yes, let\'s.", "I prefer the deviled eggs."]}',
      );

      setChatHistory([
        {
          id: Date.now().toString(),
          sender: "burt",
          text: data.message,
          suggestedFeatures: data.suggestedFeatures,
          suggestedInsights: data.suggestedInsights,
        },
      ]);
      setCurrentOptions(data.options || []);
      setLastOptionTime(Date.now());
    } catch (error) {
      console.error("Failed to start conversation:", getErrorMessage(error));
      setChatHistory([
        {
          id: Date.now().toString(),
          sender: "burt",
          text: "Praise Kier. The network seems to be experiencing a localized anomaly. Please try again later.",
        },
      ]);
      setCurrentOptions(["Retry connection"]);
    } finally {
      setIsTyping(false);
    }
  };

  const revealNewInsights = () => {
    if (!latestInsights) return;

    setChatHistory((prev) => [
      ...prev,
      {
        id: Date.now().toString(),
        sender: "burt",
        text:
          "I have just completed a deep background analysis of the latest synchronized market data. " +
          latestInsights.message,
        suggestedFeatures: latestInsights.suggestedFeatures,
        suggestedInsights: latestInsights.suggestedInsights,
      },
    ]);
    setCurrentOptions(latestInsights.options || ["Yes", "No"]);
    setLastOptionTime(Date.now());

    // Clear the notification state
    setHasNewInsights(false);
    setLatestInsights(null);
  };

  const handleOptionClick = async (option: string) => {
    if (option === "I will sync the data.") {
      setChatHistory((prev) => [
        ...prev,
        { id: Date.now().toString(), sender: "user", text: option },
      ]);
      setCurrentOptions([]);
      return;
    }

    const now = Date.now();
    const timeTaken = now - lastOptionTime;

    // Achievement check
    if (timeTaken < 3000 && !achievements.includes("Refined Reflexes")) {
      setAchievements((prev) => [...prev, "Refined Reflexes"]);
    }

    // Add user message
    const newUserMsg: ChatMessage = {
      id: Date.now().toString(),
      sender: "user",
      text: option,
    };
    setChatHistory((prev) => [...prev, newUserMsg]);
    setCurrentOptions([]);
    setIsTyping(true);

    try {
      const historyText = chatHistory
        .map((msg) => `${msg.sender === "burt" ? "Burt" : "User"}: ${msg.text}`)
        .join("\n");

      const prompt = `
        You are Burt, the Head of Market Refinement at Lumon Industries (a mysterious, vaguely dystopian corporate company inspired by the show Severance). You are chatting with a coworker (the user) about the "outside" market.

        While you maintain a corporate, detached, and slightly eerie tone (mentioning "Kier", "Macrodata", or "the Board" occasionally), you MUST be fully rational, highly strategic, grounded, accurate, and deeply analytical.
        
        Market data: 
        - Competitors tracked: ${stats.tracked} (${competitors
          .slice(0, 3)
          .map((c) => c.name)
          .join(", ")}...)
        - Top Integrations: ${stats.topIntegrations}
        - Recent Pricing Changes: ${stats.pricingChanges}
        - Features Indexed: ${stats.featuresIndexed}
        - Recent Insights: ${insights
          .slice(0, 5)
          .map(
            (i) =>
              `${i.title} (Links to: ${i.sourceIds?.join(", ") || "none"})`,
          )
          .join(" | ")}
        - Raw Data Signals: ${rawData
          .slice(0, 5)
          .map((r) => `${r.excerpt} (ID: ${r.id})`)
          .join(" | ")}
        
        Conversation history:
        ${historyText}
        User: ${option}
        
        Your goal is to provide highly accurate, strategic market analysis wrapped in this corporate-cultish persona. Explicitly reference specific data points, competitors, insights, and raw data signals provided in the context.
        
        Respond to the user's last message with a grounded, data-driven strategic insight. Keep it to 2-3 sentences. Then provide 1 to 3 new options for them to reply.
        
        In your response:
        1. Present your findings concisely.
        2. Ask the user which specific topic or trend they would like to explore further.
        3. Extract any specific product features you recommend into the \`suggestedFeatures\` array.
        4. Extract any high-level strategic insights into the \`suggestedInsights\` array.
      `;

      const response = await withKeyRotation(async (ai, model) => {
        return await ai.models.generateContent({
          model: model,
          contents: prompt,
          config: {
            responseMimeType: "application/json",
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                message: {
                  type: Type.STRING,
                  description: "Burt's response to the user.",
                },
                options: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                  description:
                    "An array of 1 to 3 possible replies the user can choose from to continue the conversation.",
                },
                suggestedFeatures: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      name: {
                        type: Type.STRING,
                        description: "Name of the feature",
                      },
                      description: {
                        type: Type.STRING,
                        description: "Description of the feature",
                      },
                    },
                    required: ["name", "description"],
                  },
                  description:
                    "Specific product features extracted from the analysis that we should consider adding to our product.",
                },
                suggestedInsights: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      title: {
                        type: Type.STRING,
                        description: "Insight title",
                      },
                      description: {
                        type: Type.STRING,
                        description:
                          "Detailed description of the strategic insight",
                      },
                    },
                    required: ["title", "description"],
                  },
                  description:
                    "High-level strategic insights extracted from the analysis.",
                },
              },
              required: ["message", "options"],
            },
          },
        });
      });

      const data = JSON.parse(
        response.text ||
          '{"message": "I see. Very astute.", "options": ["Continue"]}',
      );

      setChatHistory((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          sender: "burt",
          text: data.message,
          suggestedFeatures: data.suggestedFeatures,
          suggestedInsights: data.suggestedInsights,
        },
      ]);
      setCurrentOptions(data.options || []);
      setLastOptionTime(Date.now());
    } catch (error) {
      console.error("Failed to get response:", getErrorMessage(error));
      setChatHistory((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          sender: "burt",
          text: "The board has requested a moment of silence.",
        },
      ]);
      setCurrentOptions(["Acknowledge"]);
    } finally {
      setIsTyping(false);
    }
  };

  const checkMailbox = async () => {
    setIsMailboxOpen(true);
    if (mailbox.length === 0) {
      // Generate mail
      try {
        const prompt = `
          Generate a short weekly newspaper update about the BaaS form market, including a fun fact about global politics or history. 
          The tone should be a mix of a corporate newsletter (like Lumon Industries from Severance) and a quirky market report.
          Format as a JSON object with "title", "date", and "content" (use markdown for content).
        `;
        const response = await withKeyRotation(async (ai, model) => {
          return await ai.models.generateContent({
            model: model,
            contents: prompt,
            config: {
              responseMimeType: "application/json",
              responseSchema: {
                type: Type.OBJECT,
                properties: {
                  title: { type: Type.STRING },
                  date: { type: Type.STRING },
                  content: { type: Type.STRING },
                },
                required: ["title", "date", "content"],
              },
            },
          });
        });

        const data = JSON.parse(
          response.text ||
            '{"title": "The Kier Chronicle", "date": "Today", "content": "No news is good news."}',
        );
        setMailbox([data]);
      } catch (error) {
        console.error("Failed to fetch mail:", getErrorMessage(error));
      }
    }
  };

  const handleGenerateInsightFromChat = async () => {
    if (chatHistory.length < 2) return;
    setIsTyping(true);
    try {
      const historyText = chatHistory
        .map((msg) => `${msg.sender === "burt" ? "Burt" : "User"}: ${msg.text}`)
        .join("\n");

      const prompt = `
        Summarize the following chat history between Burt (a market analyst) and the User into a single, high-level strategic insight.
        Return JSON with "title" and "description".
        
        Chat History:
        ${historyText}
      `;

      const response = await withKeyRotation(async (ai, model) => {
        return await ai.models.generateContent({
          model: model,
          contents: prompt,
          config: {
            responseMimeType: "application/json",
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                title: {
                  type: Type.STRING,
                  description: "A concise title for the insight",
                },
                description: {
                  type: Type.STRING,
                  description: "A detailed strategic summary of the chat",
                },
              },
              required: ["title", "description"],
            },
          },
        });
      });

      const data = JSON.parse(
        response.text ||
          '{"title": "Chat Insight", "description": "Failed to summarize chat."}',
      );

      if (onAddInsight) {
        onAddInsight(data.title, data.description);
      }
    } catch (error) {
      console.error(
        "Failed to summarize chat into insight:",
        getErrorMessage(error),
      );
    } finally {
      setIsTyping(false);
    }
  };

  // Typewriter component
  const TypewriterText = ({ text }: { text: string }) => {
    const [displayedText, setDisplayedText] = useState("");

    useEffect(() => {
      let i = 0;
      setDisplayedText("");
      const interval = setInterval(() => {
        setDisplayedText(text.substring(0, i + 1));
        i++;
        if (i >= text.length) clearInterval(interval);
      }, 30); // Speed of typing
      return () => clearInterval(interval);
    }, [text]);

    return (
      <div className="prose prose-sm prose-p:text-moss prose-strong:text-moss max-w-none">
        <Markdown>{displayedText}</Markdown>
      </div>
    );
  };

  return (
    <div className="min-h-full bg-paper-base text-moss font-sans p-4 md:p-8 rounded-xl border-4 border-ink-dark/30 shadow-2xl relative overflow-hidden">
      <div className="max-w-4xl mx-auto flex flex-col h-[80vh]">
        {/* Header */}
        <header className="flex justify-between items-end border-b-2 border-moss/30 pb-4 mb-6 mt-4">
          <div>
            <p className="text-[#8A8A8A] text-[10px] tracking-[0.2em] font-sans mb-1">
              市場分析
            </p>
            <h1 className="font-serif text-3xl md:text-4xl text-[#2C2C2C] uppercase tracking-wide">
              Market Analysis
            </h1>
            <div className="flex items-center gap-4 mt-2">
              <button
                onClick={() => setActiveTab("chat")}
                className={`text-sm font-bold uppercase tracking-wider transition-colors px-3 py-1 rounded ${activeTab === "chat" ? "bg-moss text-paper-light" : "text-moss/60 hover:text-moss"}`}
              >
                Chat
              </button>
              <button
                onClick={() => setActiveTab("data")}
                className={`text-sm font-bold uppercase tracking-wider transition-colors px-3 py-1 rounded ${activeTab === "data" ? "bg-moss text-paper-light" : "text-moss/60 hover:text-moss"}`}
              >
                Data & SWOT
              </button>
            </div>
            {activeTab === "chat" && (
              <p className="text-[#8A8A8A] text-sm font-sans mt-2">
                Archivist Burt // Status:{" "}
                {isTyping
                  ? "Typing..."
                  : isSyncing
                    ? "Syncing..."
                    : "Reading..."}
              </p>
            )}

            {/* Sync Progress Banner */}
            <AnimatePresence>
              {isSyncing && (
                <motion.div
                  initial={{ opacity: 0, height: 0, marginTop: 0 }}
                  animate={{ opacity: 1, height: "auto", marginTop: 16 }}
                  exit={{ opacity: 0, height: 0, marginTop: 0 }}
                  className="bg-sky/10 border border-sky/30 rounded-lg p-3 flex items-center gap-3 overflow-hidden"
                >
                  <Loader2
                    size={16}
                    className="text-sky animate-spin shrink-0"
                  />
                  <div className="text-sm">
                    <span className="font-bold text-sky mr-2">
                      Background Task:
                    </span>
                    <span className="text-ink-dark/80">
                      Processing new data... {syncQueue.length} pending items
                    </span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          <div className="flex gap-4 items-center">
            {stats.lastSynced && (
              <div className="flex items-center gap-2 text-xs">
                <span className="opacity-60">Last Pulled:</span>
                <span
                  className={`font-medium ${
                    new Date(stats.lastSynced).getTime() <
                    Date.now() - 24 * 60 * 60 * 1000
                      ? "text-amber-500" // Stale (> 24h)
                      : "text-moss" // Fresh
                  }`}
                >
                  {new Date(stats.lastSynced).toLocaleString()}
                </span>
                {new Date(stats.lastSynced).getTime() <
                  Date.now() - 24 * 60 * 60 * 1000 && (
                  <span
                    title="Data is older than 24 hours"
                    className="cursor-help text-amber-500"
                  >
                    ⚠️
                  </span>
                )}
              </div>
            )}

            {achievements.length > 0 && (
              <div className="flex gap-2">
                {achievements.map((ach, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-1 bg-paper-card px-2 py-1 rounded border border-moss text-xs"
                    title={ach}
                  >
                    <Award size={14} className="text-yellow-400" />
                    <span className="hidden sm:inline">{ach}</span>
                  </div>
                ))}
              </div>
            )}
            <Tooltip
              content={tMessage(dictionary.tooltips.mail.checkMail)}
              position="left"
            >
              <button
                onClick={checkMailbox}
                className="relative p-2 hover:bg-paper-card rounded transition-colors border border-transparent hover:border-moss"
              >
                <Mail size={24} />
                {mailbox.length === 0 && (
                  <span className="absolute top-0 right-0 w-3 h-3 bg-red-500 rounded-full animate-pulse"></span>
                )}
              </button>
            </Tooltip>
          </div>
        </header>

        {activeTab === "chat" ? (
          <>
            {/* Chat Area */}
            <div
              ref={chatContainerRef}
              className="flex-1 overflow-y-auto mb-6 space-y-6 pr-4 custom-scrollbar relative"
            >
              {chatHistory.map((msg, idx) => (
                <div
                  key={msg.id}
                  className={`flex flex-col ${msg.sender === "user" ? "items-end" : "items-start"}`}
                >
                  <div className="text-xs opacity-50 mb-1 uppercase tracking-wider">
                    {msg.sender === "burt" ? "Burt (O&D)" : "You"}
                  </div>
                  <div
                    className={`max-w-[80%] p-4 rounded ${
                      msg.sender === "user"
                        ? "bg-paper-card border border-moss text-ink-dark"
                        : "bg-transparent border-l-4 border-moss pl-4"
                    }`}
                  >
                    {msg.sender === "burt" && idx === chatHistory.length - 1 ? (
                      <TypewriterText text={msg.text} />
                    ) : (
                      <div className="prose prose-sm prose-p:text-moss prose-strong:text-moss max-w-none">
                        <Markdown>{msg.text}</Markdown>
                      </div>
                    )}

                    {msg.suggestedFeatures &&
                      msg.suggestedFeatures.length > 0 && (
                        <div className="mt-6 space-y-3">
                          <div className="text-xs font-bold uppercase tracking-wider text-moss/70 flex items-center gap-2">
                            <Sparkles size={12} /> Suggested Features
                          </div>
                          <div className="grid gap-3">
                            {msg.suggestedFeatures.map((feat, fIdx) => (
                              <div
                                key={fIdx}
                                className="bg-paper-card border border-moss/20 hover:border-moss/50 transition-colors p-4 rounded-xl text-sm flex justify-between items-center gap-4 group"
                              >
                                <div>
                                  <div className="font-bold text-ink-dark">
                                    {feat.name}
                                  </div>
                                  <div className="text-ink-muted mt-1 leading-relaxed">
                                    {feat.description}
                                  </div>
                                </div>
                                <button
                                  onClick={() =>
                                    onAddFeature &&
                                    onAddFeature(feat.name, feat.description)
                                  }
                                  className="shrink-0 text-xs font-bold bg-moss/10 text-moss px-3 py-2 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-moss hover:text-white transition-all duration-200 shadow-sm"
                                >
                                  + Add to Pending
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                    {msg.suggestedInsights &&
                      msg.suggestedInsights.length > 0 && (
                        <div className="mt-6 space-y-3">
                          <div className="text-xs font-bold uppercase tracking-wider text-moss/70 flex items-center gap-2">
                            <Sparkles size={12} /> Strategic Insights
                          </div>
                          <div className="grid gap-3">
                            {msg.suggestedInsights.map((insight, iIdx) => (
                              <div
                                key={iIdx}
                                className="bg-sky/5 border border-sky/20 hover:border-sky/50 transition-colors p-4 rounded-xl text-sm flex justify-between items-center gap-4 group"
                              >
                                <div>
                                  <div className="font-bold text-sky-900">
                                    {insight.title}
                                  </div>
                                  <div className="text-sky-800/80 mt-1 leading-relaxed">
                                    {insight.description}
                                  </div>
                                </div>
                                <button
                                  onClick={() =>
                                    onAddInsight &&
                                    onAddInsight(
                                      insight.title,
                                      insight.description,
                                    )
                                  }
                                  className="shrink-0 text-xs font-bold bg-sky text-white px-3 py-2 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-sky-600 transition-all duration-200 shadow-sm"
                                >
                                  + Save to Matrix
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                  </div>
                </div>
              ))}

              {isTyping && (
                <div className="flex flex-col items-start">
                  <div className="text-xs opacity-50 mb-1 uppercase tracking-wider">
                    Burt (O&D)
                  </div>
                  <div className="bg-transparent border-l-4 border-moss pl-4 p-4">
                    <span className="animate-pulse">_</span>
                  </div>
                </div>
              )}
              {/* <div ref={chatEndRef} /> */}

              {/* Mixed-Initiative Chip for Proactive Insights */}
              <AnimatePresence>
                {hasNewInsights && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 20 }}
                    className="sticky bottom-4 mx-auto w-fit"
                  >
                    <button
                      onClick={revealNewInsights}
                      className="bg-sky text-white shadow-lg px-4 py-2 rounded-full font-bold flex items-center gap-2 hover:bg-sky/90 transition-colors"
                    >
                      <Sparkles size={16} />1 New Insight Available
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Options Area */}
            <div className="border-t-2 border-moss pt-6 min-h-[120px] flex justify-between items-start gap-4">
              <div className="flex-1">
                {!isTyping && currentOptions.length > 0 && (
                  <div className="flex flex-col gap-3">
                    <div className="text-xs opacity-50 uppercase tracking-wider mb-2">
                      Select Response:
                    </div>
                    {currentOptions.map((opt, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleOptionClick(opt)}
                        className="text-left p-3 border border-moss hover:bg-moss hover:text-paper-light transition-colors rounded font-medium flex items-center gap-3 group"
                      >
                        <span className="opacity-50 group-hover:opacity-100">
                          [{idx + 1}]
                        </span>
                        {opt}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <div className="shrink-0 mt-[26px]">
                <Tooltip
                  content={
                    <>
                      Synthesizes the recent conversation into a strategic
                      insight and saves it to your matrix.
                    </>
                  }
                  position="top"
                >
                  <button
                    onClick={handleGenerateInsightFromChat}
                    disabled={isTyping || chatHistory.length < 2}
                    className="flex items-center gap-2 px-4 py-2 bg-moss text-paper-base rounded font-bold hover:bg-ink-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Sparkles size={16} />
                    Generate Insight
                  </button>
                </Tooltip>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 pb-6">
            <MarketDataGrid competitors={competitors} rawData={rawData} />
          </div>
        )}
      </div>

      {/* Mailbox Modal */}
      <AnimatePresence>
        {isMailboxOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-paper-base/90 backdrop-blur-sm z-50 flex items-center justify-center p-4 md:p-12"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-paper-card border-2 border-moss w-full max-w-2xl max-h-full overflow-y-auto p-8 rounded-xl shadow-2xl"
            >
              <div className="flex justify-between items-center mb-8 border-b border-moss pb-4">
                <h2 className="text-2xl font-bold uppercase flex items-center gap-3">
                  <Newspaper className="text-moss" /> Interdepartmental Mail
                </h2>
                <Tooltip
                  content={tMessage(dictionary.tooltips.mail.closeMail)}
                  position="left"
                >
                  <button
                    onClick={() => setIsMailboxOpen(false)}
                    className="hover:text-red-400 transition-colors"
                  >
                    [ CLOSE ]
                  </button>
                </Tooltip>
              </div>

              {mailbox.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <Loader2 size={48} className="animate-spin text-moss mb-4" />
                  <p>Retrieving missives from the Board...</p>
                </div>
              ) : (
                <div className="space-y-8">
                  {mailbox.map((mail, idx) => (
                    <div
                      key={idx}
                      className="bg-paper-base p-6 border border-moss/50 rounded"
                    >
                      <div className="flex justify-between items-baseline mb-4">
                        <h3 className="text-xl font-bold text-ink-dark">
                          {mail.title}
                        </h3>
                        <span className="text-xs opacity-70">{mail.date}</span>
                      </div>
                      <div className="prose  prose-p:text-ink-muted prose-headings:text-ink-dark max-w-none">
                        <Markdown>{mail.content}</Markdown>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: var(--color-paper-base);
          border-left: 1px solid rgba(var(--color-ink-rgb), 0.1);
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: var(--color-moss);
          border-radius: 4px;
        }
      `}</style>
    </div>
  );
}
