/**
 * Generates a clean URL-friendly slug from a string.
 * Trims whitespace, converts to lowercase, replaces special characters and spaces with hyphens,
 * and strips leading/trailing hyphens.
 */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "")
}
