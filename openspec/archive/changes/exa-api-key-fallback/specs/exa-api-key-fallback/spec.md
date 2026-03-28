# EXA API Key Fallback

Implement a secondary fallback EXA API key in `.env` and use it in our application when the user does not provide their own custom EXA API key.

## Features

### 1. EXA API Configuration

- **Requirement:** Update `.env` to include the `VITE_EXA_API_KEY_SECONDARY` environment variable.

### 2. EXA API Client Logic

- **Requirement:** The `App.tsx` module must check the following priority order for the EXA API key:
  1. `getCustomApiKey("exa")`
  2. `process.env.VITE_EXA_API_KEY_SECONDARY`
  3. `process.env.EXA_API_KEY`

## Scenarios

- **WHEN** the user has a custom EXA API key configured.
- **THEN** the application uses the custom EXA API key.

- **WHEN** the user does NOT have a custom EXA API key configured.
- **THEN** the application falls back to `VITE_EXA_API_KEY_SECONDARY`.

- **WHEN** the user does NOT have a custom EXA API key configured AND `VITE_EXA_API_KEY_SECONDARY` fails or is not present.
- **THEN** the application falls back to `EXA_API_KEY`.
