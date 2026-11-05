"use client"

import * as React from "react"
import { AlertCircle, ArrowUp, Bot, Download, FileText, Loader2, Sparkles, X } from "lucide-react"
import { useUser } from "@clerk/nextjs"
import {
  useCreateFeed,
  useCreateFeedMessage,
  useEventListener,
  useFeedMessages,
  useFeeds,
  useOthers,
  useRoom,
  useSelf,
} from "@liveblocks/react"

import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"
import {
  AI_CHAT_FEED_ID,
  AI_STATUS_FEED_ID,
  formatMessageTime,
  getSenderInfo,
  isTaskStatusActive,
  validateChatMessage,
  validateTaskFeedMessage,
  type ChatMessagePayload,
  type TaskFeedPayload,
} from "@/types/tasks"

const starterPrompts = [
  "Design an e-commerce backend",
  "Create a chat app architecture",
  "Build a CI/CD pipeline",
]

export interface AiSidebarProps extends React.HTMLAttributes<HTMLElement> {
  isOpen: boolean
  onClose?: () => void
  roomId?: string
  projectId?: string
}

function getValidatedChatMessages(
  messages: Array<{ id: string; createdAt: number; data: unknown }> | undefined
): Array<{ id: string; createdAt: number; data: ChatMessagePayload }> {
  if (!messages || messages.length === 0) return []
  const sorted = [...messages].sort((a, b) => a.createdAt - b.createdAt)
  const result: Array<{ id: string; createdAt: number; data: ChatMessagePayload }> = []
  for (const msg of sorted) {
    const validated = validateChatMessage(msg.data)
    if (validated) {
      result.push({
        id: msg.id,
        createdAt: msg.createdAt,
        data: validated,
      })
    }
  }
  return result
}

function getLatestStatusMessage(
  messages: Array<{ data: unknown; createdAt: number }> | undefined
): TaskFeedPayload | null {
  if (!messages || messages.length === 0) return null
  const sorted = [...messages].sort((a, b) => b.createdAt - a.createdAt)
  for (const msg of sorted) {
    const validated = validateTaskFeedMessage(msg.data)
    if (validated) return validated
  }
  return null
}

