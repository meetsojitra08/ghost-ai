import assert from "node:assert";
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
dotenv.config({ path: ".env" });

import { liveblocks } from "../lib/liveblocks";
import {
  NODE_SHAPES,
  NODE_COLORS,
  CANVAS_NODE_TYPE,
  CANVAS_EDGE_TYPE,
} from "../types/canvas";
import {
  PALETTE_FILL_TO_TEXT,
  ALLOWED_FILL_COLORS,
  CanvasActionSchema,
  DesignAgentPlanSchema,
  applyCanvasActions,
  updateAiPresence,
  clearAiPresence,
  publishAiStatus,
  getRoomCanvasState,
  designAgentTask,
} from "../trigger/design-agent";

async function runTests() {
  console.log("Starting Design Agent Logic verification tests...\n");

  // 1. Verify Node Shapes and Palette Mappings
  console.log("1. Checking node shapes and palette rules...");
  assert.strictEqual(NODE_SHAPES.length, 6);
  assert.ok(NODE_SHAPES.includes("rectangle"));
  assert.ok(NODE_SHAPES.includes("diamond"));
  assert.ok(NODE_SHAPES.includes("circle"));
  assert.ok(NODE_SHAPES.includes("pill"));
  assert.ok(NODE_SHAPES.includes("cylinder"));
  assert.ok(NODE_SHAPES.includes("hexagon"));

  assert.strictEqual(NODE_COLORS.length, 8);
  for (const color of NODE_COLORS) {
    assert.strictEqual(
      PALETTE_FILL_TO_TEXT[color.fill],
      color.text,
      `Fill ${color.fill} should map to text color ${color.text}`
    );
    assert.ok(
      ALLOWED_FILL_COLORS.includes(color.fill as (typeof ALLOWED_FILL_COLORS)[number]),
      `Color ${color.fill} must be in ALLOWED_FILL_COLORS`
    );
  }
  console.log("✓ All 6 shapes and 8 dark palette color pairs are validated");

  // 2. Verify Zod Action Schemas
  console.log("\n2. Checking action validation schemas...");
  const validAddNode = CanvasActionSchema.parse({
    type: "add_node",
    id: "service-auth",
    shape: "pill",
    label: "Auth Service",
    fill: "#10233D",
    position: { x: 200, y: 150 },
    width: 150,
    height: 60,
  });
  assert.strictEqual(validAddNode.type, "add_node");
  assert.strictEqual(validAddNode.shape, "pill");

  const validAddEdge = CanvasActionSchema.parse({
    type: "add_edge",
    id: "e-auth-db",
    source: "service-auth",
    target: "db-users",
    label: "SQL",
  });
  assert.strictEqual(validAddEdge.type, "add_edge");
  assert.strictEqual(validAddEdge.source, "service-auth");

  const validPlan = DesignAgentPlanSchema.parse({
    summary: "Auth and database architecture",
    actions: [validAddNode, validAddEdge],
  });
  assert.strictEqual(validPlan.actions.length, 2);
  console.log("✓ Canvas action schemas and plan schema validate correctly");

  // 3. Verify Liveblocks Room Mutations via applyCanvasActions
  console.log("\n3. Testing collaborative flow mutations in Liveblocks...");
  const testRoomId = `test-design-agent-${Date.now()}`;
  await liveblocks.getOrCreateRoom(testRoomId, { defaultAccesses: [] });

  try {
    // Action 1: Add Node 1 (Service)
    // Action 2: Add Node 2 (Database)
    // Action 3: Add Edge connecting them
    await applyCanvasActions(testRoomId, [
      {
        type: "add_node",
        id: "node-svc",
        shape: "pill",
        label: "Order Service",
        fill: "#10233D",
        position: { x: 100, y: 100 },
        width: 150,
        height: 60,
      },
      {
        type: "add_node",
        id: "node-db",
        shape: "cylinder",
        label: "Order Database",
        fill: "#0F2E18",
        position: { x: 100, y: 260 },
        width: 120,
        height: 90,
      },
      {
        type: "add_edge",
        id: "edge-svc-db",
        source: "node-svc",
        target: "node-db",
        label: "TCP/SQL",
      },
    ]);

    let state = await getRoomCanvasState(testRoomId);
    assert.strictEqual(state.nodes.length, 2, "Should have 2 nodes in room");
    assert.strictEqual(state.edges.length, 1, "Should have 1 edge in room");

    const svcNode = state.nodes.find((n) => n.id === "node-svc");
    assert.ok(svcNode);
    assert.strictEqual(svcNode.type, CANVAS_NODE_TYPE);
    assert.strictEqual(svcNode.data?.label, "Order Service");
    assert.strictEqual(svcNode.data?.shape, "pill");
    assert.strictEqual(svcNode.data?.color, "#10233D");
    assert.strictEqual(svcNode.data?.textColor, "#52A8FF");
    assert.strictEqual(svcNode.position.x, 100);
    assert.strictEqual(svcNode.position.y, 100);

    const dbNode = state.nodes.find((n) => n.id === "node-db");
    assert.ok(dbNode);
    assert.strictEqual(dbNode.data?.color, "#0F2E18");
    assert.strictEqual(dbNode.data?.textColor, "#62C073");

    const edge = state.edges[0];
    assert.strictEqual(edge.type, CANVAS_EDGE_TYPE);
    assert.strictEqual(edge.source, "node-svc");
    assert.strictEqual(edge.target, "node-db");
    assert.strictEqual(edge.data?.label, "TCP/SQL");
    console.log("✓ add_node and add_edge correctly populated Liveblocks canvas storage");

    // Action 4: Move node
    // Action 5: Resize node
    // Action 6: Update node data
    await applyCanvasActions(testRoomId, [
      {
        type: "move_node",
        id: "node-svc",
        position: { x: 150, y: 120 },
      },
      {
        type: "resize_node",
        id: "node-svc",
        width: 180,
        height: 70,
      },
      {
        type: "update_node_data",
        id: "node-svc",
        label: "Order Service v2",
        fill: "#2E1938",
      },
    ]);

    state = await getRoomCanvasState(testRoomId);
    const updatedSvc = state.nodes.find((n) => n.id === "node-svc");
    assert.ok(updatedSvc);
    assert.strictEqual(updatedSvc.position.x, 150);
    assert.strictEqual(updatedSvc.position.y, 120);
    assert.strictEqual(updatedSvc.width, 180);
    assert.strictEqual(updatedSvc.height, 70);
    assert.strictEqual(updatedSvc.data?.label, "Order Service v2");
    assert.strictEqual(updatedSvc.data?.color, "#2E1938");
    assert.strictEqual(updatedSvc.data?.textColor, "#BF7AF0");
    console.log("✓ move_node, resize_node, and update_node_data correctly updated canvas state");

    // Action 7: Delete node with cascade edge deletion
    await applyCanvasActions(testRoomId, [
      {
        type: "delete_node",
        id: "node-db",
      },
    ]);

    state = await getRoomCanvasState(testRoomId);
    assert.strictEqual(state.nodes.length, 1, "Only 1 node should remain");
    assert.strictEqual(state.edges.length, 0, "Connected edge should be cascade deleted");
    console.log("✓ delete_node successfully removed node and cascade-deleted connected edges");

    // Action 8: Clean up remaining node
    await applyCanvasActions(testRoomId, [
      {
        type: "delete_node",
        id: "node-svc",
      },
    ]);
    state = await getRoomCanvasState(testRoomId);
    assert.strictEqual(state.nodes.length, 0, "Room nodes should be completely empty");
    console.log("✓ Canvas cleaned up successfully");

    // 4. Verify AI Presence and Status
    console.log("\n4. Testing AI presence and status broadcast...");
    await updateAiPresence(testRoomId, { x: 250, y: 350 }, true, 10);
    console.log("✓ updateAiPresence set cursor and thinking state");

    await publishAiStatus(testRoomId, "start", "Testing start status");
    await publishAiStatus(testRoomId, "processing", "Testing processing status");
    await publishAiStatus(testRoomId, "complete", "Testing complete status");
    console.log("✓ publishAiStatus broadcasted start, processing, and complete events");

    await clearAiPresence(testRoomId);
    console.log("✓ clearAiPresence reset presence");

    // 5. Verify task registration
    console.log("\n5. Testing task export...");
    assert.strictEqual(designAgentTask.id, "design-agent");
    console.log("✓ designAgentTask is registered with ID 'design-agent'");

    console.log("\nALL DESIGN AGENT LOGIC TESTS PASSED! 🎉");
  } finally {
    // Delete test room
    try {
      await liveblocks.deleteRoom(testRoomId);
    } catch {
      // ignore cleanup errors
    }
  }
}

runTests().catch((err) => {
  console.error("Test failed:", err);
  process.exit(1);
});
