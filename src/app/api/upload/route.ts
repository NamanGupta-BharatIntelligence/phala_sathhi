import { getPublicUrl, makeKey, storageConfigured, uploadFile } from "@/lib/server/storage";

/**
 * POST /api/upload — multipart form: file=<binary>, kind=photo|audio
 * Header: Authorization: Bearer <phala token> (same token as the Worker API).
 * → { ok: true, data: { key, url } } | { ok: false, error: { code, message } }
 *
 * Runs on the Next.js server (Vercel) because it holds the storage secret.
 * Runs on the Node.js runtime (the default). Vercel caps request bodies at ~4.5 MB, so files are limited to 4 MB.
 */
const API_BASE = (process.env.NEXT_PUBLIC_API_BASE || "https://phala-sathhi.naman-ee1.workers.dev").replace(/\/+$/, "");
const MAX_BYTES = 4 * 1024 * 1024;
const TYPES = { photo: "image/", audio: "audio/" } as const;

const BY_EXT: Record<string, string> = {
  jpg: "image/jpeg", jpeg: "image/jpeg", png: "image/png", webp: "image/webp", heic: "image/heic", heif: "image/heif",
  webm: "audio/webm", m4a: "audio/mp4", mp4: "audio/mp4", aac: "audio/aac", mp3: "audio/mpeg", ogg: "audio/ogg",
  opus: "audio/ogg", oga: "audio/ogg", wav: "audio/wav", amr: "audio/amr", "3gp": "audio/3gpp",
};

/**
 * Normalised MIME type. Phones label voice notes inconsistently: a .webm/.mp4/.3gp voice note can
 * arrive as video/*, and some file pickers send no type at all, so fall back to the extension.
 */
function fileType(file: File, kind: "photo" | "audio") {
  let type = (file.type || "").split(";")[0].trim().toLowerCase();
  if (!type || type === "application/octet-stream") type = BY_EXT[file.name.split(".").pop()?.toLowerCase() || ""] || type;
  if (kind === "audio" && /^video\/(webm|mp4|3gpp|ogg)$/.test(type)) type = type.replace("video/", "audio/");
  return type;
}

const fail = (status: number, code: string, message: string) =>
  Response.json({ ok: false, error: { code, message } }, { status });

/** Confirms the token with the Worker (GET /profile) and returns the Saathi's u_id. */
async function userFor(req: Request): Promise<string | null | "down"> {
  const auth = req.headers.get("authorization");
  if (!auth?.startsWith("Bearer ")) return null;
  try {
    const origin = req.headers.get("origin") || new URL(req.url).origin;
    const res = await fetch(`${API_BASE}/profile`, {
      headers: { Authorization: auth, Origin: origin },
      cache: "no-store",
    });
    const json = (await res.json()) as { ok?: boolean; data?: { u_id?: string }; error?: { code?: string } };
    if (json.ok && json.data?.u_id) return json.data.u_id;
    return json.error?.code === "UNAUTHENTICATED" ? null : "down";
  } catch {
    return "down";
  }
}

export async function POST(req: Request) {
  if (!storageConfigured()) return fail(503, "STORAGE_NOT_CONFIGURED", "File storage is not set up");

  const uid = await userFor(req);
  if (uid === null) return fail(401, "UNAUTHENTICATED", "token missing/invalid");
  if (uid === "down") return fail(503, "BACKEND_UNAVAILABLE", "Could not verify the session");

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return fail(400, "BAD_REQUEST", "Expected multipart form data");
  }
  const file = form.get("file");
  const kind = form.get("kind");
  if (!(file instanceof File) || file.size === 0) return fail(400, "BAD_REQUEST", "file missing");
  if (kind !== "photo" && kind !== "audio") return fail(400, "BAD_REQUEST", "kind must be photo or audio");
  const type = fileType(file, kind);
  if (!type.startsWith(TYPES[kind])) return fail(400, "BAD_FILE_TYPE", `Expected ${TYPES[kind]}*`);
  if (file.size > MAX_BYTES) return fail(413, "FILE_TOO_LARGE", "File is larger than 4 MB");

  const key = makeKey(`${uid}/${kind}`, file.name || `${kind}.bin`);
  try {
    await uploadFile(key, new Uint8Array(await file.arrayBuffer()), type);
  } catch (e) {
    console.error("[upload]", e);
    return fail(502, "STORAGE_ERROR", "Could not save the file");
  }
  return Response.json({ ok: true, data: { key, url: getPublicUrl(key) } });
}
