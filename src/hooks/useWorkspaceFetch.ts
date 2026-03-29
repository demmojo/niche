import { useState, useEffect } from "react";
import { useWorkspace } from "../components/WorkspaceProvider";

interface FetchState<T> {
  data: T | null;
  isLoading: boolean;
  error: Error | null;
}

export function useWorkspaceFetch<T>(url: string): FetchState<T> {
  const workspaceId = useWorkspace();
  const [state, setState] = useState<FetchState<T>>({
    data: null,
    isLoading: true,
    error: null,
  });

  useEffect(() => {
    // If there is no workspace, we do not fetch
    if (!workspaceId) {
      setState({ data: null, isLoading: false, error: null });
      return;
    }

    const controller = new AbortController();
    let isMounted = true;

    setState((prev) => ({ ...prev, isLoading: true, error: null }));

    const fetchData = async () => {
      try {
        // Automatically inject workspaceId if needed,
        // For demonstration, we just fetch the URL and attach the AbortSignal
        const response = await fetch(url, {
          headers: {
            "X-Workspace-Id": workspaceId,
          },
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error("Network response was not ok");
        }

        const json = await response.json();

        if (isMounted) {
          setState({ data: json, isLoading: false, error: null });
        }
      } catch (err: any) {
        if (err.name === "AbortError") {
          // Swallow the abort error per requirements so it doesn't crash React Error Boundaries
          return;
        }
        if (isMounted) {
          setState({ data: null, isLoading: false, error: err });
        }
      }
    };

    fetchData();

    return () => {
      isMounted = false;
      controller.abort();
    };
  }, [url, workspaceId]);

  return state;
}
