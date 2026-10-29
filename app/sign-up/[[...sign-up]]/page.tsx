import * as React from "react";
import { SignUp } from "@clerk/nextjs";
import { AuthShell } from "@/components/auth";


export default function SignUpPage() {
  return (
    <AuthShell>
      <React.Suspense
        fallback={
          <div className="h-96 w-full max-w-sm animate-pulse rounded-2xl bg-surface" />
        }
      >
        <SignUp
          path={process.env.NEXT_PUBLIC_CLERK_SIGN_UP_URL || "/sign-up"}
          fallbackRedirectUrl={
            process.env.NEXT_PUBLIC_CLERK_SIGN_UP_FALLBACK_REDIRECT_URL || "/editor"
          }
        />
      </React.Suspense>
    </AuthShell>
  );
}
