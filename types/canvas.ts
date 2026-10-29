import type { Edge, Node } from "@xyflow/react";

/**
 * Supported node shapes on the Ghost AI canvas.
 * Complex shapes (diamond, hexagon, cylinder) are rendered as inline SVGs.
 */
export const NODE_SHAPES = [
  "rectangle",
  "diamond",
  "circle",
  "pill",
  "cylinder",
  "hexagon",
] as const;

export type NodeShape = (typeof NODE_SHAPES)[number];

export interface NodeColorDefinition {
  fill: string;
  text: string;
  name: string;
}

/**
 * 8 defined dark node color palette pairs from context/ui-context.md.
 * Each pair specifies a dark node fill and a vivid contrasting text color.
 */
export const NODE_COLORS: readonly NodeColorDefinition[] = [
  { fill: "#1F1F1F", text: "#EDEDED", name: "Neutral dark" },
  { fill: "#10233D", text: "#52A8FF", name: "Blue" },
  { fill: "#2E1938", text: "#BF7AF0", name: "Purple" },
  { fill: "#331B00", text: "#FF990A", name: "Orange" },
  { fill: "#3C1618", text: "#FF6166", name: "Red" },
  { fill: "#3A1726", text: "#F75F8F", name: "Pink" },
  { fill: "#0F2E18", text: "#62C073", name: "Green" },
  { fill: "#062822", text: "#0AC7B4", name: "Teal" },
] as const;

export const DEFAULT_NODE_COLOR = "#1F1F1F";
export const DEFAULT_NODE_TEXT_COLOR = "#EDEDED";
export const DEFAULT_EDGE_COLOR = "#f8fafc";

/**
 * React Flow node and edge type identifiers.
 */
export const CANVAS_NODE_TYPE = "canvasNode" as const;
export const CANVAS_EDGE_TYPE = "canvasEdge" as const;

export type CanvasNodeType = typeof CANVAS_NODE_TYPE;
export type CanvasEdgeType = typeof CANVAS_EDGE_TYPE;

/**
 * Shared canvas node data contract.
 */
export interface CanvasNodeData extends Record<string, unknown> {
  label: string;
  color?: string;
  shape?: NodeShape;
  textColor?: string;
}

/**
 * Shared canvas node and edge contracts for React Flow.
 */
export type CanvasNode = Node<CanvasNodeData, CanvasNodeType>;
export type CanvasEdge = Edge<Record<string, unknown>, CanvasEdgeType>;

// Lowercase type aliases matching feature spec requirements
export type canvasNode = CanvasNode;
export type canvasEdge = CanvasEdge;

export interface ShapeDimensions {
  width: number;
  height: number;
}

/**
 * Sensible default dimensions for each supported canvas node shape.
 * - rectangles: wider than tall
 * - circles: square
 * - diamonds: slightly larger than circles so labels have room
 * - pills: wider than tall
 */
export const DEFAULT_SHAPE_SIZES: Record<NodeShape, ShapeDimensions> = {
  rectangle: { width: 160, height: 80 },
  diamond: { width: 120, height: 120 },
  circle: { width: 96, height: 96 },
  pill: { width: 150, height: 60 },
  cylinder: { width: 120, height: 90 },
  hexagon: { width: 130, height: 90 },
};

/**
 * Drag payload contract passed during shape dragging from the bottom shape panel.
 */
export interface ShapeDragPayload {
  shape: NodeShape;
  defaultSize: ShapeDimensions;
  size: ShapeDimensions;
  width: number;
  height: number;
}

let nodeCounter = 0;

/**
 * Generate each node ID using the shape name, timestamp, and a counter.
 * e.g. "rectangle-1730210000000-1"
 */
export function generateNodeId(shape: string): string {
  nodeCounter += 1;
  return `${shape}-${Date.now()}-${nodeCounter}`;
}

export function resetNodeCounter(): void {
  nodeCounter = 0;
}

/**
 * Helper to construct a standard shape drag payload.
 */
export function createShapeDragPayload(shape: NodeShape): ShapeDragPayload {
  const size = DEFAULT_SHAPE_SIZES[shape] || { width: 160, height: 80 };
  return {
    shape,
    defaultSize: { ...size },
    size: { ...size },
    width: size.width,
    height: size.height,
  };
}

/**
 * Helper to safely extract and parse shape drag payload from a DragEvent.
 * Supports multiple data formats: application/reactflow, nodeType, shape, text/plain, payload, and application/json.
 */
export function parseShapeDragPayload(event: React.DragEvent): ShapeDragPayload | null {
  const formats = [
    "application/reactflow",
    "nodeType",
    "shape",
    "text/plain",
    "payload",
    "application/json",
  ];

  for (const format of formats) {
    let data: string | null = null;
    try {
      data = event.dataTransfer.getData(format);
    } catch {
      continue;
    }

    if (!data || typeof data !== "string") continue;
    const trimmed = data.trim();
    if (!trimmed) continue;

    // Direct shape name check
    if ((NODE_SHAPES as readonly string[]).includes(trimmed)) {
      return createShapeDragPayload(trimmed as NodeShape);
    }

    // Try JSON parsing
    try {
      const parsed = JSON.parse(trimmed);
      if (typeof parsed === "string" && (NODE_SHAPES as readonly string[]).includes(parsed)) {
        return createShapeDragPayload(parsed as NodeShape);
      }
      if (parsed && typeof parsed === "object") {
        const shape = (parsed.shape || parsed.nodeType || parsed.type) as NodeShape;
        if ((NODE_SHAPES as readonly string[]).includes(shape)) {
          const fallback = DEFAULT_SHAPE_SIZES[shape] || { width: 160, height: 80 };
          const defaultSize = parsed.defaultSize || parsed.size || {
            width: typeof parsed.width === "number" ? parsed.width : fallback.width,
            height: typeof parsed.height === "number" ? parsed.height : fallback.height,
          };
          return {
            shape,
            defaultSize,
            size: defaultSize,
            width: defaultSize.width,
            height: defaultSize.height,
          };
        }
      }
    } catch {
      // not JSON, continue to next format
    }
  }

  return null;
}


