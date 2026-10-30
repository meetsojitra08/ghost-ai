"use client";

import * as React from "react";
import {
  LiveblocksProvider,
  RoomProvider,
  ClientSideSuspense,
  useErrorListener,
} from "@liveblocks/react";
import { AlertCircle, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CanvasErrorBoundary } from "./canvas-error-boundary";
import { CanvasLoading } from "./canvas-loading";
import { EditorCanvas } from "./editor-canvas";
import type { CanvasTemplateImportRequest } from "./editor-canvas";

function ConnectionErrorFallback({
  error,
  onRetry,
}: {
  error: string;
  onRetry: () => void;
}) {
  return (
    <div
      data-slot="canvas-connection-error"
      className="relative flex h-full w-full flex-col items-center justify-center p-6 text-center select-none bg-base text-copy-primary"
    >
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-state-error/30 bg-state-error/10 text-state-error shadow-sm shadow-state-error/10">
        <AlertCircle className="h-6 w-6" />
      </div>
      <h2 className="mt-4 text-lg font-semibold tracking-tight text-copy-primary">
        Canvas Connection Error
      </h2>
      <p className="mt-2 max-w-sm text-sm text-copy-muted">
        {error}
      </p>
      <Button
        onClick={onRetry}
        variant="outline"
        className="mt-5 gap-2 rounded-xl border-surface-border bg-surface text-copy-primary hover:bg-surface-elevated"
        size="sm"
      >
        <RotateCcw className="h-4 w-4" />
        Reconnect
      </Button>
    </div>
  );
}

function RoomConnectionWatcher({ children }: { children: React.ReactNode }) {
  const [connectionError, setConnectionError] = React.useState<string | null>(null);

  useErrorListener((error) => {
    if (error.context.type === "ROOM_CONNECTION_ERROR") {
      setConnectionError(
        error.message || "Failed to connect to the Liveblocks room."
      );
    }
  });

  if (connectionError) {
    return (
      <ConnectionErrorFallback
        error={connectionError}
        onRetry={() => {
          setConnectionError(null);
          if (typeof window !== "undefined") {
            window.location.reload();
          }
        }}
      />
    );
  }

  return <>{children}</>;
}

export interface CanvasRoomWrapperProps {
  roomId: string;
  templateImport?: CanvasTemplateImportRequest | null;
  onTemplateImported?: (requestId: number) => void;
}

export function CanvasRoomWrapper({
  roomId,
  templateImport,
  onTemplateImported,
}: CanvasRoomWrapperProps) {
  return (
    <LiveblocksProvider authEndpoint="/api/liveblocks-auth">
      <RoomProvider
        id={roomId}
        initialPresence={{
          cursor: null,
          isThinking: false,
        }}
      >
        <CanvasErrorBoundary>
          <RoomConnectionWatcher>
            <ClientSideSuspense fallback={<CanvasLoading />}>
              {() => (
                <EditorCanvas
                  templateImport={templateImport}
                  onTemplateImported={onTemplateImported}
                />
              )}
            </ClientSideSuspense>
          </RoomConnectionWatcher>
        </CanvasErrorBoundary>
      </RoomProvider>
    </LiveblocksProvider>
  );
}
