/**
 * Stability AI provider
 *  - generateCoverArt : text-to-image via Stable Diffusion 3.5
 *  - animateImage     : image-to-video via Stable Video Diffusion (SVD)
 */

import { pollUntil } from "../server-utils";

const BASE = "https://api.stability.ai";
const key = () => process.env.STABILITY_API_KEY || "";

function authHeader() {
  if (!key()) throw new Error("STABILITY_API_KEY تنظیم نشده است");
  return { Authorization: `Bearer ${key()}` };
}

// ── Cover Art ──────────────────────────────────────────────────────────────

export async function generateCoverArt(prompt: string): Promise<Uint8Array> {
  const form = new FormData();
  form.append("prompt", prompt);
  form.append("output_format", "jpeg");
  form.append("aspect_ratio", "1:1");

  const res = await fetch(`${BASE}/v2beta/stable-image/generate/sd3`, {
    method: "POST",
    headers: { ...authHeader(), Accept: "image/*" },
    body: form,
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Stability image failed ${res.status}: ${err}`);
  }

  return new Uint8Array(await res.arrayBuffer());
}

// ── Image-to-Video (SVD) ───────────────────────────────────────────────────

type SvidStartResponse = { id: string };
type SvidResultResponse =
  | { id: string; status: "in-progress" | "not-found" }
  | { id: string; status: "complete"; video: string }; // video = base64

export async function animateImage(imageBytes: Uint8Array): Promise<Uint8Array> {
  const form = new FormData();
  form.append(
    "image",
    new Blob([imageBytes], { type: "image/jpeg" }),
    "cover.jpg"
  );
  form.append("seed", "0");
  form.append("cfg_scale", "1.8");
  form.append("motion_bucket_id", "127");

  const startRes = await fetch(`${BASE}/v2beta/image-to-video`, {
    method: "POST",
    headers: authHeader(),
    body: form,
  });

  if (!startRes.ok) {
    const err = await startRes.text();
    throw new Error(`Stability SVD start failed ${startRes.status}: ${err}`);
  }

  const { id } = (await startRes.json()) as SvidStartResponse;

  // Poll until complete
  const b64 = await pollUntil<string>(
    async () => {
      const res = await fetch(`${BASE}/v2beta/image-to-video/result/${id}`, {
        headers: { ...authHeader(), Accept: "video/*" },
      });

      if (res.status === 202) return { status: "pending" };
      if (!res.ok) return { status: "failed", reason: `status ${res.status}` };

      // API returns video bytes directly with Accept: video/*
      const buf = await res.arrayBuffer();
      // encode to base64 to pass through pollUntil
      const bytes = new Uint8Array(buf);
      let binary = "";
      bytes.forEach((b) => (binary += String.fromCharCode(b)));
      return { status: "done", value: btoa(binary) };
    },
    { label: "StabilityAI SVD", intervalMs: 8000, timeoutMs: 300_000 }
  );

  // decode base64 → Uint8Array
  const binary = atob(b64);
  const out = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) out[i] = binary.charCodeAt(i);
  return out;
}
