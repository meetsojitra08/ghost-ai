import * as React from "react";
import { History, Share2, FileText } from "lucide-react";

interface AuthShellProps {
  children: React.ReactNode;
}

/**
 * Two-panel 50/50 authentication layout matching the Ghost AI workspace design.
 * - Left 50%: Distinct surface background (#111114), cyan logo, high-contrast readable copy, and feature list.
 * - Right 50%: Pure dark base background (#080809) centering the Clerk authentication form.
 * - Strict adherence to UI guidelines: Geist Sans typography, CSS design tokens, no raw hex/generic colors.
 */
export function AuthShell({ children }: AuthShellProps) {
  return (
    <div className="flex min-h-screen w-full flex-col lg:flex-row bg-base text-copy-primary font-sans antialiased">
      {/* Left panel: 50% width on large screens with differentiated dark surface background, hidden on mobile */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-between border-r border-surface-border bg-surface p-8 sm:p-12 xl:p-16 2xl:p-20 relative overflow-hidden">
        {/* Subtle radial glow in top-left corner */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-24 -left-24 h-64 w-64 rounded-full opacity-20"
          style={{
            background: "radial-gradient(circle, var(--accent-primary) 0%, transparent 70%)",
          }}
        />

        {/* Top: Compact Logo */}
        <div className="relative flex items-center gap-3">
          <div className="relative h-8 w-8 shrink-0 rounded-lg bg-brand flex items-center justify-center shadow-md shadow-brand/30">
            <div className="h-2.5 w-2.5 rounded-sm bg-base/90" />
          </div>
          <span className="text-sm font-semibold tracking-tight text-copy-primary font-sans">
            Ghost AI
          </span>
        </div>

        {/* Center: Hero Heading and 3 Features */}
        <div className="relative my-10 lg:my-0 max-w-lg space-y-8">
          <div className="space-y-4">
            <h1 className="text-3xl lg:text-4xl font-bold tracking-tight text-copy-primary leading-tight font-sans">
              Design systems at the
              <br />
              speed of thought.
            </h1>
            <p className="text-sm md:text-base text-copy-secondary leading-relaxed font-sans max-w-md">
              Describe your architecture in plain English. Ghost AI maps it to a shared canvas your whole team can refine in real time.
            </p>
          </div>

          <div className="space-y-6 pt-2">
            {/* Feature 1: AI Architecture Generation */}
            <div className="flex items-start gap-3.5">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-surface-border bg-subtle text-brand">
                <History className="h-4 w-4" />
              </div>
              <div className="space-y-1">
                <h2 className="text-sm font-semibold text-copy-primary font-sans">
                  AI Architecture Generation
                </h2>
                <p className="text-xs text-copy-secondary leading-relaxed font-sans">
                  Describe your system, AI maps it to nodes and edges on a live canvas.
                </p>
              </div>
            </div>

            {/* Feature 2: Real-time Collaboration */}
            <div className="flex items-start gap-3.5">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-surface-border bg-subtle text-brand">
                <Share2 className="h-4 w-4" />
              </div>
              <div className="space-y-1">
                <h2 className="text-sm font-semibold text-copy-primary font-sans">
                  Real-time Collaboration
                </h2>
                <p className="text-xs text-copy-secondary leading-relaxed font-sans">
                  Live cursors, presence indicators, and shared node editing across your team.
                </p>
              </div>
            </div>

            {/* Feature 3: Instant Spec Generation */}
            <div className="flex items-start gap-3.5">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-surface-border bg-subtle text-brand">
                <FileText className="h-4 w-4" />
              </div>
              <div className="space-y-1">
                <h2 className="text-sm font-semibold text-copy-primary font-sans">
                  Instant Spec Generation
                </h2>
                <p className="text-xs text-copy-secondary leading-relaxed font-sans">
                  Export a complete Markdown technical spec directly from the canvas graph.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom: Copyright */}
        <div className="relative text-xs text-copy-muted font-sans">
          © 2026 Ghost AI. All rights reserved.
        </div>
      </div>

      {/* Right panel: 50% width on large screens centering the Clerk authentication form */}
      <div className="flex w-full lg:w-1/2 flex-1 items-center justify-center p-6 sm:p-10 lg:p-12 bg-base min-h-[550px] lg:min-h-screen relative overflow-hidden">
        {/* Subtle ambient glow behind the auth card */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse at center, rgba(0,200,212,0.04) 0%, transparent 65%)",
          }}
        />
        <div className="relative w-full max-w-[440px] flex justify-center">
          {children}
        </div>
      </div>
    </div>
  );
}
