import { logger, metadata, task } from "@trigger.dev/sdk";
import { createGoogle } from "@ai-sdk/google";
import { generateText, Output } from "ai";
import { z } from "zod";
import { LiveObject, LiveMap, type LsonObject } from "@liveblocks/node";
import { MarkerType } from "@xyflow/react";

import { liveblocks } from "@/lib/liveblocks";
import { AI_STATUS_FEED_ID } from "@/types/tasks";
import {
  CANVAS_NODE_TYPE,
  CANVAS_EDGE_TYPE,
  DEFAULT_NODE_COLOR,
  DEFAULT_NODE_TEXT_COLOR,
  DEFAULT_SHAPE_SIZES,
  NODE_SHAPES,
  type CanvasEdge,
  type CanvasNode,
  type NodeShape,
} from "@/types/canvas";

export interface DesignAgentPayload {
  prompt: string;
  roomId: string;
  projectId?: string;
}

export interface DesignAgentOutput {
  success: boolean;
  prompt: string;
  roomId: string;
  projectId?: string;
  summary?: string;
  actionsCount?: number;
  error?: string;
}

/**
 * 8 defined dark node color palette pairs from context/ui-context.md.
 * Maps each dark fill color directly to its high-contrast text color.
 */
export const PALETTE_FILL_TO_TEXT: Record<string, string> = {
  "#1F1F1F": "#EDEDED", // Neutral dark (default)
  "#10233D": "#52A8FF", // Blue
  "#2E1938": "#BF7AF0", // Purple
  "#331B00": "#FF990A", // Orange
  "#3C1618": "#FF6166", // Red
  "#3A1726": "#F75F8F", // Pink
  "#0F2E18": "#62C073", // Green
  "#062822": "#0AC7B4", // Teal
};

export const ALLOWED_FILL_COLORS = [
  "#1F1F1F",
  "#10233D",
  "#2E1938",
  "#331B00",
  "#3C1618",
  "#3A1726",
  "#0F2E18",
  "#062822",
] as const;

export const AI_AGENT_USER_ID = "ghost-ai";
export const AI_AGENT_USER_INFO = {
  name: "Ghost AI",
  color: "#6457f9",
  avatar: "",
};

/**
 * Zod schema defining the structured canvas mutations produced by the AI design agent.
 */
export const CanvasActionSchema = z.object({
  type: z.enum([
    "add_node",
    "move_node",
    "resize_node",
    "update_node_data",
    "delete_node",
    "add_edge",
    "delete_edge",
  ]),
  id: z.string().describe("ID of the node or edge"),
  shape: z
    .enum(["rectangle", "diamond", "circle", "pill", "cylinder", "hexagon"])
    .optional()
    .describe("Node shape according to architectural semantics"),
  label: z.string().optional().describe("Label/title text for the node or edge"),
  fill: z
    .enum([
      "#1F1F1F",
      "#10233D",
      "#2E1938",
      "#331B00",
      "#3C1618",
      "#3A1726",
      "#0F2E18",
      "#062822",
    ])
    .optional()
    .describe("Fill color selected from the Ghost AI dark palette"),
  position: z
    .object({
      x: z.number().describe("X coordinate in canvas space"),
      y: z.number().describe("Y coordinate in canvas space"),
    })
    .optional()
    .describe("Target canvas coordinates"),
  width: z.number().optional().describe("Node width in pixels"),
  height: z.number().optional().describe("Node height in pixels"),
  source: z.string().optional().describe("Source node ID for an edge"),
  target: z.string().optional().describe("Target node ID for an edge"),
});

export const DesignAgentPlanSchema = z.object({
  summary: z
    .string()
    .describe("A concise summary of the architectural design decisions and changes"),
  actions: z
    .array(CanvasActionSchema)
    .describe("Ordered list of canvas mutation actions"),
});

export type CanvasAction = z.infer<typeof CanvasActionSchema>;
export type DesignAgentPlan = z.infer<typeof DesignAgentPlanSchema>;

