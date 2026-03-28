## Context

We use the Exa API for search capabilities (like discovering competitors, finding market news, etc.). Our existing logic allows a user to provide their own key, but otherwise defaults to a primary `.env` key. If that `.env` key hits a rate limit or runs out of credits, search queries fail.

To improve reliability, we're adding a fallback EXA API key to our `.env` configuration, which the application will utilize if the user hasn't provided their own key.

## Goals / Non-Goals

**Goals:**

- Add a secondary fallback EXA API key to `.env`.
- Modify the API caller logic to prefer the user's key, fallback to the new secondary key, and finally default to the primary key.
- Provide a seamless fallback mechanism to avoid search failures when a single key hits limits.

**Non-Goals:**

- Implement complex key rotation or round-robin strategies.
- Manage rate limit pooling for multiple keys within the same workspace.

## Decisions

**1. API Key Fallback Order**

- **Decision**: The API key retrieval logic will be updated to check `getCustomApiKey("exa")`, then `process.env.VITE_EXA_API_KEY_SECONDARY`, and finally `process.env.EXA_API_KEY`.
- **Rationale**: User keys should always have highest priority to preserve platform limits. The new secondary key acts as the immediate fallback before exhausting the legacy primary key.
- **Alternatives Considered**:
  - _Random Selection_: Randomly selecting between the `.env` keys. Rejected because we prefer predictable consumption of the new secondary key first.

## Risks / Trade-offs

- **Risk: Unused Key Management** -> Over time, managing multiple keys in `.env` could get cluttered.
- **Mitigation**: Document the exact environment variables expected in the `.env.example` file and limit the fallback depth to two keys for now.
