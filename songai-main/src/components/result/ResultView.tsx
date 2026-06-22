"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  DownloadSimple,
  ArrowCounterClockwise,
  MusicNotes,
  Sparkle,
  FileText,
  CircleNotch,
  WhatsappLogo,
  TelegramLogo,
  InstagramLogo,
  LinkSimple,
  Check,
  type Icon,
} from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";

interface ResultViewProps {
  recipientName: string;
  result: { videoUrl?: string; audioUrl?: string; lyrics?: string; coverArtUrl?: string };
  jobId?: string | null;
  onRestart: () => void;
}

export function ResultView({ recipientName, result, jobId, onRestart }: ResultViewProps) {
  const { videoUrl, audioUrl, lyrics, coverArtUrl } = result;
  const [keepsakeState, setKeepsakeState] = useState<"idle" | "loading" | "error">("idle");
  const [copied, setCopied] = useState(false);

  const downloadKeepsake = async () => {
    if (!jobId) return;
    setKeepsakeState("loading");
    try {
      const res = await fetch(`/api/jobs/${jobId}/keepsake`);
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.error || "ساخت کیتسیک ناموفق بود");
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `songai-${jobId}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
      setKeepsakeState("idle");
    } catch (e) {
      setKeepsakeState("error");
    }
  };

  const shareUrl =
    typeof window !== "undefined" && jobId
      ? `${window.location.origin}/gift/${jobId}`
      : "";
  const shareText = `یک هدیه برای «${recipientName}» ساختم؛ یه آهنگ با صدای خودم 🎵`;

  const shareWhatsapp = () =>
    window.open(
      `https://wa.me/?text=${encodeURIComponent(`${shareText}\n${shareUrl}`)}`,
      "_blank"
    );

  const shareTelegram = () =>
    window.open(
      `https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareText)}`,
      "_blank"
    );

  const shareInstagram = async () => {
    // Instagram has no public web deep-link for "share to story" — the only
    // reliable cross-device path is the native Web Share sheet, which shows
    // Instagram as a target automatically on phones that have it installed.
    if (navigator.share) {
      try {
        await navigator.share({ title: "songai", text: shareText, url: shareUrl });
        return;
      } catch {
        /* user cancelled — fall through to copy */
      }
    }
    await copyLink();
  };

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard blocked — silently ignore */
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      className="mx-auto max-w-xl"
    >
      <div className="text-center">
        <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-tape/15 text-tape">
          <Sparkle className="h-7 w-7" />
        </span>
        <h2 className="font-display mt-4 text-4xl">
          هدیهٔ <span className="text-aurora">{recipientName}</span> آماده است
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          با صدای واقعی، فقط برای او
        </p>
      </div>

      <div className="glass glow-ring mt-8 overflow-hidden rounded-[2rem] p-4 sm:p-6">
        {videoUrl ? (
          <div className="relative">
            <video
              src={videoUrl}
              poster={coverArtUrl}
              controls
              playsInline
              className="aspect-square w-full rounded-2xl bg-black object-cover"
            />
            <span className="font-display pointer-events-none absolute right-4 top-4 rounded-full bg-black/45 px-3 py-1.5 text-sm text-white backdrop-blur-sm">
              برای «{recipientName}» ❤️
            </span>
          </div>
        ) : audioUrl ? (
          <div className="flex flex-col items-center gap-5 py-4">
            {coverArtUrl ? (
              <div className="relative w-full overflow-hidden rounded-2xl">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={coverArtUrl}
                  alt="موج‌نگاشتِ آهنگ: تصویری که موسیقی از روی آن ساخته شد"
                  className="aspect-[3/2] w-full object-cover"
                />
                <span className="font-counter absolute bottom-2 left-2 rounded-full bg-black/55 px-2.5 py-1 text-[10px] tracking-wider text-white/90 backdrop-blur-sm">
                  spectrogram · riffusion
                </span>
              </div>
            ) : (
              <span className="grid h-20 w-20 place-items-center rounded-3xl bg-gradient-to-br from-tape to-thread text-primary-foreground">
                <MusicNotes className="h-9 w-9" />
              </span>
            )}
            <audio src={audioUrl} controls className="w-full" />
          </div>
        ) : null}
      </div>

      {/* تأیید امکانات: یادآوری اینکه این یک هدیهٔ کاملاً شخصی‌سازی‌شده است */}
      <div className="mt-4 flex flex-wrap items-center justify-center gap-x-4 gap-y-1.5 text-center text-xs text-muted-foreground">
        {videoUrl && <span>🎬 ویدیوی شخصی</span>}
        <span>🎙️ صدای خودت</span>
        {videoUrl && <span>😊 چهره خودت</span>}
        <span>🎵 موسیقی اختصاصی</span>
      </div>

      {lyrics && (
        <div className="ticket relative mt-5 -rotate-1 p-6 shadow-[0_24px_50px_-20px_hsl(263_50%_4%/0.55)]">
          <p className="font-counter mb-3 text-[10px] uppercase tracking-[0.2em] text-[#6b5a3f]">
            side a · متن ترانه
          </p>
          <p className="whitespace-pre-line text-sm leading-8 text-[#2b2118]">
            {lyrics}
          </p>
        </div>
      )}

      {lyrics && jobId && (
        <div className="mt-3 text-center">
          {keepsakeState === "error" && (
            <p className="mt-1.5 text-[11px] text-danger">
              ساخت PDF روی این سرور فعال نیست — بعداً دوباره امتحان کن
            </p>
          )}
        </div>
      )}

      {/* امکانات: دانلود ویدیو/آهنگ، متن ترانه */}
      <div className="mt-7 grid grid-cols-1 gap-3 sm:grid-cols-3">
        {videoUrl && (
          <Button asChild className="w-full">
            <a href={videoUrl} download>
              <DownloadSimple className="h-4 w-4" />
              دانلود ویدیو
            </a>
          </Button>
        )}
        {audioUrl && (
          <Button asChild variant={videoUrl ? "outline" : "default"} className="w-full">
            <a href={audioUrl} download>
              <MusicNotes className="h-4 w-4" />
              دانلود آهنگ
            </a>
          </Button>
        )}
        {lyrics && jobId && (
          <Button
            variant="outline"
            onClick={downloadKeepsake}
            disabled={keepsakeState === "loading"}
            className="w-full"
          >
            {keepsakeState === "loading" ? (
              <CircleNotch className="h-4 w-4 animate-spin" weight="bold" />
            ) : (
              <FileText className="h-4 w-4" />
            )}
            متن ترانه
          </Button>
        )}
      </div>

      {/* هدیه را ارسال کن */}
      <div className="mt-7">
        <p className="mb-3 text-center text-xs font-bold text-muted-foreground">
          هدیه را ارسال کن
        </p>
        <div className="grid grid-cols-4 gap-2">
          <ShareButton onClick={shareWhatsapp} icon={WhatsappLogo} label="واتساپ" />
          <ShareButton onClick={shareTelegram} icon={TelegramLogo} label="تلگرام" />
          <ShareButton onClick={shareInstagram} icon={InstagramLogo} label="استوری" />
          <ShareButton
            onClick={copyLink}
            icon={copied ? Check : LinkSimple}
            label={copied ? "کپی شد" : "کپی لینک"}
          />
        </div>
      </div>

      <div className="mt-7 text-center">
        <p className="mb-4 text-sm text-muted-foreground">
          امیدواریم این آهنگ، لبخند روی لبش بیاورد ❤️
        </p>
        <Button onClick={onRestart} variant="outline" className="w-full sm:w-auto">
          <ArrowCounterClockwise className="h-4 w-4" />
          ساختن برای یک نفر دیگر
        </Button>
      </div>
    </motion.div>
  );
}

function ShareButton({
  onClick,
  icon: Icon,
  label,
}: {
  onClick: () => void;
  icon: Icon;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex flex-col items-center gap-1.5 rounded-2xl border border-border bg-white/[0.02] py-3 text-[11px] font-bold text-foreground/80 transition-colors hover:border-thread/40 hover:bg-white/[0.05] hover:text-foreground"
    >
      <Icon className="h-5 w-5" />
      {label}
    </button>
  );
}
