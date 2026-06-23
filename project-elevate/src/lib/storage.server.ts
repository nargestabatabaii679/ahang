/**
 * Media storage backed by the local filesystem.
 * Files are saved to public/media/ and served as static assets.
 * Drop-in replacement for the Supabase Storage version.
 */

import { writeFileSync, mkdirSync } from "fs";
import { join } from "path";

// In production Docker (/app), use absolute path. In dev, relative to cwd.
const MEDIA_DIR =
  process.env.NODE_ENV === "production"
    ? "/app/public/media"
    : join(process.cwd(), "public", "media");
const MEDIA_URL_PREFIX = "/media";

mkdirSync(MEDIA_DIR, { recursive: true });

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
