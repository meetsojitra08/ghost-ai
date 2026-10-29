"use client";

import { Loader2 } from "lucide-react";

export function CanvasLoading() {
  return (
    <div
      data-slot="canvas-loading"
      className="relative flex h-full w-full flex-col items-center justify-center bg-base text-copy-primary select-none"
    >
      <div className="flex flex-col items-center gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-brand" />
        <p className="font-mono text-xs tracking-wide text-copy-muted">
          Connecting to collaborative canvas...
        </p>
      </div>
    </div>
  );
}