/**
 * Updates AI presence in the Liveblocks room.
 */
export async function updateAiPresence(
  roomId: string,
  cursor: { x: number; y: number } | null,
  thinking: boolean,
  ttl = 120
): Promise<void> {
  try {
    await liveblocks.setPresence(roomId, {
      userId: AI_AGENT_USER_ID,
      userInfo: AI_AGENT_USER_INFO,
      data: {
        cursor,
        thinking,
      },
      ttl,
    });
  } catch (error) {
    logger.warn("Failed to set AI presence in Liveblocks", { error });
  }
}

/**
 * Clears AI presence from the room when the task completes or terminates.
 */
export async function clearAiPresence(roomId: string): Promise<void> {
  try {
    await liveblocks.setPresence(roomId, {
      userId: AI_AGENT_USER_ID,
      userInfo: AI_AGENT_USER_INFO,
      data: {
        cursor: null,
        thinking: false,
      },
      ttl: 1,
    });
  } catch (error) {
    logger.warn("Failed to clear AI presence from Liveblocks", { error });
  }
}

/**
 * Publishes an AI activity message to the room's event feed and Trigger.dev run metadata.
 */
export async function publishAiStatus(
  roomId: string,
  status: "start" | "processing" | "complete" | "error",
  message: string
): Promise<void> {
  try {
    metadata.set("status", status).set("message", message);
  } catch {
    // metadata is run-scoped
  }

  try {
    await liveblocks.broadcastEvent(roomId, {
      type: "ai-status",
      status,
      message,
      timestamp: Date.now(),
    });
  } catch (error) {
    logger.warn("Failed to broadcast AI status event", { error });
  }

  try {
    await liveblocks.createFeedMessage({
      roomId,
      feedId: AI_STATUS_FEED_ID,
      data: {
        status,
        text: message,
        message,
        type: "design",
        timestamp: Date.now(),
      },
    });
  } catch {
    try {
      await liveblocks.createFeed({ roomId, feedId: AI_STATUS_FEED_ID });
      await liveblocks.createFeedMessage({
        roomId,
        feedId: AI_STATUS_FEED_ID,
        data: {
          status,
          text: message,
          message,
          type: "design",
          timestamp: Date.now(),
        },
      });
    } catch (feedError) {
      logger.warn("Failed to create feed message in ai-status-feed", { feedError });
    }
  }
}

/**
 * Retrieves the current canvas nodes and edges stored in the Liveblocks room.
 */
export async function getRoomCanvasState(
  roomId: string
): Promise<{ nodes: CanvasNode[]; edges: CanvasEdge[] }> {
  try {
    const doc = (await liveblocks.getStorageDocument(roomId, "json")) as {
      flow?: {
        nodes?: Record<string, CanvasNode>;
        edges?: Record<string, CanvasEdge>;
      };
    };

    const nodes = doc?.flow?.nodes ? Object.values(doc.flow.nodes) : [];
    const edges = doc?.flow?.edges ? Object.values(doc.flow.edges) : [];

    return { nodes, edges };
  } catch (error) {
    logger.warn("Could not read current room canvas storage, defaulting to empty", {
      error,
    });
    return { nodes: [], edges: [] };
  }
}

/**
 * Interprets the user prompt and generates an architecture mutation plan using Gemini.
 */
