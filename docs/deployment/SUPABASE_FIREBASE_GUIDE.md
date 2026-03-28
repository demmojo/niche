# Supabase & Firebase Integration Guide

This guide details the hybrid architecture connecting Firebase Authentication to Supabase (PostgreSQL) for multi-tenant Row Level Security (RLS) support. This integration powers the Raw Data Library.

## 1. Architecture Overview

- **Frontend Authentication**: Handled natively by Firebase Auth.
- **Backend Custom Claims**: A Firebase Cloud Function (`onUserCreated`) injects a `role: "authenticated"` and `team_id` claim into the user's JWT.
- **Supabase Client**: The frontend dynamically passes the Firebase JWT via the `accessToken` option to Supabase.
- **Postgres RLS Security**:
  - A restrictive policy verifies `iss` and `aud` to guarantee the JWT belongs to _our_ Firebase project (preventing global Firebase token abuse).
  - Multi-tenant policies enforce `team_id` isolation.

## 2. Environment Variables

Your `.env` file should clearly separate Firebase and Supabase variables.

```bash
# Firebase (Public)
VITE_FIREBASE_API_KEY="..."
VITE_FIREBASE_AUTH_DOMAIN="..."

# Supabase (Public)
VITE_SUPABASE_URL="https://your-project.supabase.co"
VITE_SUPABASE_ANON_KEY="..."

# Supabase Backend only (do not expose to frontend)
SUPABASE_SERVICE_ROLE_KEY="..."
```

## 3. Deployment Checklist

When deploying to a new environment (Staging/Production), follow these steps strictly:

### A. Deploy Firebase Functions FIRST

You must deploy the custom claims Cloud Function _before_ any users register, otherwise their JWT will lack the `role` and `team_id` claims, and Supabase will reject their requests.

```bash
cd functions
npm run build
firebase deploy --only functions
```

### B. Configure Supabase Dashboard

1. Go to your Supabase Project Dashboard -> Authentication -> Providers.
2. Enable the **Firebase** third-party provider.
3. Input your Firebase Project ID (found in Firebase console settings).

### C. Update Migration Files

Open `supabase/migrations/20260319000001_raw_data_multi_tenant_rls.sql`.
Find and replace all occurrences of `YOUR_FIREBASE_PROJECT_ID` with your actual Firebase Project ID (e.g., `nicheai-prod`).
_If you fail to do this, the restrictive RLS policy will block all queries._

### D. Run Migrations

Deploy your schema and RLS policies to production.

```bash
supabase db push
```

## 4. Local Development

### Running the App Offline

If you do not need to work on the Raw Data Library, you do not need to run Supabase locally.
The frontend has a graceful fallback implemented. If Supabase throws a `TypeError: Failed to fetch`, the UI displays a yellow warning banner and switches to mock data automatically.

### Running Supabase Locally

If you _do_ need to work on Postgres features:

1. Make sure Docker is running.
2. Run `supabase start`.
3. Copy the Local `API URL` and `anon key` outputted by the CLI into your `.env.development`.
4. (Optional) If you experience TLS errors, run local Supabase CLI commands with `PGSSLMODE=disable`.
