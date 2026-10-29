"use client"

import * as React from "react"
import { PanelLeftClose, PanelLeftOpen, Share2, Sparkles } from "lucide-react"
import { UserButton } from "@clerk/nextjs"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export interface EditorNavbarProps
  extends Omit<React.HTMLAttributes<HTMLElement>, "title"> {
  isSidebarOpen: boolean
  onToggleSidebar: () => void
  title?: React.ReactNode
  centerContent?: React.ReactNode
  rightContent?: React.ReactNode
  onShare?: () => void
  onToggleAiSidebar?: () => void
  isAiSidebarOpen?: boolean
  showActions?: boolean
}

export function EditorNavbar({
  isSidebarOpen,
  onToggleSidebar,
  title,
  centerContent,
  rightContent,
  onShare,
  onToggleAiSidebar,
  isAiSidebarOpen,
  showActions = false,
  className,
  ...props
}: EditorNavbarProps) {
  const hasShareAction = showActions && typeof onShare === "function"
  const hasAiAction = showActions && typeof onToggleAiSidebar === "function"

  return (
    <header
      data-slot="editor-navbar"
      className={cn(
        "sticky top-0 z-30 grid h-14 w-full shrink-0 grid-cols-3 items-center border-b border-surface-border-subtle bg-surface px-4 text-copy-primary",
        className
      )}
      {...props}
    >
      {/* Left section: sidebar toggle button, logo mark, and optional title */}
      <div className="flex items-center gap-2 min-w-0">
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={onToggleSidebar}
          aria-label={isSidebarOpen ? "Close sidebar" : "Open sidebar"}
          title={isSidebarOpen ? "Close sidebar" : "Open sidebar"}
          className="text-copy-muted hover:text-copy-primary hover:bg-subtle shrink-0"
        >
          {isSidebarOpen ? (
            <PanelLeftClose className="h-4 w-4" />
          ) : (
            <PanelLeftOpen className="h-4 w-4" />
          )}
        </Button>
        {/* Ghost AI logo mark */}
        <div className="h-5 w-5 shrink-0 rounded-md bg-brand" aria-hidden="true" />
        {title ? (
          <div className="truncate text-sm font-semibold tracking-tight text-copy-primary">
            {title}
          </div>
        ) : (
          <span className="text-sm font-semibold tracking-tight text-copy-primary">
            Ghost AI
          </span>
        )}
      </div>

      {/* Center section */}
      <div className="flex items-center justify-center">
        {centerContent ?? null}
      </div>

      {/* Right section: navbar actions (share, AI toggle) and user profile */}
      <div className="flex items-center justify-end gap-2 sm:gap-3">
        {rightContent ?? null}

        {hasShareAction ? (
          <Button
            variant="outline"
            size="sm"
            onClick={onShare}
            data-slot="share-button"
            aria-label="Share project"
            className="h-8 gap-1.5 rounded-xl border-surface-border bg-surface px-3 text-xs font-medium text-copy-primary hover:bg-subtle hover:text-copy-primary"
          >
            <Share2 className="h-3.5 w-3.5 text-copy-muted" />
            <span className="hidden sm:inline">Share</span>
          </Button>
        ) : null}

        {hasAiAction ? (
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={onToggleAiSidebar}
            data-slot="ai-sidebar-toggle"
            aria-label={isAiSidebarOpen ? "Close AI assistant" : "Open AI assistant"}
            title={isAiSidebarOpen ? "Close AI assistant" : "Open AI assistant"}
            className={cn(
              "h-8 w-8 rounded-xl text-copy-muted hover:bg-subtle hover:text-copy-primary",
              isAiSidebarOpen && "bg-subtle text-accent-ai hover:text-accent-ai"
            )}
          >
            <Sparkles
              className={cn(
                "h-4 w-4",
                isAiSidebarOpen ? "text-accent-ai" : "text-copy-muted"
              )}
            />
          </Button>
        ) : null}

        <UserButton />
      </div>
    </header>
  )
}

