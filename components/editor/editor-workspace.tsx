"use client"

import * as React from "react"
import { FolderKanban, Plus } from "lucide-react"

import { Button } from "@/components/ui/button"
import { useProjectActions } from "@/hooks/use-project-actions"
import { CanvasRoomWrapper } from "@/components/canvas"
import { EMPTY_PROJECTS, type Project } from "@/types/project"
import { AiSidebarPlaceholder } from "./ai-sidebar-placeholder"
import { CreateProjectDialog } from "./create-project-dialog"
import { DeleteProjectDialog } from "./delete-project-dialog"
import { EditorNavbar } from "./editor-navbar"
import { ProjectSidebar } from "./project-sidebar"
import { RenameProjectDialog } from "./rename-project-dialog"
import { ShareDialog } from "./share-dialog"
import {
  StarterTemplatesModal,
} from "./starter-templates-modal"
import type { CanvasTemplate } from "./starter-templates"
import type { CanvasTemplateImportRequest } from "@/components/canvas/editor-canvas"

export interface EditorWorkspaceProps {
  initialOwnedProjects?: Project[]
  initialSharedProjects?: Project[]
  activeProject?: Project | null
}

export function EditorWorkspace({
  initialOwnedProjects = EMPTY_PROJECTS,
  initialSharedProjects = EMPTY_PROJECTS,
  activeProject = null,
}: EditorWorkspaceProps) {
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(false)
  const [isAiSidebarOpen, setIsAiSidebarOpen] = React.useState(false)
  const [isShareOpen, setIsShareOpen] = React.useState(false)
  const [isTemplatesOpen, setIsTemplatesOpen] = React.useState(false)
  const [templateImport, setTemplateImport] =
    React.useState<CanvasTemplateImportRequest | null>(null)
  const templateImportId = React.useRef(0)

  const {
    isCreateOpen,
    isRenameOpen,
    isDeleteOpen,
    selectedProject,
    activeProject: currentActiveProject,
    handleOpenProject,
    projectName,
    roomId,
    setProjectName,
    isLoading,
    error,
    ownedProjects,
    sharedProjects,
    openCreateDialog,
    openRenameDialog,
    openDeleteDialog,
    closeDialog,
    handleCreateProject,
    handleRenameProject,
    handleDeleteProject,
  } = useProjectActions({
    initialOwnedProjects,
    initialSharedProjects,
    activeProject,
  })

  const onSelectProject = React.useCallback(
    (project: Project) => {
      handleOpenProject(project)
      if (typeof window !== "undefined" && window.innerWidth < 768) {
        setIsSidebarOpen(false)
      }
    },
    [handleOpenProject]
  )

  const handleShare = React.useCallback(() => setIsShareOpen(true), [])
  const handleImportTemplate = React.useCallback((template: CanvasTemplate) => {
    templateImportId.current += 1
    setTemplateImport({ id: templateImportId.current, template })
  }, [])
  const handleTemplateImported = React.useCallback((requestId: number) => {
    setTemplateImport((current) =>
      current?.id === requestId ? null : current
    )
  }, [])

  return (
    <div className="relative flex h-screen w-screen flex-col overflow-hidden bg-base text-copy-primary">
      <EditorNavbar
        isSidebarOpen={isSidebarOpen}
        onToggleSidebar={() => setIsSidebarOpen((prev) => !prev)}
        title={currentActiveProject ? currentActiveProject.name : "Ghost AI"}
        showActions={Boolean(currentActiveProject)}
        onShare={handleShare}
        onOpenTemplates={() => setIsTemplatesOpen(true)}
        onToggleAiSidebar={() => setIsAiSidebarOpen((prev) => !prev)}
        isAiSidebarOpen={isAiSidebarOpen}
      />

      <div className="relative flex-1 h-[calc(100vh-3.5rem)] w-full overflow-hidden">
        {/* Floating project sidebar */}
        <ProjectSidebar
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
          onNewProject={openCreateDialog}
          onOpenProject={onSelectProject}
          activeProjectId={currentActiveProject?.id}
          ownedProjects={ownedProjects}
          sharedProjects={sharedProjects}
          onRenameProject={openRenameDialog}
          onDeleteProject={openDeleteDialog}
        />

        {/* Center Canvas area: fills 100% of the viewport underneath both floating sidebars */}
        <main
          data-slot="canvas-area"
          className="relative h-full w-full overflow-hidden bg-base"
          style={{
            background: "var(--bg-base)",
          }}
          onDragOver={(e) => {
            e.preventDefault();
            e.dataTransfer.dropEffect = "move";
          }}
        >
          {currentActiveProject ? (
            <CanvasRoomWrapper
              key={currentActiveProject.id}
              roomId={currentActiveProject.id}
              templateImport={templateImport}
              onTemplateImported={handleTemplateImported}
            />
          ) : (
            <div className="relative flex h-full w-full items-center justify-center select-none">
              {/* Dot-grid canvas background filling the full viewport naturally */}
              <svg
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 h-full w-full opacity-40"
                xmlns="http://www.w3.org/2000/svg"
              >
                <defs>
                  <pattern
                    id="canvas-dot-grid"
                    x="0"
                    y="0"
                    width="24"
                    height="24"
                    patternUnits="userSpaceOnUse"
                  >
                    <circle cx="1" cy="1" r="1" fill="var(--border-subtle, #3a3a42)" />
                  </pattern>
                </defs>
                <rect width="100%" height="100%" fill="url(#canvas-dot-grid)" />
              </svg>

              <div className="relative flex max-w-md flex-col items-center text-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-surface-border bg-surface text-copy-muted shadow-sm">
                  <FolderKanban className="h-7 w-7" />
                </div>
                <h1 className="mt-4 text-xl font-semibold tracking-tight text-copy-primary sm:text-2xl">
                  Create a project or open an existing one
                </h1>
                <p className="mt-2 max-w-sm text-sm text-copy-muted">
                  Start a new architecture workspace, or choose a project from the sidebar.
                </p>
                <Button
                  onClick={openCreateDialog}
                  className="mt-6 gap-2 rounded-xl font-medium"
                  size="default"
                >
                  <Plus className="h-4 w-4" />
                  New Project
                </Button>
              </div>
            </div>
          )}
        </main>

        {/* Right floating sidebar for future AI chat */}
        {currentActiveProject ? (
          <AiSidebarPlaceholder
            isOpen={isAiSidebarOpen}
            onClose={() => setIsAiSidebarOpen(false)}
          />
        ) : null}
      </div>

      {/* Project Dialogs */}
      <CreateProjectDialog
        open={isCreateOpen}
        onClose={closeDialog}
        name={projectName}
        slug={roomId}
        roomId={roomId}
        onChangeName={setProjectName}
        onSubmit={handleCreateProject}
        isLoading={isLoading}
        error={error}
      />

      <RenameProjectDialog
        open={isRenameOpen}
        onClose={closeDialog}
        project={selectedProject}
        name={projectName}
        onChangeName={setProjectName}
        onSubmit={handleRenameProject}
        isLoading={isLoading}
        error={error}
      />

      <DeleteProjectDialog
        open={isDeleteOpen}
        onClose={closeDialog}
        project={selectedProject}
        onConfirm={handleDeleteProject}
        isLoading={isLoading}
        error={error}
      />

      {currentActiveProject ? (
        <ShareDialog
          open={isShareOpen}
          onOpenChange={setIsShareOpen}
          projectId={currentActiveProject.id}
          projectName={currentActiveProject.name}
          isOwner={currentActiveProject.isOwner}
        />
      ) : null}

      <StarterTemplatesModal
        open={isTemplatesOpen}
        onOpenChange={setIsTemplatesOpen}
        onImport={handleImportTemplate}
      />
    </div>
  )
}

