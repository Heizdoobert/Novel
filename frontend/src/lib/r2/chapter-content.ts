export function getChapterContentUrl(content: unknown): string | null {
  if (typeof content !== "string") return null;
  const trimmed = content.trim();
  return trimmed.length > 0 ? trimmed : null;
}
