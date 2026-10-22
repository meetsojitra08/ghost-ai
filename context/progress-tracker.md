# Progress Tracker

Update this file whenever the current phase, active feature, or implementation state changes.

## Current Phase

- Phase 4: Project Dialogs & Editor Home (Complete)

## Current Goal

- Awaiting next feature spec (e.g. Canvas integration with Liveblocks & React Flow or project persistence).

## Completed

- `01-design-system.md`: Configured shadcn/ui with dark theme tokens from `context/ui-context.md`, added UI primitives (Button, Card, Dialog, Input, Tabs, Textarea, ScrollArea), installed `lucide-react`, set up `lib/utils.ts` with reusable `cn()` helper, configured CSS variables in `globals.css` with dark theme and `@theme inline` mappings, and verified compilation and TypeScript types.
- `02-editor.md`: Implemented base chrome components that frame the editor screen: `components/editor/editor-navbar.tsx` (fixed-height top navbar with left, center, right sections, sidebar toggle with `PanelLeftOpen`/`PanelLeftClose` icons, and subtle bottom border) and `components/editor/project-sidebar.tsx` (floating overlay shell sliding from left without pushing page content, `Projects` header with close button, shadcn `Tabs` for "My Projects" and "Shared" with placeholder states, and full-width "New Project" button with `Plus` icon). Created `components/editor/editor-dialog.tsx` implementing the dialog pattern with dark tokens, supporting title, description, and footer actions. All components type-checked and lint-free.
- `03-auth.md`: Installed `@clerk/ui` and configured Clerk authentication across the Next.js app. Created `lib/clerk-theme.ts` with `dark` theme from `@clerk/ui/themes` and appearance variable overrides mapped to the design system CSS variables in `globals.css` (no hardcoded colors). Wrapped `app/layout.tsx` in `ClerkProvider`. Implemented `proxy.ts` at project root protecting all routes by default except public auth paths matching `NEXT_PUBLIC_CLERK_SIGN_IN_URL` and `NEXT_PUBLIC_CLERK_SIGN_UP_URL`. Updated `/` (`app/page.tsx`) to redirect authenticated users to `/editor` and unauthenticated users to `/sign-in`. Built minimal responsive two-panel `AuthShell` (`components/auth/auth-shell.tsx`) with left branding/feature list and right centered form on large screens and form only on small screens. Created catch-all auth pages `app/sign-in/[[...sign-in]]/page.tsx` and `app/sign-up/[[...sign-up]]/page.tsx`. Added Clerk's `UserButton` to `components/editor/editor-navbar.tsx` right section. Created protected `/editor` workspace page (`app/editor/page.tsx`). Tested and verified with `tsc --noEmit`, ESLint, `npm run build`, and live HTTP route redirects (status 307 to `/sign-in` for protected paths, 200 for auth pages).
- `04-project-dialogs.md`: Built the `/editor` home screen and project dialogs/sidebar actions using mock data without API calls or persistence. Reused editor chrome layout and added centered minimal call-to-action (`Create a project or open an existing one`, description, and `New Project` button with `Plus` icon) without card wrappers. Implemented `CreateProjectDialog` with live slug preview that dynamically updates as the user types, `RenameProjectDialog` with prefilled input, current project name description, autofocus, and Enter-key submission, and `DeleteProjectDialog` with destructive confirmation only and no input. Created `hooks/use-project-dialogs.ts` managing dialog visibility, form state, and loading state. Updated `ProjectSidebar` with project item actions (rename and delete) only shown for owned projects and hidden for shared projects, plus mobile backdrop scrim and outside tap-to-close behavior. All checks verified with `tsc --noEmit`, `eslint`, and production build.

## In Progress

- None.

## Next Up

- Canvas integration and project management setup (Liveblocks + React Flow).

## Open Questions

- None at present.

## Architecture Decisions

- Configured Tailwind CSS v4 using CSS custom properties in `globals.css` mapped to design tokens via `@theme inline` matching `context/ui-context.md`.
- shadcn/ui configured with `base-nova` style and `@base-ui/react` primitives.
- Dark theme enforced across `:root` and `.dark` with no default light styling.
- Editor chrome components (`EditorNavbar`, `ProjectSidebar`, `EditorDialog`) organized under `components/editor/` adhering to the dark design tokens and floating panel radius (`rounded-2xl` for sidebars, `rounded-3xl` for modals).
- Clerk configured with `@clerk/ui/themes` `dark` base theme and custom CSS variable overrides so all Clerk components adhere to Ghost AI's palette without hardcoded values.
- Route protection enforced at project root using `proxy.ts` (Next.js 16 convention) with `clerkMiddleware` and `createRouteMatcher` for public routes defined via standard Clerk environment variables.

