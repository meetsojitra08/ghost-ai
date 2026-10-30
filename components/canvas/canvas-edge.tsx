"use client";

import * as React from "react";
import {
  BaseEdge,
  EdgeLabelRenderer,
  getSmoothStepPath,
  type EdgeProps,
} from "@xyflow/react";
import type { CanvasEdge } from "@/types/canvas";
import { CanvasNodeContext } from "./editor-canvas";

/** Right-angle collaborative edge with an inline, path-centered label editor. */
export function CanvasEdgeRenderer({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  markerEnd,
  style,
  selected,
  data,
}: EdgeProps<CanvasEdge>) {
  const [edgePath, labelX, labelY] = getSmoothStepPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
    borderRadius: 8,
  });
  const [hovered, setHovered] = React.useState(false);
  const [isEditing, setIsEditing] = React.useState(false);
  const [labelDraft, setLabelDraft] = React.useState(data?.label ?? "");
  const inputRef = React.useRef<HTMLInputElement>(null);
  const context = React.useContext(CanvasNodeContext);
  const label = data?.label ?? "";
  const isActive = selected || hovered;

  React.useEffect(() => {
    if (isEditing) inputRef.current?.focus();
  }, [isEditing]);

  const startEditing = () => {
    setLabelDraft(label);
    setIsEditing(true);
  };

  const saveLabel = React.useCallback(() => {
    context?.updateEdgeLabel(id, labelDraft.trim());
    setIsEditing(false);
  }, [context, id, labelDraft]);

  const handleKeyDown = React.useCallback(
    (event: React.KeyboardEvent<HTMLInputElement>) => {
      event.stopPropagation();
      if (event.key === "Enter" || event.key === "Escape") {
        event.preventDefault();
        event.currentTarget.blur();
      }
    },
    []
  );

  return (
    <>
      <BaseEdge
        id={id}
        path={edgePath}
        markerEnd={markerEnd}
        interactionWidth={24}
        style={{
          ...style,
          stroke: style?.stroke ?? "var(--color-copy-secondary, #c0c0cc)",
          strokeWidth: style?.strokeWidth ?? 2,
          strokeLinecap: "round",
          opacity: isActive ? 1 : 0.58,
          transition: "opacity 120ms ease",
        }}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        onDoubleClick={(event) => {
          event.stopPropagation();
          startEditing();
        }}
      />
      {(label || isActive || isEditing) && (
        <EdgeLabelRenderer>
          <div
            className="nodrag nopan nowheel"
            style={{
              position: "absolute",
              transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
              pointerEvents: "all",
              zIndex: 10,
            }}
            onPointerDown={(event) => event.stopPropagation()}
            onMouseDown={(event) => event.stopPropagation()}
            onClick={(event) => event.stopPropagation()}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
            onDoubleClick={(event) => {
              event.stopPropagation();
              startEditing();
            }}
          >
            {isEditing ? (
              <input
                ref={inputRef}
                aria-label="Edge label"
                value={labelDraft}
                size={Math.max(labelDraft.length, 1)}
                onChange={(event) => setLabelDraft(event.target.value)}
                onBlur={saveLabel}
                onKeyDown={handleKeyDown}
                onPointerDown={(event) => event.stopPropagation()}
                onMouseDown={(event) => event.stopPropagation()}
                className="nodrag nopan nowheel max-w-56 min-w-8 rounded-full border border-brand/40 bg-elevated px-2.5 py-1 text-center text-xs text-copy-primary shadow-sm outline-none focus:border-brand"
              />
            ) : label ? (
              <span className="rounded-full border border-surface-border bg-elevated/95 px-2.5 py-1 text-xs text-copy-secondary shadow-sm">
                {label}
              </span>
            ) : (
              <span className="rounded-full border border-surface-border/70 bg-elevated/80 px-2.5 py-1 text-xs text-copy-muted/55">
                Double-click to add label
              </span>
            )}
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  );
}
