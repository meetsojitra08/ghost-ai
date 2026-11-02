# Ghost AI

Ghost AI is a collaborative system design workspace. Teams shape architecture diagrams together on a live canvas and can import starter diagrams into a project.

## Current status

The current implementation includes authentication, project and collaborator management, a real-time canvas, canvas editing tools, starter templates, and room presence. The next planned canvas feature is multi-selection, selection toolbar actions, and edge creation controls. The active roadmap is tracked in [`context/progress-tracker.md`](context/progress-tracker.md).

### Implemented

- Clerk sign-in and sign-up, protected workspace routes, and Clerk profile controls.
- Project creation, rename and delete actions, project listing, and collaborator invitations and removal.
- Owner and collaborator access checks for project workspaces and Liveblocks rooms.
- A shared React Flow canvas backed by Liveblocks, with six node shapes, node labels and colors, resizing, editable edge labels, zoom and history controls, and keyboard shortcuts.
- Live participant avatars and colored cursors in the canvas room.
- Three built-in starter diagrams: microservices, CI/CD pipeline, and event-driven system. Importing a starter replaces the current room's canvas graph.

### Planned

- Canvas multi-selection, selection toolbar actions, and edge creation controls.
- AI architecture generation and Markdown specification generation.
- Trigger.dev workflows and Vercel Blob artifact storage for canvas snapshots and generated specifications.

AI generation, specification generation, Trigger.dev workflows, and Blob artifact storage are not implemented yet.

## Technology

| Area | Technology |
| --- | --- |
| Application | Next.js 16, React 19, TypeScript |
| UI | Tailwind CSS 4, shadcn/ui, Lucide React |
| Authentication | Clerk |
| Project metadata | Prisma 7, PostgreSQL |
| Collaborative canvas and presence | Liveblocks, React Flow (`@xyflow/react`) |

## Run locally

### Requirements

- Node.js 20.9 or later
- npm
- A PostgreSQL database
- Clerk and Liveblocks projects for authentication and collaborative rooms

### Configure environment

Create a root `.env` file with the credentials for your services:

```dotenv
DATABASE_URL="postgresql://USER:PASSWORD@HOST:5432/DATABASE"
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="your-clerk-publishable-key"
CLERK_SECRET_KEY="your-clerk-secret-key"
LIVEBLOCKS_SECRET_KEY="your-liveblocks-secret-key"
```

The Clerk route variables are optional; the app defaults to `/sign-in` and `/sign-up`:

```dotenv
NEXT_PUBLIC_CLERK_SIGN_IN_URL="/sign-in"
NEXT_PUBLIC_CLERK_SIGN_UP_URL="/sign-up"
```

Keep service credentials out of source control. The repository ignores local environment files.

### Install and start

```bash
npm ci
npx prisma migrate deploy
npx prisma generate
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Sign in, create a project, and open it to start editing its canvas.

To create a production build, run:

```bash
npm run build
```

## Project layout

- `app/` — Next.js pages and authenticated API routes.
- `components/editor/` — workspace layout, project actions, sharing, and starter template UI.
- `components/canvas/` — React Flow canvas, node and edge renderers, controls, and presence UI.
- `lib/` — Prisma, Liveblocks, project access, and shared application helpers.
- `prisma/` — Prisma schema and migrations.
- `context/` — product, architecture, UI, workflow, and feature documentation.

## Documentation

- [Project overview](context/project-overview.md)
- [Architecture context](context/architecture-context.md)
- [UI context](context/ui-context.md)
- [Progress tracker and roadmap](context/progress-tracker.md)
- [Feature specifications](context/feature-specs/)
