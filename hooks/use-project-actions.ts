"use client"

import * as React from "react"
import { usePathname, useRouter } from "next/navigation"
import { slugify } from "@/lib/slug"
import { EMPTY_PROJECTS, type Project } from "@/types/project"

export type DialogType = "create" | "rename" | "delete" | null

export interface UseProjectActionsOptions {
  initialOwnedProjects?: Project[]
  initialSharedProjects?: Project[]
  activeProject?: Project | null
}

export interface UseProjectActionsReturn {
  // Dialog visibility state
  activeDialog: DialogType
  isCreateOpen: boolean
  isRenameOpen: boolean
  isDeleteOpen: boolean
  selectedProject: Project | null

  // Active workspace state
  activeProject: Project | null
  handleOpenProject: (project: Project) => void

  // Form & Room ID state
  projectName: string
  setProjectName: (name: string) => void
  roomId: string
  roomSuffix: string

  // Operation state
  isLoading: boolean
  error: string | null

  // Project lists
  ownedProjects: Project[]
  sharedProjects: Project[]

  // Dialog openers & closers
  openCreateDialog: () => void
  openRenameDialog: (project: Project) => void
  openDeleteDialog: (project: Project) => void
  closeDialog: () => void

  // Action handlers
  handleCreateProject: (e?: React.FormEvent) => Promise<void>
  handleRenameProject: (e?: React.FormEvent) => Promise<void>
  handleDeleteProject: () => Promise<void>
}

/**
 * Generates a short 4-character alphanumeric suffix.
 */
