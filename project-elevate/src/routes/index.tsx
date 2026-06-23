import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowLeft,
  MusicNotes,
  Microphone,
  Image as ImageIcon,
  ChatCircle,
  PaperPlaneTilt,
  Play,
  VinylRecord,
} from "@phosphor-icons/react";
import { Waveform } from "@/components/Waveform";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "songai · هدیه‌ای با صدای خودت" },
      {
        name: "description",
        content:
          "با عکس و صدای خودت، یک آهنگ و ویدیوی شخصی بساز؛ هدیه‌ای که فقط برای یک نفر ساخته شده است.",
      },
    ],
  }),
  component: HomePage,
});

const steps = [
  { icon: ChatCircle, counter: "۰۱", title: "بگو برای کیه", body: "اسمش، مناسبت، و چند جمله از دلت رو بنویس.", time: "۱ دقیقه" },
  { icon: ImageIcon,  counter: "۰۲", title: "یه عکس بذار", body: "همون عکسیه که توی ویدیو می‌خونه و حرکت می‌کنه.", time: "۲۰ ثانیه" },
  { icon: Microphone, counter: "۰۳", title: "صداش رو بسپار", body: "۱۰ ثانیه ضبط کافیه تا صداش واقعی کلون بشه.", time: "۱۰ ثانیه" },
];

