---
name: niche-pdlc-evolution
overview: A phased refactor to unify Niche's UX into an intent-based command center, integrating hybrid AI orchestration and automated visual validation.
todos:
  - id: audit-ml-calls
    content: Audit existing aiClient.ts usage to identify candidates for agentic workflows vs direct calls.
    status: pending
  - id: integrate-smolagents
    content: Set up a lightweight smolagents environment for fast, cost-sensitive UI generation.
    status: pending
  - id: refactor-dashboard-ui
    content: Redesign the main product dashboard to follow the intent-based Command Center pattern with RAG thresholds.
    status: pending
  - id: setup-browser-use
    content: Integrate Browser-Use for automated visual testing of the new dashboard flows.
    status: pending
  - id: implement-telemetry
    content: Add lightweight behavioral telemetry to feed the continuous learning loop for adaptive UI density.
    status: pending
isProject: false
---

# Niche PDLC & UX Evolution Plan

## Enhancement Summary

**Deepened on:** 2026-03-27
**Sections enhanced:** 4
**Research agents used:** 4x `best-practices-researcher`

### Key Improvements

1. **Hybrid Orchestration (Informed Dispatcher):** Formalized the routing logic between direct LLM calls (< 2s), `smolagents` (sandboxed, 3-8s), and `CrewAI` (fully asynchronous via Celery/Redis).
2. **Intent-Based Dashboard Architecture:** Adopted strict progressive disclosure (Overview → Focus → Action) and contextual RAG thresholds tied to standard deviations rather than static limits.
3. **Figma-to-Code Pipeline:** Ensured Figma layers use semantic naming (e.g., `ActionCard/Destructive`) to empower the Figma Context MCP to generate pixel-perfect React code.
4. **Confidence-Based Adaptive UI:** Introduced declarative UI generation where the interface fidelity matches the AI's confidence score (e.g., polished vs. provisional UI).

### New Considerations Discovered

- **RCE Vulnerabilities in Agents:** `smolagents` strictly requires sandboxing (E2B, Modal, or Docker) due to the risk of Remote Code Execution when generating Python code on the fly.
- **Visual Thrashing:** Real-time dashboard updates must be throttled (e.g., 1Hz) and virtualized to prevent UI freezing and cognitive overload.
- **Fallback Determinism:** AI-adapted UI fetches must have strict timeouts (e.g., `Promise.race()` with 800ms) to ensure the system falls back to a default deterministic UI.

## Phase 1: ML System Audit & Hybrid Orchestration

- Audit the existing `aiClient.ts` to map current AI usage. Keep it intact for fast, direct, and cost-sensitive LLM queries.
- Integrate `smolagents` for lightweight, sandboxed UI and logic generation tasks where speed and token-efficiency are paramount.
- Scaffold a background task queue optimized for `CrewAI` to handle complex, multi-agent market intelligence research asynchronously, protecting the user-facing latency.

### Research Insights

**Best Practices:**

- Adopt the **Informed Dispatcher** pattern to route tasks based on intent: Tier 1 (`aiClient` for fast text/JSON), Tier 2 (`smolagents` for tool-use/code execution), and Tier 3 (`CrewAI` for multi-step reasoning).
- Never block the main application thread for Tier 3 (`CrewAI`). Use task queues (e.g., Celery/Redis) with dedicated worker queues (`heavy_agents`).
- Persist CrewAI short-term and long-term memory across distributed workers using Redis or PostgreSQL.

**Performance Considerations:**

- **Cost Optimization:** Routing simple queries away from multi-agent frameworks to direct calls reduces token costs by up to 80% and latency by 70%.
- **Token Accumulation:** Enforce strict Pydantic output schemas between CrewAI agents to pass compressed data, avoiding massive context bloat.

**Implementation Details:**

```python
# Route heavy CrewAI tasks to background workers
task_routes = {'crewai.*': {'queue': 'heavy_agents'}}

# Enforce strict limits on heavy queues to prevent worker starvation
# celery -A tasks worker -Q heavy_agents --concurrency=2
```

**Edge Cases:**

- **RCE Security:** `smolagents` generates executable code. **Never run without a sandbox.** Use E2B, Modal, or isolated Docker environments with hard timeouts (e.g., 10-15s).
- **Context Loss:** Ensure the Dispatcher includes a universal "Handoff Payload" (`user_id`, `session_id`, `working_context`) when routing tasks between tiers.

## Phase 2: UX Unification & Design System

- Establish an intent-based "Command Center" UI layout utilizing progressive disclosure: _Overview_ (Monitoring) → _Focus_ (Triage) → _Action_ (Execution).
- Integrate Figma Context MCP to extract current typography and layouts, creating a unified heuristics file to guide all future AI UI generation.
- Refactor existing complex dashboards to use RAG (Red/Amber/Green) thresholds and cap metrics per view to strictly manage cognitive overload (max 7±2 data chunks).

### Research Insights

**Best Practices:**

