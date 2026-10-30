"use client";

import * as React from "react";
import { ArrowRight, Boxes } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { CANVAS_TEMPLATES, type CanvasTemplate } from "./starter-templates";

const PREVIEW_WIDTH = 320;
const PREVIEW_HEIGHT = 148;
const PREVIEW_PADDING = 18;

function getNodeSize(node: CanvasTemplate["nodes"][number]) {
  return {
    width: node.width ?? node.measured?.width ?? 160,
    height: node.height ?? node.measured?.height ?? 80,
  };
}

function TemplatePreview({ template }: { template: CanvasTemplate }) {
  const bounds = React.useMemo(() => {
    const nodes = template.nodes;
    if (nodes.length === 0) {
      return { minX: 0, minY: 0, width: 1, height: 1 };
    }

    const minX = Math.min(...nodes.map((node) => node.position.x));
    const minY = Math.min(...nodes.map((node) => node.position.y));
    const maxX = Math.max(
      ...nodes.map((node) => node.position.x + getNodeSize(node).width)
    );
    const maxY = Math.max(
      ...nodes.map((node) => node.position.y + getNodeSize(node).height)
    );
    return { minX, minY, width: maxX - minX, height: maxY - minY };
  }, [template]);

  const scale = Math.min(
    (PREVIEW_WIDTH - PREVIEW_PADDING * 2) / bounds.width,
    (PREVIEW_HEIGHT - PREVIEW_PADDING * 2) / bounds.height
  );
  const offsetX = (PREVIEW_WIDTH - bounds.width * scale) / 2;
  const offsetY = (PREVIEW_HEIGHT - bounds.height * scale) / 2;
  const position = (x: number, y: number) => ({
    x: offsetX + (x - bounds.minX) * scale,
    y: offsetY + (y - bounds.minY) * scale,
  });
  const nodeById = new Map(template.nodes.map((node) => [node.id, node]));

  return (
    <svg
      aria-hidden="true"
      viewBox={`0 0 ${PREVIEW_WIDTH} ${PREVIEW_HEIGHT}`}
      className="h-full w-full"
      preserveAspectRatio="xMidYMid meet"
    >
      {template.edges.map((edge) => {
        const source = nodeById.get(edge.source);
        const target = nodeById.get(edge.target);
        if (!source || !target) return null;
        const sourceSize = getNodeSize(source);
        const targetSize = getNodeSize(target);
        const start = position(
          source.position.x + sourceSize.width / 2,
          source.position.y + sourceSize.height / 2
        );
        const end = position(
          target.position.x + targetSize.width / 2,
          target.position.y + targetSize.height / 2
        );
        return (
          <line
            key={edge.id}
            x1={start.x}
            y1={start.y}
            x2={end.x}
            y2={end.y}
            stroke="var(--text-faint)"
            strokeWidth="1.5"
          />
        );
      })}

      {template.nodes.map((node) => {
        const size = getNodeSize(node);
        const topLeft = position(node.position.x, node.position.y);
        const width = size.width * scale;
        const height = size.height * scale;
        const shape = node.data.shape ?? "rectangle";
        const fill = node.data.color ?? "var(--bg-subtle)";
        const stroke = "var(--border-subtle)";
        const shapeView =
          shape === "diamond" ? (
            <polygon
              points={`${topLeft.x + width / 2},${topLeft.y} ${topLeft.x + width},${topLeft.y + height / 2} ${topLeft.x + width / 2},${topLeft.y + height} ${topLeft.x},${topLeft.y + height / 2}`}
              fill={fill}
              stroke={stroke}
            />
          ) : shape === "hexagon" ? (
            <polygon
              points={`${topLeft.x + width * 0.18},${topLeft.y} ${topLeft.x + width * 0.82},${topLeft.y} ${topLeft.x + width},${topLeft.y + height / 2} ${topLeft.x + width * 0.82},${topLeft.y + height} ${topLeft.x + width * 0.18},${topLeft.y + height} ${topLeft.x},${topLeft.y + height / 2}`}
              fill={fill}
              stroke={stroke}
            />
          ) : shape === "cylinder" ? (
            <g>
              <path
                d={`M ${topLeft.x} ${topLeft.y + height * 0.2} C ${topLeft.x} ${topLeft.y} ${topLeft.x + width} ${topLeft.y} ${topLeft.x + width} ${topLeft.y + height * 0.2} L ${topLeft.x + width} ${topLeft.y + height * 0.8} C ${topLeft.x + width} ${topLeft.y + height} ${topLeft.x} ${topLeft.y + height} ${topLeft.x} ${topLeft.y + height * 0.8} Z`}
                fill={fill}
                stroke={stroke}
              />
              <ellipse
                cx={topLeft.x + width / 2}
                cy={topLeft.y + height * 0.2}
                rx={width / 2}
                ry={height * 0.2}
                fill={fill}
                stroke={stroke}
              />
            </g>
          ) : (
            <rect
              x={topLeft.x}
              y={topLeft.y}
              width={width}
              height={height}
              rx={shape === "circle" ? Math.min(width, height) / 2 : shape === "pill" ? height / 2 : 5}
              fill={fill}
              stroke={stroke}
            />
          );

        return (
          <g key={node.id}>
            {shapeView}
            <text
              x={topLeft.x + width / 2}
              y={topLeft.y + height / 2}
              fill={node.data.textColor ?? "var(--text-primary)"}
              fontSize="9"
              textAnchor="middle"
              dominantBaseline="central"
            >
              {node.data.label}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

export interface StarterTemplatesModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImport: (template: CanvasTemplate) => void;
}

export function StarterTemplatesModal({
  open,
  onOpenChange,
  onImport,
}: StarterTemplatesModalProps) {
  const handleImport = (template: CanvasTemplate) => {
    onImport(template);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[min(90vh,760px)] max-w-4xl gap-5 overflow-hidden rounded-3xl border border-surface-border bg-elevated p-6 text-copy-primary sm:max-w-4xl">
        <DialogHeader className="gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-brand/20 bg-accent-dim text-brand">
            <Boxes className="h-5 w-5" />
          </div>
          <DialogTitle className="text-lg font-semibold tracking-tight text-copy-primary">
            Starter templates
          </DialogTitle>
          <DialogDescription className="text-sm text-copy-muted">
            Choose a diagram to replace the current canvas and start editing.
          </DialogDescription>
        </DialogHeader>

        <div className="grid min-h-0 gap-4 overflow-y-auto pr-1 sm:grid-cols-2 lg:grid-cols-3">
          {CANVAS_TEMPLATES.map((template) => (
            <article
              key={template.id}
              className="flex min-w-0 flex-col overflow-hidden rounded-2xl border border-surface-border bg-surface"
            >
              <div className="h-36 border-b border-surface-border-subtle bg-base p-2">
                <TemplatePreview template={template} />
              </div>
              <div className="flex flex-1 flex-col p-4">
                <h3 className="text-sm font-semibold text-copy-primary">{template.name}</h3>
                <p className="mt-1.5 flex-1 text-xs leading-relaxed text-copy-muted">
                  {template.description}
                </p>
                <Button
                  type="button"
                  size="sm"
                  onClick={() => handleImport(template)}
                  className="mt-4 w-full gap-2 rounded-xl"
                >
                  Import template
                  <ArrowRight className="h-3.5 w-3.5" />
                </Button>
              </div>
            </article>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
