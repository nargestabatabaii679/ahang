import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, MusicNotes } from "@phosphor-icons/react/dist/ssr";
import { getJob } from "@/lib/jobs-store";
import { Button } from "@/components/ui/button";

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const job = getJob(id);
  if (!job || job.status !== "done") {
    return { title: "هدیه پیدا نشد · songai" };
  }
  const title = `یک آهنگ برای ${job.brief.recipientName} 🎵`;
  const description = "هدیه‌ای که با صدای خودش می‌خواند — ساخته‌شده با songai";
  const image = job.result?.coverArtUrl;
  const appUrl = (process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000").replace(/\/$/, "");
  const absoluteVideo = job.result?.videoUrl
    ? `${appUrl}${job.result.videoUrl}`
    : undefined;
  return {
    title: `${title} · songai`,
    description,
    openGraph: {
      title,
      description,
      type: "video.other",
      images: image ? [{ url: image }] : undefined,
      videos: absoluteVideo ? [{ url: absoluteVideo }] : undefined,
    },
    twitter: {
      card: image ? "summary_large_image" : "summary",
      title,
      description,
      images: image ? [image] : undefined,
    },
  };
}

export default async function GiftPage({ params }: Props) {
  const { id } = await params;
  const job = getJob(id);

  if (!job || job.status !== "done" || !(job.result?.videoUrl || job.result?.audioUrl)) {
    notFound();
  }

  const { videoUrl, audioUrl, coverArtUrl } = job.result!;
  const { recipientName } = job.brief;

  return (
    <main id="main" className="container flex min-h-dvh flex-col items-center justify-center py-16">
      <div className="mx-auto w-full max-w-xl">
        <div className="text-center">
          <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-tape/15 text-tape">
            <MusicNotes className="h-6 w-6" />
          </span>
          <h1 className="font-display mt-4 text-3xl">
            یک آهنگ برای <span className="text-aurora">{recipientName}</span>
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            با صدای واقعی، ساخته‌شده با songai
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
          ) : (
            <audio src={audioUrl} controls className="w-full" />
          )}
        </div>

        <div className="mt-9 text-center">
          <p className="mb-4 text-sm text-muted-foreground">
            دوست داری برای یکی که دوستش داری هم یه آهنگ بسازی؟
          </p>
          <Button asChild size="lg">
            <Link href="/create">
              بساز برای یکی
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>
    </main>
  );
}
