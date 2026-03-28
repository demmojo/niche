export function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

export function middleTruncate(
  text: string,
  maxTokens: number,
  safetyMargin: number = 100,
): string {
  const effectiveMaxTokens = maxTokens - safetyMargin;
  if (effectiveMaxTokens <= 0) return text;

  const currentTokens = estimateTokens(text);
  if (currentTokens <= effectiveMaxTokens) return text;

  const allowedChars = effectiveMaxTokens * 4;
  const charsToKeep = allowedChars - 15; // 15 for " [...] "

  const halfChars = Math.floor(charsToKeep / 2);
  const start = text.slice(0, halfChars);
  const end = text.slice(-halfChars);

  return `${start} [...] ${end}`;
}
