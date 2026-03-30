# Proposal

## Why

The platform relies on a "Reverse Demo Hook" Product-Led Growth (PLG) strategy where users experience the core value before signing up. To maximize the "endowment" value and conversion rates, this teaser flow must output the highest quality results. Currently, cost-containment rules limit anonymous users to cheaper models and shallow searches.

Upgrading the anonymous flow to use `gemini-3.1-pro-preview` and `exa.searchAndContents` will dramatically improve the perceived value. However, because Firebase Anonymous Auth is easily bypassed by simply clearing browser cookies or using incognito mode, exposing expensive premium models unauthenticated introduces severe Denial of Wallet (DoW) risks. We need a robust, privacy-preserving fingerprinting mechanism to strictly enforce a 3-run limit per user device/network, regardless of cookie state.

## What Changes

1. Upgrade `/api/scoring/stream` endpoint to utilize `gemini-3.1-pro-preview` and `exa.searchAndContents` for anonymous users.
2. Implement `generateAnonymousFingerprint` utility combining `req.ip` + `req.headers['user-agent']` + `req.headers['accept-language']` with a daily rotating salt via SHA-256.
3. Track usage limits in Firestore (`anonymous_usage_limits/{fingerprintHash}`).

## Capabilities

- `premium-anonymous-teaser`
- `fingerprint-pql-gating`

## Impact

Significantly improved PQL conversion rates by providing premium outputs to anonymous users, while strictly capping financial exposure and DoW risk.
