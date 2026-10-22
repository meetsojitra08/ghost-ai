"use client"

import * as React from "react"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogOverlay,
  DialogPortal,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { cn } from "@/lib/utils"

export interface EditorDialogBaseProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  icon?: React.ReactNode
  description?: React.ReactNode
  children?: React.ReactNode
  footer?: React.ReactNode
  className?: string
  showCloseButton?: boolean
}

type DialogWithTitle = EditorDialogBaseProps & {
  title: NonNullable<React.ReactNode>
  "aria-label"?: string
  ariaLabel?: string
}

type DialogWithoutTitleKebab = EditorDialogBaseProps & {
  title?: null | undefined | boolean
  "aria-label": string
  ariaLabel?: string
}

type DialogWithoutTitleCamel = EditorDialogBaseProps & {
  title?: null | undefined | boolean
  "aria-label"?: string
  ariaLabel: string
}

export type EditorDialogProps =
  | DialogWithTitle
  | DialogWithoutTitleKebab
  | DialogWithoutTitleCamel

/**
 * Standard Dialog Pattern for the Ghost AI editor chrome.
 * Uses existing color tokens from `globals.css` with dark elevated surface,
 * subtle border, rounded-3xl geometry, and structured support for:
 * - icon
 * - title
 * - description
 * - footer actions
 */
export function EditorDialog({
  open,
  onOpenChange,
  icon,
  title,
  description,
  children,
  footer,
  className,
  showCloseButton = true,
  "aria-label": ariaLabelProp,
  ariaLabel,
}: EditorDialogProps) {
  const accessibleLabel = ariaLabelProp ?? ariaLabel

  const hasMeaningfulTitle =
    title != null &&
    typeof title !== "boolean" &&
    (typeof title !== "string" || title.trim().length > 0)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={showCloseButton}
        aria-label={hasMeaningfulTitle ? undefined : accessibleLabel}
        className={cn(
          "rounded-3xl border border-surface-border bg-elevated p-6 text-copy-primary shadow-2xl backdrop-blur-md sm:max-w-md",
          className
        )}
      >
        {(hasMeaningfulTitle || description || icon) && (
          <DialogHeader className="gap-3">
            {icon ? <div>{icon}</div> : null}
            <div className="space-y-1">
              {hasMeaningfulTitle ? (
                <DialogTitle className="text-base font-semibold tracking-tight text-copy-primary">
                  {title}
                </DialogTitle>
              ) : null}
              {description ? (
                <DialogDescription className="text-sm text-copy-muted">
                  {description}
                </DialogDescription>
              ) : null}
            </div>
          </DialogHeader>
        )}
        {children ? <div className="py-1">{children}</div> : null}
        {footer ? (
          <DialogFooter className="-mx-6 -mb-6 mt-2 rounded-b-3xl border-t border-surface-border-subtle bg-subtle/50 px-6 py-3.5 sm:justify-end">
            {footer}
          </DialogFooter>
        ) : null}
      </DialogContent>
    </Dialog>
  )
}

export {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogOverlay,
  DialogPortal,
  DialogTitle,
  DialogTrigger,
}
