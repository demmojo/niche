import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Upload, FileText, Loader2, Database, FileJson, FileCode2, FileSpreadsheet } from 'lucide-react';
import { Tooltip } from './Tooltip';
import { Type } from '@google/genai';
import { withKeyRotation } from '../utils/geminiClient';

interface UploadDataModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDataAnalyzed: (newSources: any[], newInsights: any[]) => void;
  competitors: any[];
}

export const UploadDataModal: React.FC<UploadDataModalProps> = ({ isOpen, onClose, onDataAnalyzed, competitors }) => {
  const [file, setFile] = useState<File | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFile(e.dataTransfer.files[0]);
    }
  };

  const handleAnalyze = async () => {
    if (!file) return;
    setIsAnalyzing(true);
    try {
      const text = await file.text();
      
      const prompt = `You are a market intelligence analyst. Analyze the following raw data uploaded by the user.
      
Data Content:
${text.substring(0, 15000)}

Existing Competitors:
${competitors.map(c => c.name).join(', ')}

Extract raw data points and derive strategic insights from this text.
Return the result as a JSON object with two arrays: "newSources" and "newInsights".

"newSources" should be an array of objects matching this structure:
{
  "competitorId": "ID of the competitor this relates to (use existing or 'general')",
  "type": "website", "api", "github", "screenshot", "linkedin", "crunchbase", or "news",
  "sourceUrl": "The filename or inferred URL",
  "excerpt": "A relevant quote or summary of the data point",
  "tags": ["tag1", "tag2"],
  "confidenceLevel": "High", "Medium", or "Low"
}

"newInsights" should be an array of objects matching this structure:
{
  "title": "Short, punchy title",
  "description": "Detailed explanation of the insight",
  "category": "Pricing", "Feature Gap", "Market Shift", "UX/UI", or "Integration",
  "impact": "critical", "high", "medium", or "low",
  "actionableSteps": ["Step 1", "Step 2"]
}
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
                newSources: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      competitorId: { type: Type.STRING },
                      type: { type: Type.STRING },
                      sourceUrl: { type: Type.STRING },
                      excerpt: { type: Type.STRING },
                      tags: { type: Type.ARRAY, items: { type: Type.STRING } },
                      confidenceLevel: { type: Type.STRING }
                    },
                    required: ["type", "excerpt"]
                  }
                },
                newInsights: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      title: { type: Type.STRING },
                      description: { type: Type.STRING },
                      category: { type: Type.STRING },
                      impact: { type: Type.STRING },
                      actionableSteps: { type: Type.ARRAY, items: { type: Type.STRING } }
                    },
                    required: ["title", "description", "category", "impact"]
                  }
                }
              }
            }
          }
        });
      });
      
      const result = JSON.parse(response.text || '{}');
      
      const sources = (result.newSources || []).map((s: any) => ({
        ...s,
        id: 'src-' + Date.now() + Math.random().toString(36).substr(2, 9),
        timestamp: new Date().toISOString(),
        isDeduced: true,
        source: 'Human',
        linkedInsightIds: []
      }));
      
      const insights = (result.newInsights || []).map((i: any) => ({
        ...i,
        id: 'ins-' + Date.now() + Math.random().toString(36).substr(2, 9),
        timestamp: new Date().toISOString(),
        sourceIds: [],
        source: 'AI'
      }));
      
      onDataAnalyzed(sources, insights);
      onClose();
    } catch (error) {
      console.error('Error analyzing file:', error);
      alert('Failed to analyze file. Please try again.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const getFileIcon = (filename: string) => {
    if (filename.endsWith('.json')) return <FileJson size={48} className="text-sky" />;
    if (filename.endsWith('.csv')) return <FileSpreadsheet size={48} className="text-emerald-500" />;
    if (filename.endsWith('.md')) return <FileCode2 size={48} className="text-purple-500" />;
    return <FileText size={48} className="text-ink-dark/40" />;
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
            className="bg-paper-light rounded-2xl shadow-2xl w-full max-w-xl overflow-hidden border border-ink-dark/20 flex flex-col"
          >
            {/* Header */}
            <div className="relative p-6 sm:p-8 border-b border-ink-dark/10 bg-gradient-to-br from-paper-base to-paper-light overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-sky/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none" />
              <div className="relative z-10 flex items-start justify-between">
                <div>
                  <div className="w-12 h-12 rounded-xl bg-white border border-ink-dark/10 flex items-center justify-center shadow-sm mb-4">
                    <Database size={24} className="text-sky" />
                  </div>
                  <h2 className="text-2xl font-bold text-ink-dark tracking-tight">
                    Import Raw Data
                  </h2>
                  <p className="text-ink-dark/60 mt-1 text-sm">
                    Upload competitor research, pricing tables, or market reports. Our AI will automatically extract insights and data points.
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
            
            {/* Body */}
            <div className="p-6 sm:p-8 bg-white">
              <div 
                className={`relative border-2 border-dashed rounded-2xl p-10 text-center transition-all duration-200 cursor-pointer overflow-hidden
                  ${dragActive 
                    ? 'border-sky bg-sky/5 scale-[1.02]' 
                    : file 
                      ? 'border-emerald-500/50 bg-emerald-50/50' 
                      : 'border-ink-dark/20 hover:border-ink-dark/40 hover:bg-paper-base'
                  }
                `}
                onClick={() => fileInputRef.current?.click()}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
              >
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleFileChange} 
                  className="hidden" 
                  accept=".txt,.csv,.json,.md"
                />
                
                <div className="relative z-10 flex flex-col items-center">
                  {file ? (
                    <motion.div 
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className="flex flex-col items-center"
                    >
                      <div className="w-20 h-20 bg-white rounded-2xl shadow-sm border border-ink-dark/10 flex items-center justify-center mb-4">
                        {getFileIcon(file.name)}
                      </div>
                      <p className="text-ink-dark font-semibold text-lg">{file.name}</p>
                      <p className="text-sm text-ink-dark/50 font-medium mt-1">
                        {(file.size / 1024).toFixed(1)} KB • Ready to analyze
                      </p>
                      <button 
                        onClick={(e) => { e.stopPropagation(); setFile(null); }}
                        className="mt-4 text-xs font-semibold text-rose-500 hover:text-rose-600 uppercase tracking-wider"
                      >
                        Remove File
                      </button>
                    </motion.div>
                  ) : (
                    <motion.div 
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="flex flex-col items-center"
                    >
                      <div className="w-20 h-20 bg-white rounded-2xl shadow-sm border border-ink-dark/10 flex items-center justify-center mb-4 text-ink-dark/30 group-hover:text-sky transition-colors">
                        <Upload size={32} />
                      </div>
                      <p className="text-ink-dark font-semibold text-lg">
                        Click to upload or drag and drop
                      </p>
                      <p className="text-sm text-ink-dark/50 mt-2 max-w-xs mx-auto">
                        Supported formats: TXT, CSV, JSON, Markdown (max 5MB)
                      </p>
                    </motion.div>
                  )}
                </div>
              </div>
            </div>
            
            {/* Footer */}
            <div className="p-6 sm:px-8 sm:py-6 border-t border-ink-dark/10 bg-paper-base flex items-center justify-between">
              <p className="text-xs text-ink-dark/40 hidden sm:block">
                Data is processed securely via Gemini AI.
              </p>
              <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
                <button 
                  onClick={onClose}
                  className="px-5 py-2.5 text-ink-dark/70 hover:text-ink-dark font-semibold transition-colors rounded-xl hover:bg-ink-dark/5"
                  disabled={isAnalyzing}
                >
                  Cancel
                </button>
                <button 
                  onClick={handleAnalyze}
                  disabled={!file || isAnalyzing}
                  className="relative flex items-center justify-center gap-2 px-6 py-2.5 bg-ink-dark text-white rounded-xl font-semibold hover:bg-black transition-all disabled:opacity-50 disabled:hover:bg-ink-dark shadow-md hover:shadow-lg overflow-hidden group min-w-[160px]"
                >
                  {isAnalyzing ? (
                    <>
                      <Loader2 size={18} className="animate-spin" />
                      <span>Processing...</span>
                    </>
                  ) : (
                    <>
                      <Upload size={18} className="group-hover:-translate-y-1 transition-transform" />
                      <span>Analyze Data</span>
                    </>
                  )}
                  {/* Shine effect */}
                  {!isAnalyzing && file && (
                    <div className="absolute inset-0 -translate-x-full group-hover:animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-white/20 to-transparent" />
                  )}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
