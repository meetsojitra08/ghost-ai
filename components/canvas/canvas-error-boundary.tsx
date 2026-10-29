"use client";

import * as React from "react";
import { AlertCircle, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";

export interface CanvasErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  onReset?: () => void;
}

interface CanvasErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class CanvasErrorBoundary extends React.Component<
  CanvasErrorBoundaryProps,
  CanvasErrorBoundaryState
> {
  constructor(props: CanvasErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): CanvasErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("Canvas connection/render error:", error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div
          data-slot="canvas-error-fallback"
          className="relative flex h-full w-full flex-col items-center justify-center p-6 text-center select-none bg-base text-copy-primary"
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-state-error/30 bg-state-error/10 text-state-error shadow-sm shadow-state-error/10">
            <AlertCircle className="h-6 w-6" />
          </div>
          <h2 className="mt-4 text-lg font-semibold tracking-tight text-copy-primary">
            Unable to connect to collaborative canvas
          </h2>
          <p className="mt-2 max-w-sm text-sm text-copy-muted">
            {this.state.error?.message ||
              "Failed to establish a real-time connection to the room. Please check your network connection and access permissions."}
          </p>
          <Button
            onClick={this.handleReset}
            variant="outline"
            className="mt-5 gap-2 rounded-xl border-surface-border bg-surface text-copy-primary hover:bg-surface-elevated"
            size="sm"
          >
            <RotateCcw className="h-4 w-4" />
            Retry Connection
          </Button>
        </div>
      );
    }

    return this.props.children;
  }
}
