"use client"

import * as React from "react"
import { Folder, FolderKanban, Plus, Users, X } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { cn } from "@/lib/utils"

export interface ProjectSidebarProps
  extends React.HTMLAttributes<HTMLElement> {
  isOpen: boolean
  onClose?: () => void
  onNewProject?: () => void
}

export function ProjectSidebar({
  isOpen,
  onClose,
  onNewProject,
  className,
  ...props
}: ProjectSidebarProps) {
  return (
    <aside
      data-slot="project-sidebar"
      aria-label="Projects sidebar"
      aria-hidden={!isOpen}
      className={cn(
        "fixed left-3 top-16 bottom-3 z-40 flex w-80 max-w-[calc(100vw-1.5rem)] flex-col rounded-2xl border border-surface-border bg-surface/95 shadow-2xl backdrop-blur-md transition-all duration-300 ease-in-out",
        isOpen
          ? "translate-x-0 opacity-100 pointer-events-auto"
          : "-translate-x-[calc(100%+1.5rem)] opacity-0 pointer-events-none",
        className
      )}
      {...props}
    >
      {/* Header with Projects title + close button */}
      <div className="flex h-12 shrink-0 items-center justify-between border-b border-surface-border-subtle px-4">
        <div className="flex items-center gap-2">
          <FolderKanban className="h-4 w-4 text-brand" />
          <h2 className="text-sm font-semibold tracking-tight text-copy-primary">
            Projects
          </h2>
        </div>
        {onClose && (
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={onClose}
            aria-label="Close sidebar"
            title="Close sidebar"
            className="text-copy-muted hover:text-copy-primary hover:bg-subtle"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Tabs section */}
      <Tabs
        defaultValue="my-projects"
        className="flex min-h-0 flex-1 flex-col overflow-hidden px-3 pt-3"
      >
        <TabsList className="grid w-full grid-cols-2 rounded-xl bg-subtle p-0.5">
          <TabsTrigger
            value="my-projects"
            className="rounded-lg text-xs font-medium"
          >
            My Projects
          </TabsTrigger>
          <TabsTrigger
            value="shared"
            className="rounded-lg text-xs font-medium"
          >
            Shared
          </TabsTrigger>
        </TabsList>

        {/* My Projects empty placeholder state */}
        <TabsContent
          value="my-projects"
          className="flex flex-1 flex-col items-center justify-center p-6 text-center outline-none"
        >
          <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-subtle text-copy-muted">
            <Folder className="h-6 w-6 text-copy-muted" />
          </div>
          <p className="text-sm font-medium text-copy-primary">No projects yet</p>
          <p className="mt-1 text-xs text-copy-muted max-w-[210px]">
            Create your first system design project to start mapping architectures.
          </p>
        </TabsContent>

        {/* Shared empty placeholder state */}
        <TabsContent
          value="shared"
          className="flex flex-1 flex-col items-center justify-center p-6 text-center outline-none"
        >
          <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-subtle text-copy-muted">
            <Users className="h-6 w-6 text-copy-muted" />
          </div>
          <p className="text-sm font-medium text-copy-primary">
            No shared projects
          </p>
          <p className="mt-1 text-xs text-copy-muted max-w-[210px]">
            Projects shared with you by other collaborators will appear here.
          </p>
        </TabsContent>
      </Tabs>

      {/* Footer with full-width New Project button */}
      <div className="shrink-0 border-t border-surface-border-subtle p-3">
        <Button
          className="w-full justify-center gap-2 rounded-xl font-medium"
          onClick={onNewProject}
        >
          <Plus className="h-4 w-4" />
          New Project
        </Button>
      </div>
    </aside>
  )
}
