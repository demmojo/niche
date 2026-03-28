## Context

The NicheAI analytics offerings currently lack the visual fidelity ("wow factor") and flexible reporting capabilities required by executives and power users. This feature implements the Next-Gen Analytics Platform UI strategy, introducing a "Brutalist Command Center" aesthetic (Deep Slate, Chartreuse, Radical Red, Electric Cyan) and splitting the user flow to reduce cognitive load between simply presenting data and actively analyzing it. Technical reviews have emphasized simplicity, security, and performance.

## Goals / Non-Goals

**Goals:**

- Implement a clear separation between "Presentation" (dashboards) and "Strategy" (workspaces) templates using route-based code splitting.
- Adopt the new 2026 Brutalist UI/UX styling (Deep Dark Mode, Clash Display, JetBrains Mono).
- Use native CSS Grid for generative strategic workspaces (SWOT, Lean Canvas) to minimize bundle size.
- Support AI-powered pre-filling for strategy templates with strict sanitization (DOMPurify).
- Implement simple debounced auto-saving for strategy templates with a "Saving.../Saved" indicator.

**Non-Goals:**

- Over-engineering with complex interactive node graphs (e.g., React Flow) when a structured grid suffices.
- Premature abstraction using headless components; we will build specific, coupled components first.
- Aggressive frontend data caching or optimistic UI updates, which introduce unnecessary complexity and rollback risks.

## Decisions

**1. Separating the Core UI Workflows with Code Splitting**

- **Decision**: Distinct interfaces for Presentation (Read-heavy, Recharts) vs. Strategy (Write-heavy, CSS Grid), separated via `React.lazy` and `Suspense`.
- **Rationale**: Prevents the "Swiss Army Knife" fallacy. Code splitting ensures users only loading a read-only dashboard don't pay the performance tax of downloading the Strategy engine.

**2. Direct Component Architecture over Headless Abstraction**

- **Decision**: Build specific, tightly-coupled components for Presentation and Strategy rather than premature headless data hooks.
- **Rationale**: Follows YAGNI (You Aren't Gonna Need It). Decoupling data fetching too early adds boilerplate and abstraction leaks.

**3. State Management Strategy & Syncing**

- **Decision**: Standard data fetching without aggressive caching. Local React state for high-frequency input changes, synced via debounced API calls without optimistic UI mutation.
- **Rationale**: Prevents global state thrashing and complex error-handling rollbacks. Strict separation ensures sensitive corporate data is not cached in plaintext `localStorage`.

**4. Performance Optimizations**

- **Decision**: Implement data downsampling (e.g., LTTB) for Recharts and DOM virtualization (`@tanstack/react-virtual`) for the AI Chat pane.
- **Rationale**: Prevents DOM node explosion on dense dashboards and limits memory bloat during long generative AI chat sessions.

## Risks / Trade-offs

- **Risk: XSS via AI Generation & Strategy Inputs** -> AI markdown or rich text could execute malicious scripts if rendered directly.
  - **Mitigation**: Strictly sanitize all AI outputs and user inputs using `DOMPurify`. Ban `dangerouslySetInnerHTML` globally without explicit security review.
- **Risk: Broken Object Level Authorization (BOLA/IDOR)** -> Debounced background syncing could allow attackers to manipulate canvas IDs and overwrite other tenants' data.
  - **Mitigation**: Backend MUST perform strict authorization checks on every sync request against the authenticated user's permissions.
- **Risk: Excessive Data Exposure** -> APIs returning full database objects for simple dashboard views.
  - **Mitigation**: Use strict Data Transfer Objects (DTOs) from the backend, returning only the properties required by the frontend view.
