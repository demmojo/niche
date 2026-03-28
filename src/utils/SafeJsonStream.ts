export interface StreamState {
  buffer: string;
}

export const ingestJsonChunk = (
  chunk: string,
  state: StreamState,
): { result: unknown | null; newState: StreamState } => {
  const newBuffer = state.buffer + chunk;
  try {
    const result = JSON.parse(newBuffer);
    return { result, newState: { buffer: newBuffer } };
  } catch (e) {
    if (e instanceof SyntaxError) {
      // Swallow any syntax errors during streaming as the JSON is likely incomplete.
      return { result: null, newState: { buffer: newBuffer } };
    }
    // If the LLM hallucinated totally invalid JSON, throw it.
    throw e;
  }
};

// Deprecated: Use ingestJsonChunk instead
export class SafeJsonStreamParser {
  private buffer = "";

  public ingest(chunk: string): unknown | null {
    const { result, newState } = ingestJsonChunk(chunk, {
      buffer: this.buffer,
    });
    this.buffer = newState.buffer;
    return result;
  }
}
