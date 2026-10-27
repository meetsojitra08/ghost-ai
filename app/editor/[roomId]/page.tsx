import { redirect } from "next/navigation";
import { AccessDenied, EditorWorkspace } from "@/components/editor";
import { checkProjectAccess, getClerkIdentity } from "@/lib/project-access";
import { formatProjectForClient, getUserProjects } from "@/lib/projects";

export const instant = false;

interface EditorRoomPageProps {
  params: Promise<{
    roomId: string;
  }>;
}

export default async function EditorRoomPage({ params }: EditorRoomPageProps) {
  const identity = await getClerkIdentity();
  if (!identity?.userId) {
    redirect("/sign-in");
  }

  const { roomId } = await params;
  if (!roomId) {
    return <AccessDenied />;
  }

  const access = await checkProjectAccess(
    roomId,
    identity.userId,
    identity.emails
  );

  if (!access.hasAccess || !access.project) {
    return <AccessDenied />;
  }

  const { ownedProjects, sharedProjects } = await getUserProjects(
    identity.userId,
    identity.emails && identity.emails.length > 0
      ? identity.emails
      : identity.email
      ? [identity.email]
      : []
  );

  const activeProject = formatProjectForClient(access.project, identity.userId);

  return (
    <EditorWorkspace
      activeProject={activeProject}
      initialOwnedProjects={ownedProjects}
      initialSharedProjects={sharedProjects}
    />
  );
}
