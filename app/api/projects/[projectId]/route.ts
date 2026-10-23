import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { verifyProjectOwner } from "@/lib/project-auth";

interface RenameProjectBody {
  name?: string;
}

interface RouteContext {
  params: Promise<{
    projectId: string;
  }>;
}

/**
 * PATCH /api/projects/[projectId]
 * Renames a project. Only the project owner is permitted.
 */
export async function PATCH(req: Request, context: RouteContext) {
  try {
    const { isAuthenticated, userId } = await auth();

    if (!isAuthenticated || !userId) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { projectId } = await context.params;

    if (!projectId) {
      return Response.json({ error: "Project ID is required" }, { status: 400 });
    }

    const check = await verifyProjectOwner(projectId, userId);
    if (!check.authorized) {
      return Response.json({ error: check.error }, { status: check.status });
    }

    let body: RenameProjectBody = {};
    try {
      const parsed: unknown = await req.json();
      if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
        return Response.json({ error: "Invalid JSON body" }, { status: 400 });
      }
      body = parsed as RenameProjectBody;
    } catch {
      return Response.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const trimmedName = typeof body.name === "string" ? body.name.trim() : "";
    if (trimmedName.length === 0) {
      return Response.json({ error: "Project name is required" }, { status: 400 });
    }
    if (trimmedName.length > 50) {
      return Response.json(
        { error: "Project name cannot exceed 50 characters" },
        { status: 400 }
      );
    }

    const updatedProject = await prisma.project.update({
      where: { id: projectId },
      data: {
        name: trimmedName,
      },
      include: {
        collaborators: true,
      },
    });

    return Response.json(updatedProject);
  } catch (error) {
    console.error("Failed to rename project:", error);
    return Response.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/projects/[projectId]
 * Deletes a project. Only the project owner is permitted.
 */
export async function DELETE(_req: Request, context: RouteContext) {
  try {
    const { isAuthenticated, userId } = await auth();

    if (!isAuthenticated || !userId) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { projectId } = await context.params;

    if (!projectId) {
      return Response.json({ error: "Project ID is required" }, { status: 400 });
    }

    const check = await verifyProjectOwner(projectId, userId);
    if (!check.authorized) {
      return Response.json({ error: check.error }, { status: check.status });
    }

    await prisma.project.delete({
      where: { id: projectId },
    });

    return Response.json({
      success: true,
      message: "Project deleted successfully",
    });
  } catch (error) {
    console.error("Failed to delete project:", error);
    return Response.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
