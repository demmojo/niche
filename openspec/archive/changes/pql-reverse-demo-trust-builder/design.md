# Design: PQL Reverse Demo Hook & Trust Builder

## Context

The ideation validation flow experiences high user drop-off due to static wait screens and generic authentication walls. Additionally, the AI tends to pivot away from valid, hyper-niche user ideas due to proximity to saturated markets (tarpits).

## Goals

- Implement Labor Illusion during the validation wait time to increase user trust.
- Stop the AI from overwriting valid, hyper-niche user ideas.
- Utilize loss aversion and endowment effect to increase PQL gate conversions.

## Non-Goals

- Replacing the entire underlying authentication provider.
- Redesigning the entire dashboard post-authentication.

## Decisions

- **API Versioning & Streaming Data**: Create a new `v2` streaming endpoint (e.g., `/api/v2/telemetry/stream`) for the progressive disclosure UI to avoid breaking existing `v1` clients. Use React 19 `use()`, Radix Accordion, and Motion `layout` to expand data smoothly as it streams from the backend.
- **Niche Preservation & Safe Rollout**: Use Orthogonal Vector Distance as a threshold bypass. If unique enough, trigger System Override to prevent pivot. This logic will be rolled out behind a feature flag or strictly in the `v2` scoring pipeline to prevent regression in existing analysis flows.
- **Reverse Demo Hook**: Render the component tree of the generated analysis but visually obscure it with a backdrop filter until auth is complete.

## Risks & Trade-offs

- **Data Leakage**: Rendering the full artifact and blurring it via CSS might leak data to tech-savvy users inspecting the DOM. _Mitigation: Only render placeholder/skeleton data with real visual shapes or strictly mask sensitive text at the component level until fully authenticated._
- **Latency**: Streaming intermediate steps adds backend routing and orchestration complexity.

## Future Potential

- Extend the Trust Builder labor illusion UI to other long-running AI tasks within the platform.
- A/B test different blur intensities, gradients, and microcopy to optimize the PQL gate.
