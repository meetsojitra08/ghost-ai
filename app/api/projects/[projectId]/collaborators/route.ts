import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { enrichCollaborators } from "@/lib/collaborators";
import { prisma } from "@/lib/prisma";
import { checkProjectAccess, getClerkIdentity } from "@/lib/project-access";

interface RouteContext {
  params: Promise<{ projectId: string }>;
}

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

async function getAuthorizedProject(projectId: string) {
  const identity = await getClerkIdentity();
  if (!identity) {
    return { response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }

  const access = await checkProjectAccess(projectId, identity.userId, identity.emails);
  if (!access.project) {
    const exists = await prisma.project.findUnique({ where: { id: projectId }, select: { id: true } });
    return {
      response: NextResponse.json(
        { error: exists ? "Forbidden" : "Project not found" },
        { status: exists ? 403 : 404 }
      ),
    };
  }

  return { identity, project: access.project };
}

export async function GET(_request: Request, context: RouteContext) {
  const { projectId } = await context.params;
  const authorization = await getAuthorizedProject(projectId);
  if ("response" in authorization) return authorization.response;

  const collaborators = await prisma.projectCollaborator.findMany({
    where: { projectId },
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json({ collaborators: await enrichCollaborators(collaborators) });
}

export async function POST(request: Request, context: RouteContext) {
  const { projectId } = await context.params;
  const authorization = await getAuthorizedProject(projectId);
  if ("response" in authorization) return authorization.response;
  if (authorization.project.ownerId !== authorization.identity.userId) {
    return NextResponse.json({ error: "Only the project owner can invite collaborators" }, { status: 403 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "A valid email address is required" }, { status: 400 });
  }

  const email =
    typeof body === "object" && body !== null && "email" in body && typeof body.email === "string"
      ? body.email.trim().toLowerCase()
      : "";
  if (!email || email.length > 254 || !emailPattern.test(email)) {
    return NextResponse.json({ error: "Enter a valid email address" }, { status: 400 });
  }
  if (authorization.identity.emails.some((ownedEmail) => ownedEmail.toLowerCase() === email)) {
    return NextResponse.json({ error: "You already own this project" }, { status: 400 });
  }

  const existing = await prisma.projectCollaborator.findMany({ where: { projectId } });
  if (existing.some((collaborator) => collaborator.email.toLowerCase() === email)) {
    return NextResponse.json({ error: "This person already has access" }, { status: 409 });
  }

  const collaborator = await prisma.projectCollaborator.create({
    data: { projectId, email },
  });
  const [profile] = await enrichCollaborators([collaborator]);
  return NextResponse.json({ collaborator: profile }, { status: 201 });
}

export async function DELETE(request: Request, context: RouteContext) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { projectId } = await context.params;
  const project = await prisma.project.findUnique({ where: { id: projectId } });
  if (!project) return NextResponse.json({ error: "Project not found" }, { status: 404 });
  if (project.ownerId !== userId) {
    return NextResponse.json({ error: "Only the project owner can remove collaborators" }, { status: 403 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "A valid email address is required" }, { status: 400 });
  }
  const email =
    typeof body === "object" && body !== null && "email" in body && typeof body.email === "string"
      ? body.email.trim().toLowerCase()
      : "";
  if (!email || !emailPattern.test(email)) {
    return NextResponse.json({ error: "A valid email address is required" }, { status: 400 });
  }

  const matches = await prisma.projectCollaborator.findMany({ where: { projectId } });
  const collaborator = matches.find((entry) => entry.email.toLowerCase() === email);
  if (!collaborator) return NextResponse.json({ error: "Collaborator not found" }, { status: 404 });

  await prisma.projectCollaborator.delete({ where: { id: collaborator.id } });
  return NextResponse.json({ success: true });
}
