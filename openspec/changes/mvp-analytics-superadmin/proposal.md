# Proposal: 4-Event MVP Analytics and Superadmin Refactor

## Why

Founding teams frequently fall into the tarpit of building massive internal analytics dashboards and tracking vanity metrics (page views, session lengths) that don't reflect actual product value. To move fast, we need a lean, deterministic telemetry pipeline that tracks the 4 core "Aha" moments indicating a user has escaped a horizontal tarpit and found a niche. Superadmin views should focus on qualitative operations (impersonating users to debug their journey) rather than quantitative D3/Recharts dashboards, which are better offloaded to tools like PostHog or Mixpanel.

## What Changes

1. Replace the over-engineered Recharts visualizations in `SuperadminAnalytics.tsx` with a Magic Login (user impersonation) table and a daily Generative AI summary of our telemetry.
2. Introduce a highly-focused, lean 4-Event telemetry strategy measuring "Problem Resonance".
3. Implement robust client-side batching and server-side ingestion for these 4 core events.

## Capabilities

- **Lean Telemetry Tracking:** Accurately track Activation, Core Action, Retention Proxy, and Revenue Signal via direct deterministic logging.
- **Magic Login (Impersonation):** Superadmins can safely impersonate a user session via a "Secondary Firebase App" pattern without breaking their root session.
- **Generative AI Telemetry Summaries:** Daily insights generated securely using Gemini 3.1 Pro via the "Aggregate-Validate-Generate" pattern, preventing hallucinations.

## Impact

- **Reduced Engineering Debt:** Ripping out React charting libraries saves time and bundle size.
- **Faster Debugging:** Admins can instantly step into a user's perspective, observing exact configurations and issues firsthand.
- **Actionable Insights:** Eradicates vanity metrics in favor of tracking 4 explicit markers of user success.
- **Controlled Costs:** 30-day Firestore TTL limits database size growth.
