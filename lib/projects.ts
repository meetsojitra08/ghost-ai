import { prisma } from "@/lib/prisma";
import type { Project as PrismaProject, ProjectCollaborator } from "@prisma/client";
import type { Project } from "@/types/project";

export type ProjectWithCollaborators = PrismaProject & {
  collaborators: ProjectCollaborator[];
};

/**
 * Extracts and returns only verified email addresses for a user.
 */
export function getVerifiedUserEmails(
  user: {
    emailAddresses?: Array<{
      emailAddress: string;
      verification?: { status?: string | null } | null;
    }>;
  } | null | undefined
): string[] {
  if (!user?.emailAddresses) {
    return [];
  }

  return user.emailAddresses
    .filter((email) => email.verification?.status === "verified")
    .map((email) => email.emailAddress);
}

/**
 * Formats a timestamp into a human-readable relative time string.
 */
export function formatRelativeTime(date: Date | string): string {
  const now = new Date();
  const past = new Date(date);
  const diffInSeconds = Math.max(0, Math.floor((now.getTime() - past.getTime()) / 1000));

  if (diffInSeconds < 60) return "Just now";
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) {
    return `${diffInMinutes} minute${diffInMinutes === 1 ? "" : "s"} ago`;
  }
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) {
    return `${diffInHours} hour${diffInHours === 1 ? "" : "s"} ago`;
  }
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays === 1) return "Yesterday";
  if (diffInDays < 7) {
    return `${diffInDays} days ago`;
  }
  if (diffInDays < 30) {
    const weeks = Math.floor(diffInDays / 7);
    return `${weeks} week${weeks === 1 ? "" : "s"} ago`;
  }
  return past.toLocaleDateString();
}

/**
 * Transforms a Prisma Project model into the client-facing Project interface.
 */
export function formatProjectForClient(
  project: PrismaProject,
  currentUserId: string
): Project {
  return {
    id: project.id,
    name: project.name,
    slug: project.id,
    isOwner: project.ownerId === currentUserId,
    updatedAt: formatRelativeTime(project.updatedAt),
  };
}

/**
 * Fetches all projects owned by the specified user.
 */
export async function getOwnedProjects(userId: string): Promise<ProjectWithCollaborators[]> {
  return prisma.project.findMany({
    where: {
      ownerId: userId,
    },
    orderBy: {
      createdAt: "desc",
    },
    include: {
      collaborators: true,
    },
  });
}

/**
 * Fetches all projects shared with the specified user by email address where the user is not the owner.
 */
export async function getSharedProjects(
  userId: string,
  userEmails: string[] = []
): Promise<ProjectWithCollaborators[]> {
  if (userEmails.length === 0) {
    return [];
  }

  return prisma.project.findMany({
    where: {
      collaborators: {
        some: {
          email: {
            in: userEmails,
          },
        },
      },
      ownerId: {
        not: userId,
      },
    },
    orderBy: {
      createdAt: "desc",
    },
    include: {
      collaborators: true,
    },
  });
}

/**
 * Fetches both owned and shared projects for a user, returning them formatted for client UI consumption.
 */
export async function getUserProjects(
  userId: string,
  userEmails: string[] = []
): Promise<{
  ownedProjects: Project[];
  sharedProjects: Project[];
}> {
  const [ownedRaw, sharedRaw] = await Promise.all([
    getOwnedProjects(userId),
    getSharedProjects(userId, userEmails),
  ]);

  return {
    ownedProjects: ownedRaw.map((p) => formatProjectForClient(p, userId)),
    sharedProjects: sharedRaw.map((p) => formatProjectForClient(p, userId)),
  };
}

/**
 * Fetches a single project by ID if the user is either the owner or a collaborator.
 */
export async function getProjectForUser(
  projectId: string,
  userId: string,
  userEmails: string[] = []
): Promise<Project | null> {
  const project = await prisma.project.findUnique({
    where: {
      id: projectId,
    },
    include: {
      collaborators: true,
    },
  });

  if (!project) {
    return null;
  }

  const isOwner = project.ownerId === userId;
  const isCollaborator =
    userEmails.length > 0 &&
    project.collaborators.some((c) => userEmails.includes(c.email));

  if (!isOwner && !isCollaborator) {
    return null;
  }

  return formatProjectForClient(project, userId);
}
