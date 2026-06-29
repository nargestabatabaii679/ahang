/**
 * Server-only orchestrator for the song-generation pipeline.
 *
 * Differences from the Next.js original:
 *   - Persistence via Lovable Cloud (jobs-store.server) instead of a Map.
 *   - All file I/O via Lovable Cloud Storage (storage.server).
 *   - No ffmpeg / no Node `child_process`: voice/music are not mixed; the
 *     final audio is the cloned-voice render (or the user's own sample
 *     when the cloning service is unavailable). The video stage uses
 *     Creatify (HTTP) when configured; otherwise it's skipped and the
 *     result is audio + cover art + lyrics.
 *   - Lyrics stage uses the Lovable AI Gateway (Gemini Flash) so even with
 *     zero external API keys configured, every job produces real output.
 */

import { Job } from "./types";
import { setStage, setJobStatus, updateJob, getJob } from "./jobs-store.server";
import { savePublic, fetchBytes } from "./storage.server";
import { draftLyrics, buildMusicPrompt, buildCoverArtPrompt, buildELMusicPrompt } from "./providers/lyrics";
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
import { generateCoverArt, animateImage, generateMusicStability } from "./providers/stability";
import { sleep } from "./server-utils";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { writeFileSync, readFileSync, unlinkSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";

const execFileAsync = promisify(execFile);

/**
 * Mix voice (foreground) + instrumental (background) using ffmpeg.
 * Voice is at full volume; music is attenuated to 25% so vocals are clear.
 * Returns null if ffmpeg is unavailable — caller falls back to voice-only.
 */
async function mixVoiceAndMusic(
  voiceBytes: Uint8Array,
  musicBytes: Uint8Array
): Promise<Uint8Array | null> {
  const tmp = tmpdir();
  const voicePath = join(tmp, `mix-voice-${Date.now()}.mp3`);
  const musicPath = join(tmp, `mix-music-${Date.now()}.mp3`);
  const outPath   = join(tmp, `mix-out-${Date.now()}.mp3`);
  try {
    writeFileSync(voicePath, voiceBytes);
    writeFileSync(musicPath, musicBytes);
    // Mix: voice at 100%, instrumental at 25%; trim to voice length; re-encode to mp3
    await execFileAsync("ffmpeg", [
      "-y",
      "-i", voicePath,
      "-i", musicPath,
      "-filter_complex",
      "[0:a]volume=1.0[v];[1:a]volume=0.25[m];[v][m]amix=inputs=2:duration=first:dropout_transition=2[out]",
      "-map", "[out]",
      "-c:a", "libmp3lame",
      "-q:a", "2",
      outPath,
    ]);
    const result = new Uint8Array(readFileSync(outPath));
    return result;
  } catch {
    return null;
  } finally {
    for (const p of [voicePath, musicPath, outPath]) {
      try { unlinkSync(p); } catch { /* ignore */ }
    }
  }
}

const isMock = () => process.env.PIPELINE_MOCK === "true";
const musicProvider = () => process.env.MUSIC_PROVIDER || "auto";
const videoProvider = () => process.env.VIDEO_PROVIDER || "aurora";

// Convert relative /media/... URLs to absolute for external APIs (Creatify, HeyGen)
function toAbsoluteUrl(relOrAbsUrl: string): string {
  if (!relOrAbsUrl || relOrAbsUrl.startsWith("http")) return relOrAbsUrl;
  const base = (process.env.PUBLIC_URL || process.env.SITE_URL || "").replace(/\/$/, "");
  if (!base) throw new Error("PUBLIC_URL env var must be set for video generation (e.g. https://aimusics.liara.run)");
  return base + relOrAbsUrl;
}

interface MusicStageResult {
  musicUrl?: string;
  coverArtUrl?: string;
  musicError?: string;
}

async function runLyricsStage(job: Job): Promise<string> {
  await setStage(job.id, "lyrics", "running");
  const lyrics = await draftLyrics(job.brief);
  if (isMock()) await sleep(1200);
  await setStage(job.id, "lyrics", "done");
  return lyrics;
}

async function pickMusicProvider(): Promise<"stability" | "suno" | "riffusion" | "elevenlabs" | "none"> {
  const explicit = musicProvider();
  if (explicit === "stability") return "stability";
  if (explicit === "suno") return "suno";
  if (explicit === "riffusion") return "riffusion";
  if (explicit === "elevenlabs") return "elevenlabs";
  // auto: prefer Stability Audio → Suno → Riffusion → ElevenLabs
  if (process.env.STABILITY_API_KEY) return "stability";
  if (process.env.SUNO_API_BASE) return "suno";
  if (process.env.RIFFUSION_API_BASE) return "riffusion";
  if (process.env.ELEVENLABS_API_KEY) return "elevenlabs";
  return "none";
}

async function runMusicStage(job: Job): Promise<MusicStageResult> {
  await setStage(job.id, "music", "running");
  let result: MusicStageResult = {};

  if (isMock()) {
    await sleep(900);
  } else {
    const provider = await pickMusicProvider();
    console.log(`[pipeline] music provider = ${provider}`);

    const tryStabilityCoverArt = async () => {
      if (process.env.STABILITY_API_KEY && !result.coverArtUrl) {
        try {
          const img = await generateCoverArt(buildCoverArtPrompt(job.brief));
          result.coverArtUrl = (await savePublic(`${job.id}-cover.jpg`, img, "image/jpeg")).url;
        } catch (e) {
          console.warn("[pipeline] Stability cover art failed:", (e as Error).message);
        }
      }
    };

    try {
      if (provider === "stability") {
        const audio = await generateMusicStability(job.brief, 47);
        result.musicUrl = (await savePublic(`${job.id}-music.mp3`, audio, "audio/mpeg")).url;
        await tryStabilityCoverArt();
      } else if (provider === "suno") {
        const remoteUrl = await generateMusic(buildMusicPrompt(job.brief));
        const buf = await fetchBytes(remoteUrl);
        result.musicUrl = (await savePublic(`${job.id}-music.mp3`, buf, "audio/mpeg")).url;
        await tryStabilityCoverArt();
      } else if (provider === "riffusion") {
        const { audio, coverArt } = await generateMusicWithArt(job.brief);
        result.musicUrl = (await savePublic(`${job.id}-music.mp3`, audio)).url;
        result.coverArtUrl = (await savePublic(`${job.id}-cover.jpg`, coverArt)).url;
      } else if (provider === "elevenlabs") {
        const buf = await generateMusicEL(buildELMusicPrompt(job.brief));
        result.musicUrl = (await savePublic(`${job.id}-music.mp3`, buf, "audio/mpeg")).url;
        await tryStabilityCoverArt();
      } else {
        console.warn("[pipeline] no music provider configured; skipping instrumental");
      }
    } catch (e) {
      const msg = (e as Error)?.message || "خطای ناشناخته";
      console.warn(`[pipeline] music provider (${provider}) failed: ${msg}; trying ElevenLabs fallback...`);
      // Fallback to ElevenLabs Sound Generation if not already tried
      if (provider !== "elevenlabs" && process.env.ELEVENLABS_API_KEY) {
        try {
          const buf = await generateMusicEL(buildELMusicPrompt(job.brief));
          result.musicUrl = (await savePublic(`${job.id}-music.mp3`, buf, "audio/mpeg")).url;
          await tryStabilityCoverArt();
        } catch (e2) {
          console.warn(`[pipeline] ElevenLabs music fallback failed: ${(e2 as Error).message}`);
          result.musicError = `${msg} (ElevenLabs fallback: ${(e2 as Error).message})`;
        }
      } else {
        result.musicError = msg;
      }
    }
  }

  // No spectrogram? fall back to the uploaded photo as cover art.
  if (!result.coverArtUrl && job.brief.photoUrl) {
    result.coverArtUrl = job.brief.photoUrl;
  }

  await setStage(job.id, "music", "done");
  return result;
}

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
  } else {
    try {
      if (!job.brief.voiceUrl) throw new Error("نمونهٔ صدا موجود نیست");
      const sample = await fetchBytes(job.brief.voiceUrl);
      const voiceId = await cloneVoice(
        job.brief.recipientName,
        sample,
        mimeFromExt(job.brief.voiceUrl)
      );
      let vocalBytes: Uint8Array;
      try {
        vocalBytes = await synthesize(voiceId, lyrics);
      } finally {
        await deleteVoice(voiceId);
      }

      // Try to mix vocal with instrumental background
      let finalBytes: Uint8Array | null = null;
      if (musicUrl) {
        try {
          const musicBytes = await fetchBytes(musicUrl);
          finalBytes = await mixVoiceAndMusic(vocalBytes, musicBytes);
          if (finalBytes) {
            console.log("[pipeline] voice + music mixed successfully");
          } else {
            console.warn("[pipeline] ffmpeg not available; using voice-only track");
          }
        } catch (mixErr) {
          console.warn("[pipeline] mix failed:", (mixErr as Error).message);
        }
      }

      audioUrl = (await savePublic(`${job.id}-final.mp3`, finalBytes ?? vocalBytes)).url;
    } catch (e) {
      console.warn(
        `[pipeline] voice clone failed (${(e as Error)?.message}); falling back to raw uploaded sample`
      );
      audioUrl = job.brief.voiceUrl || musicUrl;
    }
  }

  await setStage(job.id, "voice", "done");
  return audioUrl;
}

