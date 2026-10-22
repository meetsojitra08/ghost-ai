/**
 * Generates a clean URL-friendly slug from a string.
 * Normalizes Unicode (NFD) and strips combining diacritical marks so accented
 * characters retain their base letters (e.g., 'café' -> 'cafe').
 * Converts to lowercase, replaces whitespace/underscores/special characters with hyphens,
 * and strips leading/trailing hyphens.
 */
export function slugify(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "")
}
