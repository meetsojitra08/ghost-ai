"use client"

import * as React from "react"
import { ArrowUp, Bot, Sparkles, X } from "lucide-react"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export interface AiSidebarPlaceholderProps
  extends React.HTMLAttributes<HTMLElement> {
  isOpen: boolean
  onClose?: () => void
}

export function AiSidebarPlaceholder({
  isOpen,
  onClose,
  className,
  ...props
}: AiSidebarPlaceholderProps) {
  if (!isOpen) return null

  return (
    <aside
      data-slot="ai-sidebar-placeholder"
      className={cn(
        "relative flex h-full w-80 md:w-88 shrink-0 flex-col border-l border-surface-border-subtle bg-surface text-copy-primary animate-in slide-in-from-right duration-200 z-20",
        className
      )}
      {...props}
    >
      {/* Sidebar Header */}
      <div className="flex h-14 shrink-0 items-center justify-between border-b border-surface-border-subtle px-4">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-accent-ai/10 border border-accent-ai/20 text-accent-ai">
            <Sparkles className="h-4 w-4" />
          </div>
          <div>
            <div className="text-sm font-semibold tracking-tight text-copy-primary">
              AI Assistant
            </div>
          </div>
        </div>

        {onClose ? (
          <Button
            variant="ghost"
            size="icon-xs"
            onClick={onClose}
            aria-label="Close AI sidebar"
            className="text-copy-muted hover:bg-subtle hover:text-copy-primary rounded-lg"
          >
            <X className="h-4 w-4" />
          </Button>
        ) : null}
      </div>

      {/* Main Placeholder Body */}
      <div className="flex flex-1 flex-col items-center justify-center p-6 text-center select-none">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-accent-ai/20 bg-accent-ai/10 text-accent-ai shadow-sm mb-4">
          <Bot className="h-7 w-7" />
        </div>
        <h3 className="text-base font-semibold tracking-tight text-copy-primary">
          AI Architecture Chat
        </h3>
        <p className="mt-2 max-w-[240px] text-xs leading-relaxed text-copy-muted">
          Describe your system in plain English. Ghost AI will generate nodes, edges, and architecture specs directly on your canvas.
        </p>
      </div>

      {/* Mock Chat Input Footer */}
      <div className="border-t border-surface-border-subtle p-3 bg-surface/50">
        <div className="relative rounded-xl border border-surface-border-subtle bg-base/60 p-2 shadow-inner focus-within:border-accent-ai/40">
          <textarea
            disabled
            rows={2}
            placeholder="Ask AI to design architecture..."
            className="w-full resize-none bg-transparent text-xs text-copy-primary placeholder:text-copy-faint focus:outline-none disabled:cursor-not-allowed"
          />
          <div className="flex items-center justify-between pt-1">
            <span className="text-[10px] text-copy-faint">
              Coming in next phase
            </span>
            <Button
              disabled
              size="icon-xs"
              variant="ghost"
              className="h-6 w-6 rounded-lg bg-accent-ai/20 text-accent-ai opacity-50"
            >
              <ArrowUp className="h-3 w-3" />
            </Button>
          </div>
        </div>
      </div>
    </aside>
  )
}