async function runVideoStage(
  job: Job,
  audioUrl?: string
): Promise<string | undefined> {
  await setStage(job.id, "video", "running");
  let videoUrl: string | undefined;
  const photoUrl = job.brief.photoUrl;

  if (!isMock()) {
    try {
      if (videoProvider() === "heygen") {
        const fresh = await getJob(job.id);
        const lyrics = fresh?.result?.lyrics || "";
        const buf = await generateAvatarVideo(lyrics);
        videoUrl = (await savePublic(`${job.id}-video.mp4`, buf, "video/mp4")).url;
      } else if (photoUrl && audioUrl && videoProvider() === "aurora") {
        const buf = await lipSyncAurora(toAbsoluteUrl(photoUrl), toAbsoluteUrl(audioUrl));
        videoUrl = (await savePublic(`${job.id}-video.mp4`, buf, "video/mp4")).url;
      } else if (videoProvider() === "stability" && process.env.STABILITY_API_KEY) {
        // Animate the cover art (or uploaded photo) with Stable Video Diffusion
        const sourceUrl = photoUrl;
        if (sourceUrl) {
          const imgBytes = await fetchBytes(sourceUrl);
          const buf = await animateImage(imgBytes);
          videoUrl = (await savePublic(`${job.id}-video.mp4`, buf, "video/mp4")).url;
        }
      }
    } catch (e) {
      console.warn(
        `[pipeline] video provider failed (${(e as Error)?.message}); skipping video`
      );
    }
  }
  if (isMock()) await sleep(900);

  await setStage(job.id, "video", "done");
  return videoUrl;
}

