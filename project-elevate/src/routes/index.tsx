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
  Sparkle,
  Heart,
  Star,
  Lightning,
  Gift,
  Users,
  Check,
} from "@phosphor-icons/react";
import { Waveform } from "@/components/Waveform";
import { motion } from "framer-motion";

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
  { icon: Microphone, counter: "۰۳", title: "صداش رو بسپار", body: "۳۰ ثانیه ضبط کافیه تا صداش واقعی کلون بشه.", time: "۳۰ ثانیه" },
];

const testimonials = [
  {
    name: "سارا م.",
    role: "برای تولد شوهرم",
    text: "وقتی دیدم ویدیو رو با صدای خودش آهنگ می‌خونه، اشکم در اومد. واقعاً بی‌نظیر بود.",
    stars: 5,
    avatar: "S",
  },
  {
    name: "علی ر.",
    role: "سالگرد ازدواج",
    text: "هدیه‌ای که هیچ‌وقت فراموش نمی‌شه. تمام دوستام پرسیدن کجا ساختی.",
    stars: 5,
    avatar: "ع",
  },
  {
    name: "نگار ک.",
    role: "قدردانی از مادرم",
    text: "مامانم گریه کرد. گفت هیچ‌وقت انقدر خاص احساس نکرده بود.",
    stars: 5,
    avatar: "ن",
  },
];

const features = [
  { icon: Microphone, title: "صدای کلون‌شده", body: "با ۳۰ ثانیه صدا، یه کلون واقعی می‌سازیم که آهنگ رو با صدای خودش می‌خونه." },
  { icon: MusicNotes, title: "ملودی اختصاصی", body: "هر آهنگ با هوش مصنوعی برای همین یک نفر ساخته می‌شه — نه قالب‌های آماده." },
  { icon: ImageIcon, title: "ویدیوی زنده", body: "عکسی که گذاشتی، توی ویدیو می‌خونه و حرکت می‌کنه — با لب‌سینک واقعی." },
  { icon: Gift, title: "هدیه‌ای کامل", body: "ویدیو، آهنگ و متن ترانه — همه در یک لینک برای ارسال." },
];

const EQ_HEIGHTS = [1, 0.55, 0.85, 0.35, 1, 0.65, 0.45, 0.9, 0.3, 0.7, 0.55, 1, 0.6, 0.85];

function FloatingParticles() {
  const particles = Array.from({ length: 12 }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    y: Math.random() * 100,
    size: 2 + Math.random() * 4,
    delay: Math.random() * 4,
    duration: 4 + Math.random() * 6,
  }));
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      {particles.map((p) => (
        <motion.div
          key={p.id}
          className="absolute rounded-full bg-[var(--color-accent)]"
          style={{ left: `${p.x}%`, top: `${p.y}%`, width: p.size, height: p.size, opacity: 0.3 }}
          animate={{ y: [-12, 12, -12], opacity: [0.2, 0.6, 0.2] }}
          transition={{ duration: p.duration, delay: p.delay, repeat: Infinity, ease: "easeInOut" }}
        />
      ))}
    </div>
  );
}

