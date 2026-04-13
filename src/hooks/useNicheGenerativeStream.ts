import { useState, useEffect, useRef, useCallback } from "react";
import { z } from "zod";

// Ensure safe chunks (drop malformed instead of crashing)
const streamChunkSchema = z.object({
  text: z.string().optional(),
  error: z.string().optional(),
  message: z.string().optional(),
});

interface UseNicheGenerativeStreamProps {
  endpoint: string;
  initialData?: string;
  onError?: (error: string) => void;
  onFinish?: (finalData: string) => void;
  // Options for decoupled chunk ingestion
  throttleMs?: number;
}

export function useNicheGenerativeStream({
  endpoint,
  initialData = "",
  onError,
  onFinish,
  throttleMs = 150, // Throttle UI updates to 150ms intervals by default
}: UseNicheGenerativeStreamProps) {
  const [data, setData] = useState(initialData);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // High-water mark tracker and buffers
  const fullTextRef = useRef(initialData);
  const bufferedTextRef = useRef("");
  const abortControllerRef = useRef<AbortController | null>(null);
  const throttleTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Used to prevent state updates if unmounted
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      if (throttleTimeoutRef.current) clearTimeout(throttleTimeoutRef.current);
    };
  }, []);

  const flushBuffer = useCallback(() => {
    if (!isMountedRef.current) return;
    if (bufferedTextRef.current.length > 0) {
      fullTextRef.current += bufferedTextRef.current;
      setData(fullTextRef.current);
      bufferedTextRef.current = "";
    }
  }, []);

  const appendToBuffer = useCallback(
    (text: string) => {
      bufferedTextRef.current += text;
      if (!throttleTimeoutRef.current) {
        throttleTimeoutRef.current = setTimeout(() => {
          flushBuffer();
          throttleTimeoutRef.current = null;
        }, throttleMs);
      }
    },
    [throttleMs, flushBuffer],
  );

  const generate = useCallback(
    async (payload: any, token?: string) => {
      setIsLoading(true);
      setError(null);
      setData(initialData);
      fullTextRef.current = initialData;
      bufferedTextRef.current = "";

      // Clean up previous stream if exists
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      abortControllerRef.current = new AbortController();

      try {
        const headers: Record<string, string> = {
          "Content-Type": "application/json",
        };
        if (token) {
          headers["Authorization"] = `Bearer ${token}`;
        }

        const response = await fetch(endpoint, {
          method: "POST",
          headers,
          body: JSON.stringify(payload),
          signal: abortControllerRef.current.signal,
        });

        if (!response.ok) {
          throw new Error(`HTTP Error: ${response.status}`);
        }

        if (!response.body) {
          throw new Error("No response body");
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";

        while (true) {
          const { done, value } = await reader.read();

          if (done) {
            flushBuffer(); // Final flush
            setIsLoading(false);
            if (onFinish && isMountedRef.current) {
              onFinish(fullTextRef.current);
            }
            break;
          }

          buffer += decoder.decode(value, { stream: true });

          // Process lines (SSE format: data: {...}\n\n)
          let newlineToIndex;
          while ((newlineToIndex = buffer.indexOf("\n\n")) >= 0) {
            const line = buffer.slice(0, newlineToIndex).trim();
            buffer = buffer.slice(newlineToIndex + 2);

            if (line.startsWith("data: ")) {
              const dataStr = line.slice(6).trim();
              if (dataStr === "[DONE]") {
                continue; // Handled by reader.read() done
              }
              try {
                let rawData;
                try {
                  rawData = JSON.parse(dataStr);
                } catch (e) {
                  console.warn("Failed to parse SSE data string", dataStr);
                  continue; // Skip malformed JSON
                }
                // Zero-trust parsing
                const parsed = streamChunkSchema.safeParse(rawData);

                if (parsed.success) {
                  // Ignore the chunk if it has no text and no error, but don't throw error
                  if (parsed.data.error) {
                    throw new Error(parsed.data.message || parsed.data.error);
                  } else if (parsed.data.text) {
                    appendToBuffer(parsed.data.text);
                  }
                } else {
                  console.warn("Dropped malformed chunk", rawData);
                }
              } catch (e: any) {
                // Bubble up thrown errors from inside the try block (like our manual throw above)
                throw e;
              }
            }
          }
        }
      } catch (e: any) {
        if (e.name === "AbortError") {
          console.log("Stream aborted locally");
        } else {
          console.error("Stream generation error:", e);
          if (isMountedRef.current) {
            setError(
              e.message || "An unknown error occurred during generation.",
            );
            if (onError) onError(e.message);
          }
        }
      } finally {
        if (isMountedRef.current) {
          setIsLoading(false);
        }
      }
    },
    [endpoint, initialData, appendToBuffer, flushBuffer, onError, onFinish],
  );

  // Handle visibility change to cleanup zombie connections
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (
        document.visibilityState === "hidden" &&
        isLoading &&
        abortControllerRef.current
      ) {
        console.log("Tab backgrounded. Aborting zombie TCP connection.");
        abortControllerRef.current.abort();
        // The backend should handle "Die on Disconnect" and save state to Firestore.
        // We will need to re-fetch definitive state when coming back, handled by consumer.
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [isLoading]);

  return {
    data,
    isLoading,
    error,
    generate,
    // Provide manual abort just in case, but rely on visibility listener
    abort: () => abortControllerRef.current?.abort(),
  };
}
