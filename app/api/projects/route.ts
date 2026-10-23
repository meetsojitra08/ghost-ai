import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { getOwnedProjects } from "@/lib/projects";

interface CreateProjectBody {
  id?: string;
  name?: string;
  description?: string;
}

/**
 * GET /api/projects
 * Lists all projects owned by the currently authenticated user.
 */
export async function GET() {
  try {
    const { isAuthenticated, userId } = await auth();

    if (!isAuthenticated || !userId) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const projects = await getOwnedProjects(userId);

    return Response.json(projects);
  } catch (error) {
    console.error("Failed to list projects:", error);
    return Response.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/projects
 * Creates a new project for the currently authenticated user.
 * Defaults missing or empty project name to "Untitled Project".
 * Accepts optional explicit id to align project ID with Liveblocks room ID.
 */
export async function POST(req: Request) {
  try {
    const { isAuthenticated, userId } = await auth();

    if (!isAuthenticated || !userId) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    let body: CreateProjectBody = {};
    try {
      const parsed: unknown = await req.json();
      if (typeof parsed === "object" && parsed !== null && !Array.isArray(parsed)) {
        body = parsed as CreateProjectBody;
      }
    } catch {
      body = {};
    }
    
    if (body.id !== undefined && typeof body.id !== "string") {
      return Response.json(
        { error: "Invalid project ID format" },
        { status: 400 }
      );
    }

    const trimmedId = typeof body.id === "string" ? body.id.trim() : "";
    if (trimmedId.length > 0) {
      if (trimmedId.length > 64 || !/^[a-z0-9-]+$/.test(trimmedId)) {
        return Response.json(
          { error: "Invalid project ID format" },
          { status: 400 }
        );
      }
    }

    const trimmedName = typeof body.name === "string" ? body.name.trim() : "";
    if (trimmedName.length > 50) {
      return Response.json(
        { error: "Project name cannot exceed 50 characters" },
        { status: 400 }
      );
    }
    const name = trimmedName.length > 0 ? trimmedName : "Untitled Project";
    const description =
      typeof body.description === "string" && body.description.trim().length > 0
        ? body.description.trim()
        : null;

    let project;
    try {
      project = await prisma.project.create({
        data: {
          ...(trimmedId ? { id: trimmedId } : {}),
          ownerId: userId,
          name,
          description,
        },
        include: {
          collaborators: true,
        },
      });
    } catch (createErr: unknown) {
      if (
        trimmedId &&
        typeof createErr === "object" &&
        createErr !== null &&
        "code" in createErr &&
        createErr.code === "P2002"
      ) {
        // Fall back to default cuid if custom ID collided
        project = await prisma.project.create({
          data: {
            ownerId: userId,
            name,
            description,
          },
          include: {
            collaborators: true,
          },
        });
      } else {
        throw createErr;
      }
    }

    return Response.json(project, { status: 201 });
  } catch (error) {
    console.error("Failed to create project:", error);
    return Response.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

