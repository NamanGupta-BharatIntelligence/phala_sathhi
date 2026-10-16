/**
 * Photos and audio picked/recorded in a form, held in memory on this device until the form is sent.
 * Keyed by "<taskId>:<fieldKey>". On submit each file is uploaded (POST /api/upload → Supabase
 * Storage) and the form sends the file's link instead of the file.
 */
const files = new Map<string, File>();
/** Link of an already-uploaded file, so a retried submit doesn't upload it again. */
const uploaded = new Map<string, string>();

export const media = {
  get: (key: string) => files.get(key),
  has: (key: string) => files.has(key),
  set: (key: string, file: File) => { files.set(key, file); uploaded.delete(key); },
  delete: (key: string) => { files.delete(key); uploaded.delete(key); },
  uploadedUrl: (key: string) => uploaded.get(key),
  markUploaded: (key: string, url: string) => { uploaded.set(key, url); },
  /** Drop every file of one task (after a successful submit). */
  clearTask: (taskId: string) => {
    for (const k of [...files.keys()]) if (k.startsWith(`${taskId}:`)) { files.delete(k); uploaded.delete(k); }
  },
  clearAll: () => { files.clear(); uploaded.clear(); },
};

/** Largest file the upload route accepts (Vercel request limit is ~4.5 MB). */
export const MAX_UPLOAD_BYTES = 4 * 1024 * 1024;

/**
 * Shrinks a phone photo to at most 1600px (JPEG ~80%) before upload. A 4 MB camera photo
 * becomes ~300 KB. Returns the original when it is already small or the browser can't decode it
 * (e.g. HEIC on Android Chrome).
 */
export async function shrinkPhoto(file: File, maxSide = 1600, quality = 0.8): Promise<File> {
  if (!/^image\/(jpeg|png|webp)$/i.test(file.type) || typeof createImageBitmap === "undefined") return file;
  try {
    const bmp = await createImageBitmap(file);
    const scale = Math.min(1, maxSide / Math.max(bmp.width, bmp.height));
    if (scale === 1 && file.size <= 1024 * 1024) { bmp.close(); return file; }
    const w = Math.round(bmp.width * scale), h = Math.round(bmp.height * scale);
    const canvas = document.createElement("canvas");
    canvas.width = w; canvas.height = h;
    canvas.getContext("2d")?.drawImage(bmp, 0, 0, w, h);
    bmp.close();
    const blob = await new Promise<Blob | null>((r) => canvas.toBlob(r, "image/jpeg", quality));
    if (!blob || blob.size >= file.size) return file;
    return new File([blob], file.name.replace(/\.\w+$/, "") + ".jpg", { type: "image/jpeg" });
  } catch {
    return file;
  }
}
