import React, { useState } from "react";
import { useProjectBrandIdentity } from "../../hooks/useProjectBrandIdentity";

/**
 *
 */
export const BrandIdentityWidget = ({ projectId }: { projectId: string }) => {
  const brandState = useProjectBrandIdentity(projectId);
  const [isWidgetOpen, setIsWidgetOpen] = useState(false);

  if (brandState.status === "error" || brandState.status === "idle") {
    return null; // Do not show if error or no data
  }

  const brand = brandState.status === "success" ? brandState.data : null;
  const isLoading = brandState.status === "loading";

  /**
   *
   */
  const copyCssVariables = () => {
    if (!brand) return;
    const cssString = `:root {\n  --brand-primary: ${brand.primary_color};\n  --brand-primary-fg: ${brand.primary_fg};\n}`;
    navigator.clipboard.writeText(cssString);
    alert("Copied to clipboard!");
  };

  return (
    <div className="fixed bottom-4 right-4 z-[100]">
      {isWidgetOpen && (
        <div className="mb-2 p-4 bg-paper-card rounded-storybook-sm shadow-storybook-hover border border-ink-dark/20 w-64 text-ink-dark font-sans transition-all duration-300 transform origin-bottom-right">
          <h3 className="text-sm font-semibold mb-3 border-b border-ink-dark/10 pb-2">
            Brand Identity
          </h3>

          {isLoading ? (
            <div className="space-y-3 animate-pulse">
              <div className="h-4 bg-ink-dark/10 rounded w-3/4"></div>
              <div className="h-4 bg-ink-dark/10 rounded w-1/2"></div>
              <div className="h-4 bg-ink-dark/10 rounded w-full"></div>
            </div>
          ) : (
            <div className="space-y-3 text-sm">
              <div className="flex justify-between items-center">
                <span className="text-ink-muted">Tone</span>
                <span className="font-medium text-right truncate w-32">
                  {brand.tone}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-ink-muted">Type</span>
                <span className="font-medium text-right truncate w-32">
                  {brand.typography}
                </span>
              </div>
              <div className="flex items-center justify-between mt-2 pt-2 border-t border-ink-dark/10">
                <div className="flex items-center gap-2">
                  <div
                    className="w-5 h-5 rounded-full border border-ink-dark/20 shadow-sm"
                    style={{ backgroundColor: brand.primary_color }}
                  />
                  <span className="font-mono text-xs text-ink-muted">
                    {brand.primary_color}
                  </span>
                </div>
              </div>
              <button
                onClick={copyCssVariables}
                className="mt-4 w-full py-2 text-xs font-semibold border border-ink-dark/20 rounded hover:bg-paper-base transition-colors"
              >
                Copy CSS Variables
              </button>
            </div>
          )}
        </div>
      )}
      <button
        onClick={() => setIsWidgetOpen(!isWidgetOpen)}
        className="p-3 bg-paper-card border border-ink-dark/20 shadow-storybook rounded-full hover:shadow-storybook-hover transition-all duration-300 flex items-center justify-center float-right"
        title="Brand Identity"
      >
        <span className="text-xl leading-none">🎨</span>
      </button>
    </div>
  );
};
