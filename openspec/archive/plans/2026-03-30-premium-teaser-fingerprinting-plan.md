# OpenSpec Plan: Premium Teaser Fingerprinting

## 1. Why

The platform relies on a "Reverse Demo Hook" Product-Led Growth (PLG) strategy where users experience the core value before signing up. To maximize the "endowment" value and conversion rates, this teaser flow must output the highest quality results. Currently, cost-containment rules limit anonymous users to cheaper models and shallow searches.

Upgrading the anonymous flow to use `gemini-3.1-pro-preview` and `exa.searchAndContents` will dramatically improve the perceived value. However, because Firebase Anonymous Auth is easily bypassed by simply clearing browser cookies or using incognito mode, exposing expensive premium models unauthenticated introduces severe Denial of Wallet (DoW) risks. We need a robust, privacy-preserving fingerprinting mechanism to strictly enforce a 3-run limit per user device/network, regardless of cookie state.

## 2. What Changes

1. **Model & API Upgrades**:
   - Revert/Update the `/api/scoring/stream` endpoint (and related teaser endpoints) to utilize `gemini-3.1-pro-preview` and `exa.searchAndContents` for anonymous users.
2. **Fingerprint Generation Utility**:
   - Implement a new `generateAnonymousFingerprint` utility (e.g., in `src/server/utils/fingerprintUtils.ts`).
   - This utility will create a one-way cryptographic hash (e.g., SHA-256) combining `req.ip` + `req.headers['user-agent']` + `req.headers['accept-language']`.
   - Incorporate a **daily rotating salt** into the hash to ensure GDPR compliance (preventing long-term cross-session tracking of unauthenticated users).
3. **Usage Tracking**:
   - Use the generated fingerprint as the key to track usage limits (max 3 runs) in a Firestore collection (e.g., `anonymous_usage_limits/{fingerprintHash}`).
   - This replaces or augments the current `pqlCount` tracking that relies solely on the ephemeral anonymous Firebase UID.

## 3. Capabilities

- `premium-anonymous-teaser`
- `fingerprint-pql-gating`

## 4. Design & Architecture

### Cost-Containment vs. Conversion Trade-off

This architectural change explicitly deviates from standard strict cost-containment rules. It is a strategic product decision that accepts a higher marginal cost per anonymous user in exchange for a significantly higher Product-Qualified Lead (PQL) conversion rate. By gating it strictly at 3 runs, the maximum financial exposure per anonymous entity is capped at a known threshold.

### GDPR Compliance

By using a one-way cryptographic hash combined with a daily rotating salt (e.g., driven by the current date string or a daily updated secret), the fingerprint becomes ephemeral. It cannot be reverse-engineered to identify the user's IP address, nor can it be used to track the user across multiple days, aligning with GDPR data minimization and privacy-by-design principles.

### Security & Bot Mitigation

Because IP and header-based fingerprinting can still be spoofed or rotated by sophisticated scraping networks, **Firebase App Check is strictly mandated** for this flow. The backend must enforce App Check verification middleware to ensure requests are originating from our genuine, untampered frontend application, neutralizing programmatic bot abuse and protecting the premium LLM/Exa endpoints.
