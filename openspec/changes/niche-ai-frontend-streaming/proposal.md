# Proposal: Modern Frontend Streaming Architecture

## Why

As the AI-native development ecosystem evolves, frontend engineering faces two major challenges: avoiding design homogenization ("AI Slop") and preventing severe UI fragility when rendering massive generative streams. Traditional state management approaches fail under the weight of microscopic Server-Sent Event (SSE) updates, leading to main-thread blocking and poor UX.

## What Changes

This refactor overhauls the frontend infrastructure to implement robust React 19 concurrent streaming primitives, deeply integrate the Vercel AI SDK, isolate Generative UI state from render cascades, and highly secure the AST markdown rendering pipeline. It establishes the "Disposable JSX Pattern" and standardizes how interactive tool UIs are streamed safely.

## Capabilities

- **Logic Isolation:** Components are restricted to ~400 lines of code; business logic is extracted into colocated hooks to ensure the JSX layer remains "disposable" and easily regeneratable by AI.
- **Generative UI Empowerment:** Safe streaming of interactive UI components via Vercel AI SDK's `toolUI` patterns or sandboxed React Server Components.
- **Bimodal State Management:** Graceful handling of standard client disconnects with a "Die on Disconnect" UX pattern, relying on backend syncing rather than blocking overlays.
- **AST Security Guardrails:** Implementation of strict AST sanitization pipelines using an explicit allowlist and dropping dangerous node types to prevent XSS.

## Impact

The update eliminates UI thread-locking from fast-streaming tokens, completely mitigates XSS risks from hallucinated JSX, enhances UI performance during tab switching, and enables rich, dynamic components driven seamlessly by the LLM "AI Co-Founder."
