"use client";

import * as React from "react";
import { useAuth } from "@clerk/nextjs";
import { UserButton } from "@clerk/nextjs";
import {
  shallow,
  useOthers,
  useOthersConnectionIds,
} from "@liveblocks/react/suspense";
import { useOther } from "@liveblocks/react/suspense";

interface Collaborator {
  connectionId: number;
  userId: string;
  name: string;
  avatar?: string;
  color: string;
}

function getInitials(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return "?";
  return words.length === 1
    ? words[0].slice(0, 2).toUpperCase()
    : `${words[0][0]}${words[words.length - 1][0]}`.toUpperCase();
}

function CollaboratorAvatar({ collaborator }: { collaborator: Collaborator }) {
  return (
    <div
      role="img"
      aria-label={collaborator.name}
      title={collaborator.name}
      className="relative flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full border-2 border-base bg-surface-elevated text-[10px] font-semibold text-copy-primary ring-1 ring-surface-border"
      style={{ color: collaborator.color }}
    >
      {collaborator.avatar ? (
        // Profile image URLs are provided by Clerk metadata and may be external.
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={collaborator.avatar}
          alt=""
          className="h-full w-full object-cover"
          referrerPolicy="no-referrer"
        />
      ) : (
        getInitials(collaborator.name)
      )}
    </div>
  );
}

function ParticipantAvatars() {
  const { userId } = useAuth();
  const collaborators = useOthers(
    (others) =>
      others
        .map((other) => ({
          connectionId: other.connectionId,
          userId: other.id,
          name: other.info.name,
          avatar: other.info.avatar,
          color: other.info.color,
        }))
        .filter((other) => other.userId !== userId),
    shallow
  );

  const visibleCollaborators = collaborators.slice(0, 5);
  const overflowCount = Math.max(0, collaborators.length - 5);

  return (
    <div
      data-slot="canvas-participants"
      className="absolute right-4 top-4 z-20 flex items-center gap-3 rounded-2xl border border-surface-border bg-surface/90 px-3 py-2 shadow-lg backdrop-blur-md"
    >
      {collaborators.length > 0 ? (
        <>
          <div
            role="group"
            className="flex items-center pl-2"
            aria-label={`${collaborators.length} collaborator${collaborators.length === 1 ? "" : "s"} in this room`}
          >
            {visibleCollaborators.map((collaborator, index) => (
              <div
                key={collaborator.connectionId}
                className={index === 0 ? "relative" : "relative -ml-2.5"}
              >
                <CollaboratorAvatar collaborator={collaborator} />
              </div>
            ))}
            {overflowCount > 0 ? (
              <div
                role="img"
                aria-label={`${overflowCount} more collaborators`}
                className="relative -ml-2.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 border-base bg-surface-elevated text-[10px] font-semibold text-copy-secondary ring-1 ring-surface-border"
              >
                +{overflowCount}
              </div>
            ) : null}
          </div>
          <span aria-hidden="true" className="h-6 w-px bg-surface-border" />
        </>
      ) : null}
      <UserButton />
    </div>
  );
}

function ParticipantCursor({
  connectionId,
  currentUserId,
}: {
  connectionId: number;
  currentUserId: string | null | undefined;
}) {
  const other = useOther(
    connectionId,
    (user) => ({ id: user.id, info: user.info, presence: user.presence }),
    shallow
  );
  if (
    !other ||
    other.id === currentUserId ||
    !other.presence.cursor ||
    !other.info
  ) {
    return null;
  }

  const { x, y } = other.presence.cursor;
  const name = other.info.name || "Collaborator";
  const color = other.info.color || "var(--accent-primary)";

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute left-0 top-0 z-30"
      style={{ transform: `translate3d(${x}px, ${y}px, 0)` }}
    >
      <svg
        className="h-5 w-5 drop-shadow"
        viewBox="0 0 20 20"
        fill="none"
      >
        <path
          d="M2.25 1.5 17.5 11.2l-6.1 1.05-3.25 5.1L2.25 1.5Z"
          fill={color}
          stroke="var(--bg-base)"
          strokeWidth="1.5"
          strokeLinejoin="round"
        />
      </svg>
      <span
        className="ml-3 mt-0.5 block max-w-40 truncate rounded-md px-2 py-1 text-[10px] font-semibold leading-none text-white shadow-md"
        style={{ backgroundColor: color }}
      >
        {name}
      </span>
    </div>
  );
}

export function CanvasPresence() {
  const { userId } = useAuth();
  const connectionIds = useOthersConnectionIds();

  return (
    <>
      <ParticipantAvatars />
      <div
        data-slot="canvas-live-cursors"
        className="pointer-events-none absolute inset-0 z-30 overflow-hidden"
      >
        {connectionIds.map((connectionId) => (
          <ParticipantCursor
            key={connectionId}
            connectionId={connectionId}
            currentUserId={userId}
          />
        ))}
      </div>
    </>
  );
}
