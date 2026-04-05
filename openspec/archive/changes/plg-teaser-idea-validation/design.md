# Design: PLG Teaser for Idea Validation

## Context

Our current flow hard-blocks anonymous traffic, preventing users from experiencing the core "Aha!" moment of our product. By introducing a PLG teaser, we allow users to see partial value before committing to account creation.

## Goals

- Deliver immediate, partial value to unauthenticated users via Progressive Skeletons.
- Minimize LLM and search compute costs for anonymous traffic.
- Convert anonymous users into registered users seamlessly without losing their generated context via Stateful Resume.
- Ensure backend resilience against disconnected anonymous streams.

## Non-Goals

- Full feature parity or deep content retrieval for unauthenticated users.
- Permanent data storage/history for anonymous sessions.

## Decisions

- **AI Logic & Models**: Use Remote Config for model resolution with a fallback to `gemini-3.1-flash-lite-preview` for anonymous streams due to its low cost and acceptable speed/quality.
- **Search Strategy**: Use Exa's shallow `search` instead of `searchAndContents` to save tokens and latency.
- **Streaming Resilience**: Explicitly set the `X-Accel-Buffering: no` header on the backend. On the frontend, use safe SSE error handling (call `setError` and return instead of `throw` inside `try/catch`).
- **UX/UI Design**: Implement Progressive Skeletons for loading states and a "Blur Tease" visual effect for the Tarpit Score to visually tease the gated content. Render an Inline Safe Auth CTA upon gating.
- **Gating Mechanism**: Emit a `pql_gate` SSE event so the frontend knows exactly when to stop and prompt for signup, avoiding abrupt network disconnects.
- **Latency Optimization (Stateful Resume)**: Cache intermediate AI state to Firestore _before_ the `pql_gate` is emitted. When the user resumes post-authentication, the backend skips the Exa search and redundant LLM calls.
- **Authentication & React**: Use Firebase's `linkWithPopup` to upgrade the anonymous session. The frontend must abort the active SSE stream _before_ calling `linkWithPopup`, cache state to `sessionStorage` before unmounts, handle `auth/credential-already-in-use` exceptions, and call `auth.currentUser?.reload()` after a successful merge.

## Risks/Trade-offs

- **Quality Drop**: The flash-lite model and shallow search may yield slightly less accurate competitors compared to the pro model. This is an acceptable trade-off for a teaser.
- **Abuse**: Anonymous endpoints can be spammed. We will mitigate this with IP/Device fingerprint rate limiting (max 3 streams).

## Future Potential

- A/B testing the exact moment the `pql_gate` is triggered (e.g., after Competitors vs. after Market Gaps).
- Personalized onboarding flows based on the teased idea data.
