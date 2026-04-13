import React, { Component, ReactNode, ErrorInfo } from "react";

interface Props {
  children: ReactNode;
  stopStream: () => void;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class GenerativeErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Generative UI rendering error:", error, errorInfo);
    // CRITICAL: Stop the stream instantly to prevent token hemorrhaging
    // when the AST parser or generated React components crash.
    this.props.stopStream();
  }

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }
      return (
        <div className="p-4 border border-red-500 bg-red-50 text-red-900 rounded-md my-4">
          <p className="font-bold">Error rendering generation</p>
          <p className="text-sm">
            The streaming content contained malformed UI that could not be
            displayed safely. The generation has been halted.
          </p>
        </div>
      );
    }

    return this.props.children;
  }
}
