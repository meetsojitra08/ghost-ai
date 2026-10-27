import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

const MOUNTED_AUTH_ROUTES = {
  signIn: "/sign-in",
  signUp: "/sign-up",
} as const;

/**
 * Resolves configured authentication paths to mounted Next.js routes.
 * Normalizes full URLs to pathnames and falls back to supported default paths
 * (/sign-in, /sign-up) if the configured path does not match a mounted route.
 */
function resolveMountedAuthPath(envPathOrUrl: string | undefined, defaultPath: string): string {
  if (!envPathOrUrl) return defaultPath;
  try {
    const pathname = new URL(envPathOrUrl, "http://localhost").pathname.replace(/\/$/, "");
    if (pathname === defaultPath || pathname.startsWith(`${defaultPath}/`)) {
      return pathname;
    }
    return defaultPath;
  } catch {
    return defaultPath;
  }
}

const signInPath = resolveMountedAuthPath(process.env.NEXT_PUBLIC_CLERK_SIGN_IN_URL, MOUNTED_AUTH_ROUTES.signIn);
const signUpPath = resolveMountedAuthPath(process.env.NEXT_PUBLIC_CLERK_SIGN_UP_URL, MOUNTED_AUTH_ROUTES.signUp);

// Public auth routes defined using verified mounted auth routes
const isPublicRoute = createRouteMatcher([
  `${signInPath}(.*)`,
  `${signUpPath}(.*)`,
]);

export default clerkMiddleware(async (auth, req) => {
  // Allow API routes to reach route handlers directly so they enforce 401/403 JSON responses
  if (req.nextUrl.pathname.startsWith("/api")) {
    return;
  }

  if (!isPublicRoute(req)) {
    await auth.protect();
  }
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
  ],
};
