## Context

The system needs to shift from a passive display into an active product strategy engine. The new methodologies are targeted at early-stage/pre-PMF products, requiring derisking through external market and competitor data rather than internal usage data.

## Goals / Non-Goals

**Goals:**

- Implement 5 data-driven strategic tools.
- Automate data ingestion using Exa API and Apollo.io.
- Ensure type-safe data lineage to trace ML insights back to verbatim quotes.
- Adopt a Clean & Modern UI aesthetic.

**Non-Goals:**

- Implementing a full Backend-For-Frontend (BFF) architecture in Phase 1 (will use local Firebase and mock data extensions initially).
- Complex time-decay algorithms for the MVP (using static scores initially).

## Decisions

**1. Background Data Sync Layer**

- **Decision**: Use `ExternalSignalsSyncJob` to pre-ingest and normalize external data (Exa, Apollo.io) into local Firebase/Supabase.
- **Rationale**: Prevents zero-latency issues in the UI and allows for complex ML pipelines (Constrained Decoding, BERTopic) to run asynchronously without blocking the user.
- **Alternatives Considered**:
  - _Lazy API Fetching_: Rejected due to slow UX and rate limit issues on the frontend.

**2. Type-Safe ML Insights**

- **Decision**: Define strict Zod discriminated unions and base `MLInsight` interfaces (confidenceScore, verbatimQuotes, isHumanVerified).
- **Rationale**: Mitigates hallucinations by enforcing explicitly verifiable data structures.
- **Alternatives Considered**:
  - _Monolithic Schemas_: Rejected as it leads to nullable fields and weak type guarantees.

## Risks / Trade-offs

- **Risk: Exa API Rate Limits & Latency** -> Fetching bulk intent data could be slow or hit tier limits.
- **Mitigation**: Cache responses deeply in Firebase/Supabase and perform background syncing periodically rather than synchronously on UI load.
