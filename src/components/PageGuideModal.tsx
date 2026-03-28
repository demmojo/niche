import React, { useState, useEffect } from "react";
import {
  X,
  Target,
  TableProperties,
  Archive,
  PieChart,
  Network,
  LayoutDashboard,
  Newspaper,
  Activity,
  Settings as SettingsIcon,
  Zap,
  RefreshCw,
  Sparkles,
  MousePointerClick,
  Combine,
  Wand2,
  Upload,
  Link,
  Tag,
  MessageSquare,
  Plus,
  TrendingUp,
  Sword,
  LineChart,
  Download,
  Move,
  Edit,
  FileJson,
  Key,
  Settings2,
  Lightbulb,
  CheckCircle2,
  ChevronRight,
  Users,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

import { dictionary, tMessage } from "../content/dictionary";

interface PageGuideModalProps {
  /** Controls visibility of the guide modal. */
  isOpen: boolean;

  /** Callback triggered when the modal is closed. */
  onClose: () => void;

  /** The id for the guide configuration to render (e.g. `'dashboard'`, `'matrix'`). */
  activeTab: string;

  /** Optional callback fired if the user checks the "Don't show again" checkbox before closing. */
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

const getPageGuides = (): Record<string, GuideData> => ({
  dashboard: {
    title: tMessage(dictionary.dashboard.guide.title),
    description: tMessage(dictionary.dashboard.guide.description),
    icon: <LayoutDashboard size={28} />,
    color: "text-sky-500",
    bgGlow: "bg-sky-500/20",
    capabilities: [
      {
        icon: <Target size={20} />,
        title: tMessage(
          dictionary.dashboard.guide.capabilities.marketContext.title,
        ),
        desc: tMessage(
          dictionary.dashboard.guide.capabilities.marketContext.desc,
        ),
      },
      {
        icon: <Sparkles size={20} />,
        title: tMessage(
          dictionary.dashboard.guide.capabilities.strategicInsights.title,
        ),
        desc: tMessage(
          dictionary.dashboard.guide.capabilities.strategicInsights.desc,
        ),
      },
      {
        icon: <PieChart size={20} />,
        title: tMessage(
          dictionary.dashboard.guide.capabilities.competitorLandscape.title,
        ),
        desc: tMessage(
          dictionary.dashboard.guide.capabilities.competitorLandscape.desc,
        ),
      },
    ],
    steps: [
      tMessage(dictionary.dashboard.guide.steps.step1),
      tMessage(dictionary.dashboard.guide.steps.step2),
      tMessage(dictionary.dashboard.guide.steps.step3),
    ],
    proTip: tMessage(dictionary.dashboard.guide.proTip),
  },
  "my-product": {
    title: tMessage(dictionary.myProduct.guide.title),
    description: tMessage(dictionary.myProduct.guide.description),
    icon: <Target size={28} />,
    color: "text-indigo-500",
    bgGlow: "bg-indigo-500/20",
    capabilities: [
      {
        icon: <CheckCircle2 size={20} />,
        title: tMessage(
          dictionary.myProduct.guide.capabilities.featureTracking.title,
        ),
        desc: tMessage(
          dictionary.myProduct.guide.capabilities.featureTracking.desc,
        ),
      },
      {
        icon: <Sparkles size={20} />,
        title: tMessage(
          dictionary.myProduct.guide.capabilities.aiStrategy.title,
        ),
        desc: tMessage(dictionary.myProduct.guide.capabilities.aiStrategy.desc),
      },
      {
        icon: <Download size={20} />,
        title: tMessage(
          dictionary.myProduct.guide.capabilities.openSpecExport.title,
        ),
        desc: tMessage(
          dictionary.myProduct.guide.capabilities.openSpecExport.desc,
        ),
      },
    ],
    steps: [
      tMessage(dictionary.myProduct.guide.steps.step1),
      tMessage(dictionary.myProduct.guide.steps.step2),
      tMessage(dictionary.myProduct.guide.steps.step3),
    ],
    proTip: tMessage(dictionary.myProduct.guide.proTip),
  },
  matrix: {
    title: tMessage(dictionary.matrix.guide.title),
    description: tMessage(dictionary.matrix.guide.description),
    icon: <TableProperties size={28} />,
    color: "text-emerald-500",
    bgGlow: "bg-emerald-500/20",
    capabilities: [
      {
        icon: <Combine size={20} />,
        title: tMessage(
          dictionary.matrix.guide.capabilities.aiAggregation.title,
        ),
        desc: tMessage(dictionary.matrix.guide.capabilities.aiAggregation.desc),
      },
      {
        icon: <Wand2 size={20} />,
        title: tMessage(
          dictionary.matrix.guide.capabilities.featureSuggestions.title,
        ),
        desc: tMessage(
          dictionary.matrix.guide.capabilities.featureSuggestions.desc,
        ),
      },
      {
        icon: <Sparkles size={20} />,
        title: tMessage(
          dictionary.matrix.guide.capabilities.userStoryGeneration.title,
        ),
        desc: tMessage(
          dictionary.matrix.guide.capabilities.userStoryGeneration.desc,
        ),
      },
    ],
    steps: [
      tMessage(dictionary.matrix.guide.steps.step1),
      tMessage(dictionary.matrix.guide.steps.step2),
      tMessage(dictionary.matrix.guide.steps.step3),
    ],
    proTip: tMessage(dictionary.matrix.guide.proTip),
  },
  rawdata: {
    title: tMessage(dictionary.rawData.guide.title),
    description: tMessage(dictionary.rawData.guide.description),
    icon: <Archive size={28} />,
    color: "text-amber-500",
    bgGlow: "bg-amber-500/20",
    capabilities: [
      {
        icon: <Upload size={20} />,
        title: tMessage(
          dictionary.rawData.guide.capabilities.dataIngestion.title,
        ),
        desc: tMessage(
          dictionary.rawData.guide.capabilities.dataIngestion.desc,
        ),
      },
      {
        icon: <Download size={20} />,
        title: tMessage(dictionary.rawData.guide.capabilities.dataExport.title),
        desc: tMessage(dictionary.rawData.guide.capabilities.dataExport.desc),
      },
      {
        icon: <Link size={20} />,
        title: tMessage(
          dictionary.rawData.guide.capabilities.sourceTracking.title,
        ),
        desc: tMessage(
          dictionary.rawData.guide.capabilities.sourceTracking.desc,
        ),
      },
    ],
    steps: [
      tMessage(dictionary.rawData.guide.steps.step1),
      tMessage(dictionary.rawData.guide.steps.step2),
      tMessage(dictionary.rawData.guide.steps.step3),
    ],
    proTip: tMessage(dictionary.rawData.guide.proTip),
  },
  reports: {
    title: tMessage(dictionary.reports.guide.title),
    description: tMessage(dictionary.reports.guide.description),
    icon: <PieChart size={28} />,
    color: "text-purple-500",
    bgGlow: "bg-purple-500/20",
    capabilities: [
      {
        icon: <MessageSquare size={20} />,
        title: tMessage(
          dictionary.reports.guide.capabilities.aiBrainstorming.title,
        ),
        desc: tMessage(
          dictionary.reports.guide.capabilities.aiBrainstorming.desc,
        ),
      },
      {
        icon: <TrendingUp size={20} />,
        title: tMessage(
          dictionary.reports.guide.capabilities.impactScoring.title,
        ),
        desc: tMessage(
          dictionary.reports.guide.capabilities.impactScoring.desc,
        ),
      },
      {
        icon: <Download size={20} />,
        title: tMessage(dictionary.reports.guide.capabilities.dataExport.title),
        desc: tMessage(dictionary.reports.guide.capabilities.dataExport.desc),
      },
    ],
    steps: [
      tMessage(dictionary.reports.guide.steps.step1),
      tMessage(dictionary.reports.guide.steps.step2),
      tMessage(dictionary.reports.guide.steps.step3),
    ],
    proTip: tMessage(dictionary.reports.guide.proTip),
  },
  "market-analysis": {
    title: tMessage(dictionary.marketAnalysis.guide.title),
    description: tMessage(dictionary.marketAnalysis.guide.description),
    icon: <Newspaper size={28} />,
    color: "text-rose-500",
    bgGlow: "bg-rose-500/20",
    capabilities: [
      {
        icon: <Sword size={20} />,
        title: tMessage(
          dictionary.marketAnalysis.guide.capabilities.autoSwot.title,
        ),
        desc: tMessage(
          dictionary.marketAnalysis.guide.capabilities.autoSwot.desc,
        ),
      },
      {
        icon: <TableProperties size={20} />,
        title: tMessage(
          dictionary.marketAnalysis.guide.capabilities.dataGrid.title,
        ),
        desc: tMessage(
          dictionary.marketAnalysis.guide.capabilities.dataGrid.desc,
        ),
      },
      {
        icon: <MessageSquare size={20} />,
        title: tMessage(
          dictionary.marketAnalysis.guide.capabilities.aiChat.title,
        ),
        desc: tMessage(
          dictionary.marketAnalysis.guide.capabilities.aiChat.desc,
        ),
      },
    ],
    steps: [
      tMessage(dictionary.marketAnalysis.guide.steps.step1),
      tMessage(dictionary.marketAnalysis.guide.steps.step2),
      tMessage(dictionary.marketAnalysis.guide.steps.step3),
    ],
    proTip: tMessage(dictionary.marketAnalysis.guide.proTip),
  },
  mindmap: {
    title: tMessage(dictionary.mindmap.guide.title),
    description: tMessage(dictionary.mindmap.guide.description),
    icon: <Network size={28} />,
    color: "text-indigo-500",
    bgGlow: "bg-indigo-500/20",
    capabilities: [
      {
        icon: <Move size={20} />,
        title: tMessage(
          dictionary.mindmap.guide.capabilities.interactiveNodes.title,
        ),
        desc: tMessage(
          dictionary.mindmap.guide.capabilities.interactiveNodes.desc,
        ),
      },
      {
        icon: <Sparkles size={20} />,
        title: tMessage(dictionary.mindmap.guide.capabilities.aiInsights.title),
        desc: tMessage(dictionary.mindmap.guide.capabilities.aiInsights.desc),
      },
      {
        icon: <Edit size={20} />,
        title: tMessage(
          dictionary.mindmap.guide.capabilities.relationshipMapping.title,
        ),
        desc: tMessage(
          dictionary.mindmap.guide.capabilities.relationshipMapping.desc,
        ),
      },
    ],
    steps: [
      tMessage(dictionary.mindmap.guide.steps.step1),
      tMessage(dictionary.mindmap.guide.steps.step2),
      tMessage(dictionary.mindmap.guide.steps.step3),
    ],
    proTip: tMessage(dictionary.mindmap.guide.proTip),
  },
  actions: {
    title: tMessage(dictionary.actions.guide.title),
    description: tMessage(dictionary.actions.guide.description),
    icon: <Activity size={28} />,
    color: "text-orange-500",
    bgGlow: "bg-orange-500/20",
    capabilities: [
      {
        icon: <Activity size={20} />,
        title: tMessage(
          dictionary.actions.guide.capabilities.systemHealth.title,
        ),
        desc: tMessage(dictionary.actions.guide.capabilities.systemHealth.desc),
      },
      {
        icon: <CheckCircle2 size={20} />,
        title: tMessage(
          dictionary.actions.guide.capabilities.globalProgress.title,
        ),
        desc: tMessage(
          dictionary.actions.guide.capabilities.globalProgress.desc,
        ),
      },
      {
        icon: <FileJson size={20} />,
        title: tMessage(
          dictionary.actions.guide.capabilities.detailedLogs.title,
        ),
        desc: tMessage(dictionary.actions.guide.capabilities.detailedLogs.desc),
      },
    ],
    steps: [
      tMessage(dictionary.actions.guide.steps.step1),
      tMessage(dictionary.actions.guide.steps.step2),
      tMessage(dictionary.actions.guide.steps.step3),
    ],
    proTip: tMessage(dictionary.actions.guide.proTip),
  },
  templates: {
    title: "Analytical Template System",
    description:
      "Launch specialized engines for presenting data or performing generative strategic analysis.",
    icon: <LayoutDashboard size={28} />,
    color: "text-cyan-500",
    bgGlow: "bg-cyan-500/20",
    capabilities: [
      {
        icon: <LayoutDashboard size={20} />,
        title: "Presentation Dashboards",
        desc: "Read-optimized, high-density visual dashboards for executive overviews.",
      },
      {
        icon: <Combine size={20} />,
        title: "Strategy Workspaces",
        desc: "Write-optimized, generative workspaces for SWOT and Lean Canvas analysis.",
      },
      {
        icon: <Wand2 size={20} />,
        title: "Generative Pre-fill",
        desc: "AI automatically pre-fills strategy templates with known market data.",
      },
    ],
    steps: [
      "Select a template category from the gallery.",
      "Explore high-level KPIs in Presentation mode.",
      "Use Strategy mode to brainstorm and auto-save strategic inputs.",
    ],
    proTip:
      "Use the AI Strategy Copilot in the left pane of Strategy templates to request real-time market insights while you fill out your canvas.",
  },
  settings: {
    title: tMessage(dictionary.settings.guide.title),
    description: tMessage(dictionary.settings.guide.description),
    icon: <SettingsIcon size={28} />,
    color: "text-slate-500",
    bgGlow: "bg-slate-500/20",
    capabilities: [
      {
        icon: <Users size={20} />,
        title: tMessage(
          dictionary.settings.guide.capabilities.teamCollaboration.title,
        ),
        desc: tMessage(
          dictionary.settings.guide.capabilities.teamCollaboration.desc,
        ),
      },
      {
        icon: <Key size={20} />,
        title: tMessage(
          dictionary.settings.guide.capabilities.apiConfiguration.title,
        ),
        desc: tMessage(
          dictionary.settings.guide.capabilities.apiConfiguration.desc,
        ),
      },
      {
        icon: <Activity size={20} />,
        title: tMessage(
          dictionary.settings.guide.capabilities.apiUsageLimits.title,
        ),
        desc: tMessage(
          dictionary.settings.guide.capabilities.apiUsageLimits.desc,
        ),
      },
    ],
    steps: [
      tMessage(dictionary.settings.guide.steps.step1),
      tMessage(dictionary.settings.guide.steps.step2),
      tMessage(dictionary.settings.guide.steps.step3),
    ],
    proTip: tMessage(dictionary.settings.guide.proTip),
  },
  support: {
    title: tMessage(dictionary.support.guide.title),
    description: tMessage(dictionary.support.guide.description),
    icon: <MessageSquare size={28} />,
    color: "text-rose-500",
    bgGlow: "bg-rose-500/20",
    capabilities: [
      {
        icon: <MessageSquare size={20} />,
        title: tMessage(
          dictionary.support.guide.capabilities.directFeedback.title,
        ),
        desc: tMessage(
          dictionary.support.guide.capabilities.directFeedback.desc,
        ),
      },
      {
        icon: <Zap size={20} />,
        title: tMessage(
          dictionary.support.guide.capabilities.alphaLimits.title,
        ),
        desc: tMessage(dictionary.support.guide.capabilities.alphaLimits.desc),
      },
      {
        icon: <CheckCircle2 size={20} />,
        title: tMessage(
          dictionary.support.guide.capabilities.statusTracking.title,
        ),
        desc: tMessage(
          dictionary.support.guide.capabilities.statusTracking.desc,
        ),
      },
    ],
    steps: [
      tMessage(dictionary.support.guide.steps.step1),
      tMessage(dictionary.support.guide.steps.step2),
      tMessage(dictionary.support.guide.steps.step3),
    ],
    proTip: tMessage(dictionary.support.guide.proTip),
  },
  superadmin: {
    title: tMessage(dictionary.superadmin.guide.title),
    description: tMessage(dictionary.superadmin.guide.description),
    icon: <Settings2 size={28} />,
    color: "text-zinc-500",
    bgGlow: "bg-zinc-500/20",
    capabilities: [
      {
        icon: <MessageSquare size={20} />,
        title: tMessage(
          dictionary.superadmin.guide.capabilities.feedbackReview.title,
        ),
        desc: tMessage(
          dictionary.superadmin.guide.capabilities.feedbackReview.desc,
        ),
      },
      {
        icon: <CheckCircle2 size={20} />,
        title: tMessage(dictionary.superadmin.guide.capabilities.triage.title),
        desc: tMessage(dictionary.superadmin.guide.capabilities.triage.desc),
      },
      {
        icon: <Key size={20} />,
        title: tMessage(
          dictionary.superadmin.guide.capabilities.exemptions.title,
        ),
        desc: tMessage(
          dictionary.superadmin.guide.capabilities.exemptions.desc,
        ),
      },
    ],
    steps: [
      tMessage(dictionary.superadmin.guide.steps.step1),
      tMessage(dictionary.superadmin.guide.steps.step2),
      tMessage(dictionary.superadmin.guide.steps.step3),
    ],
    proTip: tMessage(dictionary.superadmin.guide.proTip),
  },
});

/**
 * A highly structured, static modal for providing macro-level overview documentation for a specific module or tab.
 * Relies on the centralized `dictionary` for all copy.
 *
 * @example
 * ```tsx
 * <PageGuideModal
 *   isOpen={isPageGuideOpen}
 *   onClose={() => setIsPageGuideOpen(false)}
 *   activeTab="dashboard"
 * />
 * ```
 */
export const PageGuideModal: React.FC<PageGuideModalProps> = ({
  isOpen,
  onClose,
  activeTab,
  onDoNotShowAgain,
}) => {
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

  const pageGuides = getPageGuides();
  const guide = pageGuides[activeTab] || pageGuides["dashboard"];

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
            <div
              className={`absolute top-0 right-0 w-96 h-96 ${guide.bgGlow} rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 opacity-60`}
            />
            <div className="absolute bottom-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />

            <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center gap-6">
              <div
                className={`p-5 bg-white/10 rounded-2xl ${guide.color} backdrop-blur-md border border-white/10 shadow-2xl`}
              >
                {guide.icon}
              </div>
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <span className="px-3 py-1 bg-white/10 rounded-full text-[10px] font-bold uppercase tracking-widest text-white/80 border border-white/10">
                    Module Guide
                  </span>
                </div>
                <h2 className="text-3xl sm:text-4xl font-serif font-bold mb-3 tracking-tight">
                  {guide.title}
                </h2>
                <p className="text-white/80 text-base sm:text-lg max-w-2xl leading-relaxed font-light">
                  {guide.description}
                </p>
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
                    <div
                      key={i}
                      className="flex items-start gap-4 p-5 rounded-2xl bg-white border border-ink-dark/5 shadow-sm hover:shadow-md transition-all group"
                    >
                      <div
                        className={`p-3 rounded-xl bg-paper-base ${guide.color} shrink-0 group-hover:scale-110 transition-transform duration-300`}
                      >
                        {cap.icon}
                      </div>
                      <div>
                        <h4 className="font-bold text-ink-dark text-base mb-1">
                          {cap.title}
                        </h4>
                        <p className="text-sm text-ink-dark/60 leading-relaxed">
                          {cap.desc}
                        </p>
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
                    <Target size={16} className="text-emerald-500" /> Quick
                    Start
                  </h3>
                  <div className="space-y-4">
                    {guide.steps.map((step, i) => (
                      <div key={i} className="flex items-start gap-4">
                        <div className="flex items-center justify-center w-6 h-6 rounded-full bg-ink-dark text-white text-xs font-bold shrink-0 mt-0.5">
                          {i + 1}
                        </div>
                        <p className="text-ink-dark/80 text-sm leading-relaxed pt-0.5">
                          {step}
                        </p>
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
                {doNotShow && (
                  <CheckCircle2 size={14} className="text-ink-dark" />
                )}
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
              <ChevronRight
                size={18}
                className="group-hover:translate-x-1 transition-transform"
              />
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
