import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, ArrowRight, X, Loader2, MessageSquare } from 'lucide-react';
import { GoogleGenAI, Type } from '@google/genai';
import { withKeyRotation } from '../utils/geminiClient';
import { getErrorMessage } from '../utils/errorHandler';
import Markdown from 'react-markdown';

interface InsightGeneratorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onInsightGenerated: (insight: any) => void;
  rawContextData: any;
}

interface ChatMessage {
  id: string;
  role: 'assistant' | 'user';
  content: string;
  options?: string[];
  isFinalInsight?: boolean;
  insightData?: any;
}

export function InsightGeneratorModal({ isOpen, onClose, onInsightGenerated, rawContextData }: InsightGeneratorModalProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const hasStartedRef = useRef(false);

  useEffect(() => {
    setMessages([]);
    hasStartedRef.current = false;
  }, [rawContextData]);

  useEffect(() => {
    if (isOpen && messages.length === 0 && !hasStartedRef.current) {
      hasStartedRef.current = true;
      startConversation();
    }
  }, [isOpen, messages.length]);

  useEffect(() => {
    if (messagesEndRef.current && typeof messagesEndRef.current.scrollIntoView === 'function') {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isTyping]);

  const startConversation = async () => {
    if (isTyping) return;
    setIsTyping(true);
    try {
      const prompt = `
        You are an expert Market Intelligence AI. I have just synced a large amount of raw market data about form builders and data collection tools.
        
        Your goal is to help me generate ONE highly actionable insight (Opportunity, Threat, or Trend) from this data.
        Instead of just giving me the insight, ask me a multiple-choice question to understand what area I want to focus on right now.
        
        For example, you could ask if I'm more interested in "Pricing Changes", "New Competitor Features", or "Market Sentiment".
        
        Return a JSON object with:
        - "message": Your greeting and question.
        - "options": An array of 2-4 short string options for me to choose from.
      `;

      const response = await withKeyRotation(async (ai, model) => {
        return await ai.models.generateContent({
          model: model,
          contents: prompt,
          config: {
            responseMimeType: 'application/json',
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                message: { type: Type.STRING },
                options: { type: Type.ARRAY, items: { type: Type.STRING } }
              },
              required: ["message", "options"]
            }
          }
        });
      });

      const data = JSON.parse(response.text || '{"message": "What area would you like to explore?", "options": ["Pricing", "Features"]}');
      
      setMessages([{
        id: Date.now().toString(),
        role: 'assistant',
        content: data.message,
        options: data.options
      }]);
    } catch (error) {
      console.error('Failed to start conversation:', error);
      setMessages([{
        id: Date.now().toString(),
        role: 'assistant',
        content: "I'm having trouble connecting to the data source. Please try again later.",
        options: ["Retry"]
      }]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleOptionClick = async (option: string) => {
    const newUserMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: option
    };
    
    setMessages(prev => {
      // Remove options from the last assistant message
      const updated = [...prev];
      if (updated.length > 0 && updated[updated.length - 1].role === 'assistant') {
        updated[updated.length - 1].options = undefined;
      }
      return [...updated, newUserMsg];
    });

    setIsTyping(true);

    try {
      const historyText = messages.map(m => `${m.role === 'user' ? 'User' : 'AI'}: ${m.content}`).join('\n') + `\nUser: ${option}`;
      
      const prompt = `
        You are an expert Market Intelligence AI. We are having a conversation to generate a specific market insight.
        
        Conversation history:
        ${historyText}
        
        Raw Market Data Context:
        ${JSON.stringify(rawContextData).substring(0, 15000)} // Truncated to avoid token limits
        
        Based on the user's choice and the raw data, decide what to do next:
        1. If you need more specific direction, ask another multiple-choice question to narrow it down.
        2. If you have enough direction, generate the final insight.
        
        Return a JSON object with:
        - "isFinal": boolean (true if generating the final insight, false if asking another question)
        - "message": Your response or question.
        - "options": (Optional) Array of 2-4 string options if isFinal is false.
        - "insight": (Optional) If isFinal is true, provide the insight object with { "title": string, "description": string, "category": "opportunity"|"threat"|"trend", "impact": "high"|"medium"|"low" }
      `;

      const response = await withKeyRotation(async (ai, model) => {
        return await ai.models.generateContent({
          model: model,
          contents: prompt,
          config: {
            responseMimeType: 'application/json',
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                isFinal: { type: Type.BOOLEAN },
                message: { type: Type.STRING },
                options: { type: Type.ARRAY, items: { type: Type.STRING } },
                insight: {
                  type: Type.OBJECT,
                  properties: {
                    title: { type: Type.STRING },
                    description: { type: Type.STRING },
                    category: { type: Type.STRING },
                    impact: { type: Type.STRING }
                  }
                }
              },
              required: ["isFinal", "message"]
            }
          }
        });
      });

      const data = JSON.parse(response.text || '{"isFinal": false, "message": "Error processing response."}');
      
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        role: 'assistant',
        content: data.message,
        options: data.isFinal ? undefined : data.options,
        isFinalInsight: data.isFinal,
        insightData: data.insight
      }]);

    } catch (error) {
      console.error('Failed to process choice:', error);
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        role: 'assistant',
        content: "I encountered an error analyzing the data. Please try another option.",
        options: ["Start Over"]
      }]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleAcceptInsight = (insightData: any) => {
    const newInsight = {
      id: `insight-${Date.now()}`,
      title: insightData.title,
      description: insightData.description,
      category: insightData.category,
      impact: insightData.impact,
      sourceIds: [],
      isDeduced: true,
      source: 'AI',
      timestamp: new Date().toISOString()
    };
    onInsightGenerated(newInsight);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
      <div className="absolute inset-0 bg-ink-dark/40 backdrop-blur-sm" onClick={onClose} />
      
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="relative w-full max-w-2xl bg-paper-card rounded-2xl shadow-storybook border border-ink-dark/10 overflow-hidden flex flex-col max-h-[85vh]"
      >
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-ink-dark/10 bg-paper-base/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-moss/10 flex items-center justify-center text-moss">
              <Sparkles size={20} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-ink-dark font-serif">Insight Generator</h2>
              <p className="text-sm text-ink-muted">Explore the raw data to uncover hidden patterns.</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 text-ink-muted hover:text-ink-dark hover:bg-ink-dark/5 rounded-full transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 bg-paper-base/30">
          <AnimatePresence initial={false}>
            {messages.map((msg) => (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`max-w-[85%] ${msg.role === 'user' ? 'bg-moss text-white rounded-2xl rounded-tr-sm' : 'bg-white border border-ink-dark/10 shadow-sm rounded-2xl rounded-tl-sm'} p-4`}>
                  {msg.role === 'assistant' && (
                    <div className="flex items-center gap-2 mb-2 text-moss font-bold text-sm">
                      <Sparkles size={14} />
                      <span>Insight Engine</span>
                    </div>
                  )}
                  
                  <div className={`prose prose-sm max-w-none ${msg.role === 'user' ? 'prose-invert text-white' : 'text-ink-dark'}`}>
                    <Markdown>{msg.content}</Markdown>
                  </div>

                  {msg.options && msg.options.length > 0 && (
                    <div className="mt-4 flex flex-wrap gap-2">
                      {msg.options.map((opt, i) => (
                        <button
                          key={i}
                          onClick={() => opt === 'Start Over' || opt === 'Retry' ? startConversation() : handleOptionClick(opt)}
                          disabled={isTyping}
                          className="px-4 py-2 bg-paper-base hover:bg-moss/10 text-moss border border-moss/20 rounded-xl text-sm font-medium transition-colors flex items-center gap-2 disabled:opacity-50"
                        >
                          {opt}
                          <ArrowRight size={14} />
                        </button>
                      ))}
                    </div>
                  )}

                  {msg.isFinalInsight && msg.insightData && (
                    <div className="mt-4 p-4 bg-moss/5 border border-moss/20 rounded-xl">
                      <div className="flex items-center gap-2 mb-2">
                        <span className={`px-2 py-0.5 rounded text-xs font-bold uppercase tracking-wider ${
                          msg.insightData.category === 'opportunity' ? 'bg-emerald-100 text-emerald-700' :
                          msg.insightData.category === 'threat' ? 'bg-rose-100 text-rose-700' :
                          'bg-blue-100 text-blue-700'
                        }`}>
                          {msg.insightData.category}
                        </span>
                        <span className={`px-2 py-0.5 rounded text-xs font-bold uppercase tracking-wider ${
                          msg.insightData.impact === 'high' ? 'bg-rose-100 text-rose-700' :
                          msg.insightData.impact === 'medium' ? 'bg-amber-100 text-amber-700' :
                          'bg-emerald-100 text-emerald-700'
                        }`}>
                          {msg.insightData.impact} Impact
                        </span>
                      </div>
                      <h4 className="font-bold text-ink-dark text-lg mb-1">{msg.insightData.title}</h4>
                      <p className="text-ink-muted text-sm mb-4">{msg.insightData.description}</p>
                      
                      <button
                        onClick={() => handleAcceptInsight(msg.insightData)}
                        className="w-full py-2 bg-moss hover:bg-moss/90 text-white rounded-xl text-sm font-bold transition-colors"
                      >
                        Save to Insight Library
                      </button>
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {isTyping && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex justify-start"
            >
              <div className="bg-white border border-ink-dark/10 shadow-sm rounded-2xl rounded-tl-sm p-4 flex items-center gap-3">
                <Loader2 size={16} className="animate-spin text-moss" />
                <span className="text-sm text-ink-muted font-medium">Analyzing data...</span>
              </div>
            </motion.div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </motion.div>
    </div>
  );
}
