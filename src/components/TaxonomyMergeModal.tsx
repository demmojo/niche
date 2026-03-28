import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, Combine, Loader2, Check } from "lucide-react";
import { Tooltip } from "./Tooltip";
import { useTaxonomySync } from "../hooks/useTaxonomySync";

interface TaxonomyMergeModalProps {
  isOpen: boolean;
  onClose: () => void;
  competitors: any[];
}

/**
 *
 */
export const TaxonomyMergeModal: React.FC<TaxonomyMergeModalProps> = ({
  isOpen,
  onClose,
  competitors,
}) => {
  const { displayTaxonomy, evaluationStatus, mergeFeatures } = useTaxonomySync();
  const [selectedFeatures, setSelectedFeatures] = useState<Set<string>>(new Set());
  const [customName, setCustomName] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  const allUniqueFeatures = useMemo(() => {
    const features = new Set<string>();
    competitors.forEach(c => {
      (c.coreFeatures || []).forEach((f: string) => features.add(f));
    });
    return Array.from(features).sort();
  }, [competitors]);

  const filteredFeatures = useMemo(() => {
    if (!searchTerm) return allUniqueFeatures;
    const lower = searchTerm.toLowerCase();
    return allUniqueFeatures.filter(f => f.toLowerCase().includes(lower));
  }, [allUniqueFeatures, searchTerm]);

  /**
   *
   */
  const handleToggleFeature = (feature: string) => {
    setSelectedFeatures(prev => {
      const next = new Set(prev);
      if (next.has(feature)) next.delete(feature);
      else next.add(feature);
      return next;
    });
  };

  /**
   *
   */
  const handleMerge = () => {
    if (selectedFeatures.size < 2 || !customName.trim()) return;
    
    // Convert to array
    const featuresToMerge = Array.from(selectedFeatures);
    
    // Call the optimistic hook (this throws it into the transaction)
    mergeFeatures(featuresToMerge, customName.trim());
    
    // Reset and close
    setSelectedFeatures(new Set());
    setCustomName("");
    onClose();
  };

  if (!isOpen) return null;

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
              <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none" />
              <div className="relative z-10 flex items-start justify-between">
                <div>
                  <div className="w-12 h-12 rounded-xl bg-white border border-ink-dark/10 flex items-center justify-center shadow-sm mb-4">
                    <Combine size={24} className="text-indigo-600" />
                  </div>
                  <h2 className="text-2xl font-bold text-ink-dark tracking-tight">
                    Merge Taxonomy Features
                  </h2>
                  <p className="text-ink-dark/60 mt-1 text-sm">
                    Manually select functionally identical features across competitors to merge them into a single, clean capability.
                  </p>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 text-ink-dark/40 hover:text-ink-dark hover:bg-white rounded-full transition-colors"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            <div className="p-6 sm:p-8 overflow-y-auto flex-1 bg-white space-y-6">
              
              <div className="space-y-4">
                <h3 className="font-semibold text-ink-dark">1. Select Features to Merge ({selectedFeatures.size} selected)</h3>
                <input 
                  type="text" 
                  placeholder="Search features..." 
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="w-full p-2 border border-ink-dark/20 rounded-lg text-sm bg-paper-base"
                />
                
                <div className="border border-ink-dark/10 rounded-xl max-h-64 overflow-y-auto bg-paper-base/50 p-2 grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {filteredFeatures.map(f => {
                    const isSelected = selectedFeatures.has(f);
                    return (
                      <div 
                        key={f}
                        onClick={() => handleToggleFeature(f)}
                        className={`p-3 rounded-lg border text-sm cursor-pointer transition-colors flex items-start gap-3
                          ${isSelected ? 'bg-indigo-50 border-indigo-200 text-indigo-900 shadow-sm' : 'bg-white border-ink-dark/10 text-ink-dark hover:border-ink-dark/30'}`}
                      >
                        <div className={`mt-0.5 flex-shrink-0 w-4 h-4 rounded border flex items-center justify-center
                          ${isSelected ? 'bg-indigo-600 border-indigo-600' : 'bg-white border-ink-dark/30'}`}>
                          {isSelected && <Check size={12} className="text-white" />}
                        </div>
                        <span className="leading-tight">{f}</span>
                      </div>
                    );
                  })}
                  {filteredFeatures.length === 0 && (
                    <div className="col-span-2 p-4 text-center text-sm text-ink-dark/50">
                      No features found.
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <h3 className="font-semibold text-ink-dark">2. Name the New Merged Capability</h3>
                <input 
                  type="text" 
                  placeholder="e.g. Automated Email Sequences" 
                  value={customName}
                  onChange={e => setCustomName(e.target.value)}
                  className="w-full p-3 border border-ink-dark/20 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-shadow"
                />
              </div>

              {evaluationStatus === 'evaluating' && (
                <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-3">
                  <Loader2 size={18} className="text-amber-600 animate-spin shrink-0 mt-0.5" />
                  <p className="text-sm text-amber-800">
                    A previous merge is currently being evaluated by the AI Validation Pipeline. You can queue more, but UI updates might be delayed if the network is busy.
                  </p>
                </div>
              )}
            </div>

            <div className="p-6 sm:px-8 sm:py-6 border-t border-ink-dark/10 bg-paper-base flex items-center justify-end shrink-0 gap-3">
              <button
                onClick={onClose}
                className="px-5 py-2.5 text-ink-dark/70 hover:text-ink-dark font-semibold transition-colors rounded-xl hover:bg-ink-dark/5"
              >
                Cancel
              </button>
              <button
                onClick={handleMerge}
                disabled={selectedFeatures.size < 2 || !customName.trim()}
                className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 transition-colors disabled:opacity-50 shadow-md hover:shadow-lg"
              >
                Merge Features
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
