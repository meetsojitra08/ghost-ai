"use client";

import * as React from "react";
import {
  Background,
  BackgroundVariant,
  ConnectionMode,
  MarkerType,
  MiniMap,
  ReactFlow,
  ReactFlowProvider,
  useReactFlow,
} from "@xyflow/react";
import { Cursors, useLiveblocksFlow } from "@liveblocks/react-flow";

import "@xyflow/react/dist/style.css";
import "@liveblocks/react-ui/styles.css";
import "@liveblocks/react-flow/styles.css";

import {
  CANVAS_NODE_TYPE,
  CANVAS_EDGE_TYPE,
  DEFAULT_NODE_COLOR,
  DEFAULT_NODE_TEXT_COLOR,
  DEFAULT_SHAPE_SIZES,
  generateNodeId,
  parseShapeDragPayload,
  type CanvasEdge,
  type CanvasNode,
  type NodeColorDefinition,
  type NodeShape,
} from "@/types/canvas";
import { CanvasNodeRenderer } from "./canvas-node";
import { ShapePanel } from "./shape-panel";
import { ShapeDragPreview } from "./shape-drag-preview";
import { CanvasEdgeRenderer } from "./canvas-edge";
import { CanvasControls } from "./canvas-controls";
import type { CanvasTemplate } from "@/components/editor/starter-templates";

export interface CanvasTemplateImportRequest {
  id: number;
  template: CanvasTemplate;
}

// Module-level nodeTypes definition to prevent unnecessary React Flow re-renders
const nodeTypes = {
  [CANVAS_NODE_TYPE]: CanvasNodeRenderer,
};
const edgeTypes = {
  [CANVAS_EDGE_TYPE]: CanvasEdgeRenderer,
};

export interface CanvasNodeContextValue {
  updateNodeLabel: (nodeId: string, label: string) => void;
  updateNodeColor: (nodeId: string, color: NodeColorDefinition) => void;
  updateEdgeLabel: (edgeId: string, label: string) => void;
}

export const CanvasNodeContext =
  React.createContext<CanvasNodeContextValue | null>(null);

