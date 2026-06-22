import { Job } from "./types";
import { setStage, setJobStatus, updateJob } from "./jobs-store";
import { savePublic, publicDirPath } from "./storage";
import { draftLyrics, buildMusicPrompt } from "./providers/lyrics";
import { cloneVoice, synthesize, deleteVoice, mimeFromExt } from "./providers/elevenlabs";
import { generateMusic } from "./providers/suno";
import { generateMusicWithArt } from "./providers/riffusion";
import { lipSyncVideo as lipSyncRunComfy } from "./providers/runcomfy";
import { lipSyncVideo as lipSyncAurora } from "./providers/creatify";
import { lipSyncVideo as lipSyncSynclabs } from "./providers/synclabs";
import { lipSyncVideo as lipSyncHiggsfield } from "./providers/higgsfield";
import { generateAvatarVideo } from "./providers/heygen";
import {
  mixVoiceOverMusic,
  photoPlusAudioVideo,
  mockMusic,
  stripVideoMetadata,
} from "./providers/ffmpeg";
import path from "path";
import { readFile } from "fs/promises";
import { sleep } from "./server-utils";

const isMock = () => process.env.PIPELINE_MOCK === "true";
const musicProvider = () => process.env.MUSIC_PROVIDER || "riffusion"; // "riffusion" | "suno"
const videoProvider = () => process.env.VIDEO_PROVIDER || "synclabs"; // "synclabs" | "higgsfield" | "omnihuman" | "aurora" | "kling"
const absUrl = (url: string) =>
  `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}${url}`;

/** Route to the configured lipsync vendor — all accept (imageUrl, audioUrl). */
function lipSyncVideo(imageUrl: string, audioUrl: string): Promise<Buffer> {
  switch (videoProvider()) {
    case "aurora":     return lipSyncAurora(imageUrl, audioUrl);
    case "higgsfield": return lipSyncHiggsfield(imageUrl, audioUrl);
    case "synclabs":   return lipSyncSynclabs(imageUrl, audioUrl);
    default:           return lipSyncRunComfy(imageUrl, audioUrl); // omnihuman / kling
  }
}

/**
 * When VIDEO_PROVIDER=heygen, generate an avatar video directly from the
 * lyrics text rather than doing lipsync from a photo. The avatar speaks
 * the lyrics over HeyGen's Avatar V engine.
 */
async function runHeyGenVideoStage(job: Job, lyrics: string): Promise<string | undefined> {
  setStage(job.id, "video", "running");
  try {
    const raw = await generateAvatarVideo(lyrics);
    const buf = await stripVideoMetadata(raw);
    const videoUrl = (await savePublic(`${job.id}-video.mp4`, buf)).url;
    setStage(job.id, "video", "done");
    return videoUrl;
  } catch (e) {
    console.warn(`[pipeline] HeyGen avatar failed (${(e as Error)?.message})`);
    setStage(job.id, "video", "done");
    return undefined;
  }
}

const MOCK_SEED_ART: Record<string, string> = {
  romantic: "vibes.png",
  emotional: "vibes.png",
  happy: "agile.png",
  calm: "og_beat.png",
  motivational: "motorway.png",
  nostalgic: "marim.png",
};

interface MusicStageResult {
  musicUrl: string;
  coverArtUrl?: string;
}

/**
 * Stage 1 — lyrics. Owns its own setStage(running/done) calls so each
 * stage function is a self-contained, independently testable unit: given
 * a job, it drives exactly its own checkmark and returns exactly what the
 * next stage needs, nothing more.
 */
async function runLyricsStage(job: Job): Promise<string> {
  setStage(job.id, "lyrics", "running");
  const lyrics = await draftLyrics(job.brief);
  if (isMock()) await sleep(1600);
  setStage(job.id, "lyrics", "done");
  return lyrics;
}

/**
 * Stage 2 — music. Riffusion generates audio by diffusing a spectrogram
 * image and interpolating between a start/end prompt pair, so we also get
 * back the literal spectrogram it produced, which becomes the song's
 * cover art.
 */
async function runMusicStage(job: Job): Promise<MusicStageResult> {
  setStage(job.id, "music", "running");
  let musicUrl: string;
  let coverArtUrl: string | undefined;

  if (isMock()) {
    const { url, cover } = await mockMusicWithArt(job);
    musicUrl = url;
    coverArtUrl = cover;
    await sleep(1200);
  } else {
    try {
      if (musicProvider() === "riffusion") {
        const { audio, coverArt } = await generateMusicWithArt(job.brief);
        musicUrl = (await savePublic(`${job.id}-music.mp3`, audio)).url;
        coverArtUrl = (await savePublic(`${job.id}-cover.jpg`, coverArt)).url;
      } else {
        musicUrl = await generateMusic(buildMusicPrompt(job.brief));
      }
    } catch (e) {
      // Graceful fallback, same principle as the lyrics/video stages: an
      // unconfigured or unreachable music provider (no RIFFUSION_API_BASE
      // running, no Suno service) shouldn't fail the whole job — it should
      // degrade to a placeholder instrumental so the rest of the pipeline
      // (the part that actually matters most: the user's own voice) still
      // produces a real result.
      console.warn(
        `[pipeline] music provider failed (${(e as Error)?.message}); falling back to placeholder instrumental`
      );
      const { url, cover } = await mockMusicWithArt(job);
      musicUrl = url;
      coverArtUrl = cover;
    }
  }

  setStage(job.id, "music", "done");
  return { musicUrl, coverArtUrl };
}

/** Placeholder instrumental + a genre-matched spectrogram image, used both
 *  in PIPELINE_MOCK and as the music stage's fallback when no real
 *  provider is configured/reachable. */
