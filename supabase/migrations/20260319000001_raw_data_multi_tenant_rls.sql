-- Add team_id to existing tables
ALTER TABLE raw_data_assets ADD COLUMN IF NOT EXISTS team_id UUID NOT NULL;
ALTER TABLE raw_data_versions ADD COLUMN IF NOT EXISTS team_id UUID NOT NULL;
ALTER TABLE raw_data_inbox ADD COLUMN IF NOT EXISTS team_id UUID NOT NULL;

-- Indexes on team_id for fast filtering during RLS checks and standard queries
CREATE INDEX IF NOT EXISTS idx_raw_data_assets_team_id ON raw_data_assets(team_id);
CREATE INDEX IF NOT EXISTS idx_raw_data_versions_team_id ON raw_data_versions(team_id);
CREATE INDEX IF NOT EXISTS idx_raw_data_inbox_team_id ON raw_data_inbox(team_id);

-- Drop previous permissive policies
DROP POLICY IF EXISTS "Allow all on assets" ON raw_data_assets;
DROP POLICY IF EXISTS "Allow all on versions" ON raw_data_versions;
DROP POLICY IF EXISTS "Allow all on inbox" ON raw_data_inbox;

-- We assume that the JWT token will have the following custom claims:
-- {
--   "role": "authenticated",
--   "team_id": "...",
--   "iss": "https://securetoken.google.com/YOUR_FIREBASE_PROJECT_ID",
--   "aud": "YOUR_FIREBASE_PROJECT_ID"
-- }

-- 1. Restrictive Global Policy
-- This ensures that NO query can execute unless it comes from our specific Firebase project.
-- Replace 'YOUR_FIREBASE_PROJECT_ID' with your actual Firebase Project ID in production.
CREATE POLICY "Restrict access to correct Firebase project on assets"
  ON raw_data_assets
  AS RESTRICTIVE
  TO authenticated
  USING (
    (auth.jwt()->>'iss' = 'https://securetoken.google.com/YOUR_FIREBASE_PROJECT_ID')
    AND
    (auth.jwt()->>'aud' = 'YOUR_FIREBASE_PROJECT_ID')
  );

CREATE POLICY "Restrict access to correct Firebase project on versions"
  ON raw_data_versions
  AS RESTRICTIVE
  TO authenticated
  USING (
    (auth.jwt()->>'iss' = 'https://securetoken.google.com/YOUR_FIREBASE_PROJECT_ID')
    AND
    (auth.jwt()->>'aud' = 'YOUR_FIREBASE_PROJECT_ID')
  );

CREATE POLICY "Restrict access to correct Firebase project on inbox"
  ON raw_data_inbox
  AS RESTRICTIVE
  TO authenticated
  USING (
    (auth.jwt()->>'iss' = 'https://securetoken.google.com/YOUR_FIREBASE_PROJECT_ID')
    AND
    (auth.jwt()->>'aud' = 'YOUR_FIREBASE_PROJECT_ID')
  );


-- 2. Tenant Isolation Policies (Multi-tenant)
-- Ensure users can only interact with rows belonging to their team
CREATE POLICY "Users can view and edit their team's assets"
  ON raw_data_assets
  FOR ALL
  TO authenticated
  USING (team_id = (auth.jwt()->>'team_id')::uuid)
  WITH CHECK (team_id = (auth.jwt()->>'team_id')::uuid);

CREATE POLICY "Users can view and edit their team's versions"
  ON raw_data_versions
  FOR ALL
  TO authenticated
  USING (team_id = (auth.jwt()->>'team_id')::uuid)
  WITH CHECK (team_id = (auth.jwt()->>'team_id')::uuid);

CREATE POLICY "Users can view and edit their team's inbox"
  ON raw_data_inbox
  FOR ALL
  TO authenticated
  USING (team_id = (auth.jwt()->>'team_id')::uuid)
  WITH CHECK (team_id = (auth.jwt()->>'team_id')::uuid);

-- Ensure anon access is explicitly denied (implicitly denied by default, but good to be explicit if role changes)
-- The RESTRICTIVE policies above effectively block anon users because their JWT won't match, 
-- but we don't grant them any policies anyway.
