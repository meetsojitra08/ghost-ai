"use client";

import * as React from "react";
import { Handle, NodeResizer, Position, type NodeProps } from "@xyflow/react";
import {
  DEFAULT_NODE_COLOR,
  DEFAULT_NODE_TEXT_COLOR,
  MIN_SHAPE_SIZES,
  type CanvasNode,
} from "@/types/canvas";
import { NodeShapeView } from "./node-shape";
import { NodeColorToolbar } from "./node-color-toolbar";
import { CanvasNodeContext } from "./editor-canvas";

/**
 * Renderer for custom canvas nodes (CANVAS_NODE_TYPE / "canvasNode").
 * Renders each node according to its shape:
 * - CSS shapes: rectangle, pill, circle
 * - Scalable SVG shapes: diamond, hexagon, cylinder
 *
 * Supports:
 * - Resize handles when selected with shape-specific minimum dimensions.
 * - Double-click inline label editing with zero layout shift.
 * - Live synchronization to collaborative Liveblocks canvas state.
 */
export function CanvasNodeRenderer({
  id,
  data,
  selected,
  width,
  height,
}: NodeProps<CanvasNode>) {
  const shape = data?.shape || "rectangle";
  const fillColor = data?.color || DEFAULT_NODE_COLOR;
  const textColor = data?.textColor || DEFAULT_NODE_TEXT_COLOR;
  const label = data?.label ?? "";

  const [isEditing, setIsEditing] = React.useState(false);
  const [prevLabel, setPrevLabel] = React.useState(label);
  const [localLabel, setLocalLabel] = React.useState(label);
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);
  const nodeContext = React.useContext(CanvasNodeContext);

  // Sync external prop label updates during rendering without cascading effects
  if (label !== prevLabel) {
    setPrevLabel(label);
    if (!isEditing) {
      setLocalLabel(label);
    }
  }

  const adjustTextareaHeight = React.useCallback(() => {
    const el = textareaRef.current;
    if (el) {
      el.style.height = "auto";
      el.style.height = `${el.scrollHeight}px`;
    }
  }, []);

  // Auto-focus and place cursor at end when editing begins
  React.useEffect(() => {
    if (isEditing && textareaRef.current) {
      textareaRef.current.focus();
      textareaRef.current.selectionStart = textareaRef.current.value.length;
      textareaRef.current.selectionEnd = textareaRef.current.value.length;
      adjustTextareaHeight();
    }
  }, [isEditing, adjustTextareaHeight]);

  const handleDoubleClick = React.useCallback((event: React.MouseEvent) => {
    event.stopPropagation();
    setIsEditing(true);
  }, []);

  const handleLabelChange = React.useCallback(
    (event: React.ChangeEvent<HTMLTextAreaElement>) => {
      const next = event.target.value;
      setLocalLabel(next);
      adjustTextareaHeight();
      nodeContext?.updateNodeLabel(id, next);
    },
    [nodeContext, id, adjustTextareaHeight]
  );

  const handleBlur = React.useCallback(() => {
    setIsEditing(false);
    if (nodeContext && localLabel !== data?.label) {
      nodeContext.updateNodeLabel(id, localLabel);
    }
  }, [nodeContext, id, localLabel, data?.label]);

  const handleKeyDown = React.useCallback(
    (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
      // Prevent canvas panning, hotkeys, or backspace node deletion
      event.stopPropagation();

      if (event.key === "Escape") {
        event.preventDefault();
        setIsEditing(false);
      } else if (event.key === "Enter" && !event.shiftKey) {
        event.preventDefault();
        event.currentTarget.blur();
      }
    },
    []
  );

  const minSize = MIN_SHAPE_SIZES[shape] ?? { width: 60, height: 36 };

  return (
    <div
      data-slot="canvas-node"
      data-shape={shape}
      data-node-id={id}
      className="relative h-full w-full"
    >
      {/* Resize controls: visible only when node is selected */}
      <NodeResizer
        nodeId={id}
        isVisible={selected}
        minWidth={minSize.width}
        minHeight={minSize.height}
        color="var(--color-brand, #00c8d4)"
        handleClassName="!w-2 !h-2 !bg-base !border !border-brand !rounded-xs shadow-xs"
        lineClassName="!border-brand/40 !border-dashed"
      />

      {selected ? (
        <NodeColorToolbar
          activeColor={fillColor}
          activeTextColor={textColor}
          onSelect={(color) => nodeContext?.updateNodeColor(id, color)}
        />
      ) : null}

      <NodeShapeView
        shape={shape}
        width={width}
        height={height}
        fillColor={fillColor}
        textColor={textColor}
        selected={selected}
        label={label}
        placeholder="Label"
        onDoubleClick={handleDoubleClick}
        labelContent={
          isEditing ? (
            <textarea
              ref={textareaRef}
              rows={1}
              value={localLabel}
              placeholder="Label"
              onChange={handleLabelChange}
              onBlur={handleBlur}
              onKeyDown={handleKeyDown}
              onPointerDown={(e) => e.stopPropagation()}
              onMouseDown={(e) => e.stopPropagation()}
              className="nodrag nopan relative z-20 w-full max-w-[85%] resize-none overflow-hidden bg-transparent p-0 px-2 text-center text-sm font-medium tracking-tight outline-none border-none leading-normal placeholder:text-copy-muted/50 placeholder:italic"
              style={{
                color: textColor,
                caretColor: "var(--color-brand, #00c8d4)",
              }}
            />
          ) : undefined
        }
      >
        {/* 4 Connection handles at each side (hidden by default, revealed on hover) */}
        <Handle
          type="target"
          position={Position.Top}
          id="top"
          className="opacity-0 group-hover:opacity-100 transition-opacity !w-2 !h-2 !bg-white !border !border-base !rounded-full pointer-events-auto z-20"
        />
        <Handle
          type="source"
          position={Position.Right}
          id="right"
          className="opacity-0 group-hover:opacity-100 transition-opacity !w-2 !h-2 !bg-white !border !border-base !rounded-full pointer-events-auto z-20"
        />
        <Handle
          type="source"
          position={Position.Bottom}
          id="bottom"
          className="opacity-0 group-hover:opacity-100 transition-opacity !w-2 !h-2 !bg-white !border !border-base !rounded-full pointer-events-auto z-20"
        />
        <Handle
          type="target"
          position={Position.Left}
          id="left"
          className="opacity-0 group-hover:opacity-100 transition-opacity !w-2 !h-2 !bg-white !border !border-base !rounded-full pointer-events-auto z-20"
        />
      </NodeShapeView>
    </div>
  );
}
