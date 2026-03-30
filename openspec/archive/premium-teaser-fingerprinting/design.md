# Design

## Context

The "Reverse Demo Hook" needs premium models to showcase value. But without strict limits, malicious users can bankrupt the platform via Denial of Wallet attacks. Firebase Anonymous auth limits are easily circumvented.

## Goals & Non-Goals

- **Goals:** Restrict anonymous premium usage to 3 runs per device/network. Survive cookie clearing and incognito mode. Protect endpoints with Firebase App Check.
- **Non-Goals:** Long-term cross-session tracking of unauthenticated users (must remain GDPR compliant).

## Decisions

- **Fingerprint Algorithm:** SHA-256 hash of IP + User-Agent + Accept-Language + Daily Salt.
- **Salt Rotation:** Use a daily rotating salt to make the fingerprint ephemeral. It cannot be reverse-engineered or used across multiple days, aligning with GDPR data minimization.
- **App Check:** Strictly mandate Firebase App Check verification middleware to neutralize programmatic bot abuse.

## Risks & Trade-offs

- **Cost vs Conversion:** Accepting a higher marginal cost per anonymous user in exchange for a higher PQL conversion rate.
- **Fingerprint Collisions:** Users behind the same NAT/IP with identical browser versions may share a fingerprint. This may block legitimate users prematurely, but is an acceptable trade-off to stop DoW.

## Future Potential

- Dynamic rate limits based on IP reputation.
- Fallback to CAPTCHA if a fingerprint reaches its limit due to a suspected collision.
