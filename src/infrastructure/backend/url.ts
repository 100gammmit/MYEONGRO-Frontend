const DEFAULT_BACKEND_API_URL = "http://localhost:8080";

export function toBackendUrl(path: string): string {
  const baseUrl = (process.env.BACKEND_API_URL ?? DEFAULT_BACKEND_API_URL)
    .replace(/\/$/, "");
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${baseUrl}${normalizedPath}`;
}
