/**
 * HTTP client for the Phala Sathhi backend (Cloudflare Worker), per api_integration.md.
 * Every response uses the envelope { ok: true, data } | { ok: false, error: { code, message } }.
 */

/** Base URL. Override with NEXT_PUBLIC_API_BASE (suggested in api_integration.md §10). */
export const API_BASE = (process.env.NEXT_PUBLIC_API_BASE || "https://phala-sathhi.naman-ee1.workers.dev").replace(/\/+$/, "");

/** Documented error codes, plus NETWORK for a failed fetch (offline / unreachable). */
export type ApiErrorCode =
  | "BAD_REQUEST" | "BELOW_MIN" | "INSUFFICIENT" | "UNAUTHENTICATED" | "INVALID_CREDENTIALS"
  | "TASK_NOT_FOUND" | "NOT_FOUND" | "MOBILE_EXISTS" | "PENDING_EXISTS" | "BACKEND_UNAVAILABLE"
  | "UNAUTHORIZED_ORIGIN" | "INTERNAL" | "NETWORK"
  // from /api/upload
  | "BAD_FILE_TYPE" | "FILE_TOO_LARGE" | "STORAGE_ERROR" | "STORAGE_NOT_CONFIGURED";

export class ApiError extends Error {
  constructor(public code: ApiErrorCode | string, message: string, public status: number) {
    super(message);
  }
}

/* ---------- session token (never expires; logout = delete it) ---------- */
const TOKEN_KEY = "phala_token";

export const session = {
  get(): string | null {
    try { return localStorage.getItem(TOKEN_KEY); } catch { return null; }
  },
  set(token: string) {
    try { localStorage.setItem(TOKEN_KEY, token); } catch { /* storage unavailable */ }
  },
  clear() {
    try { localStorage.removeItem(TOKEN_KEY); } catch { /* storage unavailable */ }
  },
};

let onUnauthenticated: (() => void) | null = null;
/** Called after the token is cleared because the server answered UNAUTHENTICATED. */
export function setUnauthenticatedHandler(fn: (() => void) | null) {
  onUnauthenticated = fn;
}

/** Reads the { ok, data } envelope; clears the session on UNAUTHENTICATED. */
async function readEnvelope<T>(res: Response): Promise<T> {
  let json: unknown;
  try {
    json = await res.json();
  } catch {
    throw new ApiError(res.status >= 500 ? "BACKEND_UNAVAILABLE" : "INTERNAL", "Invalid response from server", res.status);
  }
  const env = json as { ok?: boolean; data?: unknown; error?: { code?: string; message?: string } };
  if (!env || typeof env !== "object" || typeof env.ok !== "boolean") {
    throw new ApiError("INTERNAL", "Unexpected response shape", res.status);
  }
  if (!env.ok) {
    const code = env.error?.code || "INTERNAL";
    if (code === "UNAUTHENTICATED") {
      session.clear();
      onUnauthenticated?.();
    }
    throw new ApiError(code, env.error?.message || code, res.status);
  }
  return env.data as T;
}

/**
 * Uploads a photo/audio file to this app's own server route (/api/upload), which stores it
 * in Supabase Storage. Not the Worker: the storage key must stay on the server.
 */
export async function uploadFile(file: File, kind: "photo" | "audio"): Promise<{ key: string; url: string }> {
  const token = session.get();
  const fd = new FormData();
  fd.append("kind", kind);
  fd.append("file", file, file.name || kind);
  let res: Response;
  try {
    res = await fetch("/api/upload", {
      method: "POST",
      cache: "no-store",
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: fd,
    });
  } catch {
    throw new ApiError("NETWORK", "Network request failed", 0);
  }
  return readEnvelope(res);
}

export async function api<T>(method: "GET" | "POST", path: string, body?: unknown): Promise<T> {
  const token = session.get();
  let res: Response;
  try {
    res = await fetch(API_BASE + path, {
      method,
      cache: "no-store",
      headers: {
        ...(body !== undefined ? { "Content-Type": "application/json" } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new ApiError("NETWORK", "Network request failed", 0);
  }

  return readEnvelope<T>(res);
}
