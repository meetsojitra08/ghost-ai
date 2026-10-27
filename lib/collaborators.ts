import { clerkClient } from "@clerk/nextjs/server";
import type { ProjectCollaborator } from "@prisma/client";

export interface CollaboratorProfile {
  id: string;
  email: string;
  name: string | null;
  imageUrl: string | null;
  createdAt: string;
}

export async function enrichCollaborators(
  collaborators: ProjectCollaborator[]
): Promise<CollaboratorProfile[]> {
  if (collaborators.length === 0) return [];

  const profileByEmail = new Map<string, { name: string | null; imageUrl: string | null }>();
  try {
    const client = await clerkClient();
    const users = await client.users.getUserList({
      emailAddress: collaborators.map((collaborator) => collaborator.email),
      limit: 100,
    });

    for (const user of users.data) {
      for (const address of user.emailAddresses) {
        if (address.verification?.status !== "verified") continue;
        profileByEmail.set(address.emailAddress.toLowerCase(), {
          name: user.fullName || user.username || null,
          imageUrl: user.imageUrl || null,
        });
      }
    }
  } catch {
    // Profile enrichment is best-effort; the collaborator email remains the fallback.
    profileByEmail.clear();
  }

  return collaborators.map((collaborator) => {
    const profile = profileByEmail.get(collaborator.email.toLowerCase());
    return {
      id: collaborator.id,
      email: collaborator.email,
      name: profile?.name ?? null,
      imageUrl: profile?.imageUrl ?? null,
      createdAt: collaborator.createdAt.toISOString(),
    };
  });
}
