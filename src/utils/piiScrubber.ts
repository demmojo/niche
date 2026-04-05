/**
 * Fast Regex pass to remove obvious PII.
 * Prevents unnecessary LLM tokens and provides a deterministic baseline.
 */
export const regexScrub = (text: string): string => {
  if (!text) return text;
  let scrubbed = text;

  // Basic SSN (US)
  scrubbed = scrubbed.replace(/\b\d{3}[-.]?\d{2}[-.]?\d{4}\b/g, "[SSN]");
  // Basic Email
  scrubbed = scrubbed.replace(
    /[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+/g,
    "[EMAIL]",
  );
  // Basic Phone (US-centric simple match)
  scrubbed = scrubbed.replace(/\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/g, "[PHONE]");

  return scrubbed;
};
