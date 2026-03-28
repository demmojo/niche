# AI Client Sequence Flow

The application integrates with several LLM providers (Gemini, Claude, OpenAI) to process market data and generate insights. Because these calls are asynchronous, expensive, and subject to rate-limiting, we employ an orchestration layer that handles retries, state fallback, and UI resolution.

```mermaid
sequenceDiagram
    actor User
    participant Component as InsightEngineChat
    participant State as Local React State
    participant Sync as useFirebaseSync / DB
    participant AIClient as aiClient / geminiClient (SDK)
    participant Provider as External LLM (e.g., Gemini)

    User->>Component: Submits prompt "Analyze this data"
    Component->>State: setisTyping(true), append user message
    Component->>AIClient: call fetchAIResponse(context, prompt)

    activate AIClient
    AIClient->>Provider: HTTP Request (Prompt + Context)

    alt Happy Path (Success)
        Provider-->>AIClient: 200 OK (Generated JSON/Markdown)
        AIClient-->>Component: returns Structured Data
        Component->>State: setisTyping(false), append AI message
        Component->>Sync: save chat history (debounced)
        Sync-->>User: UI updates instantly, syncs in background

    else 429 Too Many Requests (Rate Limit)
        Provider-->>AIClient: 429 Rate Limited
        AIClient->>AIClient: withKeyRotation catches Error
        AIClient->>Provider: Retry with fallback key / Lite model
        Provider-->>AIClient: 200 OK (from Fallback)
        AIClient-->>Component: returns Structured Data
        Component->>State: resolve UI normally

    else Hard Failure / Offline / 504
        Provider-->>AIClient: Network Error / Timeout
        AIClient-->>Component: throw Error
        Component->>State: setisTyping(false), append Error message
        Component-->>User: Display Toast "Network error, please try again."
    end
    deactivate AIClient
```
