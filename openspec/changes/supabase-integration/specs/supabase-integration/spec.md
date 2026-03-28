# Supabase Integration & Security Plan

Implement multi-tenant (team/org) security using Firebase Auth JWTs on our Supabase Postgres instance, alongside a graceful fallback mechanism for local development.

## Features

### 1. Firebase Auth Custom Claims Injection

- **Requirement:** A Firebase Cloud Function (`beforeUserCreated` or `onCreate`) that mints the custom claims `{ role: 'authenticated', team_id: string }` and assigns them to the newly registered user's JWT.

### 2. Restrictive RLS and Multi-tenant Tables

- **Requirement:** Update the Postgres migrations to include the `team_id` column on the `raw_data_assets`, `raw_data_versions`, and `raw_data_inbox` tables.
- **Requirement:** Implement a restrictive Postgres policy ensuring `iss` and `aud` match the specific Firebase project.
- **Requirement:** Add `team_id = (auth.jwt()->>'team_id')::uuid` policies.

### 3. Graceful UI Degradation for Supabase

- **Requirement:** Detect `Failed to fetch` connection errors thrown by the Supabase client when the local database isn't running. Show a prominent warning banner and display mock data instead of causing a blank screen.

### 4. Deployment Guide

- **Requirement:** Provide `docs/deployment/SUPABASE_FIREBASE_GUIDE.md` detailing the integration architecture, environment variables, Firebase Function deployment, and Supabase Third-Party Auth setup.

## Scenarios

- **WHEN** a user logs in via Firebase and opens the Raw Data Library
- **THEN** the frontend automatically passes the Firebase `getIdToken()` to Supabase, which enforces the `team_id` RLS policy without requiring a separate Supabase login.

- **WHEN** a local developer hasn't run `supabase start` but runs `npm run dev`
- **THEN** the Raw Data Library page catches the error and displays a non-fatal warning banner: "⚠️ Local Database Offline: Run `supabase start`", allowing the developer to continue working on other Firebase features.

- **WHEN** a malicious user tries to use a valid Firebase token from another app
- **THEN** Postgres RLS rejects the query because the token's `iss` and `aud` do not match our registered Firebase Project ID.
