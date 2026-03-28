# Specification: Codebase Bug Hunt and Test Quality Review

## Detailed Features

### 1. React DOM Testing Patterns

- Use accessible queries (`getByRole`, `findByRole` for async elements, `getByTestId`). Scope with `within()` for complex UIs.
- Replace arbitrary timeouts and synchronous queries on deferred/animated elements with `await screen.findByRole()`.
- Implement a strictly-typed global `setupTests.ts` to intercept `console.error` requests using a predefined allow-list. Unrecognized errors must fail the test.

### 2. Coverage Exclusions & Config Gates

- Declare `provider: "v8"` in Vitest configs and define strict minimums inside `thresholds`.
- Ensure `...coverageConfigDefaults.exclude` is explicitly spread when overriding exclusions to avoid profiling `node_modules` and `.d.ts` files.

### 3. API Services & Fallbacks (Domain B)

- Implement Rate-Limit (HTTP 429) backoff/retry loops.
- Enforce strict validation that fallback requests (e.g., from Gemini to OpenAI) properly align prompt contexts and schemas.
- Wrap structured JSON parsing in `try/catch` and provide fallback handlers for partial or hallucinated responses.
- Enforce `AbortController` timeouts on all `fetch` requests.

### 4. CLI Tooling & DAG Circularity (Domain C)

- Utilize a Depth-First Search (DFS) tracking algorithm to detect cyclic dependencies in OpenSpec Graph structures (e.g., Spec A -> Spec B -> Spec C -> Spec A).
- Expose the exact cyclic recursion path in validation errors to ease debugging.
- Separate DAG graph building (producing an adjacency list `Record<string, string[]>`) from validation logic.

## Scenarios

**Scenario:** Unhandled external network requests

- **WHEN:** A Vitest test attempts to reach a production API directly.
- **THEN:** The MSW server is configured to `onUnhandledRequest: 'error'`, instantly throwing and failing the test.

**Scenario:** Asynchronous React element interaction

- **WHEN:** Testing a dialog or modal that mounts asynchronously.
- **THEN:** The testing logic relies on `await screen.findByRole('dialog')`, ensuring it does not crash on an initial synchronous pass.

**Scenario:** Zustand race condition management

- **WHEN:** An async operation is triggered inside a Zustand store while an identical request is already in-flight.
- **THEN:** Explicit state symbols (e.g., `STATE_LOADING`) prevent duplicate or overlapping network actions, avoiding direct data mutation via Immer or proper spread logic.

**Scenario:** GraphRAG builder hits a circular dependency

- **WHEN:** CLI tool scans files with mutually recursive links.
- **THEN:** The DFS path tracker isolates the loop and triggers an immediate script exit specifying the exact file sequence causing the cycle.
