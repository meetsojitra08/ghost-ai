import * as React from "react";
import { SignIn } from "@clerk/nextjs";
import { AuthShell } from "@/components/auth";


export default function SignInPage() {
  return (
    <AuthShell>
      <React.Suspense
        fallback={
          <div className="h-96 w-full max-w-sm animate-pulse rounded-2xl bg-surface" />
        }
      >
        <SignIn
          path={process.env.NEXT_PUBLIC_CLERK_SIGN_IN_URL || "/sign-in"}
          fallbackRedirectUrl={
            process.env.NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL || "/editor"
          }
        />
      </React.Suspense>
    </AuthShell>
  );
}
