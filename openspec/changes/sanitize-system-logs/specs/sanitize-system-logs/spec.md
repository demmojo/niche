# Sanitize System Logs

This feature implements the hiding of specific vendor names and internal HTTP status codes in the System Logs UI, restricts raw JSON data to superadmins, and adds a simple retry mechanism for data enrichment calls.

## Features

### 1. Hide Context and Response Details

- **Requirement:** In the System Logs UI (`src/App.tsx`), the `<details>` blocks containing `contextData` and `apiCallDetails` must only be rendered if the `isSuperadmin` boolean is true.

### 2. Sanitize Log Messages

- **Requirement:** Any string passed to `updateLog` representing Apollo enrichment (or other third-party tools) must be sanitized. For example, change `"Could not fetch Apollo data for "` to `"Could not fetch competitor data for "` and remove the HTTP status code (e.g., `(Status: 422)`).

### 3. Add 1-Retry Mechanism

- **Requirement:** When fetching data from third-party APIs (like Apollo), the application must catch errors or non-200 responses and retry the request at least once with a short delay before failing and logging a warning.

## Scenarios

- **WHEN** a non-superadmin user views the System Logs,
- **THEN** they should not see "View Context Data" or "View Response Details" sections.

- **WHEN** an API call fails to enrich competitor data,
- **THEN** the log message should read "Could not fetch competitor data for [domain]. Skipping enrichment." without mentioning the vendor or status code.

- **WHEN** the enrichment API returns a transient error (e.g. 422),
- **THEN** the system must retry the request once before skipping and logging the error.
