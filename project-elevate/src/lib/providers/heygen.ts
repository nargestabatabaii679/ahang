/**
 * HeyGen Avatar V provider — generates a talking-head avatar video from text.
 * Worker-safe (fetch only, no Node.js APIs).
 *
 * Set in .env:
 *   HEYGEN_API_KEY=<your-key>
 *   HEYGEN_AVATAR_ID=<avatar-id>   # from list_avatar_looks
 *   HEYGEN_VOICE_ID=<voice-id>     # from list_voices
 *   VIDEO_PROVIDER=heygen
 */

import { pollUntil } from "../server-utils";

const API_BASE = "https://api.heygen.com";

function key() {
  const k = process.env.HEYGEN_API_KEY;
  if (!k) throw new Error("HEYGEN_API_KEY not set");
  return k;
}

interface HeyGenGenerateResponse {
  data?: { video_id: string };
  error?: { message: string };
}

interface HeyGenStatusResponse {
  data?: {
    status: "pending" | "processing" | "completed" | "failed";
    video_url?: string;
    error?: string;
  };
}

/** Generate an Avatar V video from a text script. Returns raw bytes. */
export async function generateAvatarVideo(script: string): Promise<Uint8Array> {
  const avatarId = process.env.HEYGEN_AVATAR_ID;
  const voiceId = process.env.HEYGEN_VOICE_ID;
  if (!avatarId) throw new Error("HEYGEN_AVATAR_ID not set");
  if (!voiceId) throw new Error("HEYGEN_VOICE_ID not set");

  const res = await fetch(`${API_BASE}/v2/video/generate`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Api-Key": key(),
    },
    body: JSON.stringify({
      video_inputs: [
        {
          character: { type: "avatar", avatar_id: avatarId, avatar_style: "normal" },
          voice: { type: "text", input_text: script, voice_id: voiceId },
        },
      ],
      dimension: { width: 1920, height: 1080 },
      aspect_ratio: "16:9",
      engine: { type: "avatar_v" },
    }),
  });

  if (!res.ok) {
    throw new Error(`HeyGen submit failed: ${res.status} ${await res.text()}`);
  }

  const body = (await res.json()) as HeyGenGenerateResponse;
  const videoId = body.data?.video_id;
  if (!videoId) throw new Error(`HeyGen: no video_id — ${body.error?.message}`);

  const videoUrl = await pollUntil<string>(
    async () => {
      const r = await fetch(`${API_BASE}/v1/video_status.get?video_id=${videoId}`, {
        headers: { "X-Api-Key": key() },
      });
      if (!r.ok) return { status: "pending" };
      const j = (await r.json()) as HeyGenStatusResponse;
      const d = j.data;
      if (d?.status === "completed" && d.video_url) {
        return { status: "done", value: d.video_url };
      }
      if (d?.status === "failed") {
        return { status: "failed", reason: d.error || "HeyGen video failed" };
      }
      return { status: "pending" };
    },
    { label: "HeyGen Avatar V", intervalMs: 6_000, timeoutMs: 600_000 }
  );

  const dl = await fetch(videoUrl);
  if (!dl.ok) throw new Error(`HeyGen: download failed ${dl.status}`);
  return new Uint8Array(await dl.arrayBuffer());
}
