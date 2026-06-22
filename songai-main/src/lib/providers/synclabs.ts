/**
 * Sync.so lipsync provider — image + audio → talking-head video.
 *
 * Sync.so's wav2lip++ model accepts a still portrait image + audio and
 * returns a lipsync MP4, making it a direct alternative to RunComfy/OmniHuman
 * for the same "portrait photo + audio → avatar video" job.
 *
 * Docs: https://docs.sync.so/api-reference
 * Set in .env.local:
 *   SYNCLABS_API_KEY=sk-...
 *   VIDEO_PROVIDER=synclabs
 */

import { readFile } from "fs/promises";
import { withTempDir } from "../server-utils";
import path from "path";

const API_BASE = "https://api.sync.so/v2";

function key() {
  const k = process.env.SYNCLABS_API_KEY;
  if (!k) throw new Error("SYNCLABS_API_KEY not set");
  return k;
}

type SyncJob = {
  id: string;
  status: "PENDING" | "PROCESSING" | "COMPLETED" | "FAILED";
  outputUrl?: string;
  error?: string;
};

/**
 * Submit a lipsync job and poll until it's done.
 * Returns the final video as a Buffer so it can be passed through
 * stripVideoMetadata (same as every other video provider).
 */
export async function lipSyncVideo(
  imageUrl: string,
  audioUrl: string
): Promise<Buffer> {
  // Submit
  const submitRes = await fetch(`${API_BASE}/generate`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": key(),
    },
    body: JSON.stringify({
      model: "wav2lip++",
      input: [
        { type: "image", url: imageUrl },
        { type: "audio", url: audioUrl },
      ],
      options: { output_format: "mp4", face_det_conf: 0.85 },
    }),
  });

  if (!submitRes.ok) {
    throw new Error(
      `Sync.so submit failed: ${submitRes.status} ${await submitRes.text()}`
    );
  }

  const { id } = (await submitRes.json()) as { id: string };
  if (!id) throw new Error("Sync.so: missing job id in response");

  // Poll
  const outputUrl = await pollJob(id);

  // Download and return as Buffer
  const dlRes = await fetch(outputUrl);
  if (!dlRes.ok) throw new Error(`Sync.so: download failed: ${dlRes.status}`);
  return Buffer.from(await dlRes.arrayBuffer());
}

async function pollJob(id: string): Promise<string> {
  const startMs = Date.now();
  const timeoutMs = 5 * 60 * 1000; // 5 min
  const intervalMs = 4000;

  while (Date.now() - startMs < timeoutMs) {
    await new Promise((r) => setTimeout(r, intervalMs));

    const res = await fetch(`${API_BASE}/generate/${id}`, {
      headers: { "x-api-key": key() },
    });

    if (!res.ok) continue;
    const job = (await res.json()) as SyncJob;

    if (job.status === "COMPLETED" && job.outputUrl) return job.outputUrl;
    if (job.status === "FAILED") throw new Error(`Sync.so job failed: ${job.error}`);
  }

  throw new Error("Sync.so: timed out waiting for lipsync video");
}