export async function generateArchitecturePlan(
  prompt: string,
  existingNodes: CanvasNode[],
  existingEdges: CanvasEdge[]
): Promise<DesignAgentPlan> {
  const apiKey =
    process.env.GOOGLE_AI_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY;
  if (!apiKey) {
    throw new Error("Missing GOOGLE_AI_API_KEY environment variable");
  }

  const google = createGoogle({ apiKey });

  const systemInstructions = `You are Ghost AI, an expert system architecture and collaborative diagram designer.
Your goal is to map user system descriptions onto an interactive 2D node-and-edge canvas.

### Allowed Node Shapes & Semantics:
- "rectangle": General purpose component, frontends, APIs, controllers
- "diamond": Decision gateways, load balancers, reverse proxies, routers
- "circle": Event triggers, clients, users, entry/exit points, webhooks
- "pill": Microservices, serverless functions, background workers, compute services
- "cylinder": Databases (SQL, NoSQL), caches (Redis, Memcached), storage, data lakes
- "hexagon": External third-party systems, external APIs, SaaS integrations, payment gateways

### Allowed Node Color Palette (Dark Theme):
You must select "fill" from these 8 predefined hex colors:
- "#1F1F1F": Neutral dark (default general components)
- "#10233D": Blue (gateways, routers, primary services)
- "#2E1938": Purple (specialized services, AI agents, workers)
- "#331B00": Orange (event buses, streaming, queues, Kafka, RabbitMQ)
- "#3C1618": Red (security, auth, alerts, critical paths)
- "#3A1726": Pink (analytics, logging, metrics, monitoring)
- "#0F2E18": Green (databases, primary datastores, persistence)
- "#062822": Teal (caches, Redis, CDNs, fast key-value stores)

### Canvas Layout & Spacing Rules:
- Layout structure: Organize components in clean, tiered, logical layers (Top-to-Bottom or Left-to-Right).
  * Layer 1 (Top, Y: 100-180): Clients, Users, CDN, DNS, Load Balancer
  * Layer 2 (Middle-upper, Y: 280-380): API Gateway, Auth, Primary Services
  * Layer 3 (Middle-lower, Y: 480-580): Background Workers, Queues, Event Brokers
  * Layer 4 (Bottom, Y: 680-780): Databases, Caches, External APIs
- Horizontal Spacing: Place sibling nodes separated by 200px to 260px horizontally (e.g. X: 100, 360, 620, 880).
- Standard Node Dimensions:
  * rectangle: 160 x 80
  * pill: 150 x 60
  * diamond: 120 x 120
  * circle: 96 x 96
  * cylinder: 120 x 90
  * hexagon: 130 x 90
- Ensure nodes do not overlap.
- Edges: Add meaningful directed edges from source to target with clear labels (e.g. "HTTPS", "gRPC", "SQL", "Publish", "Subscribe").

### Existing Canvas State:
${
  existingNodes.length === 0
    ? "The canvas is currently empty. Design a complete, well-architected system according to the user request."
    : `The canvas currently has ${existingNodes.length} nodes and ${existingEdges.length} edges:
Nodes: ${JSON.stringify(
        existingNodes.map((n) => ({
          id: n.id,
          label: n.data?.label,
          shape: n.data?.shape,
          position: n.position,
        }))
      )}
Edges: ${JSON.stringify(
        existingEdges.map((e) => ({
          id: e.id,
          source: e.source,
          target: e.target,
          label: e.data?.label,
        }))
      )}
If the user wants to extend or modify the architecture (e.g. "add a cache to auth", "remove payment service", "move database"), produce precise actions (add_node, move_node, resize_node, update_node_data, delete_node, add_edge, delete_edge) that modify the existing graph without breaking unconnected nodes. If the user wants a completely new design, replace or update as appropriate.`
}`;

  const modelsToTry = [
    process.env.GEMINI_MODEL || "gemini-3.8-flash",
    "gemini-3.5-flash",
    "gemini-3.7-flash",
    "gemini-flash-latest",
  ];

  let lastError: unknown;
  for (const modelName of modelsToTry) {
    try {
      logger.info(`Attempting AI generation with model: ${modelName}`);
      const result = await generateText({
        model: google(modelName),
        system: systemInstructions,
        prompt,
        output: Output.object({ schema: DesignAgentPlanSchema }),
      });

      if (result.output) {
        return result.output;
      }
    } catch (err) {
      lastError = err;
      logger.warn(`Model ${modelName} failed or throttled, trying next model...`, {
        error: err instanceof Error ? err.message : String(err),
      });
    }
  }

  throw lastError instanceof Error
    ? lastError
    : new Error(`Failed to generate architecture plan with Gemini: ${String(lastError)}`);
}

