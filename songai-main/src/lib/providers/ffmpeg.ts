import { spawn } from "child_process";
import { writeFile, readFile } from "fs/promises";
import path from "path";
import { withTempDir } from "../server-utils";

function run(args: string[]): Promise<void> {
  return new Promise((resolve, reject) => {
    const p = spawn("ffmpeg", ["-y", ...args], { stdio: ["ignore", "ignore", "pipe"] });
    let err = "";
    p.stderr.on("data", (d) => (err += d.toString()));
    p.on("error", reject);
    p.on("close", (code) =>
      code === 0 ? resolve() : reject(new Error(`ffmpeg exited ${code}: ${err.slice(-800)}`))
    );
  });
}

async function fetchToFile(url: string, dir: string, name: string): Promise<string> {
  const dest = path.join(dir, name);
  if (url.startsWith("/")) {
    // local public url -> read from disk
    const local = path.join(process.cwd(), "public", url.replace(/^\//, ""));
    await writeFile(dest, await readFile(local));
    return dest;
  }
  const res = await fetch(url);
  if (!res.ok) throw new Error(`download failed ${res.status} for ${url}`);
  await writeFile(dest, Buffer.from(await res.arrayBuffer()));
  return dest;
}

/**
 * Mix the cloned voice over the instrumental using real sidechain ducking —
 * the music only ducks while the voice is actually present (not a flat
 * volume cut for the whole track), so quiet/instrumental moments in the
 * vocal let the music breathe. A final limiter catches any peaks the mix
 * introduces. Adapted from avatar-mix's `composite.py: mix_audio` sidechain
 * recipe. Returns a metadata-stripped mp3 buffer.
 */
export async function mixVoiceOverMusic(
  voiceUrlOrPath: string,
  musicUrlOrPath: string
): Promise<Buffer> {
  return withTempDir("songai-", async (dir) => {
    const voice = await fetchToFile(voiceUrlOrPath, dir, "voice.in");
    const music = await fetchToFile(musicUrlOrPath, dir, "music.in");
    const out = path.join(dir, "mix.mp3");
    await run([
      "-i", voice,
      "-stream_loop", "-1", "-i", music,
      "-filter_complex",
      "[0:a]asplit=2[va][vk];" +
        "[1:a]volume=-22dB[m];" +
        // music ducks only while the voice key signal is active (real
        // sidechain), not a flat volume cut for the whole track
        "[m][vk]sidechaincompress=threshold=0.05:ratio=8:attack=20:release=400[duck];" +
        "[va][duck]amix=inputs=2:duration=first:normalize=0:dropout_transition=0[mx];" +
        // catch any peaks the mix introduces
        "[mx]alimiter=limit=0.95[aout]",
      "-map", "[aout]",
      "-map_metadata", "-1",
      "-c:a", "libmp3lame", "-q:a", "3",
      out,
    ]);
    return readFile(out);
  });
}

/**
 * Build a simple video from a still photo + an audio track (used as a local
 * fallback / mock so the result is always playable even without Kling).
 */
export async function photoPlusAudioVideo(
  photoUrlOrPath: string,
  audioUrlOrPath: string
): Promise<Buffer> {
  return withTempDir("songai-", async (dir) => {
    const photo = await fetchToFile(photoUrlOrPath, dir, "photo.in");
    const audio = await fetchToFile(audioUrlOrPath, dir, "audio.in");
    const out = path.join(dir, "out.mp4");
    await run([
      "-loop", "1", "-i", photo,
      "-i", audio,
      "-vf",
      "scale=720:-2:force_original_aspect_ratio=decrease,pad=720:720:(ow-iw)/2:(oh-ih)/2:color=0x150F22,format=yuv420p",
      "-c:v", "libx264", "-tune", "stillimage", "-pix_fmt", "yuv420p",
      "-c:a", "aac", "-b:a", "192k",
      "-shortest",
      "-map_metadata", "-1",
      "-metadata:s:v", "handler_name=",
      "-metadata:s:a", "handler_name=",
      "-movflags", "+faststart",
      out,
    ]);
    return readFile(out);
  });
}

/**
 * Strip all metadata (encoder, creation_time, handler names, chapters) from
 * an already-encoded video without re-encoding — same hygiene avatar-mix
 * applies to every clip it ships. Used on videos downloaded from external
 * providers (e.g. the RunComfy/OmniHuman avatar clip) before we serve them,
 * so personal gift videos don't carry provider/software fingerprints.
 */
export async function stripVideoMetadata(input: Buffer): Promise<Buffer> {
  return withTempDir("songai-strip-", async (dir) => {
    const inPath = path.join(dir, "in.mp4");
    const outPath = path.join(dir, "out.mp4");
    await writeFile(inPath, input);
    await run([
      "-i", inPath,
      "-map_metadata", "-1",
      "-map_chapters", "-1",
      "-metadata:s:v", "handler_name=",
      "-metadata:s:a", "handler_name=",
      "-c", "copy",
      "-movflags", "+faststart",
      outPath,
    ]);
    return readFile(outPath);
  });
}

/** Generate a short, gentle instrumental tone as a mock "music" track. */
export async function mockMusic(): Promise<Buffer> {
  return withTempDir("songai-", async (dir) => {
    const out = path.join(dir, "music.mp3");
    await run([
      "-f", "lavfi",
      "-i",
      "sine=frequency=220:duration=20,aecho=0.8:0.9:60:0.3",
      "-c:a", "libmp3lame", "-q:a", "5",
      out,
    ]);
    return readFile(out);
  });
}
