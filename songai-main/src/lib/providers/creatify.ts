/**
 * Creatify Aurora adapter — image + audio → studio-grade avatar video.
 *
 * This is an alternative to the RunComfy/OmniHuman provider (`runcomfy.ts`)
 * for the exact same job: songai has a portrait photo + a finished audio
 * track and needs a talking/singing avatar video. Per the `ai-avatar-video`
 * skill (Part 2.4), Aurora is built specifically for this "image + audio"
 * shape and is documented as best-in-class for lip-sync fidelity — a
 * reasonable alternative when RunComfy/OmniHuman isn't available, or to
 * compare quality between the two.
 *
 * Setup:
 *   1. Sign up at https://creatify.ai, then Settings → API for an API ID + key.
 *   2. In .env.local:
 *        VIDEO_PROVIDER=aurora
 *        CREATIFY_API_ID=...
 *        CREATIFY_API_KEY=...
 *
 * Cost/latency (from the skill's reference table): 5 credits per 30s,
 * roughly 2-3 minutes to render.
 */

import { pollUntil } from "../server-utils";

const BASE_URL = "https://api.creatify.ai/api";

function headers() {
  const id = process.env.CREATIFY_API_ID;
  const key = process.env.CREATIFY_API_KEY;
  if (!id || !key) {
    throw new Error("CREATIFY_API_ID / CREATIFY_API_KEY تنظیم نشده است");
  }
  return {
    "Content-Type": "application/json",
    "X-API-ID": id,
    "X-API-KEY": key,
  };
}

interface AuroraCreateResponse {
  id: string;
}

interface AuroraStatusResponse {
  id: string;
  status: "pending" | "in_queue" | "running" | "done" | "failed" | "error";
  output?: string;
  video_output?: string;
  failed_reason?: string;
}

/**
 * Generate an avatar video from a portrait photo + an audio track via
 * Creatify Aurora. imageUrl/audioUrl must be publicly reachable URLs.
 * Returns the buffer of the downloaded video.
 */
export async function lipSyncVideo(
  imageUrl: string,
  audioUrl: string
): Promise<Buffer> {
  const createRes = await fetch(`${BASE_URL}/aurora/`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify({
      image: imageUrl,
      audio: audioUrl,
      model_version: "aurora_v1_fast",
    }),
  });
  if (!createRes.ok) {
    throw new Error(
      `Creatify Aurora create failed: ${createRes.status} ${await createRes.text()}`
    );
  }
  const created = (await createRes.json()) as AuroraCreateResponse;
  if (!created.id) throw new Error("Creatify Aurora: پاسخ بدون id بود");

  const videoUrl = await poll(created.id);

  const fileRes = await fetch(videoUrl);
  if (!fileRes.ok) {
    throw new Error(`دانلود ویدیوی Aurora ناموفق بود: ${fileRes.status}`);
  }
  return Buffer.from(await fileRes.arrayBuffer());
}

async function poll(id: string): Promise<string> {
  return pollUntil<string>(
    async () => {
      const res = await fetch(`${BASE_URL}/aurora/${id}/`, { headers: headers() });
      if (!res.ok) return { status: "pending" };
      const json = (await res.json()) as AuroraStatusResponse;
      if (json.status === "done") {
        const url: string | undefined = json.output || json.video_output;
        if (!url) {
          return { status: "failed", reason: "status done اما url خروجی نبود" };
        }
        return { status: "done", value: url };
      }
      if (json.status === "failed" || json.status === "error") {
        return { status: "failed", reason: json.failed_reason || "نامشخص" };
      }
      return { status: "pending" };
    },
    { label: "Creatify Aurora", intervalMs: 10_000, timeoutMs: 600_000 }
  );
}