## Session Notes

- Completed implementation of `context/feature-specs/03-auth.md`. Verified with `npx tsc --noEmit`, `npm run lint`, `npm run build`, and endpoint curl tests.
- Updated authentication layout to match the design screenshot: implemented a 50/50 two-panel layout with `bg-surface` (`#111114`) on the left to differentiate from `bg-base` (`#080809`), rounded cyan logo mark, exact headline and copy, 3 feature rows with Stroke Lucide icons (`History`, `Share2`, `FileText`), and applied Geist Sans typography guidelines across `html`, `body`, form controls, and Clerk themes.
- Fixed font color visibility on auth shell: resolved Tailwind CSS v4 `@theme` token mappings in `globals.css` with explicit fallbacks so tokens (`text-copy-primary`, `text-copy-secondary`, `text-copy-muted`) compile cleanly to their theme colors without inline `style` attributes or `!important` overrides, strictly adhering to `context/code-standards.md`. Verified via `npx tsc --noEmit`, `npm run lint`, and `npm run build`.
- Addressed code review feedback in `context/current-issues.md`: updated `AuthShell` branding panel to `hidden lg:flex lg:w-1/2` for clean mobile presentation, configured `theme: dark` in `lib/clerk-theme.ts` for `@clerk/ui`, and aligned Next.js / Clerk reference patterns (Promise params awaiting, `updateTag` cache invalidation, scoped organization deletion, `<Show>` server-authorization guidance, and `authorizedParties`/`azp` JWT verification). All checks passed (`tsc`, `lint`, `build`).
- Resolved review items from `context/Fixes.md`: enforced `aria-label`/`ariaLabel` on `EditorDialog` when `title` is absent or null, normalized URL paths in `proxy.ts` with explicit mounted `/sign-in` and `/sign-up` public route matching, and updated scaffold evaluation assertions in `evals.json`. Verified with `tsc --noEmit`, ESLint, and production build.
- Completed implementation of `context/feature-specs/04-project-dialogs.md`: built minimal `/editor` home view without cards, `CreateProjectDialog` with reactive slug preview, `RenameProjectDialog` with prefill, auto-focus, current project name in description, and Enter-key submit, and `DeleteProjectDialog` with destructive confirmation only. Created `useProjectDialogs` hook for state management with mock projects, and updated `ProjectSidebar` with owned-only rename/delete actions, hidden actions for shared projects, and mobile backdrop scrim with tap-outside dismissal. Verified with `npx tsc --noEmit`, `npm run lint`, and `npm run build`.
- Polished Project Dialogs according to `context/ui-context.md`: added themed icon badges with subtle glow, dark technical surface hierarchy, character counters, clear buttons, keyboard shortcut hints (`↵`), live workspace URL identifier cards, and backdrop blur (`rgba(8, 8, 9, 0.75)` with `backdrop-filter: blur(6px)`) in `globals.css`. Verified with `tsc --noEmit`, ESLint, and production build.
- Fixed mobile sidebar outside click handling in `components/editor/project-sidebar.tsx`: removed redundant document-level `pointerdown` listener and unused `sidebarRef` that inadvertently closed the sidebar when interacting with portal-rendered dialogs, relying cleanly on the dedicated mobile backdrop scrim. Verified with `tsc --noEmit`, ESLint, and production build.
- Added `onOpenProject` callback to `ProjectSidebar` and wired each project row to open projects into active workspace state in `EditorWorkspace`, updating the navbar title, displaying active project canvas workspace state, highlighting active project row in sidebar, and preserving `stopPropagation()` on rename and delete action buttons. Verified with `tsc --noEmit`, ESLint, and production build.
- Fixed rename input submission in `components/editor/rename-project-dialog.tsx`: removed custom `onKeyDown` listener so Enter key relies on the native form submission pathway, preventing premature submission during IME composition while preserving native submit behavior. Verified with `tsc --noEmit`, ESLint, and production build.
- Updated `lib/slug.ts` and `hooks/use-project-dialogs.ts`: added Unicode NFD normalization and combining diacritical mark stripping to `slugify` so accented characters retain base letters (e.g. 'café' -> 'cafe'), and ensured empty slug results fall back to non-empty id-based slugs in create and rename project flows. Verified with `tsc --noEmit`, ESLint, and production build.
- Refactored project row semantics in `components/editor/project-sidebar.tsx`: replaced nested `role="button"` container with a plain `<div>` row container holding a dedicated native Open `<button>` and sibling Rename/Delete `<button>`s, fixing nested interactive accessibility violations and ensuring correct Tab navigation and screen-reader announcements. Verified with `tsc --noEmit`, ESLint, and production build.
