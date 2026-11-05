import { z } from "zod";

/**
 * Valid task status values across AI generation and background workflows.
 */
export const TaskStatusSchema = z.enum([
  "start",
  "processing",
  "complete",
  "error",
  "idle",
]);

export type TaskStatus = z.infer<typeof TaskStatusSchema>;

/**
 * Task category or workflow identifier (e.g., 'design', 'spec').
 */
export const TaskTypeSchema = z.enum(["design", "spec"]).or(z.string());
export type TaskType = z.infer<typeof TaskTypeSchema>;

/**
 * Schema for incoming feed messages in the shared AI status feed (`ai-status-feed`).
 * Supports an optional `text` field, status, optional message, type, and timestamp.
 */
export const TaskFeedPayloadSchema = z
  .object({
    status: TaskStatusSchema.optional(),
    text: z.string().optional(),
    message: z.string().optional(),
    type: TaskTypeSchema.optional(),
    timestamp: z.number().optional(),
  })
  .passthrough();

export type TaskFeedPayload = z.infer<typeof TaskFeedPayloadSchema>;

// Aliases for compatibility
export const TaskStatusPayloadSchema = TaskFeedPayloadSchema;
export type TaskStatusPayload = TaskFeedPayload;
export const TaskFeedMessageSchema = TaskFeedPayloadSchema;
export type TaskFeedMessage = TaskFeedPayload;

/**
 * Validates and extracts a typed task feed payload from unknown message data.
 * Returns null if the data fails schema validation or is not an object.
 */
export function validateTaskFeedMessage(data: unknown): TaskFeedPayload | null {
  if (!data || typeof data !== "object") {
    return null;
  }
  const result = TaskFeedPayloadSchema.safeParse(data);
  return result.success ? result.data : null;
}

/**
 * Convenience alias for validateTaskFeedMessage.
 */
export const parseTaskFeedPayload = validateTaskFeedMessage;

/**
 * Helper to determine whether a given status represents an active generation in progress.
 */
export function isTaskStatusActive(status?: string | null): boolean {
  return status === "start" || status === "processing";
}

export const AI_STATUS_FEED_ID = "ai-status-feed";
export const AI_CHAT_FEED_ID = "ai-chat";

/**
 * Sender representation for chat messages, accepting either a string name or a structured sender object.
 */
export const ChatMessageSenderSchema = z.union([
  z.string(),
  z.object({
    id: z.string().optional(),
    name: z.string().optional(),
    color: z.string().optional(),
    avatar: z.string().optional(),
  }),
]);

export type ChatMessageSender = z.infer<typeof ChatMessageSenderSchema>;

/**
 * Zod schema defining collaborative chat messages in the Liveblocks `ai-chat` feed.
 * Includes sender, role, content, and timestamp.
 */
export const ChatMessagePayloadSchema = z.object({
  sender: ChatMessageSenderSchema,
  role: z.enum(["user", "assistant", "system"]).or(z.string()),
  content: z.string().min(1),
  timestamp: z.number(),
});

export type ChatMessagePayload = z.infer<typeof ChatMessagePayloadSchema>;

/**
 * Validates and extracts a typed chat message from unknown feed data.
 * Returns null if the data fails schema validation or is not an object.
 */
export function validateChatMessage(data: unknown): ChatMessagePayload | null {
  if (!data || typeof data !== "object") {
    return null;
  }
  const result = ChatMessagePayloadSchema.safeParse(data);
  return result.success ? result.data : null;
}

/**
 * Convenience alias for validateChatMessage.
 */
export const parseChatMessage = validateChatMessage;

export interface SenderInfo {
  id?: string;
  name: string;
  color?: string;
  avatar?: string;
}

/**
 * Normalizes a sender field into a consistent SenderInfo object.
 */
export function getSenderInfo(sender: unknown): SenderInfo {
  if (typeof sender === "string" && sender.trim()) {
    return { name: sender.trim() };
  }
  if (sender && typeof sender === "object") {
    const s = sender as Record<string, unknown>;
    const name = typeof s.name === "string" && s.name.trim() ? s.name.trim() : "Collaborator";
    return {
      id: typeof s.id === "string" ? s.id : undefined,
      name,
      color: typeof s.color === "string" ? s.color : undefined,
      avatar: typeof s.avatar === "string" ? s.avatar : undefined,
    };
  }
  return { name: "Collaborator" };
}

/**
 * Formats a numeric timestamp into a concise user-friendly time string (e.g., '10:45 AM').
 */
export function formatMessageTime(timestamp: number): string {
  try {
    const date = new Date(timestamp);
    if (isNaN(date.getTime())) return "";
    return date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
  } catch {
    return "";
  }
}