/**
 * Executes canvas mutations in Liveblocks room storage using existing collaborative flow utilities.
 */
export async function applyCanvasActions(
  roomId: string,
  actions: CanvasAction[]
): Promise<void> {
  await liveblocks.mutateStorage(roomId, ({ root }) => {
    const rootObj = root as unknown as LiveObject<LsonObject>;
    let flow = rootObj.get("flow") as LiveObject<LsonObject> | undefined;
    if (!flow) {
      flow = new LiveObject<LsonObject>({
        nodes: new LiveMap<string, LiveObject<LsonObject>>(),
        edges: new LiveMap<string, LiveObject<LsonObject>>(),
      });
      rootObj.set("flow", flow);
    }

    let nodesMap = flow.get("nodes") as
      | LiveMap<string, LiveObject<LsonObject>>
      | undefined;
    if (!nodesMap) {
      nodesMap = new LiveMap<string, LiveObject<LsonObject>>();
      flow.set("nodes", nodesMap);
    }

    let edgesMap = flow.get("edges") as
      | LiveMap<string, LiveObject<LsonObject>>
      | undefined;
    if (!edgesMap) {
      edgesMap = new LiveMap<string, LiveObject<LsonObject>>();
      flow.set("edges", edgesMap);
    }

    for (const action of actions) {
      switch (action.type) {
        case "add_node": {
          const shape: NodeShape =
            action.shape && (NODE_SHAPES as readonly string[]).includes(action.shape)
              ? (action.shape as NodeShape)
              : "rectangle";
          const defaultDim = DEFAULT_SHAPE_SIZES[shape] || { width: 160, height: 80 };
          const width = action.width || defaultDim.width;
          const height = action.height || defaultDim.height;
          const fill = action.fill || DEFAULT_NODE_COLOR;
          const textColor = PALETTE_FILL_TO_TEXT[fill] || DEFAULT_NODE_TEXT_COLOR;
          const position = action.position || { x: 250, y: 200 };

          const nodeData = {
            id: action.id,
            type: CANVAS_NODE_TYPE,
            position,
            data: {
              label: action.label || "Component",
              shape,
              color: fill,
              textColor,
            },
            width,
            height,
            style: {
              width,
              height,
            },
          } as unknown as LsonObject;
          nodesMap.set(action.id, new LiveObject<LsonObject>(nodeData));
          break;
        }

        case "move_node": {
          const node = nodesMap.get(action.id);
          if (node && action.position) {
            node.set("position", action.position);
          }
          break;
        }

        case "resize_node": {
          const node = nodesMap.get(action.id);
          if (node) {
            const width = action.width || 160;
            const height = action.height || 80;
            node.set("width", width);
            node.set("height", height);
            const currentStyle = (node.get("style") as Record<string, unknown>) || {};
            node.set("style", { ...currentStyle, width, height });
          }
          break;
        }

        case "update_node_data": {
          const node = nodesMap.get(action.id);
          if (node) {
            const targetNode = node as unknown as {
              get: (key: string) => unknown;
              set: (key: string, value: unknown) => void;
            };
            const currentData = (targetNode.get("data") as Record<string, unknown>) || {};
            const updatedData = { ...currentData };
            if (action.label !== undefined) updatedData.label = action.label;
            if (
              action.shape !== undefined &&
              (NODE_SHAPES as readonly string[]).includes(action.shape)
            ) {
              updatedData.shape = action.shape as NodeShape;
            }
            if (action.fill !== undefined) {
              updatedData.color = action.fill;
              updatedData.textColor =
                PALETTE_FILL_TO_TEXT[action.fill] || DEFAULT_NODE_TEXT_COLOR;
            }
            targetNode.set("data", updatedData);
          }
          break;
        }

        case "delete_node": {
          nodesMap.delete(action.id);
          // Cascade delete edges referencing this node
          for (const [edgeId, edgeObj] of edgesMap.entries()) {
            const edgeData = edgeObj.toJSON() as { source?: string; target?: string };
            if (edgeData.source === action.id || edgeData.target === action.id) {
              edgesMap.delete(edgeId);
            }
          }
          break;
        }

        case "add_edge": {
          if (!action.source || !action.target) break;
          const edgeId = action.id || `e-${action.source}-${action.target}`;
          const edgeData = {
            id: edgeId,
            type: CANVAS_EDGE_TYPE,
            source: action.source,
            target: action.target,
            data: action.label ? { label: action.label } : {},
            style: {
              stroke: "var(--color-copy-secondary, #c0c0cc)",
              strokeWidth: 2,
              strokeLinecap: "round",
            },
            markerEnd: {
              type: MarkerType.ArrowClosed,
              color: "var(--color-copy-secondary, #c0c0cc)",
            },
          } as unknown as LsonObject;
          edgesMap.set(edgeId, new LiveObject<LsonObject>(edgeData));
          break;
        }

        case "delete_edge": {
          edgesMap.delete(action.id);
          break;
        }
      }
    }
  });
}

