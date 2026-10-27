"use client"

import * as React from "react"

export interface Collaborator {
  id: string
  email: string
  name: string | null
  imageUrl: string | null
  createdAt: string
}

interface CollaboratorsResponse {
  collaborators?: Collaborator[]
  error?: string
}

interface UseCollaboratorsResult {
  collaborators: Collaborator[]
  isLoading: boolean
  isSubmitting: boolean
  removingEmail: string | null
  error: string | null
  inviteError: string | null
  setError: (message: string | null) => void
  clearInviteError: () => void
  inviteCollaborator: (email: string) => Promise<boolean>
  removeCollaborator: (email: string) => Promise<void>
  reset: () => void
}

export function useCollaborators(
  projectId: string,
  open: boolean
): UseCollaboratorsResult {
  const endpoint = `/api/projects/${encodeURIComponent(projectId)}/collaborators`
  const [collaboratorsState, setCollaboratorsState] = React.useState<{
    endpoint: string
    collaborators: Collaborator[]
  } | null>(null)
  const [completedEndpoint, setCompletedEndpoint] = React.useState<string | null>(null)
  const [errorState, setErrorState] = React.useState<{
    endpoint: string
    message: string
  } | null>(null)
  const [inviteErrorState, setInviteErrorState] = React.useState<{
    endpoint: string
    message: string
  } | null>(null)
  const [submittingEndpoint, setSubmittingEndpoint] = React.useState<string | null>(null)
  const [removingState, setRemovingState] = React.useState<{
    endpoint: string
    email: string
  } | null>(null)
  const requestIdRef = React.useRef(0)

  const collaborators =
    collaboratorsState?.endpoint === endpoint
      ? collaboratorsState.collaborators
      : []
  const isLoading = open && completedEndpoint !== endpoint
  const isSubmitting = submittingEndpoint === endpoint
  const removingEmail =
    removingState?.endpoint === endpoint ? removingState.email : null
  const error = errorState?.endpoint === endpoint ? errorState.message : null
  const inviteError =
    inviteErrorState?.endpoint === endpoint ? inviteErrorState.message : null

  const setError = React.useCallback(
    (message: string | null) => {
      setErrorState(message ? { endpoint, message } : null)
    },
    [endpoint]
  )

  const updateCollaborators = React.useCallback(
    (update: (current: Collaborator[]) => Collaborator[]) => {
      setCollaboratorsState((current) => ({
        endpoint,
        collaborators: update(
          current?.endpoint === endpoint ? current.collaborators : []
        ),
      }))
    },
    [endpoint]
  )

  const reset = React.useCallback(() => {
    setCompletedEndpoint(null)
    setErrorState(null)
    setInviteErrorState(null)
  }, [])

  const clearInviteError = React.useCallback(() => setInviteErrorState(null), [])

  React.useEffect(() => {
    if (!open) return
    const controller = new AbortController()
    const requestId = ++requestIdRef.current

    fetch(endpoint, { signal: controller.signal })
      .then(async (response) => {
        const payload = (await response.json()) as CollaboratorsResponse
        if (!response.ok) {
          throw new Error(payload.error ?? "Could not load collaborators")
        }
        if (controller.signal.aborted || requestId !== requestIdRef.current) return
        setCollaboratorsState({ endpoint, collaborators: payload.collaborators ?? [] })
        setErrorState(null)
      })
      .catch((cause: unknown) => {
        if (controller.signal.aborted || requestId !== requestIdRef.current) return
        setErrorState({
          endpoint,
          message: cause instanceof Error ? cause.message : "Could not load collaborators",
        })
      })
      .finally(() => {
        if (!controller.signal.aborted && requestId === requestIdRef.current) {
          setCompletedEndpoint(endpoint)
        }
      })

    return () => {
      controller.abort()
      if (requestIdRef.current === requestId) requestIdRef.current += 1
    }
  }, [endpoint, open])

  const inviteCollaborator = React.useCallback(
    async (email: string) => {
      if (submittingEndpoint === endpoint) return false
      setSubmittingEndpoint(endpoint)
      clearInviteError()
      try {
        const response = await fetch(endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email }),
        })
        const payload = (await response.json()) as {
          collaborator?: Collaborator
          error?: string
        }
        if (!response.ok) {
          throw new Error(payload.error ?? "Could not invite collaborator")
        }
        if (payload.collaborator) {
          updateCollaborators((current) => [...current, payload.collaborator!])
        }
        return true
      } catch (cause) {
        setInviteErrorState({
          endpoint,
          message: cause instanceof Error ? cause.message : "Could not invite collaborator",
        })
        return false
      } finally {
        setSubmittingEndpoint((current) => current === endpoint ? null : current)
      }
    },
    [clearInviteError, endpoint, submittingEndpoint, updateCollaborators]
  )

  const removeCollaborator = React.useCallback(
    async (email: string) => {
      setRemovingState({ endpoint, email })
      setError(null)
      try {
        const response = await fetch(endpoint, {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email }),
        })
        const payload = (await response.json()) as { error?: string }
        if (!response.ok) {
          throw new Error(payload.error ?? "Could not remove collaborator")
        }
        updateCollaborators((current) => current.filter((item) => item.email !== email))
      } catch (cause) {
        setError(cause instanceof Error ? cause.message : "Could not remove collaborator")
      } finally {
        setRemovingState((current) =>
          current?.endpoint === endpoint && current.email === email ? null : current
        )
      }
    },
    [endpoint, setError, updateCollaborators]
  )

  return {
    collaborators,
    isLoading,
    isSubmitting,
    removingEmail,
    error,
    inviteError,
    setError,
    clearInviteError,
    inviteCollaborator,
    removeCollaborator,
    reset,
  }
}
