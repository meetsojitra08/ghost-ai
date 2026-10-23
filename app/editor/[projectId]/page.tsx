import { notFound } from "next/navigation";
import { auth, currentUser } from "@clerk/nextjs/server";
import { EditorWorkspace } from "@/components/editor";
import {
  getProjectForUser,
  getUserProjects,
  getVerifiedUserEmails,
} from "@/lib/projects";

export const instant = false;

interface ProjectEditorPageProps {
  params: Promise<{
    projectId: string;
  }>;
}

export default async function ProjectEditorPage({
  params,
}: ProjectEditorPageProps) {
  const { userId } = await auth.protect();
  const { projectId } = await params;

  if (!projectId) {
    notFound();
  }

  const user = await currentUser();
  const userEmails = getVerifiedUserEmails(user);

  const [{ ownedProjects, sharedProjects }, activeProject] = await Promise.all([
    getUserProjects(userId, userEmails),
    getProjectForUser(projectId, userId, userEmails),
  ]);

  if (!activeProject) {
    notFound();
  }

  return (
    <EditorWorkspace
      activeProject={activeProject}
      initialOwnedProjects={ownedProjects}
      initialSharedProjects={sharedProjects}
    />
  );
}
