"use client"

import * as React from "react"
import { ArrowUp, Bot, Download, FileText, Sparkles, X } from "lucide-react"
import { useRealtimeRun } from "@trigger.dev/react-hooks"

import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"

const starterPrompts = [
  "Design an e-commerce backend",
  "Create a chat app architecture",
  "Build a CI/CD pipeline",
]

interface ChatMessage {
  id: number
  role: "user" | "assistant"
  content: string
  isGenerating?: boolean
}

interface ActiveRun {
  messageId: number
  runId: string
  token?: string
}

function AiRunSubscriber({
  runId,
  token,
  onUpdate,
  onComplete,
}: {
  runId: string
  token?: string
  onUpdate: (statusText: string) => void
  onComplete: (summary?: string, error?: string) => void
}) {
  const { run, error } = useRealtimeRun(runId, {
    accessToken: token,
    enabled: Boolean(token),
  })

  React.useEffect(() => {
    if (error) {
      onComplete(undefined, error.message)
      return
    }
    if (!run) return

    const message = (run.metadata?.message as string) || undefined
    if (message) {
      onUpdate(message)
    }

    if (run.status === "COMPLETED") {
      const output = run.output as
        | { summary?: string; error?: string }
        | undefined
      onComplete(
        output?.summary || message || "System architecture generated successfully.",
        output?.error
      )
    } else if (run.status === "FAILED" || run.status === "CRASHED") {
      const errorMsg =
        (run.metadata?.message as string) || "Design agent task failed to complete"
      onComplete(undefined, errorMsg)
    }
  }, [run, error, onUpdate, onComplete])

  return null
}

export interface AiSidebarProps extends React.HTMLAttributes<HTMLElement> {
  isOpen: boolean
  onClose?: () => void
  roomId?: string
  projectId?: string
}

export function AiSidebar({
  isOpen,
  onClose,
  roomId,
  projectId,
  className,
  ...props
}: AiSidebarProps) {
  const [prompt, setPrompt] = React.useState("")
  const [messages, setMessages] = React.useState<ChatMessage[]>([])
  const [activeRun, setActiveRun] = React.useState<ActiveRun | null>(null)
  const textareaRef = React.useRef<HTMLTextAreaElement>(null)
  const messageId = React.useRef(0)

  React.useLayoutEffect(() => {
    const textarea = textareaRef.current
    if (!textarea) return

    textarea.style.height = "72px"
    textarea.style.height = `${Math.min(Math.max(textarea.scrollHeight, 72), 160)}px`
  }, [prompt])

  const submitPrompt = React.useCallback(async () => {
    const content = prompt.trim()
    if (!content) return

    const userMessageId = ++messageId.current
    const assistantMessageId = ++messageId.current

    setPrompt("")

    if (!roomId || !projectId) {
      setMessages((current) => [
        ...current,
        { id: userMessageId, role: "user", content },
        {
          id: assistantMessageId,
          role: "assistant",
          content: "Please select or open an active project to generate designs.",
        },
      ])
      return
    }

    setMessages((current) => [
      ...current,
      { id: userMessageId, role: "user", content },
      {
        id: assistantMessageId,
        role: "assistant",
        content: "Ghost AI is analyzing your system architecture request...",
        isGenerating: true,
      },
    ])

    try {
      const res = await fetch("/api/ai/design", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: content,
          roomId,
          projectId,
        }),
      })

      const data = await res.json()
      if (!res.ok) {
        setMessages((current) =>
          current.map((m) =>
            m.id === assistantMessageId
              ? {
                  ...m,
                  content: `Error: ${data.error || "Failed to trigger AI design"}`,
                  isGenerating: false,
                }
              : m
          )
        )
        return
      }

      const runId = data.runId as string

      // Retrieve run-scoped public token for realtime updates
      const tokenRes = await fetch("/api/ai/design/token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ runId }),
      })

      const tokenData = await tokenRes.json()
      const token = tokenData.token as string | undefined

      setActiveRun({
        messageId: assistantMessageId,
        runId,
        token,
      })
    } catch (err) {
      setMessages((current) =>
        current.map((m) =>
          m.id === assistantMessageId
            ? {
                ...m,
                content: `Error: ${err instanceof Error ? err.message : "Failed to connect to design service"}`,
                isGenerating: false,
              }
            : m
        )
      )
    }
  }, [projectId, prompt, roomId])

  const handleRunUpdate = React.useCallback(
    (statusText: string) => {
      if (!activeRun) return
      setMessages((current) =>
        current.map((m) =>
          m.id === activeRun.messageId
            ? { ...m, content: statusText, isGenerating: true }
            : m
        )
      )
    },
    [activeRun]
  )

  const handleRunComplete = React.useCallback(
    (summary?: string, error?: string) => {
      if (!activeRun) return
      setMessages((current) =>
        current.map((m) =>
          m.id === activeRun.messageId
            ? {
                ...m,
                content: error ? `Error: ${error}` : (summary || "System architecture updated."),
                isGenerating: false,
              }
            : m
        )
      )
      setActiveRun(null)
    },
    [activeRun]
  )

  const handlePromptKeyDown = (
    event: React.KeyboardEvent<HTMLTextAreaElement>
  ) => {
    if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) {
      event.preventDefault()
      void submitPrompt()
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
        ...props.style,
      }}
      {...props}
      inert={!isOpen}
    >
      {activeRun?.token ? (
        <AiRunSubscriber
          runId={activeRun.runId}
          token={activeRun.token}
          onUpdate={handleRunUpdate}
          onComplete={handleRunComplete}
        />
      ) : null}

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
            {messages.length === 0 ? (
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
            ) : (
              messages.map((message) => (
                <div
                  key={message.id}
                  className={cn(
                    "max-w-[88%] whitespace-pre-wrap rounded-2xl px-3.5 py-2.5 text-xs leading-relaxed",
                    message.role === "user"
                      ? "ml-auto rounded-br-md border-2 border-brand/50 bg-brand-dim text-copy-primary"
                      : "mr-auto rounded-bl-md border border-surface-border bg-elevated text-ai-text",
                    message.isGenerating && "animate-pulse"
                  )}
                >
                  {message.content}
                </div>
              ))
            )}
          </div>

          <form
            className="shrink-0 border-t border-surface-border-subtle bg-surface/50 p-3"
            onSubmit={(event) => {
              event.preventDefault()
              void submitPrompt()
            }}
          >
            <div className="rounded-xl border border-surface-border bg-base/60 p-2 shadow-inner focus-within:border-brand/50">
              <Textarea
                ref={textareaRef}
                value={prompt}
                onChange={(event) => setPrompt(event.target.value)}
                onKeyDown={handlePromptKeyDown}
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
