import React, { useState, useEffect } from 'react';
import { 
  X, Target, TableProperties, Archive, PieChart, Network, 
  LayoutDashboard, Newspaper, Activity, Settings as SettingsIcon, Zap, 
  RefreshCw, Sparkles, MousePointerClick, Combine, Wand2, 
  Upload, Link, Tag, MessageSquare, Plus, TrendingUp, 
  Sword, LineChart, Download, Move, Edit, FileJson, Key, Settings2,
  Lightbulb, CheckCircle2, ChevronRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface PageGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeTab: string;
  onDoNotShowAgain?: () => void;
}

interface GuideData {
  title: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  bgGlow: string;
  capabilities: { icon: React.ReactNode; title: string; desc: string }[];
  steps: string[];
  proTip: string;
}

const pageGuides: Record<string, GuideData> = {
  'dashboard': {
    title: 'Dashboard',
    description: 'Your command center. Get an instant read on the market landscape and spot immediate opportunities.',
    icon: <LayoutDashboard size={28} />,
    color: 'text-sky-500',
    bgGlow: 'bg-sky-500/20',
    capabilities: [
      { icon: <Target size={20} />, title: 'Market Context', desc: 'High-level summary of the current landscape.' },
      { icon: <Sparkles size={20} />, title: 'Strategic Insights', desc: 'Auto-generated gaps and emerging threats.' },
      { icon: <PieChart size={20} />, title: 'Competitor Landscape', desc: 'See who is dominating and who is vulnerable.' }
    ],
    steps: [
      'Review the high-level market summary.',
      'Check the latest strategic insights for actionable gaps.',
      'Use the Global Sync button to refresh all data.'
    ],
    proTip: 'Use the Global Sync button to ensure all your data is up-to-date before a major strategy session.'
  },
  'matrix': {
    title: 'Competitor Matrix',
    description: 'The battlefield. Compare features side-by-side to find where you can outmaneuver the competition.',
    icon: <TableProperties size={28} />,
    color: 'text-emerald-500',
    bgGlow: 'bg-emerald-500/20',
    capabilities: [
      { icon: <Combine size={20} />, title: 'AI Aggregation', desc: 'Merge similar features into unified capabilities.' },
      { icon: <Wand2 size={20} />, title: 'Feature Suggestions', desc: 'Get AI recommendations based on market gaps.' },
      { icon: <Sparkles size={20} />, title: 'User Story Generation', desc: 'Turn features into actionable Agile user stories.' }
    ],
    steps: [
      'Select competitors to compare side-by-side.',
      'Click "Aggregate Capabilities" to clean up the matrix.',
      'Expand a feature row to generate User Stories & Tasks.'
    ],
    proTip: 'Click "Suggest Feature" to let AI automatically recommend the next feature you should build based on market gaps.'
  },
  'rawdata': {
    title: 'Raw Data Library',
    description: 'The evidence room. Every insight is backed by raw data collected from the web.',
    icon: <Archive size={28} />,
    color: 'text-amber-500',
    bgGlow: 'bg-amber-500/20',
    capabilities: [
      { icon: <Upload size={20} />, title: 'Data Ingestion', desc: 'Upload CSV, JSON, or TXT files.' },
      { icon: <Tag size={20} />, title: 'Auto-Tagging', desc: 'Data is automatically categorized.' },
      { icon: <Link size={20} />, title: 'Source Tracking', desc: 'Verify the original context of any data point.' }
    ],
    steps: [
      'Upload your own research or scraped data.',
      'Filter by source type or company.',
      'Click source links to verify original context.'
    ],
    proTip: 'The AI engine uses this raw data to generate all insights. The better your data, the sharper your strategy.'
  },
  'reports': {
    title: 'Insight Library',
    description: 'Your strategy vault. Track, refine, and act on the most important market discoveries.',
    icon: <PieChart size={28} />,
    color: 'text-purple-500',
    bgGlow: 'bg-purple-500/20',
    capabilities: [
      { icon: <MessageSquare size={20} />, title: 'AI Brainstorming', desc: 'Chat with AI to flesh out raw ideas.' },
      { icon: <TrendingUp size={20} />, title: 'Impact Scoring', desc: 'Instantly see which insights matter most.' },
      { icon: <Plus size={20} />, title: 'Manual Entry', desc: 'Add your own observations.' }
    ],
    steps: [
      'Review auto-generated insights.',
      'Filter by Opportunity or Threat.',
      'Click Brainstorm to develop an execution plan.'
    ],
    proTip: 'Click the "Brainstorm" button on any insight to open a dedicated chat session focused entirely on that specific strategic angle.'
  },
  'market-analysis': {
    title: 'Market Analysis',
    description: 'The big picture. AI-generated deep dives into market trends and SWOT positioning.',
    icon: <Newspaper size={28} />,
    color: 'text-rose-500',
    bgGlow: 'bg-rose-500/20',
    capabilities: [
      { icon: <Sword size={20} />, title: 'Auto-SWOT', desc: 'Generates Strengths, Weaknesses, Opportunities, Threats.' },
      { icon: <LineChart size={20} />, title: 'Trend Prediction', desc: 'Forecasts market shifts based on recent data.' },
      { icon: <Download size={20} />, title: 'Executive Summaries', desc: 'Export reports for stakeholders.' }
    ],
    steps: [
      'Generate a fresh SWOT analysis.',
      'Review predicted market shifts.',
      'Export reports to share with your team.'
    ],
    proTip: 'Market trends are synthesized from your Raw Data Library. Upload recent news articles to keep predictions accurate.'
  },
  'mindmap': {
    title: 'Mindmap Explorer',
    description: 'The ecosystem view. Visually map out how competitors, features, and segments connect.',
    icon: <Network size={28} />,
    color: 'text-indigo-500',
    bgGlow: 'bg-indigo-500/20',
    capabilities: [
      { icon: <Move size={20} />, title: 'Interactive Nodes', desc: 'Drag and drop to organize your mental model.' },
      { icon: <Sparkles size={20} />, title: 'AI Insights', desc: 'Generate insights directly from specific nodes.' },
      { icon: <Edit size={20} />, title: 'Relationship Mapping', desc: 'Trace connections to understand complex ecosystems.' }
    ],
    steps: [
      'Pan and zoom to explore the market.',
      'Drag nodes to reorganize your mental model.',
      'Click nodes for detailed context.'
    ],
    proTip: 'Look for isolated nodes—these often represent untapped market opportunities or highly differentiated features.'
  },
  'actions': {
    title: 'Background Tasks & Sync',
    description: 'The engine room. Monitor system health, data syncs, and AI operations.',
    icon: <Activity size={28} />,
    color: 'text-orange-500',
    bgGlow: 'bg-orange-500/20',
    capabilities: [
      { icon: <Activity size={20} />, title: 'System Health', desc: 'See what is running, pending, or failed.' },
      { icon: <RefreshCw size={20} />, title: 'Sync Monitoring', desc: 'Ensure your data is fresh.' },
      { icon: <FileJson size={20} />, title: 'Detailed Logs', desc: 'View the raw JSON of any system event.' }
    ],
    steps: [
      'Check the current System State.',
      'Run Data Validation to ensure integrity.',
      'Review System Logs for troubleshooting.'
    ],
    proTip: 'Run the Data Pipeline after uploading new raw data to process it into structured insights.'
  },
  'settings': {
    title: 'Settings',
    description: 'Configure your workspace. Manage your API keys, and data preferences.',
    icon: <SettingsIcon size={28} />,
    color: 'text-slate-500',
    bgGlow: 'bg-slate-500/20',
    capabilities: [
      { icon: <Key size={20} />, title: 'API Configuration', desc: 'Manage your Gemini API key.' },
      { icon: <RefreshCw size={20} />, title: 'Real-time Collaboration', desc: 'Share your workspace link to collaborate.' },
      { icon: <Settings2 size={20} />, title: 'Data Management', desc: 'Clear local data or reset the application.' }
    ],
    steps: [
      'Copy the Workspace Link to share with cofounders.',
      'Ensure your Gemini API key is configured.',
      'Manage your local data as needed.'
    ],
    proTip: 'Anyone with your Workspace Link can access and edit the data in real-time, no login required.'
  }
};

