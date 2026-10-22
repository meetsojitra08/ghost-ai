import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

function getPathname(urlOrPath: string): string {
  try {
    return new URL(urlOrPath, "http://localhost").pathname;
  } catch {
    return urlOrPath.startsWith("/") ? urlOrPath : `/${urlOrPath}`;
  }
}

const signInPath = getPathname(process.env.NEXT_PUBLIC_CLERK_SIGN_IN_URL || "/sign-in");
const signUpPath = getPathname(process.env.NEXT_PUBLIC_CLERK_SIGN_UP_URL || "/sign-up");

// Public auth routes resolving mounted pages and configured URLs
const isPublicRoute = createRouteMatcher([
  "/sign-in(.*)",
  "/sign-up(.*)",
  `${signInPath}(.*)`,
  `${signUpPath}(.*)`,
]);

export default clerkMiddleware(async (auth, req) => {
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
