import { auth, currentUser } from "@clerk/nextjs/server";
import { EditorWorkspace } from "@/components/editor";
import { getUserProjects, getVerifiedUserEmails } from "@/lib/projects";

export const instant = false;

export default async function EditorPage() {
  const { userId } = await auth.protect();
  const user = await currentUser();
  const userEmails = getVerifiedUserEmails(user);

  const { ownedProjects, sharedProjects } = await getUserProjects(
    userId,
    userEmails
  );

  return (
    <EditorWorkspace
      initialOwnedProjects={ownedProjects}
      initialSharedProjects={sharedProjects}
    />
  );
}
