import stringHash from "string-hash";
// A simple Levenshtein distance function for fuzzy matching
/**
 *
 */
function levenshteinDistance(a: string, b: string): number {
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;

  const matrix = Array.from({ length: a.length + 1 }, () =>
    new Array(b.length + 1).fill(0),
  );

  for (let i = 0; i <= a.length; i++) matrix[i][0] = i;
  for (let j = 0; j <= b.length; j++) matrix[0][j] = j;

  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1, // deletion
        matrix[i][j - 1] + 1, // insertion
        matrix[i - 1][j - 1] + cost, // substitution
      );
    }
  }

  return matrix[a.length][b.length];
}

// Normalize text for comparison (lowercase, strip extra whitespace, normalize unicode)
/**
 *
 */
function normalizeText(text: string): string {
  return text
    .normalize("NFKC")
    .toLowerCase()
    .replace(/[\u2018\u2019\u201c\u201d]/g, '"') // Normalize smart quotes
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * 3-Tier Validation Waterfall for Verbatim RAG Extraction
 * 1. Strict Exact Match
 * 2. Normalized Match
 * 3. Fuzzy Sliding Window Match
 */
export function validateVerbatimQuote(
  quote: string,
  sourceText: string,
): { isValid: boolean; matchTier: "strict" | "normalized" | "fuzzy" | "none" } {
  // Tier 1: Strict Match
  if (sourceText.includes(quote)) {
    return { isValid: true, matchTier: "strict" };
  }

  // Tier 2: Normalized Match
  const normalizedQuote = normalizeText(quote);
  const normalizedSource = normalizeText(sourceText);
  if (normalizedSource.includes(normalizedQuote)) {
    return { isValid: true, matchTier: "normalized" };
  }

  // Tier 3: Fuzzy Fallback using a sliding window
  // Only apply fuzzy logic if the quote isn't extremely short to avoid false positives
  if (normalizedQuote.length > 10) {
    const windowSize = normalizedQuote.length;
    let bestSimilarity = 0;

    // Slide window across source text to find the best matching chunk
    // Step size can be adjusted based on performance requirements.
    const step = Math.max(1, Math.floor(windowSize / 4));

    for (let i = 0; i <= normalizedSource.length - windowSize; i += step) {
      const chunk = normalizedSource.slice(i, i + windowSize);
      const dist = levenshteinDistance(normalizedQuote, chunk);
      const similarity =
        1 - dist / Math.max(normalizedQuote.length, chunk.length);

      if (similarity > bestSimilarity) {
        bestSimilarity = similarity;
      }

      if (bestSimilarity >= 0.95) {
        return { isValid: true, matchTier: "fuzzy" };
      }
    }
  }

  // All tiers failed
  return { isValid: false, matchTier: "none" };
}
