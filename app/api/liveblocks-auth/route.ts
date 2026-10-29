import { currentUser } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { checkProjectAccess, getClerkIdentity } from "@/lib/project-access";
import { getUserColor, liveblocks } from "@/lib/liveblocks";

/**
 * POST /api/liveblocks-auth
 * Authenticates users for Liveblocks room sessions.
 * Enforces Clerk authentication and project access checks.
 */
export async function POST(request: Request) {
  // 1. Require Clerk authentication
  const identity = await getClerkIdentity();
  if (!identity || !identity.userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Parse room / project ID from request body or query params
  let body: Record<string, unknown> = {};
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    // Request may not have a body or JSON payload
  }

  const url = new URL(request.url);
  const roomId =
    (typeof body.room === "string" && body.room.trim()) ||
    (typeof body.roomId === "string" && body.roomId.trim()) ||
    (typeof body.projectId === "string" && body.projectId.trim()) ||
    url.searchParams.get("room")?.trim() ||
    url.searchParams.get("roomId")?.trim() ||
    url.searchParams.get("projectId")?.trim();

  if (!roomId) {
    return NextResponse.json({ error: "Room ID is required" }, { status: 400 });
  }

  // 2. Verify project access using the existing access helper
  const access = await checkProjectAccess(roomId, identity.userId, identity.emails);
  if (!access.hasAccess || !access.project) {
    return NextResponse.json(
      { error: "Unauthorized project access" },
      { status: 403 }
    );
  }

  if (!process.env.LIVEBLOCKS_SECRET_KEY) {
    return NextResponse.json(
      { error: "LIVEBLOCKS_SECRET_KEY is not configured" },
      { status: 500 }
    );
  }

  // Resolve user info for session
  const user = await currentUser();
  const name =
    user?.fullName ||
    [user?.firstName, user?.lastName].filter(Boolean).join(" ") ||
    user?.username ||
    identity.email ||
    "Anonymous";
  const avatar = user?.imageUrl || undefined;
  const color = getUserColor(identity.userId);

  try {
    // 3. Ensure the Liveblocks room exists (create only if needed)
    try {
      await liveblocks.getOrCreateRoom(roomId, {
        defaultAccesses: [],
        metadata: {
          projectId: access.project.id,
          name: access.project.name,
        },
      });
    } catch (roomError) {
      console.error("Liveblocks getOrCreateRoom error:", roomError);
    }

    // 4. Return a session token with user metadata attached
    const session = liveblocks.prepareSession(identity.userId, {
      userInfo: {
        name,
        avatar,
        color,
        displayName: name,
        avatarUrl: avatar,
        cursorColor: color,
      },
    });

    session.allow(roomId, session.FULL_ACCESS);

    const { status, body: sessionBody } = await session.authorize();

    return new Response(sessionBody, {
      status,
      headers: {
        "Content-Type": "application/json",
      },
    });
  } catch (error) {
    console.error("Failed to authorize Liveblocks session:", error);
    return NextResponse.json(
      { error: "Failed to authorize Liveblocks session" },
      { status: 500 }
    );
  }
}
