## Context

When combining Firebase Auth with Supabase PostgreSQL, we need to enforce multi-tenant isolation since the Raw Data Library relies heavily on Postgres (pgvector) and JSONB indexing. Firebase uses a shared pool of RSA signing keys globally across all projects, which means any valid Firebase JWT can theoretically be passed to our Supabase database. We must lock down our database so only _our_ project's users, grouped by `team_id`, can access the appropriate data. Furthermore, developers working on frontend features that do not use Supabase need a seamless fallback so they aren't forced to spin up the local Docker environment when it's unnecessary.

## Goals / Non-Goals

**Goals:**

- Use Firebase JWTs to securely authenticate requests to Supabase.
- Enforce strict Postgres RLS checking `iss`, `aud`, and `team_id` custom claims.
- Gracefully handle `TypeError: Failed to fetch` in UI components when the local Supabase environment is offline.
- Document deployment and configuration comprehensively.

**Non-Goals:**

- Replacing Firebase Auth with Supabase Auth entirely.
- Fully migrating the entire application's data layer to Postgres.

## Decisions

**1. Firebase Auth Bridge (Custom Claims)**

- **Decision**: Inject `role: 'authenticated'` and `team_id` into the user's custom claims using a Firebase Cloud Function upon user creation.
- **Rationale**: Providing `team_id` inside the JWT prevents complex and slow `JOIN` operations inside RLS policies. The `role` claim is natively required by Supabase to process the JWT effectively.
- **Alternatives Considered**:
  - _Lookup mapping table inside Postgres_: Slower and requires complex `SECURITY DEFINER` functions in Postgres. Since team structure in Firebase can be slow-moving, adding it to claims is sufficient.

**2. Restrictive RLS**

- **Decision**: All public schema tables mapped via REST API will have a global restrictive policy requiring `iss` and `aud` to match the project's ID.
- **Rationale**: Prevents a malicious actor from creating a separate Firebase project and using its valid tokens against our Supabase endpoint.

**3. Graceful Fallback Strategy**

- **Decision**: Update `RawDataLibraryTabular` and `ApprovalInbox` to catch network fetch failures and display a "⚠️ Local Database Offline" banner with mocked fallback data when `NODE_ENV === 'development'`.
- **Rationale**: Avoids a hard crash and poor developer experience.

## Risks / Trade-offs

- **Risk: Custom Claims Latency** -> New users might experience a slight delay before their `team_id` custom claim propagates, requiring a token force-refresh.
- **Mitigation**: Implement a token force-refresh logic on the client immediately after signup and team association.
