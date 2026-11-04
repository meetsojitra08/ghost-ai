import { NextResponse } from "next/server";
import { auth } from "@trigger.dev/sdk";
import { prisma } from "@/lib/prisma";
import { getClerkIdentity, checkProjectAccess } from "@/lib/project-access";

/**
 * POST /api/ai/design/token
 * Verifies ownership of a task run and generates a run-scoped Trigger.dev public access token.
 *
 * Payload:
 * - runId: string
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

    const payload = body as Record<string, unknown>;
    const rawRunId = payload.runId ?? payload.id;

    if (typeof rawRunId !== "string" || !rawRunId.trim()) {
      return NextResponse.json(
        { error: "runId is required" },
        { status: 400 }
      );
    }

    const runId = rawRunId.trim();

    // Look up TaskRun in Prisma to verify ownership
    const taskRun = await prisma.taskRun.findUnique({
      where: { runId },
    });

    if (!taskRun) {
      return NextResponse.json(
        { error: "Task run not found" },
        { status: 404 }
      );
    }

    let isAuthorized = taskRun.userId === identity.userId;

    if (!isAuthorized) {
      const access = await checkProjectAccess(
        taskRun.projectId,
        identity.userId,
        identity.emails
      );
      isAuthorized = access.hasAccess;
    }

    if (!isAuthorized) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Generate a Trigger.dev public token scoped strictly to this run
    const publicToken = await auth.createPublicToken({
      scopes: {
        read: {
          runs: [runId],
        },
      },
    });

    return NextResponse.json({
      token: publicToken,
      publicAccessToken: publicToken,
      runId,
    });
  } catch (error) {
    console.error("Failed to generate design run token:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
