import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/jobs/$id")({
  server: {
    handlers: {
      GET: async ({ params }) => {
        const { getJob } = await import("@/lib/jobs-store.server");
        const job = await getJob(params.id);
        if (!job) {
          return Response.json({ error: "سفارش پیدا نشد" }, { status: 404 });
        }
        return Response.json({
          id: job.id,
          status: job.status,
          progress: job.progress,
          stages: job.stages,
          error: job.error,
          result: job.result,
          brief: {
            recipientName: job.brief.recipientName,
            photoUrl: job.brief.photoUrl,
          },
        });
      },
    },
  },
});
