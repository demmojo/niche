import React from "react";
// Removed 'cn' utility import as we're not using tailwind-merge here to keep it simple, or we can use clsx if available, but for now template literals work.

export interface AsymmetricalShellProps {
  children: React.ReactNode;
  sidebarContent?: React.ReactNode;
  headerContent?: React.ReactNode;
  className?: string;
}

/**
 * Foundational Layout Shell for Generative UI
 * This provides a static, human-owned container for volatile, AI-generated components.
 * It enforces an asymmetrical layout to guide focus toward the generative content.
 */
export const AsymmetricalShell: React.FC<AsymmetricalShellProps> = ({
  children,
  sidebarContent,
  headerContent,
  className = "",
}) => {
  return (
    <div
      className={`flex flex-col md:flex-row min-h-screen bg-neutral-50 ${className}`}
    >
      {/* Static Sidebar (Human-owned) */}
      {sidebarContent && (
        <aside className="w-full md:w-64 lg:w-80 bg-white border-r border-neutral-200 shrink-0 p-4 sticky top-0 md:h-screen md:overflow-y-auto z-10">
          {sidebarContent}
        </aside>
      )}

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 max-w-full relative">
        {/* Static Header (Human-owned) */}
        {headerContent && (
          <header className="w-full bg-white/80 backdrop-blur-md border-b border-neutral-200 p-4 sticky top-0 z-20">
            {headerContent}
          </header>
        )}

        {/* Volatile Content Container (AI-generated / Streaming) */}
        <div className="flex-1 p-4 md:p-8 lg:p-12 overflow-x-hidden">
          <div className="max-w-4xl mx-auto w-full">{children}</div>
        </div>
      </main>
    </div>
  );
};
