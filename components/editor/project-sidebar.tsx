"use client"

import * as React from "react"
import { Folder, FolderKanban, Pencil, Plus, Trash2, Users, X } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { cn } from "@/lib/utils"
import type { Project } from "@/types/project"

export interface ProjectSidebarProps
  extends React.HTMLAttributes<HTMLElement> {
  isOpen: boolean
  onClose: () => void
  onNewProject?: () => void
  onOpenProject?: (project: Project) => void
  activeProjectId?: string | null
  ownedProjects?: Project[]
  sharedProjects?: Project[]
  onRenameProject?: (project: Project) => void
  onDeleteProject?: (project: Project) => void
}

export function ProjectSidebar({
  isOpen,
  onClose,
  onNewProject,
  onOpenProject,
  activeProjectId,
  ownedProjects = [],
  sharedProjects = [],
  onRenameProject,
  onDeleteProject,
  className,
  ...props
}: ProjectSidebarProps) {
  return (
    <>
      {/* Mobile backdrop scrim */}
      <div
        data-slot="project-sidebar-scrim"
        aria-hidden="true"
        onClick={onClose}
        className={cn(
          "fixed inset-0 z-30 bg-black/60 backdrop-blur-xs transition-opacity duration-300 md:hidden",
          isOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        )}
      />

      <aside
        data-slot="project-sidebar"
        aria-label="Projects sidebar"
        aria-hidden={!isOpen}
        className={cn(
          "fixed left-3 top-16 bottom-3 z-40 flex w-80 max-w-[calc(100vw-1.5rem)] flex-col rounded-2xl border border-surface-border bg-surface/95 shadow-2xl backdrop-blur-md transition-all duration-300 ease-in-out",
          isOpen
            ? "translate-x-0 opacity-100 pointer-events-auto visible"
            : "-translate-x-[calc(100%+4rem)] opacity-0 pointer-events-none invisible",
          className
        )}
        style={{
          transform: isOpen ? "translateX(0)" : "translateX(calc(-100% - 4rem))",
          visibility: isOpen ? "visible" : "hidden",
          transition: "transform 300ms cubic-bezier(0.16, 1, 0.3, 1), opacity 300ms ease, visibility 300ms",
          ...props.style,
        }}
        {...props}
        inert={!isOpen}
      >
        {/* Header with Projects title + close button */}
        <div className="flex h-12 shrink-0 items-center justify-between border-b border-surface-border-subtle px-4">
          <div className="flex items-center gap-2">
            <FolderKanban className="h-4 w-4 text-brand" />
            <h2 className="text-sm font-semibold tracking-tight text-copy-primary">
              Projects
            </h2>
          </div>
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

          {/* My Projects content */}
          <TabsContent
            value="my-projects"
            className={cn(
              "flex min-h-0 flex-1 flex-col outline-none",
              ownedProjects.length === 0
                ? "items-center justify-center p-6 text-center"
                : "pt-2"
            )}
          >
            {ownedProjects.length === 0 ? (
              <>
                <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-accent-dim text-brand">
                  <Folder className="h-6 w-6" />
                </div>
                <p className="text-sm font-medium text-copy-primary">No projects yet</p>
                <p className="mt-1 text-xs text-copy-muted max-w-[210px]">
                  Create your first system design project to start mapping architectures.
                </p>
              </>
            ) : (
              <div className="flex-1 overflow-y-auto space-y-1 pr-0.5">
                {ownedProjects.map((project) => {
                  const isActive = activeProjectId === project.id

                  return (
                    <div
                      key={project.id}
                      className={cn(
                        "group flex items-center justify-between rounded-xl border border-transparent p-1 transition-colors hover:border-surface-border-subtle hover:bg-subtle/70",
                        isActive && "bg-subtle/80 border-surface-border-subtle border-l-2 border-l-brand"
                      )}
                    >
                      {/* Dedicated native Open button */}
                      <button
                        type="button"
                        onClick={() => onOpenProject?.(project)}
                        aria-label={`Open ${project.name}`}
                        className="flex min-w-0 flex-1 items-center gap-2.5 rounded-lg px-2 py-1.5 text-left outline-none transition-colors focus-visible:ring-1 focus-visible:ring-brand"
                      >
                        <Folder
                          className={cn(
                            "h-4 w-4 shrink-0 transition-colors",
                            isActive ? "text-brand" : "text-brand/80 group-hover:text-brand"
                          )}
                        />
                        <div className="min-w-0 flex-1">
                          <p
                            className={cn(
                              "truncate text-sm font-medium transition-colors",
                              isActive ? "text-brand" : "text-copy-primary"
                            )}
                            title={project.name}
                          >
                            {project.name}
                          </p>
                          <p className="truncate font-mono text-xs text-copy-muted">
                            /{project.slug}
                          </p>
                        </div>
                      </button>

                      {/* Sibling Actions: only for owned projects */}
                      <div className="flex shrink-0 items-center gap-1 pr-1 opacity-80 transition-opacity sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon-xs"
                          onClick={() => onRenameProject?.(project)}
                          aria-label={`Rename ${project.name}`}
                          title="Rename project"
                          className="text-copy-muted hover:text-copy-primary hover:bg-subtle"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon-xs"
                          onClick={() => onDeleteProject?.(project)}
                          aria-label={`Delete ${project.name}`}
                          title="Delete project"
                          className="text-copy-muted hover:text-state-error hover:bg-state-error/10"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </TabsContent>

          {/* Shared content: actions explicitly hidden */}
          <TabsContent
            value="shared"
            className={cn(
              "flex min-h-0 flex-1 flex-col outline-none",
              sharedProjects.length === 0
                ? "items-center justify-center p-6 text-center"
                : "pt-2"
            )}
          >
            {sharedProjects.length === 0 ? (
              <>
                <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-subtle text-copy-muted">
                  <Users className="h-6 w-6 text-copy-muted" />
                </div>
                <p className="text-sm font-medium text-copy-primary">
                  No shared projects
                </p>
                <p className="mt-1 text-xs text-copy-muted max-w-[210px]">
                  Projects shared with you by other collaborators will appear here.
                </p>
              </>
            ) : (
              <div className="flex-1 overflow-y-auto space-y-1 pr-0.5">
                {sharedProjects.map((project) => {
                  const isActive = activeProjectId === project.id

                  return (
                    <div
                      key={project.id}
                      className={cn(
                        "group flex items-center justify-between rounded-xl border border-transparent p-1 transition-colors hover:border-surface-border-subtle hover:bg-subtle/70",
                        isActive && "bg-subtle/80 border-surface-border-subtle"
                      )}
                    >
                      <button
                        type="button"
                        onClick={() => onOpenProject?.(project)}
                        aria-label={`Open ${project.name}`}
                        className="flex min-w-0 flex-1 items-center gap-2.5 rounded-lg px-2 py-1.5 text-left outline-none transition-colors focus-visible:ring-1 focus-visible:ring-brand"
                      >
                        <Users
                          className={cn(
                            "h-4 w-4 shrink-0 transition-colors",
                            isActive ? "text-brand" : "text-copy-muted"
                          )}
                        />
                        <div className="min-w-0 flex-1">
                          <p
                            className={cn(
                              "truncate text-sm font-medium transition-colors",
                              isActive ? "text-brand" : "text-copy-primary"
                            )}
                            title={project.name}
                          >
                            {project.name}
                          </p>
                          <p className="truncate font-mono text-xs text-copy-muted">
                            /{project.slug}
                          </p>
                        </div>
                      </button>
                      {/* No actions for shared/collaborator projects per specification */}
                    </div>
                  )
                })}
              </div>
            )}
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
    </>
  )
}
