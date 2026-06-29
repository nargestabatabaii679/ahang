/**
 * Media storage backed by the local filesystem.
 * Files are saved to public/media/ and served as static assets.
 * Drop-in replacement for the Supabase Storage version.
 */

import { writeFileSync, mkdirSync } from "fs";
import { join } from "path";

// MEDIA_DIR priority: env var → <cwd>/media → /tmp/media (always writable fallback)
function resolveMediaDir(): string {
  const candidates = [
    process.env.MEDIA_DIR,
    join(process.cwd(), "media"),
    "/tmp/media",
  ];
  for (const dir of candidates) {
    if (!dir) continue;
    try {
      mkdirSync(dir, { recursive: true });
      return dir;
    } catch {
      // try next
    }
  }
  return "/tmp/media";
}

const MEDIA_DIR = resolveMediaDir();
const MEDIA_URL_PREFIX = "/media";
console.log("[storage] MEDIA_DIR =", MEDIA_DIR);

function contentTypeFromName(name: string): string {
  const ext = name.toLowerCase().split(".").pop() || "";
  switch (ext) {
    case "mp3":  return "audio/mpeg";
    case "wav":  return "audio/wav";
    case "ogg":  return "audio/ogg";
    case "webm": return "audio/webm";
    case "m4a":
    case "mp4":  return "video/mp4";
    case "flac": return "audio/flac";
    case "aac":  return "audio/aac";
    case "jpg":
    case "jpeg": return "image/jpeg";
    case "png":  return "image/png";
    case "webp": return "image/webp";
    case "gif":  return "image/gif";
    default:     return "application/octet-stream";
  }
}

/**
 * Audio/video/image files served from /media/** are configured with
 * Cache-Control: public, max-age=31536000, immutable via nitro routeRules
 * in vite.config.ts. Filenames include the jobId so they are content-addressed.
 */
export async function savePublic(
  filename: string,
  data: ArrayBuffer | Uint8Array | Blob,
  _contentType?: string
): Promise<{ path: string; url: string }> {
  const ab: ArrayBuffer =
    data instanceof Blob
      ? await data.arrayBuffer()
      : data instanceof Uint8Array
      ? (data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength) as ArrayBuffer)
      : data;

  const filePath = join(MEDIA_DIR, filename);
  writeFileSync(filePath, Buffer.from(ab));

  return {
    path: filePath,
    url: `${MEDIA_URL_PREFIX}/${filename}`,
  };
}

export async function saveUpload(
  jobId: string,
  kind: "photo" | "voice",
  file: File
): Promise<{ path: string; url: string }> {
  const ext = (file.name.split(".").pop() || "bin").toLowerCase();
  return savePublic(`${jobId}-${kind}.${ext}`, await file.arrayBuffer(), file.type);
}

export async function fetchBytes(url: string): Promise<Uint8Array> {
  // Handle local /media/ paths
  if (url.startsWith("/media/")) {
    const { readFileSync } = await import("fs");
    const filePath = join(MEDIA_DIR, url.slice("/media/".length));
    return new Uint8Array(readFileSync(filePath));
  }
  const res = await fetch(url);
  if (!res.ok) throw new Error(`fetchBytes failed ${res.status} for ${url}`);
  return new Uint8Array(await res.arrayBuffer());
}
