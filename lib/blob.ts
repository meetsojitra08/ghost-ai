import { put, get } from "@vercel/blob";
import type { CanvasEdge, CanvasNode } from "@/types/canvas";

export interface CanvasState {
  nodes: CanvasNode[];
  edges: CanvasEdge[];
}

/**
 * Uploads canvas JSON to Vercel Blob and returns the blob URL.
 * Automatically tries private store access first (standard for non-public blob stores)
 * and falls back to public store access.
 */
export async function uploadCanvasSnapshot(
  projectId: string,
  canvasState: CanvasState
): Promise<string> {
  const pathname = `canvas/${projectId}.json`;
  const jsonContent = JSON.stringify(canvasState);

  try {
    const blob = await put(pathname, jsonContent, {
      access: "private",
      contentType: "application/json",
      allowOverwrite: true,
    });
    return blob.url;
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "";
    if (
      message.includes("Cannot use private access on a public store") ||
      message.includes("public access")
    ) {
      const blob = await put(pathname, jsonContent, {
        access: "public",
        contentType: "application/json",
        allowOverwrite: true,
      });
      return blob.url;
    }
    throw error;
  }
}

/**
 * Fetches and parses canvas JSON from a saved Vercel Blob URL.
 */
export async function fetchCanvasSnapshot(
  blobUrl: string
): Promise<CanvasState | null> {
  if (!blobUrl) {
    return null;
  }

  // Attempt to read via @vercel/blob get with private access
  try {
    const res = await get(blobUrl, { access: "private" });
    if (res?.stream) {
      const rawText = await new Response(res.stream).text();
      return parseCanvasSnapshot(rawText);
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "";
    // If not a private store or get with private fails, try public get
    try {
      const publicRes = await get(blobUrl, { access: "public" });
      if (publicRes?.stream) {
        const rawText = await new Response(publicRes.stream).text();
        return parseCanvasSnapshot(rawText);
      }
    } catch {
      // If Vercel Blob SDK get fails, attempt standard HTTP fetch
      try {
        const response = await fetch(blobUrl, { cache: "no-store" });
        if (response.ok) {
          const rawText = await response.text();
          return parseCanvasSnapshot(rawText);
        }
      } catch {
        // Fall through to throw original or error
      }
    }
    console.error("Failed to fetch canvas snapshot from blob:", message);
    return null;
  }

  return null;
}

function parseCanvasSnapshot(rawText: string): CanvasState | null {
  try {
    const parsed = JSON.parse(rawText);
    if (!parsed || typeof parsed !== "object") {
      return null;
    }

    const nodes = Array.isArray(parsed.nodes) ? (parsed.nodes as CanvasNode[]) : [];
    const edges = Array.isArray(parsed.edges) ? (parsed.edges as CanvasEdge[]) : [];

    return { nodes, edges };
  } catch {
    return null;
  }
}