/**
 * Durable Trigger.dev background task for AI design agent architecture generation.
 */
export const designAgentTask = task({
  id: "design-agent",
  maxDuration: 300,
  run: async (
    payload: DesignAgentPayload,
    { ctx }
  ): Promise<DesignAgentOutput> => {
    logger.log("Design agent task initiated", { payload, ctx });
    const { prompt, roomId, projectId } = payload;

    try {
      // 1. Ensure the Liveblocks room exists
      await liveblocks.getOrCreateRoom(roomId, { defaultAccesses: [] });

      // 2. Start step: Publish initial status and set AI presence
      await publishAiStatus(roomId, "start", "Analyzing system design request...");
      await updateAiPresence(roomId, { x: 300, y: 150 }, true, 120);

      // 3. Read current canvas state from Liveblocks storage
      const { nodes: existingNodes, edges: existingEdges } =
        await getRoomCanvasState(roomId);

      // 4. Processing step: Update status and move cursor
      await publishAiStatus(
        roomId,
        "processing",
        "Designing architecture components and relationships..."
      );
      await updateAiPresence(roomId, { x: 450, y: 280 }, true, 120);

      // 5. Call Gemini to interpret prompt and generate action plan
      const plan = await generateArchitecturePlan(
        prompt,
        existingNodes,
        existingEdges
      );

      logger.info("Architecture plan generated", {
        summary: plan.summary,
        actionsCount: plan.actions.length,
      });

      // 6. Apply actions to canvas through Liveblocks flow storage
      await publishAiStatus(roomId, "processing", "Applying changes to collaborative canvas...");

      // Animate AI presence to the first target node position
      const firstTargetNode = plan.actions.find(
        (a) => (a.type === "add_node" || a.type === "move_node") && a.position
      );
      if (firstTargetNode?.position) {
        await updateAiPresence(
          roomId,
          {
            x: firstTargetNode.position.x + 80,
            y: firstTargetNode.position.y + 40,
          },
          true,
          60
        );
      }

      await applyCanvasActions(roomId, plan.actions);

      // 7. Complete step: Publish final status
      await publishAiStatus(roomId, "complete", plan.summary);

      return {
        success: true,
        prompt,
        roomId,
        projectId,
        summary: plan.summary,
        actionsCount: plan.actions.length,
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "An unexpected error occurred";
      logger.error("Design agent task encountered an error", {
        error: errorMessage,
      });

      await publishAiStatus(
        roomId,
        "error",
        `AI generation failed: ${errorMessage}`
      );

      return {
        success: false,
        prompt,
        roomId,
        projectId,
        error: errorMessage,
      };
    } finally {
      // 8. Always clear AI presence when the task terminates
      await clearAiPresence(roomId);
    }
  },
});

export const designTask = designAgentTask;
