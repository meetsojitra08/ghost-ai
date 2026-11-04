import assert from "node:assert";
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import { uploadCanvasSnapshot, fetchCanvasSnapshot, type CanvasState } from "../lib/blob";
import { useCanvasAutosave } from "../hooks/use-canvas-autosave";
import { useCanvasAutosave as useCanvasAutosaveHookFolder } from "../hook/use-canvas-autosave";
import { useAutosave } from "../hooks/use-autosave";
import { useAutosave as useAutosaveHookFolder } from "../hook/use-autosave";
import { CANVAS_NODE_TYPE, type CanvasNode, type CanvasEdge } from "../types/canvas";

async function runTests() {
  console.log("Starting Canvas Autosave & Storage verification...");

  // 1. Verify hook exports exist in both hooks/ and hook/
  assert.strictEqual(typeof useCanvasAutosave, "function");
  assert.strictEqual(typeof useCanvasAutosaveHookFolder, "function");
  assert.strictEqual(typeof useAutosave, "function");
  assert.strictEqual(typeof useAutosaveHookFolder, "function");
  console.log("✓ Autosave hook exports verified in both /hooks and /hook directories");

  // 2. Test Vercel Blob canvas snapshot upload and retrieval
  const testProjectId = `test-autosave-${Date.now()}`;
  const mockNode: CanvasNode = {
    id: "test-node-1",
    type: CANVAS_NODE_TYPE,
    position: { x: 100, y: 150 },
    data: {
      label: "API Gateway",
      color: "#1F1F1F",
      textColor: "#EDEDED",
      shape: "hexagon",
    },
    width: 150,
    height: 90,
  };
  const mockEdge: CanvasEdge = {
    id: "test-edge-1",
    source: "test-node-1",
    target: "test-node-2",
    type: "canvasEdge",
  };

  const initialCanvasState: CanvasState = {
    nodes: [mockNode],
    edges: [mockEdge],
  };

  console.log("Uploading canvas state to Vercel Blob...");
  const blobUrl = await uploadCanvasSnapshot(testProjectId, initialCanvasState);
  assert.ok(blobUrl, "Blob URL should be returned");
  assert.ok(blobUrl.includes("vercel-storage.com"), "URL should be on vercel-storage.com");
  assert.ok(blobUrl.includes(`canvas/${testProjectId}.json`), "URL pathname should match project id");
  console.log("✓ Uploaded successfully to Vercel Blob URL:", blobUrl);

  console.log("Fetching canvas state back from Vercel Blob...");
  const retrievedState = await fetchCanvasSnapshot(blobUrl);
  assert.ok(retrievedState, "Should retrieve canvas state from blob URL");
  assert.strictEqual(retrievedState.nodes.length, 1);
  assert.strictEqual(retrievedState.nodes[0].id, "test-node-1");
  assert.strictEqual(retrievedState.nodes[0].data.label, "API Gateway");
  assert.strictEqual(retrievedState.edges.length, 1);
  assert.strictEqual(retrievedState.edges[0].id, "test-edge-1");
  console.log("✓ Retrieved and parsed canvas state correctly matches saved state");

  // 3. Test clean up / overwrite
  const updatedCanvasState: CanvasState = {
    nodes: [
      mockNode,
      {
        id: "test-node-2",
        type: CANVAS_NODE_TYPE,
        position: { x: 300, y: 150 },
        data: {
          label: "Auth Service",
          color: "#10233D",
          textColor: "#52A8FF",
          shape: "rectangle",
        },
      },
    ],
    edges: [mockEdge],
  };

  const updatedBlobUrl = await uploadCanvasSnapshot(testProjectId, updatedCanvasState);
  assert.ok(updatedBlobUrl, "Overwriting blob should succeed");
  const retrievedUpdated = await fetchCanvasSnapshot(updatedBlobUrl);
  assert.ok(retrievedUpdated, "Should retrieve updated state");
  assert.strictEqual(retrievedUpdated.nodes.length, 2);
  console.log("✓ Overwrite and version update verified");

  // 4. Clean up test blob
  try {
    const { del } = await import("@vercel/blob");
    await del(blobUrl);
    console.log("✓ Test blob cleaned up");
  } catch (err) {
    console.warn("Could not delete test blob:", err);
  }

  console.log("ALL AUTOSAVE TESTS PASSED SUCCESSFULLY! 🎉");
}

runTests().catch((err) => {
  console.error("Test failed:", err);
  process.exit(1);
});

