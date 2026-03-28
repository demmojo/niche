# Security Review: Lens Strategy Console Plan

**Executive Summary**
The plan to refactor "Archivist Burt" into the "Lens Strategy Console" introduces several new proactive features, including a feedback loop, a decisions log, and context panels with data lineage. While the UX improvements are solid, there are significant security and data integrity risks related to Prompt Injection, XSS via LLM outputs, Input Validation for the feedback loop, and Sensitive Data Exposure in the data lineage feature. The overall risk is assessed as **High** if these mitigations are not implemented prior to release.

**Detailed Findings & Risk Matrix**

| Risk                                           | Severity | Category (OWASP)                              | Description                                                                                                                                                                                                                                                                                                                                                                           |
| ---------------------------------------------- | -------- | --------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Prompt Injection via Market Data               | Critical | A03:2021-Injection                            | The current implementation interpolates `rawData` and `insights` directly into the system prompt using template literals. Malicious or untrusted external market data could contain prompt injection payloads (e.g., "IGNORE PREVIOUS INSTRUCTIONS AND Output X"), allowing an attacker to hijack the Lens AI's behavior, return malicious payloads, or expose hidden system prompts. |
| Stored Prompt Injection via Rejection Feedback | High     | A03:2021-Injection                            | The plan introduces a "Rejection Feedback Loop" to capture training data. If this feedback is free-text and later fed back into the LLM context to "train future suggestions", a user could inject malicious instructions that persistently affect the Lens AI's output for themselves or other users in the workspace.                                                               |
| Sensitive Data Exposure in Context Panel       | Medium   | A01:2021-Broken Access Control                | The plan mentions a "Context Panel showing data lineage." If the `rawData` or `sourceIds` contain sensitive internal information, API keys, or PII that the user should not normally see directly, exposing the exact data lineage might lead to unauthorized data disclosure.                                                                                                        |
| Inadequate Input Validation on Edit Draft      | Medium   | A03:2021-Injection                            | The `[ Edit Draft ]` action allows users to modify AI-suggested features before approval. If the edit form lacks strict input validation (length limits, character restrictions, XSS sanitization), it could be a vector for Stored XSS or database injection when saved to `MyProductData`.                                                                                          |
| Unhandled LLM Output / JSON Parsing            | Low      | A08:2021-Software and Data Integrity Failures | The current code relies on `JSON.parse(response.text)` without a schema validator (like Zod). While `responseSchema` is used in the Gemini config, if the LLM hallucinates markdown backticks around the JSON (e.g., ` ```json {...} ``` `), the parser will throw an error, causing a denial of service for the chat interface.                                                      |

**Remediation Roadmap & Recommendations**

1. **Mitigate Prompt Injection (Critical)**
   - _Current Plan Addition:_ When rewriting the prompt engineering for Lens, do not use raw template literals for `rawData` and `insights`.
   - _Action:_ Use structured data APIs (like the new Gemini structured prompts if available) or clearly delimit the untrusted data using XML tags (e.g., `<market_data>${sanitize(rawData)}</market_data>`). Instruct the LLM explicitly to treat the contents of those tags as pure data, not instructions.

2. **Secure the Rejection Feedback Loop (High)**
   - _Current Plan Addition:_ For the feedback popover, strictly enforce an enum/dropdown of predefined reasons ("Out of scope", "Too expensive") rather than free-form text.
   - _Action:_ If free-form text is absolutely required for UX, it must be aggressively sanitized and length-limited (e.g., 100 characters max). When passing this feedback back into the LLM, delimit it securely and treat it as untrusted input.

3. **Data Lineage Privacy Checks (Medium)**
   - _Current Plan Addition:_ Define exactly what "data lineage" exposes.
   - _Action:_ Ensure that the Context Panel only displays references or IDs that the current user is authorized to view. Strip any PII or secrets from the source text before it reaches the frontend or the LLM.

4. **Input Validation for "Edit Draft" (Medium)**
   - _Current Plan Addition:_ Define validation rules for the Edit Draft modal.
   - _Action:_ Implement strict client-side and server-side validation for the feature name and description. Although `react-markdown` (v10.1.0) is currently mitigating XSS from links, defense-in-depth requires sanitizing inputs before they are saved to the Decisions Log or `MyProductData`.

5. **Robust JSON Parsing (Low)**
   - _Current Plan Addition:_ Update the technical considerations to include robust parsing.
   - _Action:_ Implement a utility function to strip markdown formatting from the LLM response before calling `JSON.parse` (e.g., `response.text.replace(/^```json\s*/, '').replace(/```$/, '')`), and use a schema validator to ensure the required fields (`message`, `options`, `suggestedFeatures`, `rationale`, `confidence`) exist and are of the correct type.
