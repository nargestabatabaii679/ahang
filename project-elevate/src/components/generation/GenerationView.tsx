
import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Check, CircleNotch, WarningCircle } from "@phosphor-icons/react";
import { Waveform } from "@/components/Waveform";
import { Button } from "@/components/ui/button";
import { cn, toFa } from "@/lib/utils";
import { STAGE_META, STAGE_ORDER, StageState, JobStatus } from "@/lib/types";

interface JobSnapshot {
  status: JobStatus;
  progress: number;
  stages: StageState[];
  error?: string;
  result?: { videoUrl?: string; audioUrl?: string; musicUrl?: string; lyrics?: string; coverArtUrl?: string };
}

interface GenerationViewProps {
  jobId: string;
  recipientName: string;
  onDone: (result: NonNullable<JobSnapshot["result"]>) => void;
  onRetry: () => void;
}

export function GenerationView({
  jobId,
  recipientName,
  onDone,
  onRetry,
}: GenerationViewProps) {
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
          setTimeout(() => onDone(data.result || {}), 900);
        } else if (data.status === "error") {
          clearInterval(iv);
        }
      } catch {
        /* keep polling */
      }
    };
    tick();
    iv = setInterval(tick, 1500);
    return () => {
      alive = false;
      clearInterval(iv);
    };
  }, [jobId, onDone]);

  const progress = job?.progress ?? 0;
  const stageOf = (id: string) => job?.stages.find((s) => s.id === id);
  const errored = job?.status === "error";

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
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="glass glow-ring grain relative overflow-hidden rounded-[2rem] p-8"
      >
        <p className="text-sm text-muted-foreground">در حال ساختن هدیه برای</p>
        <h2 className="font-display mt-1 text-3xl text-aurora">{recipientName}</h2>

        <div className="my-7" aria-hidden>
          <Waveform height={120} progress={progress / 100} energy={errored ? 0.3 : 1} />
        </div>


        {!errored ? (
          <>
            <div className="flex items-baseline justify-center gap-1">
              <span className="nums text-4xl font-black">{toFa(progress)}</span>
              <span className="text-lg font-bold text-muted-foreground">٪</span>
            </div>

            <div className="mt-7 space-y-2 text-right">
              {STAGE_ORDER.map((id) => {
                const st = stageOf(id)?.status ?? "pending";
                return (
                  <div
                    key={id}
                    className={cn(
                      "flex items-center gap-3 rounded-2xl border px-4 py-3 transition duration-500",
                      st === "running" && "border-tape/50 bg-tape/[0.07]",
                      st === "done" && "border-border/60 bg-white/[0.02]",
                      st === "pending" && "border-border/40 opacity-50",
                      st === "error" && "border-danger/60 bg-danger/10"
                    )}
                  >
                    <StageIcon status={st} />
                    <div className="flex-1">
                      <p className="text-sm font-bold">{STAGE_META[id].title}</p>
                      <p className="text-xs text-muted-foreground">
                        {STAGE_META[id].caption}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>

            <p className="mt-6 text-xs text-muted-foreground">
              معمولاً حدود ۱ تا ۲ دقیقه طول می‌کشد. صفحه را باز نگه دار. ✨
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
            <Button onClick={onRetry} className="mt-6">
              تلاش دوباره
            </Button>
          </div>
        )}
      </motion.div>
    </div>
  );
}

function StageIcon({ status }: { status: string }) {
  const base = "grid h-9 w-9 shrink-0 place-items-center rounded-full";
  if (status === "done")
    return (
      <span className={cn(base, "bg-tape text-primary-foreground")}>
        <Check className="h-4 w-4" weight="bold" />
      </span>
    );
  if (status === "running")
    return (
      <span className={cn(base, "bg-tape/15 text-tape")}>
        <CircleNotch className="h-4 w-4 animate-spin" weight="bold" />
      </span>
    );
  if (status === "error")
    return (
      <span className={cn(base, "bg-danger/20 text-danger")}>
        <WarningCircle className="h-4 w-4" weight="fill" />
      </span>
    );
  return <span className={cn(base, "bg-white/5 text-muted-foreground/60")}>•</span>;
}
