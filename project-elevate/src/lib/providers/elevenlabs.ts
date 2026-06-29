/**
 * ElevenLabs adapter — professional-grade voice cloning & music generation
 *
 * Architecture inspired by bitwize-music-skills production pipeline:
 * - Retry logic on all API calls (transient failures are common)
 * - Persian pronunciation preprocessing before TTS
 * - Per-genre voice settings (different music styles need different delivery)
 * - Quality gates: validate response before returning
 */

const api = () =>
  `${(process.env.ELEVENLABS_API_BASE || "https://api.elevenlabs.io").replace(/\/$/, "")}/v1`;

function key() {
  const k = process.env.ELEVENLABS_API_KEY;
  if (!k) throw new Error("ELEVENLABS_API_KEY تنظیم نشده است");
  return k;
}

function authHeaders(): Record<string, string> {
  const k = key();
  // sk_ prefix = new API key format → requires Bearer auth
  if (k.startsWith("sk_")) {
    return { Authorization: `Bearer ${k}` };
  }
  return { "xi-api-key": k };
}

// ── Retry helper ──────────────────────────────────────────────────────────

async function withRetry<T>(
  label: string,
  fn: () => Promise<T>,
  maxAttempts = 3,
  delayMs = 1500
): Promise<T> {
  let lastErr: Error | null = null;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (e) {
      lastErr = e as Error;
      const msg = lastErr.message ?? "";
      // Don't retry auth errors or bad request — they won't recover
      if (msg.includes("401") || msg.includes("403") || msg.includes("400")) {
        throw lastErr;
      }
      if (attempt < maxAttempts) {
        console.warn(`[elevenlabs] ${label} attempt ${attempt} failed: ${msg} — retrying in ${delayMs}ms`);
        await new Promise((r) => setTimeout(r, delayMs * attempt));
      }
    }
  }
  throw lastErr!;
}

// ── Voice Cloning ─────────────────────────────────────────────────────────

export async function cloneVoice(
  name: string,
  sample: Uint8Array,
  sampleMime = "audio/mpeg"
): Promise<string> {
  return withRetry("cloneVoice", async () => {
    const form = new FormData();
    // Sanitise name: ElevenLabs allows max 40 chars, Latin + Unicode
    const safeName = (name.trim().slice(0, 38) || "songai-voice");
    form.append("name", safeName);
    form.append("description", "Cloned for a personal Persian gift song via SongAI");

    const ab = sample.buffer.slice(
      sample.byteOffset,
      sample.byteOffset + sample.byteLength
    ) as ArrayBuffer;
    form.append(
      "files",
      new Blob([ab], { type: sampleMime }),
      "sample" + extFromMime(sampleMime)
    );
    // labels help ElevenLabs choose the right accent model
    form.append("labels", JSON.stringify({ language: "fa", use_case: "song" }));

    const res = await fetch(`${api()}/voices/add`, {
      method: "POST",
      headers: { ...authHeaders() },
      body: form,
    });
    if (!res.ok) {
      const body = await res.text();
      throw new Error(`ElevenLabs clone failed ${res.status}: ${body}`);
    }
    const json = (await res.json()) as { voice_id?: string };
    if (!json.voice_id) throw new Error("ElevenLabs clone returned no voice_id");
    console.log(`[elevenlabs] voice cloned: ${json.voice_id}`);
    return json.voice_id;
  });
}

// ── Per-genre voice settings ──────────────────────────────────────────────
// From bitwize-music-skills model strategy: creative output quality is tuned
// per genre — emotional genres need more variation, calm genres need stability.

type VoiceSettings = {
  stability: number;
  similarity_boost: number;
  style: number;
  use_speaker_boost: boolean;
};

