"use client";

import * as React from "react";
import { Maximize, Minus, Plus, Redo2, Undo2 } from "lucide-react";
import { useCanRedo, useCanUndo, useRedo, useUndo } from "@liveblocks/react";
import { useReactFlow } from "@xyflow/react";
import type { CanvasEdge, CanvasNode } from "@/types/canvas";
import { useKeyboardShortcuts } from "@/hooks/use-keyboard-shortcuts";

const BUTTON_CLASS_NAME =
  "flex h-9 w-9 items-center justify-center rounded-full text-copy-secondary transition-colors hover:bg-surface-elevated hover:text-brand focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/50 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-copy-secondary";

export function CanvasControls() {
  const flow = useReactFlow<CanvasNode, CanvasEdge>();
  const undo = useUndo();
  const redo = useRedo();
  const canUndo = useCanUndo();
  const canRedo = useCanRedo();

  useKeyboardShortcuts({ flow, undo, redo });

  const fitView = React.useCallback(() => {
    void flow.fitView({ duration: 200, padding: 0.2 });
  }, [flow]);

  return (
    <aside
      data-slot="canvas-controls"
      role="toolbar"
      aria-label="Canvas controls"
      className="nodrag nopan nowheel absolute bottom-24 left-6 z-30 md:bottom-6 flex items-center gap-1 rounded-full border border-surface-border bg-surface/90 px-2 py-1.5 shadow-2xl backdrop-blur-md select-none"
      onPointerDown={(event) => event.stopPropagation()}
      onMouseDown={(event) => event.stopPropagation()}
      onClick={(event) => event.stopPropagation()}
    >
      <div role="group" aria-label="Zoom" className="flex items-center gap-0.5">
        <button
          type="button"
          aria-label="Zoom out"
          title="Zoom out (-)"
          onClick={() => void flow.zoomOut({ duration: 150 })}
          className={BUTTON_CLASS_NAME}
        >
          <Minus aria-hidden="true" className="h-4 w-4" />
        </button>
        <button
          type="button"
          aria-label="Fit view"
          title="Fit view"
          onClick={fitView}
          className={BUTTON_CLASS_NAME}
        >
          <Maximize aria-hidden="true" className="h-4 w-4" />
        </button>
        <button
          type="button"
          aria-label="Zoom in"
          title="Zoom in (+)"
          onClick={() => void flow.zoomIn({ duration: 150 })}
          className={BUTTON_CLASS_NAME}
        >
          <Plus aria-hidden="true" className="h-4 w-4" />
        </button>
      </div>

      <div aria-hidden="true" className="mx-1 h-5 w-px bg-surface-border" />

      <div role="group" aria-label="History" className="flex items-center gap-0.5">
        <button
          type="button"
          aria-label="Undo"
          title="Undo (Ctrl/Cmd+Z)"
          onClick={undo}
          disabled={!canUndo}
          className={BUTTON_CLASS_NAME}
        >
          <Undo2 aria-hidden="true" className="h-4 w-4" />
        </button>
        <button
          type="button"
          aria-label="Redo"
          title="Redo (Ctrl/Cmd+Shift+Z)"
          onClick={redo}
          disabled={!canRedo}
          className={BUTTON_CLASS_NAME}
        >
          <Redo2 aria-hidden="true" className="h-4 w-4" />
        </button>
      </div>
    </aside>
  );
}
