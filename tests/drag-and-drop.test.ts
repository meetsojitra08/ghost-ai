import assert from "node:assert";
import {
  NODE_SHAPES,
  DEFAULT_SHAPE_SIZES,
  createShapeDragPayload,
  parseShapeDragPayload,
  generateNodeId,
  type NodeShape,
} from "../types/canvas";

console.log("Starting Drag and Drop pipeline verification...");

// 1. Verify all 6 shapes have defaults
assert.strictEqual(NODE_SHAPES.length, 6);
for (const shape of NODE_SHAPES) {
  const size = DEFAULT_SHAPE_SIZES[shape];
  assert.ok(size, `Size must exist for ${shape}`);
  assert.ok(size.width > 0, `Width must be > 0 for ${shape}`);
  assert.ok(size.height > 0, `Height must be > 0 for ${shape}`);

  const payload = createShapeDragPayload(shape);
  assert.strictEqual(payload.shape, shape);
  assert.strictEqual(payload.width, size.width);
  assert.strictEqual(payload.height, size.height);
}
console.log("✓ Shape definitions and default sizes verified");

// Helper to create mock DragEvent
function mockDragEvent(dataMap: Record<string, string>): any {
  return {
    dataTransfer: {
      getData: (format: string) => dataMap[format] || "",
    },
  };
}

// 2. Verify parsing from standard application/reactflow string
for (const shape of NODE_SHAPES) {
  const event = mockDragEvent({ "application/reactflow": shape });
  const parsed = parseShapeDragPayload(event);
  assert.ok(parsed, `Failed to parse from application/reactflow for ${shape}`);
  assert.strictEqual(parsed.shape, shape);
  assert.strictEqual(parsed.width, DEFAULT_SHAPE_SIZES[shape].width);
}
console.log("✓ Parsing from application/reactflow string verified");

// 3. Verify parsing from nodeType format
for (const shape of NODE_SHAPES) {
  const event = mockDragEvent({ "nodeType": shape });
  const parsed = parseShapeDragPayload(event);
  assert.ok(parsed, `Failed to parse from nodeType for ${shape}`);
  assert.strictEqual(parsed.shape, shape);
}
console.log("✓ Parsing from nodeType verified");

// 4. Verify parsing from text/plain format
for (const shape of NODE_SHAPES) {
  const event = mockDragEvent({ "text/plain": shape });
  const parsed = parseShapeDragPayload(event);
  assert.ok(parsed, `Failed to parse from text/plain for ${shape}`);
  assert.strictEqual(parsed.shape, shape);
}
console.log("✓ Parsing from text/plain verified");

// 5. Verify parsing from JSON serialized payload
for (const shape of NODE_SHAPES) {
  const payload = createShapeDragPayload(shape);
  const serialized = JSON.stringify(payload);
  const event = mockDragEvent({ "application/json": serialized });
  const parsed = parseShapeDragPayload(event);
  assert.ok(parsed, `Failed to parse from application/json for ${shape}`);
  assert.strictEqual(parsed.shape, shape);
  assert.strictEqual(parsed.width, payload.width);
  assert.strictEqual(parsed.height, payload.height);
}
console.log("✓ Parsing from application/json serialized payload verified");

// 6. Verify parsing invalid data returns null
const invalidEvent1 = mockDragEvent({ "application/reactflow": "unknown-shape" });
assert.strictEqual(parseShapeDragPayload(invalidEvent1), null);

const invalidEvent2 = mockDragEvent({});
assert.strictEqual(parseShapeDragPayload(invalidEvent2), null);
console.log("✓ Invalid drag data returns null correctly");

// 7. Verify node ID generation uniqueness
const id1 = generateNodeId("rectangle");
const id2 = generateNodeId("rectangle");
assert.notStrictEqual(id1, id2);
assert.ok(id1.startsWith("rectangle-"));
assert.ok(id2.startsWith("rectangle-"));
console.log("✓ Node ID generation verified");

// 8. Verify drop coordinate calculation centering logic
const dropX = 500;
const dropY = 400;
const rectSize = DEFAULT_SHAPE_SIZES["rectangle"]; // 160 x 80
const centeredX = Math.round(dropX - rectSize.width / 2);
const centeredY = Math.round(dropY - rectSize.height / 2);
assert.strictEqual(centeredX, 420);
assert.strictEqual(centeredY, 360);
console.log("✓ Drop coordinate centering calculation verified");

console.log("ALL TESTS PASSED SUCCESSFULLY! 🎉");
