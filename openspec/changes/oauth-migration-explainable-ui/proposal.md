# Proposal: OAuth Migration & Explainable UI Refactor

## Why

The current implementation relies on Magic Links, which force an application-switch context break. This severely degrades conversion momentum, particularly on mobile and social feeds. Furthermore, using generic loading spinners during the 5-15 second identity merge window increases user anxiety and erodes trust. Punitive TTL urgency drivers (24-hour deletion warnings) also harm the user experience.

## What Changes

1. **Standardized OAuth:** Replace Magic Links with Google/GitHub OAuth mechanisms (`linkWithPopup` primarily, with `linkWithRedirect` fallback for strict ITP/WebViews).
2. **Explainable UI States:** Swap generic loaders with an event-driven `<ExplainableLoader>` that describes the exact stage of the underlying state machine.
3. **Value-Driven Urgency:** Replace deletion-threat banners with positive, value-preserving messaging.
4. **Secure Merge Pipeline:** Implement a Cryptographic Claim Ticket system to safely append anonymous workspaces to permanent accounts without IDOR risks.

## Capabilities

- Users can seamlessly upgrade from anonymous to authenticated accounts within the application context.
- Resilient auth flows that automatically detect execution environments and gracefully recover from mobile WebViews.
- Fully transparent background processing via live UI feedback (e.g., "Securing workspace..." -> "Authenticating with Google...").

## Impact

Drastically decreased time-to-authenticated, resulting in higher account conversion rates, better data persistence, and significantly improved user trust during high-latency backend merge operations.
