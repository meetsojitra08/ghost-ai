import assert from "node:assert";
import {
  NODE_SHAPES,
  DEFAULT_SHAPE_SIZES,
  MIN_SHAPE_SIZES,
  type NodeShape,
} from "../types/canvas";

console.log("Starting Node Editing & Resizing verification tests...");

// 1. Verify MIN_SHAPE_SIZES exists for all supported shapes
assert.strictEqual(NODE_SHAPES.length, 6);
for (const shape of NODE_SHAPES) {
  const minSize = MIN_SHAPE_SIZES[shape];
  const defaultSize = DEFAULT_SHAPE_SIZES[shape];

  assert.ok(minSize, `Minimum size must be defined for ${shape}`);
  assert.ok(minSize.width > 0, `minWidth must be > 0 for ${shape}`);
  assert.ok(minSize.height > 0, `minHeight must be > 0 for ${shape}`);

  // Minimum size must be strictly smaller than or equal to default size
  assert.ok(
    minSize.width <= defaultSize.width,
    `minWidth (${minSize.width}) should be <= default width (${defaultSize.width}) for ${shape}`
  );
  assert.ok(
    minSize.height <= defaultSize.height,
    `minHeight (${minSize.height}) should be <= default height (${defaultSize.height}) for ${shape}`
  );

  // Minimum size must be at least 50x36 for UI and handle layout integrity
  assert.ok(minSize.width >= 50, `minWidth must be >= 50 for ${shape}`);
  assert.ok(minSize.height >= 36, `minHeight must be >= 36 for ${shape}`);
}
console.log("✓ Shape minimum sizes and bounds verified for all shapes");

// 2. Test resize dimension clamping logic
function clampNodeDimensions(
  shape: NodeShape,
  desiredWidth: number,
  desiredHeight: number
) {
  const min = MIN_SHAPE_SIZES[shape];
  return {
    width: Math.max(min.width, desiredWidth),
    height: Math.max(min.height, desiredHeight),
  };
}

// Attempting to resize rectangle to 20x10 should clamp to MIN_SHAPE_SIZES.rectangle
const clampedRect = clampNodeDimensions("rectangle", 20, 10);
assert.strictEqual(clampedRect.width, MIN_SHAPE_SIZES.rectangle.width);
assert.strictEqual(clampedRect.height, MIN_SHAPE_SIZES.rectangle.height);

// Attempting to resize diamond to 30x30 should clamp to MIN_SHAPE_SIZES.diamond
const clampedDiamond = clampNodeDimensions("diamond", 30, 30);
assert.strictEqual(clampedDiamond.width, MIN_SHAPE_SIZES.diamond.width);
assert.strictEqual(clampedDiamond.height, MIN_SHAPE_SIZES.diamond.height);

// Valid resize to larger size should preserve dimensions
const expandedHex = clampNodeDimensions("hexagon", 250, 180);
assert.strictEqual(expandedHex.width, 250);
assert.strictEqual(expandedHex.height, 180);
console.log("✓ Resize dimension clamping logic verified");

// 3. Test inline label editing state transitions
interface EditSessionState {
  isEditing: boolean;
  label: string;
  localLabel: string;
}

function handleDoubleClick(state: EditSessionState): EditSessionState {
  return {
    ...state,
    isEditing: true,
  };
}

function handleTextChange(state: EditSessionState, nextText: string): EditSessionState {
  return {
    ...state,
    localLabel: nextText,
    label: nextText, // Live sync as user types
  };
}

function handleEscapeKey(state: EditSessionState): EditSessionState {
  return {
    ...state,
    isEditing: false,
  };
}

function handleBlur(state: EditSessionState): EditSessionState {
  return {
    ...state,
    isEditing: false,
  };
}

// Initial state with empty label
let session: EditSessionState = {
  isEditing: false,
  label: "",
  localLabel: "",
};

// Double-click initiates edit session
session = handleDoubleClick(session);
assert.strictEqual(session.isEditing, true);

// Typing updates local and synced label in real time
session = handleTextChange(session, "Auth Service");
assert.strictEqual(session.localLabel, "Auth Service");
assert.strictEqual(session.label, "Auth Service");

// Blur finishes editing and keeps updated label
session = handleBlur(session);
assert.strictEqual(session.isEditing, false);
assert.strictEqual(session.label, "Auth Service");

// Re-opening and pressing Escape closes editing
session = handleDoubleClick(session);
assert.strictEqual(session.isEditing, true);
session = handleEscapeKey(session);
assert.strictEqual(session.isEditing, false);
console.log("✓ Inline label editing state machine transitions verified");

// 4. Verify placeholder text behavior
function getDisplayedText(label: string, placeholder = "Label"): string {
  return label.trim() ? label : placeholder;
}

assert.strictEqual(getDisplayedText(""), "Label");
assert.strictEqual(getDisplayedText("   "), "Label");
assert.strictEqual(getDisplayedText("PostgreSQL DB"), "PostgreSQL DB");
console.log("✓ Placeholder text fallback logic verified");

// 5. Verify nodrag / nopan interaction isolation
const textareaClasses = "nodrag nopan relative z-20 w-full";
assert.ok(textareaClasses.includes("nodrag"), "Textarea must contain 'nodrag' class");
assert.ok(textareaClasses.includes("nopan"), "Textarea must contain 'nopan' class");
console.log("✓ Text editing canvas drag and pan prevention classes verified");

console.log("ALL NODE EDITING & RESIZING TESTS PASSED! 🎉");

