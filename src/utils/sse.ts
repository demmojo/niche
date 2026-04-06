export async function parseSSEStream(
  response: Response,
  onChunk: (parsedData: any) => void | boolean, // Return true to abort stream parsing
  onResumptionCacheClear?: () => void,
) {
  if (!response.body) throw new Error("No response body");

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let attemptResumption = !!onResumptionCacheClear;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const parts = buffer.split("\n\n");
    buffer = parts.pop() || ""; // Keep the incomplete chunk in the buffer

    for (const chunk of parts) {
      if (chunk.trim() === "") continue;

      if (attemptResumption && onResumptionCacheClear) {
        onResumptionCacheClear();
        attemptResumption = false;
      }

      let parsed;
      try {
        parsed = JSON.parse(chunk.replace("data: ", ""));
      } catch (e) {
        throw new Error("Failed to parse stream.");
      }

      const shouldAbort = onChunk(parsed);
      if (shouldAbort) return;
    }
  }
}
