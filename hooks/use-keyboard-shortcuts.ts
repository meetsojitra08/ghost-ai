"use client";

import * as React from "react";
import type { ReactFlowInstance } from "@xyflow/react";
import type { CanvasEdge, CanvasNode } from "@/types/canvas";

export interface UseKeyboardShortcutsOptions {
  flow: Pick<
    ReactFlowInstance<CanvasNode, CanvasEdge>,
    "zoomIn" | "zoomOut"
  >;
  undo: () => void;
  redo: () => void;
}

function isEditableTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;

  return Boolean(
    target.isContentEditable ||
      target.closest(
        'input, textarea, select, [contenteditable]:not([contenteditable="false"]), [role="textbox"]'
      )
  );
}

export function useKeyboardShortcuts({
  flow,
  undo,
  redo,
}: UseKeyboardShortcutsOptions): void {
  React.useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (isEditableTarget(event.target) || event.altKey) return;

      const hasCommandModifier = event.metaKey || event.ctrlKey;

      if (hasCommandModifier) {
        const key = event.key.toLowerCase();
        if (key === "z") {
          event.preventDefault();
          if (event.shiftKey) redo();
          else undo();
        } else if (key === "y") {
          event.preventDefault();
          redo();
        }
        return;
      }

      if (event.key === "+" || event.key === "=") {
        event.preventDefault();
        void flow.zoomIn({ duration: 150 });
      } else if (event.key === "-") {
        event.preventDefault();
        void flow.zoomOut({ duration: 150 });
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [flow, redo, undo]);
}
