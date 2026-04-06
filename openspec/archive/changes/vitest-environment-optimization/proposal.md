# Proposal

## Why

The current Vitest test suite runs entirely in the heavy `jsdom` environment, causing high memory usage, slow execution times, and potential memory leaks due to lingering runner processes.

## What Changes

We will selectively run non-UI tests (utils, server, firestore, workers) in the lighter and faster `node` environment. We will also implement correct termination for forked worker processes to prevent memory leaks.

## Capabilities

- Selective test environment routing via Vitest configuration and inline pragmas.
- Automatic test worker cleanup on parent runner disconnect.

## Impact

- **Duration**: Execution time reduced by nearly 40% (~200s down to ~121s).
- **Memory**: Max heap usage per test drops from ~50MB to ~30MB.
- **Stability**: Elimination of zombie memory leaks.
