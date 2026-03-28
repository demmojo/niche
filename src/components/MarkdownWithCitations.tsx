import React, { useMemo } from "react";
import ReactMarkdown from "react-markdown";
import { useCitationMapStore } from "../store/citationMapStore";

interface MarkdownWithCitationsProps {
  content: string;
  className?: string;
}

export const MarkdownWithCitations: React.FC<MarkdownWithCitationsProps> = ({
  content,
  className = "prose prose-slate max-w-none prose-p:leading-relaxed prose-a:text-sky-500 hover:prose-a:text-sky-600",
}) => {
  const citations = useCitationMapStore((state) => state.citations);

  const components = useMemo(() => {
    return {
      // Custom handler for <cite id="..."> tags in markdown
      cite: ({ node, children, ...props }: any) => {
        const id = props.id;
        const citation = id ? citations[id] : null;

        if (!citation) {
          return <cite {...props}>{children}</cite>;
        }

        return (
          <span className="relative group inline-block cursor-help bg-sky-500/10 text-sky-600 px-1 rounded mx-1 text-sm border border-sky-500/20 hover:bg-sky-500/20 transition-colors">
            {children || "[Source]"}

            {/* Tooltip */}
            <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 w-64 bg-ink-dark text-white p-3 rounded-lg text-xs shadow-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
              <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-ink-dark rotate-45" />
              <div className="font-bold text-sky-400 mb-1 flex justify-between items-center">
                <span>{citation.sourceName || "Raw Source"}</span>
                <span className="text-white/40 font-normal">
                  {new Date(citation.timestamp).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </div>
              <p className="text-white/80 leading-snug line-clamp-4">
                "{citation.rawText}"
              </p>
              {citation.sourceUrl && (
                <div className="mt-2 pt-2 border-t border-white/10 text-sky-400 font-medium truncate">
                  {citation.sourceUrl}
                </div>
              )}
            </div>
          </span>
        );
      },
    };
  }, [citations]);

  return (
    <div className={className}>
      <ReactMarkdown components={components}>{content}</ReactMarkdown>
    </div>
  );
};
