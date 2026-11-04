import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { checkProjectAccess, getClerkIdentity } from "@/lib/project-access";
import { uploadCanvasSnapshot, fetchCanvasSnapshot, type CanvasState } from "@/lib/blob";

interface RouteContext {
  params: Promise<{
    projectId: string;
  }>;
}

async function getAuthorizedProject(projectId: string) {
  const identity = await getClerkIdentity();
  if (!identity) {
    return {
      response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }

  const access = await checkProjectAccess(
    projectId,
    identity.userId,
    identity.emails
  );

  if (!access.hasAccess || !access.project) {
    const exists = await prisma.project.findUnique({
      where: { id: projectId },
      select: { id: true },
    });

    return {
      response: NextResponse.json(
        { error: exists ? "Forbidden" : "Project not found" },
        { status: exists ? 403 : 404 }
      ),
    };
  }

  return { identity, project: access.project };
}

/**
 * GET /api/projects/[projectId]/canvas
 * Reads the project's saved blob URL from Prisma,
 * fetches the saved canvas JSON from Vercel Blob,
 * and returns the canvas state to the editor.
 */
export async function GET(_request: Request, context: RouteContext) {
  try {
    const { projectId } = await context.params;
    if (!projectId) {
      return NextResponse.json(
        { error: "Project ID is required" },
        { status: 400 }
      );
    }

    const authResult = await getAuthorizedProject(projectId);
    if ("response" in authResult) {
      return authResult.response;
    }

    const { project } = authResult;

    if (!project.canvasJsonPath) {
      return NextResponse.json({
        canvas: null,
        nodes: [],
        edges: [],
        canvasJsonPath: null,
      });
    }

    const canvas = await fetchCanvasSnapshot(project.canvasJsonPath);
    if (!canvas) {
      return NextResponse.json({
        canvas: null,
        nodes: [],
        edges: [],
        canvasJsonPath: project.canvasJsonPath,
      });
    }

    return NextResponse.json({
      canvas,
      nodes: canvas.nodes,
      edges: canvas.edges,
      canvasJsonPath: project.canvasJsonPath,
    });
  } catch (error) {
    console.error("Failed to load canvas state:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/projects/[projectId]/canvas
 * Receives the latest canvas JSON, uploads it to Vercel Blob,
 * and stores the returned blob URL on the matching Prisma project record.
 */
export async function PUT(request: Request, context: RouteContext) {
  try {
    const { projectId } = await context.params;
    if (!projectId) {
      return NextResponse.json(
        { error: "Project ID is required" },
        { status: 400 }
      );
    }

    const authResult = await getAuthorizedProject(projectId);
    if ("response" in authResult) {
      return authResult.response;
    }

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: "Invalid JSON body" },
        { status: 400 }
      );
    }

    if (!body || typeof body !== "object") {
      return NextResponse.json(
        { error: "Payload must be a valid JSON object" },
        { status: 400 }
      );
    }

    // Support payload formatted either directly as { nodes, edges } or wrapped as { canvas: { nodes, edges } }
    const payloadObj = body as Record<string, unknown>;
    const targetSource =
      payloadObj.canvas && typeof payloadObj.canvas === "object"
        ? (payloadObj.canvas as Record<string, unknown>)
        : payloadObj;

    const rawNodes = targetSource.nodes;
    const rawEdges = targetSource.edges;

    if (!Array.isArray(rawNodes) || !Array.isArray(rawEdges)) {
      return NextResponse.json(
        { error: "Canvas state must contain nodes and edges arrays" },
        { status: 400 }
      );
    }

    const canvasState: CanvasState = {
      nodes: rawNodes,
      edges: rawEdges,
    };

    // 1. Upload the JSON to Vercel Blob
    const blobUrl = await uploadCanvasSnapshot(projectId, canvasState);

    // 2. Store the returned blob URL on the matching Prisma project record
    const updatedProject = await prisma.project.update({
      where: { id: projectId },
      data: {
        canvasJsonPath: blobUrl,
      },
      select: {
        id: true,
        canvasJsonPath: true,
        updatedAt: true,
      },
    });

    return NextResponse.json({
      success: true,
      url: blobUrl,
      canvasJsonPath: blobUrl,
      project: updatedProject,
    });
  } catch (error) {
    console.error("Failed to save canvas state:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