const genreVoiceSettings: Record<string, VoiceSettings> = {
  // Romantic: warm, intimate, slightly breathy — lower stability for natural variation
  romantic:     { stability: 0.38, similarity_boost: 0.90, style: 0.72, use_speaker_boost: true },
  // Emotional: raw delivery, strong style exaggeration, stay very close to original voice
  emotional:    { stability: 0.32, similarity_boost: 0.92, style: 0.78, use_speaker_boost: true },
  // Happy: energetic, clear, upbeat — higher stability keeps it punchy
  happy:        { stability: 0.55, similarity_boost: 0.80, style: 0.58, use_speaker_boost: true },
  // Calm: steady, gentle, minimal variation — high stability, no boost needed
  calm:         { stability: 0.65, similarity_boost: 0.85, style: 0.40, use_speaker_boost: false },
  // Motivational: powerful, strong — moderate stability with high style
  motivational: { stability: 0.42, similarity_boost: 0.82, style: 0.75, use_speaker_boost: true },
  // Nostalgic: soft, slightly trembling — low stability for wistful quality
  nostalgic:    { stability: 0.36, similarity_boost: 0.90, style: 0.70, use_speaker_boost: true },
  default:      { stability: 0.45, similarity_boost: 0.85, style: 0.65, use_speaker_boost: true },
};

// ── Text-to-Speech ────────────────────────────────────────────────────────

export async function synthesize(
  voiceId: string,
  text: string,
  opts?: { genre?: string }
): Promise<Uint8Array> {
  return withRetry("synthesize", async () => {
    // Step 1: preprocess Persian text for clean TTS delivery
    const cleanText = preprocessPersian(text);
    // Step 2: add musical pacing markers
    const preparedText = prepareForSinging(cleanText);

    // eleven_multilingual_v2: best model for Persian — supports expressive delivery
    // eleven_turbo_v2_5 is faster but less expressive; prefer v2 for songs
    const modelId = process.env.ELEVENLABS_MODEL_ID || "eleven_multilingual_v2";
    const voiceSettings = genreVoiceSettings[opts?.genre ?? "default"] ?? genreVoiceSettings.default;

    console.log(`[elevenlabs] TTS: model=${modelId} genre=${opts?.genre ?? "default"} chars=${preparedText.length}`);

    const res = await fetch(
      `${api()}/text-to-speech/${voiceId}?output_format=mp3_44100_192`,
      {
        method: "POST",
        headers: {
          ...authHeaders(),
          "Content-Type": "application/json",
          Accept: "audio/mpeg",
        },
        body: JSON.stringify({
          text: preparedText,
          model_id: modelId,
          voice_settings: voiceSettings,
          // auto normalization handles numbers/abbreviations ElevenLabs-side
          apply_text_normalization: "auto",
        }),
      }
    );

    if (!res.ok) {
      const body = await res.text();
      throw new Error(`ElevenLabs TTS failed ${res.status}: ${body}`);
    }

    const bytes = new Uint8Array(await res.arrayBuffer());
    if (bytes.length < 1000) {
      throw new Error(`ElevenLabs TTS returned suspiciously small audio (${bytes.length} bytes)`);
    }
    console.log(`[elevenlabs] TTS done: ${Math.round(bytes.length / 1024)}KB`);
    return bytes;
  });
}

// ── Music / Sound Generation ──────────────────────────────────────────────

/**
 * Generate instrumental background music using ElevenLabs Sound Generation.
 * Max 22 seconds per call. Returns 192kbps MP3.
 *
 * Prompt engineering from bitwize-music-skills:
 * - Be extremely specific about instruments, BPM, key, production style
 * - Include "No vocals" explicitly — the model may add them otherwise
 * - Specify "headroom for vocal" so mixing works well
 */
export async function generateMusicEL(
  prompt: string,
  durationSeconds = 22
): Promise<Uint8Array> {
  return withRetry("generateMusicEL", async () => {
    const duration = Math.min(Math.max(durationSeconds, 5), 22);
    console.log(`[elevenlabs] Sound Generation: ${duration}s — prompt length=${prompt.length}`);

    const res = await fetch(`${api()}/sound-generation`, {
      method: "POST",
      headers: {
        ...authHeaders(),
        "Content-Type": "application/json",
        Accept: "audio/mpeg",
      },
      body: JSON.stringify({
        text: prompt,
        duration_seconds: duration,
        // 0.5 balances faithfulness to prompt vs. generative creativity
        // Higher = more literal, Lower = more creative but may drift
        prompt_influence: 0.50,
        output_format: "mp3_44100_192",
      }),
    });

    if (!res.ok) {
      const body = await res.text();
      throw new Error(`ElevenLabs Sound Generation failed ${res.status}: ${body}`);
    }

    const bytes = new Uint8Array(await res.arrayBuffer());
    if (bytes.length < 5000) {
      throw new Error(`Sound Generation returned suspiciously small audio (${bytes.length} bytes)`);
    }
    console.log(`[elevenlabs] Sound Generation done: ${Math.round(bytes.length / 1024)}KB`);
    return bytes;
  });
}

