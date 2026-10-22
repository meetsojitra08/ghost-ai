import { dark } from "@clerk/ui/themes";

/**
 * Shared Clerk appearance configuration for Ghost AI.
 * Uses Clerk's dark theme as the base and overrides appearance variables
 * with the application's CSS design tokens defined in globals.css.
 * All styling strictly follows context/ui-context.md.
 */
export const clerkAppearance = {
  baseTheme: dark,
  variables: {
    colorPrimary: "var(--accent-primary)",
    colorPrimaryForeground: "var(--bg-base)",
    colorBackground: "var(--bg-surface)",
    colorInput: "var(--bg-subtle)",
    colorInputForeground: "var(--text-primary)",
    colorForeground: "var(--text-primary)",
    colorMutedForeground: "var(--text-muted)",
    colorNeutral: "var(--text-primary)",
    colorBorder: "var(--border-default)",
    colorRing: "var(--accent-primary)",
    colorDanger: "var(--state-error)",
    colorSuccess: "var(--state-success)",
    colorWarning: "var(--state-warning)",
    borderRadius: "0.75rem",
    fontFamily: "var(--font-geist-sans), system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    fontFamilyButtons: "var(--font-geist-sans), system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
  },
  elements: {
    rootBox: "w-full max-w-[440px] font-sans",
    cardBox: "w-full shadow-2xl",
    card: "w-full bg-surface border border-surface-border shadow-2xl rounded-2xl p-6 sm:p-8 font-sans",
    headerTitle: "font-sans text-copy-primary font-bold text-xl tracking-tight text-center",
    headerSubtitle: "font-sans text-copy-muted text-sm text-center mt-1.5",
    socialButtonsBlockButton:
      "font-sans bg-subtle border border-surface-border text-copy-primary hover:bg-elevated hover:text-copy-primary font-medium text-sm rounded-xl h-11 transition-colors",
    socialButtonsBlockButtonText: "font-sans font-medium text-copy-primary text-sm",
    socialButtonsProviderIcon: "w-4 h-4 shrink-0",
    dividerRow: "my-4",
    dividerLine: "bg-surface-border",
    dividerText: "font-sans text-copy-faint text-xs font-medium uppercase tracking-wider",
    formFieldLabel: "font-sans text-copy-primary text-sm font-medium mb-1.5",
    formFieldInput:
      "font-sans bg-subtle border border-surface-border text-copy-primary placeholder:text-copy-faint focus:border-brand focus:ring-1 focus:ring-brand rounded-xl text-sm h-11 px-3.5 transition-all",
    formButtonPrimary:
      "font-sans bg-brand text-base hover:opacity-95 font-semibold text-sm rounded-xl h-11 transition-opacity w-full shadow-sm",
    footerAction: "mt-4 text-center",
    footerActionText: "font-sans text-copy-muted text-sm",
    footerActionLink: "font-sans text-brand hover:underline font-medium text-sm",
    identityPreviewText: "font-sans text-copy-primary",
    identityPreviewEditButton: "font-sans text-brand hover:underline",
    userButtonPopoverCard:
      "font-sans bg-surface border border-surface-border shadow-2xl rounded-2xl",
    userButtonPopoverFooter: "border-t border-surface-border bg-surface",
    userPreviewMainIdentifier: "font-sans text-copy-primary font-medium",
    userPreviewSecondaryIdentifier: "font-sans text-copy-muted text-xs",
    userButtonPopoverActionButton:
      "font-sans text-copy-secondary hover:text-copy-primary hover:bg-subtle",
    userButtonPopoverActionButtonIcon: "text-copy-muted",
  },
};
