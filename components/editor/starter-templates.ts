import {
  CANVAS_EDGE_TYPE,
  CANVAS_NODE_TYPE,
  NODE_COLORS,
  type CanvasEdge,
  type CanvasNode,
} from "@/types/canvas";

export interface CanvasTemplate {
  id: string;
  name: string;
  description: string;
  nodes: CanvasNode[];
  edges: CanvasEdge[];
}

function makeNode(
  id: string,
  label: string,
  x: number,
  y: number,
  colorIndex: number,
  shape: NonNullable<CanvasNode["data"]["shape"]> = "rectangle",
  width = 160,
  height = 80
): CanvasNode {
  const color = NODE_COLORS[colorIndex % NODE_COLORS.length];
  return {
    id,
    type: CANVAS_NODE_TYPE,
    position: { x, y },
    width,
    height,
    style: { width, height },
    data: { label, color: color.fill, textColor: color.text, shape },
  };
}

function makeEdge(id: string, source: string, target: string): CanvasEdge {
  return {
    id,
    source,
    target,
    type: CANVAS_EDGE_TYPE,
    animated: false,
  };
}

export const CANVAS_TEMPLATES: CanvasTemplate[] = [
  {
    id: "microservices",
    name: "Microservices",
    description: "An API gateway routes requests to independent services and their data stores.",
    nodes: [
      makeNode("micro-client", "Web Client", 0, 100, 0, "pill", 140, 60),
      makeNode("micro-gateway", "API Gateway", 230, 100, 1, "hexagon", 150, 90),
      makeNode("micro-users", "User Service", 500, 0, 2, "rectangle"),
      makeNode("micro-orders", "Order Service", 500, 180, 3, "rectangle"),
      makeNode("micro-user-db", "User DB", 760, 0, 4, "cylinder", 130, 90),
      makeNode("micro-order-db", "Order DB", 760, 180, 5, "cylinder", 130, 90),
    ],
    edges: [
      makeEdge("micro-client-gateway", "micro-client", "micro-gateway"),
      makeEdge("micro-gateway-users", "micro-gateway", "micro-users"),
      makeEdge("micro-gateway-orders", "micro-gateway", "micro-orders"),
      makeEdge("micro-users-db", "micro-users", "micro-user-db"),
      makeEdge("micro-orders-db", "micro-orders", "micro-order-db"),
    ],
  },
  {
    id: "cicd-pipeline",
    name: "CI/CD Pipeline",
    description: "Code changes flow through build, test, and deploy stages into production.",
    nodes: [
      makeNode("cicd-repo", "Git Repository", 0, 70, 1, "cylinder", 140, 90),
      makeNode("cicd-build", "Build", 230, 80, 2, "pill", 140, 60),
      makeNode("cicd-test", "Test Suite", 460, 70, 3, "diamond", 130, 100),
      makeNode("cicd-artifact", "Artifact", 690, 70, 4, "cylinder", 140, 90),
      makeNode("cicd-deploy", "Deploy", 920, 80, 5, "pill", 140, 60),
      makeNode("cicd-prod", "Production", 1150, 70, 6, "hexagon", 150, 90),
    ],
    edges: [
      makeEdge("cicd-repo-build", "cicd-repo", "cicd-build"),
      makeEdge("cicd-build-test", "cicd-build", "cicd-test"),
      makeEdge("cicd-test-artifact", "cicd-test", "cicd-artifact"),
      makeEdge("cicd-artifact-deploy", "cicd-artifact", "cicd-deploy"),
      makeEdge("cicd-deploy-prod", "cicd-deploy", "cicd-prod"),
    ],
  },
  {
    id: "event-driven",
    name: "Event-Driven System",
    description: "Services publish events to a shared broker for independent consumers.",
    nodes: [
      makeNode("event-api", "Order API", 0, 100, 0, "pill", 145, 60),
      makeNode("event-broker", "Event Broker", 260, 80, 2, "hexagon", 160, 100),
      makeNode("event-orders", "Order Events", 540, 0, 3, "circle", 110, 110),
      makeNode("event-email", "Email Service", 800, 0, 5, "rectangle"),
      makeNode("event-analytics", "Analytics Service", 540, 190, 1, "rectangle"),
      makeNode("event-warehouse", "Data Warehouse", 800, 190, 4, "cylinder", 160, 90),
    ],
    edges: [
      makeEdge("event-api-broker", "event-api", "event-broker"),
      makeEdge("event-broker-orders", "event-broker", "event-orders"),
      makeEdge("event-orders-email", "event-orders", "event-email"),
      makeEdge("event-broker-analytics", "event-broker", "event-analytics"),
      makeEdge("event-analytics-warehouse", "event-analytics", "event-warehouse"),
    ],
  },
];
