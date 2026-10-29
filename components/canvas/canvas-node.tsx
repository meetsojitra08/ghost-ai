"use client";

import * as React from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import {
  DEFAULT_NODE_COLOR,
  DEFAULT_NODE_TEXT_COLOR,
  type CanvasNode,
} from "@/types/canvas";

/**
 * Basic renderer for custom canvas nodes (CANVAS_NODE_TYPE / "canvasNode").
 * Renders every shape as a clean bordered rectangle with centered label
 * and connection handles at all four sides.
 */
export function CanvasNodeRenderer({
  id,
  data,
  selected,
}: NodeProps<CanvasNode>) {
  const fillColor = data?.color || DEFAULT_NODE_COLOR;
  const textColor = data?.textColor || DEFAULT_NODE_TEXT_COLOR;
  const label = data?.label ?? "";

  return (
    <div
      data-slot="canvas-node"
      data-shape={data?.shape}
      data-node-id={id}
      className={`group relative flex h-full w-full items-center justify-center rounded-xl border p-3 text-center transition-all select-none ${
        selected
          ? "border-brand ring-2 ring-brand/40 shadow-lg shadow-brand/10"
          : "border-surface-border hover:border-surface-border-subtle"
      }`}
      style={{
        backgroundColor: fillColor,
        color: textColor,
        minWidth: 60,
        minHeight: 36,
      }}
    >
      {/* 4 Connection handles at each side (hidden by default, revealed on hover) */}
      <Handle
        type="target"
        position={Position.Top}
        id="top"
        className="opacity-0 group-hover:opacity-100 transition-opacity !w-2 !h-2 !bg-white !border-none !rounded-full pointer-events-auto"
      />
      <Handle
        type="source"
        position={Position.Right}
        id="right"
        className="opacity-0 group-hover:opacity-100 transition-opacity !w-2 !h-2 !bg-white !border-none !rounded-full pointer-events-auto"
      />
      <Handle
        type="source"
        position={Position.Bottom}
        id="bottom"
        className="opacity-0 group-hover:opacity-100 transition-opacity !w-2 !h-2 !bg-white !border-none !rounded-full pointer-events-auto"
      />
      <Handle
        type="target"
        position={Position.Left}
        id="left"
        className="opacity-0 group-hover:opacity-100 transition-opacity !w-2 !h-2 !bg-white !border-none !rounded-full pointer-events-auto"
      />

      {/* Centered label */}
      <span className="text-sm font-medium tracking-tight break-words pointer-events-none px-1">
        {label}
      </span>
    </div>
  );
}
