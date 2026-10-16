import { createHash, createHmac, randomUUID } from "node:crypto";

/**
 * Supabase Storage through its S3-compatible endpoint (setup from the backend team's storage.ts).
 * SERVER ONLY (imported only by app/api/upload/route.ts): uses the secret S3 key. Never import this from a "use client" file and never put
 * the keys in a NEXT_PUBLIC_ variable.
 *
 * Requests are signed with AWS Signature V4 using Node's built-in crypto, so no SDK is needed.
 *
 * Env (.env.local locally, Project Settings → Environment Variables on Vercel):
 *   SUPABASE_S3_KEY_ID, SUPABASE_S3_SECRET          required
 *   SUPABASE_PROJECT_URL, SUPABASE_S3_REGION, SUPABASE_BUCKET   optional (defaults below)
 */
const PROJECT_URL = (process.env.SUPABASE_PROJECT_URL || "https://fysbonjjkchqgsmrpnhi.supabase.co").replace(/\/+$/, "");
const REGION = process.env.SUPABASE_S3_REGION || "ap-southeast-1";
export const BUCKET = process.env.SUPABASE_BUCKET || "phala_saathi_images";
const S3_ENDPOINT = `${PROJECT_URL.replace(".supabase.co", ".storage.supabase.co")}/storage/v1/s3`;

export const storageConfigured = () => !!(process.env.SUPABASE_S3_KEY_ID && process.env.SUPABASE_S3_SECRET);

const encKey = (key: string) => key.split("/").map(encodeURIComponent).join("/");

/** Public read URL (bucket must be public in Supabase). No signing, no expiry. */
export const getPublicUrl = (key: string) => `${PROJECT_URL}/storage/v1/object/public/${BUCKET}/${encKey(key)}`;

/** Unguessable key with a safe extension: "<folder>/<uuid>.<ext>". */
export const makeKey = (folder: string, filename: string) => {
  const ext = filename.split(".").pop()?.toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 8) || "bin";
  const dir = folder.split("/").map((s) => s.replace(/[^A-Za-z0-9_-]/g, "_")).filter(Boolean).join("/");
  return `${dir}/${randomUUID()}.${ext}`;
};

const sha256 = (data: string | Uint8Array) => createHash("sha256").update(data).digest("hex");
const hmac = (k: string | Buffer, data: string) => createHmac("sha256", k).update(data).digest();

/** AWS SigV4 headers for one request (path-style, unsigned query). Exported for tests. */
export function signV4(opts: {
  method: string; url: string; body: Uint8Array; contentType: string;
  keyId: string; secret: string; region: string; now?: Date;
}) {
  const u = new URL(opts.url);
  const amzDate = (opts.now ?? new Date()).toISOString().replace(/[:-]|\.\d{3}/g, "");
  const day = amzDate.slice(0, 8);
  const payloadHash = sha256(opts.body);
  const headers: Record<string, string> = {
    "content-type": opts.contentType,
    host: u.host,
    "x-amz-content-sha256": payloadHash,
    "x-amz-date": amzDate,
  };
  const names = Object.keys(headers).sort();
  const canonical = [
    opts.method,
    u.pathname, // already URI-encoded once (S3 rule)
    "",
    names.map((n) => `${n}:${headers[n].trim()}\n`).join(""),
    names.join(";"),
    payloadHash,
  ].join("\n");
  const scope = `${day}/${opts.region}/s3/aws4_request`;
  const toSign = ["AWS4-HMAC-SHA256", amzDate, scope, sha256(canonical)].join("\n");
  const kDate = hmac(`AWS4${opts.secret}`, day);
  const kSigning = hmac(hmac(hmac(kDate, opts.region), "s3"), "aws4_request");
  const signature = createHmac("sha256", kSigning).update(toSign).digest("hex");
  return {
    ...headers,
    authorization: `AWS4-HMAC-SHA256 Credential=${opts.keyId}/${scope}, SignedHeaders=${names.join(";")}, Signature=${signature}`,
  };
}

async function s3(method: "PUT" | "DELETE", key: string, body: Uint8Array = new Uint8Array(), contentType = "application/octet-stream") {
  const keyId = process.env.SUPABASE_S3_KEY_ID, secret = process.env.SUPABASE_S3_SECRET;
  if (!keyId || !secret) throw new Error("Storage keys are not configured");
  const url = `${S3_ENDPOINT}/${BUCKET}/${encKey(key)}`;
  const headers = signV4({ method, url, body, contentType, keyId, secret, region: REGION });
  delete (headers as Record<string, string>).host; // fetch sets Host itself
  const res = await fetch(url, { method, headers, body: method === "PUT" ? Buffer.from(body) : undefined, cache: "no-store" });
  if (!res.ok) {
    const xml = await res.text();
    const code = xml.match(/<Code>([^<]*)<\/Code>/)?.[1] ?? "";
    const msg = xml.match(/<Message>([^<]*)<\/Message>/)?.[1] ?? xml.slice(0, 300);
    throw new Error(`Storage ${method} failed: ${res.status} ${code} — ${msg} (endpoint ${S3_ENDPOINT}, region ${REGION}, bucket ${BUCKET})`);
  }
}

export const uploadFile = (key: string, body: Uint8Array, contentType: string) => s3("PUT", key, body, contentType);
export const deleteFile = (key: string) => s3("DELETE", key);
