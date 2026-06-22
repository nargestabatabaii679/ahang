import Link from "next/link";
import { ArrowLeft, MusicNotes, Microphone, Image as ImageIcon, ChatCircle } from "@phosphor-icons/react/dist/ssr";
import { Button } from "@/components/ui/button";
import { Waveform } from "@/components/Waveform";
import { cn } from "@/lib/utils";

const steps = [
  {
    icon: ChatCircle,
    counter: "01",
    title: "بگو برای کیه",
    body: "اسمش، مناسبت، و چند جمله از دلت رو بنویس.",
    time: "۱ دقیقه",
  },
  {
    icon: ImageIcon,
    counter: "02",
    title: "یه عکس بذار",
    body: "همون عکسیه که توی ویدیو می‌خونه و حرکت می‌کنه.",
    time: "۲۰ ثانیه",
  },
  {
    icon: Microphone,
    counter: "03",
    title: "صداش رو بسپار",
    body: "۱۰ ثانیه ضبط کافیه تا صداش واقعی کلون بشه.",
    time: "۱۰ ثانیه",
  },
];

export default function Home() {
  return (
    <main id="main" className="relative overflow-hidden">
      {/* ambient deck-light */}
      <div className="pointer-events-none absolute -top-24 left-1/2 -translate-x-1/2 opacity-30 animate-float">
        <div className="h-72 w-72 rounded-full bg-thread/20 blur-3xl" />
      </div>

      <div className="container relative pt-10 pb-24 md:pt-14">
        {/* brand */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm font-bold tracking-wide">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-tape to-thread text-primary-foreground">
              <MusicNotes className="h-5 w-5" />
            </span>
            <span className="font-display text-lg leading-none">songai</span>
          </div>
          <span className="hidden text-xs text-muted-foreground sm:block">
            مثل یه میکس‌تیپ، ولی با صدای خودش
          </span>
        </div>

        {/* hero */}
        <section className="mx-auto mt-14 grid max-w-5xl items-center gap-12 lg:mt-20 lg:grid-cols-[1.1fr_1fr] lg:gap-8">
          <div className="text-center lg:text-right">
            <h1 className="font-display animate-fade-up text-balance text-4xl leading-[1.25] sm:text-6xl lg:text-5xl xl:text-6xl [animation-delay:80ms]">
              یک هدیه که
              <br />
              <span className="text-aurora">فراموش نمی‌شود</span>
            </h1>
            <p className="animate-fade-up mx-auto mt-6 max-w-md text-balance text-base leading-8 text-muted-foreground lg:mx-0 [animation-delay:200ms]">
              با عکس و صدای خودت، یک آهنگ و ویدیوی شخصی بساز؛ هدیه‌ای که فقط برای یک نفر ساخته شده است.
            </p>

            <div className="animate-fade-up mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row lg:justify-start [animation-delay:300ms]">
              <Button asChild size="lg">
                <Link href="/create">
                  بساز برای یکی
                  <ArrowLeft className="h-4 w-4" />
                </Link>
              </Button>
              <Link
                href="#how"
                className="inline-flex items-center gap-1.5 text-sm font-bold text-foreground/70 underline decoration-thread/40 decoration-2 underline-offset-4 transition-colors hover:text-foreground hover:decoration-thread"
              >
                سه قدم تا تموم شدنش
              </Link>
            </div>
          </div>

          {/* signature: the mixtape ticket */}
          <div className="animate-fade-up relative mx-auto w-full max-w-sm [animation-delay:420ms]">
            <div className="ticket ticket-notch relative -rotate-2 shadow-[0_30px_70px_-25px_hsl(263_50%_4%/0.75)] transition-transform duration-500 hover:rotate-0">
              <div className="grain relative overflow-hidden rounded-[1.5rem]">
                <div className="flex">
                  <div className="flex flex-1 flex-col justify-between p-5">
                    <div>
                      <p className="font-counter text-[10px] uppercase tracking-[0.2em] text-[#6b5a3f]">
                        side a · گرفته‌شده برای
                      </p>
                      <p className="font-display mt-1 text-2xl text-[#2b2118]">سارا</p>
                    </div>
                    <div className="mt-6">
                      <Waveform height={64} />
                    </div>
                  </div>
                  <div className="ticket-perf my-4" />
                  <div className="flex w-16 flex-col items-center justify-center gap-1 p-2">
                    <span className="font-counter rotate-180 text-[10px] tracking-widest text-[#6b5a3f] [writing-mode:vertical-rl]">
                      songai
                    </span>
                    <span className="font-counter mt-2 text-lg text-[#2b2118]">00:34</span>
                  </div>
                </div>
              </div>
            </div>
            <p className="mt-5 text-center text-xs text-muted-foreground lg:text-right">
              همینه که تحویلش می‌گیره: یه تیکت با صدا، عکس و ترانه‌ای که فقط مال اونه
            </p>
          </div>
        </section>

        {/* how it works — framed as the A-side of the tape, since order here is real: each step unlocks the next */}
        <section id="how" className="mx-auto mt-28 max-w-4xl scroll-mt-12">
          <div className="flex items-center justify-center gap-3 lg:justify-start">
            <span className="thread-divider w-8" />
            <h2 className="font-counter text-xs uppercase tracking-[0.3em] text-thread">
              Side A · سه قدم
            </h2>
          </div>

          <div className="ticket relative mt-10 overflow-hidden">
            {steps.map((s, i) => (
              <div
                key={s.title}
                className={cn(
                  "group flex items-center gap-4 px-5 py-5 transition-colors hover:bg-black/[0.03] sm:px-7",
                  i < steps.length - 1 && "border-b border-dashed border-[#2b2118]/15"
                )}
              >
                <span className="font-counter w-7 shrink-0 text-sm text-[#6b5a3f]">
                  {s.counter}
                </span>
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-[#2b2118]/8 text-[#2b2118] transition-colors group-hover:bg-[#2b2118]/14">
                  <s.icon className="h-5 w-5" />
                </span>
                <div className="min-w-0 flex-1">
                  <h3 className="text-base font-bold text-[#2b2118]">{s.title}</h3>
                  <p className="mt-0.5 truncate text-sm leading-6 text-[#6b5a3f]">
                    {s.body}
                  </p>
                </div>
                <span className="font-counter shrink-0 text-xs text-[#6b5a3f]">
                  {s.time}
                </span>
              </div>
            ))}
          </div>

          <div className="mt-10 text-center">
            <Button asChild size="lg">
              <Link href="/create">
                بزن بریم بسازیم
                <ArrowLeft className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </section>
      </div>

      <footer className="border-t border-border/60 py-8 text-center text-xs text-muted-foreground">
        <p>ساخته‌شده با عشق · songai</p>
        <p className="mt-2 flex items-center justify-center gap-3">
          <Link href="/privacy" className="hover:text-foreground">
            حریم خصوصی
          </Link>
          <span className="h-1 w-1 rounded-full bg-border" />
          <Link href="/terms" className="hover:text-foreground">
            شرایط استفاده
          </Link>
        </p>
      </footer>
    </main>
  );
}
