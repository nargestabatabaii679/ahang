/**
 * Song generation pipeline — production-grade orchestrator
 *
 * Architecture inspired by bitwize-music-skills quality gate system:
 * - Every stage has explicit success/failure logging
 * - Fallback chains at every step — the pipeline never silently produces nothing
 * - Quality gates: minimum file size checks before saving
 * - Per-stage error recovery with meaningful error messages in Persian
 */

import { Job } from "./types";
import { setStage, setJobStatus, updateJob, getJob } from "./jobs-store.server";
import { savePublic, fetchBytes } from "./storage.server";
import {
  draftLyrics,
  buildMusicPrompt,
  buildCoverArtPrompt,
  buildELMusicPrompt,
} from "./providers/lyrics";
import {
  cloneVoice,
  synthesize,
  deleteVoice,
  mimeFromExt,
  generateMusicEL,
} from "./providers/elevenlabs";
import { generateMusic } from "./providers/suno";
import { generateMusicWithArt } from "./providers/riffusion";
import { lipSyncVideo as lipSyncAurora } from "./providers/creatify";
import { generateAvatarVideo } from "./providers/heygen";
import {
  generateCoverArt,
  animateImage,
  generateMusicStability,
} from "./providers/stability";
import { sleep } from "./server-utils";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { writeFileSync, readFileSync, unlinkSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";

const execFileAsync = promisify(execFile);

const isMock = () => process.env.PIPELINE_MOCK === "true";
const musicProvider = () => process.env.MUSIC_PROVIDER || "auto";
const videoProvider = () => process.env.VIDEO_PROVIDER || "aurora";

// ── Utilities ─────────────────────────────────────────────────────────────

function toAbsoluteUrl(relOrAbsUrl: string): string {
  if (!relOrAbsUrl || relOrAbsUrl.startsWith("http")) return relOrAbsUrl;
  const base = (process.env.PUBLIC_URL || process.env.SITE_URL || "").replace(/\/$/, "");
  if (!base)
    throw new Error(
      "PUBLIC_URL must be set for video generation (e.g. https://aimusics.liara.run)"
    );
  return base + relOrAbsUrl;
}

/**
 * Mix vocal (foreground) + instrumental (background) via ffmpeg.
 * Target: -14 LUFS streaming standard (bitwize-music mastering preset default).
 * Voice 100%, music 28% — keeps vocal intelligible while filling space.
 * Returns null if ffmpeg unavailable — caller uses voice-only.
 */
async function mixVoiceAndMusic(
  voiceBytes: Uint8Array,
  musicBytes: Uint8Array
): Promise<Uint8Array | null> {
  const id = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  const tmp = tmpdir();
  const voicePath = join(tmp, `voice-${id}.mp3`);
  const musicPath = join(tmp, `music-${id}.mp3`);
  const outPath = join(tmp, `mixed-${id}.mp3`);

  try {
    writeFileSync(voicePath, voiceBytes);
    writeFileSync(musicPath, musicBytes);

    await execFileAsync("ffmpeg", [
      "-y",
      "-i", voicePath,
      "-i", musicPath,
      "-filter_complex",
      // Voice at 100%, music at 28%; trim to voice length; loudness normalize to -14 LUFS
      "[0:a]volume=1.0,apad[v];[1:a]volume=0.28[m];" +
      "[v][m]amix=inputs=2:duration=first:dropout_transition=3[mix];" +
      "[mix]loudnorm=I=-14:TP=-1.5:LRA=11[out]",
      "-map", "[out]",
      "-c:a", "libmp3lame",
      "-q:a", "2",   // VBR ~190kbps
      outPath,
    ]);

    const result = new Uint8Array(readFileSync(outPath));
    if (result.length < 10000) throw new Error("mixed output too small");
    console.log(`[pipeline] mix done: ${Math.round(result.length / 1024)}KB`);
    return result;
  } catch (e) {
    console.warn("[pipeline] ffmpeg mix failed:", (e as Error).message);
    return null;
  } finally {
    for (const p of [voicePath, musicPath, outPath]) {
      try { unlinkSync(p); } catch { /* ignore */ }
    }
  }
}

// ── Stage: Lyrics ─────────────────────────────────────────────────────────

async function runLyricsStage(job: Job): Promise<string> {
  await setStage(job.id, "lyrics", "running");
  console.log(`[pipeline:lyrics] starting for job ${job.id}`);

  if (isMock()) {
    await sleep(1200);
    await setStage(job.id, "lyrics", "done");
    return "این یک متن آزمایشی برای تست است.\n\nنام تو همیشه در قلبم.\n\nبرای تو می‌خوانم.\n\nنام تو همیشه در قلبم.";
  }

  try {
    const lyrics = await draftLyrics(job.brief);
    if (!lyrics || lyrics.trim().length < 20) {
      throw new Error("متن ترانه خیلی کوتاه است");
    }
    console.log(`[pipeline:lyrics] done: ${lyrics.length} chars`);
    await setStage(job.id, "lyrics", "done");
    return lyrics;
  } catch (e) {
    console.error("[pipeline:lyrics] failed:", (e as Error).message);
    // Quality gate: always return something usable
    const fallback = buildFallbackLyrics(job.brief.recipientName || "عزیزم");
    await setStage(job.id, "lyrics", "done");
    return fallback;
  }
}

function buildFallbackLyrics(name: string): string {
  return [
    `${name} جان، این آهنگ برای توست`,
    `از صمیم قلبم، با تمام وجودم`,
    `هر روز که بودی بهترین هدیه بود`,
    `هر لحظه با تو، یک ترانه بود`,
    "",
    `${name} جان، ${name} عزیزم`,
    `می‌خواهم بدانی که چقدر مهمی`,
    `تو آرامش من، تو معنای منی`,
    `این ترانه از قلبم است، باور کن`,
    "",
    `${name} جان، ${name} عزیزم`,
    `می‌خواهم بدانی که چقدر مهمی`,
    `تو آرامش من، تو معنای منی`,
    `این ترانه از قلبم است، باور کن`,
  ].join("\n");
}

// ── Stage: Music ──────────────────────────────────────────────────────────

interface MusicStageResult {
  musicUrl?: string;
  coverArtUrl?: string;
  musicError?: string;
}

function pickMusicProvider(): "stability" | "suno" | "riffusion" | "elevenlabs" | "none" {
  const explicit = musicProvider();
  if (explicit === "stability") return "stability";
  if (explicit === "suno") return "suno";
  if (explicit === "riffusion") return "riffusion";
  if (explicit === "elevenlabs") return "elevenlabs";
  // auto priority: Stability → Suno → Riffusion → ElevenLabs
  if (process.env.STABILITY_API_KEY) return "stability";
  if (process.env.SUNO_API_BASE) return "suno";
  if (process.env.RIFFUSION_API_BASE) return "riffusion";
  if (process.env.ELEVENLABS_API_KEY) return "elevenlabs";
  return "none";
}

async function tryGenerateCoverArt(jobId: string, brief: Job["brief"]): Promise<string | undefined> {
  if (!process.env.STABILITY_API_KEY) return undefined;
  try {
    const img = await generateCoverArt(buildCoverArtPrompt(brief));
    const { url } = await savePublic(`${jobId}-cover.jpg`, img, "image/jpeg");
    console.log(`[pipeline:music] cover art saved: ${url}`);
    return url;
  } catch (e) {
    console.warn("[pipeline:music] cover art failed:", (e as Error).message);
    return undefined;
  }
}

async function runMusicStage(job: Job): Promise<MusicStageResult> {
  await setStage(job.id, "music", "running");
  const result: MusicStageResult = {};

  if (isMock()) {
    await sleep(900);
    await setStage(job.id, "music", "done");
    return result;
  }

  const provider = pickMusicProvider();
  console.log(`[pipeline:music] provider = ${provider}`);

  const tryElevenLabsMusic = async (): Promise<string | undefined> => {
    if (!process.env.ELEVENLABS_API_KEY) return undefined;
    const buf = await generateMusicEL(buildELMusicPrompt(job.brief));
    const { url } = await savePublic(`${job.id}-music.mp3`, buf, "audio/mpeg");
    console.log(`[pipeline:music] ElevenLabs music saved: ${url}`);
    return url;
  };

  try {
    if (provider === "stability") {
      const audio = await generateMusicStability(job.brief, 47);
      result.musicUrl = (await savePublic(`${job.id}-music.mp3`, audio, "audio/mpeg")).url;
      result.coverArtUrl = await tryGenerateCoverArt(job.id, job.brief);
    } else if (provider === "suno") {
      const remoteUrl = await generateMusic(buildMusicPrompt(job.brief));
      const buf = await fetchBytes(remoteUrl);
      result.musicUrl = (await savePublic(`${job.id}-music.mp3`, buf, "audio/mpeg")).url;
      result.coverArtUrl = await tryGenerateCoverArt(job.id, job.brief);
    } else if (provider === "riffusion") {
      const { audio, coverArt } = await generateMusicWithArt(job.brief);
      result.musicUrl = (await savePublic(`${job.id}-music.mp3`, audio)).url;
      result.coverArtUrl = (await savePublic(`${job.id}-cover.jpg`, coverArt)).url;
    } else if (provider === "elevenlabs") {
      result.musicUrl = await tryElevenLabsMusic();
      result.coverArtUrl = await tryGenerateCoverArt(job.id, job.brief);
    } else {
      console.warn("[pipeline:music] no music provider — skipping instrumental");
    }
  } catch (primaryErr) {
    const msg = (primaryErr as Error).message;
    console.warn(`[pipeline:music] ${provider} failed: ${msg}`);

    // Fallback 1: ElevenLabs Sound Generation (if not already tried)
    if (provider !== "elevenlabs") {
      try {
        result.musicUrl = await tryElevenLabsMusic();
        console.log("[pipeline:music] ElevenLabs fallback succeeded");
      } catch (elErr) {
        console.warn("[pipeline:music] ElevenLabs fallback also failed:", (elErr as Error).message);
        result.musicError = `موسیقی تولید نشد: ${msg}`;
      }
    } else {
      result.musicError = `موسیقی تولید نشد: ${msg}`;
    }
  }

  // Fallback cover art: use uploaded photo
  if (!result.coverArtUrl && job.brief.photoUrl) {
    result.coverArtUrl = job.brief.photoUrl;
  }

  await setStage(job.id, "music", "done");
  return result;
}

// ── Stage: Voice ──────────────────────────────────────────────────────────

async function runVoiceStage(
  job: Job,
  lyrics: string,
  musicUrl?: string
): Promise<string | undefined> {
  await setStage(job.id, "voice", "running");
  let audioUrl: string | undefined;

  if (isMock()) {
    audioUrl = job.brief.voiceUrl || musicUrl;
    await sleep(1200);
    await setStage(job.id, "voice", "done");
    return audioUrl;
  }

  // Quality gate: voice sample must exist
  if (!job.brief.voiceUrl) {
    console.warn("[pipeline:voice] no voice sample — using music as final audio");
    audioUrl = musicUrl;
    await setStage(job.id, "voice", "done");
    return audioUrl;
  }

  let voiceId: string | null = null;
  try {
    // Step 1: load sample
    console.log(`[pipeline:voice] fetching sample: ${job.brief.voiceUrl}`);
    const sample = await fetchBytes(job.brief.voiceUrl);

    // Quality gate: sample must be at least 10KB
    if (sample.length < 10_000) {
      throw new Error(`صدای آپلود‌شده خیلی کوتاه است (${sample.length} bytes)`);
    }

    // Step 2: clone voice
    voiceId = await cloneVoice(
      job.brief.recipientName,
      sample,
      mimeFromExt(job.brief.voiceUrl)
    );

    // Step 3: synthesize lyrics with cloned voice
    const vocalBytes = await synthesize(voiceId, lyrics, { genre: job.brief.genre });

    // Step 4: mix vocal + instrumental if music exists
    let finalBytes = vocalBytes;
    if (musicUrl) {
      try {
        const musicBytes = await fetchBytes(musicUrl);
        const mixed = await mixVoiceAndMusic(vocalBytes, musicBytes);
        if (mixed) {
          finalBytes = mixed;
          console.log("[pipeline:voice] voice + music mixed ✓");
        } else {
          console.warn("[pipeline:voice] ffmpeg unavailable — voice-only track");
        }
      } catch (mixErr) {
        console.warn("[pipeline:voice] mix error:", (mixErr as Error).message);
      }
    }

    audioUrl = (await savePublic(`${job.id}-final.mp3`, finalBytes, "audio/mpeg")).url;
    console.log(`[pipeline:voice] final audio saved: ${audioUrl}`);
  } catch (e) {
    const msg = (e as Error).message;
    console.error(`[pipeline:voice] failed: ${msg}`);
    // Graceful degradation: use the raw uploaded sample
    audioUrl = job.brief.voiceUrl || musicUrl;
    console.warn("[pipeline:voice] falling back to raw uploaded sample");
  } finally {
    // Always clean up cloned voice to avoid accumulation charges
    if (voiceId) await deleteVoice(voiceId);
  }

  await setStage(job.id, "voice", "done");
  return audioUrl;
}

// ── Stage: Video ──────────────────────────────────────────────────────────

async function runVideoStage(
  job: Job,
  audioUrl?: string
): Promise<string | undefined> {
  await setStage(job.id, "video", "running");
  let videoUrl: string | undefined;
  const photoUrl = job.brief.photoUrl;

  if (!isMock() && audioUrl) {
    try {
      if (videoProvider() === "heygen") {
        const fresh = await getJob(job.id);
        const lyrics = fresh?.result?.lyrics || "";
        const buf = await generateAvatarVideo(lyrics);
        videoUrl = (await savePublic(`${job.id}-video.mp4`, buf, "video/mp4")).url;
        console.log(`[pipeline:video] HeyGen video saved: ${videoUrl}`);
      } else if (photoUrl && videoProvider() === "aurora") {
        const buf = await lipSyncAurora(toAbsoluteUrl(photoUrl), toAbsoluteUrl(audioUrl));
        videoUrl = (await savePublic(`${job.id}-video.mp4`, buf, "video/mp4")).url;
        console.log(`[pipeline:video] Aurora lip-sync video saved: ${videoUrl}`);
      } else if (videoProvider() === "stability" && process.env.STABILITY_API_KEY && photoUrl) {
        const imgBytes = await fetchBytes(photoUrl);
        const buf = await animateImage(imgBytes);
        videoUrl = (await savePublic(`${job.id}-video.mp4`, buf, "video/mp4")).url;
        console.log(`[pipeline:video] Stability animated video saved: ${videoUrl}`);
      } else {
        console.log("[pipeline:video] no video provider configured — skipping");
      }
    } catch (e) {
      console.warn(`[pipeline:video] failed: ${(e as Error).message} — skipping video`);
    }
  }

  if (isMock()) await sleep(900);
  await setStage(job.id, "video", "done");
  return videoUrl;
}

// ── Main orchestrator ─────────────────────────────────────────────────────

export async function runPipeline(jobId: string) {
  const job = await getJob(jobId);
  if (!job) {
    console.error(`[pipeline] job not found: ${jobId}`);
    return;
  }

  console.log(`[pipeline] starting job ${jobId}`);
  await setJobStatus(job.id, "running");
  let result: NonNullable<Job["result"]> = {};

  try {
    // ── Stage 1: Lyrics ──
    const lyrics = await runLyricsStage(job);
    result = { ...result, lyrics };
    await updateJob(job.id, { result });

    // ── Stage 2: Music + Cover Art ──
    const music = await runMusicStage(job);
    result = {
      ...result,
      musicUrl: music.musicUrl,
      musicError: music.musicError,
      coverArtUrl: music.coverArtUrl,
    };
    await updateJob(job.id, { result });

    // ── Stage 3: Voice Clone + TTS + Mix ──
    const audioUrl = await runVoiceStage(job, lyrics, music.musicUrl);
    result = { ...result, audioUrl };
    await updateJob(job.id, { result });

    // ── Stage 4: Video (optional) ──
    const videoUrl = await runVideoStage(job, audioUrl);
    result = { ...result, videoUrl };
    await updateJob(job.id, { result });

    // ── Stage 5: Finalize ──
    await setStage(job.id, "finalize", "running");
    if (isMock()) await sleep(600);
    await setStage(job.id, "finalize", "done");

    await setJobStatus(job.id, "done");
    console.log(`[pipeline] job ${jobId} completed ✓`);
  } catch (e) {
    const message = (e as Error)?.message || "خطای ناشناخته در تولید";
    console.error(`[pipeline] job ${jobId} failed:`, message);
    const fresh = await getJob(job.id);
    const runningStage = fresh?.stages.find((s) => s.status === "running");
    if (runningStage) await setStage(job.id, runningStage.id, "error");
    await setJobStatus(job.id, "error", message);
  }
}
