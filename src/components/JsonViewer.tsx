import React, { useState } from "react";
import { Copy, CheckCircle2 } from "lucide-react";

export const JsonViewer = React.memo(function JsonViewer({
  text,
}: {
  text: string;
}) {
  const [copied, setCopied] = useState(false);

  /**
   *
   */
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy text:", err);
    }
  };

  const formattedJson = text;
  try {
    const parsed = JSON.parse(text);

    /**
     *
     */
    const renderNode = (data: any): React.ReactNode => {
      if (typeof data !== "object" || data === null) {
        return (
          <span className="text-ink-dark text-sm font-medium">
            {String(data)}
          </span>
        );
      }

      if (Array.isArray(data)) {
        return (
          <div className="flex flex-wrap gap-2">
            {data.map((item, i) => (
              <div
                key={i}
                className="bg-paper-card border border-ink-dark/20 px-2 py-1 rounded text-xs text-ink-dark"
              >
                {typeof item === "object" ? renderNode(item) : String(item)}
              </div>
            ))}
          </div>
        );
      }

      return (
        <div className="space-y-2 w-full">
          {Object.entries(data).map(([key, value]) => (
            <div
              key={key}
              className="flex flex-col sm:flex-row sm:items-start gap-1 sm:gap-4 border-b border-ink-dark/20 pb-2 last:border-0 last:pb-0"
            >
              <span className="text-[#8A8A8A] text-xs uppercase tracking-wider font-medium min-w-[120px] pt-0.5">
                {key.replace(/_/g, " ")}
              </span>
              <div className="flex-1">
                {typeof value === "object" && value !== null ? (
                  <div className="bg-paper-card p-2 rounded border border-ink-dark/20 mt-1 sm:mt-0">
                    {renderNode(value)}
                  </div>
                ) : (
                  <span className="text-ink-dark text-sm font-medium">
                    {String(value)}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      );
    };

    return (
      <div className="relative group rounded-xl border border-ink-dark/10 overflow-hidden bg-[#2C2C2C] shadow-inner text-sm font-mono leading-relaxed mt-2 text-paper-light">
        <div className="flex justify-between items-center px-4 py-2 border-b border-paper-light/10 bg-[#3d4a40] text-paper-light">
          <span className="font-semibold uppercase tracking-wider text-xs">
            JSON Response
          </span>
          <button
            onClick={handleCopy}
            className="text-paper-light/50 hover:text-paper-light transition-colors flex items-center gap-1.5"
            title="Copy JSON"
          >
            {copied ? (
              <>
                <CheckCircle2 size={14} className="text-emerald-400" />
                <span className="text-xs font-medium text-emerald-400">
                  Copied!
                </span>
              </>
            ) : (
              <>
                <Copy size={14} />
                <span className="text-xs font-medium">Copy</span>
              </>
            )}
          </button>
        </div>
        <div className="p-4 overflow-x-auto max-h-[400px] overflow-y-auto">
          {renderNode(parsed)}
        </div>
      </div>
    );
  } catch (e) {
    return (
      <div className="relative group rounded-xl border border-ink-dark/10 overflow-hidden bg-[#2C2C2C] shadow-inner text-sm font-mono leading-relaxed mt-2 text-paper-light">
        <div className="flex justify-between items-center px-4 py-2 border-b border-paper-light/10 bg-[#3d4a40] text-paper-light">
          <span className="font-semibold uppercase tracking-wider text-xs">
            JSON Response
          </span>
          <button
            onClick={handleCopy}
            className="text-paper-light/50 hover:text-paper-light transition-colors flex items-center gap-1.5"
            title="Copy JSON"
          >
            {copied ? (
              <>
                <CheckCircle2 size={14} className="text-emerald-400" />
                <span className="text-xs font-medium text-emerald-400">
                  Copied!
                </span>
              </>
            ) : (
              <>
                <Copy size={14} />
                <span className="text-xs font-medium">Copy</span>
              </>
            )}
          </button>
        </div>
        <div className="p-4 overflow-x-auto max-h-[400px] overflow-y-auto">
          <pre className="text-emerald-400 text-xs whitespace-pre-wrap word-break">
            {text}
          </pre>
        </div>
      </div>
    );
  }
});
