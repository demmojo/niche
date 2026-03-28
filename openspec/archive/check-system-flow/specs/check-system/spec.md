# Check System Flow Specification

## Overview
This specification details the transformation of the "Validate Data" flow into a comprehensive "Check System" validation sequence, extending validation to external APIs.

## Requirements

### UI Changes
- The button previously labeled "Validate Data" must be relabeled "Check System".
- The button tooltip must be updated to "Check data integrity and validate external systems".

### Core Functionality
- `runDataValidation` must be renamed to `runSystemCheck`.
- The function must remain asynchronous and continue to validate local state (`competitors`, `rawDataSources`, `derivedInsights`).
- After local validation, the function must perform a live external API check against Exa (`https://api.exa.ai/search`).
- The Exa check must attempt to use a list of available API keys in sequence (custom keys, environment variables, fallbacks).
- If the external API responds with a 200 OK, a success log must be appended to the system log.
- If the external API fails (e.g., 401 Unauthorized or network error), an error log must be appended to the system log.

### Logging
- Use the existing `addLog` function to report both local data validation issues and external API check results.
- Example success log: `System Check - External API validation successful (Exa API).`
- Example error log: `System Check - External API validation failed (Exa API).`