function generateShortSuffix(): string {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789"
  let suffix = ""
  for (let i = 0; i < 4; i++) {
    suffix += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return suffix
}

export function useProjectActions({
  initialOwnedProjects = EMPTY_PROJECTS,
  initialSharedProjects = EMPTY_PROJECTS,
  activeProject: initialActiveProject = null,
}: UseProjectActionsOptions = {}): UseProjectActionsReturn {
  const router = useRouter()
  const pathname = usePathname()

  const [prevOwned, setPrevOwned] =
    React.useState<Project[]>(initialOwnedProjects)
  const [ownedProjects, setOwnedProjects] =
    React.useState<Project[]>(initialOwnedProjects)
  if (prevOwned !== initialOwnedProjects) {
    setPrevOwned(initialOwnedProjects)
    setOwnedProjects(initialOwnedProjects)
  }

  const [prevShared, setPrevShared] =
    React.useState<Project[]>(initialSharedProjects)
  const [sharedProjects, setSharedProjects] =
    React.useState<Project[]>(initialSharedProjects)
  if (prevShared !== initialSharedProjects) {
    setPrevShared(initialSharedProjects)
    setSharedProjects(initialSharedProjects)
  }

  const [prevActive, setPrevActive] =
    React.useState<Project | null>(initialActiveProject)
  const [activeProject, setActiveProject] =
    React.useState<Project | null>(initialActiveProject)
  if (prevActive !== initialActiveProject) {
    setPrevActive(initialActiveProject)
    setActiveProject(initialActiveProject)
  }

  // Dialog & form state
  const [activeDialog, setActiveDialog] = React.useState<DialogType>(null)
  const [selectedProject, setSelectedProject] = React.useState<Project | null>(null)
  const [projectName, setProjectNameState] = React.useState("")
  const [roomSuffix, setRoomSuffix] = React.useState("")
  const [isLoading, setIsLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  // Live room ID derived from project name slug and unique suffix
  const roomId = React.useMemo(() => {
    const trimmed = projectName.trim()
    const baseSlug = slugify(trimmed)
    const suffix = roomSuffix || "new"
    return baseSlug ? `${baseSlug}-${suffix}` : `project-${suffix}`
  }, [projectName, roomSuffix])

  const setProjectName = React.useCallback((name: string) => {
    setProjectNameState(name)
  }, [])

  const openCreateDialog = React.useCallback(() => {
    setRoomSuffix(generateShortSuffix())
    setProjectNameState("")
    setSelectedProject(null)
    setActiveDialog("create")
    setError(null)
    setIsLoading(false)
  }, [])

  const openRenameDialog = React.useCallback((project: Project) => {
    setActiveDialog("rename")
    setSelectedProject(project)
    setProjectNameState(project.name)
    setError(null)
    setIsLoading(false)
  }, [])

  const openDeleteDialog = React.useCallback((project: Project) => {
    setActiveDialog("delete")
    setSelectedProject(project)
    setError(null)
    setIsLoading(false)
  }, [])

  const closeDialog = React.useCallback(() => {
    setActiveDialog(null)
    setSelectedProject(null)
    setProjectNameState("")
    setRoomSuffix("")
    setError(null)
    setIsLoading(false)
  }, [])

  const handleOpenProject = React.useCallback(
    (project: Project) => {
      router.push(`/editor/${project.id}`)
    },
    [router]
  )

  const handleCreateProject = React.useCallback(
    async (e?: React.FormEvent) => {
      e?.preventDefault()
      const trimmedName = projectName.trim()
      if (!trimmedName || isLoading) return

      setIsLoading(true)
      setError(null)

      try {
        const response = await fetch("/api/projects", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            id: roomId,
            name: trimmedName,
          }),
        })

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}))
          throw new Error(errorData.error || "Failed to create project")
        }

        const created = await response.json()
        closeDialog()
        router.push(`/editor/${created.id}`)
        router.refresh()
      } catch (err: unknown) {
        console.error("Failed to create project:", err)
        setError(err instanceof Error ? err.message : "Failed to create project")
      } finally {
        setIsLoading(false)
      }
    },
    [projectName, roomId, isLoading, closeDialog, router]
  )

  const handleRenameProject = React.useCallback(
    async (e?: React.FormEvent) => {
      e?.preventDefault()
      if (!selectedProject || isLoading) return
      const trimmedName = projectName.trim()
      if (!trimmedName) return

      setIsLoading(true)
      setError(null)

      try {
        const response = await fetch(`/api/projects/${selectedProject.id}`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: trimmedName,
          }),
        })

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}))
          throw new Error(errorData.error || "Failed to rename project")
        }

        // Optimistically update project name in list
        setOwnedProjects((prev) =>
          prev.map((p) =>
            p.id === selectedProject.id ? { ...p, name: trimmedName } : p
          )
        )

        closeDialog()
        router.refresh()
      } catch (err: unknown) {
        console.error("Failed to rename project:", err)
        setError(err instanceof Error ? err.message : "Failed to rename project")
      } finally {
        setIsLoading(false)
      }
    },
    [selectedProject, projectName, isLoading, closeDialog, router]
  )

  const handleDeleteProject = React.useCallback(async () => {
    if (!selectedProject || isLoading) return

    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/projects/${selectedProject.id}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || "Failed to delete project")
      }

      const isDeletingActive =
        activeProject?.id === selectedProject.id ||
        pathname === `/editor/${selectedProject.id}`

      // Optimistically remove project from list
      setOwnedProjects((prev) =>
        prev.filter((p) => p.id !== selectedProject.id)
      )

      closeDialog()

      if (isDeletingActive) {
        router.push("/editor")
      } else {
        router.refresh()
      }
    } catch (err: unknown) {
      console.error("Failed to delete project:", err)
      setError(err instanceof Error ? err.message : "Failed to delete project")
    } finally {
      setIsLoading(false)
    }
  }, [selectedProject, activeProject, pathname, isLoading, closeDialog, router])

  return {
    activeDialog,
    isCreateOpen: activeDialog === "create",
    isRenameOpen: activeDialog === "rename",
    isDeleteOpen: activeDialog === "delete",
    selectedProject,

    activeProject,
    handleOpenProject,

    projectName,
    setProjectName,
    roomId,
    roomSuffix,

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
  }
}
