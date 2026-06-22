/**
 * Suno adapter — supports both sunoapi.org (cloud, bearer-auth) and
 * the self-hosted gcui-art/suno-api service.
 *
 * sunoapi.org (recommended — no local Docker needed):
 *   SUNO_API_KEY=<your-key-from-sunoapi.org>
 *   SUNO_API_BASE=https://api.sunoapi.org   # default when SUNO_API_KEY is set
 *
 * Self-hosted gcui-art/suno-api:
 *   SUNO_API_BASE=http://localhost:3001      # no SUNO_API_KEY needed
 */

import { pollUntil } from "../server-utils";

const BASE = () =>
  (process.env.SUNO_API_BASE || "https://api.sunoapi.org").replace(/\/$/, "");

/** Returns bearer-auth headers when SUNO_API_KEY is set (sunoapi.org mode). */
function authHeaders(): Record<string, string> {
  const k = process.env.SUNO_API_KEY;
  return k ? { Authorization: `Bearer ${k}` } : {};
}

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

/**
 * Universal exclusions, on top of whatever buildMusicPrompt's genre-specific
 * tags already exclude. Suno's "pop gravity well" pulls almost everything
 * toward generic pop production unless explicitly fenced off (see the
 * suno-song-creator skill's genre-cloud reference), and since our vocals
 * come from the cloned voice later in the pipeline — not from Suno — any
 * vocal artifact here is a defect, not a stylistic choice.
 *
 * NOTE: `negative_tags` mirrors Suno's web-UI "Exclude Styles" field and is
 * the field name gcui-art/suno-api is documented to expose, but this
 * couldn't be confirmed against a live instance in this environment — if
 * your fork/version doesn't support it, the proxy should just ignore the
 * extra key rather than error; verify once against your deployed service.
 */
const UNIVERSAL_EXCLUDE =
  "Vocals, Singing, Rap Vocals, Lead Vocal, Pop Hooks, Auto-tune";

/**
 * Generate an instrumental track from a genre-aware prompt.
 * Returns the public audio_url once the clip reaches "streaming" or "complete".
 */
export async function generateMusic(
  { tags, description }: MusicPrompt,
  title = "songai track"
): Promise<string> {
  // kick off generation (non-blocking, wait_audio=false)
  const res = await fetch(`${BASE()}/api/custom_generate`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify({
      prompt: description,
      tags,
      negative_tags: UNIVERSAL_EXCLUDE,
      title: title.slice(0, 80),
      make_instrumental: true,
      wait_audio: false,
    }),
  });

  if (!res.ok) {
    throw new Error(`Suno generate failed: ${res.status} ${await res.text()}`);
  }

  const clips = (await res.json()) as SunoClip[];
  const id = clips?.[0]?.id;
  if (!id) throw new Error("Suno: id missing in generate response");

  return poll(id);
}

async function poll(id: string): Promise<string> {
  return pollUntil<string>(
    async () => {
      const res = await fetch(`${BASE()}/api/get?ids=${encodeURIComponent(id)}`, {
        headers: { ...authHeaders() },
      });
      if (!res.ok) return { status: "pending" };

      const clips = (await res.json()) as SunoClip[];
      const clip = clips?.[0];
      if (!clip) return { status: "pending" };

      if (clip.error_message) {
        return { status: "failed", reason: clip.error_message };
      }

      // "streaming" = audio is already usable; "complete" = fully done
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
