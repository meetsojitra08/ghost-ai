"use client"

import * as React from "react"
import { PanelLeftClose, PanelLeftOpen } from "lucide-react"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export interface EditorNavbarProps
  extends Omit<React.HTMLAttributes<HTMLElement>, "title"> {
  isSidebarOpen: boolean
  onToggleSidebar: () => void
  title?: React.ReactNode
  centerContent?: React.ReactNode
}

export function EditorNavbar({
  isSidebarOpen,
  onToggleSidebar,
  title,
  centerContent,
  className,
  ...props
}: EditorNavbarProps) {
  return (
    <header
      data-slot="editor-navbar"
      className={cn(
        "sticky top-0 z-30 grid h-14 w-full shrink-0 grid-cols-3 items-center border-b border-surface-border-subtle bg-surface px-4 text-copy-primary",
        className
      )}
      {...props}
    >
      {/* Left section: sidebar toggle button and optional title */}
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={onToggleSidebar}
          aria-label={isSidebarOpen ? "Close sidebar" : "Open sidebar"}
          title={isSidebarOpen ? "Close sidebar" : "Open sidebar"}
          className="text-copy-muted hover:text-copy-primary hover:bg-subtle"
        >
          {isSidebarOpen ? (
            <PanelLeftClose className="h-4 w-4" />
          ) : (
            <PanelLeftOpen className="h-4 w-4" />
          )}
        </Button>
        {title ? (
          <div className="text-sm font-semibold tracking-tight text-copy-primary">
            {title}
          </div>
        ) : null}
      </div>

      {/* Center section */}
      <div className="flex items-center justify-center">
        {centerContent ?? null}
      </div>

      {/* Right section: stays empty for now */}
      <div className="flex items-center justify-end" />
    </header>
  )
}
