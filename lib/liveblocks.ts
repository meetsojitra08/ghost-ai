import { Liveblocks } from "@liveblocks/node";
import "@/liveblocks.config";

/**
 * Fixed palette of vibrant, high-contrast colors tuned for visibility on a dark canvas.
 */
export const USER_COLORS = [
  "#00C8D4", // Cyan
  "#52A8FF", // Blue
  "#BF7AF0", // Purple
  "#FF990A", // Orange
  "#FF6166", // Red
  "#F75F8F", // Pink
  "#62C073", // Green
  "#0AC7B4", // Teal
  "#EAB308", // Yellow
  "#8B82FF", // Indigo
] as const;

export const CURSOR_COLORS = USER_COLORS;

/**
 * Deterministically maps a user ID to a consistent color from a fixed palette.
 */
export function getUserColor(userId: string): string {
  if (!userId) {
    return USER_COLORS[0];
  }

  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    hash = (hash << 5) - hash + userId.charCodeAt(i);
    hash |= 0; // Convert to 32bit integer
  }

  const index = Math.abs(hash) % USER_COLORS.length;
  return USER_COLORS[index];
}

export const getCursorColor = getUserColor;

function createLiveblocksClient(): Liveblocks {
  const secret = process.env.LIVEBLOCKS_SECRET_KEY;
  if (!secret) {
    throw new Error("Missing LIVEBLOCKS_SECRET_KEY environment variable");
  }

  return new Liveblocks({
    secret,
  });
}

const globalForLiveblocks = globalThis as unknown as {
  liveblocks: Liveblocks | undefined;
};

/**
 * Returns the cached Liveblocks node client or creates a new one.
 */
export function getLiveblocksClient(): Liveblocks {
  if (globalForLiveblocks.liveblocks) {
    return globalForLiveblocks.liveblocks;
  }

  const client = createLiveblocksClient();

  if (process.env.NODE_ENV !== "production") {
    globalForLiveblocks.liveblocks = client;
  }

  return client;
}

/**
 * Cached Liveblocks node client proxy.
 * Lazily instantiates the underlying client on first access and caches it globally in development.
 */
export const liveblocks: Liveblocks = new Proxy({} as Liveblocks, {
  get(_target, prop) {
    const client = getLiveblocksClient();
    const value = (client as unknown as Record<string | symbol, unknown>)[prop];
    if (typeof value === "function") {
      return value.bind(client);
    }
    return value;
  },
});

export default liveblocks;
