/**
 * Suno adapter — wraps a self-hosted gcui-art/suno-api proxy.
 */

import { pollUntil } from "../server-utils";

const BASE = () =>
  (process.env.SUNO_API_BASE || "").replace(/\/$/, "");

type SunoClip = {
  id: string;
  status: string;
  audio_url?: string;
  error_message?: string;
};

export interface MusicPrompt {
  tags: string;
  description: string;
}

const UNIVERSAL_EXCLUDE =
  "Vocals, Singing, Rap Vocals, Lead Vocal, Pop Hooks, Auto-tune";

export async function generateMusic(
  { tags, description }: MusicPrompt,
  title = "songai track"
): Promise<string> {
  if (!BASE()) throw new Error("SUNO_API_BASE تنظیم نشده است");

  const res = await fetch(`${BASE()}/api/custom_generate`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(process.env.SUNO_API_KEY
        ? { Authorization: `Bearer ${process.env.SUNO_API_KEY}` }
        : {}),
    },
    body: JSON.stringify({
      prompt: description,
      tags,
      negative_tags: UNIVERSAL_EXCLUDE,
      title: title.slice(0, 80),
      make_instrumental: true,
      wait_audio: false,
    }),
  });
  if (!res.ok) throw new Error(`Suno generate failed: ${res.status} ${await res.text()}`);
  const clips = (await res.json()) as SunoClip[];
  const id = clips?.[0]?.id;
  if (!id) throw new Error("Suno: id missing in generate response");
  return poll(id);
}

async function poll(id: string): Promise<string> {
  return pollUntil<string>(
    async () => {
      const res = await fetch(`${BASE()}/api/get?ids=${encodeURIComponent(id)}`);
      if (!res.ok) return { status: "pending" };
      const clips = (await res.json()) as SunoClip[];
      const clip = clips?.[0];
      if (!clip) return { status: "pending" };
      if (clip.error_message) return { status: "failed", reason: clip.error_message };
      if (
        (clip.status === "streaming" || clip.status === "complete") &&
        clip.audio_url
      ) {
        return { status: "done", value: clip.audio_url };
      }
      return { status: "pending" };
    },
    { label: "Suno", intervalMs: 5000, timeoutMs: 300_000 }
  );
}
