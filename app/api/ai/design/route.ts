import { NextResponse } from "next/server";
import { auth, tasks } from "@trigger.dev/sdk";
import { prisma } from "@/lib/prisma";
import { getClerkIdentity, checkProjectAccess } from "@/lib/project-access";
import type { designAgentTask } from "@/trigger/design-agent";

/**
 * POST /api/ai/design
 * Triggers the Trigger.dev design agent background task and records the run in Prisma.
 *
 * Payload:
 * - prompt: string
 * - roomId: string
 * - projectId?: string
 */
export async function POST(request: Request) {
  try {
    const identity = await getClerkIdentity();
    if (!identity) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    if (!body || typeof body !== "object") {
      return NextResponse.json(
        { error: "Payload must be a JSON object" },
        { status: 400 }
      );
    }

    const { prompt, roomId, projectId } = body as Record<string, unknown>;

    if (typeof prompt !== "string" || !prompt.trim()) {
      return NextResponse.json(
        { error: "prompt is required" },
        { status: 400 }
      );
    }

    if (typeof roomId !== "string" || !roomId.trim()) {
      return NextResponse.json(
        { error: "roomId is required" },
        { status: 400 }
      );
    }

    const trimmedPrompt = prompt.trim();
    const trimmedRoomId = roomId.trim();
    const effectiveProjectId =
      typeof projectId === "string" && projectId.trim()
        ? projectId.trim()
        : trimmedRoomId;

    if (!effectiveProjectId) {
      return NextResponse.json(
        { error: "projectId or roomId is required" },
        { status: 400 }
      );
    }

    // Verify user has access to this project
    const access = await checkProjectAccess(
      effectiveProjectId,
      identity.userId,
      identity.emails
    );

    if (!access.hasAccess || !access.project) {
      const exists = await prisma.project.findUnique({
        where: { id: effectiveProjectId },
        select: { id: true },
      });

      return NextResponse.json(
        { error: exists ? "Forbidden" : "Project not found" },
        { status: exists ? 403 : 404 }
      );
    }

    // Trigger the design task in Trigger.dev
    const handle = await tasks.trigger<typeof designAgentTask>("design-agent", {
      prompt: trimmedPrompt,
      roomId: trimmedRoomId,
      projectId: effectiveProjectId,
    });

    // Create a TaskRun record in Prisma to track ownership
    await prisma.taskRun.create({
      data: {
        runId: handle.id,
        projectId: effectiveProjectId,
        userId: identity.userId,
      },
    });

    // Generate a Trigger.dev public token scoped strictly to this run
    let publicToken: string | undefined;
    try {
      publicToken = await auth.createPublicToken({
        scopes: {
          read: {
            runs: [handle.id],
          },
        },
      });
    } catch (tokenErr) {
      console.warn("Failed to generate publicToken directly in /api/ai/design:", tokenErr);
    }

    return NextResponse.json({
      runId: handle.id,
      publicToken,
      token: publicToken,
      success: true,
    });
  } catch (error) {
    console.error("Failed to trigger design agent task:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
