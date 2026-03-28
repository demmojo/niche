## Why

We rely on Exa API for search capabilities (like competitor discovery and news aggregation). Currently, if the primary API key is exhausted or encounters issues, we do not have a robust fallback mechanism. Adding a secondary EXA API key ensures our system remains functional for end-users when their own key isn't provided or our primary key fails/runs out of quota.

## What Changes

We are introducing a secondary Exa API key to be used as a fallback in our code.
The priority for API keys will now be:

1. User's custom API key (via settings)
2. The new secondary EXA API key (from `.env` as `VITE_EXA_API_KEY_SECONDARY`)
3. The original primary EXA API key (from `.env` as `EXA_API_KEY`)

## Capabilities

### Modified Capabilities

- `search-api`: The search module using Exa will now use a priority queue of API keys instead of defaulting exclusively to `process.env.EXA_API_KEY`.

## Impact

- The `App.tsx` module, where Exa API calls and validation occur, is updated.
- The `.env` configuration requires the new key variable `VITE_EXA_API_KEY_SECONDARY`.
