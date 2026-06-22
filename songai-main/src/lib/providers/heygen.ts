/**
 * HeyGen Avatar V provider — generates a talking-head video from an avatar
 * speaking a given script. Used as an alternative to lipsync-from-photo
 * when the user wants a digital-twin avatar instead.
 *
 * Docs: https://docs.heygen.com/reference/create-video-v2
 * Set in .env.local:
 *   HEYGEN_API_KEY=<your-key>
 *   HEYGEN_AVATAR_ID=<avatar-id>   # from list_avatar_looks
 *   HEYGEN_VOICE_ID=<voice-id>     # from list_voices
 *   VIDEO_PROVIDER=heygen
 */

const API_BASE = "https://api.heygen.com";

function key() {
  const k = process.env.HEYGEN_API_KEY;
  if (!k) throw new Error("HEYGEN_API_KEY not set");
  return k;
}

type HeyGenVideoStatus = "pending" | "processing" | "completed" | "failed";

interface HeyGenVideoResponse {
  data?: { video_id: string };
  error?: string;
}

interface HeyGenStatusResponse {
  data?: {
    status: HeyGenVideoStatus;
    video_url?: string;
    error?: string;
  };
}

/**
 * Generate a HeyGen Avatar V video from a text script.
 * Returns the video as a Buffer.
 */
export async function generateAvatarVideo(script: string): Promise<Buffer> {
  const avatarId = process.env.HEYGEN_AVATAR_ID;
  const voiceId = process.env.HEYGEN_VOICE_ID;
  if (!avatarId) throw new Error("HEYGEN_AVATAR_ID not set");
  if (!voiceId) throw new Error("HEYGEN_VOICE_ID not set");

  const submitRes = await fetch(`${API_BASE}/v2/video/generate`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Api-Key": key(),
    },
    body: JSON.stringify({
      video_inputs: [
        {
          character: {
            type: "avatar",
            avatar_id: avatarId,
            avatar_style: "normal",
          },
          voice: {
            type: "text",
            input_text: script,
            voice_id: voiceId,
          },
        },
      ],
      dimension: { width: 1920, height: 1080 },
      aspect_ratio: "16:9",
      engine: { type: "avatar_v" },
    }),
  });

  if (!submitRes.ok) {
    throw new Error(
      `HeyGen submit failed: ${submitRes.status} ${await submitRes.text()}`
    );
  }

  const body = (await submitRes.json()) as HeyGenVideoResponse;
  const videoId = body.data?.video_id;
  if (!videoId) throw new Error(`HeyGen: no video_id in response`);

  const videoUrl = await pollVideo(videoId);

  const dlRes = await fetch(videoUrl);
  if (!dlRes.ok) throw new Error(`HeyGen: download failed ${dlRes.status}`);
  return Buffer.from(await dlRes.arrayBuffer());
}

async function pollVideo(videoId: string): Promise<string> {
  const startMs = Date.now();
  const timeoutMs = 10 * 60 * 1000; // 10 min

  while (Date.now() - startMs < timeoutMs) {
    await new Promise((r) => setTimeout(r, 5000));

    const res = await fetch(
      `${API_BASE}/v1/video_status.get?video_id=${videoId}`,
      { headers: { "X-Api-Key": key() } }
    );

    if (!res.ok) continue;
    const body = (await res.json()) as HeyGenStatusResponse;
    const data = body.data;

    if (data?.status === "completed" && data.video_url) return data.video_url;
    if (data?.status === "failed")
      throw new Error(`HeyGen video failed: ${data.error}`);
  }

  throw new Error("HeyGen: timed out waiting for video");
}
