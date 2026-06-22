/**
 * Stability AI provider
 *  - generateCoverArt : text-to-image via Stable Diffusion 3.5 Large
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
  form.append("negative_prompt",
    "text, watermark, signature, letters, numbers, words, logo, blurry, low quality, ugly, distorted, cropped, bad anatomy, worst quality, jpeg artifacts"
  );
  form.append("output_format", "jpeg");
  form.append("aspect_ratio", "1:1");
  form.append("cfg_scale", "7");

  // Try SD3.5 Large first, fall back to SD3 Medium
  for (const model of ["sd3.5-large", "sd3-medium"]) {
    const formCopy = new FormData();
    form.forEach((v, k) => formCopy.append(k, v));
    formCopy.append("model", model);

    const res = await fetch(`${BASE}/v2beta/stable-image/generate/sd3`, {
      method: "POST",
      headers: { ...authHeader(), Accept: "image/*" },
      body: formCopy,
    });

    if (res.ok) return new Uint8Array(await res.arrayBuffer());

    const err = await res.text();
    if (res.status === 402 || res.status === 403) throw new Error(`Stability credits: ${err}`);
    // 4xx on this model → try next
    console.warn(`[stability] ${model} failed ${res.status}, trying next model`);
  }

  throw new Error("Stability AI: all cover art models failed");
}

// ── Image-to-Video (SVD) ───────────────────────────────────────────────────

export async function animateImage(imageBytes: Uint8Array): Promise<Uint8Array> {
  const form = new FormData();
  form.append(
    "image",
    new Blob([imageBytes], { type: "image/jpeg" }),
    "cover.jpg"
  );
  // Higher cfg_scale = more faithful to image; motion_bucket_id 40-127
  // 60 gives smooth cinematic motion without too much warping
  form.append("cfg_scale", "2.5");
  form.append("motion_bucket_id", "60");
  form.append("seed", "42");

  const startRes = await fetch(`${BASE}/v2beta/image-to-video`, {
    method: "POST",
    headers: authHeader(),
    body: form,
  });

  if (!startRes.ok) {
    const err = await startRes.text();
    throw new Error(`Stability SVD start failed ${startRes.status}: ${err}`);
  }

  const { id } = (await startRes.json()) as { id: string };

  const b64 = await pollUntil<string>(
    async () => {
      const res = await fetch(`${BASE}/v2beta/image-to-video/result/${id}`, {
        headers: { ...authHeader(), Accept: "video/*" },
      });

      if (res.status === 202) return { status: "pending" };
      if (!res.ok) return { status: "failed", reason: `status ${res.status}` };

      const buf = await res.arrayBuffer();
      const bytes = new Uint8Array(buf);
      let binary = "";
      bytes.forEach((b) => (binary += String.fromCharCode(b)));
      return { status: "done", value: btoa(binary) };
    },
    { label: "StabilityAI SVD", intervalMs: 8000, timeoutMs: 300_000 }
  );

  const binary = atob(b64);
  const out = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) out[i] = binary.charCodeAt(i);
  return out;
}
