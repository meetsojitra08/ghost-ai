"use client"

import * as React from "react"
import { AlertTriangle, Loader2, Trash2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import type { Project } from "@/types/project"
import { EditorDialog } from "./editor-dialog"

export interface DeleteProjectDialogProps {
  open: boolean
  onClose: () => void
  project: Project | null
  onConfirm: () => void
  isLoading?: boolean
}

export function DeleteProjectDialog({
  open,
  onClose,
  project,
  onConfirm,
  isLoading = false,
}: DeleteProjectDialogProps) {
  return (
    <EditorDialog
      open={open}
      onOpenChange={(isOpen) => {
        if (!isOpen) onClose()
      }}
      icon={
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-state-error/25 bg-state-error/10 text-state-error shadow-[0_0_15px_rgba(255,77,79,0.15)]">
          <Trash2 className="h-5 w-5" />
        </div>
      }
      title="Delete Project"
      description={
        <span>
          Are you sure you want to delete{" "}
          <span className="font-semibold text-copy-primary">
            &ldquo;{project?.name ?? "this project"}&rdquo;
          </span>
          ? This action cannot be undone.
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
            type="button"
            variant="destructive"
            onClick={onConfirm}
            disabled={isLoading}
            className="gap-2 rounded-xl font-medium bg-state-error text-white hover:bg-state-error/90 focus-visible:ring-2 focus-visible:ring-state-error/40 border-transparent shadow-md shadow-state-error/15"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Deleting...
              </>
            ) : (
              <>
                <Trash2 className="h-4 w-4" />
                Delete Project
              </>
            )}
          </Button>
        </div>
      }
    >
      <div className="rounded-2xl border border-state-error/20 bg-state-error/5 p-3.5 text-xs">
        <div className="flex items-start gap-2.5">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-state-error" />
          <div className="leading-relaxed text-copy-secondary">
            All architecture canvas graphs, generated specifications, and collaborator links associated with this project will be permanently removed.
          </div>
        </div>
      </div>
    </EditorDialog>
  )
}
