"use client";

import * as React from "react";
import {
  Background,
  BackgroundVariant,
  ConnectionMode,
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
  DEFAULT_NODE_COLOR,
  DEFAULT_NODE_TEXT_COLOR,
  DEFAULT_SHAPE_SIZES,
  generateNodeId,
  parseShapeDragPayload,
  type CanvasEdge,
  type CanvasNode,
  type NodeShape,
} from "@/types/canvas";
import { CanvasNodeRenderer } from "./canvas-node";
import { ShapePanel } from "./shape-panel";

// Module-level nodeTypes definition to prevent unnecessary React Flow re-renders
const nodeTypes = {
  [CANVAS_NODE_TYPE]: CanvasNodeRenderer,
};

function EditorCanvasInner() {
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

  const { screenToFlowPosition } = useReactFlow();

  const getNodeColor = React.useCallback((node: CanvasNode) => {
    return (node.data?.color as string) || DEFAULT_NODE_COLOR;
  }, []);

  const onDragOver = React.useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.stopPropagation();
    event.dataTransfer.dropEffect = "move";
  }, []);

  const onDrop = React.useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();
      event.stopPropagation();

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

  return (
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
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onDelete={onDelete}
        onDragOver={onDragOver}
        onDrop={onDrop}
        connectionMode={ConnectionMode.Loose}
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

      {/* Floating shape panel toolbar */}
      <ShapePanel onAddShape={handleAddShape} />
    </div>
  );
}

export function EditorCanvas() {
  return (
    <ReactFlowProvider>
      <EditorCanvasInner />
    </ReactFlowProvider>
  );
}
