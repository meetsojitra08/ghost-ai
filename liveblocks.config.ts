import type { ChatMessagePayload, TaskFeedPayload } from "@/types/tasks";

export type AiStatusEvent = {
  type: "ai-status";
  status: "start" | "processing" | "complete" | "error";
  message: string;
  timestamp: number;
};

// Define Liveblocks types for your application
// https://liveblocks.io/docs/api-reference/liveblocks-react#Typing-your-data
declare global {
  interface Liveblocks {
    // Each user's Presence, for useMyPresence, useOthers, etc.
    Presence: {
      cursor: { x: number; y: number } | null;
      thinking: boolean;
    };

    // The Storage tree for the room, for useMutation, useStorage, etc.
    Storage: Record<string, never>;

    // Custom user info set when authenticating with a secret key
    UserMeta: {
      id: string;
      info: {
        name: string;
        avatar?: string;
        color: string;
        displayName?: string;
        avatarUrl?: string;
        cursorColor?: string;
      };
    };

    // Custom events, for useBroadcastEvent, useEventListener
    RoomEvent: AiStatusEvent;

    // Custom metadata set on feeds, for useFeeds, useCreateFeed, etc.
    FeedMetadata: {
      name?: string;
    };

    // Custom payload set on feed messages, for useFeedMessages, useCreateFeedMessage, etc.
    FeedMessageData: TaskFeedPayload | ChatMessagePayload | Record<string, unknown>;

    // Custom metadata set on threads, for useThreads, useCreateThread, etc.
    ThreadMetadata: Record<string, never>;

    // Custom room info set with resolveRoomsInfo, for useRoomInfo
    RoomInfo: Record<string, never>;
  }
}

export {};