async function mockMusicWithArt(
  job: Job
): Promise<{ url: string; cover?: string }> {
  const buf = await mockMusic();
  const url = (await savePublic(`${job.id}-music.mp3`, buf)).url;
  const seedArt = MOCK_SEED_ART[job.brief.genre];
  const artPath = path.join(process.cwd(), "public", "riffusion-seeds", seedArt);
  const artBuf = await readFile(artPath).catch(() => null);
  const cover = artBuf
    ? (await savePublic(`${job.id}-cover.png`, artBuf)).url
    : undefined;
  return { url, cover };
}

/**
 * Stage 3 — voice. Clones the voice and sings the lyrics over it, then
 * mixes onto the instrumental. Mixing happens silently at the tail of this
 * same stage — the product spec shows no separate "mixing" checkmark, just
 * "ساخت صدای اختصاصی".
 */
async function runVoiceStage(
  job: Job,
  lyrics: string,
  musicUrl: string
): Promise<string> {
  setStage(job.id, "voice", "running");
  let voiceUrl: string;

  if (isMock()) {
    // reuse the user's uploaded sample as the "voice" track
    voiceUrl = job.brief.voiceUrl || musicUrl;
    await sleep(2000);
  } else {
    try {
      const samplePath = publicDirPath(
        (job.brief.voiceUrl || "").split("/").pop() || ""
      );
      const voiceId = await cloneVoice(
        job.brief.recipientName,
        samplePath,
        mimeFromExt(job.brief.voiceUrl || "")
      );
      try {
        const audio = await synthesize(voiceId, lyrics);
        voiceUrl = (await savePublic(`${job.id}-voice.mp3`, audio)).url;
      } finally {
        await deleteVoice(voiceId);
      }
    } catch (e) {
      // Graceful fallback: an unconfigured/unreachable ElevenLabs call
      // (missing ELEVENLABS_API_KEY, rate limit, sample it can't parse)
      // shouldn't fail the whole job — fall back to the user's own raw
      // recording mixed under the music, same as mock mode does.
      console.warn(
        `[pipeline] voice clone failed (${(e as Error)?.message}); falling back to the raw uploaded sample`
      );
      voiceUrl = job.brief.voiceUrl || musicUrl;
    }
  }

  const mixBuf = await mixVoiceOverMusic(voiceUrl, musicUrl);
  const audioUrl = (await savePublic(`${job.id}-final.mp3`, mixBuf)).url;
  if (isMock()) await sleep(900);
  setStage(job.id, "voice", "done");
  return audioUrl;
}

/**
 * Stage 4 — video. Falls back to a still-photo video if the lip-sync
 * provider fails, so the user always gets a result even when the avatar
 * model is unavailable.
 */
async function runVideoStage(job: Job, audioUrl: string): Promise<string | undefined> {
  setStage(job.id, "video", "running");
  let videoUrl: string | undefined;
  const photoUrl = job.brief.photoUrl;

  if (isMock()) {
    if (photoUrl) {
      const buf = await photoPlusAudioVideo(photoUrl, audioUrl);
      videoUrl = (await savePublic(`${job.id}-video.mp4`, buf)).url;
    }
    await sleep(1500);
  } else if (photoUrl) {
    try {
      const raw = await lipSyncVideo(absUrl(photoUrl), absUrl(audioUrl));
      const buf = await stripVideoMetadata(raw);
      videoUrl = (await savePublic(`${job.id}-video.mp4`, buf)).url;
    } catch {
      // graceful fallback to a still-photo video so the user always gets a result
      const buf = await photoPlusAudioVideo(photoUrl, audioUrl);
      videoUrl = (await savePublic(`${job.id}-video.mp4`, buf)).url;
    }
  }

  setStage(job.id, "video", "done");
  return videoUrl;
}

/**
 * Runs the full generation pipeline for a job, updating stage state as it goes.
 * Fire-and-forget: callers don't await this; the client polls /api/jobs/[id].
 *
 * This is a thin orchestrator — each stage's actual work lives in its own
 * function above, independently testable in isolation by mocking the
 * providers it calls. `result` is accumulated locally and re-sent in full
 * on every update; reading `job.result` after the fact would silently drop
 * fields set by earlier stages, since `job` is a point-in-time snapshot.
 */
export async function runPipeline(job: Job) {
  setJobStatus(job.id, "running");
  let result: NonNullable<Job["result"]> = {};
  try {
    const lyrics = await runLyricsStage(job);
    result = { ...result, lyrics };
    updateJob(job.id, { result });

    const { musicUrl, coverArtUrl } = await runMusicStage(job);
    result = { ...result, coverArtUrl };
    updateJob(job.id, { result });

    const audioUrl = await runVoiceStage(job, lyrics, musicUrl);
    result = { ...result, audioUrl };
    updateJob(job.id, { result });

    const videoUrl =
      videoProvider() === "heygen"
        ? await runHeyGenVideoStage(job, lyrics)
        : await runVideoStage(job, audioUrl);
    result = { ...result, videoUrl };
    updateJob(job.id, { result });

    // Stage 5 — finalize: a cosmetic last step ("در حال آماده‌سازی هدیه")
    // so the ending reads as one coherent reveal rather than stopping
    // abruptly right after video.
    setStage(job.id, "finalize", "running");
    if (isMock()) await sleep(700);
    setStage(job.id, "finalize", "done");

    setJobStatus(job.id, "done");
  } catch (e: any) {
    const stage = job.stages.find((s) => s.status === "running");
    if (stage) setStage(job.id, stage.id, "error");
    setJobStatus(job.id, "error", e?.message || "خطای ناشناخته در تولید");
  }
}
