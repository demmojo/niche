import React, { useState } from 'react';
import { X, ChevronRight, ChevronLeft, Download, Copy, Check, FileText, LayoutTemplate, Layers } from 'lucide-react';
import JSZip from 'jszip';
import { Tooltip } from './Tooltip';
import { DerivedInsight } from '../types';
import { MyProductData } from './MyProduct';

interface DocumentationWizardModalProps {
  isOpen: boolean;
  onClose: () => void;
  myProductData: MyProductData;
  insights: DerivedInsight[];
}

type FormatOption = 'onepager' | 'prd' | 'openspec';

export const DocumentationWizardModal: React.FC<DocumentationWizardModalProps> = ({
  isOpen,
  onClose,
  myProductData,
  insights,
}) => {
  const [step, setStep] = useState(1);
  const [selectedFeatures, setSelectedFeatures] = useState<string[]>(myProductData.features ? myProductData.features.map(f => f.name) : []);
  const [selectedNextSteps, setSelectedNextSteps] = useState<string[]>(myProductData.strategy ? myProductData.strategy.map(s => s.content) : []);
  const [selectedInsights, setSelectedInsights] = useState<string[]>([]);
  const [format, setFormat] = useState<FormatOption | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedDoc, setGeneratedDoc] = useState<string>('');
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleNext = () => setStep(prev => Math.min(prev + 1, 4));
  const handleBack = () => setStep(prev => Math.max(prev - 1, 1));

  const toggleFeature = (f: string) => setSelectedFeatures(prev => prev.includes(f) ? prev.filter(x => x !== f) : [...prev, f]);
  const toggleNextStep = (s: string) => setSelectedNextSteps(prev => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s]);
  const toggleInsight = (id: string) => setSelectedInsights(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);

  const generateDocument = () => {
    setIsGenerating(true);
    setStep(4);
    
    // Simulate generation/formatting
    setTimeout(() => {
      let doc = '';
      if (format === 'onepager') {
        doc = `# ${myProductData.name || 'Product'} One-Pager\n\n`;
        doc += `## Description\n${myProductData.description || 'N/A'}\n\n`;
        doc += `## Features\n${selectedFeatures.map(f => `- ${f}`).join('\n')}\n\n`;
        doc += `## Strategy\n${selectedNextSteps.map(s => `- ${s}`).join('\n')}\n\n`;
        const incInsights = insights.filter(i => selectedInsights.includes(i.id));
        if (incInsights.length > 0) {
          doc += `## Key Insights\n${incInsights.map(i => `- **${i.title}**: ${i.description}`).join('\n')}\n\n`;
        }
      } else if (format === 'prd') {
        doc = `# Product Requirements Document (PRD): ${myProductData.name}\n\n`;
        doc += `## 1. Objective\n${myProductData.description}\n\n`;
        doc += `## 2. Target Market\n${myProductData.targetRegions.join(', ')}\n\n`;
        doc += `## 3. Scope & Features\n${selectedFeatures.map(f => `### ${f}\n- Priority: High\n- Description: TBD`).join('\n\n')}\n\n`;
        doc += `## 4. Market Insights\n${insights.filter(i => selectedInsights.includes(i.id)).map(i => `- ${i.title}`).join('\n')}\n\n`;
        doc += `## 5. Next Steps\n${selectedNextSteps.map(s => `- ${s}`).join('\n')}\n\n`;
      } else {
        doc = `OpenSpec File Generation Preview...\n(This will be exported as a .zip file with separate Markdown files.)`;
      }
      setGeneratedDoc(doc);
      setIsGenerating(false);
    }, 1500);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(generatedDoc);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleExport = async () => {
    if (format === 'openspec') {
      const zip = new JSZip();
      
      // openspec.yaml
      zip.file('.openspec.yaml', `schema: spec-driven\ncreated: ${new Date().toISOString().split('T')[0]}\n`);
      
      // root markdown
      zip.file('README.md', `# ${myProductData.name}\n${myProductData.description}\n`);
      
      // features
      const featuresFolder = zip.folder('features');
      selectedFeatures.forEach((f, idx) => {
        featuresFolder?.file(`feature-${idx + 1}.md`, `# Feature: ${f}\n\nDetails pending.`);
      });
      
      // insights
      const insightsFolder = zip.folder('insights');
      const incInsights = insights.filter(i => selectedInsights.includes(i.id));
      incInsights.forEach((insight, idx) => {
        insightsFolder?.file(`insight-${idx + 1}.md`, `# ${insight.title}\n\n${insight.description}\n`);
      });

      const blob = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${myProductData.name || 'product'}-openspec.zip`;
      a.click();
      URL.revokeObjectURL(url);
    } else {
      const ext = format === 'onepager' ? 'md' : 'md';
      const blob = new Blob([generatedDoc], { type: 'text/markdown' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${myProductData.name || 'product'}-${format}.${ext}`;
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-paper-light rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden border border-ink-dark/10">
        
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-ink-dark/10 bg-paper-base">
          <div>
            <h2 className="text-xl font-bold font-serif text-ink-dark">Documentation Generator</h2>
            <p className="text-sm text-ink-dark/60 mt-1">Export high-level product details and insights into actionable deliverables.</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-ink-dark/5 rounded-full transition-colors">
            <X size={20} className="text-ink-dark/60" />
          </button>
        </div>

        {/* Wizard Progress */}
        <div className="flex border-b border-ink-dark/10 bg-paper-light">
          {['Features & Next Steps', 'Insights Selection', 'Format Selection', 'Review & Export'].map((label, i) => (
            <div key={i} className={`flex-1 py-3 text-center text-sm font-medium transition-colors ${step === i + 1 ? 'border-b-2 border-accent-teal text-accent-teal bg-accent-teal/5' : step > i + 1 ? 'text-ink-dark' : 'text-ink-dark/30'}`}>
              <span className="inline-block w-5 h-5 rounded-full bg-current text-paper-light text-xs leading-5 mr-2 opacity-90">{i + 1}</span>
              {label}
            </div>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 bg-paper-light">
          {step === 1 && (
            <div className="space-y-6">
              <h3 className="text-lg font-bold text-ink-dark">Select Features & Next Steps</h3>
              <p className="text-sm text-ink-dark/60">Choose which items from your product definition should be included in the documentation.</p>
              
              <div className="space-y-4">
                <div className="bg-paper-base rounded-xl p-4 border border-ink-dark/10">
                  <div className="flex justify-between items-center mb-3">
                    <h4 className="font-semibold flex items-center gap-2"><LayoutTemplate size={16} className="text-accent-purple"/> Features</h4>
                    <button onClick={() => setSelectedFeatures(selectedFeatures.length === myProductData.features.length ? [] : myProductData.features.map(f => f.name))} className="text-xs text-accent-teal hover:underline">Select All / None</button>
                  </div>
                  <div className="space-y-2">
                    {myProductData.features?.map((f, i) => (
                      <label key={i} className="flex items-start gap-3 cursor-pointer p-2 hover:bg-paper-light rounded-md">
                        <input type="checkbox" checked={selectedFeatures.includes(f.name)} onChange={() => toggleFeature(f.name)} className="mt-1 accent-accent-teal" />
                        <span className="text-sm">{f.name}</span>
                      </label>
                    ))}
                    {(!myProductData.features || myProductData.features.length === 0) && <p className="text-sm italic text-ink-dark/50">No features found.</p>}
                  </div>
                </div>

                <div className="bg-paper-base rounded-xl p-4 border border-ink-dark/10">
                  <div className="flex justify-between items-center mb-3">
                    <h4 className="font-semibold flex items-center gap-2"><Layers size={16} className="text-accent-coral"/> Strategy & Next Steps</h4>
                    <button onClick={() => setSelectedNextSteps(selectedNextSteps.length === myProductData.strategy.length ? [] : myProductData.strategy.map(s => s.content))} className="text-xs text-accent-teal hover:underline">Select All / None</button>
                  </div>
                  <div className="space-y-2">
                    {myProductData.strategy?.map((s, i) => (
                      <label key={i} className="flex items-start gap-3 cursor-pointer p-2 hover:bg-paper-light rounded-md">
                        <input type="checkbox" checked={selectedNextSteps.includes(s.content)} onChange={() => toggleNextStep(s.content)} className="mt-1 accent-accent-teal" />
                        <span className="text-sm">{s.content}</span>
                      </label>
                    ))}
                    {(!myProductData.strategy || myProductData.strategy.length === 0) && <p className="text-sm italic text-ink-dark/50">No strategy items found.</p>}
                  </div>
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6">
              <h3 className="text-lg font-bold text-ink-dark">Select Insights</h3>
              <p className="text-sm text-ink-dark/60">Enrich your documentation with AI-generated or manually added insights.</p>
              
              <div className="bg-paper-base rounded-xl p-4 border border-ink-dark/10">
                <div className="flex justify-between items-center mb-3">
                  <h4 className="font-semibold">Insights Library</h4>
                  <button onClick={() => setSelectedInsights(selectedInsights.length === insights.length ? [] : insights.map(i => i.id))} className="text-xs text-accent-teal hover:underline">Select All / None</button>
                </div>
                <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
                  {insights.map(insight => (
                    <label key={insight.id} className={`flex items-start gap-3 cursor-pointer p-3 rounded-lg border transition-colors ${selectedInsights.includes(insight.id) ? 'bg-paper-light border-accent-teal/50 shadow-sm' : 'bg-paper-light/50 border-ink-dark/10 hover:border-ink-dark/30'}`}>
                      <input type="checkbox" checked={selectedInsights.includes(insight.id)} onChange={() => toggleInsight(insight.id)} className="mt-1 accent-accent-teal" />
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-sm">{insight.title}</span>
                          <span className={`text-[10px] px-1.5 py-0.5 rounded-full uppercase tracking-wider ${
                            insight.category === 'opportunity' ? 'bg-accent-teal/10 text-accent-teal' :
                            insight.category === 'threat' ? 'bg-accent-coral/10 text-accent-coral' : 'bg-accent-purple/10 text-accent-purple'
                          }`}>{insight.category}</span>
                        </div>
                        <p className="text-xs text-ink-dark/70 mt-1 line-clamp-2">{insight.description}</p>
                      </div>
                    </label>
                  ))}
                  {insights.length === 0 && <p className="text-sm italic text-ink-dark/50 p-4 text-center">No insights found in the library.</p>}
                </div>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-6">
              <h3 className="text-lg font-bold text-ink-dark">Choose Document Format</h3>
              <p className="text-sm text-ink-dark/60">Select the type of deliverable you want to generate.</p>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                <button onClick={() => setFormat('onepager')} className={`p-5 rounded-xl border-2 text-left transition-all ${format === 'onepager' ? 'border-accent-teal bg-accent-teal/5 shadow-md scale-[1.02]' : 'border-ink-dark/10 hover:border-ink-dark/30 hover:bg-paper-base'}`}>
                  <FileText className={`w-8 h-8 mb-3 ${format === 'onepager' ? 'text-accent-teal' : 'text-ink-dark/50'}`} />
                  <h4 className="font-bold text-ink-dark mb-1">One-Pager</h4>
                  <p className="text-xs text-ink-dark/70 leading-relaxed">A concise, high-level overview ideal for executive summaries, pitch decks, or quick stakeholder updates.</p>
                </button>
                
                <button onClick={() => setFormat('prd')} className={`p-5 rounded-xl border-2 text-left transition-all ${format === 'prd' ? 'border-accent-teal bg-accent-teal/5 shadow-md scale-[1.02]' : 'border-ink-dark/10 hover:border-ink-dark/30 hover:bg-paper-base'}`}>
                  <LayoutTemplate className={`w-8 h-8 mb-3 ${format === 'prd' ? 'text-accent-teal' : 'text-ink-dark/50'}`} />
                  <h4 className="font-bold text-ink-dark mb-1">PRD</h4>
                  <p className="text-xs text-ink-dark/70 leading-relaxed">A detailed Product Requirements Document structured for engineering and product teams to begin implementation.</p>
                </button>
                
                <button onClick={() => setFormat('openspec')} className={`p-5 rounded-xl border-2 text-left transition-all ${format === 'openspec' ? 'border-accent-teal bg-accent-teal/5 shadow-md scale-[1.02]' : 'border-ink-dark/10 hover:border-ink-dark/30 hover:bg-paper-base'}`}>
                  <Layers className={`w-8 h-8 mb-3 ${format === 'openspec' ? 'text-accent-teal' : 'text-ink-dark/50'}`} />
                  <h4 className="font-bold text-ink-dark mb-1">OpenSpec Archive</h4>
                  <p className="text-xs text-ink-dark/70 leading-relaxed">A standard architectural package (.zip) with separated markdown files and schemas ready for AI agents or repos.</p>
                </button>
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-4 h-full flex flex-col">
              <h3 className="text-lg font-bold text-ink-dark">Review & Export</h3>
              
              {isGenerating ? (
                <div className="flex-1 flex flex-col items-center justify-center p-12">
                  <div className="w-12 h-12 border-4 border-ink-dark/10 border-t-accent-teal rounded-full animate-spin mb-4"></div>
                  <h4 className="font-semibold text-ink-dark">Generating Documentation...</h4>
                  <p className="text-sm text-ink-dark/60 mt-2 text-center max-w-sm">Compiling your product features and insights into the selected format.</p>
                </div>
              ) : (
                <>
                  <div className="flex-1 bg-white border border-ink-dark/20 rounded-xl p-6 overflow-y-auto shadow-inner relative font-mono text-sm whitespace-pre-wrap">
                    {generatedDoc}
                  </div>
                  
                  <div className="flex justify-end gap-3 pt-4 border-t border-ink-dark/10 mt-auto">
                    {format !== 'openspec' && (
                      <button onClick={handleCopy} className="flex items-center gap-2 px-4 py-2 border border-ink-dark/20 hover:bg-paper-base rounded-md font-medium text-sm transition-colors">
                        {copied ? <Check size={16} className="text-green-600" /> : <Copy size={16} />}
                        {copied ? 'Copied!' : 'Copy to Clipboard'}
                      </button>
                    )}
                    <button onClick={handleExport} className="flex items-center gap-2 px-4 py-2 bg-ink-dark text-paper-light hover:bg-black rounded-md font-medium text-sm transition-colors shadow-md">
                      <Download size={16} />
                      Export {format === 'openspec' ? 'Archive (.zip)' : 'File (.md)'}
                    </button>
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        {/* Footer Navigation */}
        <div className="p-4 border-t border-ink-dark/10 bg-paper-base flex justify-between items-center">
          <button 
            onClick={handleBack} 
            disabled={step === 1 || step === 4} 
            className={`flex items-center gap-1 px-4 py-2 rounded-md text-sm font-medium transition-colors ${step === 1 || step === 4 ? 'opacity-0 pointer-events-none' : 'text-ink-dark/70 hover:bg-ink-dark/10'}`}
          >
            <ChevronLeft size={16} /> Back
          </button>
          
          {step < 3 ? (
            <button onClick={handleNext} className="flex items-center gap-1 px-5 py-2 bg-accent-teal text-white hover:bg-accent-teal/90 rounded-md font-medium text-sm transition-colors shadow-sm">
              Next <ChevronRight size={16} />
            </button>
          ) : step === 3 ? (
            <button onClick={generateDocument} disabled={!format} className={`flex items-center gap-1 px-5 py-2 rounded-md font-medium text-sm transition-all shadow-sm ${format ? 'bg-accent-purple text-white hover:bg-accent-purple/90' : 'bg-ink-dark/10 text-ink-dark/40 cursor-not-allowed'}`}>
              Generate Document
            </button>
          ) : (
            <button onClick={onClose} className="px-5 py-2 border border-ink-dark/20 hover:bg-paper-light rounded-md text-sm font-medium transition-colors">
              Done
            </button>
          )}
        </div>

      </div>
    </div>
  );
};
