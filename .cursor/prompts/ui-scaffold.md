# NicheAI UI Scaffolding Guidelines

## 1. Architectural Clarity

- Separate Developer-Facing (Build-Time) architecture (Layout Shells, Disposable JSX) from End-User-Facing (Run-Time) architecture (Vercel AI SDK).
- **Physical Boundary**: Layout shells must be human-owned parent files that statically `import` the AI-generated disposable child components.

## 2. Foundational Layout Shells

- Enforce the use of **foundational Layout Shells** (e.g., `<AsymmetricalShell>`) that are static, human-owned parent containers in the React tree.
- Use a `<design_system_mapping>` block to map tool calls to these shells.

## 3. Split React Contexts

- As a global constraint for all future development, strictly split React Contexts (separating state and dispatch) for global providers.

## 4. Context Bailout

- Explicitly forbid Zustand or Context for generative state entirely. Let the Vercel AI SDK own the stream state natively (`useChat` / `useCompletion`).

## 5. Form State

- Wire `useActionState` for forms and React 19 AbortControllers for standard fetch requests.
