"use client";

import * as React from "react";
import { EditorNavbar } from "./editor-navbar";
import { ProjectSidebar } from "./project-sidebar";

export function EditorWorkspace() {
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(false);

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
        />

        {/* Center Canvas area */}
        <main className="relative flex flex-1 items-center justify-center bg-base p-6">
          <div className="flex flex-col items-center gap-3 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-surface border border-surface-border text-brand font-mono font-bold text-xl">
              G
            </div>
            <h2 className="text-lg font-semibold text-copy-primary">
              System Design Canvas
            </h2>
            <p className="max-w-sm text-sm text-copy-muted">
              Select or create a project from the left sidebar to start collaborating.
            </p>
          </div>
        </main>
      </div>
    </div>
  );
}