function AiSidebarConnected({
  isOpen,
  onClose,
  className,
  style,
  ...props
}: AiSidebarProps) {
  const { user } = useUser()
  const self = useSelf()

  const [prompt, setPrompt] = React.useState("")
  const [isSending, setIsSending] = React.useState(false)
  const [sendError, setSendError] = React.useState<string | null>(null)
  const textareaRef = React.useRef<HTMLTextAreaElement>(null)
  const chatScrollRef = React.useRef<HTMLDivElement>(null)

  // 1. Feeds & Messages
  const { messages: rawChatMessages } = useFeedMessages(AI_CHAT_FEED_ID)
  const { messages: rawStatusMessages } = useFeedMessages(AI_STATUS_FEED_ID)
  const { feeds } = useFeeds()
  const createFeed = useCreateFeed()
  const createFeedMessage = useCreateFeedMessage()

  // 2. Ensure both ai-chat and ai-status-feed exist in the active room
  React.useEffect(() => {
    if (feeds) {
      if (!feeds.some((f) => f.feedId === AI_CHAT_FEED_ID)) {
        createFeed(AI_CHAT_FEED_ID, { metadata: { name: "AI Chat" } }).catch(() => {})
      }
      if (!feeds.some((f) => f.feedId === AI_STATUS_FEED_ID)) {
        createFeed(AI_STATUS_FEED_ID, { metadata: { name: "AI Status Feed" } }).catch(() => {})
      }
    }
  }, [feeds, createFeed])

  // 3. Process chat messages
  const chatMessages = getValidatedChatMessages(rawChatMessages)

  // 4. Track status & thinking state
  const latestFeedStatus = getLatestStatusMessage(rawStatusMessages)
  const [broadcastStatus, setBroadcastStatus] = React.useState<TaskFeedPayload | null>(null)

  useEventListener(({ event }) => {
    if (event && event.type === "ai-status") {
      const validated = validateTaskFeedMessage(event)
      if (validated) {
        setBroadcastStatus(validated)
      }
    }
  })

  const isAnyoneThinking = useOthers((others) =>
    others.some((other) => Boolean(other.presence?.thinking))
  )

  const isFeedActive =
    isTaskStatusActive(latestFeedStatus?.status) ||
    isTaskStatusActive(broadcastStatus?.status)
  const isAiWorking = Boolean(isAnyoneThinking || isFeedActive)

  const latestStatusText =
    latestFeedStatus?.text ||
    latestFeedStatus?.message ||
    broadcastStatus?.text ||
    broadcastStatus?.message ||
    (isAnyoneThinking ? "Ghost AI is thinking..." : "AI generation in progress...")

  // Auto-scroll chat to bottom when messages update
  React.useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight
    }
  }, [chatMessages.length])

  // Resize prompt textarea
  React.useLayoutEffect(() => {
    const textarea = textareaRef.current
    if (!textarea) return

    textarea.style.height = "72px"
    textarea.style.height = `${Math.min(Math.max(textarea.scrollHeight, 72), 160)}px`
  }, [prompt])

  // Send message to ai-chat feed
  const submitMessage = async () => {
    const content = prompt.trim()
    if (!content || isSending || isAiWorking) return

    setSendError(null)
    setIsSending(true)

    const senderName =
      user?.fullName ||
      [user?.firstName, user?.lastName].filter(Boolean).join(" ") ||
      self?.info?.name ||
      "Collaborator"

    const payload: ChatMessagePayload = {
      sender: {
        id: user?.id || self?.id || "anonymous",
        name: senderName,
        color: self?.info?.color || "var(--accent-primary)",
        avatar: user?.imageUrl || self?.info?.avatar,
      },
      role: "user",
      content,
      timestamp: Date.now(),
    }

    try {
      await createFeedMessage(AI_CHAT_FEED_ID, payload)
      setPrompt("")
    } catch {
      try {
        await createFeed(AI_CHAT_FEED_ID, { metadata: { name: "AI Chat" } })
        await createFeedMessage(AI_CHAT_FEED_ID, payload)
        setPrompt("")
      } catch (err) {
        setSendError(
          err instanceof Error ? err.message : "Failed to send message"
        )
      }
    } finally {
      setIsSending(false)
    }
  }

  const handlePromptKeyDown = (
    event: React.KeyboardEvent<HTMLTextAreaElement>
  ) => {
    if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) {
      event.preventDefault()
      void submitMessage()
    }
  }

  return (
    <aside
      data-slot="ai-sidebar"
      aria-label="AI Workspace sidebar"
      aria-hidden={!isOpen}
      className={cn(
        "fixed right-3 top-16 bottom-3 z-40 flex w-80 max-w-[calc(100vw-1.5rem)] flex-col rounded-2xl border border-surface-border bg-base/95 text-copy-primary shadow-2xl backdrop-blur-md transition-all duration-300 ease-in-out sm:w-[22rem]",
        isOpen
          ? "translate-x-0 opacity-100 pointer-events-auto visible"
          : "translate-x-[calc(100%+4rem)] opacity-0 pointer-events-none invisible",
        className
      )}
      style={{
        transform: isOpen ? "translateX(0)" : "translateX(calc(100% + 4rem))",
        visibility: isOpen ? "visible" : "hidden",
        transition:
          "transform 300ms cubic-bezier(0.16, 1, 0.3, 1), opacity 300ms ease, visibility 300ms",
        ...style,
      }}
      {...props}
      inert={!isOpen}
    >
      <header className="flex h-16 shrink-0 items-center justify-between border-b border-surface-border-subtle px-4">
        <div className="flex min-w-0 items-center gap-2.5">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-ai/20 bg-ai/10 text-ai-text">
            <Bot className="h-4 w-4" aria-hidden="true" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-semibold tracking-tight text-copy-primary">
                AI Workspace
              </h2>
              {isAiWorking ? (
                <span
                  data-slot="ai-active-badge"
                  className="inline-flex items-center gap-1 rounded-full bg-ai/10 px-2 py-0.5 text-[10px] font-medium text-ai-text ring-1 ring-ai/20"
                >
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-ai" />
                  Thinking
                </span>
              ) : null}
            </div>
            <p className="text-xs text-copy-muted">Collaborate with Ghost AI</p>
          </div>
        </div>
        {onClose ? (
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            onClick={onClose}
            aria-label="Close AI sidebar"
            className="rounded-lg text-copy-muted hover:bg-subtle hover:text-copy-primary"
          >
            <X className="h-4 w-4" />
          </Button>
        ) : null}
      </header>

      <Tabs defaultValue="architect" className="flex min-h-0 flex-1 flex-col gap-0">
        <div className="shrink-0 border-b border-surface-border-subtle px-4 py-3">
          <TabsList className="grid h-9 w-full grid-cols-2 rounded-xl bg-subtle p-1">
            <TabsTrigger
              value="architect"
              className="rounded-lg text-xs text-copy-muted data-active:bg-brand data-active:text-base data-active:shadow-sm"
            >
              <Sparkles className="h-3.5 w-3.5" />
              AI Architect
            </TabsTrigger>
            <TabsTrigger
              value="specs"
              className="rounded-lg text-xs text-copy-muted data-active:bg-brand data-active:text-base data-active:shadow-sm"
            >
              <FileText className="h-3.5 w-3.5" />
              Specs
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent
          value="architect"
          className="flex min-h-0 flex-1 flex-col text-sm"
        >
          <div
            ref={chatScrollRef}
            className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto p-4"
            aria-live="polite"
            aria-label="Room collaborative chat"
          >
            {chatMessages.length === 0 ? (
              <div className="flex flex-1 flex-col items-center justify-center py-4 text-center">
                <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-ai/20 bg-ai/10 text-ai-text shadow-sm shadow-ai/10">
                  <Bot className="h-7 w-7" aria-hidden="true" />
                </div>
                <h3 className="text-sm font-semibold text-copy-primary">
                  What are we designing?
                </h3>
                <p className="mt-2 max-w-[250px] text-xs leading-relaxed text-copy-muted">
                  Describe a system and collaborate with everyone in the room.
                </p>
                <div className="mt-5 flex w-full flex-col gap-2">
                  {starterPrompts.map((starterPrompt) => (
                    <button
                      key={starterPrompt}
                      type="button"
                      disabled={isAiWorking || isSending}
                      onClick={() => !isAiWorking && !isSending && setPrompt(starterPrompt)}
                      className={cn(
                        "rounded-full border border-surface-border bg-subtle px-3 py-2 text-left text-xs text-ai-text transition-colors hover:border-brand/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand",
                        (isAiWorking || isSending) && "opacity-50 cursor-not-allowed"
                      )}
                    >
                      {starterPrompt}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              chatMessages.map(({ id, data }) => {
                const senderInfo = getSenderInfo(data.sender)
                const isCurrentUser = Boolean(
                  (user?.id && senderInfo.id === user.id) ||
                  (self?.id && senderInfo.id === self.id) ||
                  (user?.fullName && senderInfo.name === user.fullName)
                )
                const isAssistant = data.role === "assistant"
                const formattedTime = formatMessageTime(data.timestamp)

                return (
                  <div
                    key={id}
                    data-slot="chat-message-item"
                    className={cn(
                      "flex flex-col gap-1 max-w-[88%]",
                      isCurrentUser ? "ml-auto items-end" : "mr-auto items-start"
                    )}
                  >
                    <div className="flex items-center gap-1.5 px-1 text-[10px] text-copy-muted">
                      <span
                        className="font-medium truncate max-w-32"
                        style={{ color: senderInfo.color }}
                      >
                        {isCurrentUser ? "You" : senderInfo.name}
                      </span>
                      {formattedTime ? (
                        <span className="text-copy-faint">· {formattedTime}</span>
                      ) : null}
                    </div>
                    <div
                      className={cn(
                        "whitespace-pre-wrap rounded-2xl px-3.5 py-2.5 text-xs leading-relaxed shadow-sm",
                        isCurrentUser
                          ? "rounded-br-md border border-brand/40 bg-brand-dim text-copy-primary"
                          : isAssistant
                          ? "rounded-bl-md border border-ai/20 bg-ai/10 text-ai-text"
                          : "rounded-bl-md border border-surface-border bg-elevated text-copy-primary"
                      )}
                    >
                      {data.content}
                    </div>
                  </div>
                )
              })
            )}
          </div>

          {/* Error alert when message sending fails */}
          {sendError ? (
            <div
              data-slot="chat-send-error"
              role="alert"
              className="flex items-center justify-between border-t border-state-error/30 bg-state-error/10 px-3 py-1.5 text-[11px] text-state-error animate-in fade-in"
            >
              <div className="flex items-center gap-1.5 truncate">
                <AlertCircle className="h-3 w-3 shrink-0" />
                <span className="truncate">{sendError}</span>
              </div>
              <button
                type="button"
                onClick={() => setSendError(null)}
                className="ml-2 rounded p-0.5 text-state-error hover:bg-state-error/20"
                aria-label="Dismiss send error"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ) : null}

          {/* AI activity status indicator from ai-status-feed */}
          {isAiWorking ? (
            <div
              data-slot="ai-thinking-indicator"
              role="status"
              aria-live="polite"
              className="flex items-center gap-2 border-t border-surface-border-subtle bg-surface/90 px-4 py-2 text-xs text-ai-text backdrop-blur-sm animate-in fade-in"
            >
              <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin text-ai" aria-hidden="true" />
              <span className="truncate font-medium">{latestStatusText}</span>
            </div>
          ) : null}

          <form
            className="shrink-0 border-t border-surface-border-subtle bg-surface/50 p-3"
            onSubmit={(event) => {
              event.preventDefault()
              void submitMessage()
            }}
          >
            <div className="rounded-xl border border-surface-border bg-base/60 p-2 shadow-inner focus-within:border-brand/50">
              <Textarea
                ref={textareaRef}
                value={prompt}
                onChange={(event) => {
                  setPrompt(event.target.value)
                  if (sendError) setSendError(null)
                }}
                onKeyDown={handlePromptKeyDown}
                rows={2}
                disabled={isAiWorking || isSending}
                aria-label="Message room chat"
                placeholder={
                  isAiWorking
                    ? "AI generation is in progress..."
                    : isSending
                    ? "Sending message..."
                    : "Message collaborators in this room..."
                }
                className={cn(
                  "min-h-[72px] max-h-40 resize-none overflow-y-auto border-0 bg-transparent px-1.5 py-1 text-xs text-copy-primary shadow-none focus-visible:border-0 focus-visible:ring-0 md:text-xs",
                  (isAiWorking || isSending) && "opacity-60 cursor-not-allowed"
                )}
              />
              <div className="flex items-center justify-between pt-1">
                <span className="text-[10px] text-copy-faint">
                  Enter to send · Shift+Enter for a new line
                </span>
                <Button
                  type="submit"
                  size="icon-sm"
                  aria-label="Send message"
                  disabled={!prompt.trim() || isAiWorking || isSending}
                  className="h-7 w-7 rounded-lg bg-brand text-base hover:bg-brand/90 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {isAiWorking || isSending ? (
                    <Loader2 className="h-4 w-4 animate-spin text-base" aria-hidden="true" />
                  ) : (
                    <ArrowUp className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
          </form>
        </TabsContent>

        <TabsContent value="specs" className="flex min-h-0 flex-1 flex-col p-4">
          <Button
            type="button"
            className="h-9 w-full gap-2 rounded-xl bg-brand text-base hover:bg-brand/90"
          >
            <Sparkles className="h-4 w-4" />
            Generate Spec
          </Button>

          <section className="mt-4 rounded-2xl border border-surface-border bg-elevated p-4">
            <div className="flex items-start gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-brand/20 bg-brand-dim text-brand">
                <FileText className="h-4 w-4" aria-hidden="true" />
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="text-sm font-medium text-copy-primary">
                  System Architecture Spec
                </h3>
                <p className="mt-2 text-xs leading-relaxed text-copy-muted">
                  A technical overview of the system, including its core services,
                  data flows, and infrastructure decisions.
                </p>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  disabled
                  className="mt-4 gap-2"
                >
                  <Download className="h-3.5 w-3.5" />
                  Download
                </Button>
              </div>
            </div>
          </section>
        </TabsContent>
      </Tabs>
    </aside>
  )
}

function AiSidebarStandalone({
  isOpen,
  onClose,
  className,
  style,
  ...props
}: AiSidebarProps) {
  const [prompt, setPrompt] = React.useState("")
  const textareaRef = React.useRef<HTMLTextAreaElement>(null)

  React.useLayoutEffect(() => {
    const textarea = textareaRef.current
    if (!textarea) return

    textarea.style.height = "72px"
    textarea.style.height = `${Math.min(Math.max(textarea.scrollHeight, 72), 160)}px`
  }, [prompt])

  return (
    <aside
      data-slot="ai-sidebar"
      aria-label="AI Workspace sidebar"
      aria-hidden={!isOpen}
      className={cn(
        "fixed right-3 top-16 bottom-3 z-40 flex w-80 max-w-[calc(100vw-1.5rem)] flex-col rounded-2xl border border-surface-border bg-base/95 text-copy-primary shadow-2xl backdrop-blur-md transition-all duration-300 ease-in-out sm:w-[22rem]",
        isOpen
          ? "translate-x-0 opacity-100 pointer-events-auto visible"
          : "translate-x-[calc(100%+4rem)] opacity-0 pointer-events-none invisible",
        className
      )}
      style={{
        transform: isOpen ? "translateX(0)" : "translateX(calc(100% + 4rem))",
        visibility: isOpen ? "visible" : "hidden",
        transition:
          "transform 300ms cubic-bezier(0.16, 1, 0.3, 1), opacity 300ms ease, visibility 300ms",
        ...style,
      }}
      {...props}
      inert={!isOpen}
    >
      <header className="flex h-16 shrink-0 items-center justify-between border-b border-surface-border-subtle px-4">
        <div className="flex min-w-0 items-center gap-2.5">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-ai/20 bg-ai/10 text-ai-text">
            <Bot className="h-4 w-4" aria-hidden="true" />
          </div>
          <div className="min-w-0">
            <h2 className="text-sm font-semibold tracking-tight text-copy-primary">
              AI Workspace
            </h2>
            <p className="text-xs text-copy-muted">Collaborate with Ghost AI</p>
          </div>
        </div>
        {onClose ? (
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            onClick={onClose}
            aria-label="Close AI sidebar"
            className="rounded-lg text-copy-muted hover:bg-subtle hover:text-copy-primary"
          >
            <X className="h-4 w-4" />
          </Button>
        ) : null}
      </header>

      <Tabs defaultValue="architect" className="flex min-h-0 flex-1 flex-col gap-0">
        <div className="shrink-0 border-b border-surface-border-subtle px-4 py-3">
          <TabsList className="grid h-9 w-full grid-cols-2 rounded-xl bg-subtle p-1">
            <TabsTrigger
              value="architect"
              className="rounded-lg text-xs text-copy-muted data-active:bg-brand data-active:text-base data-active:shadow-sm"
            >
              <Sparkles className="h-3.5 w-3.5" />
              AI Architect
            </TabsTrigger>
            <TabsTrigger
              value="specs"
              className="rounded-lg text-xs text-copy-muted data-active:bg-brand data-active:text-base data-active:shadow-sm"
            >
              <FileText className="h-3.5 w-3.5" />
              Specs
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent
          value="architect"
          className="flex min-h-0 flex-1 flex-col text-sm"
        >
          <div
            className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto p-4"
            aria-live="polite"
            aria-label="AI Architect conversation"
          >
            <div className="flex flex-1 flex-col items-center justify-center py-4 text-center">
              <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-ai/20 bg-ai/10 text-ai-text shadow-sm shadow-ai/10">
                <Bot className="h-7 w-7" aria-hidden="true" />
              </div>
              <h3 className="text-sm font-semibold text-copy-primary">
                What are we designing?
              </h3>
              <p className="mt-2 max-w-[250px] text-xs leading-relaxed text-copy-muted">
                Describe a system and Ghost AI will help shape its architecture.
              </p>
              <div className="mt-5 flex w-full flex-col gap-2">
                {starterPrompts.map((starterPrompt) => (
                  <button
                    key={starterPrompt}
                    type="button"
                    onClick={() => setPrompt(starterPrompt)}
                    className="rounded-full border border-surface-border bg-subtle px-3 py-2 text-left text-xs text-ai-text transition-colors hover:border-brand/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
                  >
                    {starterPrompt}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <form
            className="shrink-0 border-t border-surface-border-subtle bg-surface/50 p-3"
            onSubmit={(event) => event.preventDefault()}
          >
            <div className="rounded-xl border border-surface-border bg-base/60 p-2 shadow-inner focus-within:border-brand/50">
              <Textarea
                ref={textareaRef}
                value={prompt}
                onChange={(event) => setPrompt(event.target.value)}
                rows={2}
                aria-label="Message Ghost AI"
                placeholder="Ask AI to design an architecture..."
                className="min-h-[72px] max-h-40 resize-none overflow-y-auto border-0 bg-transparent px-1.5 py-1 text-xs text-copy-primary shadow-none focus-visible:border-0 focus-visible:ring-0 md:text-xs"
              />
              <div className="flex items-center justify-between pt-1">
                <span className="text-[10px] text-copy-faint">
                  Enter to send · Shift+Enter for a new line
                </span>
                <Button
                  type="submit"
                  size="icon-sm"
                  aria-label="Send message"
                  disabled={!prompt.trim()}
                  className="h-7 w-7 rounded-lg bg-brand text-base hover:bg-brand/90"
                >
                  <ArrowUp className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </form>
        </TabsContent>

        <TabsContent value="specs" className="flex min-h-0 flex-1 flex-col p-4">
          <Button
            type="button"
            className="h-9 w-full gap-2 rounded-xl bg-brand text-base hover:bg-brand/90"
          >
            <Sparkles className="h-4 w-4" />
            Generate Spec
          </Button>

          <section className="mt-4 rounded-2xl border border-surface-border bg-elevated p-4">
            <div className="flex items-start gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-brand/20 bg-brand-dim text-brand">
                <FileText className="h-4 w-4" aria-hidden="true" />
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="text-sm font-medium text-copy-primary">
                  System Architecture Spec
                </h3>
                <p className="mt-2 text-xs leading-relaxed text-copy-muted">
                  A technical overview of the system, including its core services,
                  data flows, and infrastructure decisions.
                </p>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  disabled
                  className="mt-4 gap-2"
                >
                  <Download className="h-3.5 w-3.5" />
                  Download
                </Button>
              </div>
            </div>
          </section>
        </TabsContent>
      </Tabs>
    </aside>
  )
}

export function AiSidebar(props: AiSidebarProps) {
  const room = useRoom({ allowOutsideRoom: true })

  if (room) {
    return <AiSidebarConnected {...props} />
  }

  return <AiSidebarStandalone {...props} />
}
