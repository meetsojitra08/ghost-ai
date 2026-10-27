"use client"

import * as React from "react"
import { FolderKanban, Plus } from "lucide-react"

import { Button } from "@/components/ui/button"
import { useProjectActions } from "@/hooks/use-project-actions"
import { EMPTY_PROJECTS, type Project } from "@/types/project"
import { AiSidebarPlaceholder } from "./ai-sidebar-placeholder"
import { CreateProjectDialog } from "./create-project-dialog"
import { DeleteProjectDialog } from "./delete-project-dialog"
import { EditorNavbar } from "./editor-navbar"
import { ProjectSidebar } from "./project-sidebar"
import { RenameProjectDialog } from "./rename-project-dialog"
import { ShareDialog } from "./share-dialog"

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
  const [isAiSidebarOpen, setIsAiSidebarOpen] = React.useState(true)
  const [isShareOpen, setIsShareOpen] = React.useState(false)

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

  return (
    <div className="relative flex h-screen w-screen flex-col overflow-hidden bg-base text-copy-primary">
      <EditorNavbar
        isSidebarOpen={isSidebarOpen}
        onToggleSidebar={() => setIsSidebarOpen((prev) => !prev)}
        title={currentActiveProject ? currentActiveProject.name : "Ghost AI"}
        showActions={Boolean(currentActiveProject)}
        onShare={handleShare}
        onToggleAiSidebar={() => setIsAiSidebarOpen((prev) => !prev)}
        isAiSidebarOpen={isAiSidebarOpen}
      />

      <div className="relative flex flex-1 overflow-hidden">
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

        {/* Center Canvas area: fills remaining space with dark background */}
        <main
          data-slot="canvas-area"
          className="relative flex flex-1 items-center justify-center overflow-hidden bg-base p-6 select-none"
        >
          {currentActiveProject ? (
            <div
              data-slot="canvas-placeholder"
              className="flex flex-col items-center text-center"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-surface-border bg-surface text-brand shadow-sm">
                <FolderKanban className="h-6 w-6" />
              </div>
              <h1 className="mt-4 text-xl font-semibold tracking-tight text-copy-primary sm:text-2xl">
                {currentActiveProject.name}
              </h1>
              <p className="mt-1 font-mono text-xs text-copy-muted">
                Room: {currentActiveProject.id}
              </p>
              <p className="mt-3 max-w-sm text-sm text-copy-muted">
                Architecture workspace canvas ready. Liveblocks &amp; React Flow canvas integration will follow in the next phase.
              </p>
            </div>
          ) : (
            <div className="flex max-w-md flex-col items-center text-center">
              <h1 className="text-xl font-semibold tracking-tight text-copy-primary sm:text-2xl">
                Create a project or open an existing one
              </h1>
              <p className="mt-2 text-sm text-copy-muted">
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
          )}
        </main>

        {/* Right sidebar placeholder for future AI chat */}
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
    </div>
  )
}