function EditorCanvasInner({
  templateImport,
  onTemplateImported,
}: {
  templateImport?: CanvasTemplateImportRequest | null;
  onTemplateImported?: (requestId: number) => void;
}) {
  const { nodes, edges, onNodesChange, onEdgesChange, onConnect, onDelete } =
    useLiveblocksFlow<CanvasNode, CanvasEdge>({
      suspense: true,
      nodes: {
        initial: [],
      },
      edges: {
        initial: [],
      },
    });

  const { screenToFlowPosition, fitView } = useReactFlow();
  const lastImportedRequestId = React.useRef<number | null>(null);

  React.useEffect(() => {
    if (!templateImport) return;
    if (lastImportedRequestId.current === templateImport.id) return;
    lastImportedRequestId.current = templateImport.id;

    // Apply removals first so imported IDs can never collide with existing room content.
    if (nodes.length > 0) {
      onNodesChange(nodes.map((node) => ({ type: "remove", id: node.id })));
    }
    if (edges.length > 0) {
      onEdgesChange(edges.map((edge) => ({ type: "remove", id: edge.id })));
    }

    const { template } = templateImport;
    if (template.nodes.length > 0) {
      onNodesChange(
        template.nodes.map((node) => ({ type: "add", item: node }))
      );
    }
    if (template.edges.length > 0) {
      onEdgesChange(
        template.edges.map((edge) => ({ type: "add", item: edge }))
      );
    }

    // Let React Flow observe the new collaborative storage snapshot before fitting.
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        void fitView({ padding: 0.2, duration: 350 });
        onTemplateImported?.(templateImport.id);
      });
    });
  }, [
    edges,
    fitView,
    nodes,
    onEdgesChange,
    onNodesChange,
    onTemplateImported,
    templateImport,
  ]);

  // Active shape drag preview state
  const [draggingShape, setDraggingShape] = React.useState<NodeShape | null>(
    null
  );
  const [dragPosition, setDragPosition] = React.useState<{
    x: number;
    y: number;
  } | null>(null);

  const handleDragShapeStart = React.useCallback(
    (shape: NodeShape, event: React.DragEvent) => {
      setDraggingShape(shape);
      setDragPosition({ x: event.clientX, y: event.clientY });
    },
    []
  );

  const handleDragShapeEnd = React.useCallback(() => {
    setDraggingShape(null);
    setDragPosition(null);
  }, []);

  // Track window drag events to keep preview attached to cursor across all surfaces
  React.useEffect(() => {
    if (!draggingShape) return;

    const handleWindowDragOver = (event: DragEvent) => {
      if (event.clientX !== 0 || event.clientY !== 0) {
        setDragPosition({ x: event.clientX, y: event.clientY });
      }
    };

    const handleWindowDragEnd = () => {
      setDraggingShape(null);
      setDragPosition(null);
    };

    window.addEventListener("dragover", handleWindowDragOver, { passive: true });
    window.addEventListener("dragend", handleWindowDragEnd);
    window.addEventListener("drop", handleWindowDragEnd);

    return () => {
      window.removeEventListener("dragover", handleWindowDragOver);
      window.removeEventListener("dragend", handleWindowDragEnd);
      window.removeEventListener("drop", handleWindowDragEnd);
    };
  }, [draggingShape]);

  const getNodeColor = React.useCallback((node: CanvasNode) => {
    return (node.data?.color as string) || DEFAULT_NODE_COLOR;
  }, []);

  const onDragOver = React.useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.stopPropagation();
    event.dataTransfer.dropEffect = "move";
    if (event.clientX !== 0 || event.clientY !== 0) {
      setDragPosition({ x: event.clientX, y: event.clientY });
    }
  }, []);

  const onDrop = React.useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();
      event.stopPropagation();

      // Clear drag preview on drop
      setDraggingShape(null);
      setDragPosition(null);

      const payload = parseShapeDragPayload(event);
      if (!payload) return;

      const position = screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });

      // Center the new node on the drop position
      const centeredPosition = {
        x: Math.round(position.x - payload.width / 2),
        y: Math.round(position.y - payload.height / 2),
      };

      const newNode: CanvasNode = {
        id: generateNodeId(payload.shape),
        type: CANVAS_NODE_TYPE,
        position: centeredPosition,
        data: {
          label: "",
          color: DEFAULT_NODE_COLOR,
          textColor: DEFAULT_NODE_TEXT_COLOR,
          shape: payload.shape,
        },
        width: payload.width,
        height: payload.height,
        style: {
          width: payload.width,
          height: payload.height,
        },
      };

      onNodesChange([{ type: "add", item: newNode }]);
    },
    [screenToFlowPosition, onNodesChange]
  );

  const handleAddShape = React.useCallback(
    (shape: NodeShape) => {
      const size = DEFAULT_SHAPE_SIZES[shape] || { width: 160, height: 80 };
      let position = { x: 250, y: 200 };

      if (typeof window !== "undefined") {
        const center = screenToFlowPosition({
          x: window.innerWidth / 2,
          y: window.innerHeight / 2,
        });
        position = {
          x: Math.round(center.x - size.width / 2),
          y: Math.round(center.y - size.height / 2),
        };
      }

      const newNode: CanvasNode = {
        id: generateNodeId(shape),
        type: CANVAS_NODE_TYPE,
        position,
        data: {
          label: "",
          color: DEFAULT_NODE_COLOR,
          textColor: DEFAULT_NODE_TEXT_COLOR,
          shape,
        },
        width: size.width,
        height: size.height,
        style: {
          width: size.width,
          height: size.height,
        },
      };

      onNodesChange([{ type: "add", item: newNode }]);
    },
    [screenToFlowPosition, onNodesChange]
  );

  const updateNodeLabel = React.useCallback(
    (nodeId: string, label: string) => {
      const node = nodes.find((n) => n.id === nodeId);
      if (!node) return;
      if (node.data.label === label) return;

      const updatedNode: CanvasNode = {
        ...node,
        data: {
          ...node.data,
          label,
        },
      };

      onNodesChange([
        {
          type: "replace",
          id: nodeId,
          item: updatedNode,
        },
      ]);
    },
    [nodes, onNodesChange]
  );

  const updateNodeColor = React.useCallback(
    (nodeId: string, color: NodeColorDefinition) => {
      const node = nodes.find((n) => n.id === nodeId);
      if (!node) return;
      if (node.data.color === color.fill && node.data.textColor === color.text) {
        return;
      }

      const updatedNode: CanvasNode = {
        ...node,
        data: {
          ...node.data,
          color: color.fill,
          textColor: color.text,
        },
      };

      onNodesChange([
        {
          type: "replace",
          id: nodeId,
          item: updatedNode,
        },
      ]);
    },
    [nodes, onNodesChange]
  );

  const updateEdgeLabel = React.useCallback(
    (edgeId: string, label: string) => {
      const edge = edges.find((item) => item.id === edgeId);
      if (!edge || edge.data?.label === label) return;

      onEdgesChange([
        {
          type: "replace",
          id: edgeId,
          item: { ...edge, data: { ...edge.data, label } },
        },
      ]);
    },
    [edges, onEdgesChange]
  );

  return (
    <CanvasNodeContext.Provider value={{ updateNodeLabel, updateNodeColor, updateEdgeLabel }}>
      <div
        data-slot="canvas-wrapper"
        className="relative h-full w-full overflow-hidden bg-base select-none"
        onDragOver={onDragOver}
        onDrop={onDrop}
      >
        <ReactFlow
          nodes={nodes}
          edges={edges}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onDelete={onDelete}
          onDragOver={onDragOver}
          onDrop={onDrop}
          connectionMode={ConnectionMode.Loose}
          defaultEdgeOptions={{
            type: CANVAS_EDGE_TYPE,
            style: {
              stroke: "var(--color-copy-secondary, #c0c0cc)",
              strokeWidth: 2,
              strokeLinecap: "round",
            },
            markerEnd: { type: MarkerType.ArrowClosed, color: "var(--color-copy-secondary, #c0c0cc)" },
          }}
          fitView
          colorMode="dark"
          className="h-full w-full bg-base"
          style={{
            backgroundColor: "var(--bg-base)",
            // Override React Flow's default dark mode background to match Ghost AI base color exactly
            ["--xy-background-color" as string]: "var(--bg-base)",
          }}
          proOptions={{ hideAttribution: true }}
        >
          <Background
            variant={BackgroundVariant.Dots}
            gap={24}
            size={1.5}
            color="var(--border-subtle, #3a3a42)"
            bgColor="var(--bg-base, #080809)"
          />
          <MiniMap
            className="!bg-surface !border-surface-border !border !rounded-2xl overflow-hidden !shadow-lg"
            maskColor="rgba(8, 8, 9, 0.75)"
            maskStrokeColor="var(--border-default)"
            nodeColor={getNodeColor}
            pannable
            zoomable
            ariaLabel="Canvas mini map"
          />
          <Cursors />
        </ReactFlow>

        {/* Ghost preview during shape drag */}
        <ShapeDragPreview shape={draggingShape} position={dragPosition} />

        {/* Floating shape panel toolbar */}
        <ShapePanel
          onAddShape={handleAddShape}
          onDragShapeStart={handleDragShapeStart}
          onDragShapeEnd={handleDragShapeEnd}
        />

        {/* Floating zoom and collaborative history controls */}
        <CanvasControls />
      </div>
    </CanvasNodeContext.Provider>
  );
}

export function EditorCanvas({
  templateImport,
  onTemplateImported,
}: {
  templateImport?: CanvasTemplateImportRequest | null;
  onTemplateImported?: (requestId: number) => void;
}) {
  return (
    <ReactFlowProvider>
      <EditorCanvasInner
        templateImport={templateImport}
        onTemplateImported={onTemplateImported}
      />
    </ReactFlowProvider>
  );
}
