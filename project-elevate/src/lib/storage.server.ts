/**
 * Media storage backed by Lovable Cloud Storage (Supabase bucket
 * `songai-media`). Server-only.
 */

import { supabaseAdmin } from "@/integrations/supabase/client.server";

const BUCKET = "songai-media";

function contentTypeFromName(name: string): string {
  const ext = name.toLowerCase().split(".").pop() || "";
  switch (ext) {
    case "mp3": return "audio/mpeg";
    case "wav": return "audio/wav";
    case "ogg": return "audio/ogg";
    case "webm": return "audio/webm";
    case "m4a":
    case "mp4": return "audio/mp4";
    case "flac": return "audio/flac";
    case "aac": return "audio/aac";
    case "jpg":
    case "jpeg": return "image/jpeg";
    case "png": return "image/png";
    case "webp": return "image/webp";
    case "gif": return "image/gif";
    case "mp4v": return "video/mp4";
    case "mov": return "video/quicktime";
    default: return "application/octet-stream";
  }
}

export async function savePublic(
  filename: string,
  data: ArrayBuffer | Uint8Array | Blob,
  contentType?: string
): Promise<{ path: string; url: string }> {
  const ct = contentType ?? contentTypeFromName(filename);
  const ab: ArrayBuffer =
    data instanceof Blob
      ? await data.arrayBuffer()
      : data instanceof Uint8Array
      ? (data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength) as ArrayBuffer)
      : data;
  const body = new Blob([ab], { type: ct });
  const { error } = await supabaseAdmin.storage
    .from(BUCKET)
    .upload(filename, body, { contentType: ct, upsert: true });
  if (error) throw new Error(`storage upload failed: ${error.message}`);
  const { data: pub } = supabaseAdmin.storage.from(BUCKET).getPublicUrl(filename);
  return { path: filename, url: pub.publicUrl };
}

export async function saveUpload(
  jobId: string,
  kind: "photo" | "voice",
  file: File
): Promise<{ path: string; url: string }> {
  const ext = (file.name.split(".").pop() || "bin").toLowerCase();
  return savePublic(`${jobId}-${kind}.${ext}`, await file.arrayBuffer(), file.type);
}

/** Fetch a previously-saved media URL as a Buffer (Uint8Array). */
export async function fetchBytes(url: string): Promise<Uint8Array> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`fetchBytes failed ${res.status} for ${url}`);
  return new Uint8Array(await res.arrayBuffer());
}