function HomePage() {
  return (
    <main id="main" className="relative overflow-hidden">
      {/* Ambient glow */}
      <div aria-hidden className="pointer-events-none absolute -top-32 right-1/4 h-72 w-72 rounded-full bg-[var(--color-primary)]/25 blur-[120px]" />
      <div aria-hidden className="pointer-events-none absolute top-1/3 left-0 h-64 w-64 rounded-full bg-[var(--color-accent)]/15 blur-[100px]" />

      {/* NAV */}
      <header className="container relative flex items-center justify-between pt-8">
        <div className="flex items-center gap-3">
          <span aria-hidden className="grid h-10 w-10 place-items-center border-2 border-[var(--color-accent)] bg-[var(--color-primary)] text-[var(--color-primary-foreground)] shadow-[4px_4px_0_0_var(--color-accent)]">
            <MusicNotes className="h-5 w-5" weight="fill" />
          </span>
          <span className="font-display text-2xl tracking-tighter text-[var(--color-primary)]">SONGAI</span>
        </div>
        <Link to="/create" className="hidden sm:inline-flex sticker-chip">
          <Play className="h-3 w-3" weight="fill" /> شروع کن
        </Link>
      </header>

      {/* HERO — music-first */}
      <section className="container relative pt-12 pb-16 sm:pt-16 sm:pb-24">
        {/* Background live waveform */}
        <div aria-hidden className="pointer-events-none absolute inset-x-0 top-1/2 -translate-y-1/2 opacity-30">
          <Waveform height={220} bars={72} progress={1} energy={1.1} />
        </div>

        <div className="relative mx-auto grid max-w-6xl items-center gap-12 lg:grid-cols-[1.15fr_1fr]">
          <div className="relative text-center lg:text-right">
            <h2
              aria-hidden
              className="font-display pointer-events-none absolute -top-10 -right-4 select-none text-[110px] leading-none tracking-tighter text-[var(--color-primary)]/10 sm:text-[160px] lg:text-[200px]"
            >
              SONGAI
            </h2>

            <div className="relative z-10">
              <h1 className="animate-fade-up text-balance font-black leading-[1.1]">
                هدیه‌ای از جنس
                <br />
                <span className="text-aurora">موسیقیِ تو</span>
              </h1>
              <p className="animate-fade-up mx-auto mt-5 max-w-md text-balance leading-8 text-[var(--color-muted-foreground)] lg:mx-0 [animation-delay:160ms]">
                اولین سرویس تولید موزیک اختصاصی با صدای واقعی خودت، ترانه‌ای شخصی و
                یک ویدیو — برای کسی که دوستش داری.
              </p>

              <div className="animate-fade-up mt-8 flex flex-col items-center gap-4 sm:flex-row lg:justify-start [animation-delay:280ms]">
                <Link
                  to="/create"
                  className="neon-cta neon-cta-hover inline-flex h-14 items-center justify-center gap-2 px-9 text-base active:translate-y-0.5"
                >
                  <PaperPlaneTilt className="h-5 w-5" weight="fill" />
                  ساخت آهنگ رایگان
                </Link>

                {/* Live eq bars next to CTA */}
                <div aria-hidden className="flex items-end gap-1 h-10">
                  {[0.5, 0.9, 0.4, 1, 0.6, 0.85, 0.35].map((h, i) => (
                    <span
                      key={i}
                      className="eq-bar"
                      style={{
                        height: `${h * 100}%`,
                        background: i % 2 ? "var(--color-accent)" : "var(--color-primary)",
                        animationDelay: `${i * 110}ms`,
                      }}
                    />
                  ))}
                </div>
              </div>

              <div className="animate-fade-up mt-10 flex flex-wrap items-center justify-center gap-6 text-xs text-[var(--color-muted-foreground)] lg:justify-start [animation-delay:380ms]">
                <Stat n="۱۰s" label="فقط با ۱۰ ثانیه صدا" />
                <span aria-hidden className="h-4 w-px bg-[var(--color-primary)]/30" />
                <Stat n="۱x" label="منحصراً برای یک نفر" />
                <span aria-hidden className="h-4 w-px bg-[var(--color-primary)]/30" />
                <Stat n="HD" label="ویدیوی واقعی" />
              </div>
            </div>
          </div>

          {/* Music-first sticker preview card */}
          <div className="animate-fade-up relative mx-auto w-full max-w-sm [animation-delay:420ms]">
            {/* Spinning vinyl sticker */}
            <span aria-hidden className="absolute -top-8 -right-6 z-30 grid h-20 w-20 place-items-center rounded-full border-2 border-[var(--color-background)] bg-[var(--color-foreground)] text-[var(--color-background)] shadow-[4px_4px_0_0_var(--color-primary)] animate-spin-slow">
              <VinylRecord className="h-10 w-10" weight="fill" />
            </span>

            <div className="sticker-card relative -rotate-2 p-5 sm:p-6 transition-transform duration-500 hover:rotate-0">
              <div className="mb-4 flex items-center justify-between">
                <span className="bg-[var(--color-primary)] px-2 py-0.5 text-[10px] font-black text-[var(--color-primary-foreground)]">
                  GIFT • 00:34
                </span>
                <span className="font-counter text-[10px] tracking-widest text-[var(--color-accent)]/70">SIDE A</span>
              </div>

              <p className="font-counter text-[10px] uppercase tracking-[0.25em] text-[var(--color-muted-foreground)]">گرفته شده برای</p>
              <p className="font-display mt-1 text-3xl text-[var(--color-accent)]">سارا</p>

              {/* Equalizer */}
              <div aria-hidden className="mt-5 flex items-end gap-1.5 h-16">
                {[1, 0.55, 0.85, 0.35, 1, 0.65, 0.45, 0.9, 0.3, 0.7, 0.55, 1, 0.6, 0.85].map((h, i) => (
                  <span
                    key={i}
                    className="eq-bar"
                    style={{
                      height: `${h * 100}%`,
                      background: i % 2 ? "var(--color-accent)" : "var(--color-primary)",
                      animationDelay: `${i * 90}ms`,
                    }}
                  />
                ))}
              </div>

              {/* Mini player controls */}
              <div className="mt-6 flex items-center gap-3">
                <button
                  aria-label="پخش پیش‌نمایش هدیه"
                  className="tap grid h-12 w-12 place-items-center rounded-full bg-[var(--color-accent)] text-[var(--color-accent-foreground)] shadow-[0_0_24px_var(--color-accent)] animate-neon-pulse"
                >
                  <Play className="h-5 w-5" weight="fill" />
                </button>
                <div className="flex-1">
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-[var(--color-primary)]/20">
                    <div className="h-full w-1/3 bg-gradient-to-l from-[var(--color-accent)] to-[var(--color-primary)]" />
                  </div>
                  <p className="mt-1.5 font-counter text-[10px] text-[var(--color-muted-foreground)]">Pop · Cloned · 00:11 / 00:34</p>
                </div>
              </div>
            </div>

            <div aria-hidden className="sticker-card-lime absolute -bottom-6 -right-4 -z-0 hidden h-24 w-28 rotate-3 sm:block" />
          </div>
        </div>
      </section>

      {/* HOW */}
      <section id="how" className="container relative scroll-mt-12 pb-20">
        <div className="mb-10 flex items-center justify-center gap-3 lg:justify-start">
          <span aria-hidden className="thread-divider w-10" />
          <h2 className="font-counter text-xs uppercase tracking-[0.35em] text-[var(--color-accent)]">HOW IT WORKS · سه قدم</h2>
          <span aria-hidden className="thread-divider w-10" />
        </div>

        <div className="mx-auto grid max-w-5xl gap-7 sm:grid-cols-2 lg:grid-cols-3">
          {steps.map((s, i) => {
            const tilt = i % 2 === 0 ? "sm:-rotate-1" : "sm:rotate-1";
            const alt = i % 2 === 1;
            return (
              <div
                key={s.title}
                className={`${alt ? "sticker-card-lime" : "sticker-card"} group ${tilt} p-6 transition hover:rotate-0 hover:-translate-y-1`}
              >
                <div className="flex items-start justify-between">
                  <span aria-hidden className="grid h-12 w-12 place-items-center border-2 border-[var(--color-primary-foreground)] bg-[var(--color-accent)] text-[var(--color-accent-foreground)]">
                    <s.icon className="h-6 w-6" weight="fill" />
                  </span>
                  <span aria-hidden className="font-display text-3xl text-[var(--color-primary)]/60">{s.counter}</span>
                </div>
                <h3 className="mt-5 font-black text-[var(--color-foreground)]">{s.title}</h3>
                <p className="mt-2 text-sm leading-7 text-[var(--color-muted-foreground)]">{s.body}</p>
                <div className="mt-5 flex items-center justify-between border-t-2 border-dashed border-[var(--color-accent)]/30 pt-4 text-xs">
                  <span className="font-counter text-[var(--color-accent)]">{s.time}</span>
                  <span className="text-[var(--color-muted-foreground)]">رایگان</span>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-12 text-center">
          <Link
            to="/create"
            className="neon-cta neon-cta-hover inline-flex h-14 items-center justify-center gap-2 px-10 text-base active:translate-y-0.5"
          >
            بزن بریم بسازیم
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <p className="mt-4 text-xs text-[var(--color-muted-foreground)]">بدون ثبت‌نام · کمتر از ۲ دقیقه</p>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t-2 border-dashed border-[var(--color-primary)]/20 py-8 text-center">
        <div className="container flex flex-col items-center gap-3 sm:flex-row sm:justify-between">
          <p className="font-counter text-[11px] uppercase tracking-[0.3em] text-[var(--color-accent)]/60">SONGAI SYSTEMS · 2026</p>
          <p className="flex items-center justify-center gap-3 text-xs text-[var(--color-muted-foreground)]">
            <Link to="/privacy" className="hover:text-[var(--color-accent)]">حریم خصوصی</Link>
            <span aria-hidden className="h-1 w-1 rounded-full bg-[var(--color-primary)]/40" />
            <Link to="/terms" className="hover:text-[var(--color-accent)]">شرایط استفاده</Link>
          </p>
        </div>
      </footer>
    </main>
  );
}

function Stat({ n, label }: { n: string; label: string }) {
  return (
    <div className="flex items-baseline gap-2">
      <span className="font-display text-lg text-[var(--color-accent)]">{n}</span>
      <span>{label}</span>
    </div>
  );
}

export { Waveform };
