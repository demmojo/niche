import { useEffect, useRef, useCallback, useState } from "react";
import { useChat } from "@ai-sdk/react";
import { z } from "zod";

// Zod schema for mid-stream custom protocol payloads
const StreamDataSchema = z.object({
  type: z.string(),
  payload: z.any(),
});

interface UseNicheGenerativeStreamProps {
  api: string;
  initialData?: string;
  jobId?: string; // Required for reconnect logic
  onStatusChange?: (
    status: "active" | "interrupted" | "failed" | "completed",
  ) => void;
  // Anti-corruption layer mappings
  onToolCallFailed?: (toolName: string) => void;
}

export function useNicheGenerativeStream({
  api,
  initialData = "",
  jobId,
  onStatusChange,
  onToolCallFailed,
}: UseNicheGenerativeStreamProps) {
  const [streamStatus, setStreamStatus] = useState<
    "idle" | "active" | "interrupted" | "failed" | "completed"
  >("idle");
  const processedDataIndices = useRef<Set<number>>(new Set());

  const {
    messages,
    input,
    handleInputChange,
    handleSubmit,
    isLoading,
    stop,
    error,
    data,
    setMessages,
    append,
    sendMessage,
  } = (useChat as any)({
    api,
    initialMessages: initialData
      ? [{ id: "init", role: "assistant", content: initialData }]
      : [],
    onResponse: () => {
      setStreamStatus("active");
      onStatusChange?.("active");
    },
    onFinish: () => {
      setStreamStatus("completed");
      onStatusChange?.("completed");
    },
    onError: (err) => {
      // In the Vercel SDK, network aborts also trigger onError.
      if (err.name === "AbortError") {
        setStreamStatus("interrupted");
        onStatusChange?.("interrupted");
      } else {
        setStreamStatus("failed");
        onStatusChange?.("failed");
      }
    },
  });

  // Zero-Trust Mid-Stream Validation for `data` stream
  useEffect(() => {
    if (!data) return;

    data.forEach((packet, index) => {
      // High-water mark index tracker (only process new chunks)
      if (processedDataIndices.current.has(index)) return;
      processedDataIndices.current.add(index);

      const parsed = StreamDataSchema.safeParse(packet);
      if (!parsed.success) {
        // Silently swallow error, do not crash the UI, log to telemetry
        console.warn("Dropped malformed data packet", packet);
        return;
      }

      // Handle valid data packet safely
      // (Implementation would depend on business logic)
    });
  }, [data]);

  // Disconnect Handling & Foreground State Reconciliation
  const fetchFinalState = useCallback(async () => {
    if (!jobId) return;

    try {
      const response = await fetch(`/api/generation/${jobId}/status`);
      if (!response.ok) throw new Error("Failed to fetch final state");

      const result = await response.json();

      // State Rehydration Boundary
      if (result.status === "completed") {
        setStreamStatus("completed");
        onStatusChange?.("completed");
        if (result.finalText) {
          setMessages([
            { id: "final", role: "assistant", content: result.finalText },
          ]);
        }
      } else if (
        result.status === "interrupted" ||
        result.status === "failed"
      ) {
        setStreamStatus(result.status);
        onStatusChange?.(result.status);
      }
    } catch (e) {
      console.error("State reconciliation failed:", e);
      setStreamStatus("failed");
      onStatusChange?.("failed");
    }
  }, [jobId, setMessages, onStatusChange]);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible" && streamStatus === "active") {
        // App foregrounded: tear down zombie TCP connection
        stop();
        setStreamStatus("interrupted");

        // Lightweight deterministic fetch to verify state
        fetchFinalState();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [streamStatus, stop, fetchFinalState]);

  const generate = useCallback(
    async (payload: any, token?: string) => {
      setStreamStatus("active");
      onStatusChange?.("active");

      let textContent = "";
      if (typeof payload === "string") {
        textContent = payload;
      } else if (payload?.params?.contents?.[0]?.parts?.[0]?.text) {
        textContent = payload.params.contents[0].parts[0].text;
      } else {
        textContent = JSON.stringify(payload);
      }

      const msg = {
        id: Date.now().toString(),
        role: "user",
        content: textContent,
      };

      const opts = {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        body: payload,
      };

      if (typeof append === "function") {
        await append(msg as any, opts as any);
      } else if (typeof sendMessage === "function") {
        await sendMessage(msg, opts);
      } else {
        throw new Error(
          "Neither append nor sendMessage is available on useChat",
        );
      }
    },
    [append, sendMessage, onStatusChange],
  );

  return {
    // ACL mapped properties
    messages,
    isLoading,
    isInterrupted: streamStatus === "interrupted",
    isFailed: streamStatus === "failed",
    error,
    input,
    handleInputChange,
    handleSubmit,
    generate,
    stopStream: stop,
  };
}
