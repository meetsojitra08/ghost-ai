"use client";

import * as React from "react";
import { DEFAULT_SHAPE_SIZES, type NodeShape } from "@/types/canvas";
import { NodeShapeView } from "./node-shape";

export interface ShapeDragPreviewProps {
  shape: NodeShape | null;
  position: { x: number; y: number } | null;
}

/**
 * Ghost preview element displayed while dragging a shape from the shape panel.
 * - Stays attached to the cursor while dragging
 * - Renders the exact shape type and default size that will be placed on drop
 * - Translucent ghost styling with dashed brand border
 * - pointer-events-none ensures seamless event passthrough to drop targets
 */
export function ShapeDragPreview({ shape, position }: ShapeDragPreviewProps) {
  if (!shape || !position) return null;

  const size = DEFAULT_SHAPE_SIZES[shape] ?? { width: 160, height: 80 };

  return (
    <div
      data-slot="shape-drag-preview"
      data-shape={shape}
      className="pointer-events-none fixed z-50 transition-none select-none"
      style={{
        left: position.x,
        top: position.y,
        transform: "translate(-50%, -50%)",
        width: size.width,
        height: size.height,
      }}
    >
      <NodeShapeView
        shape={shape}
        width={size.width}
        height={size.height}
        isGhost={true}
      />
    </div>
  );
}

