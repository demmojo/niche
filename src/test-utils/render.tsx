import React from "react";
import { render as rtlRender, RenderOptions } from "@testing-library/react";
import { VisualKnowledgeProvider } from "../store/visualKnowledgeStore";

function render(ui: React.ReactElement, options?: RenderOptions) {
  const Wrapper = ({ children }: { children: React.ReactNode }) => {
    const OriginalWrapper = options?.wrapper;
    return (
      <VisualKnowledgeProvider>
        {OriginalWrapper ? (
          <OriginalWrapper>{children}</OriginalWrapper>
        ) : (
          children
        )}
      </VisualKnowledgeProvider>
    );
  };
  return rtlRender(ui, { ...options, wrapper: Wrapper });
}

export * from "@testing-library/react";
export { render };
