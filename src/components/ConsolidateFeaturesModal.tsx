import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Combine, Loader2, Check } from 'lucide-react';
import { Tooltip } from './Tooltip';
import { Type } from '@google/genai';
import { withKeyRotation } from '../utils/geminiClient';

interface ConsolidateFeaturesModalProps {
  isOpen: boolean;
  onClose: () => void;
  competitors: any[];
  onConsolidate: (updates: { competitorId: string, newFeatures: string[] }[]) => void;
}

export const ConsolidateFeaturesModal: React.FC<ConsolidateFeaturesModalProps> = ({ isOpen, onClose, competitors, onConsolidate }) => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [suggestions, setSuggestions] = useState<any[] | null>(null);
  const [isApplying, setIsApplying] = useState(false);

  if (!isOpen) return null;

  const handleAnalyze = async () => {
    setIsAnalyzing(true);
    try {
      const allFeatures = competitors.map(c => ({
        id: c.id,
        name: c.name,
        features: c.coreFeatures || []
      }));

      const prompt = `You are a product manager analyzing competitor features. 
We have a list of features across different competitors. Convert the features into unique capabilities/features so we can aggregate features that are too similar.
For example, "Conversational UI" and "Chat Interface", or "Developer SDKs" and "API Access", should be aggregated into a single unique capability.

Analyze the following competitor features and suggest how to aggregate them into unique capabilities.
Return a JSON object with a "consolidations" array. Each item should have:
- "originalFeatures": an array of exact feature strings that should be combined.
- "suggestedName": the new, consolidated unique capability/feature name.
- "reasoning": why they should be aggregated.

Competitor Data:
${JSON.stringify(allFeatures, null, 2)}
`;

      const response = await withKeyRotation(async (ai, model) => {
        return ai.models.generateContent({
          model: model,
          contents: prompt,
          config: {
            responseMimeType: 'application/json',
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                consolidations: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      originalFeatures: { type: Type.ARRAY, items: { type: Type.STRING } },
                      suggestedName: { type: Type.STRING },
                      reasoning: { type: Type.STRING }
                    },
                    required: ["originalFeatures", "suggestedName", "reasoning"]
                  }
                }
              }
            }
          }
        });
      });
      
      const result = JSON.parse(response.text || '{}');
      setSuggestions(result.consolidations || []);
    } catch (error) {
      console.error('Error analyzing features:', error);
      alert('Failed to analyze features. Please try again.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleApply = () => {
    if (!suggestions) return;
    setIsApplying(true);
    
    const updates = competitors.map(c => {
      let newFeatures = [...(c.coreFeatures || [])];
      
      suggestions.forEach(suggestion => {
        let hasAnyOriginal = false;
        suggestion.originalFeatures.forEach((orig: string) => {
          const index = newFeatures.indexOf(orig);
          if (index !== -1) {
            hasAnyOriginal = true;
            newFeatures.splice(index, 1);
          }
        });
        
        if (hasAnyOriginal && !newFeatures.includes(suggestion.suggestedName)) {
          newFeatures.push(suggestion.suggestedName);
        }
      });
      
      return {
        competitorId: c.id,
        newFeatures
      };
    });
    
    onConsolidate(updates);
    setIsApplying(false);
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-ink-dark/60 backdrop-blur-md">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="bg-paper-light rounded-2xl shadow-2xl w-full max-w-3xl overflow-hidden border border-ink-dark/20 flex flex-col max-h-[90vh]"
          >
            {/* Header */}
            <div className="relative p-6 sm:p-8 border-b border-ink-dark/10 bg-gradient-to-br from-paper-base to-paper-light overflow-hidden shrink-0">
              <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none" />
              <div className="relative z-10 flex items-start justify-between">
                <div>
                  <div className="w-12 h-12 rounded-xl bg-white border border-ink-dark/10 flex items-center justify-center shadow-sm mb-4">
                    <Combine size={24} className="text-emerald-600" />
                  </div>
                  <h2 className="text-2xl font-bold text-ink-dark tracking-tight">
                    Aggregate Capabilities
                  </h2>
                  <p className="text-ink-dark/60 mt-1 text-sm">
                    Use AI to scan all competitor features and convert them into unique capabilities to eliminate redundancy.
                  </p>
                </div>
                <Tooltip content="Close modal" position="left">
                  <button 
                    onClick={onClose}
                    className="p-2 text-ink-dark/40 hover:text-ink-dark hover:bg-white rounded-full transition-colors"
                  >
                    <X size={20} />
                  </button>
                </Tooltip>
              </div>
            </div>
            
            <div className="p-6 sm:p-8 overflow-y-auto flex-1 bg-white">
              {!suggestions ? (
                <div className="text-center py-12">
                  <div className="w-24 h-24 bg-paper-base rounded-full flex items-center justify-center mx-auto mb-6 border border-ink-dark/5">
                    <Combine size={40} className="text-ink-dark/30" />
                  </div>
                  <h3 className="text-xl font-bold text-ink-dark mb-2">Ready to Aggregate</h3>
                  <p className="text-ink-dark/60 max-w-md mx-auto mb-8">
                    We'll analyze the feature lists of all your competitors and group similar items (e.g., "Chatbot" and "Conversational AI") into single, unified capabilities.
                  </p>
                  <button 
                    onClick={handleAnalyze}
                    disabled={isAnalyzing}
                    className="relative inline-flex items-center justify-center gap-2 px-8 py-3 bg-ink-dark text-white rounded-xl font-semibold hover:bg-black transition-all disabled:opacity-50 disabled:hover:bg-ink-dark shadow-md hover:shadow-lg overflow-hidden group min-w-[200px]"
                  >
                    {isAnalyzing ? (
                      <>
                        <Loader2 size={18} className="animate-spin" />
                        <span>Analyzing Features...</span>
                      </>
                    ) : (
                      <>
                        <Combine size={18} className="group-hover:scale-110 transition-transform" />
                        <span>Start Analysis</span>
                      </>
                    )}
                    {!isAnalyzing && (
                      <div className="absolute inset-0 -translate-x-full group-hover:animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-white/20 to-transparent" />
                    )}
                  </button>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="bg-emerald-50 text-emerald-800 p-4 rounded-xl border border-emerald-200 flex items-center gap-3">
                    <div className="w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center shrink-0">
                      <Check size={16} className="text-emerald-700" />
                    </div>
                    <div>
                      <h3 className="font-semibold">Analysis Complete</h3>
                      <p className="text-sm text-emerald-700/80">Found {suggestions.length} potential feature aggregations.</p>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    {suggestions.map((s, i) => (
                      <div key={i} className="bg-paper-light p-5 rounded-xl border border-ink-dark/10 shadow-sm transition-all hover:shadow-md">
                        <div className="flex flex-col md:flex-row md:items-center gap-4 mb-4">
                          <div className="flex-1">
                            <div className="flex flex-wrap gap-2">
                              {s.originalFeatures.map((f: string, j: number) => (
                                <span key={j} className="px-2.5 py-1 bg-rose-50 text-rose-700 border border-rose-200 rounded-md text-xs font-medium line-through">
                                  {f}
                                </span>
                              ))}
                            </div>
                          </div>
                          <div className="hidden md:flex w-8 h-8 rounded-full bg-paper-base items-center justify-center text-ink-dark/30 shrink-0">
                            ➔
                          </div>
                          <div className="flex-1">
                            <span className="px-3 py-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg text-sm font-bold inline-flex items-center gap-1.5 shadow-sm">
                              <Check size={14} />
                              {s.suggestedName}
                            </span>
                          </div>
                        </div>
                        <div className="bg-paper-base p-3.5 rounded-lg border border-ink-dark/5">
                          <p className="text-sm text-ink-dark/70 leading-relaxed">
                            <span className="font-semibold text-ink-dark block mb-1">Reasoning:</span>
                            {s.reasoning}
                          </p>
                        </div>
                      </div>
                    ))}
                    
                    {suggestions.length === 0 && (
                      <div className="text-center py-12 bg-paper-base rounded-xl border border-ink-dark/5">
                        <Check size={32} className="mx-auto text-emerald-500 mb-3" />
                        <h3 className="text-lg font-semibold text-ink-dark">No aggregations needed</h3>
                        <p className="text-sm text-ink-dark/60 mt-1">Your feature list is already well-organized and unique.</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
            
            <div className="p-6 sm:px-8 sm:py-6 border-t border-ink-dark/10 bg-paper-base flex items-center justify-between shrink-0">
              <p className="text-xs text-ink-dark/40 hidden sm:block">
                Review the suggestions before applying them.
              </p>
              <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
                <button 
                  onClick={onClose}
                  className="px-5 py-2.5 text-ink-dark/70 hover:text-ink-dark font-semibold transition-colors rounded-xl hover:bg-ink-dark/5"
                  disabled={isApplying || isAnalyzing}
                >
                  Cancel
                </button>
                {suggestions && suggestions.length > 0 && (
                  <button 
                    onClick={handleApply}
                    disabled={isApplying}
                    className="flex items-center gap-2 px-6 py-2.5 bg-emerald-600 text-white rounded-xl font-semibold hover:bg-emerald-700 transition-colors disabled:opacity-50 shadow-md hover:shadow-lg"
                  >
                    {isApplying ? (
                      <>
                        <Loader2 size={18} className="animate-spin" />
                        Applying...
                      </>
                    ) : (
                      <>
                        <Check size={18} />
                        Apply Aggregations
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
