"use client";

import * as React from "react";
import type { CanvasEdge, CanvasNode } from "@/types/canvas";

export type CanvasSaveStatus = "saved" | "saving" | "error";

export interface UseCanvasAutosaveOptions {
  debounceMs?: number;
  enabled?: boolean;
  onSaved?: (url: string) => void;
  onError?: (error: Error) => void;
}

export interface UseCanvasAutosaveReturn {
  status: CanvasSaveStatus;
  isSaving: boolean;
  error: Error | null;
  lastSavedAt: Date | null;
  saveNow: () => Promise<void>;
  markAsSaved: (nodes: CanvasNode[], edges: CanvasEdge[]) => void;
}

function serializeCanvasState(nodes: CanvasNode[], edges: CanvasEdge[]): string {
  // Simple serialization to compare canvas state without volatile selection/drag state
  return JSON.stringify({
    nodes: nodes.map((node) => ({
      id: node.id,
      type: node.type,
      position: node.position,
      data: node.data,
      width: node.width,
      height: node.height,
      style: node.style,
    })),
    edges: edges.map((edge) => ({
      id: edge.id,
      source: edge.source,
      target: edge.target,
      type: edge.type,
      data: edge.data,
      label: edge.label,
    })),
  });
}

/**
 * Custom hook to autosave canvas nodes and edges to the backend API route.
 * Debounces writes to avoid excessive requests, tracks save status (saved, saving, error),
 * and provides a manual `saveNow` trigger.
 */
export function useCanvasAutosave(
  projectId: string | null | undefined,
  nodes: CanvasNode[],
  edges: CanvasEdge[],
  options: UseCanvasAutosaveOptions = {}
): UseCanvasAutosaveReturn {
  const {
    debounceMs = 1500,
    enabled = true,
    onSaved,
    onError,
  } = options;

  const [status, setStatus] = React.useState<CanvasSaveStatus>("saved");
  const [error, setError] = React.useState<Error | null>(null);
  const [lastSavedAt, setLastSavedAt] = React.useState<Date | null>(null);
  const [isSaving, setIsSaving] = React.useState(false);

  // Keep a reference to the last serialized state successfully saved or initialized
  const lastSavedStateRef = React.useRef<string | null>(null);
  // Track if we have performed initial stabilization
  const isInitializedRef = React.useRef(false);
  // Pending save timeout ref
  const timeoutRef = React.useRef<NodeJS.Timeout | null>(null);

  // Latest nodes/edges refs for async callbacks
  const latestNodesRef = React.useRef(nodes);
  const latestEdgesRef = React.useRef(edges);

  React.useEffect(() => {
    latestNodesRef.current = nodes;
    latestEdgesRef.current = edges;
  }, [nodes, edges]);

  const isSavingRef = React.useRef(false);

  const markAsSaved = React.useCallback(
    (newNodes: CanvasNode[], newEdges: CanvasEdge[]) => {
      lastSavedStateRef.current = serializeCanvasState(newNodes, newEdges);
      isInitializedRef.current = true;
      setStatus("saved");
      setError(null);
    },
    []
  );

  const executeSave = React.useCallback(async () => {
    if (!projectId || !enabled) return;
    if (isSavingRef.current) return;

    const currentSerialized = serializeCanvasState(
      latestNodesRef.current,
      latestEdgesRef.current
    );

    // If current state matches what was already saved, skip
    if (currentSerialized === lastSavedStateRef.current) {
      return;
    }

    try {
      isSavingRef.current = true;
      setIsSaving(true);
      setStatus("saving");
      setError(null);

      const res = await fetch(`/api/projects/${encodeURIComponent(projectId)}/canvas`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          nodes: latestNodesRef.current,
          edges: latestEdgesRef.current,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(
          (errorData as { error?: string }).error ||
            `Failed to save canvas: HTTP ${res.status}`
        );
      }

      const data = await res.json().catch(() => ({}));
      lastSavedStateRef.current = currentSerialized;
      setStatus("saved");
      setError(null);
      setLastSavedAt(new Date());

      if (data.url && typeof onSaved === "function") {
        onSaved(data.url);
      }
    } catch (err) {
      const errObj = err instanceof Error ? err : new Error(String(err));
      console.error("Canvas autosave error:", errObj);
      setStatus("error");
      setError(errObj);
      if (typeof onError === "function") {
        onError(errObj);
      }
    } finally {
      isSavingRef.current = false;
      setIsSaving(false);
    }
  }, [enabled, onError, onSaved, projectId]);

  const saveNow = React.useCallback(async () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    await executeSave();
  }, [executeSave]);

  // Watch nodes and edges changes and debounce save
  React.useEffect(() => {
    if (!projectId || !enabled) {
      return;
    }

    const currentSerialized = serializeCanvasState(nodes, edges);

    // On very first mount, establish baseline without saving
    if (!isInitializedRef.current) {
      lastSavedStateRef.current = currentSerialized;
      isInitializedRef.current = true;
      return;
    }

    // If nothing changed from last saved state, do nothing
    if (currentSerialized === lastSavedStateRef.current) {
      return;
    }

    // Cancel pending debounce
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Schedule new save
    timeoutRef.current = setTimeout(() => {
      void executeSave();
    }, debounceMs);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [debounceMs, edges, enabled, executeSave, nodes, projectId]);

  // Clean up timer on unmount
  React.useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return {
    status,
    isSaving,
    error,
    lastSavedAt,
    saveNow,
    markAsSaved,
  };
}