export async function runPipeline(jobId: string) {
  const job = await getJob(jobId);
  if (!job) return;

  await setJobStatus(job.id, "running");
  let result: NonNullable<Job["result"]> = {};
  try {
    const lyrics = await runLyricsStage(job);
    result = { ...result, lyrics };
    await updateJob(job.id, { result });

    const music = await runMusicStage(job);
    result = {
      ...result,
      musicUrl: music.musicUrl,
      musicError: music.musicError,
      coverArtUrl: music.coverArtUrl,
    };
    await updateJob(job.id, { result });

    const audioUrl = await runVoiceStage(job, lyrics, music.musicUrl);
    result = { ...result, audioUrl };
    await updateJob(job.id, { result });

    const videoUrl = await runVideoStage(job, audioUrl);
    result = { ...result, videoUrl };
    await updateJob(job.id, { result });

    await setStage(job.id, "finalize", "running");
    if (isMock()) await sleep(600);
    await setStage(job.id, "finalize", "done");

    await setJobStatus(job.id, "done");
  } catch (e) {
    const message = (e as Error)?.message || "خطای ناشناخته در تولید";
    const fresh = await getJob(job.id);
    const stage = fresh?.stages.find((s) => s.status === "running");
    if (stage) await setStage(job.id, stage.id, "error");
    await setJobStatus(job.id, "error", message);
  }
}
