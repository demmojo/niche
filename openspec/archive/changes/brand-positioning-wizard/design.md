# Design: Brand Positioning Wizard

## Context

Extracting website context requires scraping and LLM processing, which can take 30-120 seconds. Standard client-side HTTP calls will fail due to timeouts, serverless limits, or mobile tab suspensions. We need a robust asynchronous architecture alongside strict data sanitization to ensure security against malicious inputs and prompt injection.

## Goals

- Implement a non-blocking 202-Accepted asynchronous job queue for scraping and extraction.
- Ensure strict frontend and backend concurrency safety, including React 19 tearing mitigation.
- Extract precise JSON configurations using LLM Structured Outputs and Chain of Thought.
- Maintain absolute security: SSRF prevention, XSS mitigation (DOMPurify), and backend-only API keys.

## Non-Goals

- Building a general-purpose web crawler. (Strictly limited to 3-5 user-provided URLs).
- Heavy React state tracking for UI drag-and-drop operations (we will use CSS transforms/Framer Motion instead to prevent layout thrashing).
- Over-engineered Local ML scoring algorithms (simplicity via standard X/Y placement).

## Architecture & Decisions

1. **Asynchronous ETL Pipeline:** The client sends URLs to an Express backend. The backend strictly validates the URLs, creates a `BrandWizardJob` in Firestore, and immediately returns a `202 Accepted` with a `jobId`. The client listens via `onSnapshot`.
2. **Generative Extraction:** The backend global queue processes the URLs using Firecrawl, passes the raw markdown to Gemini Flash, and forces a structured output using Zod schemas.
3. **Chain of Thought Optimization:** Gemini must output a `_reasoning` field first in the JSON schema to boost extraction accuracy and to populate "Transparent AI" hover popovers.
4. **Security & Validation:**
   - Input: Strict SSRF validation on URLs (blocking private IPs/localhost, enforcing HTTP/HTTPS).
   - Payload: Limit LLM inputs to 100KB to prevent bloat.
   - Access: Strict Firebase Security Rules (`userId == request.auth.uid`).
   - Rendering: Strict DOMPurify sanitization before rendering AI outputs to prevent XSS.

## Data Schema

```typescript
type HexColor = string;
type ToneEnum =
  | "Professional"
  | "Playful"
  | "Aggressive"
  | "Authoritative"
  | "Conversational";

interface BrandWizardJob {
  id: string;
  projectId: string;
  userId: string;
  status: "pending" | "processing" | "completed" | "failed";
  progress: { totalUrls: number; completed: number; failed: number };
  results?: WizardOutput;
  error?: string;
  createdAt: FirebaseFirestore.Timestamp;
}

interface CompetitorBrand {
  id: string;
  url: string;
  visual_identity: {
    logo_url: string | null;
    colors: { primary: HexColor[]; background: HexColor[] };
    typography: { headings: string[]; body: string[] };
  };
  positioning: {
    _reasoning: string;
    personality: string;
    tone: ToneEnum[];
    target_audience: string;
  };
}

interface ProjectBrandIdentity {
  project_id: string;
  userId: string;
  analyzed_competitors: CompetitorBrand[];
  ai_recommended_differentiation: {
    generated_axes: { x: string; y: string };
    market_gap: string;
    recommended_tone: ToneEnum[];
  };
  selected_identity: {
    visual_identity: { primary_color: HexColor; typography_pair: string };
    positioning: {
      personality: string;
      tone: ToneEnum[];
      target_audience_niche: string;
    };
  };
}
```

## Risks & Trade-offs

- **Firecrawl Cloudflare Blocks:** Scraping may fail with a 403. Trade-off: Graceful degradation (handle partial success without full retry loops) or fall back to Exa API entity summaries.
- **Prompt Injection:** Competitor sites may contain hidden injection payloads. Mitigation: Use strict delimiters and structured JSON parsing.
