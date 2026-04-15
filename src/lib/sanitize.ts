import DOMPurify from "dompurify";

/**
 * Sanitizes user-generated content for safe UI rendering.
 * - Handles null/undefined gracefully.
 * - Strips dangerous HTML/script content.
 * - Returns a plain string safe to render in JSX.
 */
export function sanitizeText(input: string | null | undefined): string {
  if (input == null) return "";
  const value = String(input);
  return DOMPurify.sanitize(value, { ALLOWED_TAGS: [], ALLOWED_ATTR: [] }).trim();
}
