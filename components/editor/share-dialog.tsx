"use client"

import * as React from "react"
import { Check, Copy, LoaderCircle, Mail, UserRound, UserRoundPlus, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useCollaborators } from "@/hooks/use-collaborators"
import { EditorDialog } from "./editor-dialog"

interface ShareDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  projectId: string
  projectName: string
  isOwner: boolean
}

export function ShareDialog({
  open,
  onOpenChange,
  projectId,
  projectName,
  isOwner,
}: ShareDialogProps) {
  const [email, setEmail] = React.useState("")
  const [copied, setCopied] = React.useState(false)
  const copiedTimeout = React.useRef<ReturnType<typeof setTimeout> | null>(null)
  const {
    collaborators,
    isLoading,
    isSubmitting,
    removingEmail,
    error,
    inviteError,
    setError,
    clearInviteError,
    inviteCollaborator,
    removeCollaborator,
    reset,
  } = useCollaborators(projectId, open)

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) reset()
    onOpenChange(nextOpen)
  }

  React.useEffect(
    () => () => {
      if (copiedTimeout.current) clearTimeout(copiedTimeout.current)
    },
    []
  )

  const handleInviteCollaborator = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const normalizedEmail = email.trim().toLowerCase()
    if (!normalizedEmail || isSubmitting) return
    if (await inviteCollaborator(normalizedEmail)) setEmail("")
  }

  const copyProjectLink = async () => {
    try {
      await navigator.clipboard.writeText(`${window.location.origin}/editor/${projectId}`)
      setCopied(true)
      if (copiedTimeout.current) clearTimeout(copiedTimeout.current)
      copiedTimeout.current = setTimeout(() => setCopied(false), 1800)
    } catch {
      setError("Could not copy the project link")
    }
  }

  return (
    <EditorDialog
      open={open}
      onOpenChange={handleOpenChange}
      title="Share project"
      description={projectName}
      icon={
        <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-brand/20 bg-accent-dim text-brand">
          <UserRoundPlus className="h-5 w-5" />
        </div>
      }
      className="sm:max-w-lg"
      footer={
        <Button
          type="button"
          variant="outline"
          onClick={copyProjectLink}
          className="gap-2 rounded-xl border-surface-border bg-surface text-copy-primary hover:bg-subtle sm:mr-auto"
        >
          {copied ? <Check className="h-4 w-4 text-state-success" /> : <Copy className="h-4 w-4" />}
          {copied ? "Copied!" : "Copy project link"}
        </Button>
      }
    >
      <div className="space-y-5">
        {isOwner ? (
          <form onSubmit={handleInviteCollaborator} className="space-y-2.5">
            <label htmlFor="share-email" className="text-xs font-medium text-copy-secondary">
              Invite collaborators
            </label>
            <div className="flex gap-2">
              <div className="relative min-w-0 flex-1">
                <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-copy-muted" />
                <Input
                  id="share-email"
                  type="email"
                  autoComplete="email"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(event) => {
                    setEmail(event.target.value)
                    clearInviteError()
                  }}
                  maxLength={254}
                  required
                  className="h-10 rounded-xl border-surface-border bg-surface pl-9 text-copy-primary placeholder:text-copy-muted"
                />
              </div>
              <Button type="submit" disabled={isSubmitting || !email.trim()} className="h-10 gap-2 rounded-xl px-3">
                {isSubmitting ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <UserRoundPlus className="h-4 w-4" />}
                <span className="hidden sm:inline">Invite</span>
              </Button>
            </div>
            {inviteError ? (
              <p role="alert" className="text-sm text-state-error">
                {inviteError}
              </p>
            ) : null}
          </form>
        ) : (
          <p className="rounded-xl border border-surface-border bg-surface px-3 py-2.5 text-xs text-copy-muted">
            You can view who has access to this project. Only the owner can manage access.
          </p>
        )}

        <section aria-labelledby="collaborator-heading" className="space-y-2.5">
          <div className="flex items-center justify-between">
            <h3 id="collaborator-heading" className="text-xs font-medium text-copy-secondary">
              People with access
            </h3>
            {!isLoading ? <span className="text-xs text-copy-muted">{collaborators.length}</span> : null}
          </div>
          <div className="max-h-64 space-y-1 overflow-y-auto">
            {isLoading ? (
              <div className="flex items-center justify-center gap-2 py-8 text-sm text-copy-muted">
                <LoaderCircle className="h-4 w-4 animate-spin" /> Loading collaborators…
              </div>
            ) : collaborators.length === 0 ? (
              <div className="rounded-xl border border-dashed border-surface-border px-4 py-7 text-center text-sm text-copy-muted">
                No collaborators have been invited yet.
              </div>
            ) : (
              collaborators.map((collaborator) => (
                <div key={collaborator.id} className="flex items-center gap-3 rounded-xl px-2 py-2 hover:bg-subtle/70">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full border border-surface-border bg-subtle text-copy-muted">
                    {collaborator.imageUrl ? (
                      // Clerk avatar URLs are external and may vary per account.
                      <img src={collaborator.imageUrl} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <UserRound className="h-4 w-4" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    {collaborator.name ? <p className="truncate text-sm text-copy-primary">{collaborator.name}</p> : null}
                    <p className="truncate text-xs text-copy-muted">{collaborator.email}</p>
                  </div>
                  {isOwner ? (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      aria-label={`Remove ${collaborator.email}`}
                      title="Remove access"
                      disabled={removingEmail === collaborator.email}
                      onClick={() => removeCollaborator(collaborator.email)}
                      className="shrink-0 text-copy-muted hover:bg-state-error/10 hover:text-state-error"
                    >
                      {removingEmail === collaborator.email ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <X className="h-4 w-4" />}
                    </Button>
                  ) : null}
                </div>
              ))
            )}
          </div>
        </section>

        {error ? (
          <p role="alert" className="rounded-xl border border-state-error/30 bg-state-error/10 px-3 py-2 text-sm text-state-error">
            {error}
          </p>
        ) : null}
      </div>
    </EditorDialog>
  )
}
