// Typed fetch layer over the FastAPI backend.
// Set VITE_API_URL to the backend origin (no trailing slash), e.g. http://localhost:8000
// In local Vite-only mode (empty VITE_API_URL), requests use relative "/api" and the Vite proxy.
const API_ORIGIN = String(import.meta.env.VITE_API_URL ?? "")
  .trim()
  .replace(/\/$/, "");
export const BASE = API_ORIGIN ? `${API_ORIGIN}/api` : "/api";

// Fields are declared, not constructor parameter properties: tsconfig sets
// erasableSyntaxOnly, which rejects `constructor(readonly status: number)`.
export class ApiError extends Error {
  status: number;
  body: unknown;

  constructor(status: number, body: unknown) {
    super(`request failed with ${status}`);
    this.name = "ApiError";
    this.status = status;
    this.body = body;
  }
}

type JsonBody = unknown;

async function request<T>(method: string, path: string, body?: JsonBody): Promise<T> {
  // Auth rides the httpOnly session cookie — credentials must be included for
  // cross-origin frontend/backend hosting (Render static + API).
  const res = await fetch(`${BASE}${path}`, {
    method,
    credentials: "include",
    headers: body === undefined ? undefined : { "Content-Type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  });

  // FastAPI reports request-validation failures as 422 with a {detail: [...]} body.
  if (!res.ok) {
    const errBody = await res.json().catch(() => null);
    throw new ApiError(res.status, errBody);
  }

  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

/** Multipart upload helper (admin image upload). Uses the same API base + cookies. */
export async function apiUpload<T>(path: string, form: FormData): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    method: "POST",
    credentials: "include",
    body: form,
  });
  if (!res.ok) {
    const errBody = await res.json().catch(() => null);
    throw new ApiError(res.status, errBody);
  }
  return (await res.json()) as T;
}

/**
 * Resolve product image URLs for cross-origin deploys.
 * Absolute http(s)/data/blob URLs and empty strings are left unchanged;
 * legacy relative "/api/media/..." paths are prefixed with VITE_API_URL when set.
 */
export function resolveMediaUrl(url: string): string {
  if (!url) return url;
  if (/^(https?:|data:|blob:)/i.test(url)) return url;
  if (!API_ORIGIN) return url;
  return url.startsWith("/") ? `${API_ORIGIN}${url}` : `${API_ORIGIN}/${url}`;
}

// The response type is yours to declare: nothing infers across the Python boundary, so a
// TS interface here mirrors the endpoint's Pydantic model by hand — keep the two in sync.
export const apiGet = <T>(path: string) => request<T>("GET", path);
export const apiPost = <T>(path: string, body?: JsonBody) => request<T>("POST", path, body ?? null);
export const apiPut = <T>(path: string, body?: JsonBody) => request<T>("PUT", path, body ?? null);
export const apiPatch = <T>(path: string, body?: JsonBody) =>
  request<T>("PATCH", path, body ?? null);
export const apiDelete = <T>(path: string) => request<T>("DELETE", path);
