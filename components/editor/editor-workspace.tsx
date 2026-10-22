"use client"

import * as React from "react"
import { Plus } from "lucide-react"

import { Button } from "@/components/ui/button"
import { useProjectDialogs } from "@/hooks/use-project-dialogs"
import { CreateProjectDialog } from "./create-project-dialog"
import { DeleteProjectDialog } from "./delete-project-dialog"
import { EditorNavbar } from "./editor-navbar"
import { ProjectSidebar } from "./project-sidebar"
import { RenameProjectDialog } from "./rename-project-dialog"

export function EditorWorkspace() {
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(false)

  const {
    isCreateOpen,
    isRenameOpen,
    isDeleteOpen,
    selectedProject,
    projectName,
    projectSlug,
    setProjectName,
    isLoading,
    ownedProjects,
    sharedProjects,
    openCreateDialog,
    openRenameDialog,
    openDeleteDialog,
    closeDialog,
    handleCreateProject,
    handleRenameProject,
    handleDeleteProject,
  } = useProjectDialogs()

  return (
    <div className="relative flex h-screen w-screen flex-col overflow-hidden bg-base text-copy-primary">
      <EditorNavbar
        isSidebarOpen={isSidebarOpen}
        onToggleSidebar={() => setIsSidebarOpen((prev) => !prev)}
        title="Ghost AI"
      />

      <div className="relative flex flex-1 overflow-hidden">
        {/* Floating project sidebar */}
        <ProjectSidebar
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
          onNewProject={openCreateDialog}
          ownedProjects={ownedProjects}
          sharedProjects={sharedProjects}
          onRenameProject={openRenameDialog}
          onDeleteProject={openDeleteDialog}
        />

        {/* Center Canvas area: Editor Home */}
        <main className="relative flex flex-1 items-center justify-center bg-base p-6">
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
        </main>
      </div>

      {/* Project Dialogs */}
      <CreateProjectDialog
        open={isCreateOpen}
        onClose={closeDialog}
        name={projectName}
        slug={projectSlug}
        onChangeName={setProjectName}
        onSubmit={handleCreateProject}
        isLoading={isLoading}
      />

      <RenameProjectDialog
        open={isRenameOpen}
        onClose={closeDialog}
        project={selectedProject}
        name={projectName}
        onChangeName={setProjectName}
        onSubmit={handleRenameProject}
        isLoading={isLoading}
      />

      <DeleteProjectDialog
        open={isDeleteOpen}
        onClose={closeDialog}
        project={selectedProject}
        onConfirm={handleDeleteProject}
        isLoading={isLoading}
      />
    </div>
  )
}
