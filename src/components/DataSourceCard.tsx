import React from "react";
import {
  GlobeLock,
  Database,
  Github,
  Image as ImageIcon,
  Users,
  DollarSign,
  MessageSquare,
  Maximize2,
  Lightbulb,
} from "lucide-react";
import { DataSource } from "../types";
import { JsonViewer } from "./JsonViewer";

export const DataSourceCard = React.memo(function DataSourceCard({
  source,
  competitorName,
  onClick,
}: {
  source: DataSource;
  competitorName?: string;
  onClick?: () => void;
}) {
  return (
    <div
      onClick={onClick}
      className={`bg-paper-base border border-ink-dark/20 rounded-xl overflow-hidden shadow-lg flex flex-col ${onClick ? "cursor-pointer hover:border-ink-dark/50 transition-colors" : ""}`}
    >
      <div className="flex items-center justify-between px-4 py-2 bg-paper-card border-b border-ink-dark/20 ">
        <div className="flex items-center gap-2">
          {source.type === "website" && (
            <GlobeLock size={14} className="text-blue-400" />
          )}
          {source.type === "api" && (
            <Database size={14} className="text-emerald-400" />
          )}
          {source.type === "github" && (
            <Github size={14} className="text-moss " />
          )}
          {source.type === "screenshot" && (
            <ImageIcon size={14} className="text-purple-400" />
          )}
          {source.type === "linkedin" && (
            <Users size={14} className="text-blue-500" />
          )}
          {source.type === "crunchbase" && (
            <DollarSign size={14} className="text-emerald-500" />
          )}
          {source.type === "news" && (
            <MessageSquare size={14} className="text-amber-400" />
          )}
          <span
            className="text-xs font-mono text-ink-dark truncate max-w-[200px] block"
            title={source.sourceUrl}
          >
            {source.sourceUrl}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {source.isDeduced && (
            <span className="text-[10px] bg-purple-100 text-purple-800 px-1.5 py-0.5 rounded border border-purple-200">
              Deduced
            </span>
          )}
          <span
            className={`text-[10px] px-1.5 py-0.5 rounded border ${
              source.confidenceLevel === "High"
                ? "bg-emerald-100 text-emerald-800 border-emerald-200"
                : source.confidenceLevel === "Medium"
                  ? "bg-amber-100 text-amber-800 border-amber-200"
                  : "bg-rose-100 text-rose-800 border-rose-200"
            }`}
          >
            {source.confidenceLevel} Confidence
          </span>
        </div>
      </div>
      {source.type === "screenshot" ? (
        <div className="h-32 w-full border-b border-ink-dark/20 relative group overflow-hidden bg-paper-base ">
          <img
            src={source.sourceUrl}
            alt="Screenshot"
            className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-ink-dark/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
            <Maximize2 className="text-paper-light w-6 h-6" />
          </div>
        </div>
      ) : (
        <div className="p-4 flex-1 overflow-x-auto">
          <JsonViewer text={source.excerpt} />
        </div>
      )}
      <div className="px-4 py-3 bg-paper-card border-t border-ink-dark/20 flex items-center justify-between">
        <div className="flex items-center gap-2">
          {competitorName && (
            <span className="text-xs font-medium text-[#8A8A8A] ">
              Target: <span className="text-ink-dark ">{competitorName}</span>
            </span>
          )}
          <span className="text-[10px] text-[#8A8A8A] font-mono">
            {new Date(source.timestamp).toLocaleString()}
          </span>
        </div>
        <div className="flex items-center gap-3">
          {source.linkedInsightIds && source.linkedInsightIds.length > 0 && (
            <div
              className="flex items-center gap-1 text-xs text-[#8A8A8A]"
              title={`${source.linkedInsightIds.length} derived insight(s)`}
            >
              <Lightbulb size={12} />
              <span>{source.linkedInsightIds.length}</span>
            </div>
          )}
          <div className="flex gap-1.5">
            {source.tags.map((tag) => (
              <span
                key={tag}
                className="px-2 py-0.5 bg-paper-base text-[#8A8A8A] rounded text-[10px] uppercase tracking-wider"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
});
