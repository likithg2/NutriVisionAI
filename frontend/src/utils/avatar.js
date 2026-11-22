/**
 * Resolves an avatar URL against VITE_API_BASE_URL if it is a relative path.
 * If the URL is already absolute (http://, https://, blob:, data:) or empty, it handles it safely.
 * 
 * @param {string|null|undefined} avatarUrl
 * @returns {string|null}
 */
export function getAvatarUrl(avatarUrl) {
  if (!avatarUrl || typeof avatarUrl !== "string") return null;

  const trimmed = avatarUrl.trim();
  if (!trimmed) return null;

  // Already absolute or inline data/blob
  if (
    trimmed.startsWith("http://") ||
    trimmed.startsWith("https://") ||
    trimmed.startsWith("data:") ||
    trimmed.startsWith("blob:")
  ) {
    return trimmed;
  }

  // Construct absolute URL with configured API base URL (e.g. Render backend in production)
  let apiBase = (import.meta.env.VITE_API_BASE_URL || "").trim();
  while (apiBase.endsWith("/")) {
    apiBase = apiBase.slice(0, -1);
  }
  const normalizedPath = trimmed.startsWith("/") ? trimmed : `/${trimmed}`;

  return `${apiBase}${normalizedPath}`;
}
