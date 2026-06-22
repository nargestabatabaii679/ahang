import { NextRequest, NextResponse } from "next/server";
import { getJob } from "@/lib/jobs-store";

export const runtime = "nodejs";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const job = getJob(id);
  if (!job) {
    return NextResponse.json({ error: "سفارش پیدا نشد" }, { status: 404 });
  }
  return NextResponse.json({
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
}
