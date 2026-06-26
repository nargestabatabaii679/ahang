import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useState } from "react";
import {
  ArrowRight,
  MusicNotes,
  Play,
  DownloadSimple,
  FileText,
  WhatsappLogo,
  TelegramLogo,
  LinkSimple,
  Check,
  CircleNotch,
  type Icon,
} from "@phosphor-icons/react";
import { getGiftJob } from "@/lib/gift.functions";

export const Route = createFileRoute("/gift/$id")({
  loader: async ({ params }) => {
    const data = await getGiftJob({ data: { id: params.id } });
    if (!data) throw notFound();
    return data;
  },
  head: ({ loaderData }) => {
    if (!loaderData) return { meta: [{ title: "هدیه پیدا نشد · songai" }] };
    const title = `یک هدیه برای «${loaderData.recipientName}» · songai`;
    const description = "یک آهنگ و ویدیوی شخصی، با صدای واقعی، ساخته شده با songai.";
    const meta = [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:type", content: "video.other" },
    ];
    if (loaderData.coverArtUrl) {
      meta.push({ property: "og:image", content: loaderData.coverArtUrl });
      meta.push({ name: "twitter:image", content: loaderData.coverArtUrl });
    }
    if (loaderData.videoUrl) meta.push({ property: "og:video", content: loaderData.videoUrl });
    return { meta };
  },
  notFoundComponent: GiftNotFound,
  errorComponent: GiftNotFound,
  component: GiftPage,
});

function GiftPage() {
  const data = Route.useLoaderData();
  const { id: jobId, recipientName, videoUrl, audioUrl, coverArtUrl, lyrics } = data;

  const [copied, setCopied] = useState(false);
  const [keepsakeState, setKeepsakeState] = useState<"idle" | "loading" | "error">("idle");

  const shareUrl = typeof window !== "undefined" ? `${window.location.origin}/gift/${jobId}` : "";
  const shareText = `یک هدیه برای «${recipientName}» — یه آهنگ با صدای واقعی 🎵`;

  const shareWhatsapp = () =>
    window.open(`https://wa.me/?text=${encodeURIComponent(`${shareText}\n${shareUrl}`)}`, "_blank");
  const shareTelegram = () =>
    window.open(`https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareText)}`, "_blank");
  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  };

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

  return (
    <main id="main" className="relative min-h-dvh py-10 sm:py-16">
      <div className="container max-w-xl">
        {/* Banner */}
        <div className="sticker-card-lime relative -rotate-1 p-6 text-center">
          <span aria-hidden className="sticker-chip absolute -top-4 -left-3">تقدیم به تو</span>
          <p className="font-counter text-[10px] uppercase tracking-[0.3em] text-[var(--color-muted-foreground)]">A GIFT FOR YOU</p>
          <h1 className="font-display mt-2 text-3xl sm:text-4xl">
            هدیه‌ای برای <span className="text-aurora">{recipientName}</span>
          </h1>
          <p className="mt-2 text-sm text-[var(--color-muted-foreground)]">با صدای واقعی، فقط برای تو</p>
        </div>

        {/* Media card */}
        <div className="sticker-card mt-10 rotate-1 overflow-hidden p-4 sm:p-5">
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
                  <img src={coverArtUrl} alt={`کاور آهنگ برای ${recipientName}`} className="aspect-square w-full border-2 border-[var(--color-primary)] object-cover" />
                  <span aria-hidden className="absolute -top-3 -right-3 grid h-16 w-16 place-items-center rounded-full border-2 border-[var(--color-background)] bg-[var(--color-accent)] text-[var(--color-accent-foreground)] shadow-[3px_3px_0_0_var(--color-primary)] animate-spin-slow">
                    <Play className="h-7 w-7" weight="fill" />
                  </span>
                </div>
              ) : (
                <span aria-hidden className="grid h-20 w-20 place-items-center bg-[var(--color-primary)] text-[var(--color-primary-foreground)]">
                  <MusicNotes className="h-9 w-9" />
                </span>
              )}
              <audio src={audioUrl} controls className="w-full" aria-label={`آهنگ هدیه برای ${recipientName}`} />
            </div>
          ) : null}
        </div>

        {/* Lyrics */}
        {lyrics && (
          <div className="sticker-card mt-8 -rotate-1 p-6">
            <p className="font-counter mb-3 text-[10px] uppercase tracking-[0.2em] text-[var(--color-accent)]">side a · متن ترانه</p>
            <p className="whitespace-pre-line text-[15px] leading-[2] text-[var(--color-foreground)]">{lyrics}</p>
          </div>
        )}

        {/* Downloads */}
        <div className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-3">
          {videoUrl && (
            <a
              href={videoUrl}
              download
              className="tap inline-flex items-center justify-center gap-2 border-2 border-[var(--color-primary)] bg-[var(--color-primary)] px-4 py-3 text-sm font-black text-[var(--color-primary-foreground)] shadow-[4px_4px_0_0_var(--color-accent)] transition hover:-translate-y-0.5"
            >
              <DownloadSimple className="h-4 w-4" /> دانلود ویدیو
            </a>
          )}
          {audioUrl && (
            <a
              href={audioUrl}
              download
              className="tap inline-flex items-center justify-center gap-2 border-2 border-[var(--color-accent)] bg-transparent px-4 py-3 text-sm font-black text-[var(--color-accent)] shadow-[4px_4px_0_0_var(--color-primary)] transition hover:-translate-y-0.5"
            >
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
              متن ترانه (PDF)
            </button>
          )}
        </div>
        {keepsakeState === "error" && (
          <p className="mt-2 text-center text-xs text-[var(--color-danger)]">ساخت PDF فعلاً فعال نیست — دوباره تلاش کن</p>
        )}

        {/* Share */}
        <div className="mt-8">
          <p className="mb-3 text-center text-xs font-black uppercase tracking-widest text-[var(--color-muted-foreground)]">
            این هدیه را با دیگران به اشتراک بگذار
          </p>
          <div className="grid grid-cols-3 gap-2">
            <ShareButton onClick={shareWhatsapp} icon={WhatsappLogo} label="واتس‌اپ" />
            <ShareButton onClick={shareTelegram} icon={TelegramLogo} label="تلگرام" />
            <ShareButton onClick={copyLink} icon={copied ? Check : LinkSimple} label={copied ? "کپی شد" : "کپی لینک"} />
          </div>
        </div>

        <div className="mt-10 text-center">
          <p className="text-sm text-[var(--color-muted-foreground)]">امیدواریم لبخند روی لبت بیاورد ❤️</p>
          <Link
            to="/create"
            className="neon-cta neon-cta-hover mt-4 inline-flex h-12 items-center justify-center gap-2 px-6 text-sm"
          >
            <MusicNotes className="h-4 w-4" />
            یکی برای کسی که دوستش داری بساز
          </Link>
        </div>
      </div>
    </main>
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

function GiftNotFound() {
  return (
    <main className="container flex min-h-dvh flex-col items-center justify-center py-12 text-center">
      <h1 className="font-display text-3xl">هدیه‌ای اینجا نیست</h1>
      <p className="mt-2 text-sm text-[var(--color-muted-foreground)]">شاید لینک اشتباه است یا هدیه هنوز آماده نشده.</p>
      <Link to="/" className="mt-6 inline-flex items-center gap-1.5 text-sm">
        <ArrowRight className="h-4 w-4" /> بازگشت به خانه
      </Link>
    </main>
  );
}
