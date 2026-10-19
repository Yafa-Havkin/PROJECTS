/**
 * api.ts — central place for the backend base URL.
 *
 * In development, VITE_API_BASE_URL is empty (or unset) so all calls go to
 * the Vite dev proxy at /api/... → localhost:8000.
 *
 * In production, VITE_API_BASE_URL can override the configured Railway API.
 */
const DEFAULT_PRODUCTION_API_BASE = "https://projects-production-5e07.up.railway.app";

export const API_BASE = (
  import.meta.env.VITE_API_BASE_URL ||
  (import.meta.env.PROD ? DEFAULT_PRODUCTION_API_BASE : "")
).replace(/\/+$/, "");

/** Build a full URL for an API path, e.g. apiUrl("/api/chat") */
export function apiUrl(path: string): string {
  return `${API_BASE}${path}`;
}
