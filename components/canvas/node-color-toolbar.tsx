"use client";

import * as React from "react";
import { Check } from "lucide-react";
import { NODE_COLORS, type NodeColorDefinition } from "@/types/canvas";

interface NodeColorToolbarProps {
  activeColor: string;
  activeTextColor: string;
  onSelect: (color: NodeColorDefinition) => void;
}

export function NodeColorToolbar({
  activeColor,
  activeTextColor,
  onSelect,
}: NodeColorToolbarProps) {
  const stopCanvasInteraction = (event: React.SyntheticEvent) => {
    event.stopPropagation();
  };

  return (
    <div
      data-slot="node-color-toolbar"
      role="toolbar"
      aria-label="Node colors"
      className="nodrag nopan nowheel absolute -top-11 left-1/2 z-50 flex -translate-x-1/2 items-center gap-1 rounded-xl border border-surface-border bg-surface/95 p-1.5 shadow-lg shadow-base/30 backdrop-blur-sm"
      onPointerDown={stopCanvasInteraction}
      onMouseDown={stopCanvasInteraction}
      onClick={stopCanvasInteraction}
      onDoubleClick={stopCanvasInteraction}
      onKeyDown={stopCanvasInteraction}
    >
      {NODE_COLORS.map((color) => {
        const isActive =
          activeColor.toLowerCase() === color.fill.toLowerCase() &&
          activeTextColor.toLowerCase() === color.text.toLowerCase();

        return (
          <button
            key={color.name}
            type="button"
            aria-label={`${color.name} node color`}
            aria-pressed={isActive}
            title={color.name}
            onClick={() => onSelect(color)}
            className={`nodrag nopan group/swatch relative flex h-5 w-5 items-center justify-center rounded-full border transition duration-150 hover:scale-110 hover:shadow-[0_0_6px_var(--swatch-glow)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 focus-visible:ring-offset-surface ${
              isActive
                ? "border-copy-primary ring-2 ring-brand/80 ring-offset-1 ring-offset-surface"
                : "border-surface-border-subtle"
            }`}
            style={{
              backgroundColor: color.fill,
              color: color.text,
              "--swatch-glow": color.text,
            } as React.CSSProperties}
          >
            {isActive ? <Check aria-hidden="true" className="h-3 w-3" /> : null}
          </button>
        );
      })}
    </div>
  );
}
