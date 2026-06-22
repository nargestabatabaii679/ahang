
import { useEffect, useRef, useState } from "react";
import { Microphone, Square, UploadSimple, X, Play, Pause } from "@phosphor-icons/react";
import { cn, toFa } from "@/lib/utils";

interface VoiceInputProps {
  file: File | null;
  onChange: (f: File | null) => void;
}

export function VoiceInput({ file, onChange }: VoiceInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const mediaRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const audioRef = useRef<HTMLAudioElement>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const [recording, setRecording] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [url, setUrl] = useState<string | null>(null);

  // Create the object URL exactly once per file, and revoke it on cleanup
  // to avoid leaking blob memory across re-renders.
  useEffect(() => {
    if (!file) {
      setUrl(null);
      return;
    }
    const objectUrl = URL.createObjectURL(file);
    setUrl(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [file]);

  useEffect(
    () => () => {
      stopTimer();
      streamRef.current?.getTracks().forEach((t) => t.stop());
    },
    []
  );

  const stopTimer = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = null;
  };

  const startRecording = async () => {
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const rec = new MediaRecorder(stream);
      chunksRef.current = [];
      rec.ondataavailable = (e) => e.data.size && chunksRef.current.push(e.data);
      rec.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        onChange(new File([blob], "recording.webm", { type: "audio/webm" }));
        stream.getTracks().forEach((t) => t.stop());
      };
      rec.start();
      mediaRef.current = rec;
      setRecording(true);
      setSeconds(0);
      timerRef.current = setInterval(() => setSeconds((s) => s + 1), 1000);
    } catch {
      setError("دسترسی به میکروفون ممکن نشد. می‌توانی فایل صدا را بارگذاری کنی.");
    }
  };

  const stopRecording = () => {
    if (mediaRef.current && mediaRef.current.state !== "inactive") {
      mediaRef.current.stop();
    }
    setRecording(false);
    stopTimer();
  };

  const togglePlay = () => {
    const a = audioRef.current;
    if (!a) return;
    if (a.paused) {
      a.play();
      setPlaying(true);
    } else {
      a.pause();
      setPlaying(false);
    }
  };

  const fmt = (s: number) =>
    `${toFa(String(Math.floor(s / 60)).padStart(2, "0"))}:${toFa(
      String(s % 60).padStart(2, "0")
    )}`;

  if (url) {
    return (
      <div className="rounded-3xl border border-border bg-white/[0.03] p-5">
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={togglePlay}
            className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-gradient-to-br from-tape to-thread text-primary-foreground"
            aria-label={playing ? "توقف" : "پخش"}
          >
            {playing ? (
              <Pause className="h-5 w-5" weight="fill" />
            ) : (
              <Play className="h-5 w-5" weight="fill" />
            )}
          </button>
          <div className="flex-1">
            <p className="text-sm font-bold">نمونهٔ صدا آماده است</p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              برای جایگزینی، حذف کن و دوباره ضبط/بارگذاری کن
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              onChange(null);
              setPlaying(false);
            }}
            className="grid h-9 w-9 place-items-center rounded-full bg-white/5 text-foreground/70 transition hover:bg-white/10"
            aria-label="حذف صدا"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <audio
          ref={audioRef}
          src={url}
          onEnded={() => setPlaying(false)}
          className="hidden"
        />
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div
        className={cn(
          "flex flex-col items-center justify-center gap-4 rounded-3xl border-2 border-dashed p-8 text-center transition-colors",
          recording ? "border-danger/60 bg-danger/5" : "border-border bg-white/[0.02]"
        )}
      >
        {recording ? (
          <>
            <div className="flex items-center gap-2 text-[var(--color-danger)]">
              <span aria-hidden className="h-3 w-3 animate-pulse rounded-full bg-[var(--color-danger)]" />
              <span className="nums text-lg font-black" aria-live="polite">{fmt(seconds)}</span>
            </div>
            <button
              type="button"
              onClick={stopRecording}
              className="tap relative grid h-20 w-20 place-items-center rounded-full bg-[var(--color-danger)] text-white"
              aria-label="پایان ضبط"
            >
              <span aria-hidden className="absolute inset-0 rounded-full bg-[var(--color-danger)]/50 animate-ripple" />
              <span aria-hidden className="absolute inset-0 rounded-full bg-[var(--color-danger)]/30 animate-ripple [animation-delay:600ms]" />
              <Square className="relative h-7 w-7" weight="fill" />
            </button>
            {/* Live eq bars */}
            <div aria-hidden className="flex items-end gap-1 h-6">
              {[0.6, 0.9, 0.4, 1, 0.5, 0.8, 0.45].map((h, i) => (
                <span key={i} className="eq-bar" style={{ height: `${h * 100}%`, background: "var(--color-danger)", animationDelay: `${i * 90}ms` }} />
              ))}
            </div>
            <span className="text-xs text-[var(--color-muted-foreground)]">
              چند جمله طبیعی حرف بزن؛ ۱۰ تا ۳۰ ثانیه کافیست
            </span>
          </>
        ) : (
          <>
            <button
              type="button"
              onClick={startRecording}
              className="tap grid h-20 w-20 place-items-center rounded-full bg-[var(--color-primary)] text-[var(--color-primary-foreground)] shadow-[0_0_24px_var(--color-primary)] animate-neon-pulse transition hover:-translate-y-0.5"
              aria-label="شروع ضبط صدا"
            >
              <Microphone className="h-8 w-8" weight="fill" />
            </button>
            <span className="text-sm font-black">برای ضبط صدا بزن</span>
            <span className="text-xs text-[var(--color-muted-foreground)]">
              یک نمونهٔ تمیز و بدون نویز، بهترین نتیجه را می‌دهد
            </span>
          </>
        )}

      </div>

      <div className="flex items-center gap-3">
        <span className="h-px flex-1 bg-border" />
        <span className="text-xs text-muted-foreground">یا</span>
        <span className="h-px flex-1 bg-border" />
      </div>

      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className="flex w-full items-center justify-center gap-2 rounded-2xl border border-border bg-white/[0.02] py-3 text-sm font-bold text-foreground/80 transition hover:border-tape/40 hover:bg-white/[0.04]"
      >
        <UploadSimple className="h-4 w-4" />
        بارگذاری فایل صوتی
      </button>
      {error && <p className="text-center text-xs text-danger">{error}</p>}
      <input
        ref={inputRef}
        type="file"
        accept="audio/*"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) onChange(f);
        }}
      />
    </div>
  );
}
