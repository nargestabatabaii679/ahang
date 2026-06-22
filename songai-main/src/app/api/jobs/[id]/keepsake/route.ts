import { NextRequest, NextResponse } from "next/server";
import { getJob } from "@/lib/jobs-store";
import { renderKeepsakePdf } from "@/lib/providers/keepsake";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const job = getJob(id);
  if (!job) {
    return NextResponse.json({ error: "سفارش پیدا نشد" }, { status: 404 });
  }
  if (job.status !== "done" || !job.result?.lyrics) {
    return NextResponse.json(
      { error: "هنوز متن ترانه آماده نیست" },
      { status: 409 }
    );
  }

  try {
    const pdf = await renderKeepsakePdf(job.brief, job.result.lyrics);
    return new NextResponse(new Uint8Array(pdf), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="songai-${id}.pdf"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message || "ساخت کیتسیک ناموفق بود" },
      { status: 500 }
    );
  }
}
