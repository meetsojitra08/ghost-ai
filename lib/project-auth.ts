import { prisma } from "@/lib/prisma";
import type { Project } from "@prisma/client";

export interface OwnershipCheckSuccess {
  authorized: true;
  project: Project;
}

export interface OwnershipCheckFailure {
  authorized: false;
  status: 404 | 403;
  error: string;
}

export type OwnershipCheckResult =
  | OwnershipCheckSuccess
  | OwnershipCheckFailure;

/**
 * Verifies that a project exists and that the currently authenticated user is its owner.
 * Returns 404 if the project is not found, or 403 if the user is not the owner.
 */
export async function verifyProjectOwner(
  projectId: string,
  userId: string
): Promise<OwnershipCheckResult> {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
  });

  if (!project) {
    return {
      authorized: false,
      status: 404,
      error: "Project not found",
    };
  }

  if (project.ownerId !== userId) {
    return {
      authorized: false,
      status: 403,
      error: "Forbidden",
    };
  }

  return {
    authorized: true,
    project,
  };
}
