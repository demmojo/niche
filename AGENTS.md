## Learned User Preferences

- Strictly avoid Gemini 1.5 and 2.5 models; use gemini-3.1-pro for critical tasks and ensure machine learning best practices from Leeropedia are applied.
- Apply a "binary triage" mindset to backlog grooming: rigorously reject or archive over-engineered meta-tooling and infrastructure bloat to protect the lean MVP timeline.
- Always lint and type-check code after making edits.
- Use the CO-STAR (Context, Objective, Style, Tone, Audience, Response) framework for all responses, appending a concise CO-STAR Prompt Summary at the end.
- Prefer in-house implementations (e.g., using Gemini Flash for web scraping/data extraction) over paid external APIs like Firecrawl to minimize costs.
- Prefer Gemini 768D embedding models over OpenAI 1536D for `hybrid-scoring-tarpit-flywheel` and `intent-based-testing` architectural decisions.
- Build internal MVP analytics and dashboards directly into the app (e.g., via a superadmin sidebar) to enable dogfooding, rather than relying entirely on external BI tools.
- Ensure the primary Git author/committer email is set to `mo.hassaniv@gmail.com`.
- Mandate unit, integration, and intent-based testing for all new OpenSpec implementations, aiming for 80-100% coverage.
- Strictly avoid hardcoding API keys or configuration secrets; always manage them correctly via `.env` files.
- When documenting workflows, prioritize explaining the automated AI steps but always include the underlying manual CLI scripts at the end for developer reference.
- Maintain a comprehensive, up-to-date Master Document (e.g., `docs/nicheai-master-context.md`) to ground deeper research, product strategy, and architectural context.

## Learned Workspace Facts

- **OpenSpec Lifecycle & Validation**: Strictly manage files under `openspec/`, routing legacy `docs/` via `ingest.ts`. `ai-eval` is blocking (validates against SQLite DB), and collision detection fail-fasts. Ensure rollback mechanisms for DAG validation failures and finite retry loops for `ai-eval` auto-fixes.
- **OpenSpec Execution & Agent UX**: Respect task execution order and validate via tests before implementation. CLI tools are JSON-native and idempotent for agents, utilizing macro-commands (`propose`/`start`) and GraphRAG for context. Automate "Halt and Update" by pausing to ask for direction, rewriting the specs, presenting a markdown diff, and securely handing off re-validation to the user (`openspec start <feature>`).
- For user impersonation by superadmins, NicheAI uses a "Secondary Firebase App" approach with Custom JWT tokens containing `{ isImpersonated: true }` claims (via POST /api/superadmin/impersonate).
- The Exa MCP requires official local SDK/Smithery infrastructure; passing API keys in the URL and `use_autoprompt` are deprecated.
- For ML scoring in Node.js, the architecture rejects `SharedArrayBuffer` for synchronous operations, favoring pre-allocated `Float32Array` scratchpads and `Math.log1p`/`Math.min(max)` cmov V8 optimizations.
- Use React 19 `useTransition` carefully (re-wrap state updates after `await`), avoid boolean soup for hook states (use strict discriminated unions), and type-cast custom CSS variables as `React.CSSProperties`.
- Ensure Express 5.x compatibility by correctly handling strict payload limits and 413 error status codes.
- **Intent-Based Testing**: Use React Testing Library strictly (forbid `querySelector`, `act()` on `userEvent`, `waitFor` for sync assertions). Mock network layers with MSW (`AbortSignal` with delays, strict reset/close). Use Firebase Emulator Suite globally. Aim for >=90% local coverage via `@vitest/coverage-v8` and use Playwright with resilient selectors.
- For Firestore, mandate `runTransaction` for concurrent HITL merges, and implement Append-Only SCD Type 2 Taxonomy models. Rigorously validate LLM outputs and schema drift with Zod (use `z.discriminatedUnion`), preventing prompt injection with `replace(/[<>]/g, '')`.
- For long-running LLM/scraping pipelines, use an Asynchronous Job Queue pattern (return `202 Accepted` with `jobId`) and let the client subscribe via Firestore `onSnapshot`. Use bounded concurrency.
- Adopt Generative UI for dashboards (e.g., dynamically generated 2x2 matrix axes via LLM) to highlight hyper-specific market differentiation.
- NicheAI architecture supports managing multiple concurrent product ideas and forking existing products to test variations.
