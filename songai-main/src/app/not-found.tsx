import Link from "next/link";
import { ArrowLeft, MusicNotesSimple } from "@phosphor-icons/react/dist/ssr";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main id="main" className="container flex min-h-dvh flex-col items-center justify-center text-center">
      <div className="ticket ticket-notch relative -rotate-2 px-10 py-8 shadow-[0_30px_70px_-25px_hsl(263_50%_4%/0.75)]">
        <span className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-[#2b2118]/10 text-[#2b2118]">
          <MusicNotesSimple className="h-6 w-6" />
        </span>
        <p className="font-counter mt-4 text-xs uppercase tracking-[0.2em] text-[#6b5a3f]">
          side b · track 04
        </p>
        <h1 className="font-display mt-1 text-2xl text-[#2b2118]">این نوار خالیه</h1>
        <p className="mt-2 max-w-xs text-sm leading-7 text-[#6b5a3f]">
          صفحه‌ای که دنبالش بودی پیدا نشد. شاید لینک قدیمی بوده یا اشتباه تایپ شده.
        </p>
      </div>

      <Button asChild size="lg" className="mt-8">
        <Link href="/">
          برگرد به خانه
          <ArrowLeft className="h-4 w-4" />
        </Link>
      </Button>
    </main>
  );
}