export const PageGuideModal: React.FC<PageGuideModalProps> = ({ isOpen, onClose, activeTab, onDoNotShowAgain }) => {
  const [doNotShow, setDoNotShow] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setDoNotShow(false);
    }
  }, [isOpen, activeTab]);

  if (!isOpen) return null;

  const handleClose = () => {
    if (doNotShow && onDoNotShowAgain) {
      onDoNotShowAgain();
    }
    onClose();
  };

  const guide = pageGuides[activeTab] || pageGuides['dashboard'];

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-ink-dark/60 backdrop-blur-sm">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="bg-paper-light rounded-3xl shadow-2xl w-full max-w-4xl overflow-hidden border border-ink-dark/10 flex flex-col max-h-[90vh]"
        >
          {/* Beautiful Hero Section */}
          <div className="relative bg-ink-dark text-white p-8 sm:p-10 overflow-hidden shrink-0">
             <div className={`absolute top-0 right-0 w-96 h-96 ${guide.bgGlow} rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 opacity-60`} />
             <div className="absolute bottom-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />
             
             <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center gap-6">
               <div className={`p-5 bg-white/10 rounded-2xl ${guide.color} backdrop-blur-md border border-white/10 shadow-2xl`}>
                 {guide.icon}
               </div>
               <div>
                 <div className="flex items-center gap-3 mb-2">
                   <span className="px-3 py-1 bg-white/10 rounded-full text-[10px] font-bold uppercase tracking-widest text-white/80 border border-white/10">
                     Module Guide
                   </span>
                 </div>
                 <h2 className="text-3xl sm:text-4xl font-serif font-bold mb-3 tracking-tight">{guide.title}</h2>
                 <p className="text-white/80 text-base sm:text-lg max-w-2xl leading-relaxed font-light">{guide.description}</p>
               </div>
             </div>
             
             <button 
              onClick={handleClose}
              className="absolute top-6 right-6 p-2 text-white/50 hover:text-white hover:bg-white/10 rounded-full transition-colors z-20"
            >
              <X size={24} />
            </button>
          </div>
          
          {/* Content Section */}
          <div className="p-8 sm:p-10 overflow-y-auto bg-paper-light flex-1">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
              
              {/* Left Column: Capabilities */}
              <div className="lg:col-span-7 space-y-6">
                <h3 className="text-sm font-bold uppercase tracking-widest text-ink-dark/40 flex items-center gap-2">
                  <Zap size={16} className="text-ochre" /> Core Capabilities
                </h3>
                <div className="grid gap-4">
                  {guide.capabilities.map((cap, i) => (
                    <div key={i} className="flex items-start gap-4 p-5 rounded-2xl bg-white border border-ink-dark/5 shadow-sm hover:shadow-md transition-all group">
                      <div className={`p-3 rounded-xl bg-paper-base ${guide.color} shrink-0 group-hover:scale-110 transition-transform duration-300`}>
                        {cap.icon}
                      </div>
                      <div>
                        <h4 className="font-bold text-ink-dark text-base mb-1">{cap.title}</h4>
                        <p className="text-sm text-ink-dark/60 leading-relaxed">{cap.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Right Column: Quick Start & Pro Tip */}
              <div className="lg:col-span-5 flex flex-col gap-8">
                {/* Quick Start */}
                <div className="space-y-6">
                  <h3 className="text-sm font-bold uppercase tracking-widest text-ink-dark/40 flex items-center gap-2">
                    <Target size={16} className="text-emerald-500" /> Quick Start
                  </h3>
                  <div className="space-y-4">
                    {guide.steps.map((step, i) => (
                      <div key={i} className="flex items-start gap-4">
                        <div className="flex items-center justify-center w-6 h-6 rounded-full bg-ink-dark text-white text-xs font-bold shrink-0 mt-0.5">
                          {i + 1}
                        </div>
                        <p className="text-ink-dark/80 text-sm leading-relaxed pt-0.5">{step}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Pro Tip */}
                <div className="mt-auto">
                  <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-ochre/10 to-transparent border border-ochre/20 p-6">
                    <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none">
                      <Lightbulb size={64} />
                    </div>
                    <h4 className="flex items-center gap-2 font-bold text-ochre-dark mb-2">
                      <Lightbulb size={18} /> Pro Tip
                    </h4>
                    <p className="text-sm text-ink-dark/80 leading-relaxed relative z-10">
                      {guide.proTip}
                    </p>
                  </div>
                </div>
              </div>

            </div>
          </div>
          
          {/* Footer */}
          <div className="p-6 sm:px-10 border-t border-ink-dark/10 bg-white flex flex-col sm:flex-row items-center justify-between gap-4 shrink-0">
            <label className="flex items-center gap-3 cursor-pointer group">
              <div className="relative flex items-center justify-center w-5 h-5 rounded border border-ink-dark/30 group-hover:border-ink-dark transition-colors bg-paper-light">
                <input 
                  type="checkbox" 
                  checked={doNotShow}
                  onChange={(e) => setDoNotShow(e.target.checked)}
                  className="absolute opacity-0 cursor-pointer w-full h-full"
                />
                {doNotShow && <CheckCircle2 size={14} className="text-ink-dark" />}
              </div>
              <span className="text-sm text-ink-dark/60 group-hover:text-ink-dark transition-colors font-medium">
                Don't show this guide again
              </span>
            </label>
            <button 
              onClick={handleClose}
              className="w-full sm:w-auto px-8 py-3.5 bg-ink-dark text-white rounded-xl font-medium hover:bg-black transition-all shadow-lg shadow-ink-dark/20 flex items-center justify-center gap-2 group"
            >
              Get Started
              <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
