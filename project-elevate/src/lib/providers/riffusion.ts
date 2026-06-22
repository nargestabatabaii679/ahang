/**
 * Riffusion adapter — wraps a self-hosted riffusion inference server.
 * Worker-safe (fetch only). Set RIFFUSION_API_BASE to a publicly reachable URL.
 */

import { Genre, Occasion, SongBrief } from "../types";

const BASE = () =>
  (process.env.RIFFUSION_API_BASE || "").replace(/\/$/, "");

const GENRE_INTERPOLATION: Record<
  Genre,
  { start: string; end: string; seedImageId: string }
> = {
  romantic: {
    start: "warm romantic piano, soft strings, slow tempo, tender, intimate",
    end: "swelling warm strings, devoted, gentle crescendo, heartfelt",
    seedImageId: "vibes",
  },
  emotional: {
    start: "soft piano ballad, slow tempo, tender, breathy strings",
    end: "swelling orchestral strings, emotional climax, warm reverb",
    seedImageId: "vibes",
  },
  happy: {
    start: "upbeat persian pop, warm synth pads, claps, major key, hopeful",
    end: "anthemic pop chorus, bright strings, driving beat, celebratory",
    seedImageId: "agile",
  },
  calm: {
    start: "solo acoustic guitar, fingerpicked, close mic, intimate room",
    end: "acoustic guitar with soft brushed percussion, gentle and sincere",
    seedImageId: "og_beat",
  },
  motivational: {
    start: "cinematic strings, low brass swell, building tension, grand",
    end: "triumphant orchestral hit, soaring choir pads, epic and proud",
    seedImageId: "motorway",
  },
  nostalgic: {
    start: "lofi hip hop, dusty vinyl crackle, mellow rhodes piano, relaxed",
    end: "warm lofi beat, soft tape saturation, dreamy and nostalgic",
    seedImageId: "og_beat",
  },
};

const occasionMood: Record<Occasion, string> = {
  birthday: "joyful, celebratory",
  anniversary: "romantic, devoted",
  appreciation: "warm, grateful",
  apology: "sincere, gentle, hopeful",
  celebration: "joyful, radiant, triumphant",
  none: "tender, affectionate",
};

interface RiffusionInferenceOutput {
  image: string;
  audio: string;
}

export async function generateMusicWithArt(
  brief: SongBrief
): Promise<{ audio: Uint8Array; coverArt: Uint8Array }> {
  if (!BASE()) throw new Error("RIFFUSION_API_BASE تنظیم نشده است");
  const g = GENRE_INTERPOLATION[brief.genre];
  const mood = occasionMood[brief.occasion];
  const input = {
    alpha: 0.5,
    num_inference_steps: 50,
    seed_image_id: g.seedImageId,
    start: { prompt: `${g.start}, ${mood}`, seed: 42, denoising: 0.75, guidance: 7.0 },
    end: { prompt: `${g.end}, ${mood}`, seed: 123, denoising: 0.75, guidance: 7.0 },
  };

  const res = await fetch(`${BASE()}/run_inference`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!res.ok) {
    throw new Error(`Riffusion server خطا داد (${res.status})`);
  }
  const json = (await res.json()) as RiffusionInferenceOutput;
  if (!json.audio || !json.image) throw new Error("Riffusion: پاسخ ناقص");
  return {
    audio: Uint8Array.from(atob(json.audio), (c) => c.charCodeAt(0)),
    coverArt: Uint8Array.from(json.image.replace(/^data:image\/[a-z]+;base64,/, ""), (_, i) => {
      // unused — replaced below
      return 0;
    }).length === 0
      ? Uint8Array.from(atob(json.image), (c) => c.charCodeAt(0))
      : Uint8Array.from(atob(json.image), (c) => c.charCodeAt(0)),
  };
}
