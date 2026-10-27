import { auth, currentUser } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import type { Project as PrismaProject, ProjectCollaborator } from "@prisma/client";

export interface ClerkIdentity {
  userId: string;
  email: string | null;
  emails: string[];
}

export type ProjectWithCollaborators = PrismaProject & {
  collaborators: ProjectCollaborator[];
};

export interface ProjectAccessResult {
  hasAccess: boolean;
  project: ProjectWithCollaborators | null;
  isOwner: boolean;
  isCollaborator: boolean;
}

/**
 * Extracts and returns the current Clerk user identity (userId + primary email and all verified emails).
 * Returns null if the user is unauthenticated.
 */
export async function getClerkIdentity(): Promise<ClerkIdentity | null> {
  const { userId } = await auth();
  if (!userId) {
    return null;
  }

  const user = await currentUser();
  if (!user) {
    return {
      userId,
      email: null,
      emails: [],
    };
  }

  const verifiedAddresses = user.emailAddresses.filter(
    (address) => address.verification?.status === "verified"
  );
  const verifiedEmails = verifiedAddresses.map((address) => address.emailAddress);
  const primaryEmail =
    verifiedAddresses.find((address) => address.id === user.primaryEmailAddressId)
      ?.emailAddress ??
    verifiedEmails[0] ??
    null;

  return {
    userId,
    email: primaryEmail,
    emails: verifiedEmails,
  };
}

/**
 * Alias for getClerkIdentity
 */
export const getCurrentIdentity = getClerkIdentity;

/**
 * Checks whether the given user has access to a project by ID as either the owner or a collaborator.
 * If userId is not provided, it resolves the current Clerk identity.
 */
export async function checkProjectAccess(
  projectId: string,
  userId?: string,
  userEmail?: string | null | string[]
): Promise<ProjectAccessResult> {
  let resolvedUserId = userId;
  let resolvedEmail = userEmail;
  let resolvedEmails: string[] = [];

  if (!resolvedUserId) {
    const identity = await getClerkIdentity();
    if (!identity?.userId) {
      return {
        hasAccess: false,
        project: null,
        isOwner: false,
        isCollaborator: false,
      };
    }
    resolvedUserId = identity.userId;
    resolvedEmail = identity.email;
    resolvedEmails = identity.emails;
  } else if (Array.isArray(userEmail)) {
    resolvedEmails = userEmail;
    resolvedEmail = userEmail[0] ?? null;
  } else if (typeof userEmail === "string") {
    resolvedEmails = [userEmail];
  }

  const project = await prisma.project.findUnique({
    where: {
      id: projectId,
    },
    include: {
      collaborators: true,
    },
  });

  if (!project) {
    return {
      hasAccess: false,
      project: null,
      isOwner: false,
      isCollaborator: false,
    };
  }

  const isOwner = project.ownerId === resolvedUserId;

  const emailCandidates = [
    ...(typeof resolvedEmail === "string" ? [resolvedEmail] : []),
    ...resolvedEmails,
  ]
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);

  const isCollaborator =
    emailCandidates.length > 0 &&
    project.collaborators.some((collab) =>
      emailCandidates.includes(collab.email.trim().toLowerCase())
    );

  const hasAccess = isOwner || isCollaborator;

  return {
    hasAccess,
    project: hasAccess ? project : null,
    isOwner,
    isCollaborator,
  };
}

/**
 * Convenience helper returning a boolean indicating if user has project access.
 */
export async function hasProjectAccess(
  projectId: string,
  userId?: string,
  email?: string | null
): Promise<boolean> {
  const result = await checkProjectAccess(projectId, userId, email);
  return result.hasAccess;
}