function HomePage() {
  return (
    <main id="main" className="relative overflow-hidden">
      {/* Ambient glows */}
      <div aria-hidden className="pointer-events-none absolute -top-32 right-1/4 h-96 w-96 rounded-full bg-[var(--color-primary)]/20 blur-[140px]" />
      <div aria-hidden className="pointer-events-none absolute top-1/3 left-0 h-80 w-80 rounded-full bg-[var(--color-accent)]/10 blur-[120px]" />
      <div aria-hidden className="pointer-events-none absolute bottom-0 right-0 h-64 w-64 rounded-full bg-[var(--color-primary)]/15 blur-[100px]" />

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

      {/* HERO */}
      <section className="container relative pt-12 pb-16 sm:pt-20 sm:pb-28">
        <FloatingParticles />

        <div aria-hidden className="pointer-events-none absolute inset-x-0 top-1/2 -translate-y-1/2 opacity-20">
          <Waveform height={260} bars={80} progress={1} energy={1.2} />
        </div>

        <div className="relative mx-auto grid max-w-6xl items-center gap-12 lg:grid-cols-[1.15fr_1fr]">
          <div className="relative text-center lg:text-right">
            <h2
              aria-hidden
              className="font-display pointer-events-none absolute -top-10 -right-4 select-none text-[110px] leading-none tracking-tighter text-[var(--color-primary)]/8 sm:text-[160px] lg:text-[200px]"
            >
              SONGAI
            </h2>

            <div className="relative z-10">
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
              >
                <div className="mb-4 inline-flex items-center gap-2 border border-[var(--color-accent)]/30 bg-[var(--color-accent)]/10 px-3 py-1.5 text-xs font-bold text-[var(--color-accent)]">
                  <Lightning className="h-3 w-3" weight="fill" />
                  هدیه‌ای که واقعاً فراموش نمی‌شه
                </div>
              </motion.div>

              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.1 }}
                className="text-balance font-black leading-[1.1]"
              >
                هدیه‌ای از جنس
                <br />
                <span className="text-aurora">موسیقیِ تو</span>
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="mx-auto mt-5 max-w-md text-balance leading-8 text-[var(--color-muted-foreground)] lg:mx-0"
              >
                اولین سرویس تولید موزیک اختصاصی با صدای واقعی کسی که دوستش داری —
                ترانه‌ای شخصی، ویدیوی گویا و یک هدیه‌ای که هیچ‌چیزی مثلش نیست.
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.3 }}
                className="mt-8 flex flex-col items-center gap-4 sm:flex-row lg:justify-start"
              >
                <Link
                  to="/create"
                  className="neon-cta neon-cta-hover inline-flex h-14 items-center justify-center gap-2 px-9 text-base active:translate-y-0.5"
                >
                  <PaperPlaneTilt className="h-5 w-5" weight="fill" />
                  ساخت آهنگ رایگان
                </Link>

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
              </motion.div>

              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.8, delay: 0.5 }}
                className="mt-10 flex flex-wrap items-center justify-center gap-6 text-xs text-[var(--color-muted-foreground)] lg:justify-start"
              >
                <Stat n="۳۰s" label="فقط با ۳۰ ثانیه صدا" />
                <span aria-hidden className="h-4 w-px bg-[var(--color-primary)]/30" />
                <Stat n="۱x" label="منحصراً برای یک نفر" />
                <span aria-hidden className="h-4 w-px bg-[var(--color-primary)]/30" />
                <Stat n="HD" label="ویدیوی واقعی" />
                <span aria-hidden className="h-4 w-px bg-[var(--color-primary)]/30" />
                <Stat n="رایگان" label="بدون ثبت‌نام" />
              </motion.div>
            </div>
          </div>

          {/* Preview card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.92, rotate: -3 }}
            animate={{ opacity: 1, scale: 1, rotate: -2 }}
            transition={{ duration: 0.7, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="relative mx-auto w-full max-w-sm"
          >
            <span aria-hidden className="absolute -top-8 -right-6 z-30 grid h-20 w-20 place-items-center rounded-full border-2 border-[var(--color-background)] bg-[var(--color-foreground)] text-[var(--color-background)] shadow-[4px_4px_0_0_var(--color-primary)] animate-spin-slow">
              <VinylRecord className="h-10 w-10" weight="fill" />
            </span>

            <div className="sticker-card relative p-5 sm:p-6 hover:rotate-0 transition-transform duration-500">
              <div className="mb-4 flex items-center justify-between">
                <span className="bg-[var(--color-primary)] px-2 py-0.5 text-[10px] font-black text-[var(--color-primary-foreground)]">
                  GIFT • 00:34
                </span>
                <span className="font-counter text-[10px] tracking-widest text-[var(--color-accent)]/70">SIDE A</span>
              </div>

              <p className="font-counter text-[10px] uppercase tracking-[0.25em] text-[var(--color-muted-foreground)]">گرفته شده برای</p>
              <p className="font-display mt-1 text-3xl text-[var(--color-accent)]">سارا</p>

              <div aria-hidden className="mt-5 flex items-end gap-1.5 h-16">
                {EQ_HEIGHTS.map((h, i) => (
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

              <div className="mt-4 flex items-center gap-2 text-[11px] text-[var(--color-muted-foreground)]">
                <Check className="h-3 w-3 text-[var(--color-accent)]" weight="bold" />
                صدای کلون‌شده · ملودی اختصاصی · ویدیوی زنده
              </div>

              <div className="mt-5 flex items-center gap-3">
                <button
                  aria-label="پخش پیش‌نمایش"
                  className="tap grid h-12 w-12 place-items-center rounded-full bg-[var(--color-accent)] text-[var(--color-accent-foreground)] shadow-[0_0_24px_var(--color-accent)] animate-neon-pulse"
                >
                  <Play className="h-5 w-5" weight="fill" />
                </button>
                <div className="flex-1">
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-[var(--color-primary)]/20">
                    <div className="h-full w-1/3 bg-gradient-to-l from-[var(--color-accent)] to-[var(--color-primary)]" />
                  </div>
                  <p className="mt-1.5 font-counter text-[10px] text-[var(--color-muted-foreground)]">Pop · کلون‌شده · 00:11 / 00:34</p>
                </div>
              </div>
            </div>

            <div aria-hidden className="sticker-card-lime absolute -bottom-6 -right-4 -z-0 hidden h-24 w-28 rotate-3 sm:block" />
          </motion.div>
        </div>
      </section>

      {/* FEATURES */}
      <section className="container relative pb-20">
        <div className="mb-10 flex items-center justify-center gap-3">
          <span aria-hidden className="thread-divider w-10" />
          <h2 className="font-counter text-xs uppercase tracking-[0.35em] text-[var(--color-accent)]">WHAT YOU GET · چی می‌سازیم</h2>
          <span aria-hidden className="thread-divider w-10" />
        </div>

        <div className="mx-auto grid max-w-5xl gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.1 }}
              className="glass group p-5 hover:-translate-y-1 transition-transform duration-300"
            >
              <div className="mb-3 grid h-10 w-10 place-items-center border-2 border-[var(--color-primary)] bg-[var(--color-primary)]/10 text-[var(--color-primary)]">
                <f.icon className="h-5 w-5" weight="fill" />
              </div>
              <h3 className="font-black text-[var(--color-foreground)]">{f.title}</h3>
              <p className="mt-2 text-sm leading-7 text-[var(--color-muted-foreground)]">{f.body}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section id="how" className="container relative scroll-mt-12 pb-20">
        <div className="mb-10 flex items-center justify-center gap-3">
          <span aria-hidden className="thread-divider w-10" />
          <h2 className="font-counter text-xs uppercase tracking-[0.35em] text-[var(--color-accent)]">HOW IT WORKS · سه قدم</h2>
          <span aria-hidden className="thread-divider w-10" />
        </div>

        <div className="mx-auto grid max-w-5xl gap-7 sm:grid-cols-2 lg:grid-cols-3">
          {steps.map((s, i) => {
            const tilt = i % 2 === 0 ? "sm:-rotate-1" : "sm:rotate-1";
            const alt = i % 2 === 1;
            return (
              <motion.div
                key={s.title}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.15 }}
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
              </motion.div>
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

      {/* TESTIMONIALS */}
      <section className="container relative pb-24">
        <div className="mb-10 flex items-center justify-center gap-3">
          <span aria-hidden className="thread-divider w-10" />
          <h2 className="font-counter text-xs uppercase tracking-[0.35em] text-[var(--color-accent)]">STORIES · نظر کسایی که ساختن</h2>
          <span aria-hidden className="thread-divider w-10" />
        </div>

        <div className="mx-auto grid max-w-5xl gap-6 sm:grid-cols-3">
          {testimonials.map((t, i) => (
            <motion.div
              key={t.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.45, delay: i * 0.12 }}
              className="glass group p-6 hover:-translate-y-1 transition-transform duration-300"
            >
              <div className="flex gap-1 mb-4">
                {Array.from({ length: t.stars }).map((_, j) => (
                  <Star key={j} className="h-4 w-4 text-[var(--color-accent)]" weight="fill" />
                ))}
              </div>
              <p className="text-sm leading-7 text-[var(--color-foreground)]">«{t.text}»</p>
              <div className="mt-5 flex items-center gap-3 border-t border-[var(--color-primary)]/20 pt-4">
                <span className="grid h-9 w-9 place-items-center rounded-full bg-[var(--color-primary)] text-sm font-black text-[var(--color-primary-foreground)]">
                  {t.avatar}
                </span>
                <div>
                  <p className="text-sm font-bold text-[var(--color-foreground)]">{t.name}</p>
                  <p className="text-xs text-[var(--color-muted-foreground)]">{t.role}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* CTA BAND */}
      <section className="relative mb-20 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-[var(--color-primary)]/20 via-[var(--color-accent)]/10 to-[var(--color-primary)]/20" />
        <div className="container relative flex flex-col items-center gap-6 py-14 text-center sm:flex-row sm:justify-between sm:text-right">
          <div>
            <h2 className="font-display text-3xl sm:text-4xl">
              آماده‌ای یه هدیهٔ
              <span className="text-aurora"> فراموش‌نشدنی </span>
              بسازی؟
            </h2>
            <p className="mt-2 text-sm text-[var(--color-muted-foreground)]">
              همین الان، کمتر از دو دقیقه، رایگان.
            </p>
          </div>
          <div className="flex flex-col items-center gap-3 sm:items-end">
            <Link
              to="/create"
              className="neon-cta neon-cta-hover inline-flex h-14 min-w-[200px] items-center justify-center gap-2 px-8 text-base active:translate-y-0.5"
            >
              <Sparkle className="h-5 w-5" weight="fill" />
              شروع رایگان
            </Link>
            <div className="flex items-center gap-2 text-xs text-[var(--color-muted-foreground)]">
              <Users className="h-3.5 w-3.5" />
              هزاران هدیه ساخته شده
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t-2 border-dashed border-[var(--color-primary)]/20 py-8">
        <div className="container flex flex-col items-center gap-4 sm:flex-row sm:justify-between">
          <div className="flex items-center gap-3">
            <span aria-hidden className="grid h-8 w-8 place-items-center border-2 border-[var(--color-accent)] bg-[var(--color-primary)] text-[var(--color-primary-foreground)] shadow-[3px_3px_0_0_var(--color-accent)]">
              <MusicNotes className="h-4 w-4" weight="fill" />
            </span>
            <p className="font-counter text-[11px] uppercase tracking-[0.3em] text-[var(--color-accent)]/60">SONGAI SYSTEMS · 2026</p>
          </div>
          <p className="flex items-center justify-center gap-3 text-xs text-[var(--color-muted-foreground)]">
            <Link to="/privacy" className="hover:text-[var(--color-accent)] transition-colors">حریم خصوصی</Link>
            <span aria-hidden className="h-1 w-1 rounded-full bg-[var(--color-primary)]/40" />
            <Link to="/terms" className="hover:text-[var(--color-accent)] transition-colors">شرایط استفاده</Link>
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