- **No Dead Ends Rule:** Never display a metric without a clickable "Focus" view, and never build a "Focus" view without an "Action" resolution path.
- **RAG Optimization:** Pair colors with distinct semantic shapes (🔴 Octagon, ⚠️ Triangle, 🟢 Circle) for accessibility. Mute green metrics to recede into the background.
- **Semantic Figma Layering:** For the Figma Context MCP to work accurately, layers must use semantic names (`ActionCard/Destructive`) and explicit design tokens.

**Performance Considerations:**

- **Visual Thrashing:** Throttle WebSocket UI state updates to 1Hz (once per second) to keep numbers readable.
- **Virtualization:** For heavy "Focus" views (logs, tables), use virtualization (e.g., `@tanstack/react-virtual`) to render only visible items.

**Implementation Details:**

```tsx
// Component Architecture mirroring Progressive Disclosure
<Dashboard>
  <MetricCard /> /* Overview */
  <MetricDrawer>
    {" "}
    /* Focus */
    <ResolutionForm /> /* Action */
  </MetricDrawer>
</Dashboard>
```

**Edge Cases:**

- Hardcoded RAG thresholds fail in dynamic environments. Base Red/Amber states on standard deviations from a rolling average (e.g., a 12-week baseline) to prevent alert fatigue.
- Manage "Everything is Important" fallacy by enforcing strict Role-Based Access Control (RBAC) to tailor the 5-7 KPIs per user role.

## Phase 3: Prototyping & Visual Validation Pipeline

- Set up MCP-UI to allow for interactive component rendering inside the developer workspace during the brainstorming and specification phases.
- Integrate `Browser-Use` into the CI/CD pipeline or local testing suite to autonomously click through new features, validating cognitive load, layout stability, and intuitive flows.

### Research Insights

**Best Practices:**

- **Interactive AI Output:** Use the `@mcp-ui/client` SDK and its `AppRenderer` component as the industry standard to safely sandbox interactive UI previews within the IDE workspace.
- **Accessibility-Driven Navigation:** `browser-use` agents should interact with the DOM via accessibility tree references, making them resilient to CSS/layout changes.
- **Visual Baseline Governance:** Pipe `browser-use` outputs into a visual regression tool (like Argos or Percy) to filter out dynamic content noise (dates, animations) instead of failing builds.

**Performance Considerations:**

- LLM-driven autonomous agents are slower than standard Playwright. Reserve `browser-use` for high-value smoke tests and critical E2E flows to keep CI times manageable.
- Run `browser-use` headless within isolated Docker containers in CI.

**Implementation Details:**

```python
# Integrating browser-use autonomous validation into CI
agent = Agent(
    task=f"Navigate to {preview_url}. Proceed through the onboarding flow, fill required fields, and capture the dashboard.",
    llm=ChatOpenAI(model="gpt-4o"),
    headless=True # Mandatory for CI runners
)
result = await agent.run()
```

**Edge Cases:**

- Ensure the `AppRenderer` in MCP-UI receives dynamic `hostContext` (theme, viewport size) so the generated UI correctly aligns with the developer's environment (e.g., dark mode).
- Prefer self-healing interaction loops in `browser-use` instead of strict timeouts to handle dynamic page loading.

## Phase 4: Continuous UI Adaptation

- Implement lightweight behavioral telemetry that tracks frequent user actions (e.g., dismissing specific AI alerts, recurring navigation paths).
- Create a scheduled background job that analyzes this telemetry to dynamically adjust default UI postures, generative UI densities, and trust-building explainable AI states.

### Research Insights

**Best Practices:**

- **Schema-Driven Generative UI:** Do not let LLMs return raw frontend code. Agents must output structured JSON (`{"component": "DataGrid", "props": {...}}`), which the client maps to a deterministic component registry.
- **Optical Honesty (XAI):** Render AI-generated UI differently based on confidence. `>0.9`: solid UI. `0.6-0.9`: highlight with "AI Suggestion" badge. `<0.6`: collapsed or draft state.
- **Lightweight Telemetry:** Track dismissals/overrides via `navigator.sendBeacon`. An immediate dismissal of an AI-generated block is a strong negative reinforcement signal.

**Performance Considerations:**

- **Fallback Determinism:** Wrap generative UI requests in a `Promise.race()`. If the LLM exceeds latency budgets (e.g., 800ms), immediately fallback to the default static UI to preserve Web Vitals.
- Process UI adaptation rules at the Edge (Cloudflare Workers, Vercel Edge) rather than relying on heavy client-side recalibrations that cause layout shifts.

**Implementation Details:**

```javascript
// Lightweight cookieless telemetry hook on dismissal
function trackDismissal(variantId) {
  navigator.sendBeacon(
    "/api/telemetry",
    JSON.stringify({
      variant_id: variantId,
      action: "dismissed",
      time_visible_ms: 1200,
    }),
  );
}
```

**Edge Cases:**

- Avoid "Recommendation Fatigue" by injecting exploration variance—randomly serving default UI layouts to a small percentage of sessions so users discover new features.
- Provide data lineage/tooltips for adapted layouts (e.g., "Layout simplified based on your quick checkouts") to avoid "black box anxiety".
