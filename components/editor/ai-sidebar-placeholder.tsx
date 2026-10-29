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
  return (
    <aside
      data-slot="ai-sidebar-placeholder"
      aria-label="AI Assistant sidebar"
      aria-hidden={!isOpen}
      className={cn(
        "fixed right-3 top-16 bottom-3 z-40 flex w-80 max-w-[calc(100vw-1.5rem)] sm:w-[22rem] flex-col rounded-2xl border border-surface-border bg-surface/95 shadow-2xl backdrop-blur-md transition-all duration-300 ease-in-out text-copy-primary",
        isOpen
          ? "translate-x-0 opacity-100 pointer-events-auto visible"
          : "translate-x-[calc(100%+4rem)] opacity-0 pointer-events-none invisible",
        className
      )}
      style={{
        transform: isOpen ? "translateX(0)" : "translateX(calc(100% + 4rem))",
        visibility: isOpen ? "visible" : "hidden",
        transition: "transform 300ms cubic-bezier(0.16, 1, 0.3, 1), opacity 300ms ease, visibility 300ms",
        ...props.style,
      }}
      {...props}
      inert={!isOpen}
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
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-accent-ai/20 bg-accent-ai/10 text-accent-ai shadow-sm shadow-accent-ai/10 mb-4">
          <Bot className="h-7 w-7" />
        </div>
        <h3 className="text-base font-semibold tracking-tight text-copy-primary">
          AI Architecture Chat
        </h3>
        <p className="mt-2 max-w-[240px] text-xs leading-relaxed text-copy-muted">
          Describe your system in plain English. Ghost AI will generate nodes, edges, and architecture specs directly on your canvas.
        </p>

        {/* Feature hint list */}
        <div className="mt-6 w-full space-y-2 text-left">
          {[
            "Generate system designs from prompts",
            "Add nodes and connections with AI",
            "Export technical specs instantly",
          ].map((hint) => (
            <div
              key={hint}
              className="flex items-center gap-2.5 rounded-xl border border-surface-border-subtle bg-subtle/40 px-3 py-2"
            >
              <Sparkles className="h-3 w-3 shrink-0 text-accent-ai-text" />
              <span className="text-xs text-copy-secondary">{hint}</span>
            </div>
          ))}
        </div>
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
            <span className="inline-flex items-center gap-1 rounded-md border border-accent-ai/20 bg-accent-ai/5 px-1.5 py-0.5 text-[10px] text-accent-ai-text">
              <Sparkles className="h-2.5 w-2.5" />
              Early Access
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
