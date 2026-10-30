"use client";

import * as React from "react";
import {
  RectangleHorizontal,
  Diamond,
  Circle,
  Pill,
  Cylinder,
  Hexagon,
} from "lucide-react";
import {
  createShapeDragPayload,
  type NodeShape,
} from "@/types/canvas";

export interface ShapeDefinition {
  shape: NodeShape;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

export const SHAPE_DEFINITIONS: readonly ShapeDefinition[] = [
  { shape: "rectangle", label: "Rectangle", icon: RectangleHorizontal },
  { shape: "diamond", label: "Diamond", icon: Diamond },
  { shape: "circle", label: "Circle", icon: Circle },
  { shape: "pill", label: "Pill", icon: Pill },
  { shape: "cylinder", label: "Cylinder", icon: Cylinder },
  { shape: "hexagon", label: "Hexagon", icon: Hexagon },
] as const;

export interface ShapePanelProps {
  onAddShape?: (shape: NodeShape) => void;
  onDragShapeStart?: (shape: NodeShape, event: React.DragEvent) => void;
  onDragShapeEnd?: () => void;
  className?: string;
}

/**
 * Floating pill-shaped toolbar at the bottom-center of the canvas.
 * Provides draggable icon buttons for all 6 supported canvas shapes.
 */
export function ShapePanel({
  onAddShape,
  onDragShapeStart,
  onDragShapeEnd,
  className,
}: ShapePanelProps) {
  const isDraggingRef = React.useRef(false);

  const handleDragStart = React.useCallback(
    (event: React.DragEvent, shape: NodeShape) => {
      isDraggingRef.current = true;
      const payload = createShapeDragPayload(shape);
      const serialized = JSON.stringify(payload);

      // Set shape name as string for standard React Flow drag and drop
      event.dataTransfer.setData("application/reactflow", shape);
      event.dataTransfer.setData("nodeType", shape);
      event.dataTransfer.setData("shape", shape);
      event.dataTransfer.setData("text/plain", shape);
      event.dataTransfer.setData("application/json", serialized);
      event.dataTransfer.setData("payload", serialized);
      event.dataTransfer.effectAllowed = "move";

      // Hide default browser translucent snapshot in favor of custom ghost preview
      try {
        const img = new Image();
        img.src =
          "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='1' height='1'%3E%3C/svg%3E";
        event.dataTransfer.setDragImage(img, 0, 0);
      } catch {
        // Safe fallback in headless or non-browser environments
      }

      onDragShapeStart?.(shape, event);
    },
    [onDragShapeStart]
  );

  const handleDragEnd = React.useCallback(() => {
    onDragShapeEnd?.();
    // Delay clearing drag state so click handlers don't fire immediately after drop
    setTimeout(() => {
      isDraggingRef.current = false;
    }, 100);
  }, [onDragShapeEnd]);

  const handleClick = React.useCallback(
    (shape: NodeShape) => {
      if (isDraggingRef.current) return;
      onAddShape?.(shape);
    },
    [onAddShape]
  );

  return (
    <aside
      data-slot="shape-panel"
      role="toolbar"
      aria-label="Shape panel"
      className={`absolute bottom-6 left-1/2 -translate-x-1/2 z-20 flex items-center gap-1 rounded-full border border-surface-border bg-surface/90 px-3 py-1.5 shadow-2xl backdrop-blur-md transition-all select-none ${className ?? ""}`}
    >
      {SHAPE_DEFINITIONS.map(({ shape, label, icon: Icon }) => (
        <button
          key={shape}
          type="button"
          draggable
          data-slot="shape-button"
          data-shape={shape}
          aria-label={`Drag ${label} shape to canvas`}
          title={`${label} (Drag onto canvas)`}
          onDragStart={(e) => handleDragStart(e, shape)}
          onDragEnd={handleDragEnd}
          onClick={() => handleClick(shape)}
          className="group relative flex h-9 w-9 cursor-grab items-center justify-center rounded-full text-copy-secondary transition-all hover:bg-surface-elevated hover:text-brand active:cursor-grabbing active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40"
        >
          <Icon className="h-4.5 w-4.5 pointer-events-none transition-transform group-hover:scale-110" />
        </button>
      ))}
    </aside>
  );
}
