# Proposal: NicheAI Modern Frontend Streaming Architecture

## Why

As the AI-native development ecosystem evolves, frontend engineering faces two core challenges: avoiding design homogenization ("AI Slop") and preventing severe UI fragility when handling massive generative data streams. Standard React component patterns are insufficient to support robust Generative UI.

## What Changes

This proposal mandates a core Frontend Infrastructure Refactor to support a new AI-native workflow. We are implementing robust React 19 concurrent streaming primitives, isolating Generative UI state from render cascades, supporting dynamic interactive components, and fully securing the AST markdown rendering pipeline.

## Capabilities

- **Generative UI:** Safe streaming of interactive UI components using Vercel AI SDK's `toolUI` and sandboxed Server Components.
- **Resilient Streams:** Bimodal state handling with "Die on Disconnect" capabilities to resolve background syncs transparently.
- **Safe Rendering:** AST sanitization with decoupled chunk ingestion to prevent main-thread locking.

## Impact

Drastically improved frontend performance during massive LLM token generation, enhanced security against hallucinated XSS attacks, and a clean, maintainable, "disposable" UI layer that AI coding agents can efficiently regenerate without breaking business logic.
