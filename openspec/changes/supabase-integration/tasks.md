## 1. Setup & Auth Bridge

- [x] 1.1 Scaffold OpenSpec feature files for the Supabase Integration
- [x] 1.2 Create Firebase Cloud Function to inject `role` and `team_id` custom claims into the JWT.
- [x] 1.3 Update Supabase client initialization to pass the Firebase JWT dynamically.

## 2. Security & RLS

- [x] 2.1 Update database migrations to include `team_id` columns.
- [x] 2.2 Implement strict RLS policies (Tenant isolation + Firebase Project ID restriction).

## 3. Local Development Fallback

- [x] 3.1 Implement graceful fallback in UI components when Supabase is unreachable locally.

## 4. Documentation

- [x] 4.1 Write the Deployment Guide (`docs/deployment/SUPABASE_FIREBASE_GUIDE.md`).
