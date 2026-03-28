## Learned User Preferences

- Strictly avoid Gemini 1.5 and 2.5 models; use gemini-3.1-pro for critical tasks and ensure machine learning best practices from Leeropedia are applied.
- Apply a "binary triage" mindset to backlog grooming: rigorously reject or archive over-engineered meta-tooling and infrastructure bloat (e.g., AST-driven drift healing) to protect the lean MVP timeline.
- Always lint and type-check code after making edits.
- Use the CO-STAR (Context, Objective, Style, Tone, Audience, Response) framework for all responses, appending a concise CO-STAR Prompt Summary at the end.
- Prefer in-house implementations (e.g., using Gemini Flash for web scraping/data extraction) over paid external APIs like Firecrawl to minimize costs.
- Prefer Gemini 768D embedding models over OpenAI 1536D for `hybrid-scoring-tarpit-flywheel` and `intent-based-testing` architectural decisions.
- Build internal MVP analytics and dashboards directly into the app (e.g., via a superadmin sidebar) to enable dogfooding, rather than relying entirely on external BI tools.

## Learned Workspace Facts

- OpenSpec files and plans are strictly managed under `openspec/` (including `openspec/plans/` and `openspec/brainstorms/`) rather than `docs/`. The `ingest.ts` script gracefully routes legacy paths. Avoid regressing the codebase by incorrectly implementing outdated plans.
- Unimplemented backlog items are formally tracked as 5-file OpenSpec directories in `openspec/changes/` rather than raw markdown plans. The true active backlog is identified by checking for unchecked tasks (`- [ ]`) in `openspec/changes/*/tasks.md`.
- For user impersonation by superadmins, NicheAI uses a "Secondary Firebase App" approach with Custom JWT tokens containing `{ isImpersonated: true }` claims (via POST /api/superadmin/impersonate).
- The Exa MCP requires official local SDK/Smithery infrastructure; passing API keys in the URL and `use_autoprompt` are deprecated.
- For ML scoring in Node.js, the architecture rejects `SharedArrayBuffer` for synchronous operations, favoring pre-allocated `Float32Array` scratchpads and `Math.log1p`/`Math.min(max)` cmov V8 optimizations for deterministic execution.
- Use React 19 `useTransition` carefully (re-wrap state updates after `await`), avoid boolean soup for hook states (use strict discriminated unions), and type-cast custom CSS variables as `React.CSSProperties`.
- Ensure Express 5.x compatibility by correctly handling strict payload limits and 413 error status codes.
- Follow intent-based testing methodologies with React Testing Library (RTL), and use `AbortSignal` listeners in MSW (Mock Service Worker) to prevent infinite delay memory leaks.
- For Firestore, mandate `runTransaction` for concurrent HITL merges, and implement Append-Only SCD Type 2 Taxonomy models. Rigorously validate LLM outputs and schema drift with Zod (use `z.discriminatedUnion`), preventing prompt injection with `replace(/[<>]/g, '')`.
- For long-running LLM/scraping pipelines, use an Asynchronous Job Queue pattern (return `202 Accepted` with `jobId`) and let the client subscribe via Firestore `onSnapshot`. Use bounded concurrency.
- Adopt Generative UI for dashboards (e.g., dynamically generated 2x2 matrix axes via LLM) to highlight hyper-specific market differentiation.
- NicheAI architecture supports managing multiple concurrent product ideas and forking existing products to test variations.
