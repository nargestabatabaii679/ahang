import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { ArrowRight, MusicNotes, Play, Heart, WhatsappLogo, TelegramLogo, LinkSimple, Check } from "@phosphor-icons/react";
import { motion } from "framer-motion";
import { useState } from "react";
import { getGiftJob } from "@/lib/gift.functions";
import { LyricVideo } from "@/components/LyricVideo";

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
  const { recipientName, videoUrl, audioUrl, coverArtUrl, lyrics } = data;
  const [copied, setCopied] = useState(false);

  const shareUrl = typeof window !== "undefined" ? window.location.href : "";
  const shareText = `یک هدیهٔ موسیقی برای «${recipientName}» 🎵`;

  const copyLink = async () => {
    try { await navigator.clipboard.writeText(shareUrl); setCopied(true); setTimeout(() => setCopied(false), 2000); } catch {}
  };

  return (
    <main id="main" className="relative min-h-dvh overflow-hidden py-10 sm:py-16">
      {/* Ambient */}
      <div aria-hidden className="pointer-events-none absolute -top-20 right-1/3 h-72 w-72 rounded-full bg-[var(--color-primary)]/20 blur-[120px]" />
      <div aria-hidden className="pointer-events-none absolute bottom-0 left-0 h-64 w-64 rounded-full bg-[var(--color-accent)]/10 blur-[100px]" />

      <div className="container max-w-xl">
        {/* Banner */}
        <motion.div
          initial={{ opacity: 0, y: 20, rotate: -3 }}
          animate={{ opacity: 1, y: 0, rotate: -1 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="sticker-card-lime relative p-6 text-center"
        >
          <span aria-hidden className="sticker-chip absolute -top-4 -left-3">تقدیم به تو ❤️</span>
          <div className="mb-2 flex justify-center">
            <Heart className="h-8 w-8 text-[var(--color-accent)] animate-bounce-in" weight="fill" />
          </div>
          <p className="font-counter text-[10px] uppercase tracking-[0.3em] text-[var(--color-muted-foreground)]">A GIFT FOR YOU</p>
          <h1 className="font-display mt-2 text-3xl sm:text-4xl">
            هدیه‌ای برای <span className="text-aurora">{recipientName}</span>
          </h1>
          <p className="mt-2 text-sm text-[var(--color-muted-foreground)]">با صدای واقعی، فقط برای تو ساخته شد</p>
        </motion.div>

        {/* Media */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="sticker-card mt-10 rotate-1 overflow-hidden p-4 sm:p-5"
        >
          {videoUrl ? (
            <div className="relative">
              <video
                src={videoUrl}
                poster={coverArtUrl}
                controls
                playsInline
                className="aspect-video w-full bg-black object-cover"
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
          ) : (
            <div className="flex flex-col items-center gap-4 py-8">
              <span aria-hidden className="grid h-16 w-16 place-items-center bg-[var(--color-primary)]/20 text-[var(--color-primary)]">
                <MusicNotes className="h-8 w-8" />
              </span>
              <p className="text-sm text-[var(--color-muted-foreground)]">هدیه در حال آماده‌سازی است…</p>
            </div>
          )}
        </motion.div>

        {/* Lyric Video generator */}
        {audioUrl && coverArtUrl && lyrics && !videoUrl && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.38 }}
            className="sticker-card mt-8 rotate-1 p-4 sm:p-5"
          >
            <p className="font-counter mb-3 text-[10px] uppercase tracking-[0.2em] text-[var(--color-accent)]">side b · لیریک ویدیو</p>
            <LyricVideo
              coverArtUrl={coverArtUrl}
              audioUrl={audioUrl}
              lyrics={lyrics}
              recipientName={recipientName}
            />
          </motion.div>
        )}

        {/* Lyrics */}
        {lyrics && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="sticker-card mt-8 -rotate-1 p-6"
          >
            <p className="font-counter mb-3 text-[10px] uppercase tracking-[0.2em] text-[var(--color-accent)]">side a · متن ترانه</p>
            <p className="whitespace-pre-line text-[15px] leading-[2] text-[var(--color-foreground)]">{lyrics}</p>
          </motion.div>
        )}

        {/* Share */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.55 }}
          className="mt-8"
        >
          <p className="mb-3 text-center text-xs font-black uppercase tracking-widest text-[var(--color-muted-foreground)]">
            این هدیه رو برای دیگران بفرست
          </p>
          <div className="grid grid-cols-3 gap-2">
            <a
              href={`https://wa.me/?text=${encodeURIComponent(`${shareText}\n${shareUrl}`)}`}
              target="_blank"
              rel="noopener"
              className="tap flex flex-col items-center justify-center gap-1.5 border-2 border-[var(--color-primary)]/40 bg-[var(--color-card)] py-3 text-[11px] font-black text-[var(--color-foreground)] transition hover:border-[var(--color-accent)] hover:-translate-y-0.5"
            >
              <WhatsappLogo className="h-5 w-5" />
              واتس‌اپ
            </a>
            <a
              href={`https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareText)}`}
              target="_blank"
              rel="noopener"
              className="tap flex flex-col items-center justify-center gap-1.5 border-2 border-[var(--color-primary)]/40 bg-[var(--color-card)] py-3 text-[11px] font-black text-[var(--color-foreground)] transition hover:border-[var(--color-accent)] hover:-translate-y-0.5"
            >
              <TelegramLogo className="h-5 w-5" />
              تلگرام
            </a>
            <button
              onClick={copyLink}
              className="tap flex flex-col items-center justify-center gap-1.5 border-2 border-[var(--color-primary)]/40 bg-[var(--color-card)] py-3 text-[11px] font-black text-[var(--color-foreground)] transition hover:border-[var(--color-accent)] hover:-translate-y-0.5"
            >
              {copied ? <Check className="h-5 w-5 text-[var(--color-accent)]" /> : <LinkSimple className="h-5 w-5" />}
              {copied ? "کپی شد" : "کپی لینک"}
            </button>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.7 }}
          className="mt-10 text-center"
        >
          <p className="text-sm text-[var(--color-muted-foreground)]">امیدواریم لبخند روی لبت بیاورد ❤️</p>
          <Link
            to="/create"
            className="neon-cta neon-cta-hover mt-4 inline-flex h-12 items-center justify-center gap-2 px-6 text-sm"
          >
            <MusicNotes className="h-4 w-4" />
            یکی برای کسی که دوستش داری بساز
          </Link>
        </motion.div>
      </div>
    </main>
  );
}

function GiftNotFound() {
  return (
    <main className="container flex min-h-dvh flex-col items-center justify-center py-12 text-center">
      <div className="font-display text-6xl text-aurora mb-4">🎁</div>
      <h1 className="font-display text-3xl">هدیه‌ای اینجا نیست</h1>
      <p className="mt-2 text-sm text-[var(--color-muted-foreground)]">شاید لینک اشتباه است یا هدیه هنوز آماده نشده.</p>
      <Link to="/" className="mt-6 inline-flex items-center gap-1.5 text-sm text-[var(--color-accent)] hover:underline">
        <ArrowRight className="h-4 w-4" /> بازگشت به خانه
      </Link>
    </main>
  );
}
