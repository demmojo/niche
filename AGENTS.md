## Learned User Preferences

- **Model Selection**: Strictly avoid Gemini 1.5/2.5. Use `gemini-3.1-pro` for critical tasks and automated evaluations. Prefer Gemini 768D embedding models over OpenAI 1536D. Apply Leeropedia machine learning best practices.
- **Product Philosophy**: Build a "Minimum Lovable Product" (MLP). Apply a "binary triage" mindset to backlog grooming—rigorously reject over-engineered meta-tooling and infrastructure bloat to protect timelines.
- **UX & Growth Strategy**: Prioritize best-in-class UX/UI with no data loss on shutdown. Leverage a "Reverse Demo Hook" PLG strategy (optimistic AI outputs followed by user curation funneling to a PQL gate).
- **Transparency & Logging**: In user-facing UI and logs, display the semantic action taken rather than the specific tool/API used. Make technical details (like API responses) collapsible.
- **Development Standards**: Always lint and type-check code after edits. Mandate unit, integration, and intent-based testing for all new OpenSpecs (80-100% coverage).
- **Security & Config**: Strictly avoid hardcoding API keys or secrets; manage via `.env` files. Ensure the primary Git author/committer email is set to `mo.hassaniv@gmail.com`.
- **Response Framework**: Use the CO-STAR (Context, Objective, Style, Tone, Audience, Response) framework for all responses, appending a concise CO-STAR Prompt Summary at the end.
- **In-House Preference**: Prefer in-house implementations (e.g., Gemini Flash for web scraping/data extraction) over paid external APIs like Firecrawl to minimize costs.
- **Dogfooding & Analytics**: Build internal MLP analytics and dashboards directly into the app (e.g., via a superadmin sidebar) to enable dogfooding rather than relying entirely on external BI tools.
- **Documentation**: Maintain a comprehensive Master Document (e.g., `docs/nicheai-master-context.md`). Prioritize explaining automated AI steps alongside manual CLI scripts.
- **Knowledge Management**: Consistently document 'Anti-Patterns' paired with 'Resolved Patterns' while aggressively deleting stale facts to prevent "Split-Brain" contradictions.

## Learned Workspace Facts

- **OpenSpec Workflow**: Manage files under `openspec/`. List files with full extensions to prevent DAG hallucinations. Archival strictly requires `learnings_extracted: true`. For AI-native specs, frame validations as manual end-to-end simulations.
- **OpenSpec Execution**: Respect task order, use GraphRAG. Automate 'Halt and Update' for re-validation. When parsing terminals, use `tail`/`grep` to avoid LLM context exhaustion.
- **Frontend & UX**: Handle React 19 'Snapshot Beats the Fetch' race conditions. Implement Generative UI for dashboards. Use Explainable States (`aria-live="polite"`) for screen readers instead of generic spinners.
- **Testing Standards**: Mandate RTL+MSW, Firebase Emulators, Playwright. Prove JSON stream parsers mathematically via `fast-check`. Mid-stream `AbortController` cancellations must gracefully degrade without fatal Error Boundaries.
- **Vitest & Firebase**: Global Vitest teardown must terminate `globalThis.firestoreInstance` and delete the Firebase app instance to prevent CI memory leaks.
- **LLM Evaluation (CI/CD)**: Use `stochastic-eval.yml` with `measureVariance` statistical runners for non-deterministic iterations. Use `gemini-3.1-pro` (`evaluatePairwise`) as an automated Pairwise Judge for pre-merge PR gating.
- **LLM Safety & Outputs**: Validate LLM outputs/schema drift with Zod discriminated unions. Prevent prompt injection using regex `replace(/[<>]/g, "")`.
- **Vitest Mocking & Timers**: When mocking `firebase-admin`, avoid `.default` fallbacks. For MSW + fake timers, enforce `vi.runOnlyPendingTimers()` and `vi.useRealTimers()` in `afterEach`. Avoid exact string assertions on Zod errors.
- **Firestore Patterns**: Mandate `runTransaction` for concurrent HITL merges. Implement Append-Only SCD Type 2 Taxonomy models.
- **Backend Architecture**: Long-running LLM/scraping pipelines use Async Job Queue (`202 Accepted` + `jobId`) with client `onSnapshot` subscriptions. Node.js needs Express 5.x compatibility. ML scoring favors `Float32Array` scratchpads.
- **Auth & State**: User impersonation uses a "Secondary Firebase App" with Custom JWT tokens (`{ isImpersonated: true }`).
- **External Integrations**: Exa MCP requires official local SDK/Smithery. System supports Bring-Your-Own-Key (BYOK) for Exa/Crunchbase, storing data in the raw data library.
- **Product Architecture**: Supports managing multiple concurrent product ideas and forking existing products to test variations.
