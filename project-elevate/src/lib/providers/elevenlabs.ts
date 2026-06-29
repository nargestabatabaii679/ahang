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

// ── Text-to-Speech (singing-optimised) ───────────────────────────────────

export async function synthesize(
  voiceId: string,
  text: string,
  opts?: { genre?: string }
): Promise<Uint8Array> {
  // Prepare text: add breathing markers for better musical delivery
  const preparedText = prepareForSinging(text);

  // Model: eleven_multilingual_v2 is best for Persian and supports
  // expressive singing-like delivery
  const modelId =
    process.env.ELEVENLABS_MODEL_ID || "eleven_multilingual_v2";

  // Settings tuned for singing/song delivery:
  // - stability 0.55: allows natural pitch variation (not robotic)
  // - similarity_boost 0.80: stays close to the cloned voice
  // - style 0.40: adds expressive musical styling
  // - use_speaker_boost: true — enhances clarity and presence
  const voiceSettings = {
    stability: 0.55,
    similarity_boost: 0.80,
    style: 0.40,
    use_speaker_boost: true,
  };

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
        // Optimise for song delivery
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
      duration_seconds: Math.min(durationSeconds, 22), // max 22s per call
      prompt_influence: 0.35, // 0=more creative, 1=strict. 0.35 = good balance
      output_format: "mp3_44100_128",
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
 * Insert short pauses between verse lines so the TTS engine breathes
 * naturally — critical for song-like delivery in Persian.
 */
function prepareForSinging(text: string): string {
  return text
    .split("\n")
    .map((line) => {
      const t = line.trim();
      if (!t) return "";
      // End each lyric line with a short pause so the voice breathes
      return t.endsWith("،") || t.endsWith(".") || t.endsWith("!") || t.endsWith("؟")
        ? t
        : t + " ...";
    })
    .join("\n");
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
