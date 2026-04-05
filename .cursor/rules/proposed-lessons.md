## Extracted Lessons

- **Anti-Pattern**: Using `vi.unstubGlobal` instead of `vi.unstubAllGlobals()`. The `vi.unstubGlobal` function was removed in Vitest v1, leading to `TypeError: vi.unstubGlobal is not a function`.
- **Resolved Pattern**: Always use `vi.unstubAllGlobals()` when cleaning up global stubs in Vitest tests to prevent `TypeError`.
- **Concrete Reference**: `src/__tests__/workers/staticCrawlerWorker.test.ts`

- **Anti-Pattern**: Mocking `@google-cloud/storage` by attempting to capture `.value` on nested `vi.fn().mockImplementation` returns, which results in `TypeError: Cannot read properties of undefined (reading 'value')`.
- **Resolved Pattern**: When mocking external libraries where you need to inspect nested mock function calls (like `storage.bucket().file().save()`), expose a specifically assigned mock variable (e.g. `_fileMock`) in the `vi.mock` return block and explicitly import it into the test file to spy on it without relying on brittle `.mock.results` arrays.
- **Concrete Reference**: `src/__tests__/workers/staticCrawlerWorker.test.ts`

## Proposed Memory Updates

**Target:** `AGENTS.md`
**Action:** `Append`
**Content:**

```diff
+ - **Vitest Global Stubs**: Always use `vi.unstubAllGlobals()` instead of `vi.unstubGlobal` to clean up global mocks, as the latter was removed in Vitest v1 and causes `TypeError`.
+ - **Vitest Nested Mocks**: When mocking deep library chains (e.g. `@google-cloud/storage`'s `storage.bucket().file()`) where you must assert on a nested call, expose the inner `vi.fn()` as a named export from the `vi.mock` block (e.g., `_fileMock`) and import it directly. Do not attempt to traverse `Mock.mock.results[0].value`, as it is highly brittle and often undefined.
```

Do you approve these changes? (Yes/No)
