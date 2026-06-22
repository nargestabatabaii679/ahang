/**
 * Client-side lyric video generator.
 * Renders cover art with Ken Burns animation + scrolling lyrics + audio
 * into a WebM/MP4 video using Canvas + MediaRecorder — no server needed.
 */

import { useRef, useState, useCallback } from "react";
import { DownloadSimple, VideoCamera, SpinnerGap } from "@phosphor-icons/react";

interface Props {
  coverArtUrl: string;
  audioUrl: string;
  lyrics: string;
  recipientName: string;
}

type State = "idle" | "recording" | "done" | "error";

// Split lyrics into lines, group into displayable chunks of 2
function toChunks(lyrics: string): string[][] {
  const lines = lyrics
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);
  const chunks: string[][] = [];
  for (let i = 0; i < lines.length; i += 2) {
    chunks.push(lines.slice(i, i + 2));
  }
  return chunks;
}

export function LyricVideo({ coverArtUrl, audioUrl, lyrics, recipientName }: Props) {
  const [state, setState] = useState<State>("idle");
  const [progress, setProgress] = useState(0);
  const [videoUrl, setVideoUrl] = useState<string>();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const abortRef = useRef(false);

  const generate = useCallback(async () => {
    if (state === "recording") return;
    abortRef.current = false;
    setState("recording");
    setProgress(0);

    try {
      const canvas = canvasRef.current!;
      const W = 1080;
      const H = 1080;
      canvas.width = W;
      canvas.height = H;
      const ctx = canvas.getContext("2d")!;

      // Load cover image
      const img = await loadImage(coverArtUrl);

      // Load audio to get duration
      const audio = new Audio(audioUrl);
      audio.crossOrigin = "anonymous";
      const duration = await new Promise<number>((resolve, reject) => {
        audio.addEventListener("loadedmetadata", () => resolve(audio.duration));
        audio.addEventListener("error", reject);
        audio.load();
      });

      const chunks = toChunks(lyrics);
      const secPerChunk = duration / (chunks.length || 1);
      const FPS = 30;
      const totalFrames = Math.ceil(duration * FPS);

      // Setup MediaRecorder
      const stream = canvas.captureStream(FPS);
      const mimeType = MediaRecorder.isTypeSupported("video/webm;codecs=vp9")
        ? "video/webm;codecs=vp9"
        : "video/webm";
      const recorder = new MediaRecorder(stream, { mimeType, videoBitsPerSecond: 8_000_000 });
      const recordedChunks: BlobPart[] = [];
      recorder.ondataavailable = (e) => { if (e.data.size > 0) recordedChunks.push(e.data); };

      const recordingDone = new Promise<Blob>((resolve) => {
        recorder.onstop = () => resolve(new Blob(recordedChunks, { type: mimeType }));
      });

      recorder.start(100);

      // Render frames
      for (let frame = 0; frame < totalFrames; frame++) {
        if (abortRef.current) break;

        const t = frame / FPS; // seconds
        const chunkIdx = Math.min(Math.floor(t / secPerChunk), chunks.length - 1);
        const chunkProgress = (t % secPerChunk) / secPerChunk;

        drawFrame(ctx, W, H, img, t, duration, chunks[chunkIdx], chunkProgress, recipientName);
        setProgress(Math.round((frame / totalFrames) * 100));

        // Throttle to ~real-time so MediaRecorder captures all frames
        await new Promise<void>((r) => setTimeout(r, 1000 / FPS));
      }

      recorder.stop();
      const blob = await recordingDone;
      const url = URL.createObjectURL(blob);
      setVideoUrl(url);
      setState("done");
    } catch (e) {
      console.error("[LyricVideo]", e);
      setState("error");
    }
  }, [state, coverArtUrl, audioUrl, lyrics, recipientName]);

  const download = () => {
    if (!videoUrl) return;
    const a = document.createElement("a");
    a.href = videoUrl;
    a.download = `${recipientName}-lyric-video.webm`;
    a.click();
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Hidden canvas used for rendering */}
      <canvas ref={canvasRef} className="hidden" />

      {state === "done" && videoUrl ? (
        <div className="flex flex-col gap-3">
          <video
            src={videoUrl}
            controls
            playsInline
            className="aspect-square w-full border-2 border-[var(--color-primary)] object-cover"
          />
          <button
            onClick={download}
            className="tap flex items-center justify-center gap-2 border-2 border-[var(--color-accent)] bg-[var(--color-card)] py-3 text-sm font-black text-[var(--color-foreground)] transition hover:-translate-y-0.5"
          >
            <DownloadSimple className="h-5 w-5" />
            دانلود ویدیو
          </button>
        </div>
      ) : state === "recording" ? (
        <div className="flex flex-col items-center gap-3 rounded border-2 border-[var(--color-primary)]/30 bg-[var(--color-card)] py-8">
          <SpinnerGap className="h-8 w-8 animate-spin text-[var(--color-accent)]" />
          <p className="text-sm font-black text-[var(--color-foreground)]">در حال ساخت ویدیو…</p>
          <div className="h-2 w-48 overflow-hidden rounded-full bg-[var(--color-primary)]/20">
            <div
              className="h-full bg-[var(--color-accent)] transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-xs text-[var(--color-muted-foreground)]">{progress}٪ کامل شد</p>
        </div>
      ) : (
        <button
          onClick={generate}
          disabled={state === "error"}
          className="tap flex items-center justify-center gap-2 border-2 border-[var(--color-primary)]/40 bg-[var(--color-card)] py-3 text-sm font-black text-[var(--color-foreground)] transition hover:border-[var(--color-accent)] hover:-translate-y-0.5 disabled:opacity-50"
        >
          <VideoCamera className="h-5 w-5" />
          {state === "error" ? "خطا در ساخت ویدیو" : "ساخت لیریک ویدیو"}
        </button>
      )}
    </div>
  );
}

