/**
 * Higgsfield.ai video provider — portrait photo + audio → cinematic avatar video.
 *
 * Higgsfield's API generates short animated videos from a face image, supporting
 * various motion presets. We use the "portrait" style for the singing avatar use-case.
 *
 * Docs: https://higgsfield.ai/api
 * Set in .env.local:
 *   HIGGSFIELD_API_KEY=<uuid-key>
 *   HIGGSFIELD_API_SECRET=<hex-secret>    # optional signing secret
 *   VIDEO_PROVIDER=higgsfield
 */

const API_BASE = "https://api.higgsfield.ai/v1";

function creds() {
  const key = process.env.HIGGSFIELD_API_KEY;
  if (!key) throw new Error("HIGGSFIELD_API_KEY not set");
  return key;
}

type HiggsJob = {
  id: string;
  status: "pending" | "processing" | "completed" | "failed";
  video_url?: string;
  error?: string;
};

/**
 * Generate a talking-head video from a portrait photo + audio.
 * Returns the final video as a Buffer.
 */
export async function lipSyncVideo(
  imageUrl: string,
  audioUrl: string
): Promise<Buffer> {
  const key = creds();

  // Submit generation job
  const submitRes = await fetch(`${API_BASE}/video/generate`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${key}`,
      "X-Api-Secret": process.env.HIGGSFIELD_API_SECRET || "",
    },
    body: JSON.stringify({
      type: "portrait",
      image_url: imageUrl,
      audio_url: audioUrl,
      duration: 30,
      motion_strength: 0.7,
      output_format: "mp4",
    }),
  });

  if (!submitRes.ok) {
    throw new Error(
      `Higgsfield submit failed: ${submitRes.status} ${await submitRes.text()}`
    );
  }

  const { id } = (await submitRes.json()) as { id: string };
  if (!id) throw new Error("Higgsfield: missing job id");

  const videoUrl = await pollJob(id, key);

  const dlRes = await fetch(videoUrl);
  if (!dlRes.ok) throw new Error(`Higgsfield: download failed: ${dlRes.status}`);
  return Buffer.from(await dlRes.arrayBuffer());
}

async function pollJob(id: string, key: string): Promise<string> {
  const startMs = Date.now();
  const timeoutMs = 8 * 60 * 1000;

  while (Date.now() - startMs < timeoutMs) {
    await new Promise((r) => setTimeout(r, 5000));

    const res = await fetch(`${API_BASE}/video/${id}`, {
      headers: { Authorization: `Bearer ${key}` },
    });

    if (!res.ok) continue;
    const job = (await res.json()) as HiggsJob;

    if (job.status === "completed" && job.video_url) return job.video_url;
    if (job.status === "failed") throw new Error(`Higgsfield: ${job.error}`);
  }

  throw new Error("Higgsfield: timed out");
}
