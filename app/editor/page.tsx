import { auth } from "@clerk/nextjs/server";
import { EditorWorkspace } from "@/components/editor";

export const instant = false;

export default async function EditorPage() {
  await auth.protect();

  return <EditorWorkspace />;
}
