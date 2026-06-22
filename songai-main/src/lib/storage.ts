import { mkdir, writeFile } from "fs/promises";
import path from "path";

const PUBLIC_DIR = path.join(process.cwd(), "public", "generated");

export async function ensureDir() {
  await mkdir(PUBLIC_DIR, { recursive: true });
}

/** Save a buffer/Blob into public/generated and return its public URL path. */
export async function savePublic(
  filename: string,
  data: Buffer | Uint8Array
): Promise<{ absPath: string; url: string }> {
  await ensureDir();
  const absPath = path.join(PUBLIC_DIR, filename);
  await writeFile(absPath, data);
  return { absPath, url: `/generated/${filename}` };
}

export async function saveUpload(
  jobId: string,
  kind: "photo" | "voice",
  file: File
): Promise<{ absPath: string; url: string }> {
  const ext = (file.name.split(".").pop() || "bin").toLowerCase();
  const buf = Buffer.from(await file.arrayBuffer());
  return savePublic(`${jobId}-${kind}.${ext}`, buf);
}

export function publicDirPath(filename: string) {
  return path.join(PUBLIC_DIR, filename);
}
