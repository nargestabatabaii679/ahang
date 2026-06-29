/**
 * ElevenLabs adapter
 *  - cloneVoice   : Instant Voice Cloning
 *  - synthesize   : Text-to-speech (singing-optimised settings)
 *  - generateMusic: Sound Generation endpoint (background music)
 *  - deleteVoice  : cleanup cloned voice after use
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
  if (k.startsWith("sk_")) {
    return { "Authorization": `Bearer ${k}` };
  }
  return { "xi-api-key": k };
}

// ── Voice Cloning ─────────────────────────────────────────────────────────

export async function cloneVoice(
  name: string,
  sample: Uint8Array,
  sampleMime = "audio/mpeg"
): Promise<string> {
  const form = new FormData();
  form.append("name", name.slice(0, 40) || "songai-voice");
  form.append("description", "Voice cloned for a personal song gift via songai");
  const ab = sample.buffer.slice(
    sample.byteOffset,
    sample.byteOffset + sample.byteLength
  ) as ArrayBuffer;
  form.append(
    "files",
    new Blob([ab], { type: sampleMime }),
    "sample" + extFromMime(sampleMime)
  );
  // Add labels for better quality
  form.append("labels", JSON.stringify({ use_case: "persian_song", language: "fa" }));

  const res = await fetch(`${api()}/voices/add`, {
    method: "POST",
    headers: { ...authHeaders() },
    body: form,
  });
  if (!res.ok)
    throw new Error(`ElevenLabs clone failed: ${res.status} ${await res.text()}`);
  const json = (await res.json()) as { voice_id: string };
  return json.voice_id;
}

// Per-genre voice settings — different genres need different delivery styles
type VoiceSettings = { stability: number; similarity_boost: number; style: number; use_speaker_boost: boolean };

const genreVoiceSettings: Record<string, VoiceSettings> = {
  romantic:     { stability: 0.40, similarity_boost: 0.88, style: 0.70, use_speaker_boost: true },
  emotional:    { stability: 0.35, similarity_boost: 0.90, style: 0.75, use_speaker_boost: true },
  happy:        { stability: 0.55, similarity_boost: 0.80, style: 0.60, use_speaker_boost: true },
  calm:         { stability: 0.60, similarity_boost: 0.85, style: 0.45, use_speaker_boost: false },
  motivational: { stability: 0.45, similarity_boost: 0.82, style: 0.72, use_speaker_boost: true },
  nostalgic:    { stability: 0.38, similarity_boost: 0.88, style: 0.68, use_speaker_boost: true },
  default:      { stability: 0.45, similarity_boost: 0.85, style: 0.65, use_speaker_boost: true },
};

// ── Text-to-Speech (singing-optimised) ───────────────────────────────────

export async function synthesize(
  voiceId: string,
  text: string,
  opts?: { genre?: string }
): Promise<Uint8Array> {
  const preparedText = prepareForSinging(text);

  // eleven_multilingual_v2: best model for Persian — supports expressive emotional delivery
  const modelId = process.env.ELEVENLABS_MODEL_ID || "eleven_multilingual_v2";

  const voiceSettings = genreVoiceSettings[opts?.genre ?? "default"] ?? genreVoiceSettings.default;

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
        apply_text_normalization: "auto",
      }),
    }
  );

  if (!res.ok)
    throw new Error(`ElevenLabs TTS failed: ${res.status} ${await res.text()}`);
  return new Uint8Array(await res.arrayBuffer());
}

// ── Music / Sound Generation ──────────────────────────────────────────────

/**
 * Generate instrumental background music using ElevenLabs Sound Generation.
 * Returns MP3 bytes. No additional API key needed — uses ELEVENLABS_API_KEY.
 */
export async function generateMusicEL(
  prompt: string,
  durationSeconds = 22
): Promise<Uint8Array> {
  const res = await fetch(`${api()}/sound-generation`, {
    method: "POST",
    headers: {
      ...authHeaders(),
      "Content-Type": "application/json",
      Accept: "audio/mpeg",
    },
    body: JSON.stringify({
      text: prompt,
      duration_seconds: Math.min(durationSeconds, 22),
      prompt_influence: 0.50, // 0=creative, 1=strict — 0.5 balances quality & fidelity
      output_format: "mp3_44100_192",
    }),
  });

  if (!res.ok)
    throw new Error(`ElevenLabs Sound Generation failed: ${res.status} ${await res.text()}`);

  return new Uint8Array(await res.arrayBuffer());
}

// ── Voice Management ──────────────────────────────────────────────────────

export async function deleteVoice(voiceId: string) {
  try {
    await fetch(`${api()}/voices/${voiceId}`, {
      method: "DELETE",
      headers: { ...authHeaders() },
    });
  } catch {
    /* non-fatal */
  }
}

// ── Helpers ───────────────────────────────────────────────────────────────

/**
 * Format lyrics for expressive, song-like TTS delivery.
 * Groups lines into stanzas separated by blank lines.
 * Each line gets trailing punctuation so ElevenLabs pauses naturally.
 * Blank lines become a longer pause marker so stanza breaks breathe.
 */
function prepareForSinging(text: string): string {
  const lines = text.split("\n");
  const result: string[] = [];
  let blankCount = 0;

  for (const raw of lines) {
    const line = raw.trim();
    if (!line) {
      blankCount++;
      // First blank line after content = stanza break (long pause)
      // Multiple blanks collapse to one
      if (blankCount === 1) {
        result.push("");
      }
      continue;
    }
    blankCount = 0;
    // Ensure each line ends with pause-inducing punctuation
    const hasPunct = /[،.!؟,،…]$/.test(line);
    result.push(hasPunct ? line : line + "،");
  }

  return result.join("\n").trim();
}

function extFromMime(mime: string) {
  if (mime.includes("wav")) return ".wav";
  if (mime.includes("ogg")) return ".ogg";
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
