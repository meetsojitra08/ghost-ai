"use client";

import * as React from "react";
import {
  DEFAULT_NODE_COLOR,
  DEFAULT_NODE_TEXT_COLOR,
  DEFAULT_SHAPE_SIZES,
  type NodeShape,
} from "@/types/canvas";

export function isSvgShape(shape?: string | null): boolean {
  return shape === "diamond" || shape === "hexagon" || shape === "cylinder";
}

export interface NodeShapeViewProps {
  shape?: NodeShape;
  width?: number;
  height?: number;
  fillColor?: string;
  textColor?: string;
  selected?: boolean;
  isGhost?: boolean;
  label?: string;
  placeholder?: string;
  labelContent?: React.ReactNode;
  onDoubleClick?: (event: React.MouseEvent) => void;
  className?: string;
  style?: React.CSSProperties;
  children?: React.ReactNode;
}

/**
 * Reusable component for rendering all 6 canvas node shapes:
 * - CSS shapes: rectangle, pill, circle
 * - Scalable SVG shapes: diamond, hexagon, cylinder
 *
 * Supports subtle borders at rest, brighter borders when selected,
 * and translucent dashed styling when rendered as a drag preview ghost.
 */
export function NodeShapeView({
  shape = "rectangle",
  width,
  height,
  fillColor = DEFAULT_NODE_COLOR,
  textColor = DEFAULT_NODE_TEXT_COLOR,
  selected = false,
  isGhost = false,
  label = "",
  placeholder = "",
  labelContent,
  onDoubleClick,
  className = "",
  style,
  children,
}: NodeShapeViewProps) {
  const defaultSize = DEFAULT_SHAPE_SIZES[shape] ?? { width: 160, height: 80 };
  const w = width ?? defaultSize.width;
  const h = height ?? defaultSize.height;

  // 1. Scalable SVG shapes: diamond, hexagon, cylinder
  if (isSvgShape(shape)) {
    const stroke = isGhost
      ? "var(--color-brand, #00c8d4)"
      : selected
      ? "var(--color-brand, #00c8d4)"
      : "var(--color-surface-border, #2a2a30)";

    const strokeWidth = selected ? 2 : 1.5;
    const strokeDasharray = isGhost ? "4 3" : undefined;
    const fill = isGhost ? "rgba(24, 24, 28, 0.75)" : fillColor;
    const strokeInset = 1;

    let svgContent: React.ReactNode = null;

    if (shape === "diamond") {
      const points = [
        `${w / 2},${strokeInset}`,
        `${w - strokeInset},${h / 2}`,
        `${w / 2},${h - strokeInset}`,
        `${strokeInset},${h / 2}`,
      ].join(" ");

      svgContent = (
        <polygon
          points={points}
          fill={fill}
          stroke={stroke}
          strokeWidth={strokeWidth}
          strokeDasharray={strokeDasharray}
          vectorEffect="non-scaling-stroke"
          className={
            selected
              ? "drop-shadow-[0_0_8px_rgba(0,200,212,0.35)]"
              : isGhost
              ? "drop-shadow-[0_0_6px_rgba(0,200,212,0.2)]"
              : "transition-colors group-hover:stroke-surface-border-subtle"
          }
        />
      );
    } else if (shape === "hexagon") {
      // Pointy left and right, flat top and bottom
      const offset = Math.max(12, Math.min(w * 0.18, 30));
      const points = [
        `${offset},${strokeInset}`,
        `${w - offset},${strokeInset}`,
        `${w - strokeInset},${h / 2}`,
        `${w - offset},${h - strokeInset}`,
        `${offset},${h - strokeInset}`,
        `${strokeInset},${h / 2}`,
      ].join(" ");

      svgContent = (
        <polygon
          points={points}
          fill={fill}
          stroke={stroke}
          strokeWidth={strokeWidth}
          strokeDasharray={strokeDasharray}
          vectorEffect="non-scaling-stroke"
          className={
            selected
              ? "drop-shadow-[0_0_8px_rgba(0,200,212,0.35)]"
              : isGhost
              ? "drop-shadow-[0_0_6px_rgba(0,200,212,0.2)]"
              : "transition-colors group-hover:stroke-surface-border-subtle"
          }
        />
      );
    } else if (shape === "cylinder") {
      const ry = Math.max(10, Math.min(h * 0.2, 22));
      const rx = Math.max(10, (w - 2 * strokeInset) / 2);

      const outerPath = `M ${strokeInset} ${ry} L ${strokeInset} ${h - ry} A ${rx} ${ry} 0 0 0 ${w - strokeInset} ${h - ry} L ${w - strokeInset} ${ry} A ${rx} ${ry} 0 0 0 ${strokeInset} ${ry} Z`;
      const capRimPath = `M ${strokeInset} ${ry} A ${rx} ${ry} 0 0 0 ${w - strokeInset} ${ry}`;

      svgContent = (
        <g
          className={
            selected
              ? "drop-shadow-[0_0_8px_rgba(0,200,212,0.35)]"
              : isGhost
              ? "drop-shadow-[0_0_6px_rgba(0,200,212,0.2)]"
              : "transition-colors group-hover:stroke-surface-border-subtle"
          }
        >
          <path
            d={outerPath}
            fill={fill}
            stroke={stroke}
            strokeWidth={strokeWidth}
            strokeDasharray={strokeDasharray}
            vectorEffect="non-scaling-stroke"
          />
          <path
            d={capRimPath}
            fill="none"
            stroke={stroke}
            strokeWidth={strokeWidth}
            strokeDasharray={strokeDasharray}
            vectorEffect="non-scaling-stroke"
          />
        </g>
      );
    }

    return (
      <div
        data-shape={shape}
        onDoubleClick={onDoubleClick}
        className={`group relative flex h-full w-full items-center justify-center select-none ${className}`}
        style={{
          width: w,
          height: h,
          color: textColor,
          ...style,
        }}
      >
        <svg
          data-slot="shape-svg"
          className="absolute inset-0 h-full w-full pointer-events-none overflow-visible"
          width="100%"
          height="100%"
          viewBox={`0 0 ${w} ${h}`}
          preserveAspectRatio="none"
          fill="none"
        >
          {svgContent}
        </svg>

        {labelContent ? (
          labelContent
        ) : label ? (
          <span className="relative z-10 text-sm font-medium tracking-tight break-words pointer-events-none px-3 max-w-[80%] text-center">
            {label}
          </span>
        ) : placeholder ? (
          <span className="relative z-10 text-sm font-medium tracking-tight break-words pointer-events-none px-3 max-w-[80%] text-center text-copy-muted/50 italic select-none">
            {placeholder}
          </span>
        ) : null}

        {children}
      </div>
    );
  }

  // 2. CSS shapes: rectangle, pill, circle
  let shapeClass = "rounded-xl";
  if (shape === "pill") {
    shapeClass = "rounded-full";
  } else if (shape === "circle") {
    shapeClass = "rounded-full aspect-square";
  }

  const borderClass = isGhost
    ? "border border-dashed border-brand/60 shadow-lg shadow-brand/10"
    : selected
    ? "border-brand ring-2 ring-brand/40 shadow-lg shadow-brand/10"
    : "border-surface-border hover:border-surface-border-subtle";

  const bgStyle = isGhost ? "rgba(24, 24, 28, 0.75)" : fillColor;

  return (
    <div
      data-shape={shape}
      onDoubleClick={onDoubleClick}
      className={`group relative flex h-full w-full items-center justify-center border p-3 text-center transition-all select-none ${shapeClass} ${borderClass} ${className}`}
      style={{
        width: w,
        height: h,
        backgroundColor: bgStyle,
        color: textColor,
        ...style,
      }}
    >
      {labelContent ? (
        labelContent
      ) : label ? (
        <span className="text-sm font-medium tracking-tight break-words pointer-events-none px-2 max-w-full text-center">
          {label}
        </span>
      ) : placeholder ? (
        <span className="text-sm font-medium tracking-tight break-words pointer-events-none px-2 max-w-full text-center text-copy-muted/50 italic select-none">
          {placeholder}
        </span>
      ) : null}

      {children}
    </div>
  );
}