// ── Voice Management ──────────────────────────────────────────────────────

export async function deleteVoice(voiceId: string) {
  try {
    const res = await fetch(`${api()}/voices/${voiceId}`, {
      method: "DELETE",
      headers: { ...authHeaders() },
    });
    if (res.ok) console.log(`[elevenlabs] voice deleted: ${voiceId}`);
  } catch {
    // Cleanup failure is non-fatal — voice will expire automatically
  }
}

// ── Persian Preprocessing ─────────────────────────────────────────────────

/**
 * Clean Persian lyrics before TTS.
 * Inspired by bitwize-music-skills pronunciation-specialist:
 * - Never send raw numbers — ElevenLabs reads them in English
 * - Remove Latin chars that break Persian flow
 * - Normalize Unicode variants
 */
function preprocessPersian(text: string): string {
  return text
    // Persian digits → words (ElevenLabs reads Arabic/Persian digits in English)
    .replace(/۰/g, "صفر").replace(/۱/g, "یک").replace(/۲/g, "دو")
    .replace(/۳/g, "سه").replace(/۴/g, "چهار").replace(/۵/g, "پنج")
    .replace(/۶/g, "شش").replace(/۷/g, "هفت").replace(/۸/g, "هشت")
    .replace(/۹/g, "نه")
    // Arabic digits → words
    .replace(/0/g, "صفر").replace(/1/g, "یک").replace(/2/g, "دو")
    .replace(/3/g, "سه").replace(/4/g, "چهار").replace(/5/g, "پنج")
    .replace(/6/g, "شش").replace(/7/g, "هفت").replace(/8/g, "هشت")
    .replace(/9/g, "نه")
    // Remove Latin characters that confuse Persian TTS
    .replace(/[a-zA-Z]/g, "")
    // Normalize common Unicode variants used in Persian text
    .replace(/ي/g, "ی").replace(/ك/g, "ک")
    // Collapse multiple spaces/newlines left by cleanup
    .replace(/[ \t]{2,}/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

/**
 * Add musical pacing to lyrics for ElevenLabs song-like delivery.
 * Each line gets punctuation so the model pauses naturally.
 * Stanza breaks get an empty line (longer natural pause).
 *
 * Technique from bitwize-music-skills lyric-writer:
 * "Silence is part of the music — leave breathing room"
 */
function prepareForSinging(text: string): string {
  const lines = text.split("\n");
  const result: string[] = [];
  let blankCount = 0;

  for (const raw of lines) {
    const line = raw.trim();
    if (!line) {
      blankCount++;
      if (blankCount === 1) result.push(""); // one blank per stanza break
      continue;
    }
    blankCount = 0;
    // Add pause punctuation if missing — ElevenLabs uses punctuation for pacing
    const hasPunct = /[،.!؟,…]$/.test(line);
    result.push(hasPunct ? line : line + "،");
  }

  return result.join("\n").trim();
}

// ── File helpers ──────────────────────────────────────────────────────────

function extFromMime(mime: string) {
  if (mime.includes("wav"))  return ".wav";
  if (mime.includes("ogg"))  return ".ogg";
  if (mime.includes("webm")) return ".webm";
  if (mime.includes("m4a") || mime.includes("mp4")) return ".m4a";
  return ".mp3";
}

export function mimeFromExt(filenameOrExt: string): string {
  const ext = filenameOrExt.toLowerCase().split(".").pop() || "";
  switch (ext) {
    case "wav":  return "audio/wav";
    case "ogg":  return "audio/ogg";
    case "webm": return "audio/webm";
    case "m4a":
    case "mp4":  return "audio/mp4";
    case "flac": return "audio/flac";
    case "aac":  return "audio/aac";
    default:     return "audio/mpeg";
  }
}
