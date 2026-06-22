import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/jobs/$id/keepsake")({
  server: {
    handlers: {
      GET: async ({ params }) => {
        const { getJob } = await import("@/lib/jobs-store.server");
        const { renderKeepsakeHtml } = await import("@/lib/providers/keepsake");
        const job = await getJob(params.id);
        if (!job) {
          return Response.json({ error: "سفارش پیدا نشد" }, { status: 404 });
        }
        if (job.status !== "done" || !job.result?.lyrics) {
          return Response.json(
            { error: "هنوز متن ترانه آماده نیست" },
            { status: 409 }
          );
        }
        const html = renderKeepsakeHtml(job.brief, job.result.lyrics);
        return new Response(html, {
          headers: {
            "Content-Type": "text/html; charset=utf-8",
            "Cache-Control": "no-store",
          },
        });
      },
    },
  },
});
