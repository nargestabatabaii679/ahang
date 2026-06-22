import { readFile } from "fs/promises";

const api = () =>
  `${(process.env.ELEVENLABS_API_BASE || "https://api.elevenlabs.io").replace(/\/$/, "")}/v1`;

function key() {
  const k = process.env.ELEVENLABS_API_KEY;
  if (!k) throw new Error("ELEVENLABS_API_KEY تنظیم نشده است");
  return k;
}

/**
 * Instant Voice Cloning: upload the user's voice sample, get a voice_id back.
 * https://elevenlabs.io/docs/api-reference/voices/add
 */
export async function cloneVoice(
  name: string,
  sampleAbsPath: string,
  sampleMime = "audio/mpeg"
): Promise<string> {
  const buf = await readFile(sampleAbsPath);
  const form = new FormData();
  form.append("name", name.slice(0, 40) || "songai-voice");
  form.append(
    "files",
    new Blob([new Uint8Array(buf)], { type: sampleMime }),
    "sample" + extFromMime(sampleMime)
  );

  const res = await fetch(`${api()}/voices/add`, {
    method: "POST",
    headers: { "xi-api-key": key() },
    body: form,
  });
  if (!res.ok) {
    throw new Error(`ElevenLabs clone failed: ${res.status} ${await res.text()}`);
  }
  const json = (await res.json()) as { voice_id: string };
  return json.voice_id;
}

/** Render `text` with the cloned voice → mp3 buffer. */
export async function synthesize(
  voiceId: string,
  text: string
): Promise<Buffer> {
  const res = await fetch(`${api()}/text-to-speech/${voiceId}`, {
    method: "POST",
    headers: {
      "xi-api-key": key(),
      "Content-Type": "application/json",
      Accept: "audio/mpeg",
    },
    body: JSON.stringify({
      text,
      model_id: process.env.ELEVENLABS_MODEL_ID || "eleven_multilingual_v2",
      voice_settings: { stability: 0.4, similarity_boost: 0.85 },
    }),
  });
  if (!res.ok) {
    throw new Error(`ElevenLabs TTS failed: ${res.status} ${await res.text()}`);
  }
  return Buffer.from(await res.arrayBuffer());
}

/** Best-effort cleanup so we don't leave voices piling up on the account. */
export async function deleteVoice(voiceId: string) {
  try {
    await fetch(`${api()}/voices/${voiceId}`, {
      method: "DELETE",
      headers: { "xi-api-key": key() },
    });
  } catch {
    /* non-fatal */
  }
}

function extFromMime(mime: string) {
  if (mime.includes("wav")) return ".wav";
  if (mime.includes("ogg")) return ".ogg";
  if (mime.includes("webm")) return ".webm";
  if (mime.includes("mp4") || mime.includes("m4a")) return ".m4a";
  return ".mp3";
}

/** Inverse of extFromMime — used when we only have a saved file's
 *  extension (from its URL/path) and need the real content-type to send
 *  to ElevenLabs, instead of assuming every sample is mp3. */
export function mimeFromExt(filenameOrExt: string): string {
  const ext = filenameOrExt.toLowerCase().split(".").pop() || "";
  switch (ext) {
    case "wav":
      return "audio/wav";
    case "ogg":
      return "audio/ogg";
    case "webm":
      return "audio/webm";
    case "m4a":
    case "mp4":
      return "audio/mp4";
    case "flac":
      return "audio/flac";
    case "aac":
      return "audio/aac";
    default:
      return "audio/mpeg";
  }
}
