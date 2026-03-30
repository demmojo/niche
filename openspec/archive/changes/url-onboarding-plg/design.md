## Context

Our current PLG flow relies on users typing their idea into a text field. However, many users arrive with a competitor in mind or an existing product they want to pivot from. Allowing URL input accelerates onboarding. To maintain security and control costs, we must follow NicheAI architectural rules: no Exa or expensive Gemini 3.1 Pro calls for unauthenticated users, strictly use in-house scraping with Gemini Flash, and enforce Firebase App Check to stop bot loops.

## Goals / Non-Goals

**Goals:**

- Implement a "Reverse Demo" UX where users get immediate value from a URL before signing up.
- Enforce DoW (Denial of Wallet) protection using PQL state tracking in Firestore.
- Use Gemini Flash-Lite for fast, low-cost extraction for anonymous users.
- Ensure seamless account linking via Firebase Auth without UI flicker.

**Non-Goals:**

- Full deep-dive competitor mapping via Exa for unauthenticated users (Exa is reserved for authenticated users).
- Complex custom scraping infrastructure (e.g., Firecrawl or Puppeteer). We will rely on simple HTTP fetches and Gemini Flash.

## Decisions

**1. Scraping Architecture**

- **Decision**: Use an in-house HTTP fetcher combined with Gemini Flash-Lite to extract text from the URL and return initial JTBD and pivots.
- **Rationale**: Complies with `AGENTS.md` mandate to avoid paid external APIs like Firecrawl and keeps anonymous invocation costs near zero.
- **Alternatives Considered**:
  - _Firecrawl_: Rejected due to cost and third-party dependency.
  - _Exa_: Rejected for anonymous users as it is an expensive API meant for deep competitor validation, not initial "teasers".

**2. Anonymous PQL Enforcement**

- **Decision**: Use Firebase Anonymous Auth + App Check. Store interaction counts in a `users/{uid}/pqlState` document with a 72-hour TTL.
- **Rationale**: Prevents malicious bot looping while allowing legitimate users to try the "Reverse Demo".
- **Alternatives Considered**:
  - _IP-based rate limiting_: Rejected because it is easily spoofed and punitive to shared networks.

**3. "Explainable State" Loading UI & Streaming Approach**

- **Decision**: Stream intermediate processing states via SSE. The HTTP fetcher will extract immediate, verifiable metadata (e.g., `<title>`, word count) and stream that to the UI instantly to prove the site was read, before the LLM finishes processing.
- **Rationale**: Replaces generic spinners, increasing "Time-to-Trust" per `AGENTS.md` and PLG best practices.
- **Decision**: We will use a standard SSE endpoint for this teaser (bypassing Cloud Tasks) _because_ we are using Gemini Flash-Lite for a short extraction, meaning it is fast enough to execute safely within the Cloud Run HTTP lifecycle timeout without scaling to zero.

**4. Safety and Reliability**

- **Decision**: Enforce prompt injection stripping (using regex `replace(/[<>]/g, "")`) on the scraped content before passing to the LLM.
- **Decision**: Use strict Zod discriminated unions to validate the Gemini JSON output.
- **Rationale**: Required by `AGENTS.md` to prevent prompt injection and schema drift.
- **Decision**: Use a backend `AbortController` linked to `req.on('close')` to cancel Exa/Gemini requests if the client disconnects, set `X-Accel-Buffering: no` for reliable SSE routing, and ensure safe JSON string replacement in the frontend parser (`chunk.replace(/^data:\s*/, "")`).

## Risks / Trade-offs

- **Risk: HTTP Fetching blocked by Cloudflare/Bot protection** -> Many modern sites block simple `fetch` requests.
- **Mitigation**: Handle fetch errors gracefully by falling back to asking the user to copy-paste a snippet of the site, or using a very lightweight proxy if necessary.

## Future Potential & Wow Features

- **Automated Competitor Matrix Generation**: Once the user authenticates, they could click one button to trigger the full `exa.searchAndContents` pipeline against the URL they provided, generating a comprehensive competitor landscape and plotting orthogonal distance in a visual 2D graph.
- **Architectural / Design To-Do**: Implement a generic server-side caching layer for frequently submitted popular URLs (e.g., scraping `notion.so` once and caching the JTBD for all future anonymous users) to achieve zero-latency responses.
