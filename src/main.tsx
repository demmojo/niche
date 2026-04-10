import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import * as Sentry from "@sentry/react";
import App from "./App.tsx";
import "./index.css";
import { AuthProvider } from "./components/AuthProvider";
import { VisualKnowledgeProvider } from "./store/visualKnowledgeStore";
import { CitationMapProvider } from "./store/citationMapStore";
import { Provider as TooltipProvider } from "@radix-ui/react-tooltip";

import { createBeforeSend } from "./utils/sentryScrubber";

if (import.meta.env.PROD) {
  Sentry.init({
    dsn: import.meta.env.VITE_SENTRY_DSN || "https://example@sentry.io/123",
    integrations: [
      Sentry.browserTracingIntegration(),
      Sentry.replayIntegration(),
    ],
    tracesSampleRate: 0.1,
    tracePropagationTargets: ["localhost", /^https:\/\/yourserver\.io\/api/],
    replaysSessionSampleRate: 0.01,
    replaysOnErrorSampleRate: 1.0,
    beforeSend: createBeforeSend as any,
  });
}

// Suppress MetaMask connection errors caused by browser extensions
window.addEventListener("unhandledrejection", (event) => {
  if (
    event.reason &&
    typeof event.reason.message === "string" &&
    event.reason.message.includes("MetaMask")
  ) {
    event.preventDefault();
  }
});

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <AuthProvider>
      <VisualKnowledgeProvider>
        <CitationMapProvider>
          <TooltipProvider delayDuration={300}>
            <App />
          </TooltipProvider>
        </CitationMapProvider>
      </VisualKnowledgeProvider>
    </AuthProvider>
  </StrictMode>,
);
