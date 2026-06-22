import { createFileRoute } from "@tanstack/react-router";
import {
  Job,
  Occasion,
  Genre,
  Relationship,
  STAGE_ORDER,
} from "@/lib/types";

const OCCASIONS: Occasion[] = [
  "birthday", "anniversary", "appreciation", "apology", "celebration", "none",
];
const GENRES: Genre[] = [
  "romantic", "emotional", "happy", "calm", "motivational", "nostalgic",
];
const RELATIONSHIPS: Relationship[] = [
  "partner", "family", "friend", "coworker", "special", "other",
];

const MAX_PHOTO_BYTES = 15 * 1024 * 1024;
const MAX_VOICE_BYTES = 25 * 1024 * 1024;
const MAX_ABOUT_LENGTH = 600;
const MAX_NAME_LENGTH = 60;
const MAX_RELATIONSHIP_OTHER_LENGTH = 40;

function bad(message: string) {
  return Response.json({ error: message }, { status: 400 });
}

function randomId(): string {
  const bytes = new Uint8Array(6);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

export const Route = createFileRoute("/api/jobs")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const form = await request.formData();
          const recipientName = String(form.get("recipientName") || "")
            .trim().slice(0, MAX_NAME_LENGTH);
          const relationship = String(form.get("relationship") || "") as Relationship;
          const relationshipOther = String(form.get("relationshipOther") || "")
            .trim().slice(0, MAX_RELATIONSHIP_OTHER_LENGTH);
          const occasion = String(form.get("occasion") || "") as Occasion;
          const genre = String(form.get("genre") || "") as Genre;
          const aboutText = String(form.get("aboutText") || "")
            .trim().slice(0, MAX_ABOUT_LENGTH);
          const consent = String(form.get("consent") || "") === "true";
          const photo = form.get("photo");
          const voice = form.get("voice");

          if (!recipientName) return bad("نام گیرنده را وارد کنید");
          if (!RELATIONSHIPS.includes(relationship)) return bad("رابطه معتبر نیست");
          if (relationship === "other" && !relationshipOther) return bad("رابطه را بنویس");
          if (!OCCASIONS.includes(occasion)) return bad("مناسبت معتبر نیست");
          if (!GENRES.includes(genre)) return bad("حال‌وهوای آهنگ معتبر نیست");
          if (!consent)
            return bad("برای ساخت ویدیو باید تأیید کنی که عکس و صدا با اجازهٔ صاحبشان استفاده می‌شود");
          if (!(photo instanceof File) || photo.size === 0) return bad("لطفاً یک عکس بارگذاری کنید");
          if (!photo.type.startsWith("image/")) return bad("فایل عکس باید از نوع تصویر باشد");
          if (photo.size > MAX_PHOTO_BYTES) return bad("حجم عکس بیش از حد مجاز است (حداکثر ۱۵ مگابایت)");
          if (!(voice instanceof File) || voice.size === 0) return bad("لطفاً یک نمونهٔ صدا بارگذاری کنید");
          if (!voice.type.startsWith("audio/")) return bad("فایل صدا باید از نوع صوتی باشد");
          if (voice.size > MAX_VOICE_BYTES) return bad("حجم فایل صدا بیش از حد مجاز است (حداکثر ۲۵ مگابایت)");

          const { saveUpload } = await import("@/lib/storage.server");
          const { createJob } = await import("@/lib/jobs-store.server");
          const { runPipeline } = await import("@/lib/pipeline.server");

          const id = randomId();
          const photoSaved = await saveUpload(id, "photo", photo);
          const voiceSaved = await saveUpload(id, "voice", voice);

          const job: Job = {
            id,
            status: "queued",
            brief: {
              recipientName,
              relationship,
              relationshipOther: relationship === "other" ? relationshipOther : undefined,
              occasion,
              genre,
              aboutText,
              photoUrl: photoSaved.url,
              voiceUrl: voiceSaved.url,
              consent,
            },
            stages: STAGE_ORDER.map((s) => ({ id: s, status: "pending" as const })),
            progress: 0,
            createdAt: Date.now(),
          };
          await createJob(job);

          // Fire-and-forget; client polls /api/jobs/:id for status.
          void runPipeline(id).catch((e) =>
            console.error("[pipeline] fatal:", e)
          );

          return Response.json({ id });
        } catch (e) {
          console.error("[api/jobs] POST:", e);
          return Response.json(
            { error: (e as Error)?.message || "خطا در ایجاد سفارش" },
            { status: 500 }
          );
        }
      },
    },
  },
});
