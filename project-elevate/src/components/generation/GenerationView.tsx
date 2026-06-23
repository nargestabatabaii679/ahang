import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, CircleNotch, WarningCircle, Sparkle } from "@phosphor-icons/react";
import { Waveform } from "@/components/Waveform";
import { Button } from "@/components/ui/button";
import { cn, toFa } from "@/lib/utils";
import { STAGE_META, STAGE_ORDER, StageState, JobStatus } from "@/lib/types";

interface JobSnapshot {
  status: JobStatus;
  progress: number;
  stages: StageState[];
  error?: string;
  result?: { videoUrl?: string; audioUrl?: string; musicUrl?: string; musicError?: string; lyrics?: string; coverArtUrl?: string };
}

interface GenerationViewProps {
  jobId: string;
  recipientName: string;
  onDone: (result: NonNullable<JobSnapshot["result"]>) => void;
  onRetry: () => void;
}

export function GenerationView({ jobId, recipientName, onDone, onRetry }: GenerationViewProps) {
  const [job, setJob] = useState<JobSnapshot | null>(null);
  const doneRef = useRef(false);

  useEffect(() => {
    let alive = true;
    let iv: ReturnType<typeof setInterval>;
    const tick = async () => {
      try {
        const res = await fetch(`/api/jobs/${jobId}`, { cache: "no-store" });
        if (!res.ok) return;
        const data: JobSnapshot = await res.json();
        if (!alive) return;
        setJob(data);
        if (data.status === "done" && !doneRef.current) {
          doneRef.current = true;
          clearInterval(iv);
          setTimeout(() => onDone(data.result || {}), 1100);
        } else if (data.status === "error") {
          clearInterval(iv);
        }
      } catch { /* keep polling */ }
    };
    tick();
    iv = setInterval(tick, 1500);
    return () => { alive = false; clearInterval(iv); };
  }, [jobId, onDone]);

  const progress = job?.progress ?? 0;
  const stageOf = (id: string) => job?.stages.find((s) => s.id === id);
  const errored = job?.status === "error";
  const isDone = job?.status === "done";

  const currentStage = job?.stages.find((s) => s.status === "running");
  const liveMessage = errored
    ? `خطا: ${job?.error || "مشکلی پیش آمد"}`
    : currentStage
      ? `${STAGE_META[currentStage.id].title} — ${toFa(progress)} درصد`
      : `${toFa(progress)} درصد`;

  return (
    <div className="mx-auto max-w-xl text-center">
      <span className="sr-only" aria-live="polite" aria-atomic="true">{liveMessage}</span>

      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
        className="cinematic-glass grain relative overflow-hidden rounded-[2rem] p-8"
      >
        {/* Ambient glow inside card */}
        <div aria-hidden className="pointer-events-none absolute -top-16 left-1/2 h-40 w-60 -translate-x-1/2 rounded-full bg-[var(--color-primary)]/20 blur-[60px]" />

        <AnimatePresence mode="wait">
          {isDone ? (
            <motion.div
              key="done"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, ease: [0.34, 1.56, 0.64, 1] }}
              className="py-4 text-center"
            >
              <span className="animate-confetti inline-flex h-16 w-16 items-center justify-center rounded-full bg-[var(--color-accent)] text-[var(--color-accent-foreground)] shadow-[0_0_40px_var(--color-accent)]">
                <Sparkle className="h-8 w-8" weight="fill" />
              </span>
              <p className="mt-4 font-display text-2xl text-aurora">هدیه آماده شد!</p>
              <p className="mt-2 text-sm text-muted-foreground">در حال نمایش نتیجه…</p>
            </motion.div>
          ) : (
            <motion.div key="progress">
              <p className="relative text-sm text-muted-foreground">در حال ساختن هدیه برای</p>
              <h2 className="font-display relative mt-1 text-3xl text-aurora">{recipientName}</h2>

              <div className="relative my-6" aria-hidden>
                <Waveform height={110} progress={progress / 100} energy={errored ? 0.3 : 1} />
              </div>

              {!errored ? (
                <>
                  {/* Cinematic progress bar — from UI UX Pro Max */}
                  <div className="relative">
                    <div className="mb-2 flex items-baseline justify-center gap-1">
                      <motion.span
                        key={progress}
                        initial={{ opacity: 0, y: -6 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="nums text-4xl font-black neon-glow-text"
                      >
                        {toFa(progress)}
                      </motion.span>
                      <span className="text-lg font-bold text-muted-foreground">٪</span>
                    </div>
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-[var(--color-primary)]/10">
                      <motion.div
                        className="progress-bar-fill h-full rounded-full"
                        initial={{ width: "0%" }}
                        animate={{ width: `${progress}%` }}
                        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                      />
                    </div>
                  </div>

                  <div className="mt-6 space-y-2 text-right">
                    {STAGE_ORDER.map((id) => {
                      const st = stageOf(id)?.status ?? "pending";
                      return (
                        <motion.div
                          key={id}
                          layout
                          className={cn(
                            "flex items-center gap-3 rounded-2xl border px-4 py-3 transition-all duration-500",
                            st === "running" && "border-tape/50 bg-tape/[0.07] shadow-[0_0_18px_var(--color-tape)/10]",
                            st === "done" && "border-border/60 bg-white/[0.02]",
                            st === "pending" && "border-border/40 opacity-40",
                            st === "error" && "border-danger/60 bg-danger/10"
                          )}
                        >
                          <StageIcon status={st} />
                          <div className="flex-1">
                            <p className="text-sm font-bold">{STAGE_META[id].title}</p>
                            <p className="text-xs text-muted-foreground">{STAGE_META[id].caption}</p>
                          </div>
                          {st === "running" && (
                            <span className="font-counter text-[10px] text-[var(--color-tape)] animate-pulse">در حال اجرا</span>
                          )}
                        </motion.div>
                      );
                    })}
                  </div>

                  <p className="mt-6 text-xs text-muted-foreground">
                    معمولاً ۱ تا ۲ دقیقه طول می‌کشد. صفحه را باز نگه دار ✨
                  </p>
                </>
              ) : (
                <div className="mt-4">
                  <div className="mx-auto flex max-w-md items-start gap-3 rounded-2xl border border-danger/50 bg-danger/10 p-4 text-right">
                    <WarningCircle className="mt-0.5 h-5 w-5 shrink-0 text-danger" />
                    <div>
                      <p className="text-sm font-bold">ساخت هدیه به مشکل خورد</p>
                      <p className="mt-1 text-xs leading-6 text-muted-foreground">
                        {job?.error || "خطایی رخ داد. دوباره تلاش کن."}
                      </p>
                    </div>
                  </div>
                  <Button onClick={onRetry} className="mt-6">تلاش دوباره</Button>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}

function StageIcon({ status }: { status: string }) {
  const base = "grid h-9 w-9 shrink-0 place-items-center rounded-full transition-all duration-300";
  if (status === "done")
    return (
      <motion.span
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", stiffness: 300, damping: 20 }}
        className={cn(base, "bg-tape text-primary-foreground shadow-[0_0_12px_var(--color-tape)/50]")}
      >
        <Check className="h-4 w-4" weight="bold" />
      </motion.span>
    );
  if (status === "running")
    return (
      <span className={cn(base, "bg-tape/15 text-tape ring-1 ring-tape/40")}>
        <CircleNotch className="h-4 w-4 animate-spin" weight="bold" />
      </span>
    );
  if (status === "error")
    return (
      <span className={cn(base, "bg-danger/20 text-danger")}>
        <WarningCircle className="h-4 w-4" weight="fill" />
      </span>
    );
  return <span className={cn(base, "bg-white/5 text-muted-foreground/40")}>·</span>;
}