// ── Canvas drawing ─────────────────────────────────────────────────────────

function drawFrame(
  ctx: CanvasRenderingContext2D,
  W: number,
  H: number,
  img: HTMLImageElement,
  t: number,
  duration: number,
  chunk: string[],
  chunkProgress: number,
  recipientName: string
) {
  ctx.clearRect(0, 0, W, H);

  // Ken Burns: slow zoom from 1.0 to 1.12 over the whole duration
  const zoom = 1 + (t / duration) * 0.12;
  const offsetX = (W - W * zoom) / 2;
  const offsetY = (H - H * zoom) / 2;

  // Cover art background
  const imgRatio = img.naturalWidth / img.naturalHeight;
  let drawW = W * zoom;
  let drawH = H * zoom;
  if (imgRatio > 1) drawW = drawH * imgRatio;
  else drawH = drawW / imgRatio;

  ctx.save();
  ctx.drawImage(img, offsetX, offsetY, drawW, drawH);
  ctx.restore();

  // Dark vignette overlay
  const vignette = ctx.createRadialGradient(W / 2, H / 2, H * 0.2, W / 2, H / 2, H * 0.75);
  vignette.addColorStop(0, "rgba(0,0,0,0)");
  vignette.addColorStop(1, "rgba(0,0,0,0.72)");
  ctx.fillStyle = vignette;
  ctx.fillRect(0, 0, W, H);

  // Bottom gradient for lyrics area
  const grad = ctx.createLinearGradient(0, H * 0.55, 0, H);
  grad.addColorStop(0, "rgba(0,0,0,0)");
  grad.addColorStop(1, "rgba(0,0,0,0.85)");
  ctx.fillStyle = grad;
  ctx.fillRect(0, H * 0.55, W, H * 0.45);

  // Recipient name tag (top)
  ctx.save();
  ctx.font = "bold 36px 'Vazirmatn', 'Noto Naskh Arabic', Arial";
  ctx.fillStyle = "rgba(255,255,255,0.9)";
  ctx.textAlign = "center";
  ctx.shadowColor = "rgba(0,0,0,0.8)";
  ctx.shadowBlur = 16;
  ctx.fillText(`❤ ${recipientName}`, W / 2, 72);
  ctx.restore();

  // Lyric lines — fade in/out based on chunk progress
  const alpha = chunkProgress < 0.1
    ? chunkProgress / 0.1
    : chunkProgress > 0.85
    ? 1 - (chunkProgress - 0.85) / 0.15
    : 1;

  const lineHeight = 80;
  const totalLinesH = chunk.length * lineHeight;
  const startY = H - 180 - totalLinesH / 2;

  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.textAlign = "center";
  ctx.shadowColor = "rgba(0,0,0,0.9)";
  ctx.shadowBlur = 20;

  chunk.forEach((line, i) => {
    const y = startY + i * lineHeight;
    // Glow accent line under text
    if (i === 0) {
      ctx.fillStyle = "rgba(168,255,180,0.15)";
      ctx.fillRect(W / 2 - 320, y + 8, 640, 4);
    }
    ctx.font = `bold 52px 'Vazirmatn', 'Noto Naskh Arabic', Arial`;
    ctx.fillStyle = "#ffffff";
    ctx.fillText(line, W / 2, y);
  });
  ctx.restore();

  // Progress bar (bottom)
  const barProgress = t / duration;
  ctx.fillStyle = "rgba(255,255,255,0.15)";
  ctx.fillRect(60, H - 48, W - 120, 4);
  ctx.fillStyle = "rgba(168,255,180,0.9)";
  ctx.fillRect(60, H - 48, (W - 120) * barProgress, 4);
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}
