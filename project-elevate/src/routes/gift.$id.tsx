import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { ArrowRight, MusicNotes, Play } from "@phosphor-icons/react";
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
  const { recipientName, videoUrl, audioUrl, coverArtUrl, lyrics } = data;

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

        <div className="sticker-card mt-10 rotate-1 overflow-hidden p-4 sm:p-5">
          {videoUrl ? (
            <video
              src={videoUrl}
              poster={coverArtUrl}
              controls
              playsInline
              className="aspect-square w-full bg-black object-cover"
              aria-label={`ویدیوی هدیه برای ${recipientName}`}
            />
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

        {lyrics && (
          <div className="sticker-card mt-8 -rotate-1 p-6">
            <p className="font-counter mb-3 text-[10px] uppercase tracking-[0.2em] text-[var(--color-accent)]">side a · متن ترانه</p>
            <p className="whitespace-pre-line text-[15px] leading-[2] text-[var(--color-foreground)]">{lyrics}</p>
          </div>
        )}

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
