import Link from "next/link"
import { Lock } from "lucide-react"

import { buttonVariants } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export interface AccessDeniedProps {
  title?: string
  message?: string
}

export function AccessDenied({
  title = "Access Denied",
  message = "You don't have access to this project, or it doesn't exist.",
}: AccessDeniedProps) {
  return (
    <div
      data-slot="access-denied"
      className="flex min-h-screen w-full flex-col items-center justify-center bg-base p-6 text-center text-copy-primary"
    >
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-surface-border bg-surface text-copy-muted shadow-sm">
        <Lock className="h-6 w-6 text-copy-primary" aria-hidden="true" />
      </div>

      <h1 className="mt-4 text-xl font-semibold tracking-tight text-copy-primary sm:text-2xl">
        {title}
      </h1>

      <p className="mt-2 max-w-sm text-sm text-copy-muted">
        {message}
      </p>

      <Link
        href="/editor"
        className={cn(
          buttonVariants({ variant: "default" }),
          "mt-6 rounded-xl font-medium"
        )}
      >
        Back to Projects
      </Link>
    </div>
  )
}
