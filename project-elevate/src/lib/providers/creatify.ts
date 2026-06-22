/**
 * Creatify Aurora adapter — image + audio → talking-head avatar video.
 * Worker-safe (fetch only).
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

interface AuroraCreateResponse { id: string }
interface AuroraStatusResponse {
  id: string;
  status: "pending" | "in_queue" | "running" | "done" | "failed" | "error";
  output?: string;
  video_output?: string;
  failed_reason?: string;
}

export async function lipSyncVideo(
  imageUrl: string,
  audioUrl: string
): Promise<Uint8Array> {
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
  return new Uint8Array(await fileRes.arrayBuffer());
}

async function poll(id: string): Promise<string> {
  return pollUntil<string>(
    async () => {
      const res = await fetch(`${BASE_URL}/aurora/${id}/`, { headers: headers() });
      if (!res.ok) return { status: "pending" };
      const json = (await res.json()) as AuroraStatusResponse;
      if (json.status === "done") {
        const url = json.output || json.video_output;
        if (!url) return { status: "failed", reason: "status done اما url خروجی نبود" };
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
