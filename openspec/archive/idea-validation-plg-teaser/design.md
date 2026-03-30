# Design

## Context

The platform needs to attract users by showing immediate value without incurring massive LLM/Search API costs for unauthenticated traffic.

## Goals

- Provide an idea validation teaser to unauthenticated users.
- Reduce compute costs for anonymous usage.
- Seamlessly transition users from anonymous to authenticated states without losing context.

## Non-Goals

- Full offline support.
- Replacing the core authentication mechanisms.

## Decisions

- **Cost Containment**: Use `gemini-3.1-flash-lite-preview` and shallow `exa.search` for anonymous traffic.
- **Backend Resilience**: Bind `AbortController` to `req.on('close')` to terminate streams on client disconnect.
- **Auth Flow**: Use `linkWithPopup` to upgrade anonymous accounts, preserving the teaser stream's React state.

## Risks & Trade-offs

- _Risk_: Abuse of the anonymous endpoint. _Mitigation_: IP/device fingerprint rate limiting via shared infrastructure.
- _Risk_: React race conditions during sign-up mid-stream. _Mitigation_: Enforce `AbortController` patterns in frontend data fetching and SSE hooks.

## Future Potential

Dynamic paywalls or PQL limits based on behavioral scoring.
