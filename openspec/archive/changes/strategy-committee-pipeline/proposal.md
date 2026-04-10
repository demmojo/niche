# Proposal

## Why

Generating strategy from raw code `git diffs` on every push causes "split-brain" strategy drift and API token exhaustion. Strategy dictates code; code does not dictate strategy. Archiving an OpenSpec represents the single source of truth for completed strategic work, providing high-signal, human-verified context.

## What Changes

We are pivoting the trigger for automated strategy updates. Instead of running on every code push, the Strategy Committee pipeline will run when an OpenSpec is archived. It uses Gemini 3.1 Pro to synthesize `STRATEGY.md` and `README.md` updates based on the completed spec, and includes a Map-Reduce Coherence Drift Check to ensure documentation and the codebase remain aligned.

## Capabilities

- Translates completed OpenSpecs into high-level strategy updates safely.
- Mitigates GitHub Actions queue drops through a 24-hour active scan fallback mechanism.
- Performs a "Claim-Verification" Map-Reduce check to detect explicit codebase contradictions against active documentation.
- Safely injects text updates using predefined HTML anchors, eliminating file destruction.
- Automatically rebases and pushes updates with `[skip ci]` to prevent trigger loops.

## Impact

- **Token Efficiency**: Bypasses massive context-window blowouts from raw code diffs (e.g., `package-lock.json` changes).
- **Strategic Alignment**: Ensures documentation accurately reflects actual business intent and remains verified against the codebase without heavy RAG/VectorDB bloat.
- **Stability**: Eliminates CI race conditions and non-fast-forward Git push rejections through robust orchestration.
