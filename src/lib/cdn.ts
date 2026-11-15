/**
 * Safe Cloudflare R2 (`https://cdn.komawm.org`) asset URL builder.
 */

const ALLOWED_PREFIXES = [
  "images/",
  "videos/",
  "fonts/",
  "releases/",
  "apt/",
  "install/",
  "manual/",
] as const;

export function cdnUrl(key: string, base = "https://cdn.komawm.org"): string {
  const clean = key.trim();
  if (
    clean.startsWith("/") ||
    clean.includes("..") ||
    !ALLOWED_PREFIXES.some((prefix) => clean.startsWith(prefix))
  ) {
    throw new Error(`Invalid CDN asset key: ${key}`);
  }
  return `${base.replace(/\/+$/u, "")}/${clean}`;
}
