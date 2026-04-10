import * as Sentry from "@sentry/node";
import { nodeProfilingIntegration } from "@sentry/profiling-node";
import { createBeforeSend } from "../utils/sentryScrubber";

export const sentryBeforeSend = (event: Sentry.Event): Sentry.Event => {
  return createBeforeSend(event);
};

export const initSentry = () => {
  if (process.env.NODE_ENV !== "test") {
    Sentry.init({
      dsn: process.env.SENTRY_DSN || "https://example@sentry.io/123", // Using placeholder if not provided
      integrations: [nodeProfilingIntegration()],
      tracesSampleRate: 0.1,
      profilesSampleRate: 0.1,
      sendDefaultPii: false,
      beforeSend: sentryBeforeSend as any,
    });
  }
};
