import { useChat } from "@ai-sdk/react";
import { getRegisteredTools } from "./ToolRegistry";

export function useNicheChat(options: Parameters<typeof useChat>[0] = {}) {
  // Only inject the tools schema config if it hasn't been provided already
  // The actual execution happens on the server, this is just for typing/client awareness
  const tools = getRegisteredTools();

  return useChat({
    ...options,
  });
}
