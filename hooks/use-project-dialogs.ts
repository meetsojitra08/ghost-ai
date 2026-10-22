"use client"

import * as React from "react"
import { slugify } from "@/lib/slug"
import { INITIAL_MOCK_PROJECTS, type Project } from "@/types/project"

export type DialogType = "create" | "rename" | "delete" | null

export interface UseProjectDialogsReturn {
  // Dialog state
  activeDialog: DialogType
  isCreateOpen: boolean
  isRenameOpen: boolean
  isDeleteOpen: boolean
  selectedProject: Project | null

  // Form state
  projectName: string
  projectSlug: string
  setProjectName: (name: string) => void

  // Loading state
  isLoading: boolean

  // Mock project lists
  projects: Project[]
  ownedProjects: Project[]
  sharedProjects: Project[]

  // Dialog triggers
  openCreateDialog: () => void
  openRenameDialog: (project: Project) => void
  openDeleteDialog: (project: Project) => void
  closeDialog: () => void

  // Action handlers
  handleCreateProject: (e?: React.FormEvent) => void
  handleRenameProject: (e?: React.FormEvent) => void
  handleDeleteProject: () => void
}

export function useProjectDialogs(
  initialProjects: Project[] = INITIAL_MOCK_PROJECTS
): UseProjectDialogsReturn {
  const [projects, setProjects] = React.useState<Project[]>(initialProjects)
  const [activeDialog, setActiveDialog] = React.useState<DialogType>(null)
  const [selectedProject, setSelectedProject] = React.useState<Project | null>(null)
  const [projectName, setProjectNameState] = React.useState("")
  const [projectSlug, setProjectSlug] = React.useState("")
  const [isLoading, setIsLoading] = React.useState(false)

  // Owned vs Shared projects
  const ownedProjects = React.useMemo(
    () => projects.filter((p) => p.isOwner),
    [projects]
  )
  const sharedProjects = React.useMemo(
    () => projects.filter((p) => !p.isOwner),
    [projects]
  )

  const openCreateDialog = React.useCallback(() => {
    setActiveDialog("create")
    setSelectedProject(null)
    setProjectNameState("")
    setProjectSlug("")
    setIsLoading(false)
  }, [])

  const openRenameDialog = React.useCallback((project: Project) => {
    setActiveDialog("rename")
    setSelectedProject(project)
    setProjectNameState(project.name)
    setProjectSlug(project.slug)
    setIsLoading(false)
  }, [])

  const openDeleteDialog = React.useCallback((project: Project) => {
    setActiveDialog("delete")
    setSelectedProject(project)
    setIsLoading(false)
  }, [])

  const closeDialog = React.useCallback(() => {
    setActiveDialog(null)
    setSelectedProject(null)
    setProjectNameState("")
    setProjectSlug("")
    setIsLoading(false)
  }, [])

  const setProjectName = React.useCallback((name: string) => {
    setProjectNameState(name)
    setProjectSlug(slugify(name))
  }, [])

  const handleCreateProject = React.useCallback(
    (e?: React.FormEvent) => {
      e?.preventDefault()
      const trimmedName = projectName.trim()
      if (!trimmedName) return

      setIsLoading(true)
      const generatedSlug = projectSlug || slugify(trimmedName)
      const newProject: Project = {
        id: `proj-${Date.now()}`,
        name: trimmedName,
        slug: generatedSlug,
        isOwner: true,
        updatedAt: "Just now",
      }

      setProjects((prev) => [newProject, ...prev])
      setIsLoading(false)
      closeDialog()
    },
    [projectName, projectSlug, closeDialog]
  )

  const handleRenameProject = React.useCallback(
    (e?: React.FormEvent) => {
      e?.preventDefault()
      if (!selectedProject) return
      const trimmedName = projectName.trim()
      if (!trimmedName) return

      setIsLoading(true)
      const updatedSlug = slugify(trimmedName)
      setProjects((prev) =>
        prev.map((p) =>
          p.id === selectedProject.id
            ? {
                ...p,
                name: trimmedName,
                slug: updatedSlug,
                updatedAt: "Just now",
              }
            : p
        )
      )
      setIsLoading(false)
      closeDialog()
    },
    [selectedProject, projectName, closeDialog]
  )

  const handleDeleteProject = React.useCallback(() => {
    if (!selectedProject) return

    setIsLoading(true)
    setProjects((prev) => prev.filter((p) => p.id !== selectedProject.id))
    setIsLoading(false)
    closeDialog()
  }, [selectedProject, closeDialog])

  return {
    activeDialog,
    isCreateOpen: activeDialog === "create",
    isRenameOpen: activeDialog === "rename",
    isDeleteOpen: activeDialog === "delete",
    selectedProject,

    projectName,
    projectSlug,
    setProjectName,

    isLoading,

    projects,
    ownedProjects,
    sharedProjects,

    openCreateDialog,
    openRenameDialog,
    openDeleteDialog,
    closeDialog,

    handleCreateProject,
    handleRenameProject,
    handleDeleteProject,
  }
}
