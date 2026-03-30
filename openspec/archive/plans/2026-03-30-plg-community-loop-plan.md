# NicheAI PLG Community Acquisition Loop Strategy

## 1. Feature Naming

- **The Core Feed:** "The Discovery Engine" or "Niche Radar" (Recommended: **Niche Radar** – implies active scanning and high-value intelligence).
- **The Conversion Action:** "Claim this Niche" or "Lock this Market" (Recommended: **Lock this Market** – triggers strong loss aversion and territoriality).
- **The Lead Gen Action:** "Watch this Market" (for anonymous users who aren't ready to buy but want alerts if someone else locks it).
- **The SEO Artifact:** "Market Gap Report" (e.g., "B2B SaaS Market Gap Report for Dental Clinics").

## 2. Funnel Breakdown: The "Reverse Demo" Loop

This funnel uses the **Reverse Demo Hook** principle, allowing users to experience the "Aha!" moment before hitting a friction point.

1. **Top of Funnel (The Hook):** User lands on `nicheai.com`. Above the fold is a simple, massive input: _"Describe an audience or industry..."_ Below it is the **Niche Radar** feed showing live, anonymized niches discovered by others.
2. **The Generation (Endowment):** The user enters "Plumbers" and clicks Generate. **Crucial Codebase Rule:** To prevent Denial of Wallet (DoW) attacks, unauthenticated generations must use a lightweight model (Gemini Flash-Lite) or retrieve a pre-generated cached report. A ghost session is created with a 72-hour TTL in Firestore (`pqlState`).
3. **The Reveal (Teaser Mechanics):** The user sees a high-quality, beautifully designed Market Gap Report. They instantly feel ownership (The IKEA Effect).
4. **The Friction Point (Loss Aversion):** A banner appears: _"This Market Gap Report is currently public and indexable on the Niche Radar. Lock this market to make it private, reveal execution tactics, and protect your IP."_
5. **The Checkout (PQL Gate):** Clicking "Lock this Market" triggers the Firebase `signInAnonymously` to Auth conversion. **Codebase Rule:** We must use React 19 `useActionState` and an `isMergingRef` to prevent UI flicker during the dual-token account linking process.
6. **The Viral Loop:** If they don't lock it, prompt them to "Share this gap with a co-founder to get their thoughts."

## 3. The Teaser Mechanics (Reveal vs. Blur)

To maximize FOMO and drive checkout, the public/unlocked report must perfectly balance value and mystery.

**What is REVEALED (The "Why"):**

- The Market Name & Category (e.g., "Inventory Management for Mobile Pet Groomers").
- Total Addressable Market (TAM) estimates.
- High-level "Jobs to be Done" (JTBD).
- The "Tarpit Score" (showing it's a safe niche to build in).

**What is BLURRED / LOCKED (The "How"):**

- Exact Competitor Weaknesses (e.g., "Competitor X lacks offline mode, mentioned in 40% of negative G2 reviews").
- Step-by-step Go-to-Market (GTM) Strategy.
- Specific Long-tail SEO keywords to target.
- The "First 100 Customers" acquisition playbook.
- _UI Execution:_ Use CSS `backdrop-filter: blur(8px)` with a prominent padlock icon and a gradient overlay that fades the text into illegibility.

## 4. Viral & SEO Architecture (Programmatic SEO)

- **URL Structure:** `nicheai.com/reports/[industry-slug]/[niche-slug]` (e.g., `/reports/healthcare/mobile-phlebotomy-logistics`).
- **SSR & Indexing:** Public artifact pages must be fully Server-Side Rendered (SSR). Do not rely on client-side fetching for the public data, ensuring Google instantly indexes the visual structure and text.
- **Auto-Tagging:** An async background job automatically generates `<title>`, `<meta description>`, and JSON-LD schema data based on the user's prompt. Users _never_ manually write SEO metadata.
- **The "Gallery" Pages:** Aggregate niches into dynamic category pages (e.g., `nicheai.com/markets/b2b-saas`).
- **OpenGraph & Social Sharing:**
  - _Dynamic OG Images:_ Auto-generate an image showing the Niche Title, TAM, and a "Tarpit Score" dial in the green zone.
  - _Frictionless 1-Click Share:_ Pre-filled Twitter/LinkedIn copy: _"Just uncovered a massive underserved market gap in [Industry] using @NicheAI... Who wants to build this? [Link]"_
  - _Value Virality:_ Non-users clicking the link see the interactive report instantly, with a prominent CTA: _"Generate a Market Gap Report for your industry."_

## 5. Edge Cases & Protections

- **Preventing DoW (Denial of Wallet):** Unauthenticated Reverse Demos must NEVER invoke expensive APIs (Gemini 3.1 Pro/Exa). We use Firebase App Check (reCAPTCHA v3) on the Express BFF to block bot scripts from looping `signInAnonymously()`.
- **Scraping Protection:** The "Blurred" data must **NOT** be sent to the client in the JSON payload. The backend must strictly omit the GTM and competitor tactics fields unless the user's Firebase Auth token possesses the necessary claims/subscription. CSS blurring is only for visual teaser effect on dummy/placeholder text.
- **Niche Overlap (The "Collision" Rule):** If two users search for the exact same hyper-niche, the system checks the `pqlState` and public index. If User A has already "Locked" it, User B receives a message: _"This market gap has been locked by another founder. Here are 3 adjacent, untapped niches..."_ (Pivot to abundance).
- **Ghost Session Bloat:** Anonymous sessions generated by the viral loop are aggressively purged using a 72-hour TTL policy on the Firestore `pqlState` collection.
