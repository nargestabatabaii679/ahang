import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

export const getGiftJob = createServerFn({ method: "GET" })
  .validator(z.object({ id: z.string() }))
  .handler(async ({ data }) => {
    const { getJob } = await import("@/lib/jobs-store.server");
    const job = await getJob(data.id);
    if (!job || job.status !== "done" || !job.result) return null;
    return {
      recipientName: job.brief.recipientName,
      videoUrl: job.result.videoUrl,
      audioUrl: job.result.audioUrl,
      coverArtUrl: job.result.coverArtUrl,
      lyrics: job.result.lyrics,
    };
  });
