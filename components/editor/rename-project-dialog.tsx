"use client"

import * as React from "react"
import { AlertCircle, Globe, Loader2, Pencil, X } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { slugify } from "@/lib/slug"
import type { Project } from "@/types/project"
import { EditorDialog } from "./editor-dialog"

export interface RenameProjectDialogProps {
  open: boolean
  onClose: () => void
  project: Project | null
  name: string
  onChangeName: (name: string) => void
  onSubmit: (e?: React.FormEvent) => void
  isLoading?: boolean
  error?: string | null
}

export function RenameProjectDialog({
  open,
  onClose,
  project,
  name,
  onChangeName,
  onSubmit,
  isLoading = false,
  error = null,
}: RenameProjectDialogProps) {
  const inputRef = React.useRef<HTMLInputElement>(null)

  React.useEffect(() => {
    if (open) {
      const timer = setTimeout(() => {
        inputRef.current?.focus()
        inputRef.current?.select()
      }, 50)
      return () => clearTimeout(timer)
    }
  }, [open])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (name.trim() && !isLoading) {
      onSubmit(e)
    }
  }

  const liveSlug = slugify(name)

  return (
    <EditorDialog
      open={open}
      onOpenChange={(isOpen) => {
        if (!isOpen) onClose()
      }}
      icon={
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-brand/25 bg-brand-dim text-brand shadow-[0_0_15px_rgba(0,200,212,0.15)]">
          <Pencil className="h-5 w-5" />
        </div>
      }
      title="Rename Project"
      description={
        <span>
          Current project name:{" "}
          <span className="font-semibold text-copy-primary">
            &ldquo;{project?.name ?? ""}&rdquo;
          </span>
        </span>
      }
      footer={
        <div className="flex w-full items-center justify-end gap-2.5">
          <Button
            type="button"
            variant="ghost"
            onClick={onClose}
            disabled={isLoading}
            className="rounded-xl text-copy-muted hover:bg-subtle hover:text-copy-primary"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            form="rename-project-form"
            disabled={!name.trim() || isLoading}
            className="gap-2 rounded-xl font-medium shadow-md shadow-brand/10"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                Save Changes
                <kbd className="hidden rounded bg-black/25 px-1.5 py-0.5 font-mono text-[10px] text-primary-foreground/80 sm:inline-block">
                  ↵
                </kbd>
              </>
            )}
          </Button>
        </div>
      }
    >
      <form id="rename-project-form" onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label
              htmlFor="rename-project-name"
              className="text-xs font-medium text-copy-secondary"
            >
              New Project Name
            </label>
            <span className="font-mono text-[10px] text-copy-faint">
              {name.length}/50
            </span>
          </div>

          <div className="relative">
            <Input
              ref={inputRef}
              id="rename-project-name"
              value={name}
              onChange={(e) => onChangeName(e.target.value)}
              disabled={isLoading}
              autoFocus
              autoComplete="off"
              maxLength={50}
              className="h-10 rounded-xl border-surface-border bg-subtle px-3 pr-8 text-sm text-copy-primary placeholder:text-copy-muted/60 focus-visible:border-brand focus-visible:ring-2 focus-visible:ring-brand/20 transition-all"
            />
            {name ? (
              <button
                type="button"
                onClick={() => onChangeName("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-copy-muted hover:text-copy-primary transition-colors"
                aria-label="Clear project name"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            ) : null}
          </div>
        </div>

        {error ? (
          <div
            role="alert"
            className="flex items-center gap-2 rounded-xl border border-state-error/30 bg-state-error/10 px-3 py-2 text-xs text-state-error"
          >
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        ) : null}

        {/* Live slug update */}
        <div className="rounded-2xl border border-surface-border-subtle bg-subtle/40 p-3.5 transition-all">
          <div className="flex items-center justify-between text-xs">
            <span className="flex items-center gap-1.5 font-medium text-copy-muted">
              <Globe className="h-3.5 w-3.5 text-brand" />
              Updated Identifier
            </span>
          </div>

          <div className="mt-2 flex items-center rounded-xl border border-surface-border-subtle bg-base/80 px-3 py-2 font-mono text-xs">
            <span className="select-none text-copy-muted/70">ghost.ai/editor/</span>
            <span className="truncate font-semibold text-brand">
              {liveSlug ? (
                liveSlug
              ) : (
                <span className="font-normal italic text-copy-faint">
                  project-slug
                </span>
              )}
            </span>
          </div>
        </div>
      </form>
    </EditorDialog>
  )
}
