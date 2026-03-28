## Why

We recently added a Postgres database (Supabase) to support the Raw Data Library. Since our primary authentication and multi-tenant data segmentation (teams/orgs) happens via Firebase, we need to securely bridge Firebase Auth to Supabase Postgres. Without proper Row Level Security (RLS) driven by Firebase JWTs, data leakage across teams could occur, and we'd be vulnerable to unauthorized access via generic Firebase tokens from other projects. Additionally, local development without Supabase running needs to gracefully fall back so developers can continue working on pure Firebase features.

## What Changes

1. **Database Multi-tenancy**: Adding `team_id` to `raw_data_assets`, `raw_data_versions`, and `raw_data_inbox`.
2. **Supabase Client**: Updated to intercept and pass the current Firebase user's JWT token dynamically.
3. **Firebase Cloud Functions**: A new blocking function or `onCreate` trigger will inject `role` and `team_id` into the user's custom claims.
4. **Database RLS**: Strict policies validating `iss` and `aud` corresponding to our exact Firebase project ID, and multi-tenant checks mapping `team_id` from the JWT.
5. **UI Fallback**: Wrapping Supabase fetch logic in graceful try-catches with custom banners indicating when the local database is offline.

## Capabilities

### New Capabilities

- `supabase-auth-bridge`: Authenticates requests to Supabase directly using Firebase JWTs without managing dual login sessions.
- `local-dev-fallback`: Disables raw data fetching and displays a warning banner when Supabase is unreachable (e.g., `supabase start` was not run).

### Modified Capabilities

- `raw-data-storage`: Tables will now restrict read/write access so only users with a matching `team_id` custom claim can access them.

## Impact

- **Database**: New columns and new RLS policies for Raw Data Library tables.
- **Client UI**: Supabase fetchers now explicitly handle `TypeError: Failed to fetch`.
- **Firebase Functions**: New auth trigger.
- **Documentation**: New deployment guide (`docs/deployment/SUPABASE_FIREBASE_GUIDE.md`).
