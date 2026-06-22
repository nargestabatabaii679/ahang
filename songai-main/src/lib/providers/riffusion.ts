/**
 * Riffusion adapter — wraps a self-hosted riffusion (riffusion-hobby) Flask
 * inference server: https://github.com/riffusion/riffusion
 *
 * Unlike a black-box text-to-music API, riffusion generates audio by running
 * Stable Diffusion on a spectrogram image and interpolating between a
 * `start` and `end` text prompt — so the request below is built as a real
 * two-point musical journey (e.g. "warm acoustic guitar, intimate" →
 * "tender Persian strings, hopeful"), not a single tag string.
 *
 * The server also returns the literal spectrogram image it diffused, which
 * we keep and surface as the song's cover art — it's not decoration, it's
 * the actual visual the model produced on the way to the audio.
 *
 * Setup (one-time, runs as a separate Python service — needs a GPU for
 * real-time generation; CPU works but is slow):
 *   git clone https://github.com/riffusion/riffusion riffusion-server
 *   cd riffusion-server && python -m pip install -r requirements.txt
 *   python -m riffusion.server --host 0.0.0.0 --port 3013
 *
 * Then in this project's .env.local:
 *   RIFFUSION_API_BASE=http://localhost:3013
 */

import { Genre, Occasion, SongBrief } from "../types";

const BASE = () =>
  (process.env.RIFFUSION_API_BASE || "http://localhost:3013").replace(/\/$/, "");

/** A start → end prompt pair plus the spectrogram seed image best suited
 *  to that genre's texture (riffusion conditions on an init spectrogram,
 *  so picking the right one changes the rhythmic "shape" of the result). */
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

interface RiffusionPromptInput {
  seed?: number;
  denoising?: number;
  guidance?: number;
  prompt: string;
}

interface RiffusionInferenceInput {
  alpha: number;
  num_inference_steps: number;
  seed_image_id: string;
  start: RiffusionPromptInput;
  end: RiffusionPromptInput;
}

interface RiffusionInferenceOutput {
  image: string; // base64 JPEG spectrogram
  audio: string; // base64 MP3 clip
}

export function buildInterpolation(brief: SongBrief): RiffusionInferenceInput {
  const g = GENRE_INTERPOLATION[brief.genre];
  const mood = occasionMood[brief.occasion];
  return {
    alpha: 0.5,
    num_inference_steps: 50,
    seed_image_id: g.seedImageId,
    start: { prompt: `${g.start}, ${mood}`, seed: 42, denoising: 0.75, guidance: 7.0 },
    end: { prompt: `${g.end}, ${mood}`, seed: 123, denoising: 0.75, guidance: 7.0 },
  };
}

/**
 * Run inference against the self-hosted riffusion server and return both
 * the generated audio and its spectrogram cover art as buffers.
 */
export async function generateMusicWithArt(
  brief: SongBrief
): Promise<{ audio: Buffer; coverArt: Buffer }> {
  const input = buildInterpolation(brief);

  const res = await fetch(`${BASE()}/run_inference`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Riffusion server خطا داد (${res.status}): ${body.slice(0, 300)}`);
  }

  const json = (await res.json()) as RiffusionInferenceOutput;
  if (!json.audio || !json.image) {
    throw new Error("Riffusion: پاسخ بدون audio/image بود");
  }

  return {
    audio: Buffer.from(json.audio, "base64"),
    coverArt: Buffer.from(json.image, "base64"),
  };
}
