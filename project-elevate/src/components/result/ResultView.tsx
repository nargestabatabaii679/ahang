
import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import {
  DownloadSimple,
  ArrowCounterClockwise,
  MusicNotes,
  FileText,
  CircleNotch,
  WhatsappLogo,
  TelegramLogo,
  InstagramLogo,
  LinkSimple,
  Check,
  Play,
  Pause,
  type Icon,
} from "@phosphor-icons/react";

interface ResultViewProps {
  recipientName: string;
  result: { videoUrl?: string; audioUrl?: string; musicUrl?: string; musicError?: string; lyrics?: string; coverArtUrl?: string };
  jobId?: string | null;
  onRestart: () => void;
}

export function ResultView({ recipientName, result, jobId, onRestart }: ResultViewProps) {
  const { videoUrl, audioUrl, musicUrl, musicError, lyrics, coverArtUrl } = result;
  const [keepsakeState, setKeepsakeState] = useState<"idle" | "loading" | "error">("idle");
  const [copied, setCopied] = useState(false);

  const voiceRef = useRef<HTMLAudioElement | null>(null);
  const musicRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [musicVolume, setMusicVolume] = useState(0.25);
  const [localMusicError, setLocalMusicError] = useState<string | null>(null);
  const [musicRetrying, setMusicRetrying] = useState(false);

  useEffect(() => {
    if (musicRef.current) {
      musicRef.current.volume = musicVolume;
      musicRef.current.loop = true;
    }
    if (voiceRef.current) voiceRef.current.volume = 1;
  }, [musicVolume, musicUrl, audioUrl]);

  // Wait for a media element to be playable, with a timeout.
  const waitCanPlay = (el: HTMLAudioElement, timeoutMs = 5000) =>
    new Promise<void>((resolve, reject) => {
      if (el.readyState >= 3) return resolve();
      const cleanup = () => {
        el.removeEventListener("canplaythrough", onReady);
        el.removeEventListener("canplay", onReady);
        el.removeEventListener("error", onErr);
        clearTimeout(t);
      };
      const onReady = () => { cleanup(); resolve(); };
      const onErr = () => { cleanup(); reject(new Error("media error")); };
      const t = setTimeout(() => { cleanup(); reject(new Error("timeout")); }, timeoutMs);
      el.addEventListener("canplaythrough", onReady, { once: true });
      el.addEventListener("canplay", onReady, { once: true });
      el.addEventListener("error", onErr, { once: true });
      try { el.load(); } catch {}
    });

  const prepareMusicWithRetry = async (m: HTMLAudioElement, retries = 2): Promise<boolean> => {
    for (let i = 0; i <= retries; i++) {
      try {
        if (i > 0) setMusicRetrying(true);
        await waitCanPlay(m, 6000);
        setMusicRetrying(false);
        return true;
      } catch (e) {
        console.warn(`[music] attempt ${i + 1} failed`, e);
        if (i < retries) await new Promise((r) => setTimeout(r, 500));
      }
    }
    setMusicRetrying(false);
    setLocalMusicError("موسیقی پس‌زمینه قابل پخش نشد — فقط صدا پخش می‌شود.");
    return false;
  };

  const togglePlay = async () => {
    const v = voiceRef.current;
    const m = musicRef.current;
    if (!v && !m) return;
    if (isPlaying) {
      v?.pause();
      m?.pause();
      setIsPlaying(false);
      return;
    }

    // Prepare both in parallel, but voice is independent of music success.
    const voiceReady = v ? waitCanPlay(v, 6000).then(() => true).catch(() => false) : Promise.resolve(false);
    const musicReady = m ? prepareMusicWithRetry(m, 2) : Promise.resolve(false);
    const [vOk, mOk] = await Promise.all([voiceReady, musicReady]);

    // Reset positions for tight sync
    if (v && vOk) v.currentTime = 0;
    if (m && mOk) m.currentTime = 0;

    const playPromises: Promise<unknown>[] = [];
    if (v && vOk) playPromises.push(v.play().catch((e) => { console.warn("voice play failed", e); }));
    if (m && mOk) playPromises.push(m.play().catch((e) => {
      console.warn("music play failed", e);
      setLocalMusicError("موسیقی پس‌زمینه پخش نشد.");
    }));
    await Promise.all(playPromises);
    if (vOk || mOk) setIsPlaying(true);
  };

  // Watch music stalls — if it stalls for 3s while playing, drop it (voice continues).
  useEffect(() => {
    const m = musicRef.current;
    if (!m) return;
    let stallTimer: ReturnType<typeof setTimeout> | null = null;
    const onStall = () => {
      if (stallTimer) clearTimeout(stallTimer);
      stallTimer = setTimeout(() => {
        console.warn("[music] stalled >3s, dropping background music");
        m.pause();
        setLocalMusicError("موسیقی پس‌زمینه قطع شد — صدا ادامه دارد.");
      }, 3000);
    };
    const onResume = () => { if (stallTimer) { clearTimeout(stallTimer); stallTimer = null; } };
    const onErr = () => {
      console.warn("[music] error event");
      setLocalMusicError("خطا در بارگذاری موسیقی پس‌زمینه.");
      m.pause();
    };
    m.addEventListener("stalled", onStall);
    m.addEventListener("waiting", onStall);
    m.addEventListener("playing", onResume);
    m.addEventListener("canplaythrough", onResume);
    m.addEventListener("error", onErr);
    return () => {
      if (stallTimer) clearTimeout(stallTimer);
      m.removeEventListener("stalled", onStall);
      m.removeEventListener("waiting", onStall);
      m.removeEventListener("playing", onResume);
      m.removeEventListener("canplaythrough", onResume);
      m.removeEventListener("error", onErr);
    };
  }, [musicUrl]);

  useEffect(() => {
    const v = voiceRef.current;
    if (!v) return;
    const onEnd = () => {
      musicRef.current?.pause();
      setIsPlaying(false);
    };
    v.addEventListener("ended", onEnd);
    return () => v.removeEventListener("ended", onEnd);
  }, [audioUrl]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      try { voiceRef.current?.pause(); } catch {}
      try { musicRef.current?.pause(); } catch {}
    };
  }, []);



  const downloadKeepsake = async () => {
    if (!jobId) return;
    setKeepsakeState("loading");
    try {
      const res = await fetch(`/api/jobs/${jobId}/keepsake`);
      if (!res.ok) throw new Error("ساخت کیپ‌سیک ناموفق بود");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `songai-${jobId}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
      setKeepsakeState("idle");
    } catch {
      setKeepsakeState("error");
    }
  };

  const shareUrl = typeof window !== "undefined" && jobId ? `${window.location.origin}/gift/${jobId}` : "";
  const shareText = `یک هدیه برای «${recipientName}» ساختم؛ یه آهنگ با صدای خودم 🎵`;

  const shareWhatsapp = () => window.open(`https://wa.me/?text=${encodeURIComponent(`${shareText}\n${shareUrl}`)}`, "_blank");
  const shareTelegram = () => window.open(`https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareText)}`, "_blank");
  const shareInstagram = async () => {
    if (navigator.share) { try { await navigator.share({ title: "songai", text: shareText, url: shareUrl }); return; } catch {} }
    await copyLink();
  };
  const copyLink = async () => {
    try { await navigator.clipboard.writeText(shareUrl); setCopied(true); setTimeout(() => setCopied(false), 2000); } catch {}
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      className="mx-auto max-w-xl"
    >
      {/* Lime banner sticker */}
      <div className="sticker-card-lime relative -rotate-1 p-6 text-center">
        <span aria-hidden className="sticker-chip absolute -top-4 -left-3">آماده شد</span>
        <p className="font-counter text-[10px] uppercase tracking-[0.3em] text-[var(--color-muted-foreground)]">
          YOUR GIFT IS READY
        </p>
        <h2 className="font-display mt-2 text-3xl sm:text-4xl">
          هدیهٔ <span className="text-aurora">{recipientName}</span>
        </h2>
        <p className="mt-2 text-sm text-[var(--color-muted-foreground)]">با صدای واقعی، فقط برای او</p>
      </div>

      {/* Media card */}
      <div className="sticker-card relative mt-10 rotate-1 overflow-hidden p-4 sm:p-5">
        {videoUrl ? (
          <div className="relative">
            <video
              src={videoUrl}
              poster={coverArtUrl}
              controls
              playsInline
              className="aspect-square w-full bg-black object-cover"
              aria-label={`ویدیوی هدیه برای ${recipientName}`}
            />
            <span aria-hidden className="font-display pointer-events-none absolute right-3 top-3 bg-[var(--color-accent)] px-3 py-1.5 text-xs text-[var(--color-accent-foreground)] shadow-[3px_3px_0_0_var(--color-primary)]">
              برای «{recipientName}» ❤️
            </span>
          </div>
        ) : audioUrl ? (
          <div className="flex flex-col items-center gap-5 py-2">
            {coverArtUrl ? (
              <div className="relative w-full">
                <img
                  src={coverArtUrl}
                  alt={`کاور آهنگ ساخته‌شده برای ${recipientName}`}
                  className="aspect-square w-full border-2 border-[var(--color-primary)] object-cover"
                />
                <span aria-hidden className="absolute -top-3 -right-3 grid h-16 w-16 place-items-center rounded-full border-2 border-[var(--color-background)] bg-[var(--color-accent)] text-[var(--color-accent-foreground)] shadow-[3px_3px_0_0_var(--color-primary)] animate-spin-slow">
                  <Play className="h-7 w-7" weight="fill" />
                </span>
              </div>
            ) : (
              <span aria-hidden className="grid h-20 w-20 place-items-center bg-[var(--color-primary)] text-[var(--color-primary-foreground)]">
                <MusicNotes className="h-9 w-9" />
              </span>
            )}
            <div className="flex w-full flex-col items-stretch gap-3">
              <button
                type="button"
                onClick={togglePlay}
                className="tap inline-flex items-center justify-center gap-2 border-2 border-[var(--color-primary)] bg-[var(--color-primary)] px-4 py-3 text-sm font-black text-[var(--color-primary-foreground)] shadow-[4px_4px_0_0_var(--color-accent)] transition hover:-translate-y-0.5"
                aria-label={isPlaying ? "توقف" : "پخش آهنگ"}
              >
                {isPlaying ? <Pause className="h-4 w-4" weight="fill" /> : <Play className="h-4 w-4" weight="fill" />}
                {isPlaying ? "توقف" : "پخش هدیه"}
              </button>
              <audio ref={voiceRef} src={audioUrl} controls className="w-full" aria-label={`آهنگ هدیه برای ${recipientName}`} />
              {musicUrl && (
                <>
                  <audio ref={musicRef} src={musicUrl} preload="auto" crossOrigin="anonymous" aria-hidden />
                  <label className="flex items-center gap-3 text-xs text-[var(--color-muted-foreground)]">
                    <MusicNotes className="h-4 w-4 shrink-0" />
                    صدای موسیقی پس‌زمینه
                    <input
                      type="range"
                      min={0}
                      max={1}
                      step={0.05}
                      value={musicVolume}
                      onChange={(e) => setMusicVolume(parseFloat(e.target.value))}
                      className="flex-1"
                      aria-label="میزان صدای موسیقی پس‌زمینه"
                    />
                  </label>
                </>
              )}
              {musicUrl && musicRetrying && (
                <p className="text-[11px] leading-5 text-[var(--color-muted-foreground)]">
                  ⏳ در حال آماده‌سازی موسیقی پس‌زمینه…
                </p>
              )}
              {musicUrl && localMusicError && (
                <div className="flex flex-col gap-1.5">
                  <p className="text-[11px] leading-5 text-[var(--color-muted-foreground)]">
                    خطا در بارگذاری موسیقی
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setLocalMusicError(null);
                      if (musicRef.current) {
                        musicRef.current.load();
                      }
                    }}
                    className="tap self-start inline-flex items-center gap-1.5 border border-[var(--color-primary)]/40 px-2.5 py-1 text-[11px] font-black text-[var(--color-foreground)] transition hover:border-[var(--color-accent)]"
                  >
                    <ArrowCounterClockwise className="h-3 w-3" />
                    تلاش مجدد
                  </button>
                </div>
              )}
              {!musicUrl && (
                <p className="text-[11px] leading-5 text-[var(--color-muted-foreground)]">
                  موسیقی پس‌زمینه ساخته نشد
                  {musicError && (
                    <span className="block opacity-60 mt-1 break-all">{musicError}</span>
                  )}
                </p>
              )}
            </div>
          </div>
        ) : null}
      </div>

      {/* Metadata chips */}


      <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
        {videoUrl && <span className="sticker-chip" style={{ transform: "rotate(-3deg)" }}>🎬 ویدیو</span>}
        <span className="sticker-chip" style={{ transform: "rotate(2deg)" }}>🎙️ صدای خودت</span>
        {videoUrl && <span className="sticker-chip" style={{ transform: "rotate(-2deg)" }}>😊 چهره</span>}
        <span className="sticker-chip" style={{ transform: "rotate(4deg)" }}>🎵 موسیقی اختصاصی</span>
      </div>

      {lyrics && (
        <div className="sticker-card mt-8 -rotate-1 p-6">
          <p className="font-counter mb-3 text-[10px] uppercase tracking-[0.2em] text-[var(--color-accent)]">side a · متن ترانه</p>
          <p className="whitespace-pre-line text-[15px] leading-[2] text-[var(--color-foreground)]">{lyrics}</p>
        </div>
      )}

      {keepsakeState === "error" && (
        <p className="mt-3 text-center text-xs text-[var(--color-danger)]">ساخت PDF فعلاً فعال نیست — دوباره تلاش کن</p>
      )}

      {/* Downloads */}
      <div className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-3">
        {videoUrl && (
          <a href={videoUrl} download className="tap inline-flex items-center justify-center gap-2 border-2 border-[var(--color-primary)] bg-[var(--color-primary)] px-4 py-3 text-sm font-black text-[var(--color-primary-foreground)] shadow-[4px_4px_0_0_var(--color-accent)] transition hover:-translate-y-0.5">
            <DownloadSimple className="h-4 w-4" /> دانلود ویدیو
          </a>
        )}
        {audioUrl && (
          <a href={audioUrl} download className="tap inline-flex items-center justify-center gap-2 border-2 border-[var(--color-accent)] bg-transparent px-4 py-3 text-sm font-black text-[var(--color-accent)] shadow-[4px_4px_0_0_var(--color-primary)] transition hover:-translate-y-0.5">
            <MusicNotes className="h-4 w-4" /> دانلود آهنگ
          </a>
        )}
        {lyrics && jobId && (
          <button
            onClick={downloadKeepsake}
            disabled={keepsakeState === "loading"}
            className="tap inline-flex items-center justify-center gap-2 border-2 border-[var(--color-accent)] bg-transparent px-4 py-3 text-sm font-black text-[var(--color-accent)] shadow-[4px_4px_0_0_var(--color-primary)] transition hover:-translate-y-0.5 disabled:opacity-50"
          >
            {keepsakeState === "loading" ? <CircleNotch className="h-4 w-4 animate-spin" /> : <FileText className="h-4 w-4" />}
            متن ترانه
          </button>
        )}
      </div>

      {/* Share */}
      <div className="mt-8">
        <p className="mb-3 text-center text-xs font-black uppercase tracking-widest text-[var(--color-muted-foreground)]">
          ارسال به واتس‌اپ یا …
        </p>
        <div className="grid grid-cols-4 gap-2">
          <ShareButton onClick={shareWhatsapp} icon={WhatsappLogo} label="واتس‌اپ" />
          <ShareButton onClick={shareTelegram} icon={TelegramLogo} label="تلگرام" />
          <ShareButton onClick={shareInstagram} icon={InstagramLogo} label="استوری" />
          <ShareButton onClick={copyLink} icon={copied ? Check : LinkSimple} label={copied ? "کپی شد" : "کپی لینک"} />
        </div>
      </div>

      <div className="mt-8 text-center">
        <p className="mb-4 text-sm text-[var(--color-muted-foreground)]">امیدواریم این آهنگ، لبخند روی لبش بیاورد ❤️</p>
        <button
          onClick={onRestart}
          className="tap inline-flex items-center justify-center gap-2 border-2 border-[var(--color-primary)] bg-transparent px-5 py-3 text-sm font-black text-[var(--color-primary)] transition hover:bg-[var(--color-primary)] hover:text-[var(--color-primary-foreground)]"
        >
          <ArrowCounterClockwise className="h-4 w-4" />
          ساختن برای یک نفر دیگر
        </button>
      </div>
    </motion.div>
  );
}

function ShareButton({ onClick, icon: I, label }: { onClick: () => void; icon: Icon; label: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className="tap flex flex-col items-center justify-center gap-1.5 border-2 border-[var(--color-primary)]/40 bg-[var(--color-card)] py-3 text-[11px] font-black text-[var(--color-foreground)] transition hover:border-[var(--color-accent)] hover:-translate-y-0.5"
    >
      <I className="h-5 w-5" />
      {label}
    </button>
  );
}
