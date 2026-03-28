## Context

NicheAI orchestrates data from local state and external APIs. When data validation fails or APIs are unreachable, users need visibility into why a flow failed. The existing "Validate Data" only checked internal state structures (competitors, raw data sources, insights). We need to extend this to test the live connection to our external search provider (Exa API).

## Goals / Non-Goals

**Goals:**
- Rename the "Validate Data" button and underlying functions to "Check System" to reflect the broader scope.
- Add an external live ping to the Exa API using a lightweight request.
- Unify the reporting of local and external validations into the existing system logs.

**Non-Goals:**
- Validating every single third-party integration exhaustively.
- Creating a separate dashboard for system health.

## Decisions

1. **Exa API Validation**: 
   - **Decision**: Perform a lightweight `POST /search` to `https://api.exa.ai/search` with a dummy query (e.g., "test") and `numResults: 1`.
   - **Rationale**: Proves the API key is valid and the service is responding without consuming excessive credits.
2. **Key Fallback**:
   - **Decision**: Try multiple keys (custom `getCustomApiKey('exa')`, `.env`, and hardcoded fallbacks).
   - **Rationale**: Ensures the system check works robustly across different deployment environments and user setups.
3. **Log Integration**:
   - **Decision**: Append the results of the external ping directly to the existing `addLog` pipeline used for local data validation.
   - **Rationale**: Keeps the UI unified and avoids building a separate health check component.

## Risks / Trade-offs

- **Risk:** Exa API ping consumes credits.
  - **Mitigation:** Use a very small limit (`numResults: 1`) to minimize credit usage.